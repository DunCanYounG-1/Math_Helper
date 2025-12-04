/**
 * 间隔复习服务 (Spaced Repetition Service)
 * 基于 SM-2 算法实现公式记忆的间隔复习
 */

export interface ReviewRecord {
  formulaId: string
  // SM-2 算法参数
  easeFactor: number // 简易度因子 (EF)，初始值 2.5
  interval: number // 当前间隔（天）
  repetitions: number // 连续正确复习次数
  // 时间相关
  lastReviewDate: number // 上次复习时间
  nextReviewDate: number // 下次复习时间
  // 统计
  totalReviews: number // 总复习次数
  correctCount: number // 正确次数
  incorrectCount: number // 错误次数
}

export interface ReviewResult {
  formulaId: string
  quality: number // 0-5 的质量评分
  reviewedAt: number
}

// SM-2 算法常量
const MIN_EASE_FACTOR = 1.3
const INITIAL_EASE_FACTOR = 2.5
const FIRST_INTERVAL = 1 // 第一次复习间隔（天）
const SECOND_INTERVAL = 6 // 第二次复习间隔（天）

/**
 * 计算下一个复习间隔 (SM-2 算法)
 * @param record 当前复习记录
 * @param quality 复习质量 (0-5)
 *
 * 质量评分说明:
 * 5 - 完美响应，毫不费力地记住
 * 4 - 正确响应，稍微犹豫
 * 3 - 正确响应，有些困难
 * 2 - 错误响应，但看到答案后立刻想起
 * 1 - 错误响应，看到答案后勉强想起
 * 0 - 完全遗忘
 */
export function calculateNextReview(
  record: ReviewRecord,
  quality: number
): ReviewRecord {
  const now = Date.now()
  let { easeFactor, interval, repetitions } = record

  // 更新简易度因子
  const newEaseFactor = Math.max(
    MIN_EASE_FACTOR,
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  )

  if (quality >= 3) {
    // 正确回答
    if (repetitions === 0) {
      interval = FIRST_INTERVAL
    } else if (repetitions === 1) {
      interval = SECOND_INTERVAL
    } else {
      interval = Math.round(interval * newEaseFactor)
    }
    repetitions++
  } else {
    // 错误回答，重新开始
    repetitions = 0
    interval = FIRST_INTERVAL
  }

  // 计算下次复习日期
  const nextReviewDate = now + interval * 24 * 60 * 60 * 1000

  return {
    ...record,
    easeFactor: newEaseFactor,
    interval,
    repetitions,
    lastReviewDate: now,
    nextReviewDate,
    totalReviews: record.totalReviews + 1,
    correctCount: quality >= 3 ? record.correctCount + 1 : record.correctCount,
    incorrectCount: quality < 3 ? record.incorrectCount + 1 : record.incorrectCount
  }
}

/**
 * 创建新的复习记录
 */
export function createReviewRecord(formulaId: string): ReviewRecord {
  const now = Date.now()
  return {
    formulaId,
    easeFactor: INITIAL_EASE_FACTOR,
    interval: 0,
    repetitions: 0,
    lastReviewDate: now,
    nextReviewDate: now, // 立即需要复习
    totalReviews: 0,
    correctCount: 0,
    incorrectCount: 0
  }
}

/**
 * 检查公式是否需要复习
 */
export function isDueForReview(record: ReviewRecord): boolean {
  return Date.now() >= record.nextReviewDate
}

/**
 * 获取复习状态描述
 */
export function getReviewStatus(record: ReviewRecord): {
  status: 'new' | 'learning' | 'review' | 'mastered'
  daysUntilReview: number
  mastery: number // 0-100 的掌握程度
} {
  const now = Date.now()
  const daysUntilReview = Math.ceil((record.nextReviewDate - now) / (24 * 60 * 60 * 1000))

  // 计算掌握程度
  let mastery = 0
  if (record.totalReviews > 0) {
    const accuracy = record.correctCount / record.totalReviews
    const intervalFactor = Math.min(record.interval / 30, 1) // 最多30天算完全掌握
    mastery = Math.round(accuracy * 50 + intervalFactor * 50)
  }

  let status: 'new' | 'learning' | 'review' | 'mastered'
  if (record.totalReviews === 0) {
    status = 'new'
  } else if (record.repetitions < 3) {
    status = 'learning'
  } else if (record.interval >= 21 && mastery >= 80) {
    status = 'mastered'
  } else {
    status = 'review'
  }

  return { status, daysUntilReview, mastery }
}

/**
 * 将用户的"已掌握/待复习"操作转换为质量评分
 */
export function memorizedToQuality(isMemorized: boolean, wasFlipped: boolean): number {
  if (isMemorized) {
    // 记住了
    return wasFlipped ? 4 : 5 // 如果翻转了才记住是4分，直接记住是5分
  } else {
    // 没记住
    return wasFlipped ? 2 : 1 // 看了答案后想起是2分，完全忘记是1分
  }
}

/**
 * 格式化下次复习时间
 */
export function formatNextReviewTime(nextReviewDate: number): string {
  const now = Date.now()
  const diff = nextReviewDate - now

  if (diff <= 0) {
    return '现在需要复习'
  }

  const minutes = Math.floor(diff / (60 * 1000))
  const hours = Math.floor(diff / (60 * 60 * 1000))
  const days = Math.floor(diff / (24 * 60 * 60 * 1000))

  if (days > 0) {
    return `${days}天后复习`
  } else if (hours > 0) {
    return `${hours}小时后复习`
  } else {
    return `${minutes}分钟后复习`
  }
}

/**
 * 获取今日需要复习的公式数量
 */
export function getDueCount(records: ReviewRecord[]): number {
  const now = Date.now()
  return records.filter(r => r.nextReviewDate <= now).length
}

/**
 * 按优先级排序需要复习的公式
 * 优先级：过期越久 > 简易度越低 > 间隔越短
 */
export function sortByPriority(records: ReviewRecord[]): ReviewRecord[] {
  const now = Date.now()
  return [...records]
    .filter(r => r.nextReviewDate <= now)
    .sort((a, b) => {
      // 首先按过期时间排序（过期越久越优先）
      const overdueA = now - a.nextReviewDate
      const overdueB = now - b.nextReviewDate
      if (overdueA !== overdueB) {
        return overdueB - overdueA
      }
      // 然后按简易度排序（越难越优先）
      if (a.easeFactor !== b.easeFactor) {
        return a.easeFactor - b.easeFactor
      }
      // 最后按间隔排序（间隔越短越优先）
      return a.interval - b.interval
    })
}
