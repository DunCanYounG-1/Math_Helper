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

const STORAGE_KEY = 'math-helper-progress'
const NOTES_BACKUP_KEY = 'math-helper-notes-backup'

// 常量定义
const MASTERY_REVIEW_COUNT = 3 // 连续做对几次标记为已掌握
const WEAK_POINT_MIN_ATTEMPTS = 3 // 识别薄弱知识点的最小做题数
const WEAK_POINT_ERROR_RATE = 40 // 薄弱知识点的错误率阈值(%)
const SAVE_DEBOUNCE_MS = 500 // 保存防抖时间（毫秒）

// 防抖保存定时器
let saveTimer: ReturnType<typeof setTimeout> | null = null

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
    saveToStorage()
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
    saveToStorage()
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
    saveToStorage()
  }

  // 标记知识点为已完成
  const markAsCompleted = (kpId: string) => {
    const record = learningRecords.value.get(kpId)
    if (record) {
      record.status = 'completed'
      learningRecords.value.set(kpId, record)
      saveToStorage()
    }
  }

  // 标记知识点为已掌握
  const markAsMastered = (kpId: string) => {
    const record = learningRecords.value.get(kpId)
    if (record) {
      record.status = 'mastered'
      learningRecords.value.set(kpId, record)
      saveToStorage()
    }
  }

  // 重置知识点状态
  const resetStatus = (kpId: string) => {
    const record = learningRecords.value.get(kpId)
    if (record) {
      record.status = 'not-started'
      learningRecords.value.set(kpId, record)
      saveToStorage()
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
      saveToStorage()
    }
  }

  // 移除收藏
  const removeFavorite = (id: string, type: FavoriteItem['type']) => {
    const index = favorites.value.findIndex(f => f.id === id && f.type === type)
    if (index !== -1) {
      favorites.value.splice(index, 1)
      saveToStorage()
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
    saveToStorage()
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
      saveToStorage()
    }
  }

  // 删除笔记
  const deleteNote = (noteId: string) => {
    const index = notes.value.findIndex(n => n.id === noteId)
    if (index !== -1) {
      notes.value.splice(index, 1)
      saveToStorage(true) // 立即保存，确保删除操作不会丢失
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

    saveToStorage()
  }

  // 保存练习会话
  const savePracticeSession = (session: Omit<PracticeSession, 'id'>) => {
    const newSession: PracticeSession = {
      ...session,
      id: `ps-${Date.now()}`
    }
    practiceSessions.value.push(newSession)
    saveToStorage()
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
      saveToStorage()
    }
  }

  // 重置错题状态
  const resetWrongQuestion = (exampleId: string) => {
    const wrongQ = wrongQuestions.value.get(exampleId)
    if (wrongQ) {
      wrongQ.mastered = false
      wrongQ.reviewCount = 0
      saveToStorage()
    }
  }

  // 删除错题记录
  const removeWrongQuestion = (exampleId: string) => {
    wrongQuestions.value.delete(exampleId)
    saveToStorage()
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

  // 清空练习记录
  const clearPracticeRecords = () => {
    practiceRecords.value = []
    practiceSessions.value = []
    wrongQuestions.value.clear()
    saveToStorage()
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
  const getChapterProgress = (chapterId: string, knowledgePointIds: string[]) => {
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

  // 保存到 localStorage（带防抖）
  const saveToStorage = (immediate = false) => {
    const doSave = () => {
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

        // 备份笔记数据（防止意外丢失）
        if (notes.value.length > 0) {
          localStorage.setItem(NOTES_BACKUP_KEY, JSON.stringify({
            notes: notes.value,
            backupAt: Date.now()
          }))
        }
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
        } catch (retryError) {
          console.error('Retry save failed:', retryError)
        }
      }
    }

    if (immediate) {
      // 立即保存（用于关键操作如删除）
      if (saveTimer) {
        clearTimeout(saveTimer)
        saveTimer = null
      }
      doSave()
    } else {
      // 防抖保存（用于频繁更新操作）
      if (saveTimer) {
        clearTimeout(saveTimer)
      }
      saveTimer = setTimeout(doSave, SAVE_DEBOUNCE_MS)
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
  }

  // 从备份恢复笔记
  const tryRestoreNotesFromBackup = () => {
    try {
      const backup = localStorage.getItem(NOTES_BACKUP_KEY)
      if (backup) {
        const data = JSON.parse(backup)
        if (data.notes && Array.isArray(data.notes)) {
          notes.value = data.notes
          console.log('Notes restored from backup')
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
    saveToStorage()
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
    saveToStorage()
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
    resetAllProgress,
    exportData,
    importData
  }
})
