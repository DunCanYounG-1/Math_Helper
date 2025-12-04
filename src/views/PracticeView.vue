<template>
  <div class="practice-view">
    <div class="practice-header">
      <div class="header-left">
        <h1 class="page-title">
          <el-icon><EditPen /></el-icon>
          例题练习
        </h1>
        <p class="page-desc">随机抽取例题进行练习，巩固所学知识</p>
      </div>
      <div class="header-right">
        <el-radio-group v-model="viewMode" size="small" v-if="!isPracticing">
          <el-radio-button value="practice">
            <el-icon><Edit /></el-icon>
            练习
          </el-radio-button>
          <el-radio-button value="stats">
            <el-icon><DataAnalysis /></el-icon>
            统计
          </el-radio-button>
        </el-radio-group>
      </div>
    </div>

    <!-- 统计视图 -->
    <PracticeStats v-if="viewMode === 'stats' && !isPracticing" />

    <!-- 练习统计概览 -->
    <template v-if="viewMode === 'practice'">
    <div class="stats-overview">
      <div class="stat-card">
        <div class="stat-icon">
          <el-icon><TrendCharts /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ progressStore.todayPracticeCount }}</span>
          <span class="stat-label">今日练习</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon success">
          <el-icon><SuccessFilled /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ progressStore.practiceStats.accuracy }}%</span>
          <span class="stat-label">正确率</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon warning">
          <el-icon><WarningFilled /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ progressStore.wrongQuestionsCount }}</span>
          <span class="stat-label">错题待复习</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon fire">
          <el-icon><Sunny /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ progressStore.streakDays }}</span>
          <span class="stat-label">连续天数</span>
        </div>
      </div>
    </div>

    <!-- 练习模式选择 -->
    <div class="mode-selection card" v-if="!isPracticing && !practiceFinished">
      <h3>选择练习模式</h3>
      <div class="mode-cards">
        <div
          class="mode-card"
          :class="{ active: practiceMode === 'normal' }"
          @click="practiceMode = 'normal'"
        >
          <el-icon :size="32"><Reading /></el-icon>
          <span class="mode-title">普通模式</span>
          <span class="mode-desc">自由练习，不限时间</span>
        </div>
        <div
          class="mode-card"
          :class="{ active: practiceMode === 'timed' }"
          @click="practiceMode = 'timed'"
        >
          <el-icon :size="32"><Timer /></el-icon>
          <span class="mode-title">计时模式</span>
          <span class="mode-desc">每题限时3分钟</span>
        </div>
        <div
          class="mode-card"
          :class="{ active: practiceMode === 'challenge' }"
          @click="practiceMode = 'challenge'"
        >
          <el-icon :size="32"><Trophy /></el-icon>
          <span class="mode-title">挑战模式</span>
          <span class="mode-desc">连续答对，挑战极限</span>
        </div>
        <div
          class="mode-card wrong-mode"
          :class="{ active: practiceMode === 'wrong', disabled: progressStore.wrongQuestionsCount === 0 }"
          @click="progressStore.wrongQuestionsCount > 0 && (practiceMode = 'wrong')"
        >
          <el-icon :size="32"><DocumentDelete /></el-icon>
          <span class="mode-title">错题复习</span>
          <span class="mode-desc">{{ progressStore.wrongQuestionsCount }} 道待复习</span>
        </div>
        <div
          class="mode-card guided-mode"
          :class="{ active: practiceMode === 'guided' }"
          @click="practiceMode = 'guided'"
        >
          <el-icon :size="32"><Guide /></el-icon>
          <span class="mode-title">分步引导</span>
          <span class="mode-desc">逐步提示，深度理解</span>
        </div>
      </div>
    </div>

    <!-- 筛选条件 -->
    <div class="filter-section card" v-if="!isPracticing && !practiceFinished && practiceMode !== 'wrong'">
      <div class="filter-row">
        <div class="filter-item">
          <span class="filter-label">章节</span>
          <el-select v-model="selectedChapter" placeholder="全部章节" clearable>
            <el-option
              v-for="chapter in chapters"
              :key="chapter.id"
              :label="chapter.title"
              :value="chapter.id"
            />
          </el-select>
        </div>
        <div class="filter-item">
          <span class="filter-label">难度</span>
          <el-select v-model="selectedDifficulty" placeholder="全部难度" clearable>
            <el-option label="基础" value="basic" />
            <el-option label="中等" value="intermediate" />
            <el-option label="进阶" value="advanced" />
          </el-select>
        </div>
        <div class="filter-item" v-if="practiceMode !== 'challenge'">
          <span class="filter-label">题数</span>
          <el-input-number v-model="questionCount" :min="1" :max="20" />
        </div>
        <el-button type="primary" @click="startPractice" :disabled="filteredExamples.length === 0">
          <el-icon><VideoPlay /></el-icon>
          开始练习
        </el-button>
      </div>
      <div class="filter-info">
        <span>可选题目：{{ filteredExamples.length }} 道</span>
        <el-tooltip placement="bottom">
          <template #content>
            <div class="shortcuts-list">
              <div><kbd>←</kbd> / <kbd>→</kbd> 切换题目</div>
              <div><kbd>空格</kbd> 显示/隐藏答案</div>
              <div><kbd>1</kbd> 正确 / <kbd>2</kbd> 错误 / <kbd>3</kbd> 跳过</div>
              <div><kbd>Enter</kbd> 下一题/完成</div>
            </div>
          </template>
          <span class="shortcuts-hint">
            <el-icon><Operation /></el-icon>
            快捷键
          </span>
        </el-tooltip>
      </div>
    </div>

    <!-- 错题复习模式的开始按钮 -->
    <div class="wrong-start card" v-if="!isPracticing && !practiceFinished && practiceMode === 'wrong'">
      <el-button
        type="primary"
        size="large"
        @click="startWrongReview"
        :disabled="progressStore.wrongQuestionsCount === 0"
      >
        <el-icon><VideoPlay /></el-icon>
        开始复习错题 ({{ progressStore.wrongQuestionsCount }} 道)
      </el-button>
    </div>

    <!-- 答题反馈覆盖层 -->
    <Transition name="feedback">
      <div v-if="showFeedbackOverlay" class="feedback-overlay" :class="feedbackState">
        <div class="feedback-icon">
          <el-icon v-if="feedbackState === 'correct'" :size="80"><SuccessFilled /></el-icon>
          <el-icon v-else :size="80"><CircleCloseFilled /></el-icon>
        </div>
        <span class="feedback-text">{{ feedbackState === 'correct' ? '正确!' : '错误' }}</span>
      </div>
    </Transition>

    <!-- 分步引导模式 -->
    <div v-if="isPracticing && practiceMode === 'guided'" class="guided-practice-area">
      <div class="guided-header">
        <div class="guided-progress">
          <span>第 {{ currentIndex + 1 }} / {{ currentPractice.length }} 题</span>
          <el-progress :percentage="progressPercentage" :stroke-width="8" :show-text="false" />
        </div>
        <el-button plain size="small" @click="finishPractice">
          <el-icon><Close /></el-icon>
          结束练习
        </el-button>
      </div>
      <StepByStepGuide
        :example="currentExample"
        @complete="handleGuidedComplete"
      />
      <div class="guided-navigation">
        <el-button :disabled="currentIndex === 0" @click="prevQuestion">
          <el-icon><ArrowLeft /></el-icon>
          上一题
        </el-button>
        <el-button
          v-if="currentIndex < currentPractice.length - 1"
          type="primary"
          @click="nextQuestion"
        >
          下一题
          <el-icon><ArrowRight /></el-icon>
        </el-button>
        <el-button v-else type="success" @click="finishPractice">
          <el-icon><Trophy /></el-icon>
          完成练习
        </el-button>
      </div>
    </div>

    <!-- 练习区域 -->
    <div v-if="isPracticing && practiceMode !== 'guided'" class="practice-area">
      <!-- 计时器显示（计时模式） -->
      <div v-if="practiceMode === 'timed'" class="timer-display" :class="{ warning: remainingTime <= 30 }">
        <el-icon><Timer /></el-icon>
        <span>{{ formatTime(remainingTime) }}</span>
      </div>

      <!-- 挑战模式连击显示 -->
      <div v-if="practiceMode === 'challenge' && challengeStreak > 0" class="streak-display">
        <el-icon><Sunny /></el-icon>
        <span>{{ challengeStreak }} 连击!</span>
      </div>

      <!-- 进度指示 -->
      <div class="practice-progress card">
        <div class="progress-info">
          <span v-if="practiceMode !== 'challenge'">进度：{{ currentIndex + 1 }} / {{ currentPractice.length }}</span>
          <span v-else>已答：{{ currentIndex + 1 }} 题</span>
          <span class="score">正确：{{ correctCount }} / {{ answeredCount }}</span>
        </div>
        <el-progress :percentage="progressPercentage" :stroke-width="8" />
        <div class="question-dots" v-if="practiceMode !== 'challenge'">
          <span
            v-for="(item, index) in currentPractice"
            :key="index"
            class="dot"
            :class="{
              current: index === currentIndex,
              correct: item.userAnswer === 'correct',
              wrong: item.userAnswer === 'wrong',
              skipped: item.userAnswer === 'skipped'
            }"
            @click="goToQuestion(index)"
          >
            {{ index + 1 }}
          </span>
        </div>
      </div>

      <!-- 当前题目 -->
      <div class="current-question card">
        <div class="question-header">
          <div class="question-info">
            <el-tag :type="difficultyType(currentExample.difficulty)" size="small">
              {{ difficultyLabel(currentExample.difficulty) }}
            </el-tag>
            <span class="question-title">{{ currentExample.title }}</span>
            <el-tag v-if="isWrongQuestion(currentExample.id)" type="danger" size="small">
              错题
            </el-tag>
          </div>
          <span class="question-number">
            <template v-if="practiceMode !== 'challenge'">第 {{ currentIndex + 1 }} 题</template>
            <template v-else>挑战中...</template>
          </span>
        </div>

        <!-- 题目内容 -->
        <div class="question-content">
          <div class="section-label">题目</div>
          <div class="problem-text" v-html="renderLatex(currentExample.problem)"></div>
        </div>

        <!-- 提示系统 -->
        <PracticeHintSystem
          v-if="!showAnswer && practiceMode !== 'challenge'"
          :example="currentExample"
          @hint-used="onHintUsed"
        />

        <!-- 答题区域 -->
        <div v-if="!showAnswer" class="answer-area">
          <el-button type="success" @click="checkAnswer('correct')">
            <el-icon><Check /></el-icon>
            我做对了
          </el-button>
          <el-button type="danger" @click="checkAnswer('wrong')">
            <el-icon><Close /></el-icon>
            我做错了
          </el-button>
          <el-button @click="checkAnswer('skipped')" v-if="practiceMode !== 'challenge'">
            跳过
          </el-button>
          <el-button type="primary" plain @click="showAnswer = true">
            <el-icon><View /></el-icon>
            查看答案
          </el-button>
        </div>

        <!-- 解答展示 -->
        <div v-if="showAnswer" class="solution-area">
          <div class="analysis-section">
            <div class="section-label">
              <el-icon><InfoFilled /></el-icon>
              解题分析
            </div>
            <div class="analysis-text" v-html="renderLatex(currentExample.solution.analysis)"></div>
          </div>

          <div class="steps-section">
            <div class="section-label">
              <el-icon><List /></el-icon>
              解题步骤
            </div>
            <div class="steps-list">
              <div
                v-for="(step, index) in currentExample.solution.steps"
                :key="index"
                class="step-item"
              >
                <div class="step-header">
                  <span class="step-number">{{ index + 1 }}</span>
                  <span class="step-title" v-html="renderLatex(step.title)"></span>
                </div>
                <div class="step-content" v-html="renderLatex(step.content)"></div>
              </div>
            </div>
          </div>

          <div class="answer-section">
            <div class="section-label">
              <el-icon><CircleCheckFilled /></el-icon>
              答案
            </div>
            <div class="answer-text" v-html="renderLatex(currentExample.solution.answer)"></div>
          </div>

          <!-- 自评按钮 -->
          <div v-if="!currentPractice[currentIndex].userAnswer" class="self-check">
            <span>您的作答是否正确？</span>
            <el-button type="success" size="small" @click="checkAnswer('correct')">
              <el-icon><Check /></el-icon> 正确
            </el-button>
            <el-button type="danger" size="small" @click="checkAnswer('wrong')">
              <el-icon><Close /></el-icon> 错误
            </el-button>
          </div>
        </div>

        <!-- 导航按钮 -->
        <div class="navigation-buttons">
          <el-button :disabled="currentIndex === 0" @click="prevQuestion" v-if="practiceMode !== 'challenge'">
            <el-icon><ArrowLeft /></el-icon>
            上一题
          </el-button>
          <div v-else></div>
          <el-button
            v-if="practiceMode === 'challenge' && currentPractice[currentIndex]?.userAnswer"
            type="primary"
            @click="nextChallengeQuestion"
          >
            继续挑战
            <el-icon><ArrowRight /></el-icon>
          </el-button>
          <el-button
            v-else-if="currentIndex < currentPractice.length - 1"
            type="primary"
            @click="nextQuestion"
          >
            下一题
            <el-icon><ArrowRight /></el-icon>
          </el-button>
          <el-button v-else-if="practiceMode !== 'challenge'" type="success" @click="finishPractice">
            <el-icon><Trophy /></el-icon>
            完成练习
          </el-button>
        </div>
      </div>
    </div>

    <!-- 练习结果 -->
    <div v-if="practiceFinished" class="practice-result card">
      <div class="result-icon">
        <el-icon :size="64" :color="resultColor"><Trophy /></el-icon>
      </div>
      <h2>{{ practiceMode === 'challenge' ? '挑战结束！' : '练习完成！' }}</h2>
      <div v-if="practiceMode === 'challenge'" class="challenge-result">
        <div class="challenge-score">
          最佳连击: <strong>{{ maxStreak }}</strong>
        </div>
      </div>
      <div class="result-stats">
        <div class="stat">
          <span class="stat-value">{{ correctCount }}</span>
          <span class="stat-label">正确</span>
        </div>
        <div class="stat">
          <span class="stat-value">{{ wrongCount }}</span>
          <span class="stat-label">错误</span>
        </div>
        <div class="stat" v-if="practiceMode !== 'challenge'">
          <span class="stat-value">{{ skippedCount }}</span>
          <span class="stat-label">跳过</span>
        </div>
        <div class="stat">
          <span class="stat-value highlight">{{ accuracyRate }}%</span>
          <span class="stat-label">正确率</span>
        </div>
      </div>
      <div class="result-actions">
        <el-button type="primary" @click="startPractice">再练一次</el-button>
        <el-button @click="reviewWrong" :disabled="wrongCount === 0">查看错题</el-button>
        <el-button @click="resetPractice">返回</el-button>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="!isPracticing && !practiceFinished && currentPractice.length === 0" class="empty-state card">
      <el-icon :size="64"><EditPen /></el-icon>
      <h3>准备好开始练习了吗？</h3>
      <p>选择练习模式和筛选条件后点击"开始练习"</p>
    </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import {
  EditPen,
  Edit,
  Refresh,
  Check,
  Close,
  View,
  InfoFilled,
  List,
  CircleCheckFilled,
  CircleCloseFilled,
  ArrowLeft,
  ArrowRight,
  Trophy,
  Operation,
  Timer,
  Reading,
  VideoPlay,
  TrendCharts,
  SuccessFilled,
  WarningFilled,
  Sunny,
  DocumentDelete,
  DataAnalysis,
  Guide
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useKnowledgeStore, type Example } from '@/stores/knowledgeStore'
import { useProgressStore } from '@/stores/progressStore'
import PracticeStats from '@/components/practice/PracticeStats.vue'
import StepByStepGuide from '@/components/practice/StepByStepGuide.vue'
import PracticeHintSystem from '@/components/practice/PracticeHintSystem.vue'
import { renderLatex } from '@/utils/latex'
import 'katex/dist/katex.min.css'

