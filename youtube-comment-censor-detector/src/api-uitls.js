import { standardBase64ToUrlSafe } from "./util";
import { NextContinuation, BrowserContinuation, BrowserCommentListContinuation } from "./continuation-proto";
/**
 * 创建视频根评论列表的continuation信息
 * @param {String} channelId 视频所属频道ID
 * @param {String} videoId 视频ID
 * @param {Boolean} isLatestSort 是否为最新排序
 * @returns 
 */

export function createVideoRootCommentListContinuation(channelId, videoId, isLatestSort) {
  let payload = {
    uField3: 6,
    commentAreaWrapper: {
      videoId
    },
    mainCommentRequest: {
      sectionIdentifier: "comments-section",
      commentParameters: {
        videoId,
        sortType: isLatestSort ? 1 : 0
      }
    }
  };
  let encoded = NextContinuation.encode(payload);
  let buffer = encoded.finish();
  let continuation = btoa(String.fromCharCode(...buffer));
  return standardBase64ToUrlSafe(continuation);
}

/**
 * 创建视频的回复评论列表的continuation信息
 * @param {String} channelId 视频所属频道ID
 * @param {String} videoId 视频ID
 * @param {String} rootCommentId 根评论ID
 * @param {Boolean} isLatestSort 是否为最新排序
 */

export function createVideoReplyCommentListContinuation(channelId, videoId, rootCommentId, isLatestSort) {
  let payload = {
    uField3: 6,
    commentAreaWrapper: {
      videoId: videoId
    },
    mainCommentRequest: {
      sectionIdentifier: `comment-replies-item-${rootCommentId}`,
      commentReplyParameters: {
        rootCommentId,
        channelId: channelId,
        videoId: videoId,
        pageSize: 10,
        sortParam: {
          sortType: isLatestSort ? 2 : 1
        }
      }
    }
  }
  let encoded = NextContinuation.encode(payload);
  let buffer = encoded.finish();
  let continuation = btoa(String.fromCharCode(...buffer));
  return standardBase64ToUrlSafe(continuation);
}

/**
 * 创建帖子的根评论列表的continuation信息
 * @param {String} channelId 贴子所属频道ID
 * @param {String} postId 贴子ID
 * @param {Boolean} isLatestSort 是否为最新排序
 */
export function createPostRootCommentListContinuation(channelId, postId, isLatestSort) {
  let payload = {
    description: "community",
    mainCommentRequest: {
      sectionIdentifier: "comments-section",
      commentParameters: {
        channelId: channelId,
        postId: postId,
        sortType: isLatestSort ? 1 : 0
      }
    }
  }
  let encoded = BrowserCommentListContinuation.encode(payload);
  let buffer = encoded.finish();
  let continuation = btoa(String.fromCharCode(...buffer));
  continuation = standardBase64ToUrlSafe(continuation);

  payload = {
    request: {
      description: "FEcomment_post_detail_page_web_top_level",
      continuationBase64: continuation
    }
  }

  encoded = BrowserContinuation.encode(payload);
  buffer = encoded.finish();
  continuation = btoa(String.fromCharCode(...buffer));
  return standardBase64ToUrlSafe(continuation);
}

/** 创建帖子的回复评论列表的continuation信息
 * @param {String} channelId 贴子所属频道ID
 * @param {String} postId 贴子ID
 * @param {String} rootCommentId 根评论ID
 * @param {Boolean} isLatestSort 是否为最新排序
 */

export function createPostReplyCommentListContinuation(channelId, postId, rootCommentId, isLatestSort) {
  let payload = {
    description: "community",
    mainCommentRequest: {
      sectionIdentifier: `comment-replies-item-${rootCommentId}`,
      commentReplyParameters: {
        rootCommentId,
        channelId: channelId,
        postId: postId,
        pageSize: 10,
        sortParam: {
          sortType: isLatestSort ? 2 : 1
        }
      }
    }
  }
  let encoded = BrowserCommentListContinuation.encode(payload);
  let buffer = encoded.finish();
  continuation = btoa(String.fromCharCode(...buffer));
  continuation = standardBase64ToUrlSafe(continuation);

  payload = {
    request: {
      description: "FEcomment_post_detail_page_web_replies_page",
      continuationBase64: continuation
    }
  }

  encoded = BrowserContinuation.encode(payload);
  buffer = encoded.finish();
  let continuation = btoa(String.fromCharCode(...buffer));
  return standardBase64ToUrlSafe(continuation);
}