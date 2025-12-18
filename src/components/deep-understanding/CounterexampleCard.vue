<template>
  <div class="counterexample-card">
    <div class="card-header">
      <div class="header-title">
        <el-icon><WarningFilled /></el-icon>
        <span>反例集锦</span>
      </div>
      <el-select
        v-model="selectedCategory"
        placeholder="选择分类"
        size="small"
        class="category-select"
      >
        <el-option value="all" label="全部" />
        <el-option value="limit" label="极限" />
        <el-option value="derivative" label="导数" />
        <el-option value="integral" label="积分" />
        <el-option value="series" label="级数" />
      </el-select>
    </div>

    <div class="card-content">
      <div class="counterexample-list">
        <div
          v-for="item in filteredCounterexamples"
          :key="item.id"
          class="counterexample-item"
          :class="{ expanded: expandedId === item.id }"
        >
          <div class="item-header" @click="toggleExpand(item.id)">
            <div class="item-title">
              <el-icon class="wrong-icon"><CircleClose /></el-icon>
              <span class="wrong-statement">{{ item.wrongStatement }}</span>
            </div>
            <el-icon class="expand-icon">
              <ArrowDown v-if="expandedId !== item.id" />
              <ArrowUp v-else />
            </el-icon>
          </div>

          <transition name="slide">
            <div v-if="expandedId === item.id" class="item-content">
              <!-- 反例展示 -->
              <div class="counterexample-section">
                <div class="section-label">
                  <el-icon><Aim /></el-icon>
                  反例
                </div>
                <div class="example-box">
                  <div class="example-formula" v-html="renderFormula(item.counterexample.formula)"></div>
                  <p class="example-desc">{{ item.counterexample.description }}</p>
                </div>
              </div>

              <!-- 可视化（如果有） -->
              <div v-if="item.visualization" class="visualization-section">
                <div class="section-label">
                  <el-icon><PictureFilled /></el-icon>
                  图示
                </div>
                <div class="viz-container" ref="vizContainer">
                  <div :id="`viz-${item.id}`" class="viz-chart"></div>
                </div>
              </div>

              <!-- 分析说明 -->
              <div class="analysis-section">
                <div class="section-label">
                  <el-icon><QuestionFilled /></el-icon>
                  为什么这是反例？
                </div>
                <div class="analysis-content">
                  <p v-for="(point, index) in item.analysis" :key="index" v-html="renderContent(point)"></p>
                </div>
              </div>

              <!-- 正确表述 -->
              <div class="correct-section">
                <div class="section-label correct">
                  <el-icon><CircleCheck /></el-icon>
                  正确表述
                </div>
                <div class="correct-box">
                  {{ item.correctStatement }}
                </div>
              </div>

              <!-- 相关知识点 -->
              <div v-if="item.relatedTopics?.length" class="related-section">
                <div class="related-tags">
                  <el-tag
                    v-for="topic in item.relatedTopics"
                    :key="topic"
                    size="small"
                    type="info"
                  >
                    {{ topic }}
                  </el-tag>
                </div>
              </div>
            </div>
          </transition>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onUnmounted } from 'vue'
import {
  WarningFilled,
  CircleClose,
  CircleCheck,
  ArrowDown,
  ArrowUp,
  Aim,
  PictureFilled,
  QuestionFilled
} from '@element-plus/icons-vue'
import katex from 'katex'
import * as echarts from 'echarts'

interface Counterexample {
  id: string
  category: string
  wrongStatement: string
  correctStatement: string
  counterexample: {
    formula: string
    description: string
  }
  analysis: string[]
  visualization?: {
    type: 'function' | 'sequence' | 'area'
    config: any
  }
  relatedTopics?: string[]
}

