<template>
  <div class="derivative-animation">
    <div ref="chartContainer" class="chart-container"></div>

    <!-- 控制面板 -->
    <div class="control-panel">
      <div class="control-row">
        <div class="control-item" v-if="showFunctionSelect">
          <label>函数选择:</label>
          <el-select v-model="selectedFunc" @change="handleFuncChange" size="small">
            <el-option v-for="(func, key) in availableFunctions" :key="key" :value="key" :label="func.name" />
          </el-select>
        </div>

        <div class="control-item">
          <label>x 位置:</label>
          <el-slider
            v-model="pointX"
            :min="xRange[0]"
            :max="xRange[1]"
            :step="0.1"
            @input="updateChart"
          />
          <span class="value-display">{{ pointX.toFixed(2) }}</span>
        </div>
      </div>

      <div class="info-display">
        <div class="info-item">
          <span class="label">f(x) =</span>
          <span class="value">{{ pointY.toFixed(4) }}</span>
        </div>
        <div class="info-item">
          <span class="label">f'(x) =</span>
          <span class="value highlight">{{ derivative.toFixed(4) }}</span>
        </div>
        <div class="info-item" v-if="showSecondDerivative">
          <span class="label">f''(x) =</span>
          <span class="value secondary">{{ secondDerivative.toFixed(4) }}</span>
        </div>
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

interface DerivativeConfig {
  type?: 'derivative-definition' | 'chain-rule' | 'higher-derivatives' | 'implicit-derivative' | 'differential' | 'rolle-theorem' | 'monotonicity' | 'extrema' | 'concavity' | 'asymptote' | 'function-plot' | 'function-properties'
  expression?: string
  showSecondDerivative?: boolean
  showFunctionSelect?: boolean
  title?: string
}

interface Props {
  config?: DerivativeConfig
}

const props = withDefaults(defineProps<Props>(), {
  config: () => ({
    type: 'derivative-definition',
    expression: 'x^2',
    showSecondDerivative: false,
    showFunctionSelect: true
  })
})

const chartContainer = ref<HTMLElement | null>(null)
let chart: echarts.ECharts | null = null

const pointX = ref(1)
const pointY = ref(1)
const derivative = ref(2)
const secondDerivative = ref(2)
const selectedFunc = ref('x^2')

