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
        name: {
          "": "youtube-comment-censor-detector",
          "zh-CN": "YouTube发评反诈",
          "zh-TW": "YouTube發評反詐"
        },
        description: {
          "": "A real-time comment checker, Fuck YouTube’s opaque comment censorship",
          "zh-CN": "Fuck YouTube版“阿瓦隆系统”，实时检查评论状态，防止评论被儿童偷偷误食你还被蒙在鼓里",
          "zh-TW": "Fuck YouTube版“阿瓦隆系統”，即時檢查評論狀態，防止評論被兒童偷偷誤食你還被蒙在鼓裡"
        },
        icon: 'https://raw.githubusercontent.com/freedom-introvert/youtube-comment-censor-detector/refs/heads/main/logo/logo_256x256.avif',
        namespace: 'npm/vite-plugin-monkey',
        match: ['*://*.youtube.com/*'],
        author: "freedom-introvert",
        version: "2.5.6",
        license: "GPL",
        "run-at":"document-start"
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
