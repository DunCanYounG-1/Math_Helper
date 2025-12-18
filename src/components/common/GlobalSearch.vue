<template>
  <div class="global-search">
    <el-popover
      :visible="showResults"
      placement="bottom"
      :width="500"
      :show-arrow="false"
      popper-class="search-popover"
    >
      <template #reference>
        <el-input
          v-model="searchQuery"
          placeholder="搜索知识点、公式、比喻..."
          :prefix-icon="Search"
          clearable
          @focus="onFocus"
          @blur="onBlur"
          @input="onSearch"
          @keydown.enter="goToFirstResult"
          @keydown.down.prevent="navigateResults(1)"
          @keydown.up.prevent="navigateResults(-1)"
        />
      </template>

      <div class="search-results">
        <div v-if="isSearching" class="search-loading">
          <el-icon class="is-loading"><Loading /></el-icon>
          搜索中...
        </div>

        <template v-else-if="hasResults">
          <!-- 知识点结果 -->
          <div v-if="results.knowledgePoints.length" class="result-section">
            <div class="section-title">
              <el-icon><Reading /></el-icon>
              知识点
            </div>
            <div
              v-for="(item, index) in results.knowledgePoints"
              :key="item.id"
              class="result-item"
              :class="{ active: activeIndex === getGlobalIndex('kp', index) }"
              @click="goToKnowledgePoint(item)"
              @mouseenter="activeIndex = getGlobalIndex('kp', index)"
            >
              <div class="result-main">
                <span class="result-title" v-html="highlightText(item.title)"></span>
                <el-tag size="small" type="info">{{ getChapterShortTitle(item.chapterId) }}</el-tag>
              </div>
              <p class="result-desc" v-html="highlightText(item.description)"></p>
            </div>
          </div>

          <!-- 公式结果 -->
          <div v-if="results.formulas.length" class="result-section">
            <div class="section-title">
              <el-icon><Document /></el-icon>
              公式
            </div>
            <div
              v-for="(item, index) in results.formulas"
              :key="item.id"
              class="result-item"
              :class="{ active: activeIndex === getGlobalIndex('formula', index) }"
              @click="goToFormula(item)"
              @mouseenter="activeIndex = getGlobalIndex('formula', index)"
            >
              <div class="result-main">
                <span class="result-title" v-html="highlightText(item.name)"></span>
              </div>
              <p class="result-desc" v-html="highlightText(item.description)"></p>
            </div>
          </div>

          <!-- 比喻结果 -->
          <div v-if="results.metaphors.length" class="result-section">
            <div class="section-title">
              <el-icon><MagicStick /></el-icon>
              比喻
            </div>
            <div
              v-for="(item, index) in results.metaphors"
              :key="item.id"
              class="result-item"
              :class="{ active: activeIndex === getGlobalIndex('metaphor', index) }"
              @click="goToMetaphor(item)"
              @mouseenter="activeIndex = getGlobalIndex('metaphor', index)"
            >
              <div class="result-main">
                <span class="result-title" v-html="highlightText(item.title)"></span>
              </div>
              <p class="result-desc" v-html="highlightText(truncate(item.content, 80))"></p>
            </div>
          </div>
        </template>

        <div v-else-if="searchQuery && !isSearching" class="no-results">
          <el-icon :size="32"><Search /></el-icon>
          <p>未找到相关结果</p>
          <p class="tip">试试其他关键词</p>
        </div>

        <div v-else class="search-tips">
          <p>输入关键词搜索：</p>
          <div class="tip-tags">
            <el-tag
              v-for="tip in searchTips"
              :key="tip"
              size="small"
              @click="searchQuery = tip; onSearch()"
            >
              {{ tip }}
            </el-tag>
          </div>
          <p class="shortcut">按 <kbd>Enter</kbd> 跳转到第一个结果</p>
        </div>
      </div>
    </el-popover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Loading, Reading, Document, MagicStick } from '@element-plus/icons-vue'