// 预定义函数库
const functions: Record<string, {
  f: (x: number) => number
  fPrime: (x: number) => number
  fDoublePrime?: (x: number) => number
  name: string
  latex: string
  xRange: [number, number]
  yRange: [number, number]
}> = {
  'x^2': {
    f: (x) => x * x,
    fPrime: (x) => 2 * x,
    fDoublePrime: () => 2,
    name: 'f(x) = x²',
    latex: 'x^2',
    xRange: [-4, 4],
    yRange: [-2, 16]
  },
  'x^3': {
    f: (x) => x * x * x,
    fPrime: (x) => 3 * x * x,
    fDoublePrime: (x) => 6 * x,
    name: 'f(x) = x³',
    latex: 'x^3',
    xRange: [-3, 3],
    yRange: [-10, 10]
  },
  'x^3-3x': {
    f: (x) => x * x * x - 3 * x,
    fPrime: (x) => 3 * x * x - 3,
    fDoublePrime: (x) => 6 * x,
    name: 'f(x) = x³ - 3x',
    latex: 'x^3-3x',
    xRange: [-3, 3],
    yRange: [-5, 5]
  },
  'sin': {
    f: (x) => Math.sin(x),
    fPrime: (x) => Math.cos(x),
    fDoublePrime: (x) => -Math.sin(x),
    name: 'f(x) = sin(x)',
    latex: '\\sin(x)',
    xRange: [-Math.PI * 2, Math.PI * 2],
    yRange: [-2, 2]
  },
  'cos': {
    f: (x) => Math.cos(x),
    fPrime: (x) => -Math.sin(x),
    fDoublePrime: (x) => -Math.cos(x),
    name: 'f(x) = cos(x)',
    latex: '\\cos(x)',
    xRange: [-Math.PI * 2, Math.PI * 2],
    yRange: [-2, 2]
  },
  'e^x': {
    f: (x) => Math.exp(x),
    fPrime: (x) => Math.exp(x),
    fDoublePrime: (x) => Math.exp(x),
    name: 'f(x) = eˣ',
    latex: 'e^x',
    xRange: [-3, 3],
    yRange: [-1, 10]
  },
  'ln': {
    f: (x) => x > 0 ? Math.log(x) : NaN,
    fPrime: (x) => x > 0 ? 1 / x : NaN,
    fDoublePrime: (x) => x > 0 ? -1 / (x * x) : NaN,
    name: 'f(x) = ln(x)',
    latex: '\\ln(x)',
    xRange: [0.1, 5],
    yRange: [-3, 3]
  },
  '1/x': {
    f: (x) => x !== 0 ? 1 / x : NaN,
    fPrime: (x) => x !== 0 ? -1 / (x * x) : NaN,
    fDoublePrime: (x) => x !== 0 ? 2 / (x * x * x) : NaN,
    name: 'f(x) = 1/x',
    latex: '\\frac{1}{x}',
    xRange: [-4, 4],
    yRange: [-5, 5]
  },
  'sqrt': {
    f: (x) => x >= 0 ? Math.sqrt(x) : NaN,
    fPrime: (x) => x > 0 ? 0.5 / Math.sqrt(x) : NaN,
    fDoublePrime: (x) => x > 0 ? -0.25 / Math.pow(x, 1.5) : NaN,
    name: 'f(x) = √x',
    latex: '\\sqrt{x}',
    xRange: [0, 5],
    yRange: [-1, 3]
  },
  'sin(x^2)': {
    f: (x) => Math.sin(x * x),
    fPrime: (x) => 2 * x * Math.cos(x * x),
    fDoublePrime: (x) => 2 * Math.cos(x * x) - 4 * x * x * Math.sin(x * x),
    name: 'f(x) = sin(x²) [链式法则]',
    latex: '\\sin(x^2)',
    xRange: [-3, 3],
    yRange: [-2, 2]
  },
  'e^(x^2)': {
    f: (x) => Math.exp(x * x),
    fPrime: (x) => 2 * x * Math.exp(x * x),
    name: 'f(x) = e^(x²) [链式法则]',
    latex: 'e^{x^2}',
    xRange: [-2, 2],
    yRange: [-1, 10]
  }
}

// 根据配置类型选择可用函数
const availableFunctions = computed(() => {
  const type = props.config?.type || 'derivative-definition'
  if (type === 'chain-rule') {
    return {
      'sin(x^2)': functions['sin(x^2)'],
      'e^(x^2)': functions['e^(x^2)'],
      'sqrt': functions['sqrt']
    }
  }
  if (type === 'extrema' || type === 'monotonicity') {
    return {
      'x^3-3x': functions['x^3-3x'],
      'x^2': functions['x^2'],
      'sin': functions['sin']
    }
  }
  return functions
})

// 获取当前函数
const currentFunc = computed(() => {
  const expr = props.config?.expression || selectedFunc.value
  return functions[expr] || functions[selectedFunc.value] || functions['x^2']
})

// 计算属性
const xRange = computed(() => currentFunc.value.xRange)
const showSecondDerivative = computed(() =>
  props.config?.showSecondDerivative ||
  props.config?.type === 'higher-derivatives' ||
  props.config?.type === 'concavity'
)
const showFunctionSelect = computed(() => props.config?.showFunctionSelect !== false)