const knowledgeStore = useKnowledgeStore()
const progressStore = useProgressStore()

// 视图模式
const viewMode = ref<'practice' | 'stats'>('practice')

// 练习模式
const practiceMode = ref<'normal' | 'timed' | 'challenge' | 'wrong' | 'guided'>('normal')

// 筛选条件
const selectedChapter = ref('')
const selectedDifficulty = ref('')
const questionCount = ref(5)

// 练习状态
const currentPractice = ref<Array<{
  example: Example
  userAnswer: string | null
  timeSpent: number
  startTime: number
}>>([])
const currentIndex = ref(0)
const showAnswer = ref(false)
const practiceFinished = ref(false)
const sessionStartTime = ref(0)

// 计时模式相关
const remainingTime = ref(180) // 3分钟
const timerInterval = ref<number | null>(null)

// 挑战模式相关
const challengeStreak = ref(0)
const maxStreak = ref(0)

// 答题反馈动画
const feedbackState = ref<'none' | 'correct' | 'wrong'>('none')
const showFeedbackOverlay = ref(false)

// 章节列表
const chapters = computed(() => knowledgeStore.chapters)

// 是否正在练习
const isPracticing = computed(() => currentPractice.value.length > 0 && !practiceFinished.value)

// 筛选后的例题
const filteredExamples = computed(() => {
  let examples = knowledgeStore.examples

  if (selectedChapter.value) {
    const chapterKps = knowledgeStore.knowledgePoints
      .filter(kp => kp.chapterId === selectedChapter.value)
      .map(kp => kp.id)
    examples = examples.filter(e => chapterKps.includes(e.knowledgePointId))
  }

  if (selectedDifficulty.value) {
    examples = examples.filter(e => e.difficulty === selectedDifficulty.value)
  }

  return examples
})

