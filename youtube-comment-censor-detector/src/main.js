import { createApp, toRaw } from 'vue';
import './style.css';
import CommentChecker from './components/CommentChecker.vue'
import { NextContinuation, BrowserCommentListContinuation, BrowserContinuation } from "./continuation-proto"
import { CommentAction } from './comment-action';
import { UpdateCommentParams } from './update-comment-params';
import { unsafeWindow, GM_registerMenuCommand, GM_addElement } from "$"
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue';
import { createUrl, urlSafeBase64ToStandard, standardBase64ToUrlSafe, findValueInSingleEntryArray } from "./util";
import {
  createVideoRootCommentListContinuation, createVideoReplyCommentListContinuation,
  createPostRootCommentListContinuation, createPostReplyCommentListContinuation
} from './api-uitls';


// import en from 'element-plus/es/locale/lang/en'
// import zhCn from 'element-plus/es/locale/lang/zh-cn'
// import zhTw from 'element-plus/es/locale/lang/zh-tw'
// import ja from 'element-plus/es/locale/lang/ja'
// import ko from 'element-plus/es/locale/lang/ko'
// import fr from 'element-plus/es/locale/lang/fr'
// import de from 'element-plus/es/locale/lang/de'
// import es from 'element-plus/es/locale/lang/es'
// import pt from 'element-plus/es/locale/lang/pt'
// import ru from 'element-plus/es/locale/lang/ru'

// const localeMap = {
//   'en': en,
//   'en-us': en,
//   'zh': zhCn,
//   'zh-cn': zhCn,
//   'zh-tw': zhTw,
//   'zh-hk': zhTw,
//   'ja': ja,
//   'ko': ko,
//   'fr': fr,
//   'de': de,
//   'es': es,
//   'pt': pt,
//   'pt-br': pt,
//   'ru': ru,
// }

// const lang = navigator.language.toLowerCase();
// const locale = localeMap[lang] || en;

// 保存原始的 fetch 方法
const originalFetch = unsafeWindow.fetch;

//认证和context信息，这个我不研究怎么去生成了，直接从它的请求里抓然后缓存起来即可
var authorizationCache = null;
var contextCache = null;
var trueLoaded = false;


var db = null;

//正在检查中的评论ID集合，用于阻止正在检查中的评论被用户删除
const checkingCommentIdSet = new Set();

function getAuthorization() {
  return authorizationCache;
}

function getContext() {
  return contextCache;
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
    continuation = standardBase64ToUrlSafe(continuation);

    requestUrl = "https://www.youtube.com/youtubei/v1/next?prettyPrint=false";
  } else if (commentRecord.webPageType == "WEB_PAGE_TYPE_BROWSE") {
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
    continuation = standardBase64ToUrlSafe(continuation)

    payload = {
      request: {
        description: "FEcomment_post_detail_page_web_top_level",
        continuationBase64: continuation
      }
    }

    encoded = BrowserContinuation.encode(payload);
    buffer = encoded.finish();
    continuation = btoa(String.fromCharCode(...buffer));
    continuation = standardBase64ToUrlSafe(continuation);

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

  //可能是评论区已关闭等原因，会没有frameworkUpdates
  if (!response.frameworkUpdates) {
    throw new Error("COMMENT_AREA_CLOSED");
  }

  let mutations = response.frameworkUpdates.entityBatchUpdate.mutations;
  for (let i = 0; i < mutations.length; i++) {
    let mutation = mutations[i];
    if (mutation.payload.commentEntityPayload) {
      let entity = mutation.payload.commentEntityPayload;
      let commentId = entity.properties.commentId;
      if (commentId == commentRecord.commentId) {
        let likeCount = parseInt(entity.toolbar.likeCountNotliked);
        //什么Shit,like和replyCount是字符串，没有时是空串😅
        //如果parseIntD的结果是NaN就设置为0
        likeCount = likeCount ? likeCount : 0;
        let replyCount = parseInt(entity.toolbar.replyCount);
        replyCount = replyCount ? replyCount : 0;
        return {
          content: entity.properties.content.content,
          commentId,
          likeCount,
          replyCount
        }
      }
    }
  }
}

//默认的评论插入与更新函数，成功打开数据库将实现函数，失败就是默认的空函数，调用时什么都不做。
async function insertComment() { }