// 说明文字
const explanationText = computed(() => {
  const type = props.config?.type || 'derivative-definition'
  const func = currentFunc.value
  const x = pointX.value.toFixed(2)
  const y = pointY.value.toFixed(4)
  const d = derivative.value.toFixed(4)
  const d2 = secondDerivative.value.toFixed(4)

  switch (type) {
    case 'derivative-definition':
      return `<strong>导数的几何意义：</strong>函数 ${func.name} 在点 x = ${x} 处的导数为 <span class="highlight">${d}</span>，这个值正好是该点切线的斜率。`

    case 'chain-rule':
      return `<strong>链式法则：</strong>复合函数 ${func.name} 的导数等于外层函数的导数乘以内层函数的导数。在 x = ${x} 处，f'(x) = <span class="highlight">${d}</span>`

    case 'higher-derivatives':
      return `<strong>高阶导数：</strong>一阶导数 f'(${x}) = ${d}，二阶导数 f''(${x}) = <span class="secondary">${d2}</span>。二阶导数描述的是变化率的变化率。`

    case 'monotonicity':
      const mono = derivative.value > 0 ? '单调递增' : (derivative.value < 0 ? '单调递减' : '取得极值')
      return `<strong>单调性判定：</strong>在 x = ${x} 处，f'(x) = ${d} ${derivative.value > 0 ? '> 0' : (derivative.value < 0 ? '< 0' : '= 0')}，函数在此处<span class="highlight">${mono}</span>。`

    case 'extrema':
      const isExtreme = Math.abs(derivative.value) < 0.01
      return `<strong>极值点：</strong>在 x = ${x} 处，f'(x) = ${d}。${isExtreme ? '<span class="highlight">f\'(x) ≈ 0，可能是极值点！</span>' : '不是极值点（f\'(x) ≠ 0）'}`

    case 'concavity':
      const concave = secondDerivative.value > 0 ? '凹（开口向上）' : (secondDerivative.value < 0 ? '凸（开口向下）' : '拐点')
      return `<strong>凹凸性：</strong>在 x = ${x} 处，f''(x) = ${d2}，图像为<span class="highlight">${concave}</span>。`

    case 'differential':
      return `<strong>微分：</strong>dy = f'(x)dx。在 x = ${x} 处，dy = ${d}·dx。微分是函数增量的线性近似。`

    case 'rolle-theorem':
      return `<strong>罗尔定理：</strong>在满足条件的区间内，必存在点 ξ 使得 f'(ξ) = 0。拖动滑块找到导数为 0 的点。当前 f'(${x}) = ${d}`

    default:
      return `函数 ${func.name} 在 x = ${x} 处的值为 ${y}，导数为 <span class="highlight">${d}</span>。`
  }
})

// 生成主曲线数据
const generateCurveData = () => {
  const func = currentFunc.value
  const points: [number, number][] = []
  const step = (func.xRange[1] - func.xRange[0]) / 200

  for (let x = func.xRange[0]; x <= func.xRange[1]; x += step) {
    const y = func.f(x)
    if (Number.isFinite(y) && Math.abs(y) < 1000) {
      points.push([x, y])
    }
  }
  return points
}

// 生成切线数据
const generateTangentData = () => {
  const x0 = pointX.value
  const y0 = currentFunc.value.f(x0)
  const k = currentFunc.value.fPrime(x0)

  if (!Number.isFinite(k)) return []

  const points: [number, number][] = []
  const range = 1.5
  for (let x = x0 - range; x <= x0 + range; x += 0.1) {
    const y = k * (x - x0) + y0
    points.push([x, y])
  }
  return points
}

// 生成导数函数曲线（用于高阶导数可视化）
const generateDerivativeCurveData = () => {
  const func = currentFunc.value
  const points: [number, number][] = []
  const step = (func.xRange[1] - func.xRange[0]) / 200

  for (let x = func.xRange[0]; x <= func.xRange[1]; x += step) {
    const y = func.fPrime(x)
    if (Number.isFinite(y) && Math.abs(y) < 100) {
      points.push([x, y])
    }
  }
  return points
}

const handleFuncChange = () => {
  const func = currentFunc.value
  pointX.value = Math.max(func.xRange[0], Math.min(func.xRange[1], pointX.value))
  if (chart) {
    chart.dispose()
    chart = null
  }
  initChart()
}

