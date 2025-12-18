<template>
  <div class="home-view">
    <div class="hero-section">
      <h1 class="hero-title">
        <span class="math-symbol">∑</span>
        Math Helper
      </h1>
      <p class="hero-subtitle">高等数学可视化学习工具</p>
      <p class="hero-desc">让抽象数学变得直观易懂</p>
    </div>

    <!-- 快速继续 -->
    <div v-if="lastLearnedPoint" class="continue-section">
      <div class="continue-card" @click="continueLastLearning">
        <div class="continue-icon">
          <el-icon :size="24"><VideoPlay /></el-icon>
        </div>
        <div class="continue-info">
          <span class="continue-label">继续学习</span>
          <span class="continue-title">{{ lastLearnedPoint.title }}</span>
        </div>
        <el-icon class="continue-arrow"><ArrowRight /></el-icon>
      </div>
    </div>

    <!-- 复习提醒 -->
    <div class="review-section">
      <ReviewReminder />
    </div>

    <!-- 学习进度 -->
    <div class="progress-section">
      <h2>我的学习进度</h2>
      <div class="progress-stats">
        <div class="progress-item">
          <el-progress
            type="circle"
            :percentage="progressPercentage"
            :width="80"
            :stroke-width="8"
            :color="progressColor"
          >
            <template #default>
              <span class="progress-value">{{ progressStore.learnedCount }}</span>
            </template>
          </el-progress>
          <span class="progress-label">已掌握</span>
        </div>
        <div class="progress-item">
          <div class="progress-number">{{ progressStore.inProgressCount }}</div>
          <span class="progress-label">学习中</span>
        </div>
        <div class="progress-item">
          <div class="progress-number">{{ progressStore.totalTimeSpent }}</div>
          <span class="progress-label">学习分钟</span>
        </div>
        <div class="progress-item">
          <div class="progress-number">{{ progressStore.favoritesCount }}</div>
          <span class="progress-label">收藏</span>
        </div>
        <div class="progress-item">
          <div class="progress-number">{{ progressStore.todayPracticeCount }}</div>
          <span class="progress-label">今日练习</span>
        </div>
        <div class="progress-item">
          <div class="progress-number streak">{{ progressStore.streakDays }}</div>
          <span class="progress-label">连续天数</span>
        </div>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-section">
      <div class="stat-card">
        <div class="stat-value">{{ stats.chapters }}</div>
        <div class="stat-label">章节</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ stats.knowledgePoints }}</div>
        <div class="stat-label">知识点</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ stats.formulas }}</div>
        <div class="stat-label">公式</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ stats.examples }}</div>
        <div class="stat-label">例题</div>
      </div>
    </div>

    <!-- 学习路径推荐 -->
    <div class="learning-path-section">
      <LearningPathPanel />
    </div>

    <!-- 继续学习 -->
    <div v-if="recentLearning.length" class="recent-section">
      <h2>
        <el-icon><Clock /></el-icon>
        继续学习
      </h2>
      <div class="recent-list">
        <div
          v-for="item in recentLearning"
          :key="item.id"
          class="recent-item"
          @click="goToKnowledgePoint(item.id)"
        >
          <div class="recent-info">
            <span class="recent-title">{{ item.title }}</span>
            <div class="recent-meta">
              <span class="recent-chapter">{{ getChapterTitle(item.chapterId) }}</span>
              <el-tag :type="getStatusType(item.status)" size="small">{{ getStatusLabel(item.status) }}</el-tag>
            </div>
          </div>
          <div class="recent-time">{{ formatTime(item.lastVisitTime) }}</div>
        </div>
      </div>
    </div>

    <div class="features-grid">
      <div
        v-for="feature in features"
        :key="feature.title"
        class="feature-card"
        @click="goTo(feature.path)"
      >
        <div class="feature-icon" :style="{ backgroundColor: feature.color }">
          <el-icon :size="32"><component :is="feature.icon" /></el-icon>
        </div>
        <h3 class="feature-title">{{ feature.title }}</h3>
        <p class="feature-desc">{{ feature.desc }}</p>
      </div>
    </div>

    <!-- 高级功能 -->
    <div class="advanced-section">
      <h2>
        <el-icon><MagicStick /></el-icon>
        高级功能
      </h2>
      <div class="advanced-grid">
        <div
          v-for="feature in advancedFeatures"
          :key="feature.title"
          class="advanced-card"
          @click="goTo(feature.path)"
        >
          <div class="advanced-icon" :style="{ backgroundColor: feature.color }">
            <el-icon :size="24"><component :is="feature.icon" /></el-icon>
          </div>
          <div class="advanced-info">
            <h3 class="advanced-title">{{ feature.title }}</h3>
            <p class="advanced-desc">{{ feature.desc }}</p>
          </div>
          <el-icon class="advanced-arrow"><ArrowRight /></el-icon>
        </div>
      </div>
    </div>

    <!-- 高频考点推荐 -->
    <div class="recommend-section">
      <h2>
        <el-icon><Star /></el-icon>
        高频考点
      </h2>
      <div class="recommend-list">
        <div
          v-for="kp in highFrequencyPoints"
          :key="kp.id"
          class="recommend-item"
          @click="goToKnowledgePoint(kp.id)"
        >
          <div class="recommend-info">
            <span class="recommend-title">{{ kp.title }}</span>
            <span class="recommend-chapter">{{ getChapterTitle(kp.chapterId) }}</span>
          </div>
          <el-tag type="danger" size="small">必考</el-tag>
        </div>
      </div>
    </div>

    <!-- 快速开始 -->
    <div class="quick-start">
      <h2>快速开始</h2>
      <div class="quick-actions">
        <el-button type="primary" size="large" @click="goTo('/graph')">
          <el-icon><TrendCharts /></el-icon>
          开始绘图
        </el-button>
        <el-button size="large" @click="goTo('/learn')">
          <el-icon><Reading /></el-icon>
          开始学习
        </el-button>
        <el-button size="large" @click="goTo('/formula')">
          <el-icon><Document /></el-icon>
          公式速查
        </el-button>
      </div>
    </div>

    <!-- 底部信息 -->
    <div class="footer-info">
      <p>面向大学生和考研群体的数学学习工具</p>
      <p class="version">v0.1.0 MVP · 使用 Vue 3 + TypeScript + ECharts 构建</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { TrendCharts, Reading, Document, MagicStick, Star, Clock, VideoPlay, ArrowRight, EditPen, Histogram, Share } from '@element-plus/icons-vue'
