<template>
  <div class="common-mistakes-panel" v-if="mistakes.length > 0">
    <div class="panel-header" @click="toggleExpanded">
      <div class="header-left">
        <el-icon class="warning-icon"><Warning /></el-icon>
        <span class="panel-title">易错点提醒</span>
        <el-badge :value="mistakes.length" type="danger" />
      </div>
      <el-icon class="expand-icon" :class="{ expanded: isExpanded }">
        <ArrowDown />
      </el-icon>
    </div>

    <transition name="panel-expand">
      <div v-if="isExpanded" class="panel-content">
        <div
          v-for="mistake in mistakes"
          :key="mistake.id"
          class="mistake-group"
        >
          <div class="mistake-header">
            <div class="mistake-title">
              <el-icon><WarningFilled /></el-icon>
              {{ mistake.title }}
            </div>
            <div class="mistake-badges">
              <el-tag
                :type="getSeverityType(mistake.severity)"
                size="small"
                effect="dark"
              >
                {{ getSeverityLabel(mistake.severity) }}
              </el-tag>
              <el-tag
                v-if="mistake.examFrequency === 'very-high'"
                type="danger"
                size="small"
              >
                高频考点
              </el-tag>
            </div>
          </div>

          <div class="mistake-list">
            <div
              v-for="(item, index) in mistake.mistakes"
              :key="index"
              class="mistake-item"
            >
              <div class="wrong-section">
                <div class="section-label wrong-label">
                  <el-icon><CircleClose /></el-icon>
                  常见错误
                </div>
                <div class="section-content" v-html="renderLatex(item.wrong)"></div>
              </div>

              <div class="correct-section">
                <div class="section-label correct-label">
                  <el-icon><CircleCheck /></el-icon>
                  正确做法
                </div>
                <div class="section-content" v-html="renderLatex(item.correct)"></div>
              </div>

              <div class="tip-section">
                <div class="section-label tip-label">
                  <el-icon><InfoFilled /></el-icon>
                  记忆技巧
                </div>
                <div class="section-content tip-content" v-html="renderLatex(item.tip)"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  Warning,
  ArrowDown,
  WarningFilled,
  CircleClose,
  CircleCheck,
  InfoFilled
} from '@element-plus/icons-vue'
import type { CommonMistake } from '@/stores/knowledgeStore'
import { renderLatex } from '@/utils/latex'

interface Props {
  mistakes: CommonMistake[]
  initialExpanded?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  initialExpanded: true
})

const isExpanded = ref(props.initialExpanded)

const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value
}

const getSeverityType = (severity: string) => {
  const types: Record<string, '' | 'success' | 'warning' | 'danger' | 'info'> = {
    high: 'danger',
    medium: 'warning',
    low: 'info'
  }
  return types[severity] || 'warning'
}

const getSeverityLabel = (severity: string) => {
  const labels: Record<string, string> = {
    high: '高频',
    medium: '中频',
    low: '低频'
  }
  return labels[severity] || '中频'
}
</script>

<style lang="scss" scoped>
.common-mistakes-panel {
  background-color: var(--card-bg);
  border: 1px solid rgba(245, 108, 108, 0.3);
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 16px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  background: linear-gradient(135deg, rgba(245, 108, 108, 0.1) 0%, rgba(230, 162, 60, 0.1) 100%);
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background: linear-gradient(135deg, rgba(245, 108, 108, 0.15) 0%, rgba(230, 162, 60, 0.15) 100%);
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 10px;

    .warning-icon {
      color: #F56C6C;
      font-size: 20px;
    }

    .panel-title {
      font-weight: 600;
      color: var(--text-color);
      font-size: 15px;
    }
  }

  .expand-icon {
    transition: transform 0.3s;
    color: var(--text-color-secondary);

    &.expanded {
      transform: rotate(180deg);
    }
  }
}

.panel-content {
  padding: 16px;
}

.mistake-group {
  margin-bottom: 20px;

  &:last-child {
    margin-bottom: 0;
  }

  .mistake-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    padding-bottom: 10px;
    border-bottom: 1px dashed var(--border-color);

    .mistake-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 15px;
      font-weight: 600;
      color: var(--text-color);

      .el-icon {
        color: #E6A23C;
      }
    }

    .mistake-badges {
      display: flex;
      gap: 8px;
    }
  }
}

.mistake-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.mistake-item {
  background-color: var(--bg-color);
  border-radius: 10px;
  padding: 16px;

  .section-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 8px;

    .el-icon {
      font-size: 14px;
    }

    &.wrong-label {
      color: #F56C6C;
    }

    &.correct-label {
      color: #67C23A;
    }

    &.tip-label {
      color: #409EFF;
    }
  }

  .section-content {
    font-size: 14px;
    line-height: 1.7;
    color: var(--text-color);
    padding-left: 20px;

    :deep(.katex) {
      font-size: 1.05em;
    }

    :deep(.katex-display) {
      margin: 8px 0;
    }
  }
}

.wrong-section {
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(245, 108, 108, 0.2);

  .section-content {
    background-color: rgba(245, 108, 108, 0.08);
    padding: 10px 12px 10px 20px;
    border-radius: 6px;
    border-left: 3px solid #F56C6C;
  }
}

.correct-section {
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(103, 194, 58, 0.2);

  .section-content {
    background-color: rgba(103, 194, 58, 0.08);
    padding: 10px 12px 10px 20px;
    border-radius: 6px;
    border-left: 3px solid #67C23A;
  }
}

.tip-section {
  .section-content {
    background-color: rgba(64, 158, 255, 0.08);
    padding: 10px 12px 10px 20px;
    border-radius: 6px;
    border-left: 3px solid #409EFF;
  }

  .tip-content {
    font-style: italic;
  }
}

// 动画
.panel-expand-enter-active,
.panel-expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.panel-expand-enter-from,
.panel-expand-leave-to {
  opacity: 0;
  max-height: 0;
  padding: 0 16px;
}

.panel-expand-enter-to,
.panel-expand-leave-from {
  max-height: 2000px;
}

// 响应式
@media (max-width: 480px) {
  .mistake-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .mistake-item {
    padding: 12px;

    .section-content {
      padding-left: 12px;
    }
  }
}
</style>
