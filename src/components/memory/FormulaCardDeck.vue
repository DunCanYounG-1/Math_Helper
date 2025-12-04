<template>
  <div class="formula-card-deck">
    <!-- 顶部进度和统计 -->
    <div class="deck-header">
      <div class="deck-info">
        <h3 class="deck-title">
          <el-icon><Document /></el-icon>
          {{ title || '公式记忆卡片' }}
        </h3>
        <span class="card-count">{{ currentIndex + 1 }} / {{ formulas.length }}</span>
      </div>

      <div class="deck-stats">
        <el-tooltip content="已掌握" placement="top">
          <span class="stat-item memorized">
            <el-icon><Check /></el-icon>
            {{ memorizedCount }}
          </span>
        </el-tooltip>
        <el-tooltip content="待复习" placement="top">
          <span class="stat-item pending">
            <el-icon><Clock /></el-icon>
            {{ formulas.length - memorizedCount }}
          </span>
        </el-tooltip>
      </div>

      <div class="deck-actions">
        <el-tooltip content="打乱顺序" placement="top">
          <el-button circle size="small" @click="shuffle">
            <el-icon><Sort /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip content="重新开始" placement="top">
          <el-button circle size="small" @click="restart">
            <el-icon><RefreshLeft /></el-icon>
          </el-button>
        </el-tooltip>
      </div>
    </div>

    <!-- 进度条 -->
    <el-progress
      :percentage="progressPercentage"
      :stroke-width="6"
      :show-text="false"
      :color="progressColor"
      class="deck-progress"
    />

    <!-- 卡片区域 -->
    <div class="card-container">
      <transition name="card-slide" mode="out-in">
        <FormulaFlashCard
          v-if="currentFormula"
          :key="currentFormula.id"
          :formula="currentFormula"
          :initial-memorized="isCurrentMemorized"
          @flip="onCardFlip"
          @memorized="onMemorized"
          @next="nextCard"
        />
      </transition>
    </div>

    <!-- 底部导航 -->
    <div class="deck-navigation">
      <el-button
        :disabled="currentIndex === 0"
        @click="prevCard"
        class="nav-btn"
      >
        <el-icon><ArrowLeft /></el-icon>
        上一张
      </el-button>

      <div class="nav-dots">
        <span
          v-for="(_, index) in formulas"
          :key="index"
          class="nav-dot"
          :class="{
            active: index === currentIndex,
            memorized: memorizedIds.has(formulas[index]?.id)
          }"
          @click="goToCard(index)"
        ></span>
      </div>

      <el-button
        :disabled="currentIndex === formulas.length - 1"
        @click="nextCard"
        type="primary"
        class="nav-btn"
      >
        下一张
        <el-icon><ArrowRight /></el-icon>
      </el-button>
    </div>

    <!-- 完成提示 -->
    <el-dialog
      v-model="showCompleteDialog"
      title="学习完成!"
      width="400px"
      center
    >
      <div class="complete-dialog-content">
        <div class="complete-icon">
          <el-icon :size="64" color="#67C23A"><Trophy /></el-icon>
        </div>
        <p class="complete-text">
          你已完成本轮 {{ formulas.length }} 张卡片的学习！
        </p>
        <div class="complete-stats">
          <div class="stat-box">
            <span class="stat-number">{{ memorizedCount }}</span>
            <span class="stat-label">已掌握</span>
          </div>
          <div class="stat-box">
            <span class="stat-number">{{ formulas.length - memorizedCount }}</span>
            <span class="stat-label">待复习</span>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="showCompleteDialog = false">关闭</el-button>
        <el-button type="primary" @click="reviewUnmemorized" v-if="memorizedCount < formulas.length">
          复习未掌握
        </el-button>
        <el-button type="success" @click="restart">
          重新开始
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  Document,
  Check,
  Clock,
  Sort,
  RefreshLeft,
  ArrowLeft,
  ArrowRight,
  Trophy
} from '@element-plus/icons-vue'
import FormulaFlashCard from './FormulaFlashCard.vue'
import { useProgressStore } from '@/stores/progressStore'
import { memorizedToQuality } from '@/services/spacedRepetition'

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
  formulas: Formula[]
  title?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: '公式记忆卡片'
})

const emit = defineEmits<{
  complete: [memorizedIds: string[]]
  progress: [current: number, total: number, memorized: number]
}>()

const progressStore = useProgressStore()

const currentIndex = ref(0)
const memorizedIds = ref(new Set<string>())
const showCompleteDialog = ref(false)
const shuffledFormulas = ref<Formula[]>([])
const currentCardFlipped = ref(false) // 追踪当前卡片是否被翻转过

// 初始化
watch(() => props.formulas, (newFormulas) => {
  shuffledFormulas.value = [...newFormulas]
  currentIndex.value = 0
  memorizedIds.value = new Set()
}, { immediate: true })

// 计算属性
const currentFormula = computed(() => shuffledFormulas.value[currentIndex.value])

const isCurrentMemorized = computed(() => {
  return currentFormula.value ? memorizedIds.value.has(currentFormula.value.id) : false
})

const memorizedCount = computed(() => memorizedIds.value.size)

const progressPercentage = computed(() => {
  if (shuffledFormulas.value.length === 0) return 0
  return Math.round((currentIndex.value + 1) / shuffledFormulas.value.length * 100)
})