// 当前例题
const currentExample = computed(() => {
  if (currentPractice.value.length === 0) return null
  return currentPractice.value[currentIndex.value]?.example
})

// 进度百分比
const progressPercentage = computed(() => {
  if (currentPractice.value.length === 0) return 0
  if (practiceMode.value === 'challenge') {
    return 100
  }
  return Math.round(((currentIndex.value + 1) / currentPractice.value.length) * 100)
})

// 统计数据
const answeredCount = computed(() =>
  currentPractice.value.filter(p => p.userAnswer).length
)

const correctCount = computed(() =>
  currentPractice.value.filter(p => p.userAnswer === 'correct').length
)

const wrongCount = computed(() =>
  currentPractice.value.filter(p => p.userAnswer === 'wrong').length
)

const skippedCount = computed(() =>
  currentPractice.value.filter(p => p.userAnswer === 'skipped').length
)

const accuracyRate = computed(() => {
  const answered = correctCount.value + wrongCount.value
  if (answered === 0) return 0
  return Math.round((correctCount.value / answered) * 100)
})

const resultColor = computed(() => {
  const rate = accuracyRate.value
  if (rate >= 80) return '#67C23A'
  if (rate >= 60) return '#E6A23C'
  return '#F56C6C'
})

// 检查是否是错题
const isWrongQuestion = (exampleId: string) => {
  return progressStore.wrongQuestions.has(exampleId)
}

