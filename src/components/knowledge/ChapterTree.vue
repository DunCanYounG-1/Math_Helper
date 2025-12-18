<template>
  <div class="chapter-tree">
    <!-- 搜索框 -->
    <div class="tree-search">
      <el-input
        v-model="searchKeyword"
        size="small"
        placeholder="搜索知识点..."
        clearable
        :prefix-icon="Search"
        @input="handleSearch"
      />
    </div>

    <!-- 搜索结果 -->
    <div v-if="searchKeyword && searchResults.length > 0" class="search-results">
      <div class="search-header">
        <span>找到 {{ searchResults.length }} 个结果</span>
        <el-button text size="small" @click="clearSearch">清除</el-button>
      </div>
      <div class="search-list">
        <div
          v-for="item in searchResults"
          :key="item.id"
          class="search-item"
          :class="{ active: isActive(item) }"
          @click="handleSearchItemClick(item)"
        >
          <el-icon v-if="item.hasVisualization" class="vis-icon"><VideoPlay /></el-icon>
          <div class="search-item-content">
            <span class="search-item-title" v-html="highlightKeyword(item.title)"></span>
            <span class="search-item-path">{{ item.chapterTitle }} / {{ item.sectionTitle }}</span>
          </div>
          <el-tag v-if="item.examFrequency === 'very-high'" size="small" type="danger">必考</el-tag>
        </div>
      </div>
    </div>

    <!-- 无搜索结果 -->
    <div v-else-if="searchKeyword && searchResults.length === 0" class="search-empty">
      <el-icon><Search /></el-icon>
      <span>未找到相关知识点</span>
    </div>

    <!-- 章节树（非搜索状态显示） -->
    <template v-if="!searchKeyword">
      <!-- 章节筛选 -->
      <div class="tree-filter">
        <el-select
          v-model="filterType"
          size="small"
          placeholder="筛选"
          clearable
        >
          <el-option label="全部知识点" value="" />
          <el-option label="必考知识点" value="very-high" />
          <el-option label="高频知识点" value="high" />
          <el-option label="有可视化" value="visualization" />
        </el-select>
      </div>

    <div v-if="isLoading" class="loading-state">
      <el-icon class="is-loading"><Loading /></el-icon>
      <span>加载中...</span>
    </div>

    <el-tree
      v-else
      ref="treeRef"
      :data="filteredTreeData"
      :props="treeProps"
      :expand-on-click-node="false"
      :default-expanded-keys="expandedKeys"
      node-key="id"
      highlight-current
      @node-click="handleNodeClick"
      @node-expand="handleNodeExpand"
      @node-collapse="handleNodeCollapse"
    >
      <template #default="{ data }">
        <!-- 章节节点 -->
        <div v-if="data.isChapter" class="tree-node chapter-node">
          <span class="chapter-icon">{{ getChapterIcon(data.order) }}</span>
          <span class="node-label">{{ data.label }}</span>
          <span class="chapter-count">{{ data.kpCount }}个知识点</span>
        </div>

        <!-- 小节节点 -->
        <div v-else-if="data.isSection" class="tree-node section-node">
          <span class="node-label">{{ data.label }}</span>
        </div>

        <!-- 知识点节点 -->
        <div v-else class="tree-node kp-node" :class="{ active: isActive(data), [getKpStatus(data.id)]: true }">
          <!-- 学习状态图标 -->
          <el-icon v-if="getKpStatus(data.id) === 'mastered'" class="status-icon mastered" title="已掌握">
            <CircleCheck />
          </el-icon>
          <el-icon v-else-if="getKpStatus(data.id) === 'completed'" class="status-icon completed" title="已完成">
            <Check />
          </el-icon>
          <span v-else-if="getKpStatus(data.id) === 'in-progress'" class="status-dot in-progress" title="学习中"></span>
          <span v-else class="status-dot not-started"></span>

          <el-icon v-if="data.hasVisualization" class="vis-icon" title="有可视化动画">
            <VideoPlay />
          </el-icon>
          <span class="node-label">{{ data.label }}</span>
          <div class="node-tags">
            <!-- 难度标记 -->
            <span
              v-if="data.difficulty"
              class="difficulty-dot"
              :class="data.difficulty"
              :title="getDifficultyLabel(data.difficulty)"
            ></span>
            <!-- 考频标签 -->
            <el-tag
              v-if="data.examFrequency === 'very-high'"
              size="small"
              type="danger"
              effect="dark"
            >
              必考
            </el-tag>
            <el-tag
              v-else-if="data.examFrequency === 'high'"
              size="small"
              type="warning"
            >
              高频
            </el-tag>
          </div>
        </div>
      </template>
    </el-tree>

    <!-- 统计信息 -->
    <div class="tree-stats">
      <div class="stat-item">
        <span class="stat-value">{{ totalKnowledgePoints }}</span>
        <span class="stat-label">知识点</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{{ visualizationCount }}</span>
        <span class="stat-label">可视化</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{{ veryHighCount }}</span>
        <span class="stat-label">必考</span>
      </div>
    </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Loading, VideoPlay, Check, CircleCheck, Search } from '@element-plus/icons-vue'