const counterexamples: Counterexample[] = [
  {
    id: 'ce-1',
    category: 'limit',
    wrongStatement: '极限存在则函数连续',
    correctStatement: '极限存在且等于函数值时函数才连续',
    counterexample: {
      formula: 'f(x) = \\begin{cases} \\frac{x^2-1}{x-1} & x \\neq 1 \\\\ 0 & x = 1 \\end{cases}',
      description: '在 x=1 处，极限为2，但 f(1)=0，所以极限存在但不连续'
    },
    analysis: [
      '$\\lim_{x \\to 1} \\frac{x^2-1}{x-1} = \\lim_{x \\to 1} (x+1) = 2$',
      '但是 $f(1) = 0 \\neq 2$',
      '极限值和函数值不相等，所以在 $x=1$ 处不连续'
    ],
    visualization: {
      type: 'function',
      config: {
        func: (x: number) => x === 1 ? 0 : (x * x - 1) / (x - 1),
        range: [-1, 3],
        discontinuity: { x: 1, limit: 2, value: 0 }
      }
    },
    relatedTopics: ['极限定义', '连续性', '间断点']
  },
  {
    id: 'ce-2',
    category: 'derivative',
    wrongStatement: '可导必连续，连续必可导',
    correctStatement: '可导必连续，但连续不一定可导',
    counterexample: {
      formula: 'f(x) = |x|',
      description: '在 x=0 处连续但不可导（左右导数不相等）'
    },
    analysis: [
      '$f(x) = |x|$ 在 $x=0$ 处连续：$\\lim_{x \\to 0} |x| = 0 = f(0)$',
      '左导数：$\\lim_{h \\to 0^-} \\frac{|h| - 0}{h} = \\lim_{h \\to 0^-} \\frac{-h}{h} = -1$',
      '右导数：$\\lim_{h \\to 0^+} \\frac{|h| - 0}{h} = \\lim_{h \\to 0^+} \\frac{h}{h} = 1$',
      '左右导数不相等，所以在 $x=0$ 处不可导'
    ],
    visualization: {
      type: 'function',
      config: {
        func: (x: number) => Math.abs(x),
        range: [-2, 2],
        highlight: { x: 0, label: '尖点' }
      }
    },
    relatedTopics: ['导数定义', '连续性', '左右导数']
  },
  {
    id: 'ce-3',
    category: 'derivative',
    wrongStatement: '导数为0的点一定是极值点',
    correctStatement: '导数为0是极值的必要条件，还需要判断导数符号变化',
    counterexample: {
      formula: 'f(x) = x^3',
      description: '在 x=0 处 f\'(0)=0，但不是极值点'
    },
    analysis: [
      "$f'(x) = 3x^2$，$f'(0) = 0$",
      '但 $f\'(x) = 3x^2 \\geq 0$ 恒成立',
      '导数在 $x=0$ 两侧不变号（都为正或0）',
      '函数单调递增，$x=0$ 是拐点而非极值点'
    ],
    visualization: {
      type: 'function',
      config: {
        func: (x: number) => x * x * x,
        range: [-2, 2],
        highlight: { x: 0, label: '驻点(非极值)' }
      }
    },
    relatedTopics: ['极值', '驻点', '拐点', '单调性']
  },
  {
    id: 'ce-4',
    category: 'integral',
    wrongStatement: '原函数存在则被积函数连续',
    correctStatement: '被积函数连续则原函数存在，但反之不然',
    counterexample: {
      formula: 'F(x) = x^2 \\sin\\frac{1}{x},\\ f(x) = F\'(x)',
      description: 'F(x)的导数f(x)在x=0处不连续，但F(x)是f(x)的原函数'
    },
    analysis: [
      '$F(x) = x^2 \\sin\\frac{1}{x}$ 在 $x=0$ 可导',
      '$F\'(x) = 2x\\sin\\frac{1}{x} - \\cos\\frac{1}{x}$（$x \\neq 0$）',
      '$F\'(0) = \\lim_{h \\to 0} \\frac{h^2\\sin\\frac{1}{h}}{h} = 0$',
      '但 $\\lim_{x \\to 0} F\'(x)$ 不存在，所以 $F\'(x)$ 在 $x=0$ 不连续'
    ],
    relatedTopics: ['原函数', '变限积分', '连续性']
  },
  {
    id: 'ce-5',
    category: 'series',
    wrongStatement: '通项趋于0则级数收敛',
    correctStatement: '通项趋于0是级数收敛的必要条件，不是充分条件',
    counterexample: {
      formula: '\\sum_{n=1}^{\\infty} \\frac{1}{n}',
      description: '调和级数：通项1/n→0，但级数发散'
    },
    analysis: [
      '$\\lim_{n \\to \\infty} \\frac{1}{n} = 0$，通项确实趋于0',
      '但 $\\sum_{n=1}^{\\infty} \\frac{1}{n} = 1 + \\frac{1}{2} + \\frac{1}{3} + \\cdots$ 发散',
      '可以用积分判别法证明：$\\int_1^{\\infty} \\frac{1}{x}dx = \\ln x |_1^{\\infty} = \\infty$',
      '这是最经典的"通项趋于0但级数发散"的例子'
    ],
    relatedTopics: ['级数收敛', '调和级数', '收敛判别法']
  },
  {
    id: 'ce-6',
    category: 'limit',
    wrongStatement: '两个无穷小的商还是无穷小',
    correctStatement: '两个无穷小的商可以是任意值（有限、无穷或不存在）',
    counterexample: {
      formula: '\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1',
      description: 'sinx和x都是无穷小，但它们的商趋于1'
    },
    analysis: [
      '$\\sin x \\to 0$ 和 $x \\to 0$ 都是无穷小',
      '但 $\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1$（重要极限）',
      '类似地：$\\lim_{x \\to 0} \\frac{x}{\\sin x} = 1$，$\\lim_{x \\to 0} \\frac{x^2}{x} = 0$，$\\lim_{x \\to 0} \\frac{x}{x^2} = \\infty$',
      '无穷小的商取决于两者趋于0的"速度"关系'
    ],
    relatedTopics: ['无穷小', '等价无穷小', '重要极限']
  },
  {
    id: 'ce-7',
    category: 'derivative',
    wrongStatement: '二阶导数为0的点一定是拐点',
    correctStatement: '二阶导数为0且二阶导数变号的点才是拐点',
    counterexample: {
      formula: 'f(x) = x^4',
      description: '在 x=0 处 f\'\'(0)=0，但不是拐点（凹凸性不变）'
    },
    analysis: [
      "$f'(x) = 4x^3$，$f''(x) = 12x^2$",
      '$f\'\'(0) = 0$，但 $f\'\'(x) = 12x^2 \\geq 0$ 恒成立',
      '二阶导数在 $x=0$ 两侧不变号（都 $\\geq 0$）',
      '函数在整个定义域上是凹的，$x=0$ 是极值点而非拐点'
    ],
    visualization: {
      type: 'function',
      config: {
        func: (x: number) => x ** 4,
        range: [-1.5, 1.5],
        highlight: { x: 0, label: '极小值(非拐点)' }
      }
    },
    relatedTopics: ['拐点', '凹凸性', '二阶导数']
  },
  {
    id: 'ce-8',
    category: 'series',
    wrongStatement: '绝对收敛与条件收敛没有本质区别',
    correctStatement: '绝对收敛比条件收敛更"稳定"，条件收敛级数重排后和可能改变',
    counterexample: {
      formula: '\\sum_{n=1}^{\\infty} \\frac{(-1)^{n+1}}{n} = \\ln 2',
      description: '交错调和级数条件收敛，但重排后可以得到任意值'
    },
    analysis: [
      '交错调和级数 $\\sum \\frac{(-1)^{n+1}}{n} = 1 - \\frac{1}{2} + \\frac{1}{3} - \\frac{1}{4} + \\cdots = \\ln 2$',
      '它是条件收敛的（绝对值级数即调和级数发散）',
      '黎曼级数定理：条件收敛级数重新排列后可以收敛到任意实数，或发散',
      '这是条件收敛最反直觉的性质：改变求和顺序竟然能改变结果！'
    ],
    relatedTopics: ['条件收敛', '绝对收敛', '黎曼级数定理']
  },
  {
    id: 'ce-9',
    category: 'limit',
    wrongStatement: '函数在某点有定义就一定连续',
    correctStatement: '连续需要极限存在且等于函数值',
    counterexample: {
      formula: 'f(x) = \\begin{cases} 1 & x \\in \\mathbb{Q} \\\\ 0 & x \\notin \\mathbb{Q} \\end{cases}',
      description: 'Dirichlet函数处处有定义但处处不连续'
    },
    analysis: [
      'Dirichlet函数在每一点都有定义',
      '但在任意一点 $x_0$，无论多小的邻域内都既有有理数又有无理数',
      '所以 $\\lim_{x \\to x_0} f(x)$ 不存在',
      '这是一个处处有定义但处处不连续的经典例子'
    ],
    relatedTopics: ['连续性', 'Dirichlet函数', '极限存在性']
  },
  {
    id: 'ce-10',
    category: 'integral',
    wrongStatement: '可积函数一定连续',
    correctStatement: '可积函数可以有有限个或可数个间断点',
    counterexample: {
      formula: 'f(x) = \\begin{cases} 1 & x = 0 \\\\ 0 & x \\neq 0 \\end{cases}',
      description: '在[0,1]上有一个间断点但仍然可积，积分为0'
    },
    analysis: [
      '该函数在 $x=0$ 处不连续（跳跃间断点）',
      '但黎曼可积：$\\int_0^1 f(x)dx = 0$',
      '因为间断点"测度为零"，对积分结果没有贡献',
      '有限个间断点的有界函数都是黎曼可积的'
    ],
    relatedTopics: ['黎曼可积', '间断点', '测度零集']
  },
  {
    id: 'ce-11',
    category: 'derivative',
    wrongStatement: '偏导数存在则多元函数连续',
    correctStatement: '偏导数存在不能保证函数连续，偏导连续才能保证',
    counterexample: {
      formula: 'f(x,y) = \\begin{cases} \\frac{xy}{x^2+y^2} & (x,y) \\neq (0,0) \\\\ 0 & (x,y) = (0,0) \\end{cases}',
      description: '在原点偏导数存在但函数不连续'
    },
    analysis: [
      '$f_x(0,0) = \\lim_{h \\to 0} \\frac{f(h,0) - f(0,0)}{h} = \\lim_{h \\to 0} \\frac{0}{h} = 0$',
      '同理 $f_y(0,0) = 0$，两个偏导数都存在',
      '但沿 $y=x$ 方向：$\\lim_{t \\to 0} f(t,t) = \\lim_{t \\to 0} \\frac{t^2}{2t^2} = \\frac{1}{2} \\neq f(0,0)$',
      '函数在原点不连续，偏导数存在不等于连续！'
    ],
    relatedTopics: ['多元函数', '偏导数', '连续性', '方向极限']
  },
  {
    id: 'ce-12',
    category: 'series',
    wrongStatement: '幂级数在收敛半径处一定收敛',
    correctStatement: '幂级数在收敛半径处的敛散性需要单独判断',
    counterexample: {
      formula: '\\sum_{n=1}^{\\infty} x^n,\\ R=1',
      description: '收敛半径R=1，在x=1发散，x=-1也发散'
    },
    analysis: [
      '几何级数 $\\sum x^n$ 的收敛半径 $R=1$',
      '$x=1$：$\\sum 1^n = 1+1+1+\\cdots$ 发散',
      '$x=-1$：$\\sum (-1)^n = 1-1+1-1+\\cdots$ 振荡发散',
      '但 $\\sum \\frac{x^n}{n}$ 在 $x=-1$ 条件收敛，$x=1$ 发散',
      '端点敛散性必须逐个检验！'
    ],
    relatedTopics: ['幂级数', '收敛半径', '端点收敛性']
  },
  {
    id: 'ce-13',
    category: 'limit',
    wrongStatement: '有界函数乘以无穷小一定是无穷小',
    correctStatement: '只有当乘的是"真正的"函数（有极限意义下的有界）时才成立',
    counterexample: {
      formula: '\\lim_{x \\to 0} x \\cdot \\frac{1}{x} = 1',
      description: 'x是无穷小，1/x在x→0时无界，乘积极限为1'
    },
    analysis: [
      '这个例子看似违反"有界×无穷小=无穷小"',
      '实际上 $\\frac{1}{x}$ 在 $x \\to 0$ 时不是有界函数',
      '正确表述：若 $g(x)$ 在 $x_0$ 某邻域有界，$f(x) \\to 0$，则 $f(x)g(x) \\to 0$',
      '关键是"有界"必须是在极限过程中保持有界'
    ],
    relatedTopics: ['无穷小性质', '有界函数', '极限运算']
  },
  {
    id: 'ce-14',
    category: 'integral',
    wrongStatement: '换元积分后上下限不变',
    correctStatement: '换元积分时上下限必须相应改变',
    counterexample: {
      formula: '\\int_0^1 2x\\sqrt{1-x^2}dx \\xrightarrow{u=1-x^2} -\\int_1^0 \\sqrt{u}du = \\int_0^1 \\sqrt{u}du',
      description: '令u=1-x²，x=0时u=1，x=1时u=0，上下限交换'
    },
    analysis: [
      '令 $u = 1-x^2$，则 $du = -2xdx$',
      '当 $x=0$ 时，$u=1$；当 $x=1$ 时，$u=0$',
      '原式 $= -\\int_1^0 \\sqrt{u}du = \\int_0^1 \\sqrt{u}du = \\frac{2}{3}$',
      '忘记换上下限是定积分计算的常见错误！'
    ],
    relatedTopics: ['定积分', '换元积分', '积分上下限']
  }
]

