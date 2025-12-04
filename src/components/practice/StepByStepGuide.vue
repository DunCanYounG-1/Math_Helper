<template>
  <div class="step-by-step-guide">
    <div class="guide-header">
      <h4 class="guide-title">
        <el-icon><EditPen /></el-icon>
        {{ example.title }}
      </h4>
      <div class="guide-badges">
        <el-tag :type="difficultyType" size="small">{{ difficultyLabel }}</el-tag>
        <el-tag type="info" size="small" v-if="currentStep > 0">
          进度 {{ currentStep }}/{{ totalSteps }}
        </el-tag>
      </div>
    </div>

    <!-- 题目区域 -->
    <div class="problem-section">
      <div class="section-label">
        <el-icon><Document /></el-icon>
        题目
      </div>
      <div class="problem-content" v-html="renderLatex(example.problem)"></div>
    </div>

    <!-- 引导模式选择 -->
    <div class="mode-selector" v-if="!started">
      <p class="mode-hint">选择解题方式：</p>
      <div class="mode-options">
        <div class="mode-card" @click="startGuided">
          <el-icon :size="32"><Guide /></el-icon>
          <span class="mode-name">分步引导</span>
          <span class="mode-desc">逐步显示提示，自主思考</span>
        </div>
        <div class="mode-card" @click="startDirect">
          <el-icon :size="32"><View /></el-icon>
          <span class="mode-name">直接查看</span>
          <span class="mode-desc">查看完整解答过程</span>
        </div>
      </div>
    </div>

    <!-- 分步引导区域 -->
    <div class="guided-section" v-if="started && !showFullSolution">
      <!-- 已显示的步骤 -->
      <div class="revealed-steps">
        <!-- 分析提示 -->
        <transition name="step-fade">
          <div v-if="showAnalysis" class="analysis-section">
            <div class="section-label">
              <el-icon><Aim /></el-icon>
              解题思路
            </div>
            <div class="analysis-content" v-html="renderLatex(example.solution.analysis)"></div>
          </div>
        </transition>

        <!-- 已显示的步骤 -->
        <transition-group name="step-fade" tag="div" class="steps-container">
          <div
            v-for="(step, index) in revealedSteps"
            :key="index"
            class="step-item"
          >
            <div class="step-header">
              <span class="step-number">{{ index + 1 }}</span>
              <span class="step-title">{{ step.title }}</span>
            </div>
            <div class="step-content" v-html="renderLatex(step.content)"></div>
          </div>
        </transition-group>
      </div>

      <!-- 提示按钮区域 -->
      <div class="hint-controls">
        <div class="hint-progress">
          <el-progress
            :percentage="progressPercentage"
            :stroke-width="8"
            :show-text="false"
            :color="progressColors"
          />
          <span class="progress-text">
            {{ showAnalysis ? (currentStep + 1) : 0 }}/{{ totalSteps + 1 }} 提示已显示
          </span>
        </div>

        <div class="hint-buttons">
          <el-button
            v-if="!showAnalysis"
            type="warning"
            @click="revealAnalysis"
          >
            <el-icon><InfoFilled /></el-icon>
            显示解题思路
          </el-button>

          <el-button
            v-else-if="currentStep < totalSteps"
            type="primary"
            @click="revealNextStep"
          >
            <el-icon><ArrowRight /></el-icon>
            下一步提示
          </el-button>

          <el-button
            v-else
            type="success"
            @click="revealAnswer"
          >
            <el-icon><CircleCheck /></el-icon>
            查看答案
          </el-button>

          <el-button
            plain
            @click="showFullSolution = true"
          >
            <el-icon><View /></el-icon>
            查看完整解答
          </el-button>
        </div>

        <!-- 思考提示 -->
        <div class="think-hint" v-if="!showAnswer">
          <el-icon><MagicStick /></el-icon>
          <span v-if="!showAnalysis">先自己思考一下解题思路</span>
          <span v-else-if="currentStep === 0">根据思路，尝试写出第一步</span>
          <span v-else-if="currentStep < totalSteps">继续完成剩余步骤</span>
          <span v-else>检验你的答案是否正确</span>
        </div>
      </div>

      <!-- 答案区域 -->
      <transition name="step-fade">
        <div v-if="showAnswer" class="answer-section">
          <div class="section-label">
            <el-icon><CircleCheckFilled /></el-icon>
            答案
          </div>
          <div class="answer-content" v-html="renderLatex(example.solution.answer)"></div>
        </div>
      </transition>
    </div>

    <!-- 完整解答 -->
    <div v-if="showFullSolution" class="full-solution">
      <div class="analysis-section">
        <div class="section-label">
          <el-icon><Aim /></el-icon>
          解题分析
        </div>
        <div class="analysis-content" v-html="renderLatex(example.solution.analysis)"></div>
      </div>

      <div class="steps-section">
        <div class="section-label">
          <el-icon><List /></el-icon>
          解题步骤
        </div>
        <div class="steps-container">
          <div
            v-for="(step, index) in example.solution.steps"
            :key="index"
            class="step-item"
          >
            <div class="step-header">
              <span class="step-number">{{ index + 1 }}</span>
              <span class="step-title">{{ step.title }}</span>
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
        <div class="answer-content" v-html="renderLatex(example.solution.answer)"></div>
      </div>

      <el-button class="restart-btn" plain @click="restart">
        <el-icon><RefreshLeft /></el-icon>
        重新练习
      </el-button>
    </div>

    <!-- 自我评价（完成后显示） -->
    <div v-if="showAnswer || showFullSolution" class="self-evaluation">
      <div class="evaluation-header">
        <el-icon><Star /></el-icon>
        <span>这道题你做对了吗？</span>
      </div>
      <div class="evaluation-buttons">
        <el-button
          :type="selfResult === 'correct' ? 'success' : 'default'"
          @click="selfResult = 'correct'"
        >
          <el-icon><CircleCheck /></el-icon>
          做对了
        </el-button>
        <el-button
          :type="selfResult === 'partial' ? 'warning' : 'default'"
          @click="selfResult = 'partial'"
        >
          <el-icon><SemiSelect /></el-icon>
          部分正确
        </el-button>
        <el-button
          :type="selfResult === 'wrong' ? 'danger' : 'default'"
          @click="selfResult = 'wrong'"
        >
          <el-icon><CircleClose /></el-icon>
          做错了
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  EditPen,
  Document,
  Guide,
  View,
  Aim,
  InfoFilled,
  ArrowRight,
  CircleCheck,
  CircleCheckFilled,
  MagicStick,
  List,
  RefreshLeft,
  Star,
  SemiSelect,
  CircleClose
} from '@element-plus/icons-vue'
import type { Example } from '@/stores/knowledgeStore'
import { renderLatex } from '@/utils/latex'

