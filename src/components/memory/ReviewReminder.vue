<template>
  <div class="review-reminder" v-if="dueCount > 0 || showEvenIfEmpty">
    <div class="reminder-header">
      <div class="reminder-title">
        <el-icon :size="24" class="reminder-icon"><Bell /></el-icon>
        <div class="title-content">
          <h4>复习提醒</h4>
          <span class="subtitle">基于艾宾浩斯遗忘曲线</span>
        </div>
      </div>
      <el-badge :value="dueCount" :hidden="dueCount === 0" type="danger">
        <el-button
          type="primary"
          :disabled="dueCount === 0"
          @click="startReview"
        >
          <el-icon><Clock /></el-icon>
          开始复习
        </el-button>
      </el-badge>
    </div>

    <div class="reminder-content" v-if="dueCount > 0">
      <div class="stats-row">
        <div class="stat-item due">
          <span class="stat-number">{{ dueCount }}</span>
          <span class="stat-label">待复习</span>
        </div>
        <div class="stat-item learning">
          <span class="stat-number">{{ learningCount }}</span>
          <span class="stat-label">学习中</span>
        </div>
        <div class="stat-item mastered">
          <span class="stat-number">{{ masteredCount }}</span>
          <span class="stat-label">已掌握</span>
        </div>
      </div>

      <div class="preview-list" v-if="previewFormulas.length > 0">
        <p class="preview-title">即将复习:</p>
        <div class="preview-items">
          <el-tag
            v-for="formula in previewFormulas"
            :key="formula.formulaId"
            size="small"
            :type="getTagType(formula)"
            class="preview-tag"
          >
            {{ getFormulaName(formula.formulaId) }}
          </el-tag>
          <el-tag v-if="dueCount > 3" size="small" type="info">
            +{{ dueCount - 3 }} 更多
          </el-tag>
        </div>
      </div>
    </div>

    <div class="reminder-empty" v-else>
      <el-icon :size="32"><CircleCheck /></el-icon>
      <p>太棒了！暂无需要复习的公式</p>
      <span class="empty-hint">持续使用记忆模式学习新公式吧</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Bell, Clock, CircleCheck } from '@element-plus/icons-vue'
import { useProgressStore } from '@/stores/progressStore'
import { useKnowledgeStore } from '@/stores/knowledgeStore'
import type { ReviewRecord } from '@/services/spacedRepetition'

interface Props {
  showEvenIfEmpty?: boolean
}

withDefaults(defineProps<Props>(), {
  showEvenIfEmpty: false
})

const router = useRouter()
const progressStore = useProgressStore()
const knowledgeStore = useKnowledgeStore()

const dueCount = computed(() => progressStore.dueFormulaCount)

const allRecords = computed(() => progressStore.getAllFormulaReviewRecords())

const learningCount = computed(() => {
  return allRecords.value.filter(r => r.repetitions > 0 && r.repetitions < 3).length
})

const masteredCount = computed(() => {
  return allRecords.value.filter(r => r.repetitions >= 3 && r.interval >= 21).length
})

const previewFormulas = computed(() => {
  return progressStore.getDueFormulas().slice(0, 3)
})

const getFormulaName = (formulaId: string) => {
  // 从知识库中查找公式名称
  for (const kp of knowledgeStore.knowledgePoints) {
    const formula = kp.formulas.find(f => f.id === formulaId)
    if (formula) {
      return formula.name.length > 10 ? formula.name.slice(0, 10) + '...' : formula.name
    }
  }
  return formulaId
}

const getTagType = (record: ReviewRecord) => {
  const now = Date.now()
  const overdueDays = (now - record.nextReviewDate) / (24 * 60 * 60 * 1000)
  if (overdueDays > 7) return 'danger'
  if (overdueDays > 3) return 'warning'
  return 'info'
}

const startReview = () => {
  router.push({ name: 'Formula', query: { mode: 'review' } })
}
</script>

<style lang="scss" scoped>
.review-reminder {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 20px;
  color: white;
}

.reminder-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;

  .reminder-title {
    display: flex;
    align-items: center;
    gap: 12px;

    .reminder-icon {
      background: rgba(255, 255, 255, 0.2);
      padding: 8px;
      border-radius: 12px;
    }

    .title-content {
      h4 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
      }

      .subtitle {
        font-size: 12px;
        opacity: 0.8;
      }
    }
  }

  .el-button {
    background: white;
    color: #667eea;
    border: none;

    &:hover {
      background: rgba(255, 255, 255, 0.9);
    }

    &:disabled {
      background: rgba(255, 255, 255, 0.5);
      color: rgba(102, 126, 234, 0.5);
    }
  }
}

.reminder-content {
  .stats-row {
    display: flex;
    gap: 16px;
    margin-bottom: 16px;

    .stat-item {
      flex: 1;
      text-align: center;
      background: rgba(255, 255, 255, 0.15);
      padding: 12px;
      border-radius: 12px;

      .stat-number {
        display: block;
        font-size: 24px;
        font-weight: 700;
      }

      .stat-label {
        font-size: 12px;
        opacity: 0.9;
      }

      &.due .stat-number {
        color: #FFD93D;
      }

      &.learning .stat-number {
        color: #6BCB77;
      }

      &.mastered .stat-number {
        color: #4D96FF;
      }
    }
  }

  .preview-list {
    .preview-title {
      margin: 0 0 8px 0;
      font-size: 13px;
      opacity: 0.9;
    }

    .preview-items {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;

      .preview-tag {
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
      }
    }
  }
}

.reminder-empty {
  text-align: center;
  padding: 20px 0;

  .el-icon {
    color: #6BCB77;
    margin-bottom: 8px;
  }

  p {
    margin: 0 0 4px 0;
    font-size: 15px;
    font-weight: 500;
  }

  .empty-hint {
    font-size: 13px;
    opacity: 0.8;
  }
}

// 响应式
@media (max-width: 480px) {
  .reminder-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;

    .el-button {
      width: 100%;
    }
  }
}
</style>
