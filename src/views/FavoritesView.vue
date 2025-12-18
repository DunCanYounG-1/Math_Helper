<template>
  <div class="favorites-view">
    <h1 class="page-title">我的收藏</h1>

    <!-- 标签切换 -->
    <el-tabs v-model="activeTab">
      <el-tab-pane label="知识点" name="knowledge-point">
        <div v-if="favoriteKnowledgePoints.length" class="favorites-list">
          <div
            v-for="item in favoriteKnowledgePoints"
            :key="item.id"
            class="favorite-item card"
            @click="goToKnowledgePoint(item.id)"
          >
            <div class="item-header">
              <h3>{{ getKnowledgePointTitle(item.id) }}</h3>
              <el-button
                type="danger"
                :icon="Delete"
                circle
                size="small"
                @click.stop="removeFavorite(item.id, 'knowledge-point')"
              />
            </div>
            <p class="item-desc">{{ getKnowledgePointDesc(item.id) }}</p>
            <div class="item-meta">
              <span class="chapter">{{ getKnowledgePointChapter(item.id) }}</span>
              <span class="time">收藏于 {{ formatDate(item.addedAt) }}</span>
            </div>
          </div>
        </div>
        <el-empty v-else description="暂无收藏的知识点" />
      </el-tab-pane>

      <el-tab-pane label="公式" name="formula">
        <div v-if="favoriteFormulas.length" class="favorites-list">
          <div
            v-for="item in favoriteFormulas"
            :key="item.id"
            class="favorite-item card formula-item"
          >
            <div class="item-header">
              <h3>{{ getFormulaName(item.id) }}</h3>
              <el-button
                type="danger"
                :icon="Delete"
                circle
                size="small"
                @click.stop="removeFavorite(item.id, 'formula')"
              />
            </div>
            <div class="formula-latex" v-html="renderFormula(getFormulaLatex(item.id), true)"></div>
            <div class="item-meta">
              <span class="time">收藏于 {{ formatDate(item.addedAt) }}</span>
            </div>
          </div>
        </div>
        <el-empty v-else description="暂无收藏的公式" />
      </el-tab-pane>

      <el-tab-pane label="比喻" name="metaphor">
        <div v-if="favoriteMetaphors.length" class="favorites-list">
          <div
            v-for="item in favoriteMetaphors"
            :key="item.id"
            class="favorite-item card metaphor-item"
          >
            <div class="item-header">
              <h3>{{ getMetaphorTitle(item.id) }}</h3>
              <el-button
                type="danger"
                :icon="Delete"
                circle
                size="small"
                @click.stop="removeFavorite(item.id, 'metaphor')"
              />
            </div>
            <p class="metaphor-content">{{ getMetaphorContent(item.id) }}</p>
            <div class="item-meta">
              <span class="time">收藏于 {{ formatDate(item.addedAt) }}</span>
            </div>
          </div>
        </div>
        <el-empty v-else description="暂无收藏的比喻" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Delete } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useKnowledgeStore } from '@/stores/knowledgeStore'
import { useProgressStore, type FavoriteItem } from '@/stores/progressStore'
import { renderFormula } from '@/utils/latex'

const router = useRouter()
const knowledgeStore = useKnowledgeStore()
const progressStore = useProgressStore()

const activeTab = ref('knowledge-point')

// 获取各类型收藏
const favoriteKnowledgePoints = computed(() =>
  progressStore.getFavoritesByType('knowledge-point')
)
const favoriteFormulas = computed(() =>
  progressStore.getFavoritesByType('formula')
)
const favoriteMetaphors = computed(() =>
  progressStore.getFavoritesByType('metaphor')
)

// 获取知识点信息
const getKnowledgePointTitle = (id: string) => {
  const kp = knowledgeStore.getKnowledgePointById(id)
  return kp?.title || '未知知识点'
}

const getKnowledgePointDesc = (id: string) => {
  const kp = knowledgeStore.getKnowledgePointById(id)
  return kp?.description || ''
}

const getKnowledgePointChapter = (id: string) => {
  const kp = knowledgeStore.getKnowledgePointById(id)
  if (!kp) return ''
  // 使用索引 O(1) 查找
  const chapter = knowledgeStore.getChapterById(kp.chapterId)
  return chapter?.title || ''
}

