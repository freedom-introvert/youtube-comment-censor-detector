<template>
  <div class="youtube-comment">
    <div class="avatar-container">
      <a :href="'https://www.youtube.com/' + comment.userDisplayName" target="_blank" rel="noopener noreferrer">
        <img :src="comment.userProfileImageUrl" :alt="comment.authorDisplayName" class="avatar" />
      </a>
    </div>

    <div class="comment-content">
      <div class="comment-header">
        <a :href="'https://www.youtube.com/' + comment.userDisplayName" target="_blank" rel="noopener noreferrer"
          class="author-name">
          {{ comment.userDisplayName }}
        </a>
        <span class="published-at">{{ comment.publishedTime }}</span>
      </div>

      <p class="comment-text">{{ comment.contentText }}</p>

      <div class="comment-actions">
        <button class="button" @click="ElMessage.info('需要点赞评论请定位至评论')">
          <svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path
              d="M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.31C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3z" />
          </svg>
          <span class="action-text">{{ comment.likeCount }}</span>
        </button>
        <button class="button" @click="ElMessage.info('需要查看回复请定位评论查看')">
          <svg t="1756005965374" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"
            p-id="5216" width="200" height="200">
            <path
              d="M1024 640l-3.5 41.6c-6.5 78.1-27.7 154-62.2 223.9-7.5 15.2-30.4 10-30.4-7V800c0-61.9-25.1-117.9-65.6-158.4C821.9 601.1 765.9 576 704 576H552c-4.4 0-8 3.6-8 8v179.6c0 13.9-16.5 21.2-26.8 11.8L160 447.9 516.5 76.7c10-10.4 27.5-3.3 27.5 11.1V280c0 4.4 3.6 8 8 8h120c97.2 0 185.2 39.4 248.9 103.1S1024 542.8 1024 640z"
              p-id="5217"></path>
            <path
              d="M356.7 95.1L0 453.1l357.3 326.1c10.3 9.4 26.8 2.1 26.8-11.8 0-32.1-13.5-62.7-37.2-84.4L92.5 450.9l258.2-259.1c21.3-21.4 33.3-50.4 33.3-80.6v-4.8c0-14.3-17.3-21.4-27.3-11.3z"
              p-id="5218"></path>
          </svg>
          <span class="action-text">{{ comment.replyCount }}</span>
        </button>
        <a class="button" :href="comment.url" target="_blank">
          <svg t="1756007306700" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"
            p-id="7302" width="200" height="200">
            <path
              d="M511.36599 512.177066m-201.557982 0a201.557983 201.557983 0 1 0 403.115965 0 201.557983 201.557983 0 1 0-403.115965 0Z"
              p-id="7303"></path>
            <path
              d="M990.163299 477.654949h-78.434431a34.350763 34.350763 0 0 0-5.883154 0.514062c-16.278629-191.288167-168.532358-343.770368-359.706288-360.357433a33.619652 33.619652 0 0 0 0.376979-5.060655V34.270797a34.270797 34.270797 0 0 0-68.541595 0v78.434432a35.059026 35.059026 0 0 0 0.354132 4.923571c-191.790805 15.844532-344.798492 168.372427-361.385558 359.957608a34.556387 34.556387 0 0 0-4.226732-0.274167H34.270797a34.270797 34.270797 0 1 0 0 68.541595h78.445855a32.762882 32.762882 0 0 0 4.12392-0.262743c16.02731 192.076395 169.217774 345.17547 361.328439 361.134239a34.853401 34.853401 0 0 0-0.308437 4.569439v78.434432a34.270797 34.270797 0 0 0 68.541595 0v-78.480126a34.670623 34.670623 0 0 0-0.319861-4.649405c191.368132-16.621337 343.747521-169.377704 359.843372-360.905766a35.001908 35.001908 0 0 0 5.837459 0.502638h78.434431a34.270797 34.270797 0 0 0 34.270798-34.270797 34.270797 34.270797 0 0 0-34.305069-34.270798z m-177.065786 161.940941a328.656946 328.656946 0 1 1 25.703098-127.418824 326.440768 326.440768 0 0 1-25.748792 127.418824z"
              p-id="7304"></path>
          </svg>
          <span class="action-text">定位</span>
        </a>
      </div>
      <slot></slot>
    </div>
  </div>
</template>
<script setup>
import { ElMessage } from 'element-plus';

const props = defineProps(["comment"])

</script>

<style scoped>
.youtube-comment {
  display: flex;
  align-items: flex-start;
  padding: 16px;
  gap: 16px;
  font-family: 'Roboto', sans-serif;
  /* color: #f1f1f1; */
}

.avatar-container {
  flex-shrink: 0;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.comment-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.author-name {
  font-size: 13px;
  font-weight: 500;
  color: black;
  text-decoration: none;
  transition: color 0.2s ease;
}

.published-at {
  font-size: 12px;
  color: #aaa;
}

.comment-text {
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
}

.comment-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

.button {
  display: flex;
  align-items: center;
  gap: 4px;
  background-color: transparent;
  border: none;
  cursor: pointer;
  color: #aaa;
  font-size: 12px;
  transition: color 0.2s ease;
  text-decoration: none;
  padding: 1px 6px;
  /* height: 16px; */
}

.button:hover {
  color: #f1f1f1;
}

.icon {
  width: 16px;
  height: 16px;
  fill: currentColor;
}

.action-text {
  line-height: 100%;
}
</style>