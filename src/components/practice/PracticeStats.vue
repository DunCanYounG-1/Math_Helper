<template>
  <div class="practice-stats">
    <!-- 总体统计 -->
    <div class="section overall-stats">
      <h3 class="section-title">
        <el-icon><DataAnalysis /></el-icon>
        总体统计
      </h3>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon primary">
            <el-icon><Edit /></el-icon>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ totalPractice }}</span>
            <span class="stat-label">累计练习</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon success">
            <el-icon><CircleCheck /></el-icon>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ progressStore.practiceStats.correct }}</span>
            <span class="stat-label">正确答题</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon warning">
            <el-icon><CircleClose /></el-icon>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ progressStore.practiceStats.wrong }}</span>
            <span class="stat-label">错误答题</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon info">
            <el-icon><Timer /></el-icon>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ totalTimeFormatted }}</span>
            <span class="stat-label">累计用时</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 正确率分析 -->
    <div class="section accuracy-section">
      <h3 class="section-title">
        <el-icon><PieChart /></el-icon>
        正确率分析
      </h3>
      <div class="accuracy-display">
        <div class="accuracy-ring">
          <el-progress
            type="circle"
            :percentage="progressStore.practiceStats.accuracy"
            :width="160"
            :stroke-width="12"
            :color="accuracyColor"
          >
            <template #default="{ percentage }">
              <div class="ring-content">
                <span class="ring-value">{{ percentage }}%</span>
                <span class="ring-label">正确率</span>
              </div>
            </template>
          </el-progress>
        </div>
        <div class="accuracy-breakdown">
          <div class="breakdown-item correct">
            <span class="breakdown-label">正确</span>
            <div class="breakdown-bar">
              <div
                class="bar-fill"
                :style="{ width: correctPercent + '%' }"
              ></div>
            </div>
            <span class="breakdown-value">{{ progressStore.practiceStats.correct }}</span>
          </div>
          <div class="breakdown-item wrong">
            <span class="breakdown-label">错误</span>
            <div class="breakdown-bar">
              <div
                class="bar-fill"
                :style="{ width: wrongPercent + '%' }"
              ></div>
            </div>
            <span class="breakdown-value">{{ progressStore.practiceStats.wrong }}</span>
          </div>
          <div class="breakdown-item skipped">
            <span class="breakdown-label">跳过</span>
            <div class="breakdown-bar">
              <div
                class="bar-fill"
                :style="{ width: skippedPercent + '%' }"
              ></div>
            </div>
            <span class="breakdown-value">{{ progressStore.practiceStats.skipped }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 难度分布 -->
    <div class="section difficulty-section">
      <h3 class="section-title">
        <el-icon><Histogram /></el-icon>
        难度分布
      </h3>
      <div class="difficulty-stats">
        <div
          v-for="diff in difficultyStats"
          :key="diff.level"
          class="difficulty-item"
        >
          <div class="difficulty-header">
            <el-tag :type="diff.type" size="small">{{ diff.label }}</el-tag>
            <span class="difficulty-accuracy" :style="{ color: getAccuracyColor(diff.accuracy) }">
              {{ diff.accuracy }}%
            </span>
          </div>
          <div class="difficulty-bar-container">
            <div class="difficulty-bar">
              <div
                class="bar-correct"
                :style="{ width: diff.correctPercent + '%' }"
              ></div>
              <div
                class="bar-wrong"
                :style="{ width: diff.wrongPercent + '%' }"
              ></div>
            </div>
          </div>
          <div class="difficulty-counts">
            <span class="count-item">
              <span class="count-dot correct"></span>
              {{ diff.correct }}
            </span>
            <span class="count-item">
              <span class="count-dot wrong"></span>
              {{ diff.wrong }}
            </span>
            <span class="count-item total">共 {{ diff.total }} 题</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 薄弱知识点 -->
    <div class="section weak-points-section" v-if="weakKnowledgePoints.length > 0">
      <h3 class="section-title">
        <el-icon><Warning /></el-icon>
        薄弱知识点
        <span class="title-hint">（错误率 ≥ 40%）</span>
      </h3>
      <div class="weak-points-list">
        <div
          v-for="point in weakKnowledgePoints"
          :key="point.knowledgePointId"
          class="weak-point-item"
        >
          <div class="point-info">
            <span class="point-title">{{ getKnowledgePointTitle(point.knowledgePointId) }}</span>
            <span class="point-stats">
              做题 {{ point.total }} 次，错误 {{ point.wrong }} 次
            </span>
          </div>
          <div class="point-rate">
            <el-progress
              :percentage="point.errorRate"
              :stroke-width="8"
              :color="getErrorRateColor(point.errorRate)"
            />
          </div>
          <el-button
            type="primary"
            size="small"
            plain
            @click="goToLearn(point.knowledgePointId)"
          >
            去学习
          </el-button>
        </div>
      </div>
    </div>

    <!-- 最近练习记录 -->
    <div class="section recent-section">
      <h3 class="section-title">
        <el-icon><Clock /></el-icon>
        最近练习
      </h3>
      <div v-if="recentSessions.length > 0" class="recent-sessions">
        <div
          v-for="session in recentSessions"
          :key="session.id"
          class="session-card"
        >
          <div class="session-header">
            <span class="session-mode">
              <el-tag :type="getModeType(session.mode)" size="small">
                {{ getModeLabel(session.mode) }}
              </el-tag>
            </span>
            <span class="session-time">{{ formatSessionTime(session.startTime) }}</span>
          </div>
          <div class="session-stats">
            <span class="session-stat">
              <el-icon><Document /></el-icon>
              {{ session.totalQuestions }} 题
            </span>
            <span class="session-stat correct">
              <el-icon><CircleCheck /></el-icon>
              {{ session.correctCount }}
            </span>
            <span class="session-stat wrong">
              <el-icon><CircleClose /></el-icon>
              {{ session.wrongCount }}
            </span>
            <span class="session-stat accuracy">
              {{ getSessionAccuracy(session) }}%
            </span>
          </div>
          <div class="session-duration">
            用时 {{ formatDuration(session.endTime - session.startTime) }}
          </div>
        </div>
      </div>
      <div v-else class="empty-sessions">
        <el-icon :size="48"><Document /></el-icon>
        <p>暂无练习记录</p>
      </div>
    </div>

    <!-- 每日练习趋势 -->
    <div class="section trend-section" v-if="dailyTrend.length > 0">
      <h3 class="section-title">
        <el-icon><TrendCharts /></el-icon>
        练习趋势（近7天）
      </h3>
      <div class="trend-chart">
        <div class="chart-bars">
          <div
            v-for="day in dailyTrend"
            :key="day.date"
            class="chart-bar-wrapper"
          >
            <div class="bar-container">
              <div
                class="bar correct-bar"
                :style="{ height: getBarHeight(day.correct, maxDailyCount) + '%' }"
              >
                <span v-if="day.correct > 0" class="bar-value">{{ day.correct }}</span>
              </div>
              <div
                class="bar wrong-bar"
                :style="{ height: getBarHeight(day.wrong, maxDailyCount) + '%' }"
              >
                <span v-if="day.wrong > 0" class="bar-value">{{ day.wrong }}</span>
              </div>
            </div>
            <span class="bar-label">{{ day.label }}</span>
          </div>
        </div>
        <div class="chart-legend">
          <span class="legend-item">
            <span class="legend-dot correct"></span>
            正确
          </span>
          <span class="legend-item">
            <span class="legend-dot wrong"></span>
            错误
          </span>
        </div>
      </div>
    </div>

    <!-- 章节正确率对比 -->
    <div class="section chapter-section" v-if="chapterStats.length > 0">
      <h3 class="section-title">
        <el-icon><Reading /></el-icon>
        章节正确率
      </h3>
      <div class="chapter-stats">
        <div
          v-for="chapter in chapterStats"
          :key="chapter.id"
          class="chapter-item"
        >
          <div class="chapter-info">
            <span class="chapter-name">{{ chapter.name }}</span>
            <span class="chapter-count">{{ chapter.total }} 题</span>
          </div>
          <div class="chapter-bar-container">
            <el-progress
              :percentage="chapter.accuracy"
              :stroke-width="10"
              :color="getAccuracyGradient(chapter.accuracy)"
            />
          </div>
          <span class="chapter-accuracy" :style="{ color: getAccuracyColor(chapter.accuracy) }">
            {{ chapter.accuracy }}%
          </span>
        </div>
      </div>
    </div>

    <!-- 题型分析 -->
    <div class="section question-type-section">
      <h3 class="section-title">
        <el-icon><List /></el-icon>
        题型分析
      </h3>
      <div class="question-type-stats">
        <div
          v-for="qType in questionTypeStats"
          :key="qType.type"
          class="question-type-item"
        >
          <div class="type-header">
            <el-icon :style="{ color: qType.color }"><component :is="qType.icon" /></el-icon>
            <span class="type-name">{{ qType.label }}</span>
          </div>
          <div class="type-stats">
            <div class="type-ring">
              <el-progress
                type="circle"
                :percentage="qType.accuracy"
                :width="80"
                :stroke-width="8"
                :color="qType.color"
              >
                <span class="ring-text">{{ qType.accuracy }}%</span>
              </el-progress>
            </div>
            <div class="type-detail">
              <div class="detail-row">
                <span>做题数</span>
                <span class="detail-value">{{ qType.total }}</span>
              </div>
              <div class="detail-row">
                <span>正确数</span>
                <span class="detail-value correct">{{ qType.correct }}</span>
              </div>
              <div class="detail-row">
                <span>错误数</span>
                <span class="detail-value wrong">{{ qType.wrong }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 学习建议 -->
    <div class="section suggestion-section">
      <h3 class="section-title">
        <el-icon><Promotion /></el-icon>
        学习建议
      </h3>
      <div class="suggestions-list">
        <div
          v-for="(suggestion, index) in learningAdvice"
          :key="index"
          class="suggestion-item"
          :class="suggestion.type"
        >
          <div class="suggestion-icon">
            <el-icon><component :is="suggestion.icon" /></el-icon>
          </div>
          <div class="suggestion-content">
            <h4>{{ suggestion.title }}</h4>
            <p>{{ suggestion.content }}</p>
          </div>
          <el-button
            v-if="suggestion.action"
            type="primary"
            size="small"
            plain
            @click="handleSuggestionAction(suggestion)"
          >
            {{ suggestion.actionText }}
          </el-button>
        </div>
      </div>
    </div>

    <!-- 成就徽章 -->
    <div class="section achievement-section">
      <h3 class="section-title">
        <el-icon><Trophy /></el-icon>
        练习成就
      </h3>
      <div class="achievements-grid">
        <div
          v-for="achievement in achievements"
          :key="achievement.id"
          class="achievement-item"
          :class="{ unlocked: achievement.unlocked }"
        >
          <div class="achievement-icon">{{ achievement.icon }}</div>
          <div class="achievement-info">
            <span class="achievement-name">{{ achievement.name }}</span>
            <span class="achievement-desc">{{ achievement.description }}</span>
          </div>
          <div v-if="!achievement.unlocked" class="achievement-progress">
            <el-progress
              :percentage="achievement.progress"
              :stroke-width="6"
              :show-text="false"
            />
            <span class="progress-text">{{ achievement.current }}/{{ achievement.target }}</span>
          </div>
          <el-icon v-else class="achievement-check"><CircleCheckFilled /></el-icon>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, markRaw, type Component } from 'vue'
import { useRouter } from 'vue-router'
import {
  DataAnalysis,
  Edit,
  CircleCheck,
  CircleClose,
  CircleCheckFilled,
  Timer,
  PieChart,
  Histogram,
  Warning,
  Clock,
  Document,
  TrendCharts,
  Reading,
  List,
  Promotion,
  Trophy,
  EditPen,
  Select,
  Tickets,
  Aim,
  Star,
  Sunrise,
  Lightning
} from '@element-plus/icons-vue'
import { useProgressStore } from '@/stores/progressStore'
import { useKnowledgeStore } from '@/stores/knowledgeStore'

const router = useRouter()
const progressStore = useProgressStore()
const knowledgeStore = useKnowledgeStore()

// 总练习数
const totalPractice = computed(() => progressStore.practiceStats.total)

// 累计用时（分钟）
const totalTimeFormatted = computed(() => {
  const totalSeconds = progressStore.practiceRecords.reduce((sum, r) => sum + r.timeSpent, 0)
  const minutes = Math.floor(totalSeconds / 60)
  if (minutes < 60) {
    return `${minutes}分钟`
  }
  const hours = Math.floor(minutes / 60)
  const remainMinutes = minutes % 60
  return `${hours}小时${remainMinutes}分`
})

// 正确率颜色
const accuracyColor = computed(() => {
  const acc = progressStore.practiceStats.accuracy
  if (acc >= 80) return '#67C23A'
  if (acc >= 60) return '#E6A23C'
  return '#F56C6C'
})

// 各类型百分比
const correctPercent = computed(() => {
  const total = totalPractice.value || 1
  return Math.round((progressStore.practiceStats.correct / total) * 100)
})

const wrongPercent = computed(() => {
  const total = totalPractice.value || 1
  return Math.round((progressStore.practiceStats.wrong / total) * 100)
})

const skippedPercent = computed(() => {
  const total = totalPractice.value || 1
  return Math.round((progressStore.practiceStats.skipped / total) * 100)
})

// 难度统计
const difficultyStats = computed(() => {
  const stats: Record<string, { correct: number; wrong: number; total: number }> = {
    basic: { correct: 0, wrong: 0, total: 0 },
    intermediate: { correct: 0, wrong: 0, total: 0 },
    advanced: { correct: 0, wrong: 0, total: 0 }
  }

  progressStore.practiceRecords.forEach(record => {
    const diff = record.difficulty || 'basic'
    if (stats[diff]) {
      stats[diff].total++
      if (record.result === 'correct') {
        stats[diff].correct++
      } else if (record.result === 'wrong') {
        stats[diff].wrong++
      }
    }
  })

  const labels: Record<string, { label: string; type: 'primary' | 'success' | 'warning' | 'info' | 'danger' }> = {
    basic: { label: '基础', type: 'success' },
    intermediate: { label: '中等', type: 'warning' },
    advanced: { label: '进阶', type: 'danger' }
  }

  return ['basic', 'intermediate', 'advanced'].map(level => {
    const s = stats[level]
    const answered = s.correct + s.wrong
    const accuracy = answered > 0 ? Math.round((s.correct / answered) * 100) : 0
    const totalForPercent = s.total || 1
    return {
      level,
      ...labels[level],
      ...s,
      accuracy,
      correctPercent: Math.round((s.correct / totalForPercent) * 100),
      wrongPercent: Math.round((s.wrong / totalForPercent) * 100)
    }
  })
})

// 薄弱知识点
const weakKnowledgePoints = computed(() => {
  return progressStore.getWeakKnowledgePoints()
})

// 获取知识点标题
const getKnowledgePointTitle = (kpId: string) => {
  // 使用索引 O(1) 查找，替代原来的 find() O(n)
  const kp = knowledgeStore.getKnowledgePointById(kpId)
  return kp?.title || kpId
}

// 最近练习会话
const recentSessions = computed(() => {
  return progressStore.getRecentSessions(5)
})

// 每日练习趋势 - 优化：单次遍历计算所有统计
const dailyTrend = computed(() => {
  const days = 7
  const now = new Date()

  // 预先计算每天的时间范围
  const dayRanges: Array<{ date: string; label: string; startTime: number; endTime: number; correct: number; wrong: number }> = []
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    date.setHours(0, 0, 0, 0)
    const nextDate = new Date(date)
    nextDate.setDate(nextDate.getDate() + 1)

    dayRanges.push({
      date: date.toISOString().split('T')[0],
      label: i === 0 ? '今天' : i === 1 ? '昨天' : `${date.getMonth() + 1}/${date.getDate()}`,
      startTime: date.getTime(),
      endTime: nextDate.getTime(),
      correct: 0,
      wrong: 0
    })
  }

  // 单次遍历记录，按时间分配到对应的日期
  progressStore.practiceRecords.forEach(r => {
    for (const day of dayRanges) {
      if (r.practiceAt >= day.startTime && r.practiceAt < day.endTime) {
        if (r.result === 'correct') {
          day.correct++
        } else if (r.result === 'wrong') {
          day.wrong++
        }
        break // 找到匹配的日期后跳出
      }
    }
  })

  return dayRanges.map(d => ({
    date: d.date,
    label: d.label,
    correct: d.correct,
    wrong: d.wrong
  }))
})

