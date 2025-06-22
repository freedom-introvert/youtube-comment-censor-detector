/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars*/
import * as $protobuf from "protobufjs/minimal";

const $Reader = $protobuf.Reader, $util = $protobuf.util;

const $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

export const UpdateCommentParams = $root.UpdateCommentParams = (() => {

    function UpdateCommentParams(p) {
        if (p)
            for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                if (p[ks[i]] != null)
                    this[ks[i]] = p[ks[i]];
    }

    UpdateCommentParams.prototype.commentId = "";

    UpdateCommentParams.decode = function decode(r, l, e) {
        if (!(r instanceof $Reader))
            r = $Reader.create(r);
        var c = l === undefined ? r.len : r.pos + l, m = new $root.UpdateCommentParams();
        while (r.pos < c) {
            var t = r.uint32();
            if (t === e)
                break;
            switch (t >>> 3) {
            case 1: {
                    m.commentId = r.string();
                    break;
                }
            default:
                r.skipType(t & 7);
                break;
            }
        }
        return m;
    };

    return UpdateCommentParams;
})();

export { $root as default };
