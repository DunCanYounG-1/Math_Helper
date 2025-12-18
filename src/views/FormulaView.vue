<template>
  <div class="formula-view">
    <div class="formula-header">
      <h1 class="page-title">公式速查</h1>
      <div class="header-actions">
        <el-button-group class="mode-toggle">
          <el-button
            :type="viewMode === 'grid' ? 'primary' : 'default'"
            @click="viewMode = 'grid'"
          >
            <el-icon><Grid /></el-icon>
            浏览模式
          </el-button>
          <el-button
            :type="viewMode === 'memory' ? 'primary' : 'default'"
            @click="startMemoryMode"
          >
            <el-icon><Reading /></el-icon>
            记忆模式
          </el-button>
        </el-button-group>
        <div class="formula-search" v-show="viewMode === 'grid'">
          <el-input
            v-model="searchQuery"
            placeholder="搜索公式名称或描述..."
            :prefix-icon="Search"
            clearable
          />
        </div>
      </div>
    </div>

    <!-- 分类筛选 -->
    <div class="category-filter">
      <el-radio-group v-model="selectedCategory" size="small">
        <el-radio-button value="all">全部 ({{ allFormulas.length }})</el-radio-button>
        <el-radio-button
          v-for="chapter in chapters"
          :key="chapter.id"
          :value="chapter.id"
        >
          {{ chapter.shortTitle }} ({{ getChapterFormulaCount(chapter.id) }})
        </el-radio-button>
      </el-radio-group>
    </div>

    <!-- 记忆模式 -->
    <div v-if="viewMode === 'memory'" class="memory-mode-container">
      <FormulaCardDeck
        v-if="memoryFormulas.length > 0"
        :formulas="memoryFormulas"
        :title="memoryModeTitle"
        @complete="onMemoryComplete"
        @progress="onMemoryProgress"
      />
      <div v-else class="empty-state">
        <el-icon :size="48"><Document /></el-icon>
        <p>当前分类下没有公式</p>
        <el-button type="primary" @click="selectedCategory = 'all'">查看全部公式</el-button>
      </div>
    </div>

    <!-- 公式卡片网格 -->
    <div v-else class="formula-grid">
      <div
        v-for="formula in filteredFormulas"
        :key="formula.id"
        class="formula-card card"
        @click="showDetail(formula)"
      >
        <div class="formula-card-header">
          <span class="formula-name">{{ formula.name }}</span>
          <div class="formula-card-actions">
            <el-button
              :icon="isFormulaFavorited(formula.id) ? StarFilled : Star"
              circle
              size="small"
              :type="isFormulaFavorited(formula.id) ? 'warning' : 'default'"
              @click="toggleFavorite(formula, $event)"
              :title="isFormulaFavorited(formula.id) ? '取消收藏' : '收藏'"
            />
            <el-tag size="small" type="info">{{ getChapterShortTitle(formula.chapterId) }}</el-tag>
          </div>
        </div>
        <div class="formula-latex" v-html="renderFormula(formula.latex, true)"></div>
        <div class="formula-footer">
          <p class="formula-desc">{{ formula.description }}</p>
          <el-button
            type="primary"
            link
            size="small"
            @click="copyLatex(formula.latex, $event)"
          >
            <el-icon><CopyDocument /></el-icon>
            复制LaTeX
          </el-button>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="filteredFormulas.length === 0 && !isLoading" class="empty-state">
      <el-icon :size="48"><Document /></el-icon>
      <p>没有找到匹配的公式</p>
    </div>

    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-state">
      <el-icon class="is-loading" :size="32"><Loading /></el-icon>
      <p>加载中...</p>
    </div>

    <!-- 详情弹窗 -->
    <el-dialog
      v-model="detailVisible"
      :title="selectedFormula?.name"
      width="650px"
    >
      <div v-if="selectedFormula" class="formula-detail">
        <div class="detail-latex" v-html="renderFormula(selectedFormula.latex, true)"></div>
        <div class="detail-actions">
          <el-button @click="copyLatex(selectedFormula.latex)">
            <el-icon><CopyDocument /></el-icon>
            复制LaTeX
          </el-button>
          <el-button
            :type="isFormulaFavorited(selectedFormula.id) ? 'warning' : 'default'"
            @click="toggleFavorite(selectedFormula)"
          >
            <el-icon>
              <component :is="isFormulaFavorited(selectedFormula.id) ? StarFilled : Star" />
            </el-icon>
            {{ isFormulaFavorited(selectedFormula.id) ? '已收藏' : '收藏' }}
          </el-button>
        </div>
        <div class="detail-info">
          <div class="info-item">
            <strong>描述</strong>
            <p>{{ selectedFormula.description }}</p>
          </div>
          <div class="info-item">
            <strong>所属章节</strong>
            <p>{{ getChapterTitle(selectedFormula.chapterId) }}</p>
          </div>
          <div class="info-item">
            <strong>LaTeX代码</strong>
            <code class="latex-code">{{ selectedFormula.latex }}</code>
          </div>
          <div v-if="relatedKnowledgePoint" class="info-item">
            <strong>相关知识点</strong>
            <el-button type="primary" link @click="goToKnowledgePoint">
              {{ relatedKnowledgePoint.title }}
              <el-icon><ArrowRight /></el-icon>
            </el-button>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Document, Search, Loading, ArrowRight, Star, StarFilled, CopyDocument, Grid, Reading } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useKnowledgeStore, type Formula } from '@/stores/knowledgeStore'
