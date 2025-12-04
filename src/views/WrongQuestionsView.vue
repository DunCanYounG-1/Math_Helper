<template>
  <div class="wrong-questions-view">
    <div class="page-header">
      <h1 class="page-title">
        <el-icon><DocumentDelete /></el-icon>
        错题本
      </h1>
      <p class="page-desc">记录做错的题目，方便复习巩固</p>
    </div>

    <!-- 统计概览 -->
    <div class="stats-section card">
      <div class="stat-item">
        <span class="stat-value">{{ allWrongQuestions.length }}</span>
        <span class="stat-label">总错题</span>
      </div>
      <div class="stat-item">
        <span class="stat-value warning">{{ unmastered.length }}</span>
        <span class="stat-label">待复习</span>
      </div>
      <div class="stat-item">
        <span class="stat-value success">{{ mastered.length }}</span>
        <span class="stat-label">已掌握</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{{ averageWrongCount }}</span>
        <span class="stat-label">平均错误次数</span>
      </div>
    </div>

    <!-- 筛选和操作 -->
    <div class="filter-section">
      <div class="filter-left">
        <el-radio-group v-model="filterStatus" size="small">
          <el-radio-button value="all">全部 ({{ allWrongQuestions.length }})</el-radio-button>
          <el-radio-button value="unmastered">待复习 ({{ unmastered.length }})</el-radio-button>
          <el-radio-button value="mastered">已掌握 ({{ mastered.length }})</el-radio-button>
        </el-radio-group>
      </div>
      <div class="filter-right">
        <el-button
          type="primary"
          :disabled="unmastered.length === 0"
          @click="startReview"
        >
          <el-icon><VideoPlay /></el-icon>
          开始复习
        </el-button>
        <el-popconfirm
          title="确定清空所有错题记录吗？此操作不可恢复。"
          @confirm="clearAll"
        >
          <template #reference>
            <el-button type="danger" plain :disabled="allWrongQuestions.length === 0">
              <el-icon><Delete /></el-icon>
              清空
            </el-button>
          </template>
        </el-popconfirm>
      </div>
    </div>

    <!-- 错题列表 -->
    <div class="wrong-questions-list">
      <div
        v-for="item in filteredQuestions"
        :key="item.exampleId"
        class="wrong-question-card card"
        :class="{ mastered: item.mastered }"
      >
        <div class="question-header">
          <div class="question-info">
            <el-tag :type="getDifficultyType(getExample(item.exampleId)?.difficulty)" size="small">
              {{ getDifficultyLabel(getExample(item.exampleId)?.difficulty) }}
            </el-tag>
            <span class="question-title">{{ getExample(item.exampleId)?.title }}</span>
            <el-tag v-if="item.mastered" type="success" size="small">已掌握</el-tag>
          </div>
          <div class="question-stats">
            <span class="stat wrong-stat">
              <el-icon><WarningFilled /></el-icon>
              错误 {{ item.wrongCount }} 次
            </span>
            <span class="stat review-stat" v-if="item.reviewCount > 0">
              <el-icon><SuccessFilled /></el-icon>
              复习正确 {{ item.reviewCount }} 次
            </span>
          </div>
        </div>

        <div class="question-content">
          <div class="problem-text" v-html="renderLatex(getExample(item.exampleId)?.problem || '')"></div>
        </div>

        <div class="question-meta">
          <span class="meta-item">
            <el-icon><Clock /></el-icon>
            最近错误：{{ formatTime(item.lastWrongAt) }}
          </span>
          <span class="meta-item" v-if="item.lastReviewAt">
            <el-icon><Refresh /></el-icon>
            最近复习：{{ formatTime(item.lastReviewAt) }}
          </span>
          <span class="meta-item">
            <el-icon><Collection /></el-icon>
            {{ getKnowledgePointTitle(getExample(item.exampleId)?.knowledgePointId) }}
          </span>
        </div>

        <div class="question-actions">
          <el-button size="small" @click="showSolution(item.exampleId)">
            <el-icon><View /></el-icon>
            查看解答
          </el-button>
          <el-button
            v-if="!item.mastered"
            type="success"
            size="small"
            @click="markMastered(item.exampleId)"
          >
            <el-icon><Check /></el-icon>
            标记已掌握
          </el-button>
          <el-button
            v-else
            type="warning"
            size="small"
            plain
            @click="resetQuestion(item.exampleId)"
          >
            <el-icon><RefreshRight /></el-icon>
            重新复习
          </el-button>
          <el-popconfirm
            title="确定删除这道错题记录吗？"
            @confirm="removeQuestion(item.exampleId)"
          >
            <template #reference>
              <el-button type="danger" size="small" plain>
                <el-icon><Delete /></el-icon>
                删除
              </el-button>
            </template>
          </el-popconfirm>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="filteredQuestions.length === 0" class="empty-state card">
      <el-icon :size="64"><DocumentChecked /></el-icon>
      <h3 v-if="allWrongQuestions.length === 0">暂无错题</h3>
      <h3 v-else>该分类暂无错题</h3>
      <p v-if="allWrongQuestions.length === 0">
        在练习中做错的题目会自动记录到这里
      </p>
      <el-button v-if="allWrongQuestions.length === 0" type="primary" @click="goToPractice">
        去练习
      </el-button>
    </div>

    <!-- 解答弹窗 -->
    <el-dialog
      v-model="solutionVisible"
      :title="currentExample?.title"
      width="700px"
    >
      <div v-if="currentExample" class="solution-dialog">
        <div class="problem-section">
          <div class="section-label">题目</div>
          <div class="problem-content" v-html="renderLatex(currentExample.problem)"></div>
        </div>

        <div class="analysis-section">
          <div class="section-label">
            <el-icon><InfoFilled /></el-icon>
            解题分析
          </div>
          <div class="analysis-content" v-html="renderLatex(currentExample.solution.analysis)"></div>
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
          <div class="answer-content" v-html="renderLatex(currentExample.solution.answer)"></div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  DocumentDelete,
  VideoPlay,
  Delete,
  View,
  Check,
  RefreshRight,
  Clock,
  Refresh,
  Collection,
  WarningFilled,
  SuccessFilled,
  DocumentChecked,
  InfoFilled,
  List,
  CircleCheckFilled
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useKnowledgeStore, type Example } from '@/stores/knowledgeStore'
import { useProgressStore, type WrongQuestion } from '@/stores/progressStore'
import { renderLatex } from '@/utils/latex'
import 'katex/dist/katex.min.css'

