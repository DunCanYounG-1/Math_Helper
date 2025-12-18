<template>
  <div class="learning-path-panel">
    <div class="panel-header">
      <div class="header-title">
        <el-icon><Guide /></el-icon>
        <span>学习路径推荐</span>
      </div>
      <el-button text size="small" @click="refreshPath">
        <el-icon><Refresh /></el-icon>
      </el-button>
    </div>

    <div class="path-content">
      <!-- 当前进度概览 -->
      <div class="progress-overview">
        <div class="progress-ring">
          <el-progress
            type="circle"
            :percentage="overallProgress"
            :width="80"
            :stroke-width="8"
            :color="progressColor"
          >
            <template #default>
              <div class="progress-inner">
                <span class="progress-value">{{ overallProgress }}%</span>
                <span class="progress-label">总进度</span>
              </div>
            </template>
          </el-progress>
        </div>
        <div class="progress-stats">
          <div class="stat-item">
            <span class="stat-value">{{ progressStore.learnedCount }}</span>
            <span class="stat-label">已掌握</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ progressStore.inProgressCount }}</span>
            <span class="stat-label">学习中</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ remainingCount }}</span>
            <span class="stat-label">待学习</span>
          </div>
        </div>
      </div>

      <!-- 推荐学习路径 -->
      <div class="path-section">
        <div class="section-title">
          <el-icon><Flag /></el-icon>
          <span>推荐下一步</span>
        </div>

        <div v-if="recommendedPath.length === 0" class="empty-path">
          <el-icon :size="32"><Trophy /></el-icon>
          <p>恭喜！你已完成所有知识点的学习</p>
        </div>

        <div v-else class="path-list">
          <div
            v-for="(item, index) in recommendedPath"
            :key="item.id"
            class="path-item"
            :class="{ current: index === 0, weak: item.isWeak }"
            @click="goToKnowledgePoint(item.id)"
          >
            <div class="path-index">
              <span v-if="index === 0" class="current-badge">
                <el-icon><Pointer /></el-icon>
              </span>
              <span v-else>{{ index + 1 }}</span>
            </div>
            <div class="path-info">
              <div class="path-title">{{ item.title }}</div>
              <div class="path-meta">
                <el-tag v-if="item.isWeak" type="danger" size="small">薄弱点</el-tag>
                <el-tag v-else-if="item.isPrerequisite" type="warning" size="small">前置知识</el-tag>
                <el-tag v-else-if="item.isNext" type="success" size="small">顺序推荐</el-tag>
                <span class="chapter-name">{{ item.chapterName }}</span>
              </div>
            </div>
            <div class="path-status">
              <el-icon v-if="item.status === 'completed'" class="status-icon completed"><CircleCheck /></el-icon>
              <el-icon v-else-if="item.status === 'in-progress'" class="status-icon in-progress"><Loading /></el-icon>
              <el-icon v-else class="status-icon not-started"><MoreFilled /></el-icon>
            </div>
          </div>
        </div>
      </div>

      <!-- 薄弱知识点提醒 -->
      <div v-if="weakPoints.length > 0" class="weak-section">
        <div class="section-title warning">
          <el-icon><Warning /></el-icon>
          <span>薄弱知识点 ({{ weakPoints.length }})</span>
        </div>
        <div class="weak-list">
          <div
            v-for="wp in weakPoints.slice(0, 3)"
            :key="wp.knowledgePointId"
            class="weak-item"
            @click="goToKnowledgePoint(wp.knowledgePointId)"
          >
            <div class="weak-info">
              <span class="weak-title">{{ getKnowledgePointTitle(wp.knowledgePointId) }}</span>
              <span class="weak-rate">错误率 {{ wp.errorRate }}%</span>
            </div>
            <el-progress
              :percentage="100 - wp.errorRate"
              :stroke-width="4"
              :show-text="false"
              :color="getErrorRateColor(wp.errorRate)"
            />
          </div>
        </div>
      </div>

      <!-- 章节进度 -->
      <div class="chapters-section">
        <div class="section-title">
          <el-icon><Folder /></el-icon>
          <span>章节进度</span>
        </div>
        <div class="chapters-list">
          <div
            v-for="chapter in chaptersProgress"
            :key="chapter.id"
            class="chapter-item"
            @click="toggleChapter(chapter.id)"
          >
            <div class="chapter-header">
              <span class="chapter-name">{{ chapter.shortName }}</span>
              <span class="chapter-progress">{{ chapter.completed }}/{{ chapter.total }}</span>
            </div>
            <el-progress
              :percentage="chapter.percentage"
              :stroke-width="6"
              :show-text="false"
              :color="getChapterColor(chapter.percentage)"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  Guide,
  Refresh,
  Flag,
  Trophy,
  Pointer,
  CircleCheck,
  Loading,
  MoreFilled,
  Warning,
  Folder
} from '@element-plus/icons-vue'
import { useKnowledgeStore } from '@/stores/knowledgeStore'
import { useProgressStore } from '@/stores/progressStore'