// 每日最大练习数
const maxDailyCount = computed(() => {
  return Math.max(
    ...dailyTrend.value.map(d => d.correct + d.wrong),
    1
  )
})

// 辅助函数
const getAccuracyColor = (accuracy: number) => {
  if (accuracy >= 80) return '#67C23A'
  if (accuracy >= 60) return '#E6A23C'
  return '#F56C6C'
}

const getErrorRateColor = (rate: number) => {
  if (rate >= 70) return '#F56C6C'
  if (rate >= 50) return '#E6A23C'
  return '#409EFF'
}

const getModeLabel = (mode: string) => {
  const labels: Record<string, string> = {
    normal: '普通',
    timed: '计时',
    challenge: '挑战'
  }
  return labels[mode] || mode
}

const getModeType = (mode: string): 'primary' | 'success' | 'warning' | 'info' | 'danger' => {
  const types: Record<string, 'primary' | 'success' | 'warning' | 'info' | 'danger'> = {
    normal: 'info',
    timed: 'warning',
    challenge: 'danger'
  }
  return types[mode] || 'info'
}

const formatSessionTime = (timestamp: number) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - timestamp

  if (diff < 86400000 && date.getDate() === now.getDate()) {
    return `今天 ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`
  }

  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.getDate() === yesterday.getDate()) {
    return `昨天 ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`
  }

  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatDuration = (ms: number) => {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainSeconds = seconds % 60
  if (minutes === 0) {
    return `${remainSeconds}秒`
  }
  return `${minutes}分${remainSeconds}秒`
}