const progressColor = computed(() => {
  const percentage = memorizedCount.value / shuffledFormulas.value.length * 100
  if (percentage >= 80) return '#67C23A'
  if (percentage >= 50) return '#E6A23C'
  return '#409EFF'
})

// 方法
const onCardFlip = (isFlipped: boolean) => {
  if (isFlipped) {
    currentCardFlipped.value = true
  }
}

const onMemorized = (id: string, isMemorized: boolean) => {
  if (isMemorized) {
    memorizedIds.value.add(id)
  } else {
    memorizedIds.value.delete(id)
  }
  // 触发更新
  memorizedIds.value = new Set(memorizedIds.value)

  // 记录间隔复习数据
  const quality = memorizedToQuality(isMemorized, currentCardFlipped.value)
  progressStore.recordFormulaReview(id, quality)

  emitProgress()
}

const nextCard = () => {
  if (currentIndex.value < shuffledFormulas.value.length - 1) {
    currentIndex.value++
    currentCardFlipped.value = false // 重置翻转状态
    emitProgress()
  } else {
    // 已经是最后一张，显示完成对话框
    showCompleteDialog.value = true
    emit('complete', Array.from(memorizedIds.value))
  }
}

const prevCard = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--
    currentCardFlipped.value = false // 重置翻转状态
    emitProgress()
  }
}

const goToCard = (index: number) => {
  currentIndex.value = index
  currentCardFlipped.value = false // 重置翻转状态
  emitProgress()
}

const shuffle = () => {
  // Fisher-Yates 洗牌算法
  const array = [...shuffledFormulas.value]
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
  shuffledFormulas.value = array
  currentIndex.value = 0
}

const restart = () => {
  currentIndex.value = 0
  memorizedIds.value = new Set()
  showCompleteDialog.value = false
  emitProgress()
}

const reviewUnmemorized = () => {
  // 过滤出未掌握的卡片
  const unmemorized = shuffledFormulas.value.filter(f => !memorizedIds.value.has(f.id))
  if (unmemorized.length > 0) {
    shuffledFormulas.value = unmemorized
    currentIndex.value = 0
    showCompleteDialog.value = false
  }
}

const emitProgress = () => {
  emit('progress', currentIndex.value + 1, shuffledFormulas.value.length, memorizedCount.value)
}
</script>

<style lang="scss" scoped>
.formula-card-deck {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
  background-color: var(--card-bg);
  border-radius: 16px;
}

.deck-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;

  .deck-info {
    display: flex;
    align-items: center;
    gap: 16px;

    .deck-title {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: var(--text-color);

      .el-icon {
        color: var(--primary-color);
      }
    }

    .card-count {
      font-size: 14px;
      color: var(--text-color-secondary);
      background-color: var(--bg-color);
      padding: 4px 12px;
      border-radius: 20px;
    }
  }

  .deck-stats {
    display: flex;
    gap: 16px;

    .stat-item {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 14px;
      font-weight: 500;

      &.memorized {
        color: #67C23A;
      }

      &.pending {
        color: #E6A23C;
      }
    }
  }

  .deck-actions {
    display: flex;
    gap: 8px;
  }
}

.deck-progress {
  :deep(.el-progress-bar__outer) {
    border-radius: 4px;
  }

  :deep(.el-progress-bar__inner) {
    border-radius: 4px;
    transition: width 0.3s ease;
  }
}

.card-container {
  min-height: 340px;
  display: flex;
  align-items: center;
  justify-content: center;
}

// 卡片切换动画
.card-slide-enter-active,
.card-slide-leave-active {
  transition: all 0.3s ease;
}

.card-slide-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.card-slide-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

.deck-navigation {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;

  .nav-btn {
    min-width: 100px;
  }

  .nav-dots {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    justify-content: center;
    max-width: 60%;

    .nav-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: var(--border-color);
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        transform: scale(1.3);
        background-color: var(--primary-color-light);
      }

      &.active {
        background-color: var(--primary-color);
        transform: scale(1.3);
      }

      &.memorized {
        background-color: #67C23A;
      }

      &.active.memorized {
        box-shadow: 0 0 0 2px var(--card-bg), 0 0 0 4px #67C23A;
      }
    }
  }
}

// 完成对话框
.complete-dialog-content {
  text-align: center;
  padding: 20px 0;

  .complete-icon {
    margin-bottom: 20px;
  }

  .complete-text {
    font-size: 16px;
    color: var(--text-color);
    margin-bottom: 24px;
  }

  .complete-stats {
    display: flex;
    justify-content: center;
    gap: 40px;

    .stat-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;

      .stat-number {
        font-size: 32px;
        font-weight: 700;
        color: var(--primary-color);
      }

      .stat-label {
        font-size: 13px;
        color: var(--text-color-secondary);
      }
    }
  }
}

// 响应式
@media (max-width: 600px) {
  .deck-header {
    .deck-info {
      width: 100%;
      justify-content: space-between;
    }

    .deck-stats,
    .deck-actions {
      width: 100%;
      justify-content: center;
    }
  }

  .deck-navigation {
    flex-wrap: wrap;

    .nav-btn {
      order: 2;
      flex: 1;
    }

    .nav-dots {
      order: 1;
      width: 100%;
      max-width: 100%;
      margin-bottom: 12px;
    }
  }
}
</style>