import { useProgressStore } from '@/stores/progressStore'
import FormulaCardDeck from '@/components/memory/FormulaCardDeck.vue'
import { renderFormula } from '@/utils/latex'

interface FormulaWithChapter extends Formula {
  chapterId: string
}

const router = useRouter()
const knowledgeStore = useKnowledgeStore()
const progressStore = useProgressStore()

const searchQuery = ref('')
const selectedCategory = ref('all')
const detailVisible = ref(false)
const selectedFormula = ref<FormulaWithChapter | null>(null)
const viewMode = ref<'grid' | 'memory'>('grid')

const isLoading = computed(() => knowledgeStore.isLoading)

// 从store获取章节列表
const chapters = computed(() => {
  return knowledgeStore.chapters.map(ch => ({
    id: ch.id,
    title: ch.title,
    shortTitle: ch.title.replace(/^第.章\s*/, '').substring(0, 6)
  }))
})

// 获取所有公式并添加章节信息
const allFormulas = computed<FormulaWithChapter[]>(() => {
  const formulas: FormulaWithChapter[] = []

  knowledgeStore.knowledgePoints.forEach(kp => {
    kp.formulas.forEach(f => {
      formulas.push({
        ...f,
        chapterId: kp.chapterId
      })
    })
  })

  return formulas
})

// 获取章节公式数量
const getChapterFormulaCount = (chapterId: string) => {
  return allFormulas.value.filter(f => f.chapterId === chapterId).length
}

// 获取章节短标题
const getChapterShortTitle = (chapterId: string) => {
  // 使用索引 O(1) 查找
  const chapter = knowledgeStore.getChapterById(chapterId)
  if (!chapter) return ''
  return chapter.title.replace(/^第.章\s*/, '').substring(0, 6)
}

// 获取章节完整标题
const getChapterTitle = (chapterId: string) => {
  // 使用索引 O(1) 查找
  const chapter = knowledgeStore.getChapterById(chapterId)
  return chapter?.title || ''
}

// 过滤公式
const filteredFormulas = computed(() => {
  let result = allFormulas.value

  if (selectedCategory.value !== 'all') {
    result = result.filter(f => f.chapterId === selectedCategory.value)
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(
      f =>
        f.name.toLowerCase().includes(query) ||
        f.description.toLowerCase().includes(query) ||
        f.latex.toLowerCase().includes(query)
    )
  }

  return result
})

// 记忆模式相关
const memoryFormulas = computed(() => {
  // 将公式转换为记忆卡片需要的格式
  return filteredFormulas.value.map(f => ({
    id: f.id,
    name: f.name,
    latex: f.latex,
    description: f.description,
    category: getChapterShortTitle(f.chapterId),
    examFrequency: f.examFrequency,
    memoryTip: f.memoryTip
  }))
})

const memoryModeTitle = computed(() => {
  if (selectedCategory.value === 'all') {
    return `全部公式 (${memoryFormulas.value.length})`
  }
  const chapter = chapters.value.find(ch => ch.id === selectedCategory.value)
  return chapter ? `${chapter.shortTitle} (${memoryFormulas.value.length})` : '公式记忆'
})

const startMemoryMode = () => {
  viewMode.value = 'memory'
}

const onMemoryComplete = (memorizedIds: string[]) => {
  ElMessage.success(`本轮学习完成！已掌握 ${memorizedIds.length} 个公式`)
}

const onMemoryProgress = (_current: number, _total: number, _memorized: number) => {
  // 进度回调，可用于扩展学习进度记录功能
}

// 获取相关知识点
const relatedKnowledgePoint = computed(() => {
  if (!selectedFormula.value) return null
  // 使用索引 O(1) 查找
  return knowledgeStore.getKnowledgePointById(selectedFormula.value.knowledgePointId)
})

const showDetail = (formula: FormulaWithChapter) => {
  selectedFormula.value = formula
  detailVisible.value = true
}

const goToKnowledgePoint = () => {
  if (relatedKnowledgePoint.value) {
    detailVisible.value = false
    router.push(`/learn/${relatedKnowledgePoint.value.id}`)
  }
}

// 检查公式是否已收藏
const isFormulaFavorited = (formulaId: string) => {
  return progressStore.isFavorite(formulaId, 'formula')
}

// 切换收藏状态
const toggleFavorite = (formula: FormulaWithChapter, event?: Event) => {
  event?.stopPropagation()
  if (isFormulaFavorited(formula.id)) {
    progressStore.removeFavorite(formula.id, 'formula')
    ElMessage.info('已取消收藏')
  } else {
    progressStore.addFavorite({ id: formula.id, type: 'formula' })
    ElMessage.success('已添加收藏')
  }
}