const getSessionAccuracy = (session: { correctCount: number; wrongCount: number }) => {
  const answered = session.correctCount + session.wrongCount
  if (answered === 0) return 0
  return Math.round((session.correctCount / answered) * 100)
}

const getBarHeight = (value: number, max: number) => {
  if (max === 0) return 0
  return Math.round((value / max) * 100)
}

const goToLearn = (kpId: string) => {
  router.push(`/learn/${kpId}`)
}

// 章节统计
const chapterStats = computed(() => {
  const stats: Record<string, { correct: number; wrong: number; total: number }> = {}

  // 使用索引 O(1) 查找，替代原来的 find() O(n)
  progressStore.practiceRecords.forEach(record => {
    const kp = knowledgeStore.getKnowledgePointById(record.knowledgePointId)
    if (kp) {
      if (!stats[kp.chapterId]) {
        stats[kp.chapterId] = { correct: 0, wrong: 0, total: 0 }
      }
      stats[kp.chapterId].total++
      if (record.result === 'correct') {
        stats[kp.chapterId].correct++
      } else if (record.result === 'wrong') {
        stats[kp.chapterId].wrong++
      }
    }
  })

  return knowledgeStore.chapters
    .filter(ch => stats[ch.id]?.total > 0)
    .map(ch => {
      const s = stats[ch.id]
      const answered = s.correct + s.wrong
      return {
        id: ch.id,
        name: ch.title.replace(/第.章\s*/, ''),
        total: s.total,
        correct: s.correct,
        wrong: s.wrong,
        accuracy: answered > 0 ? Math.round((s.correct / answered) * 100) : 0
      }
    })
    .sort((a, b) => b.total - a.total)
})

