<template>
  <div class="settings-container">
    <h2 class="title">二级评论（回复/楼中楼）</h2>
    <div class="setting-item">
      <div class="setting-info">
        <span class="setting-label">二级评论列表强制最新排序</span>
        <p class="setting-desc">无论评论区的排序方式如何，二级评论始终按最新排序</p>
      </div>
      <el-switch v-model="settings.forceTimeSort" />
    </div>

    <el-divider />

    <div class="setting-item">
      <div class="setting-info">
        <span class="setting-label">搜索并显示被热门屏蔽的二级评论</span>
        <p class="setting-desc">在前者的基础上，先获取一次所有的热门评论，最新排序的评论若热门列表没有，则标注“（热门屏蔽的）”</p>
      </div>
      <el-switch v-model="settings.showBlockedHotComments" :disabled="!settings.forceTimeSort"/>
    </div>
  </div>
</template>

<script setup>
import { watch } from 'vue';
import { useSettingsStore } from '../settingsStore';

const settings = useSettingsStore();

watch(() => settings.$state, (newState) => {
  localStorage.setItem('yt-ccd-settings', JSON.stringify(newState));
}, { deep: true });
</script>

<style scoped>
.settings-container {
  padding: 16px;
}

.title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 20px;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 16px 0;
}

.setting-info {
  max-width: 80%;
}

.setting-label {
  font-size: 16px;
  font-weight: 500;
}

.setting-desc {
  font-size: 13px;
  color: #888;
  margin-top: 4px;
}
</style>
