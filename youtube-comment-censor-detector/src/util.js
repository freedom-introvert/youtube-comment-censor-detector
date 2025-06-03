export function sleep(time) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, time)
  })
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