const props = defineProps<{
  example: Example
}>()

const emit = defineEmits<{
  complete: [result: 'correct' | 'partial' | 'wrong']
}>()

// 状态
const started = ref(false)
const showFullSolution = ref(false)
const showAnalysis = ref(false)
const currentStep = ref(0)
const showAnswer = ref(false)
const selfResult = ref<'correct' | 'partial' | 'wrong' | null>(null)

// 计算属性
const totalSteps = computed(() => props.example.solution.steps.length)

const revealedSteps = computed(() => {
  return props.example.solution.steps.slice(0, currentStep.value)
})

const progressPercentage = computed(() => {
  const total = totalSteps.value + 2 // 分析 + 步骤 + 答案
  let current = 0
  if (showAnalysis.value) current++
  current += currentStep.value
  if (showAnswer.value) current++
  return Math.round((current / total) * 100)
})

const progressColors = [
  { color: '#f56c6c', percentage: 20 },
  { color: '#e6a23c', percentage: 40 },
  { color: '#5cb87a', percentage: 60 },
  { color: '#1989fa', percentage: 80 },
  { color: '#6f7ad3', percentage: 100 }
]

const difficultyLabel = computed(() => {
  const labels: Record<string, string> = {
    basic: '基础',
    intermediate: '中等',
    advanced: '进阶'
  }
  return labels[props.example.difficulty] || '基础'
})

const difficultyType = computed(() => {
  const types: Record<string, '' | 'success' | 'warning' | 'danger'> = {
    basic: 'success',
    intermediate: 'warning',
    advanced: 'danger'
  }
  return types[props.example.difficulty] || 'success'
})

// 方法
const startGuided = () => {
  started.value = true
  showFullSolution.value = false
}

const startDirect = () => {
  started.value = true
  showFullSolution.value = true
}

const revealAnalysis = () => {
  showAnalysis.value = true
}

const revealNextStep = () => {
  if (currentStep.value < totalSteps.value) {
    currentStep.value++
  }
}

const revealAnswer = () => {
  showAnswer.value = true
}

const restart = () => {
  started.value = false
  showFullSolution.value = false
  showAnalysis.value = false
  currentStep.value = 0
  showAnswer.value = false
  selfResult.value = null
}

// 监听自我评价
import { watch } from 'vue'
watch(selfResult, (result) => {
  if (result) {
    emit('complete', result)
  }
})
</script>

<style lang="scss" scoped>
.step-by-step-guide {
  background-color: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 20px;
}