const selectedCategory = ref('all')
const expandedId = ref<string | null>('ce-1')

// 存储当前活跃的 chart 实例，以便清理
let currentChart: echarts.ECharts | null = null

const filteredCounterexamples = computed(() => {
  if (selectedCategory.value === 'all') {
    return counterexamples
  }
  return counterexamples.filter(c => c.category === selectedCategory.value)
})

const toggleExpand = (id: string) => {
  expandedId.value = expandedId.value === id ? null : id
}

const renderFormula = (formula: string) => {
  try {
    return katex.renderToString(formula, { throwOnError: false, displayMode: true })
  } catch {
    return formula
  }
}

const renderContent = (content: string) => {
  return content.replace(/\$([^$]+)\$/g, (_, formula) => {
    try {
      return katex.renderToString(formula, { throwOnError: false, displayMode: false })
    } catch {
      return `$${formula}$`
    }
  })
}

// 渲染可视化图表
const renderVisualization = (item: Counterexample) => {
  if (!item.visualization) return

  nextTick(() => {
    const container = document.getElementById(`viz-${item.id}`)
    if (!container) return

    // 清理之前的 chart 实例
    if (currentChart) {
      currentChart.dispose()
      currentChart = null
    }

    currentChart = echarts.init(container)
    const config = item.visualization!.config

    if (item.visualization!.type === 'function') {
      const xData: number[] = []
      const yData: (number | null)[] = []
      const step = (config.range[1] - config.range[0]) / 200

      for (let x = config.range[0]; x <= config.range[1]; x += step) {
        xData.push(x)
        const y = config.func(x)
        yData.push(isFinite(y) ? y : null)
      }

      const option: echarts.EChartsOption = {
        grid: { left: 50, right: 20, top: 20, bottom: 30 },
        xAxis: {
          type: 'value',
          min: config.range[0],
          max: config.range[1],
          axisLine: { lineStyle: { color: '#999' } }
        },
        yAxis: {
          type: 'value',
          axisLine: { lineStyle: { color: '#999' } }
        },
        series: [
          {
            type: 'line',
            data: xData.map((x, i) => [x, yData[i]]),
            smooth: false,
            showSymbol: false,
            lineStyle: { color: '#409EFF', width: 2 }
          }
        ]
      }

      // 添加特殊点标记
      if (config.discontinuity) {
        const d = config.discontinuity
        option.series = option.series || []
        ;(option.series as any[]).push({
          type: 'scatter',
          data: [[d.x, d.value]],
          symbolSize: 10,
          itemStyle: { color: '#F56C6C' },
          label: {
            show: true,
            formatter: `f(${d.x})=${d.value}`,
            position: 'bottom'
          }
        })
        ;(option.series as any[]).push({
          type: 'scatter',
          data: [[d.x, d.limit]],
          symbolSize: 10,
          symbol: 'circle',
          itemStyle: { color: 'transparent', borderColor: '#67C23A', borderWidth: 2 },
          label: {
            show: true,
            formatter: `极限=${d.limit}`,
            position: 'top'
          }
        })
      }

      if (config.highlight) {
        const h = config.highlight
        option.series = option.series || []
        ;(option.series as any[]).push({
          type: 'scatter',
          data: [[h.x, config.func(h.x)]],
          symbolSize: 12,
          itemStyle: { color: '#E6A23C' },
          label: {
            show: true,
            formatter: h.label,
            position: 'top',
            color: '#E6A23C'
          }
        })
      }

      currentChart.setOption(option)
    }
  })
}

