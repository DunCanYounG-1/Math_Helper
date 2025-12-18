<template>
  <header class="ios-header">
    <!-- 顶部状态栏区域 (Electron 拖拽) -->
    <div class="status-bar-area"></div>

    <!-- 主导航区 -->
    <div class="header-content">
      <!-- 左侧：Logo -->
      <div class="header-left">
        <div class="logo" @click="goHome">
          <span class="logo-icon">∑</span>
          <span class="logo-text">Math Helper</span>
        </div>
      </div>

      <!-- 中间：分段控制器导航 -->
      <nav class="header-nav">
        <div class="nav-scroll-container">
          <router-link
            v-for="item in mainNavItems"
            :key="item.path"
            :to="item.path"
            class="nav-pill"
            :class="{ active: isActive(item.path) }"
          >
            <el-icon class="nav-icon"><component :is="item.icon" /></el-icon>
            <span class="nav-label">{{ item.label }}</span>
          </router-link>
        </div>
      </nav>

      <!-- 右侧：工具按钮 -->
      <div class="header-right">
        <!-- 搜索按钮 -->
        <button class="tool-button" @click="toggleSearch" title="搜索">
          <el-icon><Search /></el-icon>
        </button>

        <!-- 更多菜单 -->
        <el-dropdown trigger="click" @command="handleCommand">
          <button class="tool-button">
            <el-icon><MoreFilled /></el-icon>
          </button>
          <template #dropdown>
            <el-dropdown-menu class="ios-dropdown-menu">
              <el-dropdown-item
                v-for="item in moreNavItems"
                :key="item.path"
                :command="item.path"
              >
                <el-icon><component :is="item.icon" /></el-icon>
                <span>{{ item.label }}</span>
              </el-dropdown-item>
              <el-dropdown-item divided command="/settings">
                <el-icon><Setting /></el-icon>
                <span>设置</span>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>

        <!-- 窗口控制按钮 (Electron) -->
        <div v-if="isElectron" class="window-controls">
          <button class="control-btn minimize" @click="minimize" title="最小化">
            <span class="control-icon"></span>
          </button>
          <button class="control-btn maximize" @click="maximize" title="最大化">
            <span class="control-icon"></span>
          </button>
          <button class="control-btn close" @click="close" title="关闭">
            <span class="control-icon"></span>
          </button>
        </div>
      </div>
    </div>

    <!-- 搜索面板 -->
    <transition name="slide-down">
      <div v-if="showSearch" class="search-panel">
        <GlobalSearch ref="searchRef" @close="showSearch = false" />
      </div>
    </transition>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  Search,
  MoreFilled,
  TrendCharts,
  Reading,
  Document,
  Star,
  Setting,
  EditPen,
  DocumentDelete,
  Notebook,
  Share,
  Opportunity,
  DataAnalysis,
  ChatDotRound
} from '@element-plus/icons-vue'
import GlobalSearch from './GlobalSearch.vue'

const router = useRouter()
const route = useRoute()
const showSearch = ref(false)
const searchRef = ref<InstanceType<typeof GlobalSearch> | null>(null)

const isElectron = computed(() => {
  return typeof window !== 'undefined' && window.electronAPI !== undefined
})

// 主导航项（显示在头部）
const mainNavItems = [
  { path: '/graph', label: '绘图', icon: TrendCharts },
  { path: '/graph-3d', label: '3D', icon: DataAnalysis },
  { path: '/learn', label: '学习', icon: Reading },
  { path: '/knowledge-graph', label: '图谱', icon: Share },
  { path: '/deep-understanding', label: '深度', icon: Opportunity },
  { path: '/practice', label: '练习', icon: EditPen },
  { path: '/ai', label: 'AI', icon: ChatDotRound },
]

// 更多导航项（折叠在菜单中）
const moreNavItems = [
  { path: '/wrong-questions', label: '错题本', icon: DocumentDelete },
  { path: '/formula', label: '公式速查', icon: Document },
  { path: '/notes', label: '笔记', icon: Notebook },
  { path: '/favorites', label: '收藏', icon: Star },
]

const isActive = (path: string) => {
  return route.path.startsWith(path)
}

const goHome = () => {
  router.push('/')
}

const toggleSearch = async () => {
  showSearch.value = !showSearch.value
  if (showSearch.value) {
    await nextTick()
    searchRef.value?.focus()
  }
}

