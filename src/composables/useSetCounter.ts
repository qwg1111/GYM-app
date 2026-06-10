import { ref, watch } from 'vue'

/**
 * 组数统计组合式函数
 * 提供组数增减功能，数据本地持久化
 */
export function useSetCounter() {
  // 从 localStorage 读取保存的组数，默认为 0
  const savedSets = localStorage.getItem('fitness-sets')
  const sets = ref(savedSets ? parseInt(savedSets, 10) : 0)

  // 监听组数变化，自动保存到 localStorage
  watch(sets, (newValue) => {
    localStorage.setItem('fitness-sets', String(newValue))
  })

  /**
   * 增加一组
   */
  const incrementSet = () => {
    sets.value++
  }

  /**
   * 减少一组（最小为 0）
   */
  const decrementSet = () => {
    if (sets.value > 0) {
      sets.value--
    }
  }

  /**
   * 重置组数
   */
  const resetSets = () => {
    sets.value = 0
  }

  return {
    sets,
    incrementSet,
    decrementSet,
    resetSets
  }
}