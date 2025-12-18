<template>
  <aside class="app-sidebar" :class="{ collapsed }">
    <div class="sidebar-header">
      <h3 v-if="!collapsed">章节导航</h3>
      <el-button
        :icon="collapsed ? Expand : Fold"
        text
        @click="$emit('toggle')"
      />
    </div>

    <div class="sidebar-content">
      <ChapterTree v-if="!collapsed" />
      <div v-else class="collapsed-hint">
        <el-icon><Menu /></el-icon>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { Expand, Fold, Menu } from '@element-plus/icons-vue'
import ChapterTree from '@/components/knowledge/ChapterTree.vue'

defineProps<{
  collapsed: boolean
}>()

defineEmits<{
  (e: 'toggle'): void
}>()
</script>

<style lang="scss" scoped>
// iOS 风格侧边栏
.app-sidebar {
  display: flex;
  flex-direction: column;
  background-color: var(--sidebar-bg);
  backdrop-filter: var(--blur-regular);
  -webkit-backdrop-filter: var(--blur-regular);
  border-right: 0.5px solid var(--separator-color);
  transition: width 0.35s var(--transition-timing);
  box-shadow: 1px 0 0 var(--separator-color);
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px var(--spacing-md);
  border-bottom: 0.5px solid var(--separator-color);
  background-color: transparent;
  min-height: 44px;

  h3 {
    margin: 0;
    font-size: 13px;
    font-weight: 600;
    color: var(--text-color-secondary);
    text-transform: uppercase;
    letter-spacing: 0.02em;
  }

  :deep(.el-button) {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    transition: all 0.2s var(--transition-timing);

    &:hover {
      background-color: var(--hover-bg);
    }

    &:active {
      transform: scale(0.92);
      background-color: var(--active-bg);
    }
  }
}

.sidebar-content {
  flex: 1;
  overflow: auto;
  padding: var(--spacing-sm);

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.1);
    border-radius: 2px;
  }
}

.collapsed-hint {
  display: flex;
  justify-content: center;
  padding-top: var(--spacing-lg);
  color: var(--text-color-tertiary);
  font-size: 20px;

  .el-icon {
    transition: transform 0.3s var(--spring-timing);
  }

  &:hover .el-icon {
    transform: scale(1.1);
  }
}

.collapsed {
  .sidebar-header {
    justify-content: center;
    padding: 14px var(--spacing-sm);
  }
}
</style>
