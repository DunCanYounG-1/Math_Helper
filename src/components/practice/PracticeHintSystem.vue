<template>
  <div class="practice-hint-system">
    <div class="hint-header" @click="toggleExpanded">
      <div class="hint-title">
        <el-icon><MagicStick /></el-icon>
        <span>解题提示</span>
        <el-badge :value="availableHintsCount" :hidden="availableHintsCount === 0" type="warning" />
      </div>
      <el-icon class="expand-icon" :class="{ expanded: isExpanded }">
        <ArrowDown />
      </el-icon>
    </div>

    <transition name="hint-expand">
      <div v-if="isExpanded" class="hint-content">
        <!-- 提示等级选择 -->
        <div class="hint-levels">
          <div
            v-for="(level, index) in hintLevels"
            :key="index"
            class="hint-level-item"
            :class="{
              active: currentLevel >= index,
              locked: index > currentLevel + 1
            }"
            @click="revealHint(index)"
          >
            <el-icon v-if="currentLevel >= index"><CircleCheck /></el-icon>
            <el-icon v-else-if="index === currentLevel + 1"><Unlock /></el-icon>
            <el-icon v-else><Lock /></el-icon>
            <span>{{ level.name }}</span>
          </div>
        </div>

        <!-- 已显示的提示内容 -->
        <div class="revealed-hints">
          <!-- Level 0: 相关知识点 -->
          <transition name="hint-fade">
            <div v-if="currentLevel >= 0" class="hint-section knowledge">
              <div class="section-header">
                <el-icon><Reading /></el-icon>
                <span>相关知识点</span>
              </div>
              <div class="section-content">
                <p class="kp-title">{{ knowledgePoint?.title }}</p>
                <p class="kp-desc">{{ knowledgePoint?.description }}</p>
              </div>
            </div>
          </transition>

          <!-- Level 1: 关键概念 -->
          <transition name="hint-fade">
            <div v-if="currentLevel >= 1" class="hint-section concepts">
              <div class="section-header">
                <el-icon><Key /></el-icon>
                <span>关键概念</span>
              </div>
              <div class="section-content">
                <ul class="key-points-list">
                  <li v-for="(point, index) in knowledgePoint?.keyPoints" :key="index">
                    {{ point }}
                  </li>
                </ul>
              </div>
            </div>
          </transition>

          <!-- Level 2: 相关公式 -->
          <transition name="hint-fade">
            <div v-if="currentLevel >= 2 && relatedFormulas.length > 0" class="hint-section formulas">
              <div class="section-header">
                <el-icon><Document /></el-icon>
                <span>相关公式</span>
              </div>
              <div class="section-content">
                <div
                  v-for="formula in relatedFormulas"
                  :key="formula.id"
                  class="formula-card"
                >
                  <div class="formula-name">{{ formula.name }}</div>
                  <div class="formula-latex" v-html="renderFormula(formula.latex, true)"></div>
                </div>
              </div>
            </div>
          </transition>

          <!-- Level 3: 解题思路 -->
          <transition name="hint-fade">
            <div v-if="currentLevel >= 3" class="hint-section approach">
              <div class="section-header">
                <el-icon><Aim /></el-icon>
                <span>解题思路</span>
              </div>
              <div class="section-content">
                <div class="approach-text" v-html="renderLatex(example.solution.analysis)"></div>
              </div>
            </div>
          </transition>
        </div>

        <!-- 下一个提示按钮 -->
        <div class="hint-actions" v-if="currentLevel < maxLevel">
          <el-button
            type="warning"
            plain
            @click="revealNextHint"
          >
            <el-icon><InfoFilled /></el-icon>
            {{ getNextHintText() }}
          </el-button>
          <span class="hint-warning">
            <el-icon><Warning /></el-icon>
            使用提示可能影响正确率统计
          </span>
        </div>

        <div class="hint-complete" v-else>
          <el-icon><CircleCheckFilled /></el-icon>
          <span>所有提示已显示</span>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  MagicStick,
  ArrowDown,
  CircleCheck,
  Unlock,
  Lock,
  Reading,
  Key,
  Document,
  Aim,
  InfoFilled,
  Warning,
  CircleCheckFilled
} from '@element-plus/icons-vue'
import type { Example } from '@/stores/knowledgeStore'
import { useKnowledgeStore } from '@/stores/knowledgeStore'
import { renderLatex, renderFormula } from '@/utils/latex'

interface Props {
  example: Example
}

const props = defineProps<Props>()

const emit = defineEmits<{
  hintUsed: [level: number]
}>()

const knowledgeStore = useKnowledgeStore()

const isExpanded = ref(false)
const currentLevel = ref(-1) // -1 means no hints revealed

const hintLevels = [
  { name: '知识点', icon: 'Reading' },
  { name: '关键概念', icon: 'Key' },
  { name: '相关公式', icon: 'Document' },
  { name: '解题思路', icon: 'Aim' }
]

const maxLevel = computed(() => hintLevels.length - 1)