import { useKnowledgeStore } from '@/stores/knowledgeStore'
import { useProgressStore } from '@/stores/progressStore'

const router = useRouter()
const route = useRoute()
const knowledgeStore = useKnowledgeStore()
const progressStore = useProgressStore()

const treeRef = ref()
const filterType = ref('')
const expandedKeys = ref<string[]>([])
const searchKeyword = ref('')
const searchResults = ref<any[]>([])
const currentNodeKey = ref<string | null>(null)

const isLoading = computed(() => knowledgeStore.isLoading)

// 搜索相关类型
interface SearchResultItem {
  id: string
  title: string
  chapterId: string
  chapterTitle: string
  sectionTitle: string
  hasVisualization: boolean
  examFrequency?: string
}

// 搜索功能
const handleSearch = () => {
  if (!searchKeyword.value.trim()) {
    searchResults.value = []
    return
  }

  const keyword = searchKeyword.value.toLowerCase().trim()
  const results: SearchResultItem[] = []

  knowledgeStore.chapters.forEach(chapter => {
    chapter.sections.forEach(section => {
      section.knowledgePoints.forEach(kpId => {
        const kp = knowledgeStore.getKnowledgePointById(kpId)
        if (kp && kp.title.toLowerCase().includes(keyword)) {
          results.push({
            id: kp.id,
            title: kp.title,
            chapterId: chapter.id,
            chapterTitle: chapter.title.replace(/^第.章\s*/, ''),
            sectionTitle: section.title,
            hasVisualization: kp.hasVisualization,
            examFrequency: kp.examFrequency
          })
        }
      })
    })
  })

  searchResults.value = results
}

// 高亮搜索关键词
const highlightKeyword = (text: string) => {
  if (!searchKeyword.value.trim()) return text
  const regex = new RegExp(`(${searchKeyword.value.trim()})`, 'gi')
  return text.replace(regex, '<mark>$1</mark>')
}

// 清除搜索
const clearSearch = () => {
  searchKeyword.value = ''
  searchResults.value = []
}

// 点击搜索结果
const handleSearchItemClick = (item: SearchResultItem) => {
  knowledgeStore.setCurrentKnowledgePoint(item.id)
  router.push(`/learn/${item.id}`)
  // 清除搜索，显示章节树
  clearSearch()
}

// 获取知识点学习状态
const getKpStatus = (kpId: string) => progressStore.getStatus(kpId)

const treeProps = {
  children: 'children',
  label: 'label'
}

// 章节图标
const chapterIcons = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩']
const getChapterIcon = (order: number) => chapterIcons[order - 1] || `${order}`

// 难度标签
const getDifficultyLabel = (difficulty: string) => {
  const labels: Record<string, string> = {
    'basic': '基础',
    'intermediate': '中等',
    'advanced': '进阶'
  }
  return labels[difficulty] || ''
}