const router = useRouter()
const knowledgeStore = useKnowledgeStore()
const progressStore = useProgressStore()

const filterStatus = ref<'all' | 'unmastered' | 'mastered'>('all')
const solutionVisible = ref(false)
const currentExample = ref<Example | null>(null)

// 所有错题
const allWrongQuestions = computed(() => {
  return progressStore.getAllWrongQuestions()
})

// 未掌握的错题
const unmastered = computed(() => {
  return allWrongQuestions.value.filter(q => !q.mastered)
})

// 已掌握的错题
const mastered = computed(() => {
  return allWrongQuestions.value.filter(q => q.mastered)
})

// 筛选后的错题
const filteredQuestions = computed(() => {
  switch (filterStatus.value) {
    case 'unmastered':
      return unmastered.value
    case 'mastered':
      return mastered.value
    default:
      return allWrongQuestions.value
  }
})

// 平均错误次数
const averageWrongCount = computed(() => {
  if (allWrongQuestions.value.length === 0) return 0
  const total = allWrongQuestions.value.reduce((sum, q) => sum + q.wrongCount, 0)
  return (total / allWrongQuestions.value.length).toFixed(1)
})

// 获取例题
const getExample = (exampleId: string): Example | undefined => {
  return knowledgeStore.examples.find(e => e.id === exampleId)
}

// 获取知识点标题
const getKnowledgePointTitle = (kpId: string | undefined): string => {
  if (!kpId) return ''
  const kp = knowledgeStore.knowledgePoints.find(k => k.id === kpId)
  return kp?.title || ''
}

// 难度标签
const getDifficultyLabel = (diff: string | undefined) => {
  const labels: Record<string, string> = {
    basic: '基础',
    intermediate: '中等',
    advanced: '进阶'
  }
  return labels[diff || 'basic'] || '基础'
}

const getDifficultyType = (diff: string | undefined) => {
  const types: Record<string, string> = {
    basic: 'success',
    intermediate: 'warning',
    advanced: 'danger'
  }
  return types[diff || 'basic'] || 'success'
}

