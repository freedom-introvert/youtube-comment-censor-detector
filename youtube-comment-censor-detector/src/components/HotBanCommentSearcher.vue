<template>
  <div class="hot-ban-comment-searcher">
    <el-empty description="请在有评论区（视频、帖子）的页面使用此功能" class="not-comment-section" v-if="showNcs" />
    <div class="warning" v-if="showWarning">
      <svg t="1756953289758" class="warn-icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"
        p-id="4518" width="64" height="64">
        <path
          d="M1001.661867 796.544c48.896 84.906667 7.68 157.013333-87.552 157.013333H110.781867c-97.834667 0-139.050667-69.504-90.112-157.013333l401.664-666.88c48.896-87.552 128.725333-87.552 177.664 0l401.664 666.88zM479.165867 296.533333v341.333334a32 32 0 1 0 64 0v-341.333334a32 32 0 1 0-64 0z m0 469.333334v42.666666a32 32 0 1 0 64 0v-42.666666a32 32 0 1 0-64 0z"
          fill="#FAAD14" p-id="4519"></path>
      </svg>
      <h2 class="warning-title">警告</h2>
      <p class="warning-text">将会获取所有热门评论，之后懒加载按时间评论<br>
        评论区数量过多（例如超过 5000 条），获取热门评论的过程将非常漫长，且过多的API调用可能导致不可预料的后果，请酌情使用！
      </p>
      <el-divider class="warning-divider"></el-divider>
      <el-button type="primary" @click="onSearch">搜索</el-button>
    </div>
    <div class="search-progress" v-if="showSearchProgress">
      <p>{{ progressMsg }}</p>
      <el-progress :percentage="50" :indeterminate="true" :show-text="false" />
    </div>
    <el-scrollbar class="search-results" v-if="showResults">
      <div v-infinite-scroll="next" :infinite-scroll-distance="500">
        <you-tube-comment v-for="comment in comments" :key="comment.commentId" :comment="comment"></you-tube-comment>
        <div class="footer">
          <el-progress :percentage="50" :indeterminate="true" :show-text="false" :status="progStatus" v-if="loading"
            :duration="1" />
          <span v-if="!hasNext">- PAGE END -</span>
        </div>
      </div>
    </el-scrollbar>
  </div>
</template>

<script setup>
import { reactive, ref, inject, onUnmounted } from 'vue';
import { createUrl } from '../util';
import { createVideoRootCommentListContinuation, createPostRootCommentListContinuation, findNextContinuation } from '../api-uitls';
import YouTubeComment from './YouTubeComment.vue';

const originalFetch = inject("originalFetch");
const getAuthorization = inject("getAuthorization");
const getContext = inject("getContext");

const showNcs = ref(true);
const showWarning = ref(false);
const showSearchProgress = ref(false);
const showResults = ref(false);
const progressMsg = ref("加载中...");
const comments = reactive([]);

const hasNext = ref(true);
const loading = ref(false);
const progStatus = ref("")
let nextContinuation;
let cancelled = false;


let hotCommentIdSet = new Set();

let url = createUrl();
let api;
let channelId;

let TYPE = null;

if (url.searchParams.has("v")) {
  TYPE = "WEB_PAGE_TYPE_WATCH";
  api = "https://www.youtube.com/youtubei/v1/next?prettyPrint=false";
} else if (url.pathname.split("/").includes("post")) {
  TYPE = "WEB_PAGE_TYPE_BROWSE";
  api = "https://www.youtube.com/youtubei/v1/browse?prettyPrint=false";
}

if (TYPE) {
  showNcs.value = false;
  showWarning.value = true;
}

