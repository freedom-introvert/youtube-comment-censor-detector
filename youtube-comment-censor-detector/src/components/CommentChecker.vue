<template>
  <div class="comment-checker" v-bind:class="stateClass">
    <div class="title">{{ title }}</div>
    <div class="message">{{ message }}</div>
    <el-progress :percentage="percentage" striped :format="format" :striped-flow="stripedFlow" />
    <div v-if="showHotBanChecker">
      <div class="title">热门屏蔽检查</div>
      <div class="message">{{ messageByHotCheck }}</div>
    </div>
    <div class="buttons">
      <span v-if="showCancelButton" @click="cancelCheck">取消</span>
      <span v-if="showConfirmButton" @click="confirmCurrentState">确认当前状态</span>
      <span v-if="showCloseButton" @click="close">关闭</span>
      <span v-if="showHotBanCheckButton" @click="checkHotBan">热门屏蔽检查</span>
      <span v-if="showStopHotBanCheckButton" @click="stopHotBanCheck">终止检查</span>
      <span v-if="showLetMeAccessButtton" @click="letMeAccess">让我检查！</span>
    </div>
  </div>
</template>

<script setup>
import { ref, inject, computed } from "vue";
import { formatSecondsToMMSS, sleep } from '../util';
import { ElMessageBox } from "element-plus";

const check = inject("check");
const hotBanCheck = inject("hotBanCheck");
const commentRecord = inject("commentRecord");
//关闭检查器，即移除检查器元素
const onClose = inject("onClose");
//解锁评论，将不在阻止删除和修改。调用条件是点击关闭按钮或最后检查结果是DELETED（用户可以通过修改评论验证是否被删）
const onUnblock = inject("onUnblock")
const interval = inject("interval");

const showCancelButton = ref(true);
const showConfirmButton = ref(false);
const showCloseButton = ref(false);
const showHotBanCheckButton = ref(false);
const showStopHotBanCheckButton = ref(false);
const showLetMeAccessButtton = ref(false);

const showHotBanChecker = ref(false);

const stateClass = ref('not-check');
const title = ref("等待检查中……");
const message = ref("");
const messageByHotCheck = ref("等待检查中……"); 

let completed = false;
let netErr = false;
let hotBanCheckerController = {
  isCancelled: false
};
let skipHotBanCheckWait = false;

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
          onStateCheckComplete();
          return;
        }
      }
    } else {
      currentTimeSec.value = Date.now() / 1000 - startTime;
      if (completed) {
        onStateCheckComplete();
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
      showConfirmButton.value = false;
      showCloseButton.value = true;
      stripedFlow.value = false;
      console.error(err);
      continue;
    }

    netErr = false;
    showCancelButton.value = false;
    showCloseButton.value = false;
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
        message.value = `不用等了，你的评论检查到的状态先从『${shown == "NORMAL" ? "正常" : "仅自己可见"}』再到删除，系统偷偷删了无疑。如果不信，你可以尝试编辑评论或添加回复来求证`;
        onStateCheckComplete();
        return;
      }
    }
    showConfirmButton.value = true;
  }

  onStateCheckComplete();
  completed = true;
  message.value = "观察时间已足够，当前状态可信，检查完毕";
  buttonText.value = "关闭";

}

function onStateCheckComplete() {
  showConfirmButton.value = false;
  showCloseButton.value = true;
  if (commentRecord.currentState == "NORMAL") {
    showHotBanCheckButton.value = true;
  } else if(commentRecord.currentState == "DELETED") {
    onUnblock(commentRecord);
  }
}

startCheck();

function cancelCheck() {
  completed = true;
  onClose(commentRecord);
}

function confirmCurrentState() {
  completed = true;
  message.value = "您已确认当前状态，检查完毕";
}

function close() {
  onClose(commentRecord);
}

async function checkHotBan() {

  //回复评论通常不会多得夸张且回复评论的热门屏蔽检查及其重要，所以不用确认
  if (commentRecord.commentId.indexOf(".") == -1) {
    try {
      await ElMessageBox.confirm("确认检查吗？该检查需要遍历热门评论区，请注意评论区的评论数量（总数大于3000的评论区慎重考虑）！数量太多将导致漫长的检查过程，同时频繁调用API可能会引发不可预料的后果！",
        "警告",
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
        })
    } catch (err) {
      return;
    }
  }

  showCloseButton.value = false;
  showHotBanCheckButton.value = false;
  showHotBanChecker.value = true;
  showStopHotBanCheckButton.value = true;

  while (currentTimeSec.value < maxTimeSec && !hotBanCheckerController.isCancelled) {
    messageByHotCheck.value = `为避免检查误判，检查需要等待至状态可信任时开始，剩余 ${Math.floor(maxTimeSec - currentTimeSec.value)}s`

    //等待了有30秒后可选跳过等待
    if (!skipHotBanCheckWait && currentTimeSec.value > 50) {
      showLetMeAccessButtton.value = true;
    }
    //让我访问！（跳过等待）
    if (skipHotBanCheckWait) {
      break;
    }

    await sleep(1000);
    if (hotBanCheckerController.isCancelled) {
      return;
    }
    currentTimeSec.value = Date.now() / 1000 - startTime;
  }

  showLetMeAccessButtton.value = false;

  messageByHotCheck.value = "正在重新检查评论状态……";
  await check(commentRecord);

  if (commentRecord.currentState != "NORMAL") {
    if (commentRecord.currentState == "SHADOW_BAN") {
      title.value = "当前状态：仅自己可见"
      stateClass.value = "shadow-ban";
      messageByHotCheck.value = "评论已被ShadowBan，热门的屏蔽的检查已取消";
    } else if (commentRecord.currentState == "DELETED") {
      title.value = "当前状态：已被删除";
      stateClass.value = "deleted";
      messageByHotCheck.value = "评论已被删除，热门的屏蔽的检查已取消";
    }
    showStopHotBanCheckButton.value = false;
    showCloseButton.value = true;
    return;
  }

  messageByHotCheck.value = "评论状态正常，准备检查中……";

  //进度观察者
  let observer = {
    onCountChange(c, p) {
      messageByHotCheck.value = `正在搜索热门列表，已搜寻至：第${c}个 第${p}页`;
    },
  }

  //if的用意是，如果返回true即被终止的，就不要显示这个信息了
  if (await hotBanCheck(commentRecord, observer, hotBanCheckerController)) {
    if (commentRecord.hotBan) {
      messageByHotCheck.value = "⚠ 你的评论未在热门列表找到，已被热门屏蔽，检查完成"
    } else {
      messageByHotCheck.value = "✔ 你的评论已在热门列表找到，没有被热门屏蔽，检查完成"
    }
  }
  showStopHotBanCheckButton.value = false;
  showCloseButton.value = true;
}

function stopHotBanCheck() {
  hotBanCheckerController.isCancelled = true;
  messageByHotCheck.value = "你已终止热门屏蔽的检查";
  showStopHotBanCheckButton.value = false;
  showCloseButton.value = true;
}

function letMeAccess() {
  skipHotBanCheckWait = true;
  showLetMeAccessButtton.value = false;
}

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
  margin-right: 10px;
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