// 获取公式信息
const getFormulaName = (id: string) => {
  const formula = knowledgeStore.formulas.find(f => f.id === id)
  return formula?.name || '未知公式'
}

const getFormulaLatex = (id: string) => {
  const formula = knowledgeStore.formulas.find(f => f.id === id)
  return formula?.latex || ''
}

// 获取比喻信息
const getMetaphorTitle = (id: string) => {
  const metaphor = knowledgeStore.metaphors.find(m => m.id === id)
  return metaphor?.title || '未知比喻'
}

const getMetaphorContent = (id: string) => {
  const metaphor = knowledgeStore.metaphors.find(m => m.id === id)
  return metaphor?.content || ''
}

// 格式化日期
const formatDate = (timestamp: number) => {
  const date = new Date(timestamp)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

// 跳转到知识点
const goToKnowledgePoint = (id: string) => {
  router.push(`/learn/${id}`)
}

// 移除收藏
const removeFavorite = (id: string, type: FavoriteItem['type']) => {
  progressStore.removeFavorite(id, type)
  ElMessage.success('已取消收藏')
}

// 数据已在 App.vue 中全局加载，无需重复加载
</script>

<style lang="scss" scoped>
// ============================================
// iOS 风格收藏视图
// ============================================
.favorites-view {
  max-width: 900px;
  margin: 0 auto;
  padding: var(--spacing-md);
  background-color: var(--bg-color);
}

// iOS 大标题风格
.page-title {
  font-size: 34px;
  font-weight: 700;
  color: var(--text-color);
  margin-bottom: var(--spacing-lg);
  letter-spacing: 0.01em;
}

// iOS 风格标签
:deep(.el-tabs) {
  .el-tabs__header {
    margin-bottom: var(--spacing-lg);
  }

  .el-tabs__nav-wrap::after {
    height: 0.5px;
    background-color: var(--separator-color);
  }

  .el-tabs__item {
    font-size: 15px;
    font-weight: 500;
    padding: 0 var(--spacing-lg);
    color: var(--text-color-secondary);

    &.is-active {
      color: var(--primary-color);
    }
  }

  .el-tabs__active-bar {
    height: 2px;
    border-radius: 1px;
  }

  .el-tabs__content {
    padding-top: 0;
  }
}

// iOS 风格收藏列表
.favorites-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

// iOS 风格收藏卡片
.favorite-item {
  background-color: var(--card-bg);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-lg);
  cursor: pointer;
  transition: all 0.25s var(--transition-timing);

  &:active {
    transform: scale(0.99);
    background-color: var(--active-bg);
  }

  .item-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: var(--spacing-sm);

    h3 {
      font-size: 17px;
      font-weight: 600;
      color: var(--text-color);
      margin: 0;
    }

    :deep(.el-button) {
      border-radius: var(--border-radius);
    }
  }

  .item-desc {
    color: var(--text-color-secondary);
    line-height: 1.7;
    margin-bottom: var(--spacing-md);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    font-size: 15px;
  }

  .item-meta {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: var(--text-color-placeholder);
    padding-top: var(--spacing-sm);
    border-top: 0.5px solid var(--separator-color);

    .chapter {
      color: var(--primary-color);
      font-weight: 500;
    }

    .time {
      font-feature-settings: 'tnum';
    }
  }
}

// iOS 风格公式收藏卡片
.formula-item {
  cursor: default;

  &:active {
    transform: none;
    background-color: var(--card-bg);
  }

  .formula-latex {
    background-color: var(--bg-color);
    padding: var(--spacing-md);
    border-radius: var(--border-radius);
    margin-bottom: var(--spacing-md);
    text-align: center;
    overflow-x: auto;

    :deep(.katex) {
      font-size: 1.15em;
    }
  }
}

// iOS 风格比喻收藏卡片
.metaphor-item {
  cursor: default;

  &:active {
    transform: none;
    background-color: var(--card-bg);
  }

  .metaphor-content {
    color: var(--text-color-secondary);
    line-height: 1.8;
    margin-bottom: var(--spacing-md);
    white-space: pre-wrap;
    font-size: 15px;
  }
}

// iOS 风格空状态
:deep(.el-empty) {
  padding: var(--spacing-xl) 0;

  .el-empty__image {
    width: 100px;
  }

  .el-empty__description {
    font-size: 15px;
    color: var(--text-color-tertiary);
  }
}
</style>