const availableHintsCount = computed(() => {
  return maxLevel.value - currentLevel.value
})

// 获取相关知识点
const knowledgePoint = computed(() => {
  return knowledgeStore.getKnowledgePointById(props.example.knowledgePointId)
})

// 获取相关公式
const relatedFormulas = computed(() => {
  return knowledgePoint.value?.formulas || []
})

// 切换展开状态
const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value
}

// 显示特定等级的提示
const revealHint = (level: number) => {
  if (level <= currentLevel.value + 1) {
    currentLevel.value = Math.max(currentLevel.value, level)
    emit('hintUsed', level)
  }
}

// 显示下一个提示
const revealNextHint = () => {
  if (currentLevel.value < maxLevel.value) {
    currentLevel.value++
    emit('hintUsed', currentLevel.value)
  }
}

// 获取下一个提示的文本
const getNextHintText = () => {
  const nextLevel = currentLevel.value + 1
  if (nextLevel <= maxLevel.value) {
    return `查看${hintLevels[nextLevel].name}`
  }
  return '所有提示已显示'
}

// 当题目改变时重置提示状态
watch(() => props.example.id, () => {
  currentLevel.value = -1
  isExpanded.value = false
})
</script>

<style lang="scss" scoped>
.practice-hint-system {
  background-color: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 16px;
}

.hint-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: var(--bg-color);
  }

  .hint-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    color: var(--text-color);

    .el-icon {
      color: #E6A23C;
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

.hint-content {
  padding: 0 18px 18px;
}

.hint-levels {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;

  .hint-level-item {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    background-color: var(--bg-color);
    border-radius: 20px;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s;
    color: var(--text-color-secondary);

    &:hover:not(.locked) {
      background-color: rgba(230, 162, 60, 0.15);
    }

    &.active {
      background-color: rgba(103, 194, 58, 0.15);
      color: #67C23A;

      .el-icon {
        color: #67C23A;
      }
    }

    &.locked {
      opacity: 0.5;
      cursor: not-allowed;

      .el-icon {
        color: var(--text-color-placeholder);
      }
    }

    .el-icon {
      font-size: 14px;
    }
  }
}

.revealed-hints {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.hint-section {
  background-color: var(--bg-color);
  border-radius: 10px;
  padding: 14px;

  .section-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 600;
    color: var(--text-color);
    margin-bottom: 10px;

    .el-icon {
      font-size: 16px;
    }
  }

  .section-content {
    font-size: 14px;
    line-height: 1.7;
    color: var(--text-color-secondary);
  }

  &.knowledge {
    border-left: 3px solid #409EFF;

    .section-header .el-icon {
      color: #409EFF;
    }

    .kp-title {
      font-weight: 600;
      color: var(--text-color);
      margin-bottom: 6px;
    }

    .kp-desc {
      margin: 0;
    }
  }

  &.concepts {
    border-left: 3px solid #67C23A;

    .section-header .el-icon {
      color: #67C23A;
    }

    .key-points-list {
      margin: 0;
      padding-left: 20px;

      li {
        margin-bottom: 6px;

        &:last-child {
          margin-bottom: 0;
        }
      }
    }
  }

  &.formulas {
    border-left: 3px solid #E6A23C;

    .section-header .el-icon {
      color: #E6A23C;
    }

    .formula-card {
      background-color: var(--card-bg);
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 8px;

      &:last-child {
        margin-bottom: 0;
      }

      .formula-name {
        font-size: 13px;
        font-weight: 500;
        color: var(--text-color);
        margin-bottom: 6px;
      }

      .formula-latex {
        font-size: 15px;
        color: var(--text-color);
        overflow-x: auto;

        :deep(.katex) {
          font-size: 1.1em;
        }

        :deep(.katex-display) {
          margin: 8px 0;
        }
      }
    }
  }

  &.approach {
    border-left: 3px solid #F56C6C;

    .section-header .el-icon {
      color: #F56C6C;
    }

    .approach-text {
      :deep(.katex) {
        font-size: 1.05em;
      }

      :deep(.katex-display) {
        margin: 10px 0;
      }
    }
  }
}

.hint-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 16px;
  flex-wrap: wrap;

  .hint-warning {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: var(--text-color-placeholder);

    .el-icon {
      color: #E6A23C;
    }
  }
}

.hint-complete {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 16px;
  padding: 12px;
  background-color: rgba(103, 194, 58, 0.1);
  border-radius: 8px;
  color: #67C23A;
  font-size: 14px;
}

// 动画
.hint-expand-enter-active,
.hint-expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.hint-expand-enter-from,
.hint-expand-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.hint-expand-enter-to,
.hint-expand-leave-from {
  max-height: 1000px;
}

.hint-fade-enter-active,
.hint-fade-leave-active {
  transition: all 0.4s ease;
}

.hint-fade-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.hint-fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

// 响应式
@media (max-width: 480px) {
  .hint-levels {
    .hint-level-item {
      padding: 6px 10px;
      font-size: 12px;
    }
  }

  .hint-actions {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