// 格式化时间
const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// 开始练习
const startPractice = () => {
  const available = filteredExamples.value
  if (available.length === 0) {
    ElMessage.warning('没有符合条件的题目')
    return
  }

  // 随机抽取题目
  const shuffled = [...available].sort(() => Math.random() - 0.5)
  let selected: Example[]

  if (practiceMode.value === 'challenge') {
    // 挑战模式只选一题开始
    selected = [shuffled[0]]
    challengeStreak.value = 0
    maxStreak.value = 0
  } else {
    selected = shuffled.slice(0, Math.min(questionCount.value, available.length))
  }

  currentPractice.value = selected.map(example => ({
    example,
    userAnswer: null,
    timeSpent: 0,
    startTime: Date.now()
  }))
  currentIndex.value = 0
  showAnswer.value = false
  practiceFinished.value = false
  sessionStartTime.value = Date.now()

  // 计时模式启动计时器
  if (practiceMode.value === 'timed') {
    startTimer()
  }
}

// 开始错题复习
const startWrongReview = () => {
  const wrongQuestionIds = progressStore.getWrongQuestions().map(w => w.exampleId)
  const wrongExamples = knowledgeStore.examples.filter(e => wrongQuestionIds.includes(e.id))

  if (wrongExamples.length === 0) {
    ElMessage.warning('没有待复习的错题')
    return
  }

  currentPractice.value = wrongExamples.map(example => ({
    example,
    userAnswer: null,
    timeSpent: 0,
    startTime: Date.now()
  }))
  currentIndex.value = 0
  showAnswer.value = false
  practiceFinished.value = false
  sessionStartTime.value = Date.now()
}