interface PathItem {
  id: string
  title: string
  chapterName: string
  status: 'not-started' | 'in-progress' | 'completed' | 'mastered'
  isWeak?: boolean
  isPrerequisite?: boolean
  isNext?: boolean
}

interface ChapterProgress {
  id: string
  shortName: string
  completed: number
  total: number
  percentage: number
}

const router = useRouter()
const knowledgeStore = useKnowledgeStore()
const progressStore = useProgressStore()

const expandedChapter = ref<string | null>(null)

// 总进度
const overallProgress = computed(() => {
  const total = knowledgeStore.knowledgePoints.length
  if (total === 0) return 0
  return Math.round((progressStore.learnedCount / total) * 100)
})

// 剩余待学习数量
const remainingCount = computed(() => {
  const total = knowledgeStore.knowledgePoints.length
  return total - progressStore.learnedCount - progressStore.inProgressCount
})

// 进度颜色
const progressColor = computed(() => {
  if (overallProgress.value >= 80) return '#67C23A'
  if (overallProgress.value >= 50) return '#409EFF'
  if (overallProgress.value >= 30) return '#E6A23C'
  return '#F56C6C'
})

// 薄弱知识点
const weakPoints = computed(() => {
  return progressStore.getWeakKnowledgePoints()
})

// 章节进度
const chaptersProgress = computed<ChapterProgress[]>(() => {
  return knowledgeStore.chapters.map(chapter => {
    const kpIds: string[] = []
    chapter.sections.forEach(section => {
      kpIds.push(...section.knowledgePoints)
    })
    const progress = progressStore.getChapterProgress(chapter.id, kpIds)

    // 提取简短名称
    const match = chapter.title.match(/第.章\s*(.+)/)
    const shortName = match ? match[1].substring(0, 6) : chapter.title

    return {
      id: chapter.id,
      shortName,
      completed: progress.completed,
      total: progress.total,
      percentage: progress.percentage
    }
  })
})

// 推荐学习路径
const recommendedPath = computed<PathItem[]>(() => {
  const path: PathItem[] = []
  const weakPointIds = new Set(weakPoints.value.map(w => w.knowledgePointId))

  // 1. 首先添加薄弱知识点
  weakPoints.value.slice(0, 2).forEach(wp => {
    const kp = knowledgeStore.getKnowledgePointById(wp.knowledgePointId)
    if (kp) {
      // 使用索引 O(1) 查找
      const chapter = knowledgeStore.getChapterById(kp.chapterId)
      path.push({
        id: kp.id,
        title: kp.title,
        chapterName: chapter?.title.replace(/^第.章\s*/, '') || '',
        status: progressStore.getStatus(kp.id),
        isWeak: true
      })
    }
  })

  // 2. 找到当前学习的知识点，推荐其未完成的前置知识
  const lastKpId = progressStore.getLastLearnedKnowledgePointId()
  if (lastKpId) {
    const lastKp = knowledgeStore.getKnowledgePointById(lastKpId)
    if (lastKp && lastKp.prerequisites) {
      lastKp.prerequisites.forEach(prereqId => {
        if (path.length >= 5) return
        if (path.some(p => p.id === prereqId)) return

        const status = progressStore.getStatus(prereqId)
        if (status !== 'completed' && status !== 'mastered') {
          const kp = knowledgeStore.getKnowledgePointById(prereqId)
          if (kp) {
            // 使用索引 O(1) 查找
            const chapter = knowledgeStore.getChapterById(kp.chapterId)
            path.push({
              id: kp.id,
              title: kp.title,
              chapterName: chapter?.title.replace(/^第.章\s*/, '') || '',
              status,
              isPrerequisite: true
            })
          }
        }
      })
    }
  }

  // 3. 按顺序推荐下一个未学习的知识点
  for (const chapter of knowledgeStore.chapters) {
    if (path.length >= 5) break
    for (const section of chapter.sections) {
      if (path.length >= 5) break
      for (const kpId of section.knowledgePoints) {
        if (path.length >= 5) break
        if (path.some(p => p.id === kpId)) continue
        if (weakPointIds.has(kpId)) continue

        const status = progressStore.getStatus(kpId)
        if (status === 'not-started' || status === 'in-progress') {
          const kp = knowledgeStore.getKnowledgePointById(kpId)
          if (kp) {
            path.push({
              id: kp.id,
              title: kp.title,
              chapterName: chapter.title.replace(/^第.章\s*/, ''),
              status,
              isNext: true
            })
          }
        }
      }
    }
  }

  return path
})

