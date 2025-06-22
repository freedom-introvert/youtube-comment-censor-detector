/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars*/
import * as $protobuf from "protobufjs/minimal";

const $Reader = $protobuf.Reader, $util = $protobuf.util;

const $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

export const CommentAction = $root.CommentAction = (() => {

    function CommentAction(p) {
        if (p)
            for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                if (p[ks[i]] != null)
                    this[ks[i]] = p[ks[i]];
    }

    CommentAction.prototype.action = 0;
    CommentAction.prototype.commentId = "";

    CommentAction.decode = function decode(r, l, e) {
        if (!(r instanceof $Reader))
            r = $Reader.create(r);
        var c = l === undefined ? r.len : r.pos + l, m = new $root.CommentAction();
        while (r.pos < c) {
            var t = r.uint32();
            if (t === e)
                break;
            switch (t >>> 3) {
            case 1: {
                    m.action = r.int32();
                    break;
                }
            case 3: {
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

    return CommentAction;
})();

export const Action = $root.Action = (() => {
    const valuesById = {}, values = Object.create(valuesById);
    values[valuesById[0] = "DEFAULT"] = 0;
    values[valuesById[5] = "LIKE"] = 5;
    values[valuesById[6] = "DELETE"] = 6;
    return values;
})();

export { $root as default };
