<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTimer } from './composables/useTimer'
import { useSetCounter } from './composables/useSetCounter'
import { useRestTimer } from './composables/useRestTimer'
import { useWakeLock } from './composables/useWakeLock'

// 初始化各个组合式函数
const timer = useTimer()
const setCounter = useSetCounter()
const restTimer = useRestTimer()
const wakeLock = useWakeLock()

// 应用模式：idle-空闲、training-训练中、resting-休息中
type AppMode = 'idle' | 'training' | 'resting'
const appMode = ref<AppMode>('idle')

// 设置弹窗控制
const showSettings = ref(false)
const tempRestDuration = ref(restTimer.restDuration.value)

// 记录每组训练时间的数组
const setTimeRecords = ref<string[]>([])

/**
 * 增加组数并记录当前训练时间
 */
const handleIncrementSet = () => {
  // 记录当前训练时间
  setTimeRecords.value.push(timer.formattedTime.value)
  // 增加组数
  setCounter.incrementSet()
}

/**
 * 减少组数并删除最后一条时间记录
 */
const handleDecrementSet = () => {
  if (setCounter.sets.value > 0) {
    // 删除最后一条时间记录
    setTimeRecords.value.pop()
    // 减少组数
    setCounter.decrementSet()
  }
}

/**
 * 开始训练
 */
const handleStartTraining = async () => {
  appMode.value = 'training'
  timer.start()
  // 请求屏幕常亮
  await wakeLock.requestWakeLock()
}

/**
 * 暂停训练
 */
const handlePauseTraining = () => {
  timer.pause()
}

/**
 * 继续训练
 */
const handleResumeTraining = () => {
  timer.start()
}

/**
 * 重置训练
 */
const handleResetTraining = () => {
  timer.reset()
  appMode.value = 'idle'
  // 重置组数
  setCounter.resetSets()
  // 清空时间记录
  setTimeRecords.value = []
  // 释放屏幕常亮
  wakeLock.releaseWakeLock()
}

/**
 * 开始休息
 */
const handleStartRest = async () => {
  // 先暂停训练计时
  timer.pause()
  appMode.value = 'resting'
  restTimer.startRest()
  // 请求屏幕常亮
  await wakeLock.requestWakeLock()
}

/**
 * 结束休息，回到训练
 */
const handleEndRest = () => {
  restTimer.resetRest()
  appMode.value = 'training'
}

/**
 * 关闭休息完成提示
 */
const handleDismissRest = () => {
  restTimer.dismissFinished()
  appMode.value = 'idle'
  wakeLock.releaseWakeLock()
}

/**
 * 打开设置
 */
const handleOpenSettings = () => {
  tempRestDuration.value = restTimer.restDuration.value
  showSettings.value = true
}

/**
 * 保存设置
 */
const handleSaveSettings = () => {
  restTimer.setRestDuration(tempRestDuration.value)
  showSettings.value = false
}

// 计算当前状态文字
const statusText = computed(() => {
  switch (appMode.value) {
    case 'idle':
      return '准备开始'
    case 'training':
      return '训练中'
    case 'resting':
      return '休息中'
    default:
      return ''
  }
})
</script>

