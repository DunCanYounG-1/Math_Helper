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
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { TrendCharts, Reading, Document, MagicStick, Star, Clock, VideoPlay, ArrowRight, EditPen } from '@element-plus/icons-vue'
import { useKnowledgeStore } from '@/stores/knowledgeStore'
import { useProgressStore } from '@/stores/progressStore'
import ReviewReminder from '@/components/memory/ReviewReminder.vue'

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
    title: 'AI助手',
    desc: '通义千问驱动，用生活化比喻解释数学概念，让学习更有趣',
    icon: MagicStick,
    color: '#F56C6C',
    path: '/learn'
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
const getStatusType = (status: string) => {
  const types: Record<string, string> = {
    'not-started': 'info',
    'in-progress': 'warning',
    'completed': 'success',
    'mastered': ''
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
  const chapter = knowledgeStore.chapters.find(ch => ch.id === chapterId)
  return chapter?.title.replace(/^第.章\s*/, '') || ''
}

const goTo = (path: string) => {
  router.push(path)
}

const goToKnowledgePoint = (id: string) => {
  router.push(`/learn/${id}`)
}

onMounted(() => {
  knowledgeStore.loadKnowledgeData()
  progressStore.loadFromStorage()
})
</script>

<style lang="scss" scoped>
.home-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
}

.hero-section {
  text-align: center;
  margin-bottom: 40px;

  .hero-title {
    font-size: 48px;
    font-weight: 700;
    color: var(--text-color);
    margin-bottom: 16px;

    .math-symbol {
      color: var(--primary-color);
      margin-right: 12px;
    }
  }

  .hero-subtitle {
    font-size: 24px;
    color: var(--text-color-secondary);
    margin-bottom: 8px;
  }

  .hero-desc {
    font-size: 16px;
    color: var(--text-color-placeholder);
  }
}

// 继续学习卡片
.continue-section {
  margin-bottom: 24px;

  .continue-card {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px 24px;
    background: linear-gradient(135deg, var(--primary-color), #6aa3ff);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s;
    color: white;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(64, 158, 255, 0.3);
    }

    .continue-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background-color: rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .continue-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;

      .continue-label {
        font-size: 12px;
        opacity: 0.8;
      }

      .continue-title {
        font-size: 16px;
        font-weight: 600;
      }
    }

    .continue-arrow {
      font-size: 20px;
      opacity: 0.8;
    }
  }
}

.review-section {
  margin-bottom: 24px;
}

.progress-section {
  background-color: var(--card-bg);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 40px;
  box-shadow: var(--box-shadow-light);

  h2 {
    font-size: 18px;
    color: var(--text-color);
    margin-bottom: 20px;
  }

  .progress-stats {
    display: flex;
    justify-content: space-around;
    align-items: center;
    flex-wrap: wrap;
    gap: 20px;
  }

  .progress-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;

    .progress-value {
      font-size: 20px;
      font-weight: 700;
      color: var(--primary-color);
    }

    .progress-number {
      font-size: 32px;
      font-weight: 700;
      color: var(--primary-color);

      &.streak {
        color: #E6A23C;
      }
    }

    .progress-label {
      font-size: 13px;
      color: var(--text-color-secondary);
    }
  }
}

.stats-section {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 40px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }

  .stat-card {
    background-color: var(--card-bg);
    border-radius: 12px;
    padding: 24px;
    text-align: center;
    box-shadow: var(--box-shadow-light);

    .stat-value {
      font-size: 36px;
      font-weight: 700;
      color: var(--primary-color);
      margin-bottom: 8px;
    }

    .stat-label {
      font-size: 14px;
      color: var(--text-color-secondary);
    }
  }
}

.recent-section {
  background-color: var(--card-bg);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 40px;
  box-shadow: var(--box-shadow-light);

  h2 {
    font-size: 18px;
    color: var(--text-color);
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 8px;

    .el-icon {
      color: var(--primary-color);
    }
  }

  .recent-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .recent-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background-color: var(--bg-color);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background-color: var(--primary-color-light);
      transform: translateX(4px);
    }

    .recent-info {
      flex: 1;

      .recent-title {
        display: block;
        font-weight: 500;
        color: var(--text-color);
        margin-bottom: 4px;
      }

      .recent-meta {
        display: flex;
        align-items: center;
        gap: 8px;

        .recent-chapter {
          font-size: 12px;
          color: var(--text-color-secondary);
        }
      }
    }

    .recent-time {
      font-size: 12px;
      color: var(--text-color-placeholder);
      flex-shrink: 0;
      margin-left: 16px;
    }
  }
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
}

.feature-card {
  background-color: var(--card-bg);
  border-radius: 12px;
  padding: 32px 24px;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: var(--box-shadow-light);

  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--box-shadow);
  }

  .feature-icon {
    width: 64px;
    height: 64px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
    color: white;
  }

  .feature-title {
    font-size: 18px;
    font-weight: 600;
    color: var(--text-color);
    margin-bottom: 8px;
  }

  .feature-desc {
    font-size: 14px;
    color: var(--text-color-secondary);
    line-height: 1.6;
  }
}

.recommend-section {
  background-color: var(--card-bg);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 40px;
  box-shadow: var(--box-shadow-light);

  h2 {
    font-size: 18px;
    color: var(--text-color);
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 8px;

    .el-icon {
      color: var(--warning-color);
    }
  }

  .recommend-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 12px;
  }

  .recommend-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background-color: var(--bg-color);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background-color: var(--primary-color-light);
    }

    .recommend-info {
      display: flex;
      flex-direction: column;
      gap: 4px;

      .recommend-title {
        font-weight: 500;
        color: var(--text-color);
      }

      .recommend-chapter {
        font-size: 12px;
        color: var(--text-color-secondary);
      }
    }
  }
}

.quick-start {
  text-align: center;
  margin-bottom: 40px;

  h2 {
    font-size: 24px;
    color: var(--text-color);
    margin-bottom: 24px;
  }

  .quick-actions {
    display: flex;
    gap: 16px;
    justify-content: center;
    flex-wrap: wrap;

    .el-button {
      min-width: 140px;
    }
  }
}

.footer-info {
  text-align: center;
  padding-top: 20px;
  border-top: 1px solid var(--border-color);

  p {
    color: var(--text-color-secondary);
    font-size: 14px;
    margin-bottom: 4px;
  }

  .version {
    font-size: 12px;
    color: var(--text-color-placeholder);
  }
}
</style>
