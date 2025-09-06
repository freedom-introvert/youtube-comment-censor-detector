<template>
  <el-table :data="comments" row-key="commentId" height="100%" class="comment-list">
    <el-table-column prop="content" label="评论内容" align="left" show-overflow-tooltip />
    <el-table-column prop="state" label="当前状态" align="center" width="136" :formatter="formatStateDesc" />
    <el-table-column prop="recordedTime" label="记录时间" align="center" width="160"
      :formatter="comment => formatTimestamp(comment.recordedTime)" />
    <el-table-column prop="area" label="所在评论区" align="center" width="240">
      <template #default="{ row }">
        <div>
          <el-link type="primary" :href="row.url" class="locate-link"
            :class="{ 'post-locate-link': row.webPageType == 'WEB_PAGE_TYPE_BROWSE' }">{{ formatCommentArea(row, true)
            }}</el-link>
        </div>
      </template>
    </el-table-column>
    <el-table-column type="expand">
      <template #default="{ row }">
        <div class="detail">
          <table class="info-table">
            <tbody>
              <tr>
                <td>评论内容</td>
                <td class="comment-content">{{ row.content }}</td>
              </tr>
              <tr>
                <td>当前状态</td>
                <td>{{ translateState(row.currentState) }}</td>
              </tr>
              <tr v-if="row.currentState == 'DELETED'">
                <td>用户删除</td>
                <td>{{ row.isUserDelete ? "是" : "否" }}</td>
              </tr>
              <tr>
                <td>热门屏蔽</td>
                <td>{{ formatHotBan(row.hotBan) }}</td>
              </tr>
              <tr>
                <td>发送者</td>
                <td>{{ row.displayName }}</td>
              </tr>
              <tr>
                <td>评论ID</td>
                <td>{{ row.commentId }}</td>
              </tr>
              <template v-if="row.webPageType == 'WEB_PAGE_TYPE_WATCH'">
                <tr>
                  <td>评论区类型</td>
                  <td>视频</td>
                </tr>
                <tr>
                  <td>视频ID</td>
                  <td>{{ row.commentAreaInfo.videoId }}</td>
                </tr>
              </template>
              <template v-else-if="row.webPageType == 'WEB_PAGE_TYPE_BROWSE'">
                <tr>
                  <td>评论区类型</td>
                  <td>帖子</td>
                </tr>
                <tr>
                  <td>帖子所属频道ID</td>
                  <td>{{ row.commentAreaInfo.channelId }}</td>
                </tr>
                <tr>
                  <td>帖子ID</td>
                  <td>{{ row.commentAreaInfo.postId }}</td>
                </tr>
              </template>
              <tr>
                <td>点赞数</td>
                <td>{{ row.likeCount }}</td>
              </tr>
              <!-- 是根评论才显示回复数 -->
              <tr v-if="row.commentId.indexOf('.') == -1">
                <td>回复数</td>
                <td>{{ row.replyCount }}</td>
              </tr>
              <tr>
                <td>记录时间</td>
                <td>{{ formatTimestamp(row.recordedTime) }}</td>
              </tr>
              <tr>
                <td>更新时间</td>
                <td>{{ formatTimestamp(row.updatedTime) }}</td>
              </tr>
            </tbody>
          </table>
          <details>
            <summary>历史检查记录</summary>
            <el-table :data="row.histories" style="width: 100%">
              <el-table-column prop="time" label="时间戳" width="160"
                :formatter="history => formatTimestamp(history.time)" />
              <el-table-column prop="state" label="状态" width="136"
                :formatter="history => translateState(history.state)" />
              <el-table-column prop="hotBan" label="热门屏蔽" width="120"
                :formatter="history => formatHotBan(history.hotBan)" />
              <el-table-column prop="content" label="评论内容" show-overflow-tooltip />
              <el-table-column type="expand">
                <template #default="{ row }">
                  <div class="comment-content">
                    {{ row.content }}
                  </div>
                </template>
              </el-table-column>
            </el-table>
          </details>
          <CommentActions :comment="row" @delete="deleteCommentItem(row)">
          </CommentActions>
        </div>
      </template>
    </el-table-column>
  </el-table>
  <div class="pagination">
    <el-button v-if="prevTime" @click="loadComments('prev')" :disabled="loadingComments">&lt; {{ prevTime == -1 ? "NOW"
      :
      formatTimestamp(prevTime)
    }}</el-button>
    <el-button v-if="nextTime" @click="loadComments('next')" :disabled="loadingComments">{{ formatTimestamp(nextTime) }}
      &gt;</el-button>
  </div>
