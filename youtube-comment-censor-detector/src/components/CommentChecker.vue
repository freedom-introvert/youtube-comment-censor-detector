<template>
  <div class="comment-checker" v-bind:class="stateClass">
    <div class="title">{{ title }}</div>
    <div class="message">{{ message }}</div>
    <el-progress :percentage="percentage" striped :format="format" :striped-flow="stripedFlow" />
    <div class="buttons">
      <span @click="onButtonClick">{{ buttonText }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, inject, computed } from "vue";
import { formatSecondsToMMSS, sleep } from '../util';

const check = inject("check");
const commentRecord = inject("commentRecord");
const onComplete = inject("onComplete");
const interval = inject("interval");

const stateClass = ref('not-check');
const title = ref("等待检查中……");
const message = ref("");
const buttonText = ref("取消");//取消 确认此状态 关闭 

let checked = false;
let completed = false;
let netErr = false;

const stripedFlow = ref(false);
const currentTimeSec = ref(0);
const maxTimeSec = 120;
const percentage = computed(() => {
  if (currentTimeSec.value < 0 || currentTimeSec.value > maxTimeSec) {
    return 100;
  } else {
    return currentTimeSec.value / maxTimeSec * 100;
  }
})

function format() {
  if (currentTimeSec.value < 0) {
    return `--:-- / ${formatSecondsToMMSS(maxTimeSec)}`
  } else {
    return `${formatSecondsToMMSS(currentTimeSec.value)} / ${formatSecondsToMMSS(maxTimeSec)}`
  }
}

function onButtonClick() {
  if (completed) {
    onComplete(commentRecord);
    return;
  }

  if (checked && !netErr) {
    completed = true;
    message.value = "您已确认当前状态，检查完毕";
    buttonText.value = "关闭";
  } else {
    completed = true;
    onComplete(commentRecord);
  }

}

//评论曾展示过，即曾经正常或仅自己可见
let shown = null;
let startTime = Date.now() / 1000;

async function startCheck() {

  while (currentTimeSec.value < maxTimeSec || netErr) {
    if (!netErr) {
      for (let i = interval; i > 0; i--) {
        message.value = "等待 " + i + "s 后检查评论状态";
        await sleep(1000);
        currentTimeSec.value = Date.now() / 1000 - startTime;
        //如果此时用户取消了检查，等待结束后下面就不要检查了
        if (completed) {
          return;
        }
      }
    } else {
      currentTimeSec.value = Date.now() / 1000 - startTime;
      if (completed) {
        return;
      }
    }

    message.value = "检查评论状态中……";
    stripedFlow.value = true;

    try {
      await check(commentRecord);
    } catch (err) {
      netErr = true;
      title.value = "网络错误，获取当前状态失败";
      buttonText.value = "取消";
      stripedFlow.value = false;
      console.error(err);
      continue;
    }

    netErr = false;

    stripedFlow.value = false;
    if (commentRecord.currentState == "NORMAL") {
      title.value = "当前状态：正常"
      stateClass.value = "normal";
      shown = commentRecord.currentState;
    } else if (commentRecord.currentState == "SHADOW_BAN") {
      title.value = "当前状态：仅自己可见"
      stateClass.value = "shadow-ban";
      shown = commentRecord.currentState;
    } else if (commentRecord.currentState == "DELETED") {
      title.value = "当前状态：已被删除";
      stateClass.value = "deleted";
      if (shown) {
        completed = true;
        message.value = `不用等了，你的评论检查到的状态先从 ${shown == "NORMAL" ? "正常" : "仅自己可见"} 再到删除，系统偷偷删了无疑。如果不信，你可以尝试编辑评论或添加回复来求证`;
        buttonText.value = "关闭";
        return;
      }
    }
    checked = true;
    buttonText.value = "确认此状态";
  }

  completed = true;
  message.value = "观察时间已足够，当前状态可信，检查完毕";
  buttonText.value = "关闭";

}

startCheck();

</script>

<style scoped>
.comment-checker {
  font-size: 12px;
}

.container {
  width: 80%;
  margin: 0 auto;
}

.comment-checker {
  padding: 15px 15px 11px 15px;
  border-radius: 8px;
  transition: background-color 0.3s;
}

.title {
  font-weight: bold;
  margin-bottom: 6px;
}

.message {
  margin-bottom: 10px;
}

.el-progress {
  margin-bottom: 4px;
}

.buttons>* {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  margin-left: -8px;
  color: #4b5e9d;
  border-radius: 4px;
  transition: background-color 0.2s, color 0.2s;
  user-select: none;
}

.buttons>*:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.buttons>*:active {
  background-color: rgba(0, 0, 0, 0.1);
}

.comment-checker.not-check {
  background-color: rgb(0, 0, 255, 0.2);
}

.comment-checker.normal {
  background-color: rgb(0, 255, 0, 0.2);
}

.comment-checker.deleted {
  background-color: rgb(255, 0, 0, 0.2);
}

.comment-checker.shadow-ban {
  background-color: rgb(255, 255, 0, 0.2);
}
</style>