import { useKnowledgeStore } from '@/stores/knowledgeStore'
import { useProgressStore } from '@/stores/progressStore'
import ReviewReminder from '@/components/memory/ReviewReminder.vue'
import LearningPathPanel from '@/components/learn/LearningPathPanel.vue'

const router = useRouter()
const knowledgeStore = useKnowledgeStore()
const progressStore = useProgressStore()

const features = [
  {
    title: '函数绘图',
    desc: '输入公式，实时绘制函数曲线，支持参数调节、特殊点标注和多函数对比',
    icon: TrendCharts,
    color: '#409EFF',
    path: '/graph'
  },
  {
    title: '知识学习',
    desc: '交互式动画演示极限、导数、积分等核心概念，配合生动比喻助理解',
    icon: Reading,
    color: '#67C23A',
    path: '/learn'
  },
  {
    title: '公式速查',
    desc: '60+高等数学核心公式卡片，LaTeX渲染，按章节分类，支持搜索',
    icon: Document,
    color: '#E6A23C',
    path: '/formula'
  },
  {
    title: '例题练习',
    desc: '多种练习模式，分步引导解题，智能提示系统，错题自动收集',
    icon: EditPen,
    color: '#F56C6C',
    path: '/practice'
  }
]

// 高级功能
const advancedFeatures = [
  {
    title: '3D曲面绘图',
    desc: '三维曲面可视化，支持参数曲面、临界点分析、切平面和梯度场',
    icon: Histogram,
    color: '#9B59B6',
    path: '/graph-3d'
  },
  {
    title: '知识图谱',
    desc: 'D3.js交互式图谱，展示知识点关联，追踪学习进度，发现知识脉络',
    icon: Share,
    color: '#1ABC9C',
    path: '/knowledge-graph'
  },
  {
    title: '深度理解',
    desc: '概念对比、反例分析、证明动画，深入理解数学本质',
    icon: MagicStick,
    color: '#E74C3C',
    path: '/deep-understanding'
  }
]

