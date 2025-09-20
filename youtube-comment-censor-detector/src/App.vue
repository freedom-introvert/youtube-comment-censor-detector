<template>
  <div>
    <el-dialog v-model="historiesVisible" :z-index="3000" title="历史评论列表" width="80%" style="height: 92vh;"
      body-class="dialog-body" align-center destroy-on-close>
        <CommentHistories/>
    </el-dialog>
    <el-dialog v-model="searchHotBanVisible" :z-index="3000" title="热门屏蔽评论搜索" width="80%" style="height: 92vh;"
      body-class="dialog-body" align-center destroy-on-close>
        <HotBanCommentSearcher/>
    </el-dialog>
    <el-dialog v-model="settingsVisible" :z-index="3000" title="设置" width="60%" style="height: 92vh;"
      body-class="dialog-body" align-center destroy-on-close>
        <Settings/>
    </el-dialog>
    
  </div>
</template>

<script setup>
import { inject,ref } from 'vue';
import CommentHistories from './components/CommentHistories.vue';
import HotBanCommentSearcher from './components/HotBanCommentSearcher.vue';
import Settings from './components/Settings.vue';

let historiesVisible = ref(false);
let searchHotBanVisible = ref(false);
let settingsVisible = ref(false);

const menuListener = inject("menuListener");

menuListener.onOpenHistory = () => {
  historiesVisible.value = true;
}

menuListener.onSearchHotBan = () => {
  searchHotBanVisible.value = true;
}

menuListener.onOpenSettings = () => {
  settingsVisible.value = true;
}

</script>

<style scoped>
:deep(.dialog-body) {
  /* 100%高度减去头部元素的高度，不然会溢出 */
  height: calc(100% - 40px);
  display: flex;
  flex-direction: column;
}

</style>