import { useKnowledgeStore, type KnowledgePoint, type Formula, type Metaphor } from '@/stores/knowledgeStore'

interface SearchResults {
  knowledgePoints: KnowledgePoint[]
  formulas: (Formula & { chapterId?: string })[]
  metaphors: Metaphor[]
}

const router = useRouter()
const knowledgeStore = useKnowledgeStore()

const searchQuery = ref('')
const showResults = ref(false)
const isSearching = ref(false)
const activeIndex = ref(-1)

const results = ref<SearchResults>({
  knowledgePoints: [],
  formulas: [],
  metaphors: []
})

const searchTips = ['极限', '导数', '积分', '泰勒公式', '微分方程']

// 计算是否有结果
const hasResults = computed(() => {
  return results.value.knowledgePoints.length > 0 ||
    results.value.formulas.length > 0 ||
    results.value.metaphors.length > 0
})

// 获取全局索引
const getGlobalIndex = (type: 'kp' | 'formula' | 'metaphor', index: number): number => {
  let offset = 0
  if (type === 'formula') {
    offset = results.value.knowledgePoints.length
  } else if (type === 'metaphor') {
    offset = results.value.knowledgePoints.length + results.value.formulas.length
  }
  return offset + index
}

// 获取章节短标题
const getChapterShortTitle = (chapterId: string) => {
  // 使用索引 O(1) 查找
  const chapter = knowledgeStore.getChapterById(chapterId)
  if (!chapter) return ''
  return chapter.title.replace(/^第.章\s*/, '').substring(0, 6)
}