async function onSearch() {
  showWarning.value = false;
  showSearchProgress.value = true;

  let continuation = null;
  if (TYPE === "WEB_PAGE_TYPE_WATCH") {
    continuation = createVideoRootCommentListContinuation(null, url.searchParams.get("v"), false);
    nextContinuation = createVideoRootCommentListContinuation(null, url.searchParams.get("v"), true);
  } else if (TYPE === "WEB_PAGE_TYPE_BROWSE") {
    //貌似这个参数只有粘贴链接直接进来才有，从YouTube别处点进来不行，但好使的也只有这个方法
    channelId = ytInitialData.metadata?.channelMetadataRenderer?.externalId;
    if (!channelId) {
      progressMsg.value = "无法获取频道ID，请尝试刷新页面后重试！";
    }
    continuation = createPostRootCommentListContinuation(channelId, url.pathname.split("/")[2], false)
    nextContinuation = createPostRootCommentListContinuation(channelId, url.pathname.split("/")[2], true)
  }

  let count = 0;

  while (continuation) {
    let data = {
      context: getContext(),
      continuation
    }

    let options = {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        //因为我搜索的是别人的热门屏蔽评论，所以带上认证信息也没啥（还能减轻风控？）
        authorization: getAuthorization()
      }
    };

    if (cancelled) {
      return;
    }

    let response;
    try {
      response = await (await originalFetch(api, options)).json();
    } catch (err) {
      progressMsg.value = '获取热门列表失败，您可以关闭后重试！';
      return;
    }

    let mutations = response.frameworkUpdates.entityBatchUpdate.mutations;
    for (let mutation of mutations) {
      if (mutation.payload.commentEntityPayload) {
        hotCommentIdSet.add(mutation.payload.commentEntityPayload.properties.commentId);
        count++;
        progressMsg.value = `正在获取热门评论（已获取 ${count} 个）……`
      }
    }

    continuation = findNextContinuation(response);
  }
  next();
}

async function next() {
  if (!hasNext.value || loading.value || cancelled) {
    return;
  }
  loading.value = true;
  showSearchProgress.value = false;
  showResults.value = true;
  let count = 0;

  while (count < 20) {
    let data = {
      context: getContext(),
      continuation: nextContinuation
    }

    let options = {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        authorization: getAuthorization()
      }
    };

    if (cancelled) {
      return;
    }

    let response;
    try {
      response = await (await originalFetch(api, options)).json();
    } catch (err) {
      progStatus.value = "exception"
      return;
    }

    nextContinuation = null;
    for (const endpoint of response.onResponseReceivedEndpoints) {
      const items = endpoint.appendContinuationItemsAction?.continuationItems
        || endpoint.reloadContinuationItemsCommand?.continuationItems;

      if (!items) continue;

      for (const item of items) {
        const token = item.continuationItemRenderer?.continuationEndpoint?.continuationCommand?.token;
        if (token) {
          nextContinuation = token;
          break;
        }
      }

      if (nextContinuation) break;
    }

    let mutations = response.frameworkUpdates.entityBatchUpdate.mutations;
    /* 
    或许可以组合起来叠个数组？
    debugger
    let map = {};
    for (let mu of mutations) {
      let payload = mu.payload;
      for (let key in payload) {
        if (!map[key]) {
          map[key] = [];
        }
        map[key].push(payload[key])
      }
    }
    console.log(map) 
    */
    for (let i = 0; i < mutations.length; i++) {
      let mutation = mutations[i];

      if (mutation.payload.commentEntityPayload) {
        let entity = mutation.payload.commentEntityPayload;
        let commentId = entity.properties.commentId;
        if (!hotCommentIdSet.has(commentId)) {
          let likeCount = parseInt(entity.toolbar.likeCountNotliked);
          likeCount = likeCount ? likeCount : 0;
          let replyCount = parseInt(entity.toolbar.replyCount);
          replyCount = replyCount ? replyCount : 0;
          let url = mutations[i + 1].payload
            .commentSurfaceEntityPayload
            .publishedTimeCommand
            .innertubeCommand
            .commandMetadata
            .webCommandMetadata
            .url;

          count++;
          comments.push({
            commentId,
            url,
            userDisplayName: entity.author.displayName,
            userProfileImageUrl: entity.avatar.image.sources[0].url,
            likeCount,
            replyCount,
            publishedTime: entity.properties.publishedTime,
            contentText: entity.properties.content.content,
          })
        }
      }
    }

    if (!nextContinuation) {
      hasNext.value = false;
      break;
    }
  }
  loading.value = false;
}

onUnmounted(() => {
  cancelled = true;
});

</script>

<style scoped>
.hot-ban-comment-searcher {
  height: 100%;
}

.not-comment-section {
  height: 100%;
}

.warning {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.search-progress {
  display: flex;
  height: 100%;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 15px;
}

.warning-title {
  margin-bottom: 4px;
}

.warning-text {
  text-align: center;
  max-width: 500px;
}

.warning-divider {
  max-width: 800px;
}

.el-progress {
  width: 300px;
}

.footer {
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>