/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars*/
import * as $protobuf from "protobufjs/minimal";

const $Writer = $protobuf.Writer, $util = $protobuf.util;

const $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

export const NextContinuation = $root.NextContinuation = (() => {

    function NextContinuation(p) {
        if (p)
            for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                if (p[ks[i]] != null)
                    this[ks[i]] = p[ks[i]];
    }

    NextContinuation.prototype.commentAreaWrapper = null;
    NextContinuation.prototype.uField3 = 0;
    NextContinuation.prototype.mainCommentRequest = null;

    NextContinuation.encode = function encode(m, w) {
        if (!w)
            w = $Writer.create();
        if (m.commentAreaWrapper != null && Object.hasOwnProperty.call(m, "commentAreaWrapper"))
            $root.CommentAreaWrapper.encode(m.commentAreaWrapper, w.uint32(18).fork()).ldelim();
        if (m.uField3 != null && Object.hasOwnProperty.call(m, "uField3"))
            w.uint32(24).int32(m.uField3);
        if (m.mainCommentRequest != null && Object.hasOwnProperty.call(m, "mainCommentRequest"))
            $root.MainCommentRequest.encode(m.mainCommentRequest, w.uint32(50).fork()).ldelim();
        return w;
    };

    return NextContinuation;
})();

export const CommentAreaWrapper = $root.CommentAreaWrapper = (() => {

    function CommentAreaWrapper(p) {
        if (p)
            for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                if (p[ks[i]] != null)
                    this[ks[i]] = p[ks[i]];
    }

    CommentAreaWrapper.prototype.videoId = "";

    CommentAreaWrapper.encode = function encode(m, w) {
        if (!w)
            w = $Writer.create();
        if (m.videoId != null && Object.hasOwnProperty.call(m, "videoId"))
            w.uint32(18).string(m.videoId);
        return w;
    };

    return CommentAreaWrapper;
})();

export const MainCommentRequest = $root.MainCommentRequest = (() => {

    function MainCommentRequest(p) {
        if (p)
            for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                if (p[ks[i]] != null)
                    this[ks[i]] = p[ks[i]];
    }

    MainCommentRequest.prototype.commentParameters = null;
    MainCommentRequest.prototype.sectionIdentifier = "";

    MainCommentRequest.encode = function encode(m, w) {
        if (!w)
            w = $Writer.create();
        if (m.commentParameters != null && Object.hasOwnProperty.call(m, "commentParameters"))
            $root.CommentParameters.encode(m.commentParameters, w.uint32(34).fork()).ldelim();
        if (m.sectionIdentifier != null && Object.hasOwnProperty.call(m, "sectionIdentifier"))
            w.uint32(66).string(m.sectionIdentifier);
        return w;
    };

    return MainCommentRequest;
})();

export const CommentParameters = $root.CommentParameters = (() => {

    function CommentParameters(p) {
        if (p)
            for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                if (p[ks[i]] != null)
                    this[ks[i]] = p[ks[i]];
    }

    CommentParameters.prototype.videoId = "";
    CommentParameters.prototype.postId = "";
    CommentParameters.prototype.channelId = "";
    CommentParameters.prototype.sortType = 0;
    CommentParameters.prototype.targetCommentId = "";

    CommentParameters.encode = function encode(m, w) {
        if (!w)
            w = $Writer.create();
        if (m.videoId != null && Object.hasOwnProperty.call(m, "videoId"))
            w.uint32(34).string(m.videoId);
        if (m.sortType != null && Object.hasOwnProperty.call(m, "sortType"))
            w.uint32(48).int32(m.sortType);
        if (m.targetCommentId != null && Object.hasOwnProperty.call(m, "targetCommentId"))
            w.uint32(130).string(m.targetCommentId);
        if (m.postId != null && Object.hasOwnProperty.call(m, "postId"))
            w.uint32(234).string(m.postId);
        if (m.channelId != null && Object.hasOwnProperty.call(m, "channelId"))
            w.uint32(242).string(m.channelId);
        return w;
    };

    CommentParameters.SortType = (function() {
        const valuesById = {}, values = Object.create(valuesById);
        values[valuesById[0] = "HOT"] = 0;
        values[valuesById[1] = "LATEST"] = 1;
        return values;
    })();

    return CommentParameters;
})();

export const BrowserContinuation = $root.BrowserContinuation = (() => {

    function BrowserContinuation(p) {
        if (p)
            for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                if (p[ks[i]] != null)
                    this[ks[i]] = p[ks[i]];
    }

    BrowserContinuation.prototype.request = null;

    BrowserContinuation.encode = function encode(m, w) {
        if (!w)
            w = $Writer.create();
        if (m.request != null && Object.hasOwnProperty.call(m, "request"))
            $root.BrowserContinuation.Request.encode(m.request, w.uint32(641815778).fork()).ldelim();
        return w;
    };

    BrowserContinuation.Request = (function() {

        function Request(p) {
            if (p)
                for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                    if (p[ks[i]] != null)
                        this[ks[i]] = p[ks[i]];
        }

        Request.prototype.description = "";
        Request.prototype.continuationBase64 = "";

        Request.encode = function encode(m, w) {
            if (!w)
                w = $Writer.create();
            if (m.description != null && Object.hasOwnProperty.call(m, "description"))
                w.uint32(18).string(m.description);
            if (m.continuationBase64 != null && Object.hasOwnProperty.call(m, "continuationBase64"))
                w.uint32(26).string(m.continuationBase64);
            return w;
        };

        return Request;
    })();

    return BrowserContinuation;
})();

export const BrowserCommentListContinuation = $root.BrowserCommentListContinuation = (() => {

    function BrowserCommentListContinuation(p) {
        if (p)
            for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                if (p[ks[i]] != null)
                    this[ks[i]] = p[ks[i]];
    }

    BrowserCommentListContinuation.prototype.description = "";
    BrowserCommentListContinuation.prototype.mainCommentRequest = null;

    BrowserCommentListContinuation.encode = function encode(m, w) {
        if (!w)
            w = $Writer.create();
        if (m.description != null && Object.hasOwnProperty.call(m, "description"))
            w.uint32(18).string(m.description);
        if (m.mainCommentRequest != null && Object.hasOwnProperty.call(m, "mainCommentRequest"))
            $root.MainCommentRequest.encode(m.mainCommentRequest, w.uint32(426).fork()).ldelim();
        return w;
    };

    return BrowserCommentListContinuation;
})();

export { $root as default };
