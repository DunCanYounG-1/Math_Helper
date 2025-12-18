/**
 * 学习进度 Store
 * 管理学习进度、收藏、笔记等用户数据
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  type ReviewRecord,
  createReviewRecord,
  calculateNextReview,
  isDueForReview,
  getReviewStatus,
  getDueCount,
  sortByPriority
} from '@/services/spacedRepetition'

export interface LearningRecord {
  knowledgePointId: string
  firstVisitTime: number
  lastVisitTime: number
  visitCount: number
  timeSpent: number // 累计学习时间（秒）
  status: 'not-started' | 'in-progress' | 'completed' | 'mastered'
}

export interface FavoriteItem {
  id: string
  type: 'knowledge-point' | 'formula' | 'metaphor'
  addedAt: number
  note?: string
}

export interface StudyNote {
  id: string
  knowledgePointId: string
  content: string
  createdAt: number
  updatedAt: number
  isMarkdown?: boolean    // 是否为 Markdown 格式
  aiOptimized?: boolean   // 是否经过 AI 优化
}

export interface PracticeRecord {
  id: string
  exampleId: string
  knowledgePointId: string
  difficulty: string
  result: 'correct' | 'wrong' | 'skipped'
  timeSpent: number // 秒
  practiceAt: number
  mode: 'normal' | 'timed' | 'challenge'
}

export interface PracticeSession {
  id: string
  startTime: number
  endTime: number
  mode: 'normal' | 'timed' | 'challenge'
  totalQuestions: number
  correctCount: number
  wrongCount: number
  skippedCount: number
  questions: Array<{
    exampleId: string
    result: 'correct' | 'wrong' | 'skipped'
    timeSpent: number
  }>
}

export interface WrongQuestion {
  exampleId: string
  wrongCount: number
  lastWrongAt: number
  reviewCount: number
  lastReviewAt: number | null
  mastered: boolean
}

// 详细弱项分析接口
export interface WeakPointAnalysis {
  knowledgePointId: string
  total: number
  wrong: number
  errorRate: number
  // 按难度分析
  byDifficulty: {
    easy: { total: number; wrong: number; errorRate: number }
    medium: { total: number; wrong: number; errorRate: number }
    hard: { total: number; wrong: number; errorRate: number }
  }
  // 时间趋势（最近7次vs更早）
  trend: 'improving' | 'declining' | 'stable'
  recentErrorRate: number
  earlierErrorRate: number
  // 关联的常见错误ID
  relatedMistakeIds: string[]
  // 最后练习时间
  lastPracticeAt: number
  // 建议
  suggestions: string[]
}

// 整体统计分析接口
export interface OverallAnalysis {
  // 各章节统计
  byChapter: Map<string, {
    chapterId: string
    total: number
    correct: number
    errorRate: number
    weakPoints: string[]
  }>
  // 各难度统计
  byDifficulty: {
    easy: { total: number; correct: number; errorRate: number }
    medium: { total: number; correct: number; errorRate: number }
    hard: { total: number; correct: number; errorRate: number }
  }
  // 学习趋势（按周统计）
  weeklyTrend: Array<{
    weekStart: number
    total: number
    correct: number
    errorRate: number
  }>
  // 薄弱知识点TOP5
  topWeakPoints: WeakPointAnalysis[]
  // 进步最大的知识点
  mostImproved: Array<{
    knowledgePointId: string
    improvement: number
  }>
}

const STORAGE_KEY = 'math-helper-progress'
const NOTES_BACKUP_KEY = 'math-helper-notes-backup'

// 常量定义
const MASTERY_REVIEW_COUNT = 3 // 连续做对几次标记为已掌握
const WEAK_POINT_MIN_ATTEMPTS = 3 // 识别薄弱知识点的最小做题数
const WEAK_POINT_ERROR_RATE = 40 // 薄弱知识点的错误率阈值(%)
const SAVE_DEBOUNCE_MS = 1000 // 保存防抖时间（毫秒）- 增加到1秒减少保存频率
const IDLE_SAVE_TIMEOUT = 2000 // 空闲保存超时时间（毫秒）

// 防抖保存定时器
let saveTimer: ReturnType<typeof setTimeout> | null = null
// 空闲回调ID
let idleCallbackId: number | null = null
// 脏数据标记 - 避免无变更时保存
let isDirty = false
// 待保存的数据类型标记
let pendingSaveTypes: Set<'practice' | 'learning' | 'notes' | 'favorites' | 'wrongQuestions' | 'formulaReview'> = new Set()
// beforeunload 处理器引用
let unloadHandler: (() => void) | null = null

export const useProgressStore = defineStore('progress', () => {
  // 学习记录
  const learningRecords = ref<Map<string, LearningRecord>>(new Map())
  // 收藏列表
  const favorites = ref<FavoriteItem[]>([])
  // 笔记
  const notes = ref<StudyNote[]>([])
  // 当前学习会话开始时间
  const sessionStartTime = ref<number | null>(null)
  const currentKnowledgePointId = ref<string | null>(null)

  // 练习相关
  const practiceRecords = ref<PracticeRecord[]>([])
  const practiceSessions = ref<PracticeSession[]>([])
  const wrongQuestions = ref<Map<string, WrongQuestion>>(new Map())

  // 间隔复习相关
  const formulaReviewRecords = ref<Map<string, ReviewRecord>>(new Map())

  // 已学习的知识点数量
  const learnedCount = computed(() => {
    return Array.from(learningRecords.value.values()).filter(
      r => r.status === 'completed' || r.status === 'mastered'
    ).length
  })

  // 学习中的知识点数量
  const inProgressCount = computed(() => {
    return Array.from(learningRecords.value.values()).filter(
      r => r.status === 'in-progress'
    ).length
  })

  // 总学习时间（分钟）
  const totalTimeSpent = computed(() => {
    let total = 0
    learningRecords.value.forEach(r => {
      total += r.timeSpent
    })
    return Math.round(total / 60)
  })

  // 收藏数量
  const favoritesCount = computed(() => favorites.value.length)

  // 练习统计
  const practiceStats = computed(() => {
    const total = practiceRecords.value.length
    const correct = practiceRecords.value.filter(r => r.result === 'correct').length
    const wrong = practiceRecords.value.filter(r => r.result === 'wrong').length
    const skipped = practiceRecords.value.filter(r => r.result === 'skipped').length
    return {
      total,
      correct,
      wrong,
      skipped,
      accuracy: total > 0 ? Math.round((correct / (correct + wrong || 1)) * 100) : 0
    }
  })

  // 错题数量
  const wrongQuestionsCount = computed(() => {
    return Array.from(wrongQuestions.value.values()).filter(w => !w.mastered).length
  })

  // 今日练习数
  const todayPracticeCount = computed(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStart = today.getTime()
    return practiceRecords.value.filter(r => r.practiceAt >= todayStart).length
  })

  // 连续练习天数
  const streakDays = computed(() => {
    if (practiceSessions.value.length === 0) return 0

    const sortedSessions = [...practiceSessions.value].sort((a, b) => b.startTime - a.startTime)
    let streak = 0
    let currentDate = new Date()
    currentDate.setHours(0, 0, 0, 0)

    for (const session of sortedSessions) {
      const sessionDate = new Date(session.startTime)
      sessionDate.setHours(0, 0, 0, 0)

      const diffDays = Math.floor((currentDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24))

      if (diffDays === 0 || diffDays === 1) {
        if (diffDays === 1) {
          currentDate = sessionDate
        }
        streak++
      } else if (diffDays > 1) {
        break
      }
    }

    return streak
  })

  // 需要复习的公式数量
  const dueFormulaCount = computed(() => {
    return getDueCount(Array.from(formulaReviewRecords.value.values()))
  })

  // 获取需要复习的公式（按优先级排序）
  const getDueFormulas = () => {
    return sortByPriority(Array.from(formulaReviewRecords.value.values()))
  }

  // 获取公式的复习状态
  const getFormulaReviewStatus = (formulaId: string) => {
    const record = formulaReviewRecords.value.get(formulaId)
    if (!record) {
      return { status: 'new' as const, daysUntilReview: 0, mastery: 0 }
    }
    return getReviewStatus(record)
  }

  // 记录公式复习结果
  const recordFormulaReview = (formulaId: string, quality: number) => {
    let record = formulaReviewRecords.value.get(formulaId)
    if (!record) {
      record = createReviewRecord(formulaId)
    }
    const updatedRecord = calculateNextReview(record, quality)
    formulaReviewRecords.value.set(formulaId, updatedRecord)
    saveToStorage(false, 'formulaReview')
  }

  // 获取公式的复习记录
  const getFormulaReviewRecord = (formulaId: string): ReviewRecord | undefined => {
    return formulaReviewRecords.value.get(formulaId)
  }

  // 检查公式是否需要复习
  const isFormulaDue = (formulaId: string): boolean => {
    const record = formulaReviewRecords.value.get(formulaId)
    return record ? isDueForReview(record) : true // 新公式也算需要复习
  }

  // 获取所有公式复习记录
  const getAllFormulaReviewRecords = () => {
    return Array.from(formulaReviewRecords.value.values())
  }

  // 获取知识点的学习记录
  const getRecord = (kpId: string): LearningRecord | undefined => {
    return learningRecords.value.get(kpId)
  }

  // 获取知识点的学习状态
  const getStatus = (kpId: string): LearningRecord['status'] => {
    const record = learningRecords.value.get(kpId)
    return record?.status || 'not-started'
  }

  // 开始学习一个知识点
  const startLearning = (kpId: string) => {
    // 结束之前的学习会话
    if (currentKnowledgePointId.value && sessionStartTime.value) {
      endLearningSession()
    }

    const now = Date.now()
    let record = learningRecords.value.get(kpId)

    if (!record) {
      record = {
        knowledgePointId: kpId,
        firstVisitTime: now,
        lastVisitTime: now,
        visitCount: 1,
        timeSpent: 0,
        status: 'in-progress'
      }
    } else {
      record.lastVisitTime = now
      record.visitCount += 1
      if (record.status === 'not-started') {
        record.status = 'in-progress'
      }
    }

    learningRecords.value.set(kpId, record)
    currentKnowledgePointId.value = kpId
    sessionStartTime.value = now
    saveToStorage(false, 'learning')
  }

  // 结束当前学习会话
  const endLearningSession = () => {
    if (!currentKnowledgePointId.value || !sessionStartTime.value) return

    const kpId = currentKnowledgePointId.value
    const record = learningRecords.value.get(kpId)
    if (record) {
      const timeSpent = Math.round((Date.now() - sessionStartTime.value) / 1000)
      record.timeSpent += timeSpent
      record.lastVisitTime = Date.now()
      learningRecords.value.set(kpId, record)
    }

    currentKnowledgePointId.value = null
    sessionStartTime.value = null
    saveToStorage(false, 'learning')
  }

  // 标记知识点为已完成
  const markAsCompleted = (kpId: string) => {
    const record = learningRecords.value.get(kpId)
    if (record) {
      record.status = 'completed'
      learningRecords.value.set(kpId, record)
      saveToStorage(false, 'learning')
    }
  }

  // 标记知识点为已掌握
  const markAsMastered = (kpId: string) => {
    const record = learningRecords.value.get(kpId)
    if (record) {
      record.status = 'mastered'
      learningRecords.value.set(kpId, record)
      saveToStorage(false, 'learning')
    }
  }

  // 重置知识点状态
  const resetStatus = (kpId: string) => {
    const record = learningRecords.value.get(kpId)
    if (record) {
      record.status = 'not-started'
      learningRecords.value.set(kpId, record)
      saveToStorage(false, 'learning')
    }
  }

  // 添加收藏
  const addFavorite = (item: Omit<FavoriteItem, 'addedAt'>) => {
    const exists = favorites.value.some(f => f.id === item.id && f.type === item.type)
    if (!exists) {
      favorites.value.push({
        ...item,
        addedAt: Date.now()
      })
      saveToStorage(false, 'favorites')
    }
  }

  // 移除收藏
  const removeFavorite = (id: string, type: FavoriteItem['type']) => {
    const index = favorites.value.findIndex(f => f.id === id && f.type === type)
    if (index !== -1) {
      favorites.value.splice(index, 1)
      saveToStorage(true, 'favorites') // 删除操作立即保存
    }
  }

  // 检查是否已收藏
  const isFavorite = (id: string, type: FavoriteItem['type']): boolean => {
    return favorites.value.some(f => f.id === id && f.type === type)
  }

  // 获取收藏列表
  const getFavoritesByType = (type: FavoriteItem['type']) => {
    return favorites.value.filter(f => f.type === type)
  }

  // 添加笔记
  const addNote = (kpId: string, content: string, options?: { isMarkdown?: boolean; aiOptimized?: boolean }) => {
    const now = Date.now()
    notes.value.push({
      id: `note-${now}`,
      knowledgePointId: kpId,
      content,
      createdAt: now,
      updatedAt: now,
      isMarkdown: options?.isMarkdown ?? false,
      aiOptimized: options?.aiOptimized ?? false
    })
    saveToStorage(false, 'notes')
  }

  // 更新笔记
  const updateNote = (noteId: string, content: string, options?: { isMarkdown?: boolean; aiOptimized?: boolean }) => {
    const note = notes.value.find(n => n.id === noteId)
    if (note) {
      note.content = content
      note.updatedAt = Date.now()
      if (options?.isMarkdown !== undefined) {
        note.isMarkdown = options.isMarkdown
      }
      if (options?.aiOptimized !== undefined) {
        note.aiOptimized = options.aiOptimized
      }
      saveToStorage(false, 'notes')
    }
  }

  // 删除笔记
  const deleteNote = (noteId: string) => {
    const index = notes.value.findIndex(n => n.id === noteId)
    if (index !== -1) {
      notes.value.splice(index, 1)
      saveToStorage(true, 'notes') // 立即保存，确保删除操作不会丢失
    }
  }

  // 获取知识点的笔记
  const getNotesByKnowledgePoint = (kpId: string) => {
    return notes.value.filter(n => n.knowledgePointId === kpId)
  }

  // ============ 练习相关方法 ============

  // 记录一道题的练习结果
  const recordPractice = (
    exampleId: string,
    knowledgePointId: string,
    difficulty: string,
    result: 'correct' | 'wrong' | 'skipped',
    timeSpent: number,
    mode: 'normal' | 'timed' | 'challenge' = 'normal'
  ) => {
    const record: PracticeRecord = {
      id: `pr-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      exampleId,
      knowledgePointId,
      difficulty,
      result,
      timeSpent,
      practiceAt: Date.now(),
      mode
    }
    practiceRecords.value.push(record)

    // 如果做错了，更新错题本
    if (result === 'wrong') {
      const wrongQ = wrongQuestions.value.get(exampleId)
      if (wrongQ) {
        wrongQ.wrongCount++
        wrongQ.lastWrongAt = Date.now()
        wrongQ.mastered = false
      } else {
        wrongQuestions.value.set(exampleId, {
          exampleId,
          wrongCount: 1,
          lastWrongAt: Date.now(),
          reviewCount: 0,
          lastReviewAt: null,
          mastered: false
        })
      }
    } else if (result === 'correct') {
      // 如果做对了，检查是否在错题本中
      const wrongQ = wrongQuestions.value.get(exampleId)
      if (wrongQ) {
        wrongQ.reviewCount++
        wrongQ.lastReviewAt = Date.now()
        // 连续做对指定次数标记为已掌握
        if (wrongQ.reviewCount >= MASTERY_REVIEW_COUNT) {
          wrongQ.mastered = true
        }
      }
    }

    // 使用防抖保存，练习时不立即保存以提升流畅度
    saveToStorage(false, 'practice')
  }

  // 保存练习会话
  const savePracticeSession = (session: Omit<PracticeSession, 'id'>) => {
    const newSession: PracticeSession = {
      ...session,
      id: `ps-${Date.now()}`
    }
    practiceSessions.value.push(newSession)
    // 会话结束时立即保存，确保数据不丢失
    saveToStorage(true, 'practice')
  }

  // 获取错题列表
  const getWrongQuestions = () => {
    return Array.from(wrongQuestions.value.values())
      .filter(w => !w.mastered)
      .sort((a, b) => b.lastWrongAt - a.lastWrongAt)
  }

  // 获取所有错题（包括已掌握的）
  const getAllWrongQuestions = () => {
    return Array.from(wrongQuestions.value.values())
      .sort((a, b) => b.lastWrongAt - a.lastWrongAt)
  }

  // 标记错题为已掌握
  const markWrongQuestionMastered = (exampleId: string) => {
    const wrongQ = wrongQuestions.value.get(exampleId)
    if (wrongQ) {
      wrongQ.mastered = true
      saveToStorage(false, 'wrongQuestions')
    }
  }

  // 重置错题状态
  const resetWrongQuestion = (exampleId: string) => {
    const wrongQ = wrongQuestions.value.get(exampleId)
    if (wrongQ) {
      wrongQ.mastered = false
      wrongQ.reviewCount = 0
      saveToStorage(false, 'wrongQuestions')
    }
  }

  // 删除错题记录
  const removeWrongQuestion = (exampleId: string) => {
    wrongQuestions.value.delete(exampleId)
    saveToStorage(true, 'wrongQuestions') // 删除操作立即保存
  }

  // 获取最近的练习会话
  const getRecentSessions = (limit = 10) => {
    return [...practiceSessions.value]
      .sort((a, b) => b.startTime - a.startTime)
      .slice(0, limit)
  }

  // 获取某个知识点的练习记录
  const getPracticeRecordsByKnowledgePoint = (kpId: string) => {
    return practiceRecords.value.filter(r => r.knowledgePointId === kpId)
  }

  // 获取薄弱知识点（错误率较高的）
  const getWeakKnowledgePoints = () => {
    const kpStats = new Map<string, { total: number; wrong: number }>()

    practiceRecords.value.forEach(record => {
      const stat = kpStats.get(record.knowledgePointId) || { total: 0, wrong: 0 }
      stat.total++
      if (record.result === 'wrong') {
        stat.wrong++
      }
      kpStats.set(record.knowledgePointId, stat)
    })

    return Array.from(kpStats.entries())
      .map(([kpId, stat]) => ({
        knowledgePointId: kpId,
        ...stat,
        errorRate: stat.total > 0 ? Math.round((stat.wrong / stat.total) * 100) : 0
      }))
      .filter(s => s.total >= WEAK_POINT_MIN_ATTEMPTS && s.errorRate >= WEAK_POINT_ERROR_RATE)
      .sort((a, b) => b.errorRate - a.errorRate)
  }

  // 获取详细的弱项分析
  const getDetailedWeakPointAnalysis = (knowledgePointId: string, commonMistakes?: Array<{ id: string; knowledgePointId: string }>): WeakPointAnalysis | null => {
    const records = practiceRecords.value.filter(r => r.knowledgePointId === knowledgePointId)
    if (records.length < WEAK_POINT_MIN_ATTEMPTS) return null

    // 基础统计
    const total = records.length
    const wrong = records.filter(r => r.result === 'wrong').length
    const errorRate = Math.round((wrong / total) * 100)

    // 按难度统计
    const byDifficulty = {
      easy: { total: 0, wrong: 0, errorRate: 0 },
      medium: { total: 0, wrong: 0, errorRate: 0 },
      hard: { total: 0, wrong: 0, errorRate: 0 }
    }
    records.forEach(r => {
      const diff = r.difficulty as 'easy' | 'medium' | 'hard'
      if (byDifficulty[diff]) {
        byDifficulty[diff].total++
        if (r.result === 'wrong') byDifficulty[diff].wrong++
      }
    })
    Object.keys(byDifficulty).forEach(key => {
      const d = byDifficulty[key as keyof typeof byDifficulty]
      d.errorRate = d.total > 0 ? Math.round((d.wrong / d.total) * 100) : 0
    })

    // 时间趋势分析（最近7次 vs 更早）
    const sortedRecords = [...records].sort((a, b) => b.practiceAt - a.practiceAt)
    const recentRecords = sortedRecords.slice(0, 7)
    const earlierRecords = sortedRecords.slice(7)

    const recentWrong = recentRecords.filter(r => r.result === 'wrong').length
    const recentErrorRate = recentRecords.length > 0 ? Math.round((recentWrong / recentRecords.length) * 100) : 0

    const earlierWrong = earlierRecords.filter(r => r.result === 'wrong').length
    const earlierErrorRate = earlierRecords.length > 0 ? Math.round((earlierWrong / earlierRecords.length) * 100) : errorRate

    let trend: 'improving' | 'declining' | 'stable' = 'stable'
    if (earlierRecords.length >= 3) {
      const diff = recentErrorRate - earlierErrorRate
      if (diff <= -15) trend = 'improving'
      else if (diff >= 15) trend = 'declining'
    }

    // 关联常见错误
    const relatedMistakeIds = commonMistakes
      ? commonMistakes.filter(m => m.knowledgePointId === knowledgePointId).map(m => m.id)
      : []

    // 最后练习时间
    const lastPracticeAt = sortedRecords.length > 0 ? sortedRecords[0].practiceAt : 0

    // 生成建议
    const suggestions: string[] = []
    if (errorRate >= 60) {
      suggestions.push('建议重新学习该知识点的基础概念')
    }
    if (byDifficulty.easy.errorRate > 30) {
      suggestions.push('基础题错误率较高，需要巩固基本概念')
    }
    if (byDifficulty.hard.errorRate > 70 && byDifficulty.easy.errorRate < 30) {
      suggestions.push('基础掌握较好，可以多练习提高题加强理解')
    }
    if (trend === 'declining') {
      suggestions.push('近期表现下滑，建议复习相关知识点')
    }
    if (trend === 'improving') {
      suggestions.push('进步明显，继续保持！')
    }
    if (relatedMistakeIds.length > 0) {
      suggestions.push('查看常见错误专栏，避免典型陷阱')
    }
    if (Date.now() - lastPracticeAt > 7 * 24 * 60 * 60 * 1000) {
      suggestions.push('已超过一周未练习，建议复习')
    }

    return {
      knowledgePointId,
      total,
      wrong,
      errorRate,
      byDifficulty,
      trend,
      recentErrorRate,
      earlierErrorRate,
      relatedMistakeIds,
      lastPracticeAt,
      suggestions
    }
  }

  // 获取所有薄弱知识点的详细分析
  const getAllWeakPointAnalysis = (commonMistakes?: Array<{ id: string; knowledgePointId: string }>): WeakPointAnalysis[] => {
    const weakPoints = getWeakKnowledgePoints()
    return weakPoints
      .map(wp => getDetailedWeakPointAnalysis(wp.knowledgePointId, commonMistakes))
      .filter((analysis): analysis is WeakPointAnalysis => analysis !== null)
  }

  // 获取整体统计分析
  const getOverallAnalysis = (
    knowledgePointToChapter?: Map<string, string>,
    commonMistakes?: Array<{ id: string; knowledgePointId: string }>
  ): OverallAnalysis => {
    // 按章节统计
    const byChapter = new Map<string, {
      chapterId: string
      total: number
      correct: number
      errorRate: number
      weakPoints: string[]
    }>()

    if (knowledgePointToChapter) {
      practiceRecords.value.forEach(record => {
        const chapterId = knowledgePointToChapter.get(record.knowledgePointId) || 'unknown'
        const stat = byChapter.get(chapterId) || {
          chapterId,
          total: 0,
          correct: 0,
          errorRate: 0,
          weakPoints: []
        }
        stat.total++
        if (record.result === 'correct') stat.correct++
        byChapter.set(chapterId, stat)
      })

      // 计算错误率和薄弱点
      byChapter.forEach((stat, chapterId) => {
        stat.errorRate = stat.total > 0 ? Math.round(((stat.total - stat.correct) / stat.total) * 100) : 0
        // 找出该章节的薄弱知识点
        const chapterKps = Array.from(knowledgePointToChapter.entries())
          .filter(([_, cId]) => cId === chapterId)
          .map(([kpId]) => kpId)
        const weakPoints = getWeakKnowledgePoints().filter(wp => chapterKps.includes(wp.knowledgePointId))
        stat.weakPoints = weakPoints.map(wp => wp.knowledgePointId)
      })
    }

    // 按难度统计
    const byDifficulty = {
      easy: { total: 0, correct: 0, errorRate: 0 },
      medium: { total: 0, correct: 0, errorRate: 0 },
      hard: { total: 0, correct: 0, errorRate: 0 }
    }
    practiceRecords.value.forEach(record => {
      const diff = record.difficulty as 'easy' | 'medium' | 'hard'
      if (byDifficulty[diff]) {
        byDifficulty[diff].total++
        if (record.result === 'correct') byDifficulty[diff].correct++
      }
    })
    Object.keys(byDifficulty).forEach(key => {
      const d = byDifficulty[key as keyof typeof byDifficulty]
      d.errorRate = d.total > 0 ? Math.round(((d.total - d.correct) / d.total) * 100) : 0
    })

    // 按周统计趋势
    const weeklyTrend: Array<{
      weekStart: number
      total: number
      correct: number
      errorRate: number
    }> = []

    const now = Date.now()
    for (let i = 0; i < 8; i++) {
      const weekStart = now - (i + 1) * 7 * 24 * 60 * 60 * 1000
      const weekEnd = now - i * 7 * 24 * 60 * 60 * 1000
      const weekRecords = practiceRecords.value.filter(
        r => r.practiceAt >= weekStart && r.practiceAt < weekEnd
      )
      if (weekRecords.length > 0) {
        const correct = weekRecords.filter(r => r.result === 'correct').length
        weeklyTrend.push({
          weekStart,
          total: weekRecords.length,
          correct,
          errorRate: Math.round(((weekRecords.length - correct) / weekRecords.length) * 100)
        })
      }
    }
    weeklyTrend.reverse() // 按时间正序

    // 获取TOP5薄弱知识点
    const topWeakPoints = getAllWeakPointAnalysis(commonMistakes).slice(0, 5)

    // 计算进步最大的知识点
    const mostImproved: Array<{ knowledgePointId: string; improvement: number }> = []
    const kpIds = new Set(practiceRecords.value.map(r => r.knowledgePointId))
    kpIds.forEach(kpId => {
      const analysis = getDetailedWeakPointAnalysis(kpId, commonMistakes)
      if (analysis && analysis.trend === 'improving') {
        mostImproved.push({
          knowledgePointId: kpId,
          improvement: analysis.earlierErrorRate - analysis.recentErrorRate
        })
      }
    })
    mostImproved.sort((a, b) => b.improvement - a.improvement)

    return {
      byChapter,
      byDifficulty,
      weeklyTrend,
      topWeakPoints,
      mostImproved: mostImproved.slice(0, 5)
    }
  }

  // 获取学习建议
  const getLearningRecommendations = (commonMistakes?: Array<{ id: string; knowledgePointId: string }>): {
    priority: 'high' | 'medium' | 'low'
    type: 'weak-point' | 'review' | 'challenge' | 'mistake'
    knowledgePointId?: string
    mistakeId?: string
    message: string
  }[] => {
    const recommendations: {
      priority: 'high' | 'medium' | 'low'
      type: 'weak-point' | 'review' | 'challenge' | 'mistake'
      knowledgePointId?: string
      mistakeId?: string
      message: string
    }[] = []

    // 1. 薄弱知识点推荐
    const weakPoints = getAllWeakPointAnalysis(commonMistakes)
    weakPoints.slice(0, 3).forEach((wp, index) => {
      recommendations.push({
        priority: index === 0 ? 'high' : 'medium',
        type: 'weak-point',
        knowledgePointId: wp.knowledgePointId,
        message: `知识点错误率${wp.errorRate}%，建议重点复习`
      })

      // 关联常见错误
      if (wp.relatedMistakeIds.length > 0) {
        recommendations.push({
          priority: 'medium',
          type: 'mistake',
          knowledgePointId: wp.knowledgePointId,
          mistakeId: wp.relatedMistakeIds[0],
          message: '查看该知识点的常见错误，避免踩坑'
        })
      }
    })

    // 2. 长时间未练习的知识点
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    const kpLastPractice = new Map<string, number>()
    practiceRecords.value.forEach(r => {
      const current = kpLastPractice.get(r.knowledgePointId) || 0
      if (r.practiceAt > current) {
        kpLastPractice.set(r.knowledgePointId, r.practiceAt)
      }
    })
    kpLastPractice.forEach((lastPractice, kpId) => {
      if (lastPractice < oneWeekAgo) {
        recommendations.push({
          priority: 'low',
          type: 'review',
          knowledgePointId: kpId,
          message: '已超过一周未练习，建议复习巩固'
        })
      }
    })

    // 3. 挑战推荐（对于表现好的知识点）
    const strongPoints = Array.from(new Set(practiceRecords.value.map(r => r.knowledgePointId)))
      .map(kpId => {
        const records = practiceRecords.value.filter(r => r.knowledgePointId === kpId)
        const correct = records.filter(r => r.result === 'correct').length
        return { kpId, total: records.length, accuracy: records.length > 0 ? correct / records.length : 0 }
      })
      .filter(s => s.total >= 5 && s.accuracy >= 0.8)
      .slice(0, 2)

    strongPoints.forEach(sp => {
      recommendations.push({
        priority: 'low',
        type: 'challenge',
        knowledgePointId: sp.kpId,
        message: '掌握良好，可以尝试更难的题目挑战自己'
      })
    })

    // 按优先级排序
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

    return recommendations.slice(0, 10)
  }

  // 清空练习记录
  const clearPracticeRecords = () => {
    practiceRecords.value = []
    practiceSessions.value = []
    wrongQuestions.value.clear()
    saveToStorage(true, 'practice') // 清空操作立即保存
  }

  // 获取上次学习的知识点ID
  const getLastLearnedKnowledgePointId = (): string | null => {
    let lastKpId: string | null = null
    let lastTime = 0

    learningRecords.value.forEach((record, kpId) => {
      if (record.lastVisitTime > lastTime) {
        lastTime = record.lastVisitTime
        lastKpId = kpId
      }
    })

    return lastKpId
  }

  // 获取章节进度
  const getChapterProgress = (_chapterId: string, knowledgePointIds: string[]) => {
    let completed = 0
    let inProgress = 0
    let total = knowledgePointIds.length

    knowledgePointIds.forEach(kpId => {
      const status = getStatus(kpId)
      if (status === 'completed' || status === 'mastered') {
        completed++
      } else if (status === 'in-progress') {
        inProgress++
      }
    })

    return {
      completed,
      inProgress,
      total,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0
    }
  }

  // 保存到 localStorage（带智能防抖和空闲回调）
  const saveToStorage = (immediate = false, dataType?: 'practice' | 'learning' | 'notes' | 'favorites' | 'wrongQuestions' | 'formulaReview') => {
    // 标记脏数据
    isDirty = true
    if (dataType) {
      pendingSaveTypes.add(dataType)
    }

    const doSave = () => {
      // 如果没有脏数据，跳过保存
      if (!isDirty) return

      try {
        const data = {
          learningRecords: Array.from(learningRecords.value.entries()),
          favorites: favorites.value,
          notes: notes.value,
          practiceRecords: practiceRecords.value,
          practiceSessions: practiceSessions.value,
          wrongQuestions: Array.from(wrongQuestions.value.entries()),
          formulaReviewRecords: Array.from(formulaReviewRecords.value.entries()),
          lastSavedAt: Date.now()
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data))

        // 备份笔记数据（防止意外丢失）- 仅在笔记变更时备份
        if (pendingSaveTypes.has('notes') && notes.value.length > 0) {
          localStorage.setItem(NOTES_BACKUP_KEY, JSON.stringify({
            notes: notes.value,
            backupAt: Date.now()
          }))
        }

        // 重置脏数据标记
        isDirty = false
        pendingSaveTypes.clear()
      } catch (error) {
        console.error('Failed to save progress data:', error)
        // 如果保存失败，尝试清理旧数据后重试
        try {
          // 只保存最近100条练习记录
          if (practiceRecords.value.length > 100) {
            practiceRecords.value = practiceRecords.value.slice(-100)
          }
          const data = {
            learningRecords: Array.from(learningRecords.value.entries()),
            favorites: favorites.value,
            notes: notes.value,
            practiceRecords: practiceRecords.value,
            practiceSessions: practiceSessions.value.slice(-50),
            wrongQuestions: Array.from(wrongQuestions.value.entries()),
            formulaReviewRecords: Array.from(formulaReviewRecords.value.entries()),
            lastSavedAt: Date.now()
          }
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
          isDirty = false
          pendingSaveTypes.clear()
        } catch (retryError) {
          console.error('Retry save failed:', retryError)
        }
      }
    }

    // 清理现有定时器和回调
    const clearPendingSave = () => {
      if (saveTimer) {
        clearTimeout(saveTimer)
        saveTimer = null
      }
      if (idleCallbackId && typeof cancelIdleCallback !== 'undefined') {
        cancelIdleCallback(idleCallbackId)
        idleCallbackId = null
      }
    }

    if (immediate) {
      // 立即保存（用于关键操作如删除）
      clearPendingSave()
      doSave()
    } else {
      // 智能保存：优先使用 requestIdleCallback，回退到 setTimeout
      clearPendingSave()

      if (typeof requestIdleCallback !== 'undefined') {
        // 使用 requestIdleCallback 在浏览器空闲时保存
        idleCallbackId = requestIdleCallback(() => {
          idleCallbackId = null
          doSave()
        }, { timeout: IDLE_SAVE_TIMEOUT })
      } else {
        // 回退到防抖保存
        saveTimer = setTimeout(() => {
          saveTimer = null
          doSave()
        }, SAVE_DEBOUNCE_MS)
      }
    }
  }

  // 从 localStorage 加载
  const loadFromStorage = () => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const data = JSON.parse(saved)
        if (data.learningRecords) {
          learningRecords.value = new Map(data.learningRecords)
        }
        if (data.favorites) {
          favorites.value = data.favorites
        }
        if (data.notes) {
          notes.value = data.notes
        }
        if (data.practiceRecords) {
          practiceRecords.value = data.practiceRecords
        }
        if (data.practiceSessions) {
          practiceSessions.value = data.practiceSessions
        }
        if (data.wrongQuestions) {
          wrongQuestions.value = new Map(data.wrongQuestions)
        }
        if (data.formulaReviewRecords) {
          formulaReviewRecords.value = new Map(data.formulaReviewRecords)
        }
      } catch (e) {
        console.error('Failed to load progress data:', e)
        // 尝试从备份恢复笔记
        tryRestoreNotesFromBackup()
      }
    }
    // 自动设置 beforeunload 处理器，确保数据不丢失
    setupUnloadHandler()
  }

  // 从备份恢复笔记
  const tryRestoreNotesFromBackup = () => {
    try {
      const backup = localStorage.getItem(NOTES_BACKUP_KEY)
      if (backup) {
        const data = JSON.parse(backup)
        if (data.notes && Array.isArray(data.notes)) {
          notes.value = data.notes
          // 笔记从备份恢复成功
        }
      }
    } catch (e) {
      console.error('Failed to restore notes from backup:', e)
    }
  }

  // 获取所有笔记
  const getAllNotes = () => {
    return [...notes.value].sort((a, b) => b.updatedAt - a.updatedAt)
  }

  // 按知识点分组获取笔记
  const getNotesGroupedByKnowledgePoint = () => {
    const grouped = new Map<string, StudyNote[]>()
    notes.value.forEach(note => {
      const existing = grouped.get(note.knowledgePointId) || []
      existing.push(note)
      grouped.set(note.knowledgePointId, existing)
    })
    return grouped
  }

  // 获取笔记统计
  const getNotesStats = () => {
    const total = notes.value.length
    const markdown = notes.value.filter(n => n.isMarkdown).length
    const aiOptimized = notes.value.filter(n => n.aiOptimized).length
    return { total, markdown, aiOptimized }
  }

  // 重置所有进度
  const resetAllProgress = () => {
    learningRecords.value.clear()
    favorites.value = []
    notes.value = []
    practiceRecords.value = []
    practiceSessions.value = []
    wrongQuestions.value.clear()
    formulaReviewRecords.value.clear()
    saveToStorage(true) // 重置操作立即保存
  }

  // 导出数据
  const exportData = () => {
    return {
      learningRecords: Array.from(learningRecords.value.entries()),
      favorites: favorites.value,
      notes: notes.value,
      practiceRecords: practiceRecords.value,
      practiceSessions: practiceSessions.value,
      wrongQuestions: Array.from(wrongQuestions.value.entries()),
      formulaReviewRecords: Array.from(formulaReviewRecords.value.entries()),
      exportedAt: Date.now()
    }
  }

  // 导入数据
  const importData = (data: ReturnType<typeof exportData>) => {
    if (data.learningRecords) {
      learningRecords.value = new Map(data.learningRecords)
    }
    if (data.favorites) {
      favorites.value = data.favorites
    }
    if (data.notes) {
      notes.value = data.notes
    }
    if (data.practiceRecords) {
      practiceRecords.value = data.practiceRecords
    }
    if (data.practiceSessions) {
      practiceSessions.value = data.practiceSessions
    }
    if (data.wrongQuestions) {
      wrongQuestions.value = new Map(data.wrongQuestions)
    }
    if (data.formulaReviewRecords) {
      formulaReviewRecords.value = new Map(data.formulaReviewRecords)
    }
    saveToStorage(true) // 导入后立即保存
  }

  // 强制刷新保存（用于页面卸载前）
  const flushPendingSave = () => {
    if (!isDirty) return

    // 取消所有待处理的异步保存
    if (saveTimer) {
      clearTimeout(saveTimer)
      saveTimer = null
    }
    if (idleCallbackId && typeof cancelIdleCallback !== 'undefined') {
      cancelIdleCallback(idleCallbackId)
      idleCallbackId = null
    }

    // 同步保存
    try {
      const data = {
        learningRecords: Array.from(learningRecords.value.entries()),
        favorites: favorites.value,
        notes: notes.value,
        practiceRecords: practiceRecords.value,
        practiceSessions: practiceSessions.value,
        wrongQuestions: Array.from(wrongQuestions.value.entries()),
        formulaReviewRecords: Array.from(formulaReviewRecords.value.entries()),
        lastSavedAt: Date.now()
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      isDirty = false
      pendingSaveTypes.clear()
    } catch (error) {
      console.error('Failed to flush save:', error)
    }
  }

  // 设置 beforeunload 处理器
  const setupUnloadHandler = () => {
    if (unloadHandler) return // 已经设置过了

    unloadHandler = () => {
      flushPendingSave()
    }
    window.addEventListener('beforeunload', unloadHandler)
    // 也监听 visibilitychange，在页面隐藏时保存
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        flushPendingSave()
      }
    })
  }

  // 清理 beforeunload 处理器
  const cleanupUnloadHandler = () => {
    if (unloadHandler) {
      window.removeEventListener('beforeunload', unloadHandler)
      unloadHandler = null
    }
  }

  // 在加载数据后自动设置 beforeunload 处理器
  const loadFromStorageWithSetup = () => {
    loadFromStorage()
    setupUnloadHandler()
  }

  return {
    // state
    learningRecords,
    favorites,
    notes,
    practiceRecords,
    practiceSessions,
    wrongQuestions,
    formulaReviewRecords,
    // computed
    learnedCount,
    inProgressCount,
    totalTimeSpent,
    favoritesCount,
    practiceStats,
    wrongQuestionsCount,
    todayPracticeCount,
    streakDays,
    dueFormulaCount,
    // actions
    getRecord,
    getStatus,
    startLearning,
    endLearningSession,
    markAsCompleted,
    markAsMastered,
    resetStatus,
    addFavorite,
    removeFavorite,
    isFavorite,
    getFavoritesByType,
    addNote,
    updateNote,
    deleteNote,
    getNotesByKnowledgePoint,
    getAllNotes,
    getNotesGroupedByKnowledgePoint,
    getNotesStats,
    // 练习相关
    recordPractice,
    savePracticeSession,
    getWrongQuestions,
    getAllWrongQuestions,
    markWrongQuestionMastered,
    resetWrongQuestion,
    removeWrongQuestion,
    getRecentSessions,
    getPracticeRecordsByKnowledgePoint,
    getWeakKnowledgePoints,
    getDetailedWeakPointAnalysis,
    getAllWeakPointAnalysis,
    getOverallAnalysis,
    getLearningRecommendations,
    clearPracticeRecords,
    // 间隔复习相关
    getDueFormulas,
    getFormulaReviewStatus,
    recordFormulaReview,
    getFormulaReviewRecord,
    isFormulaDue,
    getAllFormulaReviewRecords,
    // 其他
    getLastLearnedKnowledgePointId,
    getChapterProgress,
    loadFromStorage,
    loadFromStorageWithSetup,
    flushPendingSave,
    setupUnloadHandler,
    cleanupUnloadHandler,
    resetAllProgress,
    exportData,
    importData
  }
})
