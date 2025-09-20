## 编译

### 1. 安装protobufjs-cli

```
npm install -g protobufjs-cli
```

### 2. 生成js文件

cd到当前目录

执行以下命令（Linux请将`^`换成`\`）

```
pbjs -t static-module -w es6 ^
  --no-verify ^
  --no-convert ^
  --no-delimited ^
  --no-typeurl ^
  --no-beautify ^
  --no-comments ^
  --no-service ^
  --no-create ^
  --sparse ^
  -o continuation-proto.js ^
  commentRequest.proto
```

```
pbjs -t static-module -w es6 ^
  --no-encode ^
  --no-verify ^
  --no-convert ^
  --no-delimited ^
  --no-typeurl ^
  --no-beautify ^
  --no-comments ^
  --no-service ^
  --no-create ^
  --sparse ^
  -o comment-action.js ^
  commentAction.proto
```

```
pbjs -t static-module -w es6 ^
  --no-encode ^
  --no-verify ^
  --no-convert ^
  --no-delimited ^
  --no-typeurl ^
  --no-beautify ^
  --no-comments ^
  --no-service ^
  --no-create ^
  --sparse ^
  -o update-comment-params.js ^
  updateCommentParams.proto
```

然后将proto文件放到目标路径即可

### 3. 导入使用

参见 https://github.com/protobufjs/protobuf.js/