// 监听展开项变化，渲染可视化
watch(expandedId, (newId) => {
  if (newId) {
    const item = counterexamples.find(c => c.id === newId)
    if (item?.visualization) {
      renderVisualization(item)
    }
  }
})

// 组件卸载时清理
onUnmounted(() => {
  if (currentChart) {
    currentChart.dispose()
    currentChart = null
  }
})
</script>

<style lang="scss" scoped>
// ============================================
// iOS 风格反例卡片
// ============================================
.counterexample-card {
  background-color: var(--card-bg);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(135deg, var(--ios-red) 0%, var(--ios-orange) 100%);
  color: white;
  gap: 12px;
  flex-wrap: wrap;

  .header-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-weight: 600;
    font-size: 15px;
    flex-shrink: 0;
  }

  .category-select {
    width: 100px;
    max-width: 40%;
    flex-shrink: 1;

    :deep(.el-select__wrapper) {
      background-color: rgba(255, 255, 255, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.3);
      box-shadow: none;

      .el-select__placeholder,
      .el-select__selected-item {
        color: white;
        font-weight: 500;
      }

      .el-select__suffix {
        color: white;
      }

      &:hover {
        background-color: rgba(255, 255, 255, 0.25);
      }
    }

    :deep(.el-select__wrapper.is-focused) {
      background-color: rgba(255, 255, 255, 0.3);
      border-color: rgba(255, 255, 255, 0.5);
    }
  }
}