<template>
  <div class="app" :class="[`mode-${appMode}`]">
    <!-- 顶部状态栏 -->
    <header class="status-bar">
      <span class="status-text">{{ statusText }}</span>
      <button class="settings-btn" @click="handleOpenSettings" title="设置">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
      </button>
    </header>

    <!-- 计时器显示区域 -->
    <main class="timer-section">
      <!-- 训练计时器 -->
      <div v-if="appMode !== 'resting'" class="timer-display">
        <div class="timer-digits">
          <span class="digit">{{ timer.minutes.value }}</span>
          <span class="separator">:</span>
          <span class="digit">{{ timer.secs.value }}</span>
        </div>
        <div class="timer-label">训练时间</div>
      </div>

      <!-- 休息计时器 -->
      <div v-else class="timer-display rest-mode">
        <div class="timer-digits">
          <span class="digit">{{ restTimer.minutes.value }}</span>
          <span class="separator">:</span>
          <span class="digit">{{ restTimer.secs.value }}</span>
        </div>
        <div class="timer-label">休息剩余</div>
        <!-- 进度条 -->
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: `${restTimer.progress.value}%` }"></div>
        </div>
      </div>

      <!-- 组数显示 -->
      <div class="sets-section">
        <div class="sets-display">
          <span class="sets-number">{{ setCounter.sets.value }}</span>
          <span class="sets-label">组</span>
        </div>
        <div class="sets-controls">
          <button
            class="set-btn decrease"
            @click="handleDecrementSet"
            :disabled="appMode !== 'training' || setCounter.sets.value <= 0"
          >
            -
          </button>
          <button
            class="set-btn increase"
            @click="handleIncrementSet"
            :disabled="appMode !== 'training'"
          >
            +
          </button>
        </div>
        <!-- 每组时间记录 -->
        <div v-if="setTimeRecords.length > 0" class="time-records">
          <div
            v-for="(time, index) in setTimeRecords"
            :key="index"
            class="time-record-item"
          >
            <span class="record-label">第{{ index + 1 }}组</span>
            <span class="record-time">{{ time }}</span>
          </div>
        </div>
      </div>
    </main>

    <!-- 底部控制按钮 -->
    <footer class="controls-section">
      <!-- 空闲状态 -->
      <div v-if="appMode === 'idle'" class="controls-row">
        <button class="control-btn primary large" @click="handleStartTraining">
          开始训练
        </button>
      </div>

      <!-- 训练状态 -->
      <div v-else-if="appMode === 'training'" class="controls-row">
        <button class="control-btn secondary" @click="handleResetTraining">
          重置
        </button>
        <button
          class="control-btn primary"
          @click="timer.isRunning.value ? handlePauseTraining() : handleResumeTraining()"
        >
          {{ timer.isRunning.value ? '暂停' : '继续' }}
        </button>
        <button class="control-btn accent" @click="handleStartRest">
          开始休息
        </button>
      </div>

      <!-- 休息状态 -->
      <div v-else-if="appMode === 'resting'" class="controls-row">
        <button class="control-btn secondary" @click="handleEndRest">
          跳过休息
        </button>
      </div>
    </footer>

    <!-- 休息完成提示弹窗 -->
    <div v-if="restTimer.isFinished.value" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-icon">⏰</div>
        <h2 class="modal-title">休息结束！</h2>
        <p class="modal-text">准备开始下一组训练</p>
        <div class="modal-actions">
          <button class="control-btn primary" @click="handleDismissRest">
            确定
          </button>
        </div>
      </div>
    </div>

    <!-- 设置弹窗 -->
    <div v-if="showSettings" class="modal-overlay">
      <div class="modal-content">
        <h2 class="modal-title">设置</h2>
        <div class="setting-item">
          <label class="setting-label">休息时长（秒）</label>
          <div class="setting-input-group">
            <button
              class="set-btn decrease"
              @click="tempRestDuration = Math.max(30, tempRestDuration - 30)"
            >
              -
            </button>
            <span class="setting-value">{{ tempRestDuration }}</span>
            <button
              class="set-btn increase"
              @click="tempRestDuration = Math.min(600, tempRestDuration + 30)"
            >
              +
            </button>
          </div>
          <div class="setting-presets">
            <button
              v-for="preset in [60, 90, 120, 180]"
              :key="preset"
              class="preset-btn"
              :class="{ active: tempRestDuration === preset }"
              @click="tempRestDuration = preset"
            >
              {{ preset }}秒
            </button>
          </div>
        </div>
        <div class="modal-actions">
          <button class="control-btn secondary" @click="showSettings = false">
            取消
          </button>
          <button class="control-btn primary" @click="handleSaveSettings">
            保存
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 应用容器 */
.app {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  transition: background-color 0.3s ease;
  padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
}

/* 不同模式的背景色 */
.mode-idle {
  background-color: var(--bg-primary);
}

.mode-training {
  background-color: var(--bg-training);
}

.mode-resting {
  background-color: var(--bg-resting);
}

/* 顶部状态栏 */
.status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
}

.status-text {
  font-size: 18px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 2px;
}

.settings-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.settings-btn:hover {
  background-color: var(--bg-secondary);
  color: var(--text-primary);
}

.settings-btn svg {
  width: 24px;
  height: 24px;
}

/* 计时器显示区域 */
.timer-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 40px;
  padding: 20px;
}