// 计时器
const startTimer = () => {
  remainingTime.value = 180
  timerInterval.value = window.setInterval(() => {
    remainingTime.value--
    if (remainingTime.value <= 0) {
      // 时间到，自动标记为跳过
      if (!currentPractice.value[currentIndex.value].userAnswer) {
        checkAnswer('skipped')
        ElMessage.warning('时间到！')
      }
    }
  }, 1000)
}

const stopTimer = () => {
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
    timerInterval.value = null
  }
}

const resetTimer = () => {
  stopTimer()
  if (practiceMode.value === 'timed') {
    startTimer()
  }
}

// 显示反馈动画
const showFeedback = (type: 'correct' | 'wrong') => {
  feedbackState.value = type
  showFeedbackOverlay.value = true
  setTimeout(() => {
    showFeedbackOverlay.value = false
    feedbackState.value = 'none'
  }, 800)
}

// 检查答案
const checkAnswer = (result: string) => {
  const current = currentPractice.value[currentIndex.value]
  current.userAnswer = result
  current.timeSpent = Math.round((Date.now() - current.startTime) / 1000)

  // 记录到progressStore
  progressStore.recordPractice(
    current.example.id,
    current.example.knowledgePointId,
    current.example.difficulty,
    result as 'correct' | 'wrong' | 'skipped',
    current.timeSpent,
    practiceMode.value === 'wrong' ? 'normal' : practiceMode.value as 'normal' | 'timed' | 'challenge'
  )

  if (result === 'correct') {
    showFeedback('correct')
    ElMessage.success('做得好！')
    if (practiceMode.value === 'challenge') {
      challengeStreak.value++
      maxStreak.value = Math.max(maxStreak.value, challengeStreak.value)
    }
  } else if (result === 'wrong') {
    showFeedback('wrong')
    ElMessage.info('继续加油！')
    if (practiceMode.value === 'challenge') {
      // 挑战模式答错，结束挑战
      finishPractice()
      return
    }
  }

  // 自动显示答案
  if (!showAnswer.value) {
    showAnswer.value = true
  }
}

// 挑战模式下一题
const nextChallengeQuestion = () => {
  // 从未做过的题目中随机选一题
  const doneIds = currentPractice.value.map(p => p.example.id)
  const available = filteredExamples.value.filter(e => !doneIds.includes(e.id))

  if (available.length === 0) {
    ElMessage.success('恭喜！所有题目都做完了！')
    finishPractice()
    return
  }

  const nextExample = available[Math.floor(Math.random() * available.length)]
  currentPractice.value.push({
    example: nextExample,
    userAnswer: null,
    timeSpent: 0,
    startTime: Date.now()
  })
  currentIndex.value = currentPractice.value.length - 1
  showAnswer.value = false
}

// 导航
const prevQuestion = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--
    showAnswer.value = !!currentPractice.value[currentIndex.value].userAnswer
    hintsUsed.value = new Set() // 重置提示状态
    if (practiceMode.value === 'timed') {
      resetTimer()
    }
  }
}

const nextQuestion = () => {
  if (currentIndex.value < currentPractice.value.length - 1) {
    currentIndex.value++
    showAnswer.value = !!currentPractice.value[currentIndex.value].userAnswer
    currentPractice.value[currentIndex.value].startTime = Date.now()
    hintsUsed.value = new Set() // 重置提示状态
    if (practiceMode.value === 'timed') {
      resetTimer()
    }
  }
}

const goToQuestion = (index: number) => {
  currentIndex.value = index
  showAnswer.value = !!currentPractice.value[index].userAnswer
  currentPractice.value[index].startTime = Date.now()
  hintsUsed.value = new Set() // 重置提示状态
  if (practiceMode.value === 'timed') {
    resetTimer()
  }
}

// 完成练习
const finishPractice = () => {
  stopTimer()

  // 保存练习会话
  progressStore.savePracticeSession({
    startTime: sessionStartTime.value,
    endTime: Date.now(),
    mode: practiceMode.value === 'wrong' ? 'normal' : practiceMode.value as 'normal' | 'timed' | 'challenge',
    totalQuestions: currentPractice.value.length,
    correctCount: correctCount.value,
    wrongCount: wrongCount.value,
    skippedCount: skippedCount.value,
    questions: currentPractice.value.map(p => ({
      exampleId: p.example.id,
      result: (p.userAnswer || 'skipped') as 'correct' | 'wrong' | 'skipped',
      timeSpent: p.timeSpent
    }))
  })

  practiceFinished.value = true
}

// 处理提示使用
const hintsUsed = ref<Set<number>>(new Set())

const onHintUsed = (level: number) => {
  hintsUsed.value.add(level)
  // 可以在这里记录提示使用情况，用于统计
}

// 处理引导模式完成
const handleGuidedComplete = (result: 'correct' | 'partial' | 'wrong') => {
  const item = currentPractice.value[currentIndex.value]
  if (item) {
    // 将 partial 转换为 correct，因为练习记录只有 correct/wrong/skipped
    const mappedResult = result === 'partial' ? 'wrong' : result
    item.userAnswer = mappedResult
    item.timeSpent = Math.round((Date.now() - item.startTime) / 1000)

    // 记录到进度
    progressStore.recordPractice(
      item.example.id,
      item.example.knowledgePointId,
      item.example.difficulty,
      mappedResult,
      item.timeSpent,
      'normal'
    )
  }
}