// 题型统计
const questionTypeStats = computed(() => {
  const types: Record<string, { correct: number; wrong: number; total: number }> = {
    choice: { correct: 0, wrong: 0, total: 0 },
    fillBlank: { correct: 0, wrong: 0, total: 0 },
    calculate: { correct: 0, wrong: 0, total: 0 }
  }

  progressStore.practiceRecords.forEach(record => {
    // questionType 字段待扩展，目前默认为 choice
    const type = (record as any).questionType || 'choice'
    if (types[type]) {
      types[type].total++
      if (record.result === 'correct') {
        types[type].correct++
      } else if (record.result === 'wrong') {
        types[type].wrong++
      }
    }
  })

  const typeInfo: Record<string, { label: string; icon: Component; color: string }> = {
    choice: { label: '选择题', icon: markRaw(Select), color: '#409EFF' },
    fillBlank: { label: '填空题', icon: markRaw(EditPen), color: '#67C23A' },
    calculate: { label: '计算题', icon: markRaw(Tickets), color: '#E6A23C' }
  }

  return Object.entries(types).map(([type, s]) => {
    const answered = s.correct + s.wrong
    return {
      type,
      ...typeInfo[type],
      ...s,
      accuracy: answered > 0 ? Math.round((s.correct / answered) * 100) : 0
    }
  })
})