// 统计数据
const stats = computed(() => ({
  chapters: knowledgeStore.chapters.length,
  knowledgePoints: knowledgeStore.knowledgePoints.length,
  formulas: knowledgeStore.formulas.length,
  examples: knowledgeStore.examples.length
}))

// 最近学习的知识点
const recentLearning = computed(() => {
  const records = progressStore.learningRecords
  return Object.values(records)
    .filter(r => r.lastVisitTime > 0)
    .sort((a, b) => b.lastVisitTime - a.lastVisitTime)
    .slice(0, 5)
    .map(record => {
      const kp = knowledgeStore.getKnowledgePointById(record.knowledgePointId)
      return {
        id: record.knowledgePointId,
        title: kp?.title || '未知知识点',
        chapterId: kp?.chapterId || '',
        status: record.status,
        lastVisitTime: record.lastVisitTime
      }
    })
})

// 格式化时间
const formatTime = (timestamp: number) => {
  const now = Date.now()
  const diff = now - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return new Date(timestamp).toLocaleDateString('zh-CN')
}

// 获取状态类型
const getStatusType = (status: string): 'primary' | 'success' | 'warning' | 'info' | 'danger' => {
  const types: Record<string, 'primary' | 'success' | 'warning' | 'info' | 'danger'> = {
    'not-started': 'info',
    'in-progress': 'warning',
    'completed': 'success',
    'mastered': 'primary'
  }
  return types[status] || 'info'
}

// 获取状态标签
const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    'not-started': '未学习',
    'in-progress': '学习中',
    'completed': '已完成',
    'mastered': '已掌握'
  }
  return labels[status] || '未学习'
}

// 学习进度百分比
const progressPercentage = computed(() => {
  const total = knowledgeStore.knowledgePoints.length
  if (total === 0) return 0
  return Math.round((progressStore.learnedCount / total) * 100)
})

// 进度条颜色
const progressColor = computed(() => {
  const p = progressPercentage.value
  if (p < 30) return '#F56C6C'
  if (p < 60) return '#E6A23C'
  if (p < 90) return '#409EFF'
  return '#67C23A'
})

// 高频考点
const highFrequencyPoints = computed(() => {
  return knowledgeStore.knowledgePoints
    .filter(kp => kp.examFrequency === 'very-high')
    .slice(0, 6)
})

// 上次学习的知识点
const lastLearnedPoint = computed(() => {
  const lastKpId = progressStore.getLastLearnedKnowledgePointId()
  if (!lastKpId) return null
  return knowledgeStore.getKnowledgePointById(lastKpId)
})

// 继续上次学习
const continueLastLearning = () => {
  if (lastLearnedPoint.value) {
    router.push(`/learn/${lastLearnedPoint.value.id}`)
  }
}

// 获取章节标题
const getChapterTitle = (chapterId: string) => {
  // 使用索引 O(1) 查找
  const chapter = knowledgeStore.getChapterById(chapterId)
  return chapter?.title.replace(/^第.章\s*/, '') || ''
}

const goTo = (path: string) => {
  router.push(path)
}

const goToKnowledgePoint = (id: string) => {
  router.push(`/learn/${id}`)
}

// 数据已在 App.vue 中全局加载，无需重复加载
</script>

<style lang="scss" scoped>
// ============================================
// iOS 风格首页设计
// ============================================
.home-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px var(--spacing-md);
}

// iOS 大标题风格
.hero-section {
  text-align: left;
  margin-bottom: 32px;
  padding: 0 var(--spacing-sm);

  .hero-title {
    font-size: 34px;
    font-weight: 700;
    color: var(--text-color);
    margin-bottom: 8px;
    letter-spacing: 0.01em;

    .math-symbol {
      color: var(--primary-color);
      margin-right: 8px;
    }
  }

  .hero-subtitle {
    font-size: 17px;
    color: var(--text-color-secondary);
    margin-bottom: 4px;
    font-weight: 400;
  }

  .hero-desc {
    font-size: 15px;
    color: var(--text-color-tertiary);
  }
}