// 转换为树形数据
const treeData = computed(() => {
  return knowledgeStore.chapters.map((chapter) => ({
    id: chapter.id,
    label: chapter.title.replace(/^第.章\s*/, ''),
    order: chapter.order,
    isChapter: true,
    kpCount: chapter.sections.reduce((sum, s) => sum + s.knowledgePoints.length, 0),
    children: chapter.sections.map((section) => ({
      id: section.id,
      label: section.title,
      isSection: true,
      children: section.knowledgePoints.map((kpId) => {
        const kp = knowledgeStore.getKnowledgePointById(kpId)
        return kp
          ? {
              id: kp.id,
              label: kp.title,
              isKnowledgePoint: true,
              hasVisualization: kp.hasVisualization,
              examFrequency: kp.examFrequency,
              difficulty: kp.difficulty,
              chapterId: kp.chapterId
            }
          : null
      }).filter(Boolean)
    }))
  }))
})

// 筛选后的树形数据
const filteredTreeData = computed(() => {
  if (!filterType.value) return treeData.value

  return treeData.value.map(chapter => ({
    ...chapter,
    children: chapter.children.map(section => ({
      ...section,
      children: section.children.filter((kp: any) => {
        if (filterType.value === 'very-high') return kp.examFrequency === 'very-high'
        if (filterType.value === 'high') return kp.examFrequency === 'high' || kp.examFrequency === 'very-high'
        if (filterType.value === 'visualization') return kp.hasVisualization
        return true
      })
    })).filter(section => section.children.length > 0)
  })).filter(chapter => chapter.children.length > 0)
})

// 统计数据
const totalKnowledgePoints = computed(() => knowledgeStore.knowledgePoints.length)
const visualizationCount = computed(() =>
  knowledgeStore.knowledgePoints.filter(kp => kp.hasVisualization).length
)
const veryHighCount = computed(() =>
  knowledgeStore.knowledgePoints.filter(kp => kp.examFrequency === 'very-high').length
)

const isActive = (data: any) => {
  return data.id === knowledgeStore.currentKnowledgePointId
}

const handleNodeClick = (data: any, node: any) => {
  if (data.isKnowledgePoint) {
    // 知识点：导航到详情页
    knowledgeStore.setCurrentKnowledgePoint(data.id)
    router.push(`/learn/${data.id}`)
  } else {
    // 章节或小节：切换展开/折叠状态
    if (node.expanded) {
      node.collapse()
      handleNodeCollapse(data)
    } else {
      node.expand()
      handleNodeExpand(data)
    }
  }
}

// 展开状态管理
const handleNodeExpand = (data: any) => {
  if (!expandedKeys.value.includes(data.id)) {
    expandedKeys.value.push(data.id)
    saveExpandedState()
  }
}

const handleNodeCollapse = (data: any) => {
  const index = expandedKeys.value.indexOf(data.id)
  if (index > -1) {
    expandedKeys.value.splice(index, 1)
    saveExpandedState()
  }
}

// 保存展开状态到 localStorage
const saveExpandedState = () => {
  localStorage.setItem('chapterTreeExpandedKeys', JSON.stringify(expandedKeys.value))
}

// 加载展开状态
const loadExpandedState = () => {
  const saved = localStorage.getItem('chapterTreeExpandedKeys')
  if (saved) {
    try {
      expandedKeys.value = JSON.parse(saved)
    } catch {
      expandedKeys.value = []
    }
  }
  // 默认展开第一个章节
  if (expandedKeys.value.length === 0 && treeData.value.length > 0) {
    expandedKeys.value = [treeData.value[0].id]
  }
}

// 监听路由变化，自动展开当前知识点所在的章节
watch(() => route.params.knowledgePointId, (kpId) => {
  if (kpId && typeof kpId === 'string') {
    const kp = knowledgeStore.getKnowledgePointById(kpId)
    if (kp) {
      // 使用索引 O(1) 查找章节
      const chapter = knowledgeStore.getChapterById(kp.chapterId)
      if (chapter) {
        if (!expandedKeys.value.includes(chapter.id)) {
          expandedKeys.value.push(chapter.id)
        }
        // 找到小节
        const section = chapter.sections.find(s => s.knowledgePoints.includes(kpId))
        if (section && !expandedKeys.value.includes(section.id)) {
          expandedKeys.value.push(section.id)
        }
        saveExpandedState()
      }
    }
  }
}, { immediate: true })