const getKnowledgePointTitle = (kpId: string) => {
  const kp = knowledgeStore.getKnowledgePointById(kpId)
  return kp?.title || kpId
}

const getErrorRateColor = (rate: number) => {
  if (rate >= 60) return '#F56C6C'
  if (rate >= 40) return '#E6A23C'
  return '#409EFF'
}

const getChapterColor = (percentage: number) => {
  if (percentage >= 80) return '#67C23A'
  if (percentage >= 50) return '#409EFF'
  if (percentage >= 20) return '#E6A23C'
  return '#909399'
}

const goToKnowledgePoint = (kpId: string) => {
  router.push(`/learn/${kpId}`)
}

const toggleChapter = (chapterId: string) => {
  expandedChapter.value = expandedChapter.value === chapterId ? null : chapterId
}

const refreshPath = () => {
  // 触发重新计算（computed 会自动更新）
}

// 数据已在 App.vue 中全局加载，无需重复加载
</script>

<style lang="scss" scoped>
.learning-path-panel {
  background-color: var(--card-bg);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;

  .header-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    font-size: 15px;
  }

  .el-button {
    color: white;
    opacity: 0.8;
    &:hover { opacity: 1; }
  }
}

.path-content {
  padding: 20px;
}

.progress-overview {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 16px;
  background-color: var(--bg-color);
  border-radius: 12px;
  margin-bottom: 20px;

  .progress-ring {
    flex-shrink: 0;
  }

  .progress-inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    line-height: 1.2;

    .progress-value {
      font-size: 18px;
      font-weight: 700;
      color: var(--text-color);
    }

    .progress-label {
      font-size: 11px;
      color: var(--text-color-secondary);
    }
  }

  .progress-stats {
    display: flex;
    gap: 24px;
    flex: 1;
    justify-content: center;

    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;

      .stat-value {
        font-size: 24px;
        font-weight: 700;
        color: var(--text-color);
      }

      .stat-label {
        font-size: 12px;
        color: var(--text-color-secondary);
      }
    }
  }
}

.path-section,
.weak-section,
.chapters-section {
  margin-bottom: 20px;

  &:last-child {
    margin-bottom: 0;
  }
}

.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 12px;

  &.warning {
    color: #E6A23C;
  }

  .el-icon {
    font-size: 16px;
  }
}

.empty-path {
  text-align: center;
  padding: 24px;
  color: var(--text-color-secondary);

  .el-icon {
    color: #67C23A;
    margin-bottom: 8px;
  }

  p {
    margin: 0;
    font-size: 14px;
  }
}

.path-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.path-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background-color: var(--bg-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: var(--hover-bg);
    transform: translateX(4px);
  }

  &.current {
    background-color: var(--primary-color-light);
    border: 1px solid var(--primary-color);

    .path-index {
      background-color: var(--primary-color);
      color: white;
    }
  }

  &.weak {
    border-left: 3px solid #F56C6C;
  }
}

.path-index {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--border-color);
  border-radius: 50%;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-color-secondary);
  flex-shrink: 0;

  .current-badge {
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.path-info {
  flex: 1;
  min-width: 0;

  .path-title {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-color);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .path-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 4px;

    .chapter-name {
      font-size: 12px;
      color: var(--text-color-secondary);
    }
  }
}

.path-status {
  flex-shrink: 0;

  .status-icon {
    font-size: 20px;

    &.completed {
      color: #67C23A;
    }

    &.in-progress {
      color: #E6A23C;
      animation: spin 2s linear infinite;
    }

    &.not-started {
      color: var(--text-color-placeholder);
    }
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.weak-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.weak-item {
  padding: 12px;
  background-color: #fef0f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: #fde2e2;
  }

  .weak-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;

    .weak-title {
      font-size: 13px;
      font-weight: 500;
      color: var(--text-color);
    }

    .weak-rate {
      font-size: 12px;
      color: #F56C6C;
      font-weight: 600;
    }
  }
}

.chapters-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.chapter-item {
  padding: 12px;
  background-color: var(--bg-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: var(--hover-bg);
  }

  .chapter-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;

    .chapter-name {
      font-size: 12px;
      font-weight: 500;
      color: var(--text-color);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .chapter-progress {
      font-size: 11px;
      color: var(--text-color-secondary);
      flex-shrink: 0;
    }
  }
}
</style>
