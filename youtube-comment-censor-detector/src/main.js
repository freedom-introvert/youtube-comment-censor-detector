import { createApp } from 'vue';
import './style.css';
import CommentChecker from './components/CommentChecker.vue'
import { NextContinuation, BrowserCommentListContinuation, BrowserContinuation } from "./continuation-proto"
import { unsafeWindow } from "$"
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
// 保存原始的 fetch 方法
const originalFetch = unsafeWindow.fetch;

//认证和context信息，这个我不研究怎么去生成了，直接从它的请求里抓然后缓存起来即可
var authorizationCache = null;
var contextCache = null;

function createUrl(path) {
  return new URL(new URL(window.location.href).origin + path);
}

function waitForElement(observeSelector, targetSelector) {
  return new Promise((resolve) => {
    const parent = document.querySelector(observeSelector);
    if (!parent) return;

    const found = parent.querySelector(targetSelector);
    if (found) {
      resolve(found);
      return;
    }

    const observer = new MutationObserver(() => {
      const el = parent.querySelector(targetSelector);
      if (el) {
        observer.disconnect();
        resolve(el);
      }
    });

    observer.observe(parent, { childList: true, subtree: true });
  });
}


async function findComment(commentRecord, isLogin = true) {
  let continuation;
  let requestUrl;

  //根据不同评论区调用不同API，这两个API的响应体结构一致的
  if (commentRecord.webPageType == "WEB_PAGE_TYPE_WATCH") {
    let payload = {
      uField3: 6,
      commentAreaWrapper: {
        videoId: commentRecord.commentAreaInfo.videoId
      },
      mainCommentRequest: {
        sectionIdentifier: "comments-section",
        commentParameters: {
          videoId: commentRecord.commentAreaInfo.videoId,
          targetCommentId: commentRecord.commentId
        }
      }
    }

    let encoded = NextContinuation.encode(payload);
    let buffer = encoded.finish();
    continuation = btoa(String.fromCharCode(...buffer));
    continuation = continuation.replaceAll("=", "%3D");

    requestUrl = "https://www.youtube.com/youtubei/v1/next?prettyPrint=false";
  } else if (commentRecord.webPageType == "WEB_PAGE_TYPE_BROWSE") {
    //TODO 帖子的评论
    let payload = {
      description: "community",
      mainCommentRequest: {
        sectionIdentifier: "comments-section",
        commentParameters: {
          channelId: commentRecord.commentAreaInfo.channelId,
          postId: commentRecord.commentAreaInfo.postId,
          targetCommentId: commentRecord.commentId
        }
      }
    }
    let encoded = BrowserCommentListContinuation.encode(payload);
    let buffer = encoded.finish();
    continuation = btoa(String.fromCharCode(...buffer));
    continuation = continuation.replaceAll("=", "%3D");

    payload = {
      request: {
        description: "FEcomment_post_detail_page_web_top_level",
        continuationBase64: continuation
      }
    }

    encoded = BrowserContinuation.encode(payload);
    buffer = encoded.finish();
    continuation = btoa(String.fromCharCode(...buffer));
    continuation = continuation.replaceAll("=", "%3D");

    requestUrl = "https://www.youtube.com/youtubei/v1/browse?prettyPrint=false";
  } else {
    throw new Error("Unsupported webPageType : " + commentRecord.webPageType);
  }

  let data = {
    context: contextCache,
    continuation
  }

  let headers = {};
  //不用移除cookie，不加authorization就可以不登录了
  if (isLogin) {
    headers.authorization = authorizationCache;
  }
  let options = {
    method: "POST",
    body: JSON.stringify(data),
    headers
  };

  let response = await (await originalFetch(requestUrl, options)).json();

  let loggedOut = response.responseContext.mainAppWebResponseContext.loggedOut;

  if (loggedOut == isLogin) {
    console.warn("登录状态不符，需要的：" + isLogin + " API返回的：" + !loggedOut)
  }

  let mutations = response.frameworkUpdates.entityBatchUpdate.mutations;
  for (let i = 0; i < mutations.length; i++) {
    let mutation = mutations[i];
    if (mutation.payload.commentEntityPayload) {
      let entity = mutation.payload.commentEntityPayload;
      let commentId = entity.properties.commentId;
      if (commentId == commentRecord.commentId) {
        let like = parseInt(entity.toolbar.likeCountNotliked);
        //什么Shit,like和replyCount是字符串，没有时是空串😅
        //如果parseIntD的结果是NaN就设置为0
        like = like ? like : 0;
        let replyCount = parseInt(entity.toolbar.replyCount);
        replyCount = replyCount ? replyCount : 0;
        return {
          content: entity.properties.content.content,
          commentId,
          like,
          replyCount
        }
      }
    }
  }
}