// iOS 风格继续学习卡片
.continue-section {
  margin-bottom: var(--spacing-lg);

  .continue-card {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    padding: var(--spacing-md) var(--spacing-lg);
    background: linear-gradient(135deg, var(--ios-blue), #5AC8FA);
    border-radius: var(--border-radius-lg);
    cursor: pointer;
    transition: all 0.25s var(--transition-timing);
    color: white;

    &:hover {
      transform: scale(1.02);
    }

    &:active {
      transform: scale(0.98);
    }

    .continue-icon {
      width: 44px;
      height: 44px;
      border-radius: 11px;
      background-color: rgba(255, 255, 255, 0.25);
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(10px);
    }

    .continue-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;

      .continue-label {
        font-size: 13px;
        opacity: 0.9;
        font-weight: 500;
      }

      .continue-title {
        font-size: 17px;
        font-weight: 600;
      }
    }

    .continue-arrow {
      font-size: 18px;
      opacity: 0.9;
    }
  }
}

.review-section {
  margin-bottom: var(--spacing-lg);
}

// iOS 分组卡片风格
.progress-section {
  background-color: var(--card-bg);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);

  h2 {
    font-size: 20px;
    font-weight: 600;
    color: var(--text-color);
    margin-bottom: var(--spacing-md);
  }

  .progress-stats {
    display: flex;
    justify-content: space-around;
    align-items: flex-start;
    flex-wrap: wrap;
    gap: var(--spacing-md);
  }

  .progress-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-xs);
    min-width: 60px;

    .progress-value {
      font-size: 22px;
      font-weight: 700;
      color: var(--primary-color);
    }

    .progress-number {
      font-size: 28px;
      font-weight: 700;
      color: var(--primary-color);
      font-feature-settings: 'tnum';

      &.streak {
        color: var(--ios-orange);
      }
    }

    .progress-label {
      font-size: 12px;
      color: var(--text-color-tertiary);
      text-align: center;
    }
  }
}

// iOS 风格统计卡片网格
.stats-section {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-lg);

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }

  .stat-card {
    background-color: var(--card-bg);
    border-radius: var(--border-radius);
    padding: var(--spacing-md);
    text-align: center;

    .stat-value {
      font-size: 28px;
      font-weight: 700;
      color: var(--primary-color);
      margin-bottom: 4px;
      font-feature-settings: 'tnum';
    }

    .stat-label {
      font-size: 13px;
      color: var(--text-color-tertiary);
    }
  }
}

.learning-path-section {
  margin-bottom: var(--spacing-xl);
}

// iOS 列表风格
.recent-section {
  background-color: var(--card-bg);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  margin-bottom: var(--spacing-xl);

  h2 {
    font-size: 20px;
    font-weight: 600;
    color: var(--text-color);
    padding: var(--spacing-md) var(--spacing-lg);
    padding-bottom: var(--spacing-sm);
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);

    .el-icon {
      color: var(--primary-color);
    }
  }

  .recent-list {
    display: flex;
    flex-direction: column;
  }

  .recent-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 11px var(--spacing-lg);
    cursor: pointer;
    transition: background-color 0.15s ease;
    position: relative;

    // iOS 风格分隔线
    &:not(:last-child)::after {
      content: '';
      position: absolute;
      left: var(--spacing-lg);
      right: 0;
      bottom: 0;
      height: 0.5px;
      background-color: var(--separator-color);
    }

    &:active {
      background-color: var(--active-bg);
    }

    .recent-info {
      flex: 1;

      .recent-title {
        display: block;
        font-size: 17px;
        font-weight: 400;
        color: var(--text-color);
        margin-bottom: 2px;
      }

      .recent-meta {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);

        .recent-chapter {
          font-size: 13px;
          color: var(--text-color-tertiary);
        }
      }
    }

    .recent-time {
      font-size: 13px;
      color: var(--text-color-tertiary);
      flex-shrink: 0;
      margin-left: var(--spacing-md);
    }
  }
}

// iOS App 风格功能网格
.features-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xl);

  @media (min-width: 768px) {
    grid-template-columns: repeat(4, 1fr);
  }
}

