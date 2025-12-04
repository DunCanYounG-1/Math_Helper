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
.app-sidebar {
  display: flex;
  flex-direction: column;
  background-color: var(--sidebar-bg);
  border-right: 1px solid var(--border-color);
  transition: width 0.3s;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);

  h3 {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: var(--text-color);
  }
}

.sidebar-content {
  flex: 1;
  overflow: auto;
  padding: 12px;
}

.collapsed-hint {
  display: flex;
  justify-content: center;
  padding-top: 20px;
  color: var(--text-color-secondary);
  font-size: 20px;
}
</style>
