<template>
  <div class="example-display">
    <div class="example-header">
      <h4 class="example-title">
        <el-icon><EditPen /></el-icon>
        {{ example.title }}
      </h4>
      <el-tag :type="difficultyType" size="small">{{ difficultyLabel }}</el-tag>
    </div>

    <!-- 题目 -->
    <div class="example-problem">
      <div class="section-label">题目</div>
      <div class="problem-content" v-html="renderLatex(example.problem)"></div>
    </div>

    <!-- 解答区域 -->
    <div class="example-solution">
      <div class="solution-toggle" @click="showSolution = !showSolution">
        <el-icon :class="{ expanded: showSolution }"><ArrowRight /></el-icon>
        <span>{{ showSolution ? '收起解答' : '查看解答' }}</span>
      </div>

      <el-collapse-transition>
        <div v-show="showSolution" class="solution-content">
          <!-- 分析 -->
          <div class="analysis-section">
            <div class="section-label">
              <el-icon><InfoFilled /></el-icon>
              解题分析
            </div>
            <div class="analysis-text" v-html="renderLatex(example.solution.analysis)"></div>
          </div>

          <!-- 解题步骤 -->
          <div class="steps-section">
            <div class="section-label">
              <el-icon><List /></el-icon>
              解题步骤
            </div>
            <div class="steps-list">
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

          <!-- 答案 -->
          <div class="answer-section">
            <div class="section-label">
              <el-icon><CircleCheckFilled /></el-icon>
              答案
            </div>
            <div class="answer-content" v-html="renderLatex(example.solution.answer)"></div>
          </div>
        </div>
      </el-collapse-transition>
    </div>

    <!-- 标签 -->
    <div v-if="example.tags?.length" class="example-tags">
      <el-tag
        v-for="tag in example.tags"
        :key="tag"
        type="info"
        size="small"
        effect="plain"
      >
        {{ tag }}
      </el-tag>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  EditPen,
  ArrowRight,
  InfoFilled,
  List,
  CircleCheckFilled
} from '@element-plus/icons-vue'
import { renderLatex } from '@/utils/latex'
import type { Example } from '@/stores/knowledgeStore'

const props = defineProps<{
  example: Example
}>()

const showSolution = ref(false)

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
</script>

<style lang="scss" scoped>
.example-display {
  background-color: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.example-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;

  .example-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 15px;
    font-weight: 600;
    color: var(--text-color);
    margin: 0;

    .el-icon {
      color: var(--primary-color);
    }
  }
}

.section-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-color-secondary);
  margin-bottom: 8px;

  .el-icon {
    font-size: 14px;
  }
}

.example-problem {
  background-color: var(--bg-color);
  border-radius: 6px;
  padding: 12px 16px;
  margin-bottom: 12px;

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

.example-solution {
  margin-bottom: 12px;

  .solution-toggle {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    background-color: var(--primary-color-light);
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    color: var(--primary-color);
    font-weight: 500;
    transition: all 0.2s;

    &:hover {
      background-color: var(--primary-color);
      color: white;
    }

    .el-icon {
      transition: transform 0.3s;

      &.expanded {
        transform: rotate(90deg);
      }
    }
  }

  .solution-content {
    margin-top: 16px;
  }
}

.analysis-section {
  background-color: rgba(var(--primary-color-rgb), 0.05);
  border-left: 3px solid var(--primary-color);
  padding: 12px 16px;
  margin-bottom: 16px;
  border-radius: 0 6px 6px 0;

  .analysis-text {
    font-size: 14px;
    line-height: 1.8;
    color: var(--text-color);

    :deep(.katex-display) {
      margin: 8px 0;
    }
  }
}

.steps-section {
  margin-bottom: 16px;

  .steps-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .step-item {
    background-color: var(--bg-color);
    border-radius: 6px;
    padding: 12px 16px;

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
        font-size: 14px;
        font-weight: 600;
        color: var(--text-color);
      }
    }

    .step-content {
      font-size: 14px;
      line-height: 1.8;
      color: var(--text-color);
      padding-left: 34px;

      :deep(.katex-display) {
        margin: 8px 0;
        overflow-x: auto;
      }

      :deep(.katex) {
        font-size: 1em;
      }
    }
  }
}

.answer-section {
  background-color: rgba(103, 194, 58, 0.1);
  border: 1px solid rgba(103, 194, 58, 0.3);
  border-radius: 6px;
  padding: 12px 16px;

  .section-label {
    color: #67c23a;
  }

  .answer-content {
    font-size: 15px;
    font-weight: 500;
    color: var(--text-color);
    line-height: 1.8;

    :deep(.katex-display) {
      margin: 8px 0;
    }
  }
}

.example-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border-color);
}

.latex-error {
  color: #f56c6c;
  background-color: rgba(245, 108, 108, 0.1);
  padding: 2px 4px;
  border-radius: 3px;
}
</style>
