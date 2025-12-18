<template>
  <div class="graph-3d-view">
    <div class="view-header">
      <h1>
        <el-icon><DataAnalysis /></el-icon>
        3D 曲面可视化
      </h1>
      <p class="view-desc">探索多元函数的三维图像，直观理解偏导数、极值和鞍点</p>
    </div>

    <el-tabs v-model="activeTab" class="graph-3d-tabs">
      <el-tab-pane name="surface">
        <template #label>
          <span class="tab-label">
            <el-icon><TrendCharts /></el-icon>
            曲面绘制
          </span>
        </template>
        <Surface3D />
      </el-tab-pane>

      <el-tab-pane name="analysis">
        <template #label>
          <span class="tab-label">
            <el-icon><DataLine /></el-icon>
            特征分析
          </span>
        </template>
        <div class="analysis-panel">
          <div class="analysis-section">
            <h3>多元函数特性</h3>
            <div class="concept-cards">
              <div class="concept-card">
                <div class="concept-icon gradient">∇</div>
                <div class="concept-content">
                  <h4>梯度</h4>
                  <p>梯度向量指向函数增长最快的方向</p>
                  <div class="formula">∇f = (∂f/∂x, ∂f/∂y)</div>
                </div>
              </div>

              <div class="concept-card">
                <div class="concept-icon hessian">H</div>
                <div class="concept-content">
                  <h4>Hessian矩阵</h4>
                  <p>二阶偏导数矩阵，用于判断极值类型</p>
                  <div class="formula">H = [f_xx, f_xy; f_yx, f_yy]</div>
                </div>
              </div>

              <div class="concept-card">
                <div class="concept-icon extrema">⚫</div>
                <div class="concept-content">
                  <h4>极值点判别</h4>
                  <p>∇f=0 且 |H|>0, f_xx>0 → 极小<br>∇f=0 且 |H|>0, f_xx&lt;0 → 极大</p>
                </div>
              </div>

              <div class="concept-card">
                <div class="concept-icon saddle">◆</div>
                <div class="concept-content">
                  <h4>鞍点</h4>
                  <p>∇f=0 且 |H|&lt;0 → 鞍点</p>
                  <div class="example">如 z=x²-y² 在原点</div>
                </div>
              </div>
            </div>
          </div>

          <div class="analysis-section">
            <h3>常见曲面类型</h3>
            <div class="surface-types">
              <div class="surface-type">
                <div class="surface-preview paraboloid"></div>
                <div class="surface-info">
                  <h4>椭圆抛物面</h4>
                  <div class="surface-formula">z = x² + y²</div>
                  <ul>
                    <li>开口向上</li>
                    <li>唯一极小值点在原点</li>
                    <li>等值线为同心圆</li>
                  </ul>
                </div>
              </div>

              <div class="surface-type">
                <div class="surface-preview saddle-surface"></div>
                <div class="surface-info">
                  <h4>双曲抛物面(马鞍面)</h4>
                  <div class="surface-formula">z = x² - y²</div>
                  <ul>
                    <li>沿x方向凹，沿y方向凸</li>
                    <li>原点为鞍点</li>
                    <li>等值线为双曲线</li>
                  </ul>
                </div>
              </div>

              <div class="surface-type">
                <div class="surface-preview gaussian"></div>
                <div class="surface-info">
                  <h4>高斯曲面</h4>
                  <div class="surface-formula">z = e^(-(x²+y²))</div>
                  <ul>
                    <li>钟形分布</li>
                    <li>原点为极大值</li>
                    <li>概率论中的正态分布</li>
                  </ul>
                </div>
              </div>

              <div class="surface-type">
                <div class="surface-preview cone"></div>
                <div class="surface-info">
                  <h4>锥面</h4>
                  <div class="surface-formula">z = √(x² + y²)</div>
                  <ul>
                    <li>顶点在原点</li>
                    <li>顶点处不可微</li>
                    <li>等值线为同心圆</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div class="analysis-section">
            <h3>偏导数的几何意义</h3>
            <div class="partial-derivative-explanation">
              <div class="explanation-item">
                <div class="direction-icon x-dir">X</div>
                <div class="explanation-text">
                  <strong>∂f/∂x</strong>：固定y，沿x方向的切线斜率
                  <p>想象用平行于xOz平面的平面去截曲面，得到的截线在该点的斜率</p>
                </div>
              </div>
              <div class="explanation-item">
                <div class="direction-icon y-dir">Y</div>
                <div class="explanation-text">
                  <strong>∂f/∂y</strong>：固定x，沿y方向的切线斜率
                  <p>想象用平行于yOz平面的平面去截曲面，得到的截线在该点的斜率</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane name="examples">
        <template #label>
          <span class="tab-label">
            <el-icon><Collection /></el-icon>
            应用示例
          </span>
        </template>
        <div class="examples-panel">
          <div class="example-card" v-for="example in applicationExamples" :key="example.title">
            <div class="example-header">
              <el-icon :style="{ color: example.color }"><component :is="example.icon" /></el-icon>
              <h4>{{ example.title }}</h4>
            </div>
            <p class="example-desc">{{ example.description }}</p>
            <div class="example-formula" v-html="renderFormula(example.formula)"></div>
            <div class="example-points">
              <span v-for="point in example.keyPoints" :key="point" class="key-point">{{ point }}</span>
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, markRaw } from 'vue'
import {
  DataAnalysis,
  TrendCharts,
  DataLine,
  Collection,
  Coin,
  Histogram,
  Position,
  Sunny
} from '@element-plus/icons-vue'
import Surface3D from '@/components/visualization/Surface3D.vue'
import katex from 'katex'