// 查看错题
const reviewWrong = () => {
  const wrongIndex = currentPractice.value.findIndex(p => p.userAnswer === 'wrong')
  if (wrongIndex >= 0) {
    currentIndex.value = wrongIndex
    showAnswer.value = true
    practiceFinished.value = false
  }
}

// 重置练习
const resetPractice = () => {
  stopTimer()
  currentPractice.value = []
  practiceFinished.value = false
  challengeStreak.value = 0
  maxStreak.value = 0
}

// 难度标签
const difficultyLabel = (diff: string) => {
  const labels: Record<string, string> = {
    basic: '基础',
    intermediate: '中等',
    advanced: '进阶'
  }
  return labels[diff] || '基础'
}

const difficultyType = (diff: string) => {
  const types: Record<string, string> = {
    basic: 'success',
    intermediate: 'warning',
    advanced: 'danger'
  }
  return types[diff] || 'success'
}

// 键盘快捷键处理
const handleKeydown = (event: KeyboardEvent) => {
  // 如果正在输入，忽略快捷键
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
    return
  }

  // 只在练习进行中响应
  if (!isPracticing.value) {
    return
  }

  switch (event.key) {
    case 'ArrowLeft':
      event.preventDefault()
      if (practiceMode.value !== 'challenge') {
        prevQuestion()
      }
      break
    case 'ArrowRight':
      event.preventDefault()
      if (practiceMode.value === 'challenge' && currentPractice.value[currentIndex.value]?.userAnswer) {
        nextChallengeQuestion()
      } else {
        nextQuestion()
      }
      break
    case ' ':
      event.preventDefault()
      showAnswer.value = !showAnswer.value
      break
    case '1':
      if (!currentPractice.value[currentIndex.value].userAnswer) {
        checkAnswer('correct')
      }
      break
    case '2':
      if (!currentPractice.value[currentIndex.value].userAnswer) {
        checkAnswer('wrong')
      }
      break
    case '3':
      if (!currentPractice.value[currentIndex.value].userAnswer && practiceMode.value !== 'challenge') {
        checkAnswer('skipped')
      }
      break
    case 'Enter':
      event.preventDefault()
      if (practiceMode.value === 'challenge') {
        if (currentPractice.value[currentIndex.value]?.userAnswer) {
          nextChallengeQuestion()
        }
      } else if (currentIndex.value < currentPractice.value.length - 1) {
        nextQuestion()
      } else if (answeredCount.value === currentPractice.value.length) {
        finishPractice()
      }
      break
  }
}

// 监听模式变化重置
watch(practiceMode, () => {
  resetPractice()
})

onMounted(() => {
  knowledgeStore.loadKnowledgeData()
  progressStore.loadFromStorage()
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  stopTimer()
})
</script>

<style lang="scss" scoped>
.practice-view {
  max-width: 900px;
  margin: 0 auto;
  position: relative;
}

// 答题反馈覆盖层
.feedback-overlay {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  pointer-events: none;

  .feedback-icon {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 16px;
    animation: feedbackPop 0.4s ease-out;
  }

  .feedback-text {
    font-size: 24px;
    font-weight: 700;
    animation: feedbackSlide 0.4s ease-out;
  }

  &.correct {
    .feedback-icon {
      background-color: rgba(103, 194, 58, 0.15);
      color: #67C23A;
    }
    .feedback-text {
      color: #67C23A;
    }
  }

  &.wrong {
    .feedback-icon {
      background-color: rgba(245, 108, 108, 0.15);
      color: #F56C6C;
    }
    .feedback-text {
      color: #F56C6C;
    }
  }
}

@keyframes feedbackPop {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes feedbackSlide {
  0% {
    transform: translateY(20px);
    opacity: 0;
  }
  100% {
    transform: translateY(0);
    opacity: 1;
  }
}

.feedback-enter-active {
  transition: opacity 0.3s ease;
}

.feedback-leave-active {
  transition: opacity 0.3s ease 0.3s;
}

.feedback-enter-from,
.feedback-leave-to {
  opacity: 0;
}

.practice-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;

  .header-left {
    .page-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 24px;
      margin-bottom: 8px;

      .el-icon {
        color: var(--primary-color);
      }
    }

    .page-desc {
      color: var(--text-color-secondary);
    }
  }

  .header-right {
    .el-radio-button {
      :deep(.el-radio-button__inner) {
        display: flex;
        align-items: center;
        gap: 4px;
      }
    }
  }
}