const updateChart = () => {
  if (!chart) return

  const func = currentFunc.value
  pointY.value = func.f(pointX.value)
  derivative.value = func.fPrime(pointX.value)
  if (func.fDoublePrime) {
    secondDerivative.value = func.fDoublePrime(pointX.value)
  }

  const series: any[] = [
    {
      id: 'curve',
      type: 'line',
      name: '原函数 f(x)',
      data: generateCurveData(),
      smooth: true,
      symbol: 'none',
      lineStyle: { color: '#409EFF', width: 2 }
    },
    {
      id: 'tangent',
      type: 'line',
      name: '切线',
      data: generateTangentData(),
      symbol: 'none',
      lineStyle: { color: '#F56C6C', width: 2, type: 'solid' }
    },
    {
      id: 'point',
      type: 'scatter',
      data: [[pointX.value, pointY.value]],
      symbolSize: 12,
      itemStyle: { color: '#67C23A' },
      z: 10
    }
  ]

  // 对于高阶导数，显示导数函数曲线
  if (showSecondDerivative.value) {
    series.push({
      id: 'derivativeCurve',
      type: 'line',
      name: '导函数 f\'(x)',
      data: generateDerivativeCurveData(),
      smooth: true,
      symbol: 'none',
      lineStyle: { color: '#E6A23C', width: 1.5, type: 'dashed' }
    })
  }

  // 对于单调性和极值，添加零线
  if (props.config?.type === 'monotonicity' || props.config?.type === 'extrema') {
    series.push({
      id: 'zeroLine',
      type: 'line',
      data: [[xRange.value[0], 0], [xRange.value[1], 0]],
      symbol: 'none',
      lineStyle: { color: '#909399', width: 1, type: 'dashed' }
    })
  }

  chart.setOption({ series })
}

const initChart = () => {
  if (!chartContainer.value) return

  const func = currentFunc.value

  chart = echarts.init(chartContainer.value)
  chart.setOption({
    grid: { left: 50, right: 30, top: 40, bottom: 60 },
    xAxis: {
      type: 'value',
      min: func.xRange[0],
      max: func.xRange[1],
      axisLine: { lineStyle: { color: '#999' } },
      splitLine: { lineStyle: { color: '#eee' } },
      name: 'x'
    },
    yAxis: {
      type: 'value',
      min: func.yRange[0],
      max: func.yRange[1],
      axisLine: { lineStyle: { color: '#999' } },
      splitLine: { lineStyle: { color: '#eee' } },
      name: 'y'
    },
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: showSecondDerivative.value
        ? ['原函数 f(x)', '导函数 f\'(x)', '切线']
        : ['原函数 f(x)', '切线'],
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

onMounted(async () => {
  if (props.config?.expression && functions[props.config.expression]) {
    selectedFunc.value = props.config.expression
  }
  // 等待 DOM 渲染完成，确保 chartContainer ref 已准备好
  await nextTick()
  initChart()
  window.addEventListener('resize', () => chart?.resize())
})

onUnmounted(() => {
  chart?.dispose()
})
</script>

<style lang="scss" scoped>
.derivative-animation {
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

    &:last-child {
      margin-bottom: 0;
    }
  }

  .control-item {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;

    label {
      font-weight: 500;
      white-space: nowrap;
    }

    .el-slider {
      flex: 1;
    }

    .el-select {
      width: 180px;
    }

    .value-display {
      width: 60px;
      text-align: right;
      font-family: monospace;
    }
  }

  .info-display {
    display: flex;
    gap: 24px;
    flex-wrap: wrap;

    .info-item {
      .label {
        color: var(--text-color-secondary);
        margin-right: 4px;
      }

      .value {
        font-family: monospace;
        font-weight: 500;

        &.highlight {
          color: var(--primary-color);
          font-size: 16px;
        }

        &.secondary {
          color: #E6A23C;
          font-size: 15px;
        }
      }
    }
  }
}

.explanation {
  padding: 16px;
  background-color: var(--primary-color-light);
  border-radius: 8px;
  margin-top: 16px;

  p {
    margin: 0;
    line-height: 1.8;
  }

  :deep(.highlight) {
    color: var(--primary-color);
    font-weight: 600;
  }

  :deep(.secondary) {
    color: #E6A23C;
    font-weight: 600;
  }
}
</style>
