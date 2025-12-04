<template>
  <header class="app-header">
    <div class="header-left">
      <div class="logo" @click="goHome">
        <span class="logo-icon">∑</span>
        <span class="logo-text">Math Helper</span>
      </div>
    </div>

    <nav class="header-nav">
      <router-link
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="nav-item"
        :class="{ active: isActive(item.path) }"
      >
        <el-icon><component :is="item.icon" /></el-icon>
        <span>{{ item.label }}</span>
      </router-link>
    </nav>

    <div class="header-right">
      <!-- 全局搜索 -->
      <GlobalSearch class="header-search" />
      <!-- 窗口控制按钮 (Electron) -->
      <div v-if="isElectron" class="window-controls">
        <button class="control-btn" @click="minimize" title="最小化">
          <el-icon><Minus /></el-icon>
        </button>
        <button class="control-btn" @click="maximize" title="最大化">
          <el-icon><FullScreen /></el-icon>
        </button>
        <button class="control-btn close" @click="close" title="关闭">
          <el-icon><Close /></el-icon>
        </button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  Minus,
  FullScreen,
  Close,
  TrendCharts,
  Reading,
  Document,
  Star,
  Setting,
  EditPen,
  DocumentDelete,
  Notebook
} from '@element-plus/icons-vue'
import GlobalSearch from './GlobalSearch.vue'

const router = useRouter()
const route = useRoute()

const isElectron = computed(() => {
  return typeof window !== 'undefined' && window.electronAPI !== undefined
})

const navItems = [
  { path: '/graph', label: '函数绘图', icon: TrendCharts },
  { path: '/learn', label: '知识学习', icon: Reading },
  { path: '/practice', label: '例题练习', icon: EditPen },
  { path: '/wrong-questions', label: '错题本', icon: DocumentDelete },
  { path: '/formula', label: '公式速查', icon: Document },
  { path: '/notes', label: '笔记', icon: Notebook },
  { path: '/favorites', label: '收藏', icon: Star },
  { path: '/settings', label: '设置', icon: Setting }
]

const isActive = (path: string) => {
  return route.path.startsWith(path)
}

const goHome = () => {
  router.push('/')
}

// Electron窗口控制
const minimize = () => {
  window.electronAPI?.window.minimize()
}

const maximize = () => {
  window.electronAPI?.window.maximize()
}

const close = () => {
  window.electronAPI?.window.close()
}
</script>

<style lang="scss" scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  padding: 0 16px;
  background-color: var(--header-bg);
  border-bottom: 1px solid var(--border-color);
  -webkit-app-region: drag;
}

.header-left {
  -webkit-app-region: no-drag;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-weight: 600;

  .logo-icon {
    font-size: 24px;
    color: var(--primary-color);
  }

  .logo-text {
    font-size: 16px;
    color: var(--text-color);
  }
}

.header-nav {
  display: flex;
  gap: 4px;
  -webkit-app-region: no-drag;

  .nav-item {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border-radius: 6px;
    color: var(--text-color-secondary);
    text-decoration: none;
    font-size: 14px;
    transition: all 0.2s;

    &:hover {
      background-color: var(--hover-bg);
      color: var(--text-color);
    }

    &.active {
      background-color: var(--primary-color-light);
      color: var(--primary-color);
    }
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
  -webkit-app-region: no-drag;
}

.header-search {
  margin-right: 8px;
}

.window-controls {
  display: flex;
  gap: 4px;

  .control-btn {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: transparent;
    border-radius: 4px;
    cursor: pointer;
    color: var(--text-color-secondary);

    &:hover {
      background-color: var(--hover-bg);
      color: var(--text-color);
    }

    &.close:hover {
      background-color: #e81123;
      color: white;
    }
  }
}
</style>