.stats-overview {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;

  .stat-card {
    background: var(--card-bg);
    border-radius: 12px;
    padding: 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    box-shadow: var(--box-shadow-light);

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, var(--primary-color), var(--primary-color-light));
      color: white;
      font-size: 24px;

      &.success {
        background: linear-gradient(135deg, #67C23A, #95D475);
      }
      &.warning {
        background: linear-gradient(135deg, #E6A23C, #EEBE77);
      }
      &.fire {
        background: linear-gradient(135deg, #F56C6C, #F89898);
      }
    }

    .stat-info {
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
}

.mode-selection {
  margin-bottom: 24px;

  h3 {
    margin-bottom: 16px;
    font-size: 16px;
    color: var(--text-color);
  }

  .mode-cards {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
  }

  .mode-card {
    padding: 20px;
    border-radius: 12px;
    background: var(--bg-color);
    text-align: center;
    cursor: pointer;
    transition: all 0.3s;
    border: 2px solid transparent;

    &:hover {
      transform: translateY(-2px);
      box-shadow: var(--box-shadow);
    }

    &.active {
      border-color: var(--primary-color);
      background: var(--primary-color-light);
    }

    &.disabled {
      opacity: 0.5;
      cursor: not-allowed;

      &:hover {
        transform: none;
        box-shadow: none;
      }
    }

    &.wrong-mode {
      .el-icon {
        color: #F56C6C;
      }
    }

    .el-icon {
      color: var(--primary-color);
      margin-bottom: 8px;
    }

    .mode-title {
      display: block;
      font-weight: 600;
      color: var(--text-color);
      margin-bottom: 4px;
    }

    .mode-desc {
      display: block;
      font-size: 12px;
      color: var(--text-color-secondary);
    }
  }
}

.filter-section {
  margin-bottom: 24px;

  .filter-row {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    align-items: flex-end;
  }

  .filter-item {
    display: flex;
    flex-direction: column;
    gap: 6px;

    .filter-label {
      font-size: 13px;
      color: var(--text-color-secondary);
    }

    .el-select {
      width: 160px;
    }
  }

  .filter-info {
    margin-top: 12px;
    font-size: 13px;
    color: var(--text-color-placeholder);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .shortcuts-hint {
    display: flex;
    align-items: center;
    gap: 4px;
    cursor: help;
    color: var(--text-color-secondary);

    &:hover {
      color: var(--primary-color);
    }
  }
}

.wrong-start {
  text-align: center;
  padding: 32px;
  margin-bottom: 24px;
}

.shortcuts-list {
  line-height: 1.8;

  kbd {
    display: inline-block;
    padding: 2px 6px;
    font-size: 11px;
    font-family: monospace;
    background-color: rgba(255, 255, 255, 0.15);
    border-radius: 3px;
    margin: 0 2px;
  }
}

.timer-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 24px;
  font-weight: 700;
  color: var(--primary-color);
  margin-bottom: 16px;

  &.warning {
    color: #F56C6C;
    animation: pulse 1s ease-in-out infinite;
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.streak-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 20px;
  font-weight: 700;
  color: #E6A23C;
  margin-bottom: 16px;
  animation: bounce 0.5s ease;

  .el-icon {
    animation: rotate 2s linear infinite;
  }
}

@keyframes bounce {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.practice-progress {
  margin-bottom: 16px;

  .progress-info {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
    font-size: 14px;
    color: var(--text-color-secondary);

    .score {
      color: var(--success-color);
      font-weight: 500;
    }
  }

  .question-dots {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 12px;

    .dot {
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      font-size: 12px;
      cursor: pointer;
      background-color: var(--bg-color);
      color: var(--text-color-secondary);
      transition: all 0.2s;

      &.current {
        background-color: var(--primary-color);
        color: white;
      }

      &.correct {
        background-color: var(--success-color);
        color: white;
      }

      &.wrong {
        background-color: var(--danger-color);
        color: white;
      }

      &.skipped {
        background-color: var(--warning-color);
        color: white;
      }
    }
  }
}

.current-question {
  .question-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--border-color);

    .question-info {
      display: flex;
      align-items: center;
      gap: 12px;

      .question-title {
        font-weight: 600;
        color: var(--text-color);
      }
    }

    .question-number {
      font-size: 14px;
      color: var(--text-color-secondary);
    }
  }

  .question-content {
    margin-bottom: 24px;

    .section-label {
      font-size: 13px;
      font-weight: 600;
      color: var(--text-color-secondary);
      margin-bottom: 8px;
    }

    .problem-text {
      background-color: var(--bg-color);
      padding: 16px;
      border-radius: 8px;
      font-size: 16px;
      line-height: 1.8;

      :deep(.katex) {
        font-size: 1.15em;
      }

      :deep(.katex-display) {
        margin: 12px 0;
        font-size: 1.2em;
      }
    }
  }

  .answer-area {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    margin-bottom: 24px;
  }

  .solution-area {
    margin-bottom: 24px;
  }

  .analysis-section {
    background-color: rgba(var(--primary-color-rgb), 0.05);
    border-left: 3px solid var(--primary-color);
    padding: 12px 16px;
    margin-bottom: 16px;
    border-radius: 0 8px 8px 0;

    .section-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      font-weight: 600;
      color: var(--text-color-secondary);
      margin-bottom: 8px;
    }

    .analysis-text {
      line-height: 1.8;
      font-size: 15px;

      :deep(.katex) {
        font-size: 1.15em;
      }

      :deep(.katex-display) {
        margin: 12px 0;
        font-size: 1.2em;
      }
    }
  }

  .steps-section {
    margin-bottom: 16px;

    .section-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      font-weight: 600;
      color: var(--text-color-secondary);
      margin-bottom: 12px;
    }

    .step-item {
      background-color: var(--bg-color);
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 8px;

      .step-header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 8px;

        .step-number {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: var(--primary-color);
          color: white;
          font-size: 12px;
          font-weight: 600;
          border-radius: 50%;
        }

        .step-title {
          font-weight: 600;
          color: var(--text-color);

          :deep(.katex) {
            font-size: 1em;
          }
        }
      }

      .step-content {
        padding-left: 34px;
        line-height: 1.8;
        font-size: 15px;

        :deep(.katex) {
          font-size: 1.15em;
        }

        :deep(.katex-display) {
          margin: 12px 0;
          font-size: 1.2em;
        }
      }
    }
  }

  .answer-section {
    background-color: rgba(103, 194, 58, 0.1);
    border: 1px solid rgba(103, 194, 58, 0.3);
    border-radius: 8px;
    padding: 12px 16px;
    margin-bottom: 16px;

    .section-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      font-weight: 600;
      color: #67c23a;
      margin-bottom: 8px;
    }

    .answer-text {
      font-size: 16px;
      font-weight: 500;
      line-height: 1.8;

      :deep(.katex) {
        font-size: 1.15em;
      }

      :deep(.katex-display) {
        margin: 12px 0;
        font-size: 1.2em;
      }
    }
  }

  .self-check {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background-color: var(--bg-color);
    border-radius: 8px;
    margin-bottom: 16px;

    span {
      color: var(--text-color-secondary);
    }
  }

  .navigation-buttons {
    display: flex;
    justify-content: space-between;
    padding-top: 16px;
    border-top: 1px solid var(--border-color);
  }
}