const activeTab = ref('surface')

const renderFormula = (formula: string) => {
  try {
    return katex.renderToString(formula, { throwOnError: false, displayMode: true })
  } catch {
    return formula
  }
}

const applicationExamples = [
  {
    title: '经济学：利润函数',
    description: '企业生产两种产品x和y，利润函数为：',
    formula: 'P(x,y) = 10x + 20y - x^2 - 2y^2 - xy',
    keyPoints: ['找极大值点确定最优产量', '边际利润为偏导数', 'Hessian矩阵判断稳定性'],
    icon: markRaw(Coin),
    color: '#E6A23C'
  },
  {
    title: '概率论：二维正态分布',
    description: '联合概率密度函数：',
    formula: 'f(x,y) = \\frac{1}{2\\pi\\sigma_x\\sigma_y}e^{-\\frac{1}{2}[(\\frac{x-\\mu_x}{\\sigma_x})^2 + (\\frac{y-\\mu_y}{\\sigma_y})^2]}',
    keyPoints: ['峰值在均值处', '等概率线为椭圆', '协方差影响椭圆倾斜'],
    icon: markRaw(Histogram),
    color: '#409EFF'
  },
  {
    title: '物理学：势能面',
    description: '粒子在二维势场中的势能：',
    formula: 'U(x,y) = x^4 + y^4 - 2x^2 - 2y^2',
    keyPoints: ['极小值点为稳定平衡', '鞍点为不稳定平衡', '梯度指向势能增加方向'],
    icon: markRaw(Position),
    color: '#67C23A'
  },
  {
    title: '气象学：温度分布',
    description: '地表温度随位置变化：',
    formula: 'T(x,y) = 20 + 5\\sin(\\frac{\\pi x}{L})\\cos(\\frac{\\pi y}{L})',
    keyPoints: ['等温线显示温度分布', '梯度方向为热流方向', '极值点为高低温中心'],
    icon: markRaw(Sunny),
    color: '#F56C6C'
  }
]
</script>

<style lang="scss" scoped>
.graph-3d-view {
  height: 100%;
  padding: var(--spacing-md);
  background-color: var(--bg-color);
  overflow-y: auto;
}

.view-header {
  text-align: center;
  margin-bottom: var(--spacing-lg);

  h1 {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-sm);
    font-size: 28px;
    font-weight: 700;
    color: var(--text-color);
    margin-bottom: var(--spacing-xs);

    .el-icon {
      color: #667eea;
      font-size: 26px;
    }
  }

  .view-desc {
    font-size: 14px;
    color: var(--text-color-tertiary);
    margin: 0;
  }
}

.graph-3d-tabs {
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
    color: var(--text-color-secondary);
    border-radius: var(--border-radius);
    transition: all 0.25s;

    &:hover {
      color: var(--text-color);
    }

    &.is-active {
      color: white;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
  }
}

// 分析面板
.analysis-panel {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.analysis-section {
  background-color: var(--card-bg);
  border-radius: 12px;
  padding: 20px;

  h3 {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-color);
    margin: 0 0 16px 0;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--border-color);
  }
}

