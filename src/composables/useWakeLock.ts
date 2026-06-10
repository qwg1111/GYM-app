import { ref, onUnmounted } from 'vue'

/**
 * 屏幕常亮组合式函数
 * 使用 Wake Lock API 防止手机自动锁屏
 */
export function useWakeLock() {
  const isActive = ref(false)
  let wakeLock: WakeLockSentinel | null = null

  /**
   * 请求屏幕常亮
   */
  const requestWakeLock = async () => {
    try {
      // 检查浏览器是否支持 Wake Lock API
      if ('wakeLock' in navigator) {
        wakeLock = await navigator.wakeLock.request('screen')
        isActive.value = true

        // 监听释放事件
        wakeLock.addEventListener('release', () => {
          isActive.value = false
          wakeLock = null
        })
      } else {
        console.warn('当前浏览器不支持 Wake Lock API')
      }
    } catch (error) {
      console.warn('无法获取屏幕常亮权限:', error)
    }
  }

  /**
   * 释放屏幕常亮
   */
  const releaseWakeLock = async () => {
    if (wakeLock !== null) {
      await wakeLock.release()
      wakeLock = null
      isActive.value = false
    }
  }

  // 组件卸载时释放
  onUnmounted(() => {
    releaseWakeLock()
  })

  return {
    isActive,
    requestWakeLock,
    releaseWakeLock
  }
}