.practice-result {
  text-align: center;
  padding: 40px;

  .result-icon {
    margin-bottom: 16px;
  }

  h2 {
    margin-bottom: 24px;
    color: var(--text-color);
  }

  .challenge-result {
    margin-bottom: 24px;

    .challenge-score {
      font-size: 18px;
      color: var(--text-color-secondary);

      strong {
        font-size: 32px;
        color: #E6A23C;
      }
    }
  }

  .result-stats {
    display: flex;
    justify-content: center;
    gap: 40px;
    margin-bottom: 32px;

    .stat {
      display: flex;
      flex-direction: column;
      align-items: center;

      .stat-value {
        font-size: 32px;
        font-weight: 700;
        color: var(--text-color);

        &.highlight {
          color: var(--primary-color);
        }
      }

      .stat-label {
        font-size: 14px;
        color: var(--text-color-secondary);
      }
    }
  }

  .result-actions {
    display: flex;
    justify-content: center;
    gap: 12px;
  }
}

.empty-state {
  text-align: center;
  padding: 60px;

  .el-icon {
    color: var(--text-color-placeholder);
    margin-bottom: 16px;
  }

  h3 {
    color: var(--text-color);
    margin-bottom: 8px;
  }

  p {
    color: var(--text-color-secondary);
  }
}

.latex-error {
  color: #f56c6c;
  background-color: rgba(245, 108, 108, 0.1);
  padding: 2px 4px;
  border-radius: 3px;
}

// 动画效果
.card {
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.current-question {
  animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.practice-result {
  animation: zoomIn 0.5s ease-out;

  .result-icon {
    animation: celebratePop 0.6s ease-out 0.3s both;
  }
}

@keyframes zoomIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes celebratePop {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

// 按钮悬浮效果
.answer-area .el-button {
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  &:active {
    transform: translateY(0);
  }
}

// 答题反馈动画
.self-check {
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

// 进度点动画
.question-dots .dot {
  transition: all 0.2s ease;

  &:hover {
    transform: scale(1.15);
  }

  &.current {
    animation: currentPulse 2s infinite;
  }
}

@keyframes currentPulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(var(--primary-color-rgb), 0.4);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(var(--primary-color-rgb), 0);
  }
}

// 模式卡片悬浮效果增强
.mode-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover:not(.disabled) {
    transform: translateY(-4px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);

    .el-icon {
      transform: scale(1.1);
    }
  }

  .el-icon {
    transition: transform 0.3s ease;
  }
}

// 统计卡片动画
.stats-overview .stat-card {
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  .stat-value {
    transition: color 0.2s ease;
  }
}

// 分步引导模式
.guided-practice-area {
  .guided-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding: 16px 20px;
    background-color: var(--card-bg);
    border-radius: 12px;
    box-shadow: var(--box-shadow-light);

    .guided-progress {
      display: flex;
      align-items: center;
      gap: 16px;

      span {
        font-size: 14px;
        font-weight: 500;
        color: var(--text-color);
      }

      .el-progress {
        width: 200px;
      }
    }
  }

  .guided-navigation {
    display: flex;
    justify-content: space-between;
    margin-top: 20px;
    padding: 16px 20px;
    background-color: var(--card-bg);
    border-radius: 12px;
    box-shadow: var(--box-shadow-light);
  }
}

// 分步引导模式卡片
.mode-card.guided-mode {
  .el-icon {
    color: #9b59b6;
  }

  &.active {
    border-color: #9b59b6;
    background: rgba(155, 89, 182, 0.1);
  }
}

@media (max-width: 768px) {
  .stats-overview {
    grid-template-columns: repeat(2, 1fr);
  }

  .mode-selection .mode-cards {
    grid-template-columns: repeat(2, 1fr);
  }

  .practice-header {
    flex-direction: column;
    gap: 16px;

    .header-right {
      align-self: flex-start;
    }
  }

  .guided-practice-area {
    .guided-header {
      flex-direction: column;
      gap: 12px;

      .guided-progress {
        width: 100%;
        flex-direction: column;
        align-items: flex-start;

        .el-progress {
          width: 100%;
        }
      }
    }

    .guided-navigation {
      flex-direction: column;
      gap: 12px;

      .el-button {
        width: 100%;
      }
    }
  }
}
</style>
