<template>
  <div class="integral-animation">
    <div ref="chartContainer" class="chart-container"></div>

    <!-- 控制面板 -->
    <div class="control-panel">
      <div class="control-row">
        <div class="control-item" v-if="showFunctionSelect">
          <label>函数选择:</label>
          <el-select v-model="selectedFunc" @change="handleFuncChange" size="small">
            <el-option v-for="(func, key) in functions" :key="key" :value="key" :label="func.name" />
          </el-select>
        </div>

        <div class="control-group">
          <div class="control-item">
            <label>下限 a:</label>
            <el-input-number v-model="lowerBound" :min="-4" :max="upperBound - 0.1" :step="0.1" size="small" @change="updateChart" />
          </div>
          <div class="control-item">
            <label>上限 b:</label>
            <el-input-number v-model="upperBound" :min="lowerBound + 0.1" :max="4" :step="0.1" size="small" @change="updateChart" />
          </div>
        </div>
      </div>

      <div class="control-row">
        <div class="control-item">
          <label>分割数 n:</label>
          <el-slider v-model="divisions" :min="4" :max="100" :step="1" @input="updateChart" />
          <span class="value-display">{{ divisions }}</span>
        </div>

        <div class="toggle-group">
          <el-switch v-model="showRiemann" @change="updateChart" />
          <label>显示黎曼和</label>
        </div>

        <div class="toggle-group" v-if="showFTCOption">
          <el-switch v-model="showFTC" @change="updateChart" />
          <label>显示原函数</label>
        </div>
      </div>
    </div>

    <!-- 结果显示 -->
    <div class="result-display">
      <div class="result-item">
        <span class="label">定积分精确值:</span>
        <span class="value primary">{{ exactIntegral.toFixed(6) }}</span>
      </div>
      <div v-if="showRiemann" class="result-item">
        <span class="label">黎曼和近似值:</span>
        <span class="value">{{ riemannSum.toFixed(6) }}</span>
      </div>
      <div v-if="showRiemann" class="result-item">
        <span class="label">误差:</span>
        <span class="value error">{{ error.toFixed(6) }}</span>
      </div>
    </div>

    <!-- 说明 -->
    <div class="explanation">
      <p v-html="explanationText"></p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'

interface IntegralConfig {
  type?: 'antiderivative' | 'definite-integral' | 'ftc' | 'integral-applications'
  expression?: string
  showFunctionSelect?: boolean
  title?: string
}

interface Props {
  config?: IntegralConfig
}

const props = withDefaults(defineProps<Props>(), {
  config: () => ({
    type: 'definite-integral',
    expression: 'x^2',
    showFunctionSelect: true
  })
})

const chartContainer = ref<HTMLElement | null>(null)
let chart: echarts.ECharts | null = null

const lowerBound = ref(0)
const upperBound = ref(2)
const divisions = ref(20)
const showRiemann = ref(true)
const showFTC = ref(false)
const selectedFunc = ref('x^2')

// 预定义函数库
const functions: Record<string, {
  f: (x: number) => number
  F: (x: number) => number  // 原函数
  name: string
  latex: string
  integralLatex: string
}> = {
  'x^2': {
    f: (x) => x * x,
    F: (x) => x * x * x / 3,
    name: 'f(x) = x²',
    latex: 'x^2',
    integralLatex: '\\frac{x^3}{3}'
  },
  'x': {
    f: (x) => x,
    F: (x) => x * x / 2,
    name: 'f(x) = x',
    latex: 'x',
    integralLatex: '\\frac{x^2}{2}'
  },
  'x^3': {
    f: (x) => x * x * x,
    F: (x) => x * x * x * x / 4,
    name: 'f(x) = x³',
    latex: 'x^3',
    integralLatex: '\\frac{x^4}{4}'
  },
  'sin': {
    f: (x) => Math.sin(x),
    F: (x) => -Math.cos(x),
    name: 'f(x) = sin(x)',
    latex: '\\sin(x)',
    integralLatex: '-\\cos(x)'
  },
  'cos': {
    f: (x) => Math.cos(x),
    F: (x) => Math.sin(x),
    name: 'f(x) = cos(x)',
    latex: '\\cos(x)',
    integralLatex: '\\sin(x)'
  },
  'e^x': {
    f: (x) => Math.exp(x),
    F: (x) => Math.exp(x),
    name: 'f(x) = eˣ',
    latex: 'e^x',
    integralLatex: 'e^x'
  },
  '1/x': {
    f: (x) => x > 0 ? 1 / x : NaN,
    F: (x) => x > 0 ? Math.log(x) : NaN,
    name: 'f(x) = 1/x',
    latex: '\\frac{1}{x}',
    integralLatex: '\\ln(x)'
  },
  'sqrt': {
    f: (x) => x >= 0 ? Math.sqrt(x) : NaN,
    F: (x) => x >= 0 ? (2/3) * Math.pow(x, 1.5) : NaN,
    name: 'f(x) = √x',
    latex: '\\sqrt{x}',
    integralLatex: '\\frac{2}{3}x^{3/2}'
  },
  '1': {
    f: () => 1,
    F: (x) => x,
    name: 'f(x) = 1',
    latex: '1',
    integralLatex: 'x'
  }
}