/**
 * 将当前状态更新到历史记录当中（如果变化）
 * @param {Object} commentRecord 
 */
function appendHistory(commentRecord) {
  let histories = commentRecord.histories;
  let needPush = false;

  if (histories.length == 0) {
    needPush = true;
  } else {
    let lastHistory = histories[histories.length - 1];
    needPush = lastHistory.state != commentRecord.currentState || lastHistory.content != commentRecord.content || lastHistory.hotBan != commentRecord.hotBan;
  }

  if (needPush) {
    histories.push({
      time: commentRecord.updatedTime,
      content: commentRecord.content,
      state: commentRecord.currentState,
      hotBan: commentRecord.hotBan
    });
  }
}

function updateRecord(commentRecord, state, result) {
  commentRecord.updatedTime = Date.now();
  commentRecord.currentState = state;
  if (result) {
    commentRecord.like = result.like;
    commentRecord.replyCount = result.replyCount;
    commentRecord.content = result.content;
  }
  appendHistory(commentRecord);
}

/**
 * 检查并更新当前评论
 * @param {Object} commentRecord  
 */
async function check(commentRecord) {
  let loggedOutResult = await findComment(commentRecord, false);
  if (loggedOutResult) {
    updateRecord(commentRecord, "NORMAL", loggedOutResult);
    return;
  }
  let loggedInResult = await findComment(commentRecord, true);
  if (loggedInResult) {
    updateRecord(commentRecord, "SHADOW_BAN", loggedInResult);
  } else {
    updateRecord(commentRecord, "DELETED");
  }
}

async function toCheck(commentRecord) {
  //查找新插入的评论元素，即发布的那条
  let selector;
  if (window.location.pathname.startsWith("/channel")) {//是否是帖子的评论区
    selector = "#sections";
  } else {//否则是视频的
    selector = "#comments";
  }

  let element = (await waitForElement(selector, `a[href='${commentRecord.url}']`)).parentNode.parentNode.parentNode.parentNode;
  let div = document.createElement('div');
  div.style.marginTop = '8px';
  div.id = "checker";
  element.append(div);

  let app = createApp(CommentChecker);
  app.use(ElementPlus);
  app.provide("check", check);
  app.provide("commentRecord", commentRecord);
  app.provide("interval", 5);
  app.provide("onComplete", (commentRecord) => {
    console.log("评论检查完成",commentRecord)
    div.remove();
  })

  app.mount(
    (() => {
      return div;
    })(),
  );
}