// 键盘导航支持
const handleKeydown = (event: KeyboardEvent) => {
  if (!treeRef.value || searchKeyword.value) return

  const tree = treeRef.value
  const currentKey = currentNodeKey.value || knowledgeStore.currentKnowledgePointId

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      navigateTree('next')
      break
    case 'ArrowUp':
      event.preventDefault()
      navigateTree('prev')
      break
    case 'ArrowRight':
      event.preventDefault()
      if (currentKey) {
        const node = tree.getNode(currentKey)
        if (node && !node.isLeaf && !node.expanded) {
          node.expand()
          handleNodeExpand(node.data)
        }
      }
      break
    case 'ArrowLeft':
      event.preventDefault()
      if (currentKey) {
        const node = tree.getNode(currentKey)
        if (node && !node.isLeaf && node.expanded) {
          node.collapse()
          handleNodeCollapse(node.data)
        }
      }
      break
    case 'Enter':
      event.preventDefault()
      if (currentKey) {
        const node = tree.getNode(currentKey)
        if (node) {
          handleNodeClick(node.data, node)
        }
      }
      break
  }
}

// 导航到上一个/下一个节点
const navigateTree = (direction: 'next' | 'prev') => {
  const allNodes = getAllVisibleNodes()
  if (allNodes.length === 0) return

  const currentKey = currentNodeKey.value || knowledgeStore.currentKnowledgePointId
  let currentIndex = allNodes.findIndex(n => n.id === currentKey)

  if (currentIndex === -1) {
    currentIndex = direction === 'next' ? -1 : allNodes.length
  }

  const newIndex = direction === 'next'
    ? Math.min(currentIndex + 1, allNodes.length - 1)
    : Math.max(currentIndex - 1, 0)

  const newNode = allNodes[newIndex]
  if (newNode) {
    currentNodeKey.value = newNode.id
    treeRef.value?.setCurrentKey(newNode.id)
  }
}

// 获取所有可见节点（扁平化）
const getAllVisibleNodes = (): any[] => {
  const result: any[] = []

  const traverse = (nodes: any[]) => {
    for (const node of nodes) {
      result.push(node)
      if (node.children && expandedKeys.value.includes(node.id)) {
        traverse(node.children)
      }
    }
  }

  traverse(filteredTreeData.value)
  return result
}

// 自动定位到上次学习位置
const autoLocateLastLearned = () => {
  // 如果已经有路由参数指定的知识点，不自动定位
  if (route.params.knowledgePointId) return

  const lastKpId = progressStore.getLastLearnedKnowledgePointId()
  if (lastKpId) {
    const kp = knowledgeStore.getKnowledgePointById(lastKpId)
    if (kp) {
      // 使用索引 O(1) 查找章节
      const chapter = knowledgeStore.getChapterById(kp.chapterId)
      if (chapter) {
        if (!expandedKeys.value.includes(chapter.id)) {
          expandedKeys.value.push(chapter.id)
        }
        const section = chapter.sections.find(s => s.knowledgePoints.includes(lastKpId))
        if (section && !expandedKeys.value.includes(section.id)) {
          expandedKeys.value.push(section.id)
        }
        saveExpandedState()
      }
      // 设置当前选中
      currentNodeKey.value = lastKpId
      // 延迟设置树的当前节点（确保树已渲染）
      setTimeout(() => {
        treeRef.value?.setCurrentKey(lastKpId)
      }, 100)
    }
  }
}