// 学习建议
interface Suggestion {
  type: 'warning' | 'info' | 'success'
  icon: Component
  title: string
  content: string
  action?: string
  actionText?: string
}

const learningAdvice = computed((): Suggestion[] => {
  const advice: Suggestion[] = []
  const stats = progressStore.practiceStats
  const weakPoints = progressStore.getWeakKnowledgePoints()

  // 基于正确率的建议
  if (stats.accuracy < 60 && stats.total >= 10) {
    advice.push({
      type: 'warning',
      icon: markRaw(Warning),
      title: '基础需要加强',
      content: `当前正确率${stats.accuracy}%，建议回顾基础概念，多做简单题目打好基础。`,
      action: 'practice',
      actionText: '练习基础题'
    })
  } else if (stats.accuracy >= 80 && stats.total >= 20) {
    advice.push({
      type: 'success',
      icon: markRaw(Star),
      title: '表现优秀！',
      content: '你的正确率很高，可以尝试更有挑战性的进阶题目。',
      action: 'challenge',
      actionText: '挑战进阶'
    })
  }

  // 基于薄弱知识点的建议
  if (weakPoints.length > 0) {
    const firstWeak = weakPoints[0]
    // 使用索引 O(1) 查找
    const kpTitle = knowledgeStore.getKnowledgePointById(firstWeak.knowledgePointId)?.title || ''
    advice.push({
      type: 'warning',
      icon: markRaw(Aim),
      title: '薄弱知识点提醒',
      content: `「${kpTitle}」错误率较高(${firstWeak.errorRate}%)，建议重点复习。`,
      action: `learn/${firstWeak.knowledgePointId}`,
      actionText: '去复习'
    })
  }

  // 基于练习频率的建议
  const recentDays = dailyTrend.value.filter(d => d.correct + d.wrong > 0).length
  if (recentDays < 3) {
    advice.push({
      type: 'info',
      icon: markRaw(Sunrise),
      title: '保持练习节奏',
      content: '近期练习较少，建议每天保持一定的练习量，保持学习状态。',
      action: 'practice',
      actionText: '开始练习'
    })
  }

  // 默认建议
  if (advice.length === 0) {
    advice.push({
      type: 'info',
      icon: markRaw(Lightning),
      title: '继续保持',
      content: '坚持每日练习，稳步提升数学能力。加油！'
    })
  }

  return advice
})