// 获取当前函数
const currentFunc = computed(() => {
  const expr = props.config?.expression || selectedFunc.value
  return functions[expr] || functions[selectedFunc.value] || functions['x^2']
})

// 计算属性
const showFunctionSelect = computed(() => props.config?.showFunctionSelect !== false)
const showFTCOption = computed(() =>
  props.config?.type === 'ftc' ||
  props.config?.type === 'antiderivative'
)

// 精确积分值
const exactIntegral = computed(() => {
  const a = lowerBound.value
  const b = upperBound.value
  const func = currentFunc.value
  return func.F(b) - func.F(a)
})

// 黎曼和
const riemannSum = computed(() => {
  const a = lowerBound.value
  const b = upperBound.value
  const n = divisions.value
  const dx = (b - a) / n
  const func = currentFunc.value
  let sum = 0
  for (let i = 0; i < n; i++) {
    const x = a + i * dx
    const y = func.f(x)
    if (Number.isFinite(y)) {
      sum += y * dx
    }
  }
  return sum
})

// 误差
const error = computed(() => {
  return Math.abs(exactIntegral.value - riemannSum.value)
})

// 说明文字
const explanationText = computed(() => {
  const type = props.config?.type || 'definite-integral'
  const func = currentFunc.value
  const a = lowerBound.value.toFixed(1)
  const b = upperBound.value.toFixed(1)

  switch (type) {
    case 'antiderivative':
      return `<strong>原函数：</strong>函数 ${func.name} 的原函数（不定积分）为 F(x)。F'(x) = f(x)，即<span class="highlight">求导后得到原来的函数</span>。`

    case 'ftc':
      return `<strong>牛顿-莱布尼茨公式：</strong>∫ₐᵇ f(x)dx = F(b) - F(a)。定积分等于原函数在上下限的差值。<br>
        F(${b}) - F(${a}) = <span class="highlight">${exactIntegral.value.toFixed(6)}</span>`

    case 'integral-applications':
      return `<strong>定积分的应用：</strong>函数 ${func.name} 在区间 [${a}, ${b}] 上的定积分表示曲线下方的<span class="highlight">有向面积</span>，值为 ${exactIntegral.value.toFixed(6)}。`

    default:
      return `<strong>定积分的几何意义：</strong>函数 ${func.name} 在区间 [${a}, ${b}] 上的定积分表示曲线与 x 轴围成的<span class="highlight">有向面积</span>。n = ${divisions.value} 时，黎曼和误差约为 ${error.value.toExponential(2)}。`
  }
})

// 生成曲线数据
const generateCurveData = () => {
  const func = currentFunc.value
  const points: [number, number][] = []
  for (let x = -5; x <= 5; x += 0.05) {
    const y = func.f(x)
    if (Number.isFinite(y) && Math.abs(y) < 100) {
      points.push([x, y])
    }
  }
  return points
}

// 生成原函数曲线数据
const generateAntiderivativeData = () => {
  const func = currentFunc.value
  const points: [number, number][] = []
  for (let x = -5; x <= 5; x += 0.05) {
    const y = func.F(x)
    if (Number.isFinite(y) && Math.abs(y) < 100) {
      points.push([x, y])
    }
  }
  return points
}

// 生成填充区域数据
const generateAreaData = () => {
  const a = lowerBound.value
  const b = upperBound.value
  const func = currentFunc.value
  const points: [number, number][] = []

  points.push([a, 0])
  for (let x = a; x <= b; x += 0.02) {
    const y = func.f(x)
    if (Number.isFinite(y)) {
      points.push([x, y])
    }
  }
  points.push([b, func.f(b)])
  points.push([b, 0])

  return points
}

const handleFuncChange = () => {
  if (chart) {
    chart.dispose()
    chart = null
  }
  initChart()
}