.timer-display {
  text-align: center;
}

.timer-digits {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 4px;
}

.digit {
  font-size: 96px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  letter-spacing: -2px;
}

.separator {
  font-size: 80px;
  font-weight: 300;
  opacity: 0.6;
  animation: blink 1s ease-in-out infinite;
}

@keyframes blink {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 0.2; }
}

.timer-label {
  font-size: 16px;
  color: var(--text-secondary);
  margin-top: 8px;
  text-transform: uppercase;
  letter-spacing: 2px;
}

/* 休息模式特殊样式 */
.rest-mode .digit {
  color: var(--color-accent);
}

.progress-bar {
  width: 200px;
  height: 4px;
  background-color: var(--bg-secondary);
  border-radius: 2px;
  margin: 16px auto 0;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: var(--color-accent);
  border-radius: 2px;
  transition: width 1s linear;
}

/* 组数显示区域 */
.sets-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.sets-display {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.sets-number {
  font-size: 72px;
  font-weight: 700;
  line-height: 1;
}

.sets-label {
  font-size: 24px;
  color: var(--text-secondary);
}

.sets-controls {
  display: flex;
  gap: 16px;
}

.set-btn {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  border: 2px solid var(--border-color);
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 28px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.set-btn:hover:not(:disabled) {
  background-color: var(--bg-tertiary);
  transform: scale(1.05);
}

.set-btn:active:not(:disabled) {
  transform: scale(0.95);
}

.set-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.set-btn.decrease {
  border-color: var(--color-danger);
  color: var(--color-danger);
}

.set-btn.increase {
  border-color: var(--color-success);
  color: var(--color-success);
}

/* 时间记录样式 */
.time-records {
  width: 100%;
  max-width: 300px;
  margin-top: 12px;
}

.time-record-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: var(--bg-secondary);
  border-radius: 10px;
  margin-bottom: 8px;
}

.record-label {
  color: var(--text-secondary);
  font-weight: 500;
  font-size: 16px;
}

.record-time {
  color: var(--color-accent);
  font-weight: 700;
  font-size: 20px;
  font-variant-numeric: tabular-nums;
}

/* 底部控制按钮 */
.controls-section {
  padding: 20px;
  padding-bottom: calc(20px + env(safe-area-inset-bottom));
}

.controls-row {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.control-btn {
  padding: 16px 24px;
  border-radius: 12px;
  border: none;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 100px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.control-btn:hover {
  transform: translateY(-2px);
}

.control-btn:active {
  transform: translateY(0);
}

.control-btn.primary {
  background-color: var(--color-primary);
  color: white;
}

.control-btn.primary:hover {
  background-color: var(--color-primary-hover);
}

.control-btn.secondary {
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.control-btn.secondary:hover {
  background-color: var(--bg-tertiary);
}

.control-btn.accent {
  background-color: var(--color-accent);
  color: white;
}

.control-btn.accent:hover {
  background-color: var(--color-accent-hover);
}

.control-btn.large {
  padding: 20px 48px;
  font-size: 20px;
  min-width: 200px;
}

/* 弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 100;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  background-color: var(--bg-secondary);
  border-radius: 20px;
  padding: 32px;
  width: 100%;
  max-width: 320px;
  text-align: center;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.modal-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.modal-title {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 8px;
}

.modal-text {
  font-size: 16px;
  color: var(--text-secondary);
  margin-bottom: 24px;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.modal-actions .control-btn {
  flex: 1;
}

/* 设置弹窗样式 */
.setting-item {
  margin: 24px 0;
  text-align: left;
}

.setting-label {
  display: block;
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 12px;
}

.setting-input-group {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.setting-input-group .set-btn {
  width: 48px;
  height: 48px;
  font-size: 20px;
}

.setting-value {
  font-size: 32px;
  font-weight: 700;
  min-width: 80px;
  text-align: center;
}

.setting-presets {
  display: flex;
  gap: 8px;
  margin-top: 16px;
  flex-wrap: wrap;
  justify-content: center;
}

.preset-btn {
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background-color: var(--bg-primary);
  color: var(--text-primary);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.preset-btn:hover {
  background-color: var(--bg-tertiary);
}

.preset-btn.active {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}
</style>