onMounted(() => {
  // 数据已在 App.vue 中全局加载，无需重复加载
  loadExpandedState()
  // 添加键盘事件监听
  window.addEventListener('keydown', handleKeydown)
  // 自动定位到上次学习位置
  setTimeout(() => {
    autoLocateLastLearned()
  }, 200)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style lang="scss" scoped>
.chapter-tree {
  height: 100%;
  display: flex;
  flex-direction: column;
}

// 搜索框样式
.tree-search {
  padding: 12px;
  border-bottom: 1px solid var(--border-color);

  .el-input {
    :deep(.el-input__wrapper) {
      border-radius: 8px;
    }
  }
}

// 搜索结果样式
.search-results {
  flex: 1;
  overflow: auto;
  padding: 8px;

  .search-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    font-size: 12px;
    color: var(--text-color-secondary);
    border-bottom: 1px solid var(--border-color);
    margin-bottom: 8px;
  }

  .search-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .search-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background-color: var(--hover-bg);
    }

    &.active {
      background-color: var(--primary-color-light);
    }

    .vis-icon {
      color: var(--success-color);
      font-size: 14px;
      flex-shrink: 0;
    }

    .search-item-content {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 2px;

      .search-item-title {
        font-size: 13px;
        color: var(--text-color);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;

        :deep(mark) {
          background-color: rgba(var(--primary-color-rgb), 0.3);
          color: var(--primary-color);
          padding: 0 2px;
          border-radius: 2px;
        }
      }

      .search-item-path {
        font-size: 11px;
        color: var(--text-color-placeholder);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }

    .el-tag {
      flex-shrink: 0;
    }
  }
}

// 无搜索结果样式
.search-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: var(--text-color-placeholder);
  gap: 8px;

  .el-icon {
    font-size: 32px;
    opacity: 0.5;
  }

  span {
    font-size: 13px;
  }
}

.tree-filter {
  padding: 12px;
  border-bottom: 1px solid var(--border-color);

  .el-select {
    width: 100%;
  }
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: var(--text-color-secondary);

  .el-icon {
    font-size: 24px;
    margin-bottom: 8px;
  }
}

:deep(.el-tree) {
  flex: 1;
  overflow: auto;
  padding: 8px;
  background: transparent;

  .el-tree-node__content {
    height: auto;
    padding: 2px 0;
  }

  .el-tree-node__expand-icon {
    padding: 4px;
  }
}

.tree-node {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  border-radius: 6px;
  width: 100%;
  transition: all 0.2s;
}

.chapter-node {
  font-weight: 600;
  color: var(--text-color);

  .chapter-icon {
    font-size: 14px;
    color: var(--primary-color);
  }

  .node-label {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .chapter-count {
    font-size: 11px;
    font-weight: 400;
    color: var(--text-color-placeholder);
    white-space: nowrap;
  }
}

.section-node {
  font-size: 13px;
  color: var(--text-color-secondary);
  font-weight: 500;

  .node-label {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.kp-node {
  font-size: 13px;

  &:hover {
    background-color: var(--hover-bg);
  }

  &.active {
    background-color: var(--primary-color-light);
    color: var(--primary-color);
  }

  &.completed .node-label,
  &.mastered .node-label {
    color: var(--success-color);
  }

  .status-icon {
    font-size: 14px;
    flex-shrink: 0;

    &.mastered {
      color: #67C23A;
    }

    &.completed {
      color: #95d475;
    }
  }

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;

    &.in-progress {
      background-color: #E6A23C;
    }

    &.not-started {
      background-color: #dcdfe6;
    }
  }

  .vis-icon {
    color: var(--success-color);
    font-size: 14px;
    flex-shrink: 0;
  }

  .node-label {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .node-tags {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
  }

  .difficulty-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;

    &.basic {
      background-color: #67C23A;
    }

    &.intermediate {
      background-color: #E6A23C;
    }

    &.advanced {
      background-color: #F56C6C;
    }
  }
}

.tree-stats {
  display: flex;
  justify-content: space-around;
  padding: 12px;
  border-top: 1px solid var(--border-color);
  background-color: var(--bg-color);

  .stat-item {
    text-align: center;

    .stat-value {
      display: block;
      font-size: 18px;
      font-weight: 600;
      color: var(--primary-color);
    }

    .stat-label {
      font-size: 11px;
      color: var(--text-color-secondary);
    }
  }
}
</style>