async function updateComment() { }

async function selectComment() { }

async function deleteComment() { }

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
  if (state) {
    commentRecord.currentState = state;
  }
  if (result) {
    commentRecord.likeCount = result.likeCount;
    commentRecord.replyCount = result.replyCount;
    commentRecord.content = result.content;
  }
  appendHistory(commentRecord);
  updateComment(commentRecord);
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
  checkingCommentIdSet.add(commentRecord.commentId);
  //查找新插入的评论元素，即发布的那条
  let selector;
  let pathname = window.location.pathname;
  if (pathname.startsWith("/post") || pathname.startsWith("/channel")) {//是否是帖子的评论区
    selector = "ytd-item-section-renderer#sections";
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
  app.provide("hotBanCheck", hotBanCheck)
  app.provide("commentRecord", commentRecord);
  app.provide("interval", 5);
  app.provide("onUnblock", commentRecord => {
    checkingCommentIdSet.delete(commentRecord.commentId);
  })
  app.provide("onClose", commentRecord => {
    checkingCommentIdSet.delete(commentRecord.commentId);
    console.log("评论检查完成", commentRecord)
    div.remove();
  })

  app.mount(div);
}

function createCommentListRequest(commentRecord, isLatestSort) {
  let api;
  let continuation;

  if (commentRecord.webPageType == "WEB_PAGE_TYPE_WATCH") {
    api = "https://www.youtube.com/youtubei/v1/next?prettyPrint=false";
    //是否是回复评论，评论ID会有个`.`，点前面是根评论的ID
    if (commentRecord.commentId.indexOf(".") != -1) {
      //视频的二级（回复）评论
      let rootCommentId = commentRecord.commentId.split(".")[0];
      continuation = createVideoReplyCommentListContinuation(
        commentRecord.commentAreaInfo.channelId,
        commentRecord.commentAreaInfo.videoId,
        rootCommentId,
        isLatestSort
      );
    } else {
      //视频的一级评论
      continuation = createVideoRootCommentListContinuation(
        commentRecord.commentAreaInfo.channelId,
        commentRecord.commentAreaInfo.videoId,
        isLatestSort
      );
    }
  } else if (commentRecord.webPageType == "WEB_PAGE_TYPE_BROWSE") {
    api = "https://www.youtube.com/youtubei/v1/browse?prettyPrint=false";
    if (commentRecord.commentId.indexOf(".") != -1) {
      //帖子的二级（回复）评论
      let rootCommentId = commentRecord.commentId.split(".")[0];
      continuation = createPostReplyCommentListContinuation(
        commentRecord.commentAreaInfo.channelId,
        commentRecord.commentAreaInfo.postId,
        rootCommentId,
        isLatestSort
      );
    } else {
      //帖子的一级评论
      continuation = createPostRootCommentListContinuation(
        commentRecord.commentAreaInfo.channelId,
        commentRecord.commentAreaInfo.postId,
        isLatestSort
      );
    }
  }

  return { api, continuation }
}

/**
 * 热门屏蔽检查
 * @param {*} commentRecord 评论记录
 * @param {*} observer 观察者对象，进度、结果的回调
 * @param {*} controller 控制器，将isCancelled字段设置为true来终止翻页
 * @returns 是否正常结束 true 是的 false 被终止
 */
