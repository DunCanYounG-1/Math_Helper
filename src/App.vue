<template>
  <div id="app" :class="{ 'is-electron': isElectron }">
    <MainLayout>
      <router-view />
    </MainLayout>
    <!-- 全局快捷键帮助 -->
    <ShortcutsHelp />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import MainLayout from './layouts/MainLayout.vue'
import ShortcutsHelp from './components/common/ShortcutsHelp.vue'

const isElectron = computed(() => {
  return typeof window !== 'undefined' && window.electronAPI !== undefined
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
