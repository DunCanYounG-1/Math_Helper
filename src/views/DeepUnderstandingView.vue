<template>
  <div class="deep-understanding-view">
    <div class="view-header">
      <h1>
        <el-icon><Opportunity /></el-icon>
        深度理解
      </h1>
      <p class="view-desc">通过概念对比、反例分析和证明演示，深入理解数学本质</p>
    </div>

    <el-tabs v-model="activeTab" class="understanding-tabs">
      <el-tab-pane name="comparison">
        <template #label>
          <span class="tab-label">
            <el-icon><Switch /></el-icon>
            概念对比
          </span>
        </template>
        <ConceptComparison />
      </el-tab-pane>

      <el-tab-pane name="counterexample">
        <template #label>
          <span class="tab-label">
            <el-icon><WarningFilled /></el-icon>
            反例集锦
          </span>
        </template>
        <CounterexampleCard />
      </el-tab-pane>

      <el-tab-pane name="proof">
        <template #label>
          <span class="tab-label">
            <el-icon><Reading /></el-icon>
            证明动画
          </span>
        </template>
        <ProofAnimator />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Opportunity, Switch, WarningFilled, Reading } from '@element-plus/icons-vue'
import ConceptComparison from '@/components/deep-understanding/ConceptComparison.vue'
import CounterexampleCard from '@/components/deep-understanding/CounterexampleCard.vue'
import ProofAnimator from '@/components/deep-understanding/ProofAnimator.vue'

const activeTab = ref('comparison')
</script>

<style lang="scss" scoped>
// ============================================
// iOS 风格深度理解视图
// ============================================
.deep-understanding-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--spacing-md) var(--spacing-lg);
  background-color: var(--bg-color);
}

// iOS 大标题风格头部
.view-header {
  text-align: center;
  margin-bottom: var(--spacing-xl);

  h1 {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-sm);
    font-size: 34px;
    font-weight: 700;
    color: var(--text-color);
    margin-bottom: var(--spacing-sm);
    letter-spacing: 0.01em;

    .el-icon {
      color: var(--ios-orange);
      font-size: 28px;
    }
  }

  .view-desc {
    font-size: 15px;
    color: var(--text-color-tertiary);
    margin: 0;
    line-height: 1.6;
  }
}

// iOS 风格标签页
.understanding-tabs {
  :deep(.el-tabs__header) {
    margin-bottom: var(--spacing-lg);
    background-color: var(--card-bg);
    border-radius: var(--border-radius-lg);
    padding: var(--spacing-sm);
  }

  :deep(.el-tabs__nav-wrap::after) {
    display: none;
  }

  :deep(.el-tabs__nav) {
    width: 100%;
    display: flex;
  }

  :deep(.el-tabs__item) {
    flex: 1;
    text-align: center;
    font-size: 14px;
    font-weight: 500;
    padding: 10px 0;
    height: auto;
    line-height: 1.4;
    color: var(--text-color-secondary);
    border-radius: var(--border-radius);
    transition: all 0.25s var(--transition-timing);

    &:hover {
      color: var(--text-color);
    }

    &.is-active {
      color: var(--text-color);
      background-color: var(--bg-color);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
  }

  :deep(.el-tabs__active-bar) {
    display: none;
  }

  .tab-label {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-xs);

    .el-icon {
      font-size: 16px;
    }
  }

  :deep(.el-tabs__content) {
    background-color: var(--card-bg);
    border-radius: var(--border-radius-lg);
    padding: var(--spacing-lg);
  }
}

// 响应式
@media (max-width: 768px) {
  .view-header h1 {
    font-size: 28px;
  }

  .understanding-tabs {
    :deep(.el-tabs__item) {
      font-size: 13px;
      padding: 8px 0;
    }

    .tab-label {
      flex-direction: column;
      gap: 2px;

      .el-icon {
        font-size: 18px;
      }
    }
  }
}
</style>
