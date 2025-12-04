<template>
  <div class="main-layout">
    <!-- 自定义标题栏 (Electron) -->
    <AppHeader class="layout-header" />

    <div class="layout-body">
      <!-- 侧边栏 -->
      <AppSidebar
        v-if="showSidebar"
        class="layout-sidebar"
        :collapsed="sidebarCollapsed"
        @toggle="toggleSidebar"
      />

      <!-- 主内容区 -->
      <main class="layout-main">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from '@/components/common/AppHeader.vue'
import AppSidebar from '@/components/common/AppSidebar.vue'

const route = useRoute()
const sidebarCollapsed = ref(false)

// 只在知识学习页面显示章节导航侧边栏
const showSidebar = computed(() => {
  const sidebarRoutes = ['Learn', 'LearnDetail']
  return sidebarRoutes.includes(route.name as string)
})

const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}
</script>

<style lang="scss" scoped>
.main-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: var(--bg-color);
}

.layout-header {
  flex-shrink: 0;
  height: 48px;
  -webkit-app-region: drag; // Electron拖拽区域
}

.layout-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.layout-sidebar {
  flex-shrink: 0;
  width: 260px;
  transition: width 0.3s;

  &.collapsed {
    width: 64px;
  }
}

.layout-main {
  flex: 1;
  overflow: auto;
  padding: 20px;
}
</style>