// 成就系统
interface Achievement {
  id: string
  icon: string
  name: string
  description: string
  unlocked: boolean
  progress: number
  current: number
  target: number
}

const achievements = computed((): Achievement[] => {
  const stats = progressStore.practiceStats
  const records = progressStore.practiceRecords

  return [
    {
      id: 'first-step',
      icon: '🎯',
      name: '初出茅庐',
      description: '完成第一道练习题',
      unlocked: stats.total >= 1,
      progress: Math.min(100, stats.total * 100),
      current: Math.min(1, stats.total),
      target: 1
    },
    {
      id: 'ten-correct',
      icon: '✨',
      name: '小试牛刀',
      description: '累计答对10道题',
      unlocked: stats.correct >= 10,
      progress: Math.min(100, (stats.correct / 10) * 100),
      current: stats.correct,
      target: 10
    },
    {
      id: 'fifty-practice',
      icon: '📚',
      name: '勤学苦练',
      description: '累计练习50道题',
      unlocked: stats.total >= 50,
      progress: Math.min(100, (stats.total / 50) * 100),
      current: stats.total,
      target: 50
    },
    {
      id: 'accuracy-master',
      icon: '🏆',
      name: '精准大师',
      description: '连续10题全部答对',
      unlocked: hasConsecutiveCorrect(records, 10),
      progress: Math.min(100, (getMaxConsecutiveCorrect(records) / 10) * 100),
      current: getMaxConsecutiveCorrect(records),
      target: 10
    },
    {
      id: 'chapter-complete',
      icon: '🎓',
      name: '章节达人',
      description: '任意章节正确率达到80%',
      unlocked: chapterStats.value.some(ch => ch.accuracy >= 80 && ch.total >= 5),
      progress: Math.min(100, Math.max(...chapterStats.value.map(ch => ch.total >= 5 ? ch.accuracy : 0), 0)),
      current: Math.max(...chapterStats.value.map(ch => ch.total >= 5 ? ch.accuracy : 0), 0),
      target: 80
    },
    {
      id: 'hundred-practice',
      icon: '💯',
      name: '百题斩',
      description: '累计练习100道题',
      unlocked: stats.total >= 100,
      progress: Math.min(100, stats.total),
      current: stats.total,
      target: 100
    }
  ]
})

// 辅助函数：检查连续正确
function hasConsecutiveCorrect(records: typeof progressStore.practiceRecords, count: number): boolean {
  return getMaxConsecutiveCorrect(records) >= count
}

function getMaxConsecutiveCorrect(records: typeof progressStore.practiceRecords): number {
  let max = 0
  let current = 0
  const sorted = [...records].sort((a, b) => a.practiceAt - b.practiceAt)
  for (const record of sorted) {
    if (record.result === 'correct') {
      current++
      max = Math.max(max, current)
    } else {
      current = 0
    }
  }
  return max
}

// 辅助函数
const getAccuracyGradient = (accuracy: number) => {
  if (accuracy >= 80) return '#67C23A'
  if (accuracy >= 60) return '#E6A23C'
  return '#F56C6C'
}

const handleSuggestionAction = (suggestion: Suggestion) => {
  if (suggestion.action) {
    if (suggestion.action === 'practice') {
      router.push('/practice')
    } else if (suggestion.action === 'challenge') {
      router.push('/practice?mode=challenge')
    } else {
      router.push(`/${suggestion.action}`)
    }
  }
}
</script>

