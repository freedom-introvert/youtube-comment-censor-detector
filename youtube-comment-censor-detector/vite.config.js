import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import monkey, { cdn, util } from 'vite-plugin-monkey';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    monkey({
      entry: 'src/main.js',
      userscript: {
        name:{
          "":"youtube-comment-censor-detector",
          zh:"YouTube发评反诈"
        },
        description:{
          "":"A real-time comment checker, Fuck YouTube's comment censorship",
          zh:"Fuck YouTube版“阿瓦隆系统”，实时检查评论状态，防止评论被儿童偷偷误食你还被蒙在鼓里"
        },
        icon: 'https://vasiojnvaj.oss-cn-hangzhou.aliyuncs.com/upload/msgImage/20250602/17488766795842.rar',//avif
        namespace: 'npm/vite-plugin-monkey',
        match: ['*://*.youtube.com/*'],
        author: "freedom-introvert",
        version: "1.0.0"
      },
      build: {
        externalGlobals: {
          vue: cdn.jsdelivr('Vue', 'dist/vue.global.prod.js')
            .concat('https://unpkg.com/vue-demi@latest/lib/index.iife.js')
            .concat(
              await util.fn2dataUrl(() => {
                window.Vue = Vue;
              }),
            ),
          'element-plus': cdn.jsdelivr('ElementPlus', 'dist/index.full.min.js'),
        },
        externalResource: {
          'element-plus/dist/index.css': cdn.jsdelivr(),
        },
      },
    }),
  ],
});
