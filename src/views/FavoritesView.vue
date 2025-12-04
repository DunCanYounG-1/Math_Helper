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
import { ref, computed, onMounted } from 'vue'
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
  const chapter = knowledgeStore.chapters.find(ch => ch.id === kp.chapterId)
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

onMounted(() => {
  knowledgeStore.loadKnowledgeData()
  progressStore.loadFromStorage()
})
</script>

<style lang="scss" scoped>
.favorites-view {
  max-width: 900px;
  margin: 0 auto;
}

.page-title {
  margin-bottom: 24px;
}

.favorites-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.favorite-item {
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--box-shadow);
  }

  .item-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 8px;

    h3 {
      font-size: 16px;
      font-weight: 600;
      color: var(--text-color);
      margin: 0;
    }
  }

  .item-desc {
    color: var(--text-color-secondary);
    line-height: 1.6;
    margin-bottom: 12px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .item-meta {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: var(--text-color-placeholder);

    .chapter {
      color: var(--primary-color);
    }
  }
}

.formula-item {
  cursor: default;

  &:hover {
    transform: none;
  }

  .formula-latex {
    background-color: var(--bg-color);
    padding: 16px;
    border-radius: 8px;
    margin-bottom: 12px;
    text-align: center;
    overflow-x: auto;
  }
}

.metaphor-item {
  cursor: default;

  &:hover {
    transform: none;
  }

  .metaphor-content {
    color: var(--text-color-secondary);
    line-height: 1.8;
    margin-bottom: 12px;
    white-space: pre-wrap;
  }
}

:deep(.el-tabs__content) {
  padding-top: 16px;
}

:deep(.el-empty) {
  padding: 60px 0;
}
</style>