// 格式化时间
const formatTime = (timestamp: number) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - timestamp

  if (diff < 60000) {
    return '刚刚'
  }
  if (diff < 3600000) {
    return `${Math.floor(diff / 60000)} 分钟前`
  }
  if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)} 小时前`
  }
  if (diff < 604800000) {
    return `${Math.floor(diff / 86400000)} 天前`
  }

  return date.toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit'
  })
}

// 查看解答
const showSolution = (exampleId: string) => {
  currentExample.value = getExample(exampleId) || null
  solutionVisible.value = true
}

// 标记已掌握
const markMastered = (exampleId: string) => {
  progressStore.markWrongQuestionMastered(exampleId)
  ElMessage.success('已标记为掌握')
}

// 重置为待复习
const resetQuestion = (exampleId: string) => {
  progressStore.resetWrongQuestion(exampleId)
  ElMessage.info('已重置为待复习')
}

// 删除错题
const removeQuestion = (exampleId: string) => {
  progressStore.removeWrongQuestion(exampleId)
  ElMessage.success('已删除')
}

// 清空所有
const clearAll = () => {
  progressStore.clearPracticeRecords()
  ElMessage.success('已清空所有错题')
}

// 开始复习
const startReview = () => {
  router.push('/practice')
  // 通过 query 参数告诉练习页面进入错题复习模式
  // 但由于练习页面已经有错题复习模式，直接跳转即可
}

// 去练习
const goToPractice = () => {
  router.push('/practice')
}

onMounted(() => {
  knowledgeStore.loadKnowledgeData()
  progressStore.loadFromStorage()
})
</script>

<style lang="scss" scoped>
.wrong-questions-view {
  max-width: 900px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 24px;

  .page-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 24px;
    margin-bottom: 8px;

    .el-icon {
      color: #F56C6C;
    }
  }

  .page-desc {
    color: var(--text-color-secondary);
  }
}

.stats-section {
  display: flex;
  justify-content: space-around;
  margin-bottom: 24px;

  .stat-item {
    text-align: center;

    .stat-value {
      display: block;
      font-size: 28px;
      font-weight: 700;
      color: var(--text-color);

      &.warning {
        color: #E6A23C;
      }

      &.success {
        color: #67C23A;
      }
    }

    .stat-label {
      font-size: 14px;
      color: var(--text-color-secondary);
    }
  }
}

.filter-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  .filter-right {
    display: flex;
    gap: 8px;
  }
}

.wrong-questions-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.wrong-question-card {
  &.mastered {
    opacity: 0.7;
    border-left: 3px solid #67C23A;
  }

  .question-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;

    .question-info {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;

      .question-title {
        font-weight: 600;
        color: var(--text-color);
      }
    }

    .question-stats {
      display: flex;
      gap: 16px;

      .stat {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 13px;

        &.wrong-stat {
          color: #F56C6C;
        }

        &.review-stat {
          color: #67C23A;
        }
      }
    }
  }

  .question-content {
    background: var(--bg-color);
    padding: 16px;
    border-radius: 8px;
    margin-bottom: 12px;

    .problem-text {
      line-height: 1.8;

      :deep(.katex-display) {
        margin: 8px 0;
      }
    }
  }

  .question-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    margin-bottom: 12px;
    font-size: 13px;
    color: var(--text-color-secondary);

    .meta-item {
      display: flex;
      align-items: center;
      gap: 4px;
    }
  }

  .question-actions {
    display: flex;
    gap: 8px;
    padding-top: 12px;
    border-top: 1px solid var(--border-color);
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
    margin-bottom: 16px;
  }
}

.solution-dialog {
  .problem-section {
    margin-bottom: 20px;

    .section-label {
      font-weight: 600;
      color: var(--text-color);
      margin-bottom: 8px;
    }

    .problem-content {
      background: var(--bg-color);
      padding: 16px;
      border-radius: 8px;
      line-height: 1.8;
    }
  }

  .analysis-section {
    margin-bottom: 20px;
    background: rgba(var(--primary-color-rgb), 0.05);
    border-left: 3px solid var(--primary-color);
    padding: 12px 16px;
    border-radius: 0 8px 8px 0;

    .section-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 600;
      color: var(--text-color-secondary);
      margin-bottom: 8px;
    }

    .analysis-content {
      line-height: 1.8;
    }
  }

  .steps-section {
    margin-bottom: 20px;

    .section-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 600;
      color: var(--text-color-secondary);
      margin-bottom: 12px;
    }

    .step-item {
      background: var(--bg-color);
      padding: 12px 16px;
      border-radius: 8px;
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
          background: var(--primary-color);
          color: white;
          font-size: 12px;
          font-weight: 600;
          border-radius: 50%;
        }

        .step-title {
          font-weight: 600;
          color: var(--text-color);
        }
      }

      .step-content {
        padding-left: 34px;
        line-height: 1.8;
      }
    }
  }

  .answer-section {
    background: rgba(103, 194, 58, 0.1);
    border: 1px solid rgba(103, 194, 58, 0.3);
    padding: 12px 16px;
    border-radius: 8px;

    .section-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 600;
      color: #67C23A;
      margin-bottom: 8px;
    }

    .answer-content {
      font-weight: 500;
      line-height: 1.8;
    }
  }
}

.latex-error {
  color: #F56C6C;
  background: rgba(245, 108, 108, 0.1);
  padding: 2px 4px;
  border-radius: 3px;
}
</style>
