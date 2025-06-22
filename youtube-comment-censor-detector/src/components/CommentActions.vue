<template>
  <div>
    <div class="hot-ban-checker" v-if="showHotBanChecker">
      <div class="title">热门屏蔽检查</div>
      <div class="message">{{ hotBanCheckerMessage }}</div>
      <div class="buttons">
        <span @click="hotBanCheckerController.isCancelled = true">终止检查</span>
      </div>
    </div>
    <div class="actions">
      <el-button type="primary" plain @click="updateState" :loading="updating"
        v-if="comment.isUserDelete == false">更新状态</el-button>
      <el-button type="primary" plain v-if="comment.currentState == 'NORMAL'" @click="toHotBanCheck">热门屏蔽检查</el-button>
      <el-button type="primary" plain @click="copyComment(comment.content)">复制</el-button>
      <el-button type="danger" plain @click="askDelete">删除记录</el-button>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, ref, reactive, inject } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { translateState,formatTimestamp } from '../util';

const props = defineProps(['comment']);
const emit = defineEmits(['delete', 'checkHotBan']);

const comment = props.comment;
const check = inject("check");
const hotBanCheck = inject("hotBanCheck");


const updating = ref(false);
const showHotBanChecker = ref(false);
const hotBanCheckerMessage = ref("等待检查中……")

let hotBanCheckerController = reactive({ isCancelled: false });

function updateState() {
  updating.value = true;
  check(comment)
    .then(() => {
      updating.value = false;
      ElMessage({
        type: comment.currentState == "NORMAL" ? "success" : "warning",
        message: "更新成功，当前状态：" + translateState(comment.currentState)
      })
    }).catch(err => {
      updating.value = false;
      let msg = err.message;
      if (msg == "COMMENT_AREA_CLOSED") {
        msg = "评论区已关闭"
      }
      ElMessage.error("更新失败，因为：" + msg)
    })
}

function copyComment(commentText) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(commentText).then(() => {
      ElMessage({
        message: '评论已复制到剪贴板',
        type: 'success',
      })
    }).catch((err) => {
      ElMessage.error('无法复制文本，因为: ' + err)
    });
  } else {
    // 备用方法：如果 Clipboard API 不可用，使用旧的 document.execCommand()
    const textArea = document.createElement("textarea");
    textArea.value = commentText;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      ElMessage({
        message: '评论已复制到剪贴板',
        type: 'success',
      })
    } catch (err) {
      ElMessage.error('无法复制文本，因为: ' + err)
    }
    document.body.removeChild(textArea);
  }
}

function askDelete() {
  ElMessageBox.confirm("确定要删除这条记录吗（这不会删除你在YouTube上发布的评论）？删除操作无法撤销！")
    .then(() => {
      emit("delete");
    })
    .catch(() => {

    })
}

async function toHotBanCheck() {

  if (Date.now() - comment.recordedTime < 120 * 1000) {
    ElMessage.warning(`当前时间距评论记录时间不足2分钟，状态不可信，请到 ${formatTimestamp(comment.recordedTime + 120 * 1000)} 来检查`);
    return;
  }

  //回复评论通常不会多得夸张且回复评论的热门屏蔽检查及其重要，所以不用确认
  if (comment.commentId.indexOf(".") == -1) {
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

  hotBanCheckerMessage.value = "正在重新检查评论状态……";
  hotBanCheckerController.isCancelled = false;
  showHotBanChecker.value = true;

  try {
    await check(comment);
    if (comment.currentState != "NORMAL") {
      ElMessage.error(`评论状态重新检查后为${translateState(comment.currentState)}，无法继续进行检查`);
      showHotBanChecker.value = false;
      return;
    }
  } catch (err) {
    let msg = err.message;
    if (msg == "COMMENT_AREA_CLOSED") {
      msg = "评论区已关闭"
    }
    ElMessage.error("检查失败，因为" + msg);
    showHotBanChecker.value = false;
    return;
  }

  let observer = {
    onCountChange(c, p) {
      hotBanCheckerMessage.value = `正在搜索热门列表，已搜寻至：第${c}个 第${p}页`;
    }
  }
  let notCancelled;
  try {
    notCancelled = await hotBanCheck(comment, observer, hotBanCheckerController);
  } catch (err) {
    showHotBanChecker.value = false;
    ElMessage.error(err.message);
    return;
  }


  if (notCancelled) {
    if (comment.hotBan) {
      ElMessage.warning("你的评论未在热门列表找到，已被热门屏蔽，检查完成");
    } else {
      ElMessage.success("你的评论已在热门列表找到，没有被热门屏蔽，检查完成");
    }
  }
  showHotBanChecker.value = false;
}

</script>

<style scoped>
.hot-ban-checker {
  background-color: rgba(0, 123, 255, 0.1);
  /* 淡蓝色，适配浅/深模式 */
  border: 1px solid rgba(0, 60, 136, 0.4);
  /* 深蓝色边框，适配性较好 */
  border-radius: 6px;
  padding: 1rem;
  margin: 10px 0;
}

.title {
  font-weight: bold;
  margin-bottom: 6px;
}

.message {
  margin-bottom: 10px;
}

.actions {
  margin-top: 10px;
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
</style>