// 复制LaTeX代码
const copyLatex = async (latex: string, event?: Event) => {
  event?.stopPropagation()
  try {
    await navigator.clipboard.writeText(latex)
    ElMessage.success('LaTeX代码已复制')
  } catch {
    // 兼容处理
    const input = document.createElement('textarea')
    input.value = latex
    document.body.appendChild(input)
    input.select()
    document.execCommand('copy')
    document.body.removeChild(input)
    ElMessage.success('LaTeX代码已复制')
  }
}

// 数据已在 App.vue 中全局加载，无需重复加载
</script>

<style lang="scss" scoped>
// ============================================
// iOS 风格公式速查视图
// ============================================
.formula-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-color);
  padding: var(--spacing-md);
}

// iOS 大标题风格头部
.formula-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
  flex-wrap: wrap;
  gap: var(--spacing-sm);

  .page-title {
    font-size: 34px;
    font-weight: 700;
    color: var(--text-color);
    margin: 0;
    letter-spacing: 0.01em;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    flex-wrap: wrap;

    .mode-toggle {
      flex-shrink: 0;
    }
  }

  .formula-search {
    width: 280px;

    :deep(.el-input__wrapper) {
      border-radius: var(--border-radius);
      background-color: rgba(118, 118, 128, 0.12);
      box-shadow: none;

      &:hover, &.is-focus {
        box-shadow: none;
      }
    }
  }
}

// iOS 分段控制器风格筛选
.category-filter {
  margin-bottom: var(--spacing-lg);
  overflow-x: auto;
  white-space: nowrap;
  padding-bottom: var(--spacing-sm);
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }

  :deep(.el-radio-group) {
    background-color: rgba(118, 118, 128, 0.12);
    border-radius: var(--border-radius);
    padding: 2px;
  }

  :deep(.el-radio-button__inner) {
    border: none;
    border-radius: 7px;
    font-size: 13px;
    font-weight: 500;
    padding: 6px 12px;
    background: transparent;
    color: var(--text-color);

    &:hover {
      color: var(--text-color);
    }
  }

  :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
    background-color: var(--card-bg);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    color: var(--text-color);
  }
}

.memory-mode-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: var(--spacing-lg) 0;
  overflow: auto;
}

// iOS App 风格公式卡片网格
.formula-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--spacing-md);
  flex: 1;
  overflow: auto;
  padding-bottom: var(--spacing-lg);
}

// iOS 风格公式卡片
.formula-card {
  background-color: var(--card-bg);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-md);
  cursor: pointer;
  transition: all 0.25s var(--transition-timing);

  &:active {
    transform: scale(0.98);
    background-color: var(--active-bg);
  }

  .formula-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-sm);

    .formula-name {
      font-weight: 600;
      font-size: 15px;
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      margin-right: var(--spacing-sm);
      color: var(--text-color);
    }

    .formula-card-actions {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      flex-shrink: 0;
    }
  }

  .formula-latex {
    background-color: var(--bg-color);
    padding: var(--spacing-md);
    border-radius: var(--border-radius);
    margin-bottom: var(--spacing-sm);
    text-align: center;
    overflow-x: auto;
    min-height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .formula-footer {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: var(--spacing-sm);
  }

  .formula-desc {
    font-size: 13px;
    color: var(--text-color-tertiary);
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    flex: 1;
    margin: 0;
  }
}

// iOS 风格空状态
.empty-state,
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl);
  color: var(--text-color-placeholder);

  p {
    margin-top: var(--spacing-sm);
    font-size: 15px;
  }
}

// iOS 风格详情弹窗
.formula-detail {
  .detail-latex {
    background-color: var(--bg-color);
    padding: var(--spacing-lg);
    border-radius: var(--border-radius);
    margin-bottom: var(--spacing-md);
    text-align: center;
    font-size: 1.15em;
    overflow-x: auto;
  }

  .detail-actions {
    display: flex;
    justify-content: center;
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-lg);
  }

  .detail-info {
    .info-item {
      margin-bottom: var(--spacing-md);
      padding-bottom: var(--spacing-md);
      border-bottom: 0.5px solid var(--separator-color);

      &:last-child {
        margin-bottom: 0;
        padding-bottom: 0;
        border-bottom: none;
      }

      strong {
        display: block;
        color: var(--text-color);
        margin-bottom: var(--spacing-xs);
        font-size: 13px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.02em;
        color: var(--text-color-tertiary);
      }

      p {
        color: var(--text-color);
        line-height: 1.6;
        margin: 0;
        font-size: 15px;
      }

      .latex-code {
        display: block;
        background-color: var(--bg-color);
        padding: var(--spacing-sm) var(--spacing-md);
        border-radius: var(--border-radius);
        font-family: 'SF Mono', 'Consolas', monospace;
        font-size: 13px;
        color: var(--text-color);
        word-break: break-all;
        line-height: 1.6;
      }

      .el-button {
        padding: 0;
        font-size: 15px;
      }
    }
  }
}
</style>
