<template>
  <div class="formula-flash-card" :class="{ flipped: isFlipped }">
    <div class="card-inner" @click="flip">
      <!-- 正面：问题/公式名称 -->
      <div class="card-front">
        <div class="card-content">
          <div class="card-category" v-if="formula.category">
            <el-tag size="small" type="info">{{ formula.category }}</el-tag>
          </div>
          <h3 class="card-title">{{ formula.name }}</h3>
          <p class="card-hint" v-if="formula.description">
            {{ formula.description }}
          </p>
          <div class="flip-hint">
            <el-icon><Refresh /></el-icon>
            <span>点击翻转查看公式</span>
          </div>
        </div>
        <!-- 难度指示 -->
        <div class="difficulty-indicator" v-if="formula.examFrequency">
          <el-tag :type="getDifficultyType(formula.examFrequency)" size="small">
            {{ getDifficultyLabel(formula.examFrequency) }}
          </el-tag>
        </div>
      </div>

      <!-- 背面：公式内容 -->
      <div class="card-back">
        <div class="card-content">
          <h4 class="formula-name">{{ formula.name }}</h4>
          <div class="formula-latex" v-html="renderFormula(formula.latex, true)"></div>
          <!-- 记忆口诀 -->
          <div class="memory-tip" v-if="formula.memoryTip">
            <el-icon><MagicStick /></el-icon>
            <span>{{ formula.memoryTip }}</span>
          </div>
        </div>
        <div class="flip-hint">
          <el-icon><Refresh /></el-icon>
          <span>点击翻回</span>
        </div>
      </div>
    </div>

    <!-- 底部操作按钮 -->
    <div class="card-actions" @click.stop>
      <el-button
        :type="isMemorized ? 'success' : 'default'"
        size="small"
        @click="toggleMemorized"
      >
        <el-icon><Check v-if="isMemorized" /><Clock v-else /></el-icon>
        {{ isMemorized ? '已掌握' : '待复习' }}
      </el-button>
      <el-button
        type="primary"
        size="small"
        plain
        @click="$emit('next')"
      >
        下一张
        <el-icon><ArrowRight /></el-icon>
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Refresh, MagicStick, Check, Clock, ArrowRight } from '@element-plus/icons-vue'
import { renderFormula } from '@/utils/latex'

interface Formula {
  id: string
  name: string
  latex: string
  description?: string
  category?: string
  examFrequency?: string
  memoryTip?: string
}

interface Props {
  formula: Formula
  initialFlipped?: boolean
  initialMemorized?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  initialFlipped: false,
  initialMemorized: false
})

const emit = defineEmits<{
  flip: [isFlipped: boolean]
  memorized: [id: string, isMemorized: boolean]
  next: []
}>()

const isFlipped = ref(props.initialFlipped)
const isMemorized = ref(props.initialMemorized)

// 监听 props 变化
watch(() => props.formula, () => {
  isFlipped.value = false
})

watch(() => props.initialMemorized, (val) => {
  isMemorized.value = val
})

const flip = () => {
  isFlipped.value = !isFlipped.value
  emit('flip', isFlipped.value)
}

const toggleMemorized = () => {
  isMemorized.value = !isMemorized.value
  emit('memorized', props.formula.id, isMemorized.value)
}

const getDifficultyType = (freq: string): 'primary' | 'success' | 'warning' | 'info' | 'danger' => {
  const types: Record<string, 'primary' | 'success' | 'warning' | 'info' | 'danger'> = {
    'very-high': 'danger',
    'high': 'warning',
    'medium': 'info',
    'low': 'info'
  }
  return types[freq] || 'info'
}

const getDifficultyLabel = (freq: string) => {
  const labels: Record<string, string> = {
    'very-high': '必考',
    'high': '高频',
    'medium': '中频',
    'low': '低频'
  }
  return labels[freq] || freq
}
</script>

<style lang="scss" scoped>
.formula-flash-card {
  perspective: 1000px;
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
}

.card-inner {
  position: relative;
  width: 100%;
  height: 280px;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  transform-style: preserve-3d;
  cursor: pointer;
}

.formula-flash-card.flipped .card-inner {
  transform: rotateY(180deg);
}

.card-front,
.card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  border-radius: 16px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.card-front {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;

  .card-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
  }

  .card-category {
    margin-bottom: 12px;

    :deep(.el-tag) {
      background-color: rgba(255, 255, 255, 0.2);
      border-color: rgba(255, 255, 255, 0.3);
      color: white;
    }
  }

  .card-title {
    font-size: 22px;
    font-weight: 600;
    margin: 0 0 12px 0;
    line-height: 1.4;
  }

  .card-hint {
    font-size: 14px;
    opacity: 0.85;
    margin: 0;
    line-height: 1.6;
  }

  .difficulty-indicator {
    position: absolute;
    top: 16px;
    right: 16px;
  }
}

.card-back {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  color: white;
  transform: rotateY(180deg);

  .card-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
  }

  .formula-name {
    font-size: 16px;
    font-weight: 500;
    margin: 0 0 16px 0;
    opacity: 0.9;
  }

  .formula-latex {
    background-color: rgba(255, 255, 255, 0.95);
    padding: 16px 24px;
    border-radius: 12px;
    margin-bottom: 16px;

    :deep(.katex) {
      font-size: 1.3em;
      color: #333;
    }
  }

  .memory-tip {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    font-size: 13px;
    background-color: rgba(255, 255, 255, 0.15);
    padding: 10px 14px;
    border-radius: 8px;
    text-align: left;
    max-width: 100%;

    .el-icon {
      flex-shrink: 0;
      margin-top: 2px;
    }
  }
}

.flip-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 12px;
  opacity: 0.7;
  margin-top: auto;
  padding-top: 12px;

  .el-icon {
    animation: rotate-hint 2s ease-in-out infinite;
  }
}

@keyframes rotate-hint {
  0%, 100% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(15deg);
  }
  75% {
    transform: rotate(-15deg);
  }
}

.card-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 16px;

  .el-button {
    min-width: 100px;
  }
}

// 悬停效果
.card-inner:hover {
  .card-front,
  .card-back {
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  }
}

// 响应式
@media (max-width: 480px) {
  .card-inner {
    height: 260px;
  }

  .card-front,
  .card-back {
    padding: 20px;
  }

  .card-front .card-title {
    font-size: 18px;
  }

  .card-back .formula-latex {
    padding: 12px 16px;

    :deep(.katex) {
      font-size: 1.1em;
    }
  }
}
</style>