.guide-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  .guide-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 600;
    color: var(--text-color);
    margin: 0;

    .el-icon {
      color: var(--primary-color);
    }
  }

  .guide-badges {
    display: flex;
    gap: 8px;
  }
}

.section-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-color-secondary);
  margin-bottom: 10px;

  .el-icon {
    font-size: 15px;
  }
}

.problem-section {
  background-color: var(--bg-color);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;

  .section-label {
    color: var(--primary-color);
  }

  .problem-content {
    font-size: 15px;
    line-height: 1.8;
    color: var(--text-color);

    :deep(.katex-display) {
      margin: 12px 0;
      overflow-x: auto;
    }
  }
}

// 模式选择
.mode-selector {
  text-align: center;
  padding: 24px 0;

  .mode-hint {
    color: var(--text-color-secondary);
    margin-bottom: 16px;
  }

  .mode-options {
    display: flex;
    justify-content: center;
    gap: 20px;

    @media (max-width: 480px) {
      flex-direction: column;
      align-items: center;
    }
  }

  .mode-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 24px 32px;
    background-color: var(--bg-color);
    border: 2px solid var(--border-color);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s;
    min-width: 160px;

    &:hover {
      border-color: var(--primary-color);
      background-color: var(--primary-color-light);
      transform: translateY(-2px);

      .el-icon {
        color: var(--primary-color);
      }
    }

    .el-icon {
      color: var(--text-color-secondary);
      transition: color 0.3s;
    }

    .mode-name {
      font-size: 15px;
      font-weight: 600;
      color: var(--text-color);
    }

    .mode-desc {
      font-size: 12px;
      color: var(--text-color-secondary);
    }
  }
}

// 引导区域
.guided-section {
  .revealed-steps {
    margin-bottom: 20px;
  }
}

.analysis-section {
  background-color: rgba(var(--primary-color-rgb), 0.08);
  border-left: 3px solid var(--primary-color);
  padding: 14px 18px;
  margin-bottom: 16px;
  border-radius: 0 8px 8px 0;

  .section-label {
    color: var(--primary-color);
  }

  .analysis-content {
    font-size: 14px;
    line-height: 1.8;
    color: var(--text-color);

    :deep(.katex-display) {
      margin: 10px 0;
    }
  }
}

.steps-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.step-item {
  background-color: var(--bg-color);
  border-radius: 8px;
  padding: 14px 18px;

  .step-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 10px;

    .step-number {
      width: 26px;
      height: 26px;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: var(--primary-color);
      color: white;
      font-size: 13px;
      font-weight: 600;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .step-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-color);
    }
  }

  .step-content {
    font-size: 14px;
    line-height: 1.8;
    color: var(--text-color);
    padding-left: 38px;

    :deep(.katex-display) {
      margin: 10px 0;
      overflow-x: auto;
    }
  }
}

// 提示控制区
.hint-controls {
  background-color: var(--bg-color);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;

  .hint-progress {
    margin-bottom: 16px;

    .progress-text {
      display: block;
      text-align: center;
      font-size: 12px;
      color: var(--text-color-secondary);
      margin-top: 8px;
    }
  }

  .hint-buttons {
    display: flex;
    justify-content: center;
    gap: 12px;
    flex-wrap: wrap;
    margin-bottom: 12px;
  }

  .think-hint {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-size: 13px;
    color: var(--text-color-secondary);

    .el-icon {
      color: #E6A23C;
    }
  }
}

// 答案区域
.answer-section {
  background-color: rgba(103, 194, 58, 0.1);
  border: 1px solid rgba(103, 194, 58, 0.3);
  border-radius: 8px;
  padding: 16px;
  margin-top: 16px;

  .section-label {
    color: #67C23A;
  }

  .answer-content {
    font-size: 15px;
    font-weight: 500;
    color: var(--text-color);
    line-height: 1.8;

    :deep(.katex-display) {
      margin: 10px 0;
    }
  }
}

// 完整解答
.full-solution {
  .steps-section {
    margin-bottom: 16px;
  }

  .restart-btn {
    margin-top: 16px;
    width: 100%;
  }
}

// 自我评价
.self-evaluation {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px dashed var(--border-color);

  .evaluation-header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-size: 14px;
    color: var(--text-color);
    margin-bottom: 12px;

    .el-icon {
      color: #E6A23C;
    }
  }

  .evaluation-buttons {
    display: flex;
    justify-content: center;
    gap: 12px;
    flex-wrap: wrap;
  }
}

// 动画
.step-fade-enter-active,
.step-fade-leave-active {
  transition: all 0.4s ease;
}

.step-fade-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.step-fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