.feature-card {
  background-color: var(--card-bg);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-lg) var(--spacing-md);
  cursor: pointer;
  transition: all 0.25s var(--transition-timing);
  text-align: center;

  &:hover {
    transform: scale(1.02);
  }

  &:active {
    transform: scale(0.98);
    background-color: var(--active-bg);
  }

  .feature-icon {
    width: 60px;
    height: 60px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto var(--spacing-md);
    color: white;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .feature-title {
    font-size: 15px;
    font-weight: 600;
    color: var(--text-color);
    margin-bottom: 4px;
  }

  .feature-desc {
    font-size: 12px;
    color: var(--text-color-tertiary);
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}

// iOS 风格高级功能区
.advanced-section {
  background-color: var(--card-bg);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  margin-bottom: var(--spacing-xl);

  h2 {
    font-size: 20px;
    font-weight: 600;
    color: var(--text-color);
    padding: var(--spacing-md) var(--spacing-lg);
    padding-bottom: var(--spacing-sm);
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);

    .el-icon {
      color: var(--ios-purple);
    }
  }

  .advanced-grid {
    display: flex;
    flex-direction: column;
  }

  .advanced-card {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    padding: 14px var(--spacing-lg);
    cursor: pointer;
    transition: background-color 0.15s ease;
    position: relative;

    &:not(:last-child)::after {
      content: '';
      position: absolute;
      left: calc(var(--spacing-lg) + 48px);
      right: 0;
      bottom: 0;
      height: 0.5px;
      background-color: var(--separator-color);
    }

    &:active {
      background-color: var(--active-bg);
    }

    .advanced-icon {
      width: 44px;
      height: 44px;
      border-radius: 11px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      flex-shrink: 0;
    }

    .advanced-info {
      flex: 1;
      min-width: 0;

      .advanced-title {
        font-size: 17px;
        font-weight: 500;
        color: var(--text-color);
        margin-bottom: 2px;
      }

      .advanced-desc {
        font-size: 13px;
        color: var(--text-color-tertiary);
        line-height: 1.4;
        display: -webkit-box;
        -webkit-line-clamp: 1;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
    }

    .advanced-arrow {
      color: var(--text-color-tertiary);
      flex-shrink: 0;
    }
  }
}

// iOS 列表风格推荐区
.recommend-section {
  background-color: var(--card-bg);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  margin-bottom: var(--spacing-xl);

  h2 {
    font-size: 20px;
    font-weight: 600;
    color: var(--text-color);
    padding: var(--spacing-md) var(--spacing-lg);
    padding-bottom: var(--spacing-sm);
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);

    .el-icon {
      color: var(--ios-orange);
    }
  }

  .recommend-list {
    display: flex;
    flex-direction: column;
  }

  .recommend-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 11px var(--spacing-lg);
    cursor: pointer;
    transition: background-color 0.15s ease;
    position: relative;

    &:not(:last-child)::after {
      content: '';
      position: absolute;
      left: var(--spacing-lg);
      right: 0;
      bottom: 0;
      height: 0.5px;
      background-color: var(--separator-color);
    }

    &:active {
      background-color: var(--active-bg);
    }

    .recommend-info {
      display: flex;
      flex-direction: column;
      gap: 2px;

      .recommend-title {
        font-size: 17px;
        font-weight: 400;
        color: var(--text-color);
      }

      .recommend-chapter {
        font-size: 13px;
        color: var(--text-color-tertiary);
      }
    }
  }
}

// iOS 风格快速开始
.quick-start {
  text-align: center;
  margin-bottom: var(--spacing-xl);
  padding: var(--spacing-lg);
  background-color: var(--card-bg);
  border-radius: var(--border-radius-lg);

  h2 {
    font-size: 20px;
    font-weight: 600;
    color: var(--text-color);
    margin-bottom: var(--spacing-lg);
  }

  .quick-actions {
    display: flex;
    gap: var(--spacing-sm);
    justify-content: center;
    flex-wrap: wrap;

    .el-button {
      min-width: 120px;
      border-radius: var(--border-radius);
      font-weight: 500;
    }
  }
}

// iOS 风格底部信息
.footer-info {
  text-align: center;
  padding: var(--spacing-lg) var(--spacing-md);

  p {
    color: var(--text-color-tertiary);
    font-size: 13px;
    margin-bottom: 4px;
  }

  .version {
    font-size: 12px;
    color: var(--text-color-placeholder);
  }
}
</style>