.card-content {
  padding: var(--spacing-md);
}

.counterexample-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.counterexample-item {
  background-color: var(--bg-color);
  border-radius: var(--border-radius);
  overflow: hidden;
  transition: all 0.25s var(--transition-timing);

  &.expanded {
    box-shadow: 0 2px 12px rgba(255, 59, 48, 0.12);
  }
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px var(--spacing-md);
  cursor: pointer;
  transition: background-color 0.15s ease;

  &:active {
    background-color: var(--active-bg);
  }

  .item-title {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    flex: 1;

    .wrong-icon {
      color: var(--ios-red);
      font-size: 18px;
      flex-shrink: 0;
    }

    .wrong-statement {
      font-size: 15px;
      font-weight: 500;
      color: var(--text-color);
    }
  }

  .expand-icon {
    color: var(--text-color-tertiary);
    transition: transform 0.25s var(--transition-timing);
  }
}

.item-content {
  padding: var(--spacing-md);
  padding-top: 0;
}

.counterexample-section,
.visualization-section,
.analysis-section,
.correct-section,
.related-section {
  margin-bottom: var(--spacing-md);

  &:last-child {
    margin-bottom: 0;
  }
}

.section-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: 13px;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: var(--spacing-sm);
  text-transform: uppercase;
  letter-spacing: 0.02em;

  .el-icon {
    color: var(--primary-color);
  }

  &.correct {
    color: var(--ios-green);

    .el-icon {
      color: var(--ios-green);
    }
  }
}