</template>

<script setup>
import { ref, inject, reactive } from 'vue';
import { formatTimestamp, translateState } from '../util'
import { ElMessage } from 'element-plus'
import CommentActions from './CommentActions.vue';

const deleteComment = inject("deleteComment")
const db = inject("db");

const comments = reactive([]);
const loadingComments = ref(false);
const prevTime = ref(null);
const nextTime = ref(null);
const pageSize = 20;

var prevStack = [null];

function loadComments(direction = 'next') {
  loadingComments.value = true;
  comments.length = 0;
  let time = null;
  if (direction == 'next') {
    time = nextTime.value;
    prevStack.push(time ? time : -1);
    prevTime.value = prevStack[prevStack.length - 2];
  } else if (direction == 'prev') {
    time = prevStack[prevStack.length - 2];
    time = (time == -1 ? null : time);
    prevStack.pop();
    prevTime.value = prevStack[prevStack.length - 2];
  }

  db.transaction("comments")
    .objectStore("comments")
    .index("recordedTime")
    .openCursor(time ? IDBKeyRange.upperBound(time) : null, "prev")
    .onsuccess = event => {
      var cursor = event.target.result;
      if (cursor) {
        if (comments.length < pageSize) {
          comments.push(cursor.value);
          cursor.continue();
        } else {
          nextTime.value = cursor.value.recordedTime;
          loadingComments.value = false;
        }
      } else {
        nextTime.value = null;
        loadingComments.value = false;
      }
    }
}


function getCommentCount() {
  return new Promise((resolve, reject) => {
    let req = db.transaction("comments")
      .objectStore("comments")
      .count();

    req.onsuccess = event => {
      resolve(req.result);
    }

    req.onerror = reject;
  })
}

loadComments();

function formatStateDesc(comment) {
  switch (comment.currentState) {
    case "NORMAL":
      if (comment.hotBan === true) {
        return "热门屏蔽";
      } else if (comment.hotBan === false) {
        return "完全正常";
      } else {
        return "正常";
      }
    case "DELETED":
      if (comment.isUserDelete) {
        return "用户删除";
      } else {
        return "已删除";
      }

    case "SHADOW_BAN":
      return "仅自己可见";
    case "NOT_CHECK":
      return "还未检查"
  }
}

function formatCommentArea(comment, needEmojiHead) {
  var commentAreaInfo = comment.commentAreaInfo;
  switch (comment.webPageType) {
    case "WEB_PAGE_TYPE_WATCH":
      return (needEmojiHead ? "📺 " : "") + commentAreaInfo.videoId;
    case "WEB_PAGE_TYPE_BROWSE":
      return (needEmojiHead ? "📰" : "") + commentAreaInfo.postId;
  }
}

function formatHotBan(hotBan) {
  if (hotBan == null) {
    return "未检查"
  }
  return hotBan ? "是" : "否";
}

function deleteCommentItem(comment) {
  deleteComment(comment.commentId)
    .then(() => {
      const index = comments.findIndex(item => item.commentId == comment.commentId);
      if (index !== -1) {
        comments.splice(index, 1);
        ElMessage.success("评论删除成功")
      }
    })
    .catch((err) => {
      ElMessage.error("评论删除失败");
      console.error("delete comment from database failed", err);
    })
}

</script>

<style scoped>
.pagination {
  margin-top: 6px;
}

.detail {
  margin-left: 10px;
}

.info-table td:nth-child(1) {
  white-space: nowrap;
  vertical-align: top;
}

.info-table td:nth-child(2) {
  padding-left: 16px;
}

.comment-content {
  white-space: break-spaces;
}

summary {
  cursor: pointer;
  margin-top: 2px;
  user-select: none;
}

.locate-link {
  width: 100%;
}

:deep(.locate-link > span) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.post-locate-link {
  font-size: 10px;
}
</style>