const updateChart = () => {
  if (!chart) return

  const a = lowerBound.value
  const b = upperBound.value
  const n = divisions.value
  const dx = (b - a) / n
  const func = currentFunc.value

  // 生成黎曼矩形的graphic元素
  const riemannGraphics: any[] = []
  if (showRiemann.value) {
    for (let i = 0; i < n; i++) {
      const x = a + i * dx
      const h = func.f(x)
      if (Number.isFinite(h)) {
        riemannGraphics.push({
          type: 'rect',
          shape: {
            x: chart.convertToPixel('grid', [x, 0])[0],
            y: chart.convertToPixel('grid', [0, Math.max(0, h)])[1],
            width: chart.convertToPixel('grid', [dx, 0])[0] - chart.convertToPixel('grid', [0, 0])[0],
            height: Math.abs(chart.convertToPixel('grid', [0, 0])[1] - chart.convertToPixel('grid', [0, h])[1])
          },
          style: {
            fill: h >= 0 ? 'rgba(103, 194, 58, 0.3)' : 'rgba(245, 108, 108, 0.3)',
            stroke: h >= 0 ? '#67C23A' : '#F56C6C',
            lineWidth: 1
          }
        })
      }
    }
  }

  const series: any[] = [
    {
      id: 'area',
      type: 'line',
      name: '积分区域',
      data: generateAreaData(),
      areaStyle: {
        color: 'rgba(64, 158, 255, 0.3)'
      },
      lineStyle: { width: 0 },
      symbol: 'none'
    },
    {
      id: 'curve',
      type: 'line',
      name: '被积函数 f(x)',
      data: generateCurveData(),
      smooth: true,
      symbol: 'none',
      lineStyle: { color: '#409EFF', width: 2 },
      z: 10
    }
  ]

  // 显示原函数
  if (showFTC.value) {
    series.push({
      id: 'antiderivative',
      type: 'line',
      name: '原函数 F(x)',
      data: generateAntiderivativeData(),
      smooth: true,
      symbol: 'none',
      lineStyle: { color: '#E6A23C', width: 2, type: 'dashed' },
      z: 5
    })
  }

  // 添加零线
  series.push({
    id: 'zeroLine',
    type: 'line',
    data: [[-5, 0], [5, 0]],
    symbol: 'none',
    lineStyle: { color: '#909399', width: 1 }
  })

  chart.setOption({
    graphic: riemannGraphics,
    series
  })
}

const initChart = () => {
  if (!chartContainer.value) return

  chart = echarts.init(chartContainer.value)
  chart.setOption({
    grid: { left: 50, right: 30, top: 40, bottom: 60 },
    xAxis: {
      type: 'value',
      min: -1,
      max: 5,
      axisLine: { lineStyle: { color: '#999' } },
      splitLine: { lineStyle: { color: '#eee' } },
      name: 'x'
    },
    yAxis: {
      type: 'value',
      min: -2,
      max: 10,
      axisLine: { lineStyle: { color: '#999' } },
      splitLine: { lineStyle: { color: '#eee' } },
      name: 'y'
    },
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: showFTC.value
        ? ['被积函数 f(x)', '原函数 F(x)', '积分区域']
        : ['被积函数 f(x)', '积分区域'],
      bottom: 5
    },
    series: []
  })

  updateChart()
}

// 监听配置变化
watch(() => props.config, () => {
  if (props.config?.expression && functions[props.config.expression]) {
    selectedFunc.value = props.config.expression
  }
  handleFuncChange()
}, { deep: true })

// 保存 resize 处理函数的引用，以便正确移除
const handleResize = () => {
  chart?.resize()
  updateChart()
}

onMounted(async () => {
  if (props.config?.expression && functions[props.config.expression]) {
    selectedFunc.value = props.config.expression
  }
  // 等待 DOM 渲染完成，确保 chartContainer ref 已准备好
  await nextTick()
  initChart()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chart?.dispose()
})
</script>

<style lang="scss" scoped>
.integral-animation {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chart-container {
  flex: 1;
  min-height: 300px;
}

.control-panel {
  padding: 16px;
  background-color: var(--card-bg);
  border-radius: 8px;
  margin-top: 16px;

  .control-row {
    display: flex;
    align-items: center;
    gap: 24px;
    margin-bottom: 12px;
    flex-wrap: wrap;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .control-group {
    display: flex;
    gap: 16px;
  }

  .control-item {
    display: flex;
    align-items: center;
    gap: 8px;

    label {
      font-weight: 500;
      white-space: nowrap;
    }

    .el-slider {
      width: 150px;
    }

    .el-select {
      width: 160px;
    }

    .value-display {
      width: 40px;
      font-family: monospace;
    }
  }

  .toggle-group {
    display: flex;
    align-items: center;
    gap: 8px;

    label {
      font-size: 14px;
    }
  }
}

.result-display {
  display: flex;
  gap: 24px;
  padding: 16px;
  background-color: var(--card-bg);
  border-radius: 8px;
  margin-top: 12px;
  flex-wrap: wrap;

  .result-item {
    .label {
      color: var(--text-color-secondary);
      margin-right: 8px;
    }

    .value {
      font-family: monospace;
      font-weight: 500;

      &.primary {
        color: var(--primary-color);
        font-size: 16px;
      }

      &.error {
        color: var(--warning-color);
      }
    }
  }
}

.explanation {
  padding: 16px;
  background-color: var(--primary-color-light);
  border-radius: 8px;
  margin-top: 12px;

  p {
    margin: 0;
    line-height: 1.8;
  }

  :deep(.highlight) {
    color: var(--primary-color);
    font-weight: 600;
  }
}
</style>