<style lang="scss" scoped>
.practice-stats {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.section {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 20px;
  box-shadow: var(--box-shadow-light);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 16px;

  .el-icon {
    color: var(--primary-color);
  }

  .title-hint {
    font-size: 12px;
    font-weight: normal;
    color: var(--text-color-secondary);
  }
}

// 总体统计
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: var(--bg-color);
  border-radius: 10px;

  .stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;

    &.primary {
      background: rgba(64, 158, 255, 0.1);
      color: #409EFF;
    }
    &.success {
      background: rgba(103, 194, 58, 0.1);
      color: #67C23A;
    }
    &.warning {
      background: rgba(230, 162, 60, 0.1);
      color: #E6A23C;
    }
    &.info {
      background: rgba(144, 147, 153, 0.1);
      color: #909399;
    }
  }

  .stat-content {
    display: flex;
    flex-direction: column;

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

// 正确率分析
.accuracy-display {
  display: flex;
  align-items: center;
  gap: 40px;
}

.accuracy-ring {
  .ring-content {
    display: flex;
    flex-direction: column;
    align-items: center;

    .ring-value {
      font-size: 32px;
      font-weight: 700;
      color: var(--text-color);
    }

    .ring-label {
      font-size: 14px;
      color: var(--text-color-secondary);
    }
  }
}

.accuracy-breakdown {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;

  .breakdown-item {
    display: flex;
    align-items: center;
    gap: 12px;

    .breakdown-label {
      width: 40px;
      font-size: 13px;
      color: var(--text-color-secondary);
    }

    .breakdown-bar {
      flex: 1;
      height: 8px;
      background: var(--bg-color);
      border-radius: 4px;
      overflow: hidden;

      .bar-fill {
        height: 100%;
        border-radius: 4px;
        transition: width 0.3s;
      }
    }

    &.correct .bar-fill {
      background: #67C23A;
    }
    &.wrong .bar-fill {
      background: #F56C6C;
    }
    &.skipped .bar-fill {
      background: #909399;
    }

    .breakdown-value {
      width: 40px;
      text-align: right;
      font-size: 14px;
      font-weight: 600;
      color: var(--text-color);
    }
  }
}

// 难度分布
.difficulty-stats {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.difficulty-item {
  .difficulty-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;

    .difficulty-accuracy {
      font-size: 14px;
      font-weight: 600;
    }
  }

  .difficulty-bar-container {
    margin-bottom: 8px;
  }

  .difficulty-bar {
    display: flex;
    height: 12px;
    background: var(--bg-color);
    border-radius: 6px;
    overflow: hidden;

    .bar-correct {
      background: #67C23A;
      transition: width 0.3s;
    }

    .bar-wrong {
      background: #F56C6C;
      transition: width 0.3s;
    }
  }

  .difficulty-counts {
    display: flex;
    gap: 16px;
    font-size: 12px;
    color: var(--text-color-secondary);

    .count-item {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .count-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;

      &.correct {
        background: #67C23A;
      }
      &.wrong {
        background: #F56C6C;
      }
    }

    .total {
      margin-left: auto;
    }
  }
}

// 薄弱知识点
.weak-points-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.weak-point-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  background: var(--bg-color);
  border-radius: 8px;
  border-left: 3px solid #F56C6C;

  .point-info {
    flex: 1;

    .point-title {
      display: block;
      font-weight: 500;
      color: var(--text-color);
      margin-bottom: 4px;
    }

    .point-stats {
      font-size: 12px;
      color: var(--text-color-secondary);
    }
  }

  .point-rate {
    width: 120px;
  }
}

// 最近练习
.recent-sessions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.session-card {
  padding: 12px 16px;
  background: var(--bg-color);
  border-radius: 8px;

  .session-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;

    .session-time {
      font-size: 12px;
      color: var(--text-color-secondary);
    }
  }

  .session-stats {
    display: flex;
    gap: 16px;
    margin-bottom: 4px;

    .session-stat {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 13px;
      color: var(--text-color-secondary);

      &.correct {
        color: #67C23A;
      }
      &.wrong {
        color: #F56C6C;
      }
      &.accuracy {
        margin-left: auto;
        font-weight: 600;
        color: var(--primary-color);
      }
    }
  }

  .session-duration {
    font-size: 12px;
    color: var(--text-color-placeholder);
  }
}

.empty-sessions {
  text-align: center;
  padding: 32px;
  color: var(--text-color-placeholder);

  p {
    margin-top: 8px;
  }
}

// 练习趋势
.trend-chart {
  padding: 16px 0;
}

.chart-bars {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  height: 120px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--border-color);
}

