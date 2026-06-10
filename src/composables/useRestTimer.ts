import { ref, computed, onUnmounted, watch } from 'vue'

/**
 * 休息计时器组合式函数
 * 提供倒计时功能，支持自定义时长、提醒弹窗和震动
 */
export function useRestTimer() {
  // 从 localStorage 读取保存的休息时长，默认 120 秒
  const savedDuration = localStorage.getItem('rest-duration')
  const restDuration = ref(savedDuration ? parseInt(savedDuration, 10) : 120)

  // 倒计时剩余秒数
  const remainingSeconds = ref(restDuration.value)
  const isRunning = ref(false)
  const isFinished = ref(false)
  let intervalId: number | null = null

  // 监听休息时长变化，自动保存
  watch(restDuration, (newValue) => {
    localStorage.setItem('rest-duration', String(newValue))
  })

  // 格式化时间显示 MM:SS
  const formattedTime = computed(() => {
    const mins = Math.floor(remainingSeconds.value / 60)
    const secs = remainingSeconds.value % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  })

  // 分钟数和秒数（用于大字体显示）
  const minutes = computed(() => String(Math.floor(remainingSeconds.value / 60)).padStart(2, '0'))
  const secs = computed(() => String(remainingSeconds.value % 60).padStart(2, '0'))

  // 进度百分比（用于进度条）
  const progress = computed(() => {
    return ((restDuration.value - remainingSeconds.value) / restDuration.value) * 100
  })

  /**
   * 播放提示音
   */
  const playNotificationSound = () => {
    // 使用 Web Audio API 生成简单的提示音
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      // 设置音频参数
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1)
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2)

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.5)
    } catch (error) {
      console.warn('无法播放提示音:', error)
    }
  }

  /**
   * 触发震动
   */
  const vibrate = () => {
    if ('vibrate' in navigator) {
      // 震动模式：震200ms，停100ms，震200ms，停100ms，震200ms
      navigator.vibrate([200, 100, 200, 100, 200])
    }
  }

  /**
   * 开始休息倒计时
   */
  const startRest = () => {
    if (isRunning.value) return

    // 重置状态
    remainingSeconds.value = restDuration.value
    isFinished.value = false
    isRunning.value = true

    intervalId = window.setInterval(() => {
      remainingSeconds.value--

      if (remainingSeconds.value <= 0) {
        // 倒计时结束
        clearInterval(intervalId!)
        intervalId = null
        isRunning.value = false
        isFinished.value = true

        // 播放提示音和震动
        playNotificationSound()
        vibrate()
      }
    }, 1000)
  }

  /**
   * 暂停休息
   */
  const pauseRest = () => {
    isRunning.value = false
    if (intervalId !== null) {
      clearInterval(intervalId)
      intervalId = null
    }
  }

  /**
   * 重置休息计时器
   */
  const resetRest = () => {
    pauseRest()
    remainingSeconds.value = restDuration.value
    isFinished.value = false
  }

  /**
   * 关闭完成提示
   */
  const dismissFinished = () => {
    isFinished.value = false
  }

  /**
   * 设置休息时长（秒）
   */
  const setRestDuration = (seconds: number) => {
    restDuration.value = seconds
    if (!isRunning.value) {
      remainingSeconds.value = seconds
    }
  }

  // 组件卸载时清理定时器
  onUnmounted(() => {
    if (intervalId !== null) {
      clearInterval(intervalId)
    }
  })

  return {
    restDuration,
    remainingSeconds,
    isRunning,
    isFinished,
    formattedTime,
    minutes,
    secs,
    progress,
    startRest,
    pauseRest,
    resetRest,
    dismissFinished,
    setRestDuration
  }
}