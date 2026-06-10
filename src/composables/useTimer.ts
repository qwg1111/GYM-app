import { ref, computed, onUnmounted } from 'vue'

/**
 * 训练计时器组合式函数
 * 提供正向计时功能，支持开始、暂停、重置
 */
export function useTimer() {
  // 计时器状态
  const seconds = ref(0)
  const isRunning = ref(false)
  let intervalId: number | null = null

  // 格式化时间显示 MM:SS
  const formattedTime = computed(() => {
    const mins = Math.floor(seconds.value / 60)
    const secs = seconds.value % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  })

  // 分钟数（用于大字体显示）
  const minutes = computed(() => String(Math.floor(seconds.value / 60)).padStart(2, '0'))
  // 秒数（用于大字体显示）
  const secs = computed(() => String(seconds.value % 60).padStart(2, '0'))

  /**
   * 开始计时
   */
  const start = () => {
    if (isRunning.value) return
    isRunning.value = true
    intervalId = window.setInterval(() => {
      seconds.value++
    }, 1000)
  }

  /**
   * 暂停计时
   */
  const pause = () => {
    isRunning.value = false
    if (intervalId !== null) {
      clearInterval(intervalId)
      intervalId = null
    }
  }

  /**
   * 重置计时器
   */
  const reset = () => {
    pause()
    seconds.value = 0
  }

  // 组件卸载时清理定时器
  onUnmounted(() => {
    if (intervalId !== null) {
      clearInterval(intervalId)
    }
  })

  return {
    seconds,
    isRunning,
    formattedTime,
    minutes,
    secs,
    start,
    pause,
    reset
  }
}