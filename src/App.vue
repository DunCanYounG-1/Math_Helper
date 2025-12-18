<template>
  <el-config-provider :locale="zhCn">
    <div id="app" :class="{ 'is-electron': isElectron }">
      <MainLayout>
        <router-view />
      </MainLayout>
      <!-- 全局快捷键帮助 -->
      <ShortcutsHelp />
    </div>
  </el-config-provider>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { ElConfigProvider } from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import MainLayout from './layouts/MainLayout.vue'
import ShortcutsHelp from './components/common/ShortcutsHelp.vue'
import { useKnowledgeStore } from '@/stores/knowledgeStore'
import { useProgressStore } from '@/stores/progressStore'

const isElectron = computed(() => {
  return typeof window !== 'undefined' && window.electronAPI !== undefined
})

// 窗口可见性变化处理（修复图表渲染问题）
const triggerChartsRefresh = () => {
  // 触发自定义事件，让所有图表组件监听并刷新
  window.dispatchEvent(new CustomEvent('app:window-visible'))
  // 同时触发resize事件作为备用方案
  window.dispatchEvent(new Event('resize'))
}

// 存储清理函数
let cleanupFns: Array<() => void> = []

// 全局一次性加载数据，避免每个视图重复加载
onMounted(async () => {
  const knowledgeStore = useKnowledgeStore()
  const progressStore = useProgressStore()

  // 并行加载数据
  await knowledgeStore.loadKnowledgeData()
  progressStore.loadFromStorage()

  // 监听浏览器visibilitychange事件（Web环境和Electron都生效）
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      triggerChartsRefresh()
    }
  }
  document.addEventListener('visibilitychange', handleVisibilityChange)
  cleanupFns.push(() => document.removeEventListener('visibilitychange', handleVisibilityChange))

  // Electron环境：监听窗口事件
  if (window.electronAPI) {
    const api = window.electronAPI.window
    cleanupFns.push(api.onFocus(triggerChartsRefresh))
    cleanupFns.push(api.onShow(triggerChartsRefresh))
    cleanupFns.push(api.onRestore(triggerChartsRefresh))
  }
})

onUnmounted(() => {
  // 清理所有事件监听
  cleanupFns.forEach(fn => fn())
  cleanupFns = []
})
</script>

<style lang="scss">
#app {
  width: 100%;
  height: 100vh;
  overflow: hidden;

  &.is-electron {
    // Electron环境下的特殊样式
  }
}
</style>
