export function sleep(time) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, time)
  })
}

/**
 * 替换 URL 安全的字符为标准 Base64 字符
 * @param {String} urlSafeBase64 
 * @returns 
 */
export function urlSafeBase64ToStandard(urlSafeBase64) {
  let standardBase64 = urlSafeBase64
      .replace(/%3D/g, '=')  // 替换 %3D 为 =
      .replace(/-/g, '+')    // 替换 - 为 +
      .replace(/_/g, '/');    // 替换 _ 为 /
  
  return standardBase64;
}
/**
 * 替换标准 Base64 字符为 URL 安全字符
 * @param {String} standardBase64 
 * @returns 
 */
export function standardBase64ToUrlSafe(standardBase64) {
  let urlSafeBase64 = standardBase64
      .replace(/=/g, '%3D')  // 替换 = 为 %3D
      .replace(/\+/g, '-')   // 替换 + 为 -
      .replace(/\//g, '_');  // 替换 / 为 _
  
  return urlSafeBase64;
}

export function createUrl(path) {
  return new URL(new URL(window.location.href).origin + path);
}

export function formatSecondsToMMSS(seconds) {
  // 确保 seconds 是数字类型
  const sec = parseInt(seconds, 10);
  
  // 计算分钟和秒
  const minutes = Math.floor(sec / 60);
  const remainingSeconds = sec % 60;
  
  // 格式化为两位数，不足补零
  const formattedMinutes = String(minutes).padStart(2, '0');
  const formattedSeconds = String(remainingSeconds).padStart(2, '0');
  
  // 返回 mm:ss 格式
  return `${formattedMinutes}:${formattedSeconds}`;
}

export function formatTimestamp(timestamp) {
  if(!timestamp){
    return "--:--:--"
  }
  // 创建一个新的Date对象
  const date = new Date(timestamp);
  
  // 获取各个时间部分
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // 月份从0开始，所以要+1
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  // 拼接成目标格式
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export function translateState(state){
  switch (state) {
    case "NORMAL":
      return "正常";
    case "DELETED":
      return "已删除";
    case "SHADOW_BAN":
      return "仅自己可见";
    case "NOT_CHECK":
      return "还未检查"
  }
}

 /**
 * 从一个单键值对对象数组中，根据给定的键查找并返回对应的值。
 * 这种结构常见于需要保持键值对独立性的数据格式。
 * by ai
 * @param {Array<Object>} data - 包含单键值对对象的数组。
 * @param {string} key - 要查找的键。
 * @returns {*} 返回找到的值，如果键不存在则返回 undefined。
 */
export function findValueInSingleEntryArray(data, key) {
  for (const item of data) {
    if (item.hasOwnProperty(key)) {
      return item[key];
    }
  }
  return undefined;
}