async function hotBanCheck(commentRecord, observer, controller) {

  //设定一个默认的观察者对象
  if (!observer) {
    observer = {
      onCountChange(c, p) { },
    }
  }

  if (!controller) {
    controller = {
      isCancelled: false
    }
  }

  let pageCpunt = 0;
  let commentCount = 0;

  //创建第一页的请求参数，以及匹配特定API
  let { api, continuation } = createCommentListRequest(commentRecord);

  while (continuation) {
    //如果控制器对象的isCancelled被设置成了true，就退出循环终止翻页
    if (controller.isCancelled) {
      return false;
    }
    let data = {
      context: contextCache,
      continuation
    }

    //不使用登录，因为登录状态可能会把用户所发布的评论排在热门头部，无论是否热门屏蔽
    let options = {
      method: "POST",
      body: JSON.stringify(data),
    };

    let response = await (await originalFetch(api, options)).json();
    pageCpunt++;
    //当获取二级评论区时，没有frameworkUpdates就是当前二级评论区（回复评论）没有一条评论。不会返回mutations空列表
    if (!response.frameworkUpdates) {
      commentRecord.hotBan = true;
      updateRecord(commentRecord);
      return true;
    }
    //寻找匹配的评论ID
    for (let mutation of response.frameworkUpdates.entityBatchUpdate.mutations) {
      let entity = mutation.payload.commentEntityPayload;
      if (entity) {
        let commentId = entity.properties.commentId;
        commentCount++;
        //回显翻页信息
        observer.onCountChange(commentCount, pageCpunt);
        if (commentId == commentRecord.commentId) {
          commentRecord.hotBan = false;
          updateRecord(commentRecord);
          return true;
        }
      }
    }

    //获取翻页tocken，即下一次请求用的continuation
    continuation = null;

    for (const endpoint of response.onResponseReceivedEndpoints) {
      const items = endpoint.appendContinuationItemsAction?.continuationItems
        || endpoint.reloadContinuationItemsCommand?.continuationItems;

      if (!items) continue;

      for (const item of items) {
        const token = item.continuationItemRenderer?.continuationEndpoint?.continuationCommand?.token;
        if (token) {
          continuation = token;
          break;
        }
      }

      if (continuation) break;
    }
  }
  commentRecord.hotBan = true;
  updateRecord(commentRecord);
  return true;
}