// 高亮搜索关键词
const highlightText = (text: string): string => {
  if (!searchQuery.value || !text) return text
  const query = searchQuery.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${query})`, 'gi')
  return text.replace(regex, '<mark>$1</mark>')
}

// 截断文本
const truncate = (text: string, length: number): string => {
  if (text.length <= length) return text
  return text.substring(0, length) + '...'
}

// 执行搜索
const performSearch = () => {
  const query = searchQuery.value.toLowerCase().trim()

  if (!query) {
    results.value = { knowledgePoints: [], formulas: [], metaphors: [] }
    return
  }

  isSearching.value = true

  // 搜索知识点
  const kpResults = knowledgeStore.knowledgePoints.filter(kp =>
    kp.title.toLowerCase().includes(query) ||
    kp.description.toLowerCase().includes(query) ||
    kp.keyPoints?.some(p => p.toLowerCase().includes(query))
  ).slice(0, 5)

  // 搜索公式
  const formulaResults = knowledgeStore.formulas.filter(f =>
    f.name.toLowerCase().includes(query) ||
    f.description.toLowerCase().includes(query) ||
    f.latex.toLowerCase().includes(query)
  ).slice(0, 5)

  // 搜索比喻
  const metaphorResults = knowledgeStore.metaphors.filter(m =>
    m.title.toLowerCase().includes(query) ||
    m.content.toLowerCase().includes(query) ||
    m.tags.some(t => t.toLowerCase().includes(query))
  ).slice(0, 5)

  results.value = {
    knowledgePoints: kpResults,
    formulas: formulaResults,
    metaphors: metaphorResults
  }

  isSearching.value = false
  activeIndex.value = hasResults.value ? 0 : -1
}

// 搜索事件处理
let searchTimeout: ReturnType<typeof setTimeout> | null = null
const onSearch = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(performSearch, 200)
}

// 焦点处理
const onFocus = () => {
  showResults.value = true
}

const onBlur = () => {
  // 延迟关闭，允许点击结果
  setTimeout(() => {
    showResults.value = false
  }, 200)
}

// 键盘导航
const navigateResults = (direction: number) => {
  const total = results.value.knowledgePoints.length +
    results.value.formulas.length +
    results.value.metaphors.length

  if (total === 0) return

  activeIndex.value = (activeIndex.value + direction + total) % total
}

// 跳转到第一个结果
const goToFirstResult = () => {
  if (results.value.knowledgePoints.length > 0) {
    goToKnowledgePoint(results.value.knowledgePoints[0])
  } else if (results.value.formulas.length > 0) {
    goToFormula(results.value.formulas[0])
  } else if (results.value.metaphors.length > 0) {
    goToMetaphor(results.value.metaphors[0])
  }
}

// 跳转到知识点
const goToKnowledgePoint = (kp: KnowledgePoint) => {
  showResults.value = false
  searchQuery.value = ''
  router.push(`/learn/${kp.id}`)
}

// 跳转到公式
const goToFormula = (formula: Formula & { chapterId?: string }) => {
  showResults.value = false
  searchQuery.value = ''
  // 如果有关联的知识点，跳转到知识点
  if (formula.knowledgePointId) {
    router.push(`/learn/${formula.knowledgePointId}`)
  } else {
    router.push('/formula')
  }
}

// 跳转到比喻（通过知识点）
const goToMetaphor = (metaphor: Metaphor) => {
  showResults.value = false
  searchQuery.value = ''
  router.push(`/learn/${metaphor.knowledgePointId}`)
}

// 监听搜索框变化
watch(searchQuery, (val) => {
  if (!val) {
    results.value = { knowledgePoints: [], formulas: [], metaphors: [] }
  }
})

// 提供 focus 方法供外部调用
const focus = () => {
  showResults.value = true
}

defineExpose({ focus })
</script>

<style lang="scss" scoped>
.global-search {
  :deep(.el-input) {
    width: 260px;

    .el-input__wrapper {
      background-color: var(--bg-color);
      border-radius: 20px;
      box-shadow: none;
      border: 1px solid var(--border-color);

      &:hover {
        border-color: var(--primary-color-light);
      }

      &.is-focus {
        border-color: var(--primary-color);
      }
    }
  }
}

.search-results {
  max-height: 450px;
  overflow-y: auto;
}

.search-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px;
  color: var(--text-color-secondary);
}

.result-section {
  margin-bottom: 16px;

  &:last-child {
    margin-bottom: 0;
  }
}

.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-color-secondary);
  padding: 8px 12px;
  background-color: var(--bg-color);
  border-radius: 4px;
  margin-bottom: 4px;
}

.result-item {
  padding: 10px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover,
  &.active {
    background-color: var(--primary-color-light);
  }

  .result-main {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 4px;
  }

  .result-title {
    font-weight: 500;
    color: var(--text-color);
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    :deep(mark) {
      background-color: var(--warning-color);
      color: inherit;
      padding: 0 2px;
      border-radius: 2px;
    }
  }

  .result-desc {
    font-size: 12px;
    color: var(--text-color-secondary);
    line-height: 1.4;
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;

    :deep(mark) {
      background-color: var(--warning-color);
      color: inherit;
      padding: 0 2px;
      border-radius: 2px;
    }
  }
}

.no-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px;
  color: var(--text-color-placeholder);

  .el-icon {
    margin-bottom: 12px;
  }

  p {
    margin: 0;
  }

  .tip {
    font-size: 12px;
    margin-top: 4px;
  }
}

.search-tips {
  padding: 16px;
  color: var(--text-color-secondary);
  font-size: 13px;

  p {
    margin: 0 0 12px;
  }

  .tip-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 16px;

    .el-tag {
      cursor: pointer;

      &:hover {
        background-color: var(--primary-color);
        color: white;
      }
    }
  }

  .shortcut {
    font-size: 12px;
    color: var(--text-color-placeholder);

    kbd {
      padding: 2px 6px;
      background-color: var(--bg-color);
      border: 1px solid var(--border-color);
      border-radius: 4px;
      font-family: inherit;
    }
  }
}
</style>

<style lang="scss">
// 全局样式，用于popover
.search-popover {
  padding: 8px !important;
  border-radius: 12px !important;
}
</style>