.example-box {
  padding: var(--spacing-md);
  background-color: rgba(255, 59, 48, 0.1);
  border-radius: var(--border-radius);
  border-left: 3px solid var(--ios-red);

  .example-formula {
    margin-bottom: var(--spacing-sm);
    overflow-x: auto;
  }

  .example-desc {
    margin: 0;
    font-size: 13px;
    color: var(--text-color-secondary);
    line-height: 1.5;
  }
}

.viz-container {
  border-radius: var(--border-radius);
  overflow: hidden;
  background-color: var(--bg-color);

  .viz-chart {
    width: 100%;
    height: 200px;
  }
}

.analysis-content {
  padding: var(--spacing-md);
  background-color: var(--bg-color);
  border-radius: var(--border-radius);

  p {
    margin: 0 0 var(--spacing-sm) 0;
    font-size: 14px;
    line-height: 1.7;
    color: var(--text-color-secondary);

    &:last-child {
      margin-bottom: 0;
    }
  }
}

.correct-box {
  padding: var(--spacing-md);
  background-color: rgba(52, 199, 89, 0.12);
  border-radius: var(--border-radius);
  border-left: 3px solid var(--ios-green);
  font-size: 15px;
  color: var(--ios-green);
  font-weight: 500;
}

.related-tags {
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

// iOS 风格展开动画
.slide-enter-active,
.slide-leave-active {
  transition: all 0.25s var(--transition-timing);
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