async function handlerYoutubei(request) {
  let requsetClone = request.clone();
  let requestBody = await requsetClone.json();

  //缓存这一坨context，youtubei api请求通用
  if (requestBody && requestBody.context) {
    contextCache = requestBody.context;
    if (!trueLoaded) {
      console.log("fetch已成功劫持");
      GM_registerMenuCommand("✅ 脚本已完全加载")
      trueLoaded = true;
    }
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
      if (json.frameworkUpdates.entityBatchUpdate.mutations.length == 1) {
        return response;
      }
      let entity = json.frameworkUpdates.entityBatchUpdate.mutations[0].payload.commentEntityPayload;
      let innertubeCommand = json.frameworkUpdates.entityBatchUpdate.mutations[1].payload.commentSurfaceEntityPayload.publishedTimeCommand.innertubeCommand;
      let webCommandMetadata = innertubeCommand.commandMetadata.webCommandMetadata;
      let webPageType = webCommandMetadata.webPageType;
      let url = webCommandMetadata.url;
      let commentAreaInfo = {};

      //视频发布者频道ID
      commentAreaInfo.channelId = findValueInSingleEntryArray(json.actions[0].runAttestationCommand.ids, "externalChannelId");

      if (webPageType == "WEB_PAGE_TYPE_WATCH") {//视频
        //视频ID
        commentAreaInfo.videoId = innertubeCommand.watchEndpoint.videoId;
      } else if (webPageType == "WEB_PAGE_TYPE_BROWSE") {//帖子
        //帖子ID
        commentAreaInfo.postId = createUrl(url).pathname.split("/")[2];
      }

      let author = entity.author;
      let properties = entity.properties;

      let content = properties.content.content;
      let recordedTime = Date.now();

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
        histories: [],//{ time: recordedTime, state: "SHADOW_BAN", content, hotBan: null }
        //点赞与回复数，不记录历史
        likeCount: 0,
        replyCount: 0,
        //记录的时间，用的是系统当前时间，约等于评论的发布时间，API里的publishedTime距离发布时间戳多久的Shit不是时间戳（PS：YouTube开放API可查询具体发布时间戳）
        recordedTime,
        //更新时间
        updatedTime: recordedTime,
        //是否是用户自己执行的删除？用于区分是被系统删的还是自己删除。state为"DELETED"时该属性为才有意义。（劫持删除评论请求时记录）
        isUserDelete: false
      }

      console.log(commentRecord);
      insertComment(commentRecord);
      console.log(createUrl(url).href);
      toCheck(commentRecord);
    } catch (err) {
      console.error(err);
      throw err;
    }
    return response;
  } else if (request.url.startsWith("https://www.youtube.com/youtubei/v1/comment/perform_comment_action")) {
    let actionBase64 = urlSafeBase64ToStandard(requestBody.actions[0]);
    let actionInfo = CommentAction.decode(Uint8Array.from(atob(actionBase64), c => c.charCodeAt(0)));

    //如果是删除评论的Action
    if (actionInfo.action == 6) {
      if (checkingCommentIdSet.has(actionInfo.commentId)) {
        alert("现在不能删除该评论，因为评论还未完成检查，请先完成检查！");
        const responseBody = {
          "error": {
            "code": 403,
            "message": "Can't delete comment now",
            "errors": [
              {
                "message": "Can't delete comment now",
                "domain": "global",
                "reason": "forbidden"
              }
            ],
            "status": "FORBIDDEN"
          }
        };
        return new Response(JSON.stringify(responseBody), {
          status: 403,
          headers: {
            'Content-Type': 'application/json'
          }
        });
      } else {
        //用户删除评论时，将数据库中的评论状态标记为删除，并且将用户删除这一字段标记为true（当然这一字段也不是完全可信的，因为用户可能会在别的设备进行删除）
        let response = await originalFetch(request);
        let responseBody = await response.clone().json();
        if (responseBody.actions && responseBody.actions[0].removeCommentAction.actionResult.status == "STATUS_SUCCEEDED") {
          let commentRecord = await selectComment(actionInfo.commentId);
          if (commentRecord) {
            commentRecord.isUserDelete = true;
            updateRecord(commentRecord, "DELETED");
          }
        }
        return response;
      }
    }
  } else if (request.url.startsWith("https://www.youtube.com/youtubei/v1/comment/update_comment")) {
    let updateCommentParams = urlSafeBase64ToStandard(requestBody.updateCommentParams);
    let decodedParams = UpdateCommentParams.decode(Uint8Array.from(atob(updateCommentParams), c => c.charCodeAt(0)));
    if (checkingCommentIdSet.has(decodedParams.commentId)) {
      alert("现在不能修改该评论，因为评论还未完成检查，请先完成检查！");
      const responseBody = {
        "error": {
          "code": 403,
          "message": "Can't edit comment now",
          "errors": [
            {
              "message": "Can't edit comment now",
              "domain": "global",
              "reason": "forbidden"
            }
          ],
          "status": "FORBIDDEN"
        }
      };
      return new Response(JSON.stringify(responseBody), {
        status: 403,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    let response = await originalFetch(request);
    let responseBody = await response.clone().json();
    if (responseBody.actions && responseBody.actions[0].updateCommentAction.actionResult.status == "STATUS_SUCCEEDED") {
      let commentRecord = await selectComment(decodedParams.commentId);
      if (commentRecord) {
        //修改评论，同时更新数据库里的评论记录，并且重置状态和热门屏蔽检查结果那些
        commentRecord.content = requestBody.commentText;
        commentRecord.currentState = "NOT_CHECK";
        commentRecord.hotBan = null;
        updateRecord(commentRecord);
      }
    }
    return response;
  }

  return await originalFetch(request);
}


const fetchProxy = function (resource, options) {
  // 只hook youtubei 这个接口，其他不管

  //要劫持的API，发送评论、删除评论、获取列表等，传的都是Request对象
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

//替换 fetch 修改要趁早
try {
  unsafeWindow.fetch = fetchProxy;
} catch (err) {
  console.warn("替换 unsafeWindow.fetch 失败！相关信息：", err, Object.getOwnPropertyDescriptor(unsafeWindow, 'fetch'));
  if (confirm("fetch已被提前锁定，替换失败，YouTube发评反诈可能无法正常工作。\n你可以安装本项目的 Define property blocker 插件来反制锁定。\n\n点击“确定”前往项目地址，点击“取消”忽略。")) {
    window.location.href = "https://github.com/freedom-introvert/youtube-comment-censor-detector";
  }
}


/*

const iframe = document.createElement('iframe');
document.body.appendChild(iframe);
console.log(iframe.contentWindow.fetch);//ƒ fetch() { [native code] }

用以上代码可以绕过window里的fetch，创建一个iframe然后从它的window里获取它的fetch
这样获取到的fetch函数就和原window里的fetch除了`==`的结果是false，使用起来就和原window的fetch一样

YouTube的确使用了这种方式获取fetch来调用诸如获取评论列表，发送评论等API。
2025-06-19 正在写本插件的评论记录功能，突然发现fetch的hook炸了，前一分钟还是好的。发送是评论的API未被hook，设置了 run-at:document-start 问题依旧，但注入时机已经是最早了
直到我问了ChatGPT：如果window.fetch被诸如油猴的插件提前换掉了，换成了它的，现在你还能拿到原来的fetch吗？
……
试了下成功发现问题所在！

PS：为什么是在我开发的过程中突然失效？疑似YouTube故意针对本脚本？但今天该脚本还没有影响力啊！GreasyFork也就2安装

*/
const _createElement = Document.prototype.createElement;
Document.prototype.createElement = function (tagName, ...args) {
  const el = _createElement.call(this, tagName, ...args);
  if (tagName.toLowerCase() === 'iframe') {
    el.addEventListener('load', () => {
      try {
        const fetchFromIframe = el.contentWindow?.fetch;
        if (fetchFromIframe) {
          el.contentWindow.fetch = fetchProxy;
          console.log("已替换iframe window的fetch", el);
        }
      } catch (e) {
        console.log("未替换该iframe的fetch", el, e)
      }
    });
  }
  return el;
};


function openDB() {
  return new Promise((resolve, reject) => {
    let request = indexedDB.open("YT-CCD", 1);
    request.onerror = (event) => {
      reject(event);
    }

    request.onsuccess = (event) => {
      resolve(event.target.result);
    }

    request.onupgradeneeded = (event) => {
      let db = event.target.result;
      let objectStore = db.createObjectStore("comments", { keyPath: "commentId" });
      objectStore.createIndex("recordedTime", "recordedTime", { unique: false });
    }
  })
}

async function init() {
  try {
    db = await openDB();
    insertComment = function (comment) {
      return new Promise((resolve, reject) => {
        let request = db.transaction("comments", "readwrite")
          .objectStore("comments")
          .add(comment);

        request.onsuccess = event => {
          resolve(event);
        }

        request.onerror = event => {
          reject(event);
        }
      });
    }

    updateComment = function (comment) {
      return new Promise((resolve, reject) => {
        let request = db.transaction("comments", "readwrite")
          .objectStore("comments")
          .put(toRaw(comment));//代理对象没法被正确识别并更新，所以转换为普通Object

        request.onsuccess = event => {
          resolve(event);
        }

        request.onerror = event => {
          reject(event)
        }
      })
    }

    selectComment = function (commentId) {
      return new Promise((resolve, reject) => {
        let request = db.transaction("comments")
          .objectStore("comments")
          .get(commentId);

        request.onsuccess = event => {
          resolve(request.result);
        }

        request.onerror = event => {
          reject(event);
        }
      })
    }

    deleteComment = function (commentId) {
      return new Promise((resolve, reject) => {
        let request = db.transaction("comments", "readwrite")
          .objectStore("comments")
          .delete(commentId)

        request.onsuccess = event => {
          resolve(request.result);
        }

        request.onerror = event => {
          reject(event);
        }
      })
    }
  } catch (err) {
    console.log("indexedDB数据库打开失败，评论历史记录相关功能已禁用，错误信息：", err);
  }

  const menuListener = {
    onOpenHistory: () => {
      alert("脚本正在初始化，请稍后……")
    },
  }

  //初始化油猴菜单
  GM_registerMenuCommand("🧾 历史评论记录", () => {
    menuListener.onOpenHistory();
  })

  GM_registerMenuCommand("🔍 搜索热门屏蔽评论", () => {
    menuListener.onSearchHotBan();
  })

  //创建用于显示历史评论、设置等对话框的图层
  const div = document.createElement('div');
  div.id = "yt-ccd";
  div.style.position = "absolute";
  document.body.append(div);
  let app = createApp(App);
  app.use(ElementPlus);
  app.provide("menuListener", menuListener);
  app.provide("db", db);
  app.provide("check", check);
  app.provide("hotBanCheck", hotBanCheck);
  app.provide("deleteComment", deleteComment)
  app.provide("getAuthorization", getAuthorization);
  app.provide("getContext", getContext);
  app.provide("originalFetch", originalFetch);
  app.mount(div);
}

//加载反诈

window.addEventListener("load", () => {
  init()
    .then(() => {
      console.log("YouTube反诈加载完成");
    }).catch(err => {
      console.error("YouTube反诈加载失败", err);
    })
})