async function handlerYoutubei(request) {
  let requsetClone = request.clone();
  let requestBody = await requsetClone.json();

  //缓存这一坨context，youtubei api请求通用
  if (requestBody && requestBody.context) {
    contextCache = requestBody.context;
  }

  //劫持发送评论API
  if (request.url.startsWith("https://www.youtube.com/youtubei/v1/comment/create_comment")) {
    let response = await originalFetch(request);
    if (response.status != 200) {
      return response;
    }
    let responseClone = response.clone();
    try {
      let json = await responseClone.json();
      //你的评论没有发送成功，例如发送“Fuck you”，会弹窗提示“请本着尊重他人的态度发表评论……”
      if(json.frameworkUpdates.entityBatchUpdate.mutations.length == 1){
        return response;
      }
      let entity = json.frameworkUpdates.entityBatchUpdate.mutations[0].payload.commentEntityPayload;
      let innertubeCommand = json.frameworkUpdates.entityBatchUpdate.mutations[1].payload.commentSurfaceEntityPayload.publishedTimeCommand.innertubeCommand;
      let webCommandMetadata = innertubeCommand.commandMetadata.webCommandMetadata;
      let webPageType = webCommandMetadata.webPageType;
      let url = webCommandMetadata.url;
      let commentAreaInfo = {};

      if (webPageType == "WEB_PAGE_TYPE_WATCH") {//视频
        //视频ID 
        commentAreaInfo.videoId = innertubeCommand.watchEndpoint.videoId;
      } else if (webPageType == "WEB_PAGE_TYPE_BROWSE") {//帖子
        //帖子发布者频道ID
        commentAreaInfo.channelId = url.split("/")[2];
        //帖子ID
        commentAreaInfo.postId = createUrl(url).searchParams.get("lb");
      }

      let author = entity.author;
      let properties = entity.properties;

      let content = properties.content.content;
      let recodedTime = Date.now();

      let commentRecord = {
        //评论ID
        commentId: properties.commentId,
        //@发送者
        displayName: author.displayName,
        //频道ID，类似UID
        channelId: author.channelId,
        //评论内容
        content,
        //webPageType 评论区类型 视频 or 帖子
        webPageType,
        //URL 点击可跳转“所要查看的评论” 例如 /watch?v=${视频ID}&lc=${评论ID}
        url,
        //评论区信息，视频{视频ID}，帖子{频道ID,帖子ID}
        commentAreaInfo,
        //当前状态 默认从SHADOW_BAN开始，到NORMAL或DELETED
        currentState: "NOT_CHECK",
        //是否在热门排序中被禁止显示（搜索整个热门评论区来检查），前提条件currentState = "NORMAL"，值：null | false | true
        //此状态不会因为修改评论内容而解除，但会因为修改评论内容而赋予
        hotBan: null,
        //历史记录，时间 内容 状态 是否热门屏蔽
        histories: [],//{ time: recodedTime, state: "SHADOW_BAN", content, hotBan: null }
        //点赞与回复数，不记录历史
        like: 0,
        replyCount: 0,
        //记录的时间，用的是系统当前时间，约等于评论的发布时间，API里的publishedTime距离发布时间戳多久的Shit不是时间戳（PS：YouTube开放API可查询具体发布时间戳）
        recodedTime,
        //更新时间
        updatedTime: recodedTime,
        //是否是用户自己执行的删除？用于区分是被系统删的还是自己删除。state为"DELETED"时该属性为才有意义。（劫持删除评论请求时记录）
        isUserDelete: false
      }

      console.log(commentRecord);
      console.log(createUrl(url).href);
      toCheck(commentRecord);
    } catch (err) {
      console.error(err);
      throw err;
    }
    return response;
  }

  //console.log(requestBody);

  return await originalFetch(request);
}

//替换 fetch
unsafeWindow.fetch = function (resource, options) {
  // 只hook youtubei 这个接口，其他不管

  //要劫持的API一般传的是Request对象
  if (typeof resource == 'string') {
    return originalFetch(resource, options);
  }

  //第一个参数不是url就是Request了，仅劫持youtubei
  if (!resource.url.startsWith("https://www.youtube.com/youtubei/")) {
    return originalFetch(resource, options);
  }

  //没Authorization就算了
  let auth = resource.headers.get("Authorization");
  if (auth) {
    //缓存 authorization
    authorizationCache = auth;
    if (resource.method != "POST") {
      return originalFetch(resource);
    } else {
      return handlerYoutubei(resource);
    }
  }

  return originalFetch(resource, options);

};
