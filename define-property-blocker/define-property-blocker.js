// 保存原始 defineProperty
const originalDefineProperty = Object.defineProperty;

// 需要拦截的对象和属性列表
const blockedList = [
  [window, 'fetch'],
  [window, 'JSON'],
  [window.JSON, 'stringify'],
  [window.JSON, 'parse'],
  [window, 'Array'],
  [Array.prototype, 'push'],
  [Array.prototype, 'forEach']
];

// 劫持 defineProperty
Object.defineProperty = function(obj, prop, descriptor) {
  // 遍历拦截列表，匹配对象和属性
  for (const [blockedObj, blockedProp] of blockedList) {
    if (obj === blockedObj && prop === blockedProp) {
      console.log('干你娘，休想锁死', obj, prop, descriptor);
      return;
    }
  }

  return originalDefineProperty(obj, prop, descriptor);
};