.concept-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.concept-card {
  display: flex;
  gap: 14px;
  padding: 16px;
  background-color: var(--bg-color);
  border-radius: 10px;

  .concept-icon {
    width: 44px;
    height: 44px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    font-weight: bold;
    color: white;
    flex-shrink: 0;

    &.gradient { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
    &.hessian { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); }
    &.extrema { background: linear-gradient(135deg, #F56C6C 0%, #E6A23C 100%); }
    &.saddle { background: linear-gradient(135deg, #409EFF 0%, #67C23A 100%); }
  }

  .concept-content {
    h4 {
      font-size: 14px;
      font-weight: 600;
      margin: 0 0 6px 0;
      color: var(--text-color);
    }

    p {
      font-size: 13px;
      color: var(--text-color-secondary);
      margin: 0 0 8px 0;
      line-height: 1.5;
    }

    .formula {
      font-family: 'SF Mono', Monaco, monospace;
      font-size: 12px;
      color: var(--primary-color);
      background-color: var(--card-bg);
      padding: 4px 8px;
      border-radius: 4px;
    }

    .example {
      font-size: 12px;
      color: var(--text-color-tertiary);
      font-style: italic;
    }
  }
}

.surface-types {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

.surface-type {
  display: flex;
  gap: 14px;
  padding: 16px;
  background-color: var(--bg-color);
  border-radius: 10px;

  .surface-preview {
    width: 80px;
    height: 80px;
    border-radius: 8px;
    flex-shrink: 0;

    &.paraboloid {
      background: radial-gradient(circle at 50% 80%, #409EFF 0%, transparent 50%),
                  linear-gradient(135deg, #a0cfff 0%, #409EFF 100%);
    }
    &.saddle-surface {
      background: linear-gradient(45deg, #67C23A 0%, transparent 50%),
                  linear-gradient(135deg, #F56C6C 0%, transparent 50%),
                  linear-gradient(to bottom, #e0e0e0 0%, #f5f5f5 100%);
    }
    &.gaussian {
      background: radial-gradient(circle at 50% 50%, #764ba2 0%, #667eea 30%, transparent 60%),
                  linear-gradient(to bottom, #f0f0f0 0%, #e0e0e0 100%);
    }
    &.cone {
      background: conic-gradient(from 180deg, #E6A23C, #F56C6C, #E6A23C),
                  radial-gradient(circle at 50% 100%, white 0%, transparent 30%);
    }
  }

  .surface-info {
    h4 {
      font-size: 14px;
      font-weight: 600;
      margin: 0 0 6px 0;
      color: var(--text-color);
    }

    .surface-formula {
      font-family: 'SF Mono', Monaco, monospace;
      font-size: 13px;
      color: var(--primary-color);
      margin-bottom: 8px;
    }

    ul {
      margin: 0;
      padding-left: 16px;
      font-size: 12px;
      color: var(--text-color-secondary);

      li {
        margin-bottom: 3px;
      }
    }
  }
}

.partial-derivative-explanation {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.explanation-item {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  padding: 14px;
  background-color: var(--bg-color);
  border-radius: 10px;

  .direction-icon {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 16px;
    color: white;
    flex-shrink: 0;

    &.x-dir { background: linear-gradient(135deg, #F56C6C 0%, #E6A23C 100%); }
    &.y-dir { background: linear-gradient(135deg, #409EFF 0%, #67C23A 100%); }
  }

  .explanation-text {
    strong {
      font-size: 14px;
      color: var(--text-color);
    }

    p {
      font-size: 13px;
      color: var(--text-color-secondary);
      margin: 6px 0 0 0;
      line-height: 1.6;
    }
  }
}

// 应用示例面板
.examples-panel {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}

.example-card {
  background-color: var(--card-bg);
  border-radius: 12px;
  padding: 20px;

  .example-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;

    .el-icon {
      font-size: 22px;
    }

    h4 {
      font-size: 15px;
      font-weight: 600;
      margin: 0;
      color: var(--text-color);
    }
  }

  .example-desc {
    font-size: 13px;
    color: var(--text-color-secondary);
    margin: 0 0 12px 0;
  }

  .example-formula {
    padding: 12px;
    background-color: var(--bg-color);
    border-radius: 8px;
    margin-bottom: 12px;
    overflow-x: auto;

    :deep(.katex) {
      font-size: 14px;
    }
  }

  .example-points {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;

    .key-point {
      font-size: 12px;
      padding: 4px 10px;
      background-color: var(--primary-color-light);
      color: var(--primary-color);
      border-radius: 12px;
    }
  }
}

@media (max-width: 768px) {
  .view-header h1 {
    font-size: 22px;
  }

  .concept-cards,
  .surface-types {
    grid-template-columns: 1fr;
  }
}
</style>