const handleCommand = (path: string) => {
  router.push(path)
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
.ios-header {
  position: relative;
  background-color: var(--header-bg);
  backdrop-filter: var(--blur-regular);
  -webkit-backdrop-filter: var(--blur-regular);
  border-bottom: 0.5px solid var(--separator-color);
  z-index: 100;
}

.status-bar-area {
  height: 0;
  -webkit-app-region: drag;

  // Electron 环境下添加拖拽区域
  .is-electron & {
    height: 8px;
  }
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  padding: 0 16px;
  gap: 16px;
}

.header-left {
  flex-shrink: 0;
  -webkit-app-region: no-drag;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 6px 10px;
  border-radius: 8px;
  transition: background-color 0.2s;

  &:hover {
    background-color: var(--hover-bg);
  }

  &:active {
    background-color: var(--active-bg);
  }

  .logo-icon {
    font-size: 22px;
    font-weight: 600;
    color: var(--primary-color);
  }

  .logo-text {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-color);
    letter-spacing: -0.02em;
  }
}

.header-nav {
  flex: 1;
  overflow: hidden;
  -webkit-app-region: no-drag;
}

.nav-scroll-container {
  display: flex;
  gap: 4px;
  overflow-x: auto;
  padding: 4px;

  // 隐藏滚动条但保持可滚动
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
}

.nav-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 20px;
  color: var(--text-color-secondary);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  transition: all 0.25s cubic-bezier(0.25, 0.1, 0.25, 1);

  .nav-icon {
    font-size: 16px;
  }

  &:hover {
    background-color: var(--hover-bg);
    color: var(--text-color);
  }

  &:active {
    transform: scale(0.96);
  }

  &.active {
    background-color: var(--primary-color);
    color: white;
    box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3);

    .nav-icon {
      color: white;
    }
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  -webkit-app-region: no-drag;
}

.tool-button {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  color: var(--text-color-secondary);
  transition: all 0.2s;

  .el-icon {
    font-size: 20px;
  }

  &:hover {
    background-color: var(--hover-bg);
    color: var(--text-color);
  }

  &:active {
    background-color: var(--active-bg);
    transform: scale(0.95);
  }
}

// Electron 窗口控制按钮 - macOS 风格
.window-controls {
  display: flex;
  gap: 8px;
  margin-left: 8px;
  padding-left: 8px;
  border-left: 1px solid var(--separator-color);

  .control-btn {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: none;
    cursor: pointer;
    position: relative;
    transition: all 0.15s;

    .control-icon {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      opacity: 0;
      transition: opacity 0.15s;
    }

    &:hover .control-icon {
      opacity: 1;
    }

    &.minimize {
      background-color: #FFBD2E;

      .control-icon::before {
        content: '';
        display: block;
        width: 8px;
        height: 1px;
        background-color: #995700;
      }
    }

    &.maximize {
      background-color: #28C940;

      .control-icon::before {
        content: '';
        display: block;
        width: 6px;
        height: 6px;
        border: 1px solid #006500;
        border-radius: 1px;
      }
    }

    &.close {
      background-color: #FF5F57;

      .control-icon::before,
      .control-icon::after {
        content: '';
        position: absolute;
        width: 8px;
        height: 1px;
        background-color: #4D0000;
        top: 50%;
        left: 50%;
      }

      .control-icon::before {
        transform: translate(-50%, -50%) rotate(45deg);
      }

      .control-icon::after {
        transform: translate(-50%, -50%) rotate(-45deg);
      }
    }
  }
}

// 搜索面板
.search-panel {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background-color: var(--card-bg);
  border-bottom: 0.5px solid var(--separator-color);
  box-shadow: var(--box-shadow);
  z-index: 99;
}

// 搜索面板动画
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.25s cubic-bezier(0.25, 0.1, 0.25, 1);
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

// iOS 风格下拉菜单
:deep(.ios-dropdown-menu) {
  border-radius: 14px !important;
  padding: 6px !important;
  min-width: 180px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15) !important;
  border: none !important;

  .el-dropdown-menu__item {
    border-radius: 8px;
    padding: 10px 12px;
    font-size: 15px;
    display: flex;
    align-items: center;
    gap: 10px;

    .el-icon {
      font-size: 18px;
      color: var(--text-color-secondary);
    }

    &:hover {
      background-color: var(--hover-bg);
    }

    &:active {
      background-color: var(--active-bg);
    }
  }

  .el-dropdown-menu__item--divided {
    margin-top: 6px;
    padding-top: 10px;
    border-top: 0.5px solid var(--separator-color);

    &::before {
      display: none;
    }
  }
}

// 响应式：小屏幕隐藏文字
@media (max-width: 900px) {
  .nav-label {
    display: none;
  }

  .nav-pill {
    padding: 8px 10px;
  }

  .logo-text {
    display: none;
  }
}
</style>