.chart-bar-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;

  .bar-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 100px;
    width: 32px;
    justify-content: flex-end;
  }

  .bar {
    width: 16px;
    border-radius: 4px 4px 0 0;
    position: relative;
    transition: height 0.3s;
    min-height: 2px;

    &.correct-bar {
      background: #67C23A;
    }

    &.wrong-bar {
      background: #F56C6C;
      border-radius: 0;
    }

    .bar-value {
      position: absolute;
      top: -18px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 10px;
      color: var(--text-color-secondary);
    }
  }

  .bar-label {
    margin-top: 8px;
    font-size: 11px;
    color: var(--text-color-secondary);
  }
}

.chart-legend {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-top: 12px;

  .legend-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: var(--text-color-secondary);
  }

  .legend-dot {
    width: 10px;
    height: 10px;
    border-radius: 2px;

    &.correct {
      background: #67C23A;
    }
    &.wrong {
      background: #F56C6C;
    }
  }
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .accuracy-display {
    flex-direction: column;
    gap: 20px;
  }
}

// 章节正确率
.chapter-stats {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.chapter-item {
  display: flex;
  align-items: center;
  gap: 16px;

  .chapter-info {
    width: 140px;
    flex-shrink: 0;

    .chapter-name {
      display: block;
      font-size: 14px;
      font-weight: 500;
      color: var(--text-color);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .chapter-count {
      font-size: 12px;
      color: var(--text-color-secondary);
    }
  }

  .chapter-bar-container {
    flex: 1;
  }

  .chapter-accuracy {
    width: 50px;
    text-align: right;
    font-size: 15px;
    font-weight: 600;
  }
}

// 题型分析
.question-type-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.question-type-item {
  padding: 16px;
  background: var(--bg-color);
  border-radius: 12px;

  .type-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;

    .el-icon {
      font-size: 20px;
    }

    .type-name {
      font-size: 15px;
      font-weight: 600;
      color: var(--text-color);
    }
  }

  .type-stats {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .type-ring {
    .ring-text {
      font-size: 16px;
      font-weight: 700;
    }
  }

  .type-detail {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 6px;

    .detail-row {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      color: var(--text-color-secondary);

      .detail-value {
        font-weight: 600;
        color: var(--text-color);

        &.correct { color: #67C23A; }
        &.wrong { color: #F56C6C; }
      }
    }
  }
}

// 学习建议
.suggestions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border-radius: 12px;

  &.warning {
    background: rgba(230, 162, 60, 0.1);
    .suggestion-icon { color: #E6A23C; }
  }
  &.info {
    background: rgba(64, 158, 255, 0.1);
    .suggestion-icon { color: #409EFF; }
  }
  &.success {
    background: rgba(103, 194, 58, 0.1);
    .suggestion-icon { color: #67C23A; }
  }

  .suggestion-icon {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    background: rgba(255, 255, 255, 0.8);
    flex-shrink: 0;
  }

  .suggestion-content {
    flex: 1;

    h4 {
      font-size: 15px;
      font-weight: 600;
      color: var(--text-color);
      margin: 0 0 4px 0;
    }

    p {
      font-size: 13px;
      color: var(--text-color-secondary);
      margin: 0;
      line-height: 1.5;
    }
  }
}

// 成就徽章
.achievements-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.achievement-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  background: var(--bg-color);
  border-radius: 12px;
  transition: all 0.25s;

  &:not(.unlocked) {
    opacity: 0.6;
    filter: grayscale(0.5);
  }

  &.unlocked {
    background: linear-gradient(135deg, rgba(103, 194, 58, 0.1) 0%, rgba(64, 158, 255, 0.1) 100%);
    border: 1px solid rgba(103, 194, 58, 0.3);
  }

  .achievement-icon {
    font-size: 28px;
    flex-shrink: 0;
  }

  .achievement-info {
    flex: 1;
    min-width: 0;

    .achievement-name {
      display: block;
      font-size: 14px;
      font-weight: 600;
      color: var(--text-color);
    }

    .achievement-desc {
      display: block;
      font-size: 12px;
      color: var(--text-color-secondary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  .achievement-progress {
    width: 60px;
    flex-shrink: 0;

    .progress-text {
      display: block;
      text-align: center;
      font-size: 11px;
      color: var(--text-color-secondary);
      margin-top: 4px;
    }
  }

  .achievement-check {
    font-size: 24px;
    color: #67C23A;
    flex-shrink: 0;
  }
}

@media (max-width: 1024px) {
  .question-type-stats {
    grid-template-columns: 1fr;
  }

  .achievements-grid {
    grid-template-columns: 1fr;
  }
}
</style>
