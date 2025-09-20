import { defineStore } from "pinia";

export const useSettingsStore = defineStore("settings", {
  state: () => {
    return JSON.parse(localStorage.getItem('yt-ccd-settings')) || {
      forceTimeSort: false,
      showBlockedHotComments: false
    }
  }
});
