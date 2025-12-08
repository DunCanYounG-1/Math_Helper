<template>
  <div class="interactive-function-plot">
    <div class="plot-header">
      <h4>
        <el-icon><DataLine /></el-icon>
        交互式函数图像
      </h4>
      <el-select v-model="selectedFunction" size="small" class="function-select">
        <el-option
          v-for="(func, key) in availableFunctions"
          :key="key"
          :value="key"
          :label="func.name"
        />
      </el-select>
    </div>

    <!-- 函数表达式显示 -->
    <div class="function-expression">
      <span class="label">当前函数：</span>
      <span class="expression" v-html="renderFormula(currentExpression, true)"></span>
    </div>

    <!-- 图表区域 -->
    <div ref="chartContainer" class="chart-container"></div>

    <!-- 参数调节区域 -->
    <div class="parameters-panel">
      <div
        v-for="param in currentParams"
        :key="param.name"
        class="param-item"
      >
        <div class="param-header">
          <span class="param-name">{{ param.label }}</span>
          <span class="param-value">= {{ param.value.toFixed(2) }}</span>
        </div>
        <el-slider
          v-model="param.value"
          :min="param.min"
          :max="param.max"
          :step="param.step"
          :show-tooltip="false"
          @input="updateChart"
        />
        <div class="param-range">
          <span>{{ param.min }}</span>
          <span>{{ param.max }}</span>
        </div>
      </div>
    </div>

    <!-- 说明文字 -->
    <div class="plot-description">
      <el-icon><InfoFilled /></el-icon>
      <span>{{ currentDescription }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { DataLine, InfoFilled } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { renderFormula } from '@/utils/latex'

interface FunctionParam {
  name: string
  label: string
  value: number
  min: number
  max: number
  step: number
}

interface FunctionDef {
  name: string
  expression: (params: Record<string, number>) => string
  evaluate: (x: number, params: Record<string, number>) => number
  params: FunctionParam[]
  description: string
  xRange?: [number, number]
  yRange?: [number, number]
}

interface PlotConfig {
  type?: string
  expression?: string
  showFunctionSelect?: boolean
}

interface Props {
  config?: PlotConfig
}

const props = withDefaults(defineProps<Props>(), {
  config: () => ({})
})

const chartContainer = ref<HTMLElement | null>(null)
let chart: echarts.ECharts | null = null

const selectedFunction = ref('quadratic')

// 表达式到函数 key 的映射
const expressionToFuncKey: Record<string, string> = {
  'x^2': 'quadratic',
  'sin': 'sine',
  'cos': 'cosine',
  'e^x': 'exponential',
  'ln': 'logarithm',
  'sqrt': 'squareRoot',
  '1/x': 'reciprocal',
  'tan': 'tangent'
}

// 可用函数定义
const availableFunctions: Record<string, FunctionDef> = {
  quadratic: {
    name: '二次函数 y = ax² + bx + c',
    expression: (p) => `y = ${p.a.toFixed(1)}x^2 ${p.b >= 0 ? '+' : ''} ${p.b.toFixed(1)}x ${p.c >= 0 ? '+' : ''} ${p.c.toFixed(1)}`,
    evaluate: (x, p) => p.a * x * x + p.b * x + p.c,
    params: [
      { name: 'a', label: 'a (开口方向与大小)', value: 1, min: -3, max: 3, step: 0.1 },
      { name: 'b', label: 'b (对称轴位置)', value: 0, min: -5, max: 5, step: 0.1 },
      { name: 'c', label: 'c (纵截距)', value: 0, min: -5, max: 5, step: 0.1 }
    ],
    description: '调整 a 改变开口方向和大小，b 影响对称轴位置，c 是 y 轴截距。顶点坐标为 (-b/2a, c-b²/4a)',
    xRange: [-20, 20],
    yRange: [-20, 20]
  },
  sine: {
    name: '正弦函数 y = A·sin(ωx + φ)',
    expression: (p) => `y = ${p.A.toFixed(1)} \\sin(${p.omega.toFixed(1)}x ${p.phi >= 0 ? '+' : ''} ${p.phi.toFixed(2)})`,
    evaluate: (x, p) => p.A * Math.sin(p.omega * x + p.phi),
    params: [
      { name: 'A', label: 'A (振幅)', value: 1, min: 0.5, max: 3, step: 0.1 },
      { name: 'omega', label: 'ω (角频率)', value: 1, min: 0.5, max: 4, step: 0.1 },
      { name: 'phi', label: 'φ (初相位)', value: 0, min: -Math.PI, max: Math.PI, step: 0.1 }
    ],
    description: 'A 控制振幅（波的高度），ω 控制角频率（周期 T = 2π/ω），φ 控制初相位（左右平移）',
    xRange: [-2 * Math.PI, 2 * Math.PI],
    yRange: [-4, 4]
  },
  exponential: {
    name: '指数函数 y = a·bˣ + c',
    expression: (p) => `y = ${p.a.toFixed(1)} \\cdot ${p.b.toFixed(1)}^x ${p.c >= 0 ? '+' : ''} ${p.c.toFixed(1)}`,
    evaluate: (x, p) => p.a * Math.pow(p.b, x) + p.c,
    params: [
      { name: 'a', label: 'a (系数)', value: 1, min: -3, max: 3, step: 0.1 },
      { name: 'b', label: 'b (底数)', value: 2, min: 0.2, max: 4, step: 0.1 },
      { name: 'c', label: 'c (垂直平移)', value: 0, min: -5, max: 5, step: 0.1 }
    ],
    description: '当 b > 1 时指数增长，0 < b < 1 时指数衰减。a 控制增长速度，c 控制水平渐近线位置',
    xRange: [-20, 20],
    yRange: [-20, 20]
  },
  logarithm: {
    name: '对数函数 y = a·log_b(x) + c',
    expression: (p) => `y = ${p.a.toFixed(1)} \\cdot \\log_{${p.b.toFixed(1)}}(x) ${p.c >= 0 ? '+' : ''} ${p.c.toFixed(1)}`,
    evaluate: (x, p) => x > 0 ? p.a * (Math.log(x) / Math.log(p.b)) + p.c : NaN,
    params: [
      { name: 'a', label: 'a (系数)', value: 1, min: -3, max: 3, step: 0.1 },
      { name: 'b', label: 'b (底数)', value: Math.E, min: 1.1, max: 10, step: 0.1 },
      { name: 'c', label: 'c (垂直平移)', value: 0, min: -5, max: 5, step: 0.1 }
    ],
    description: '对数函数是指数函数的反函数。底数 b > 1 时单调递增，定义域为 x > 0',
    xRange: [0.01, 20],
    yRange: [-20, 20]
  },
  power: {
    name: '幂函数 y = xⁿ',
    expression: (p) => `y = x^{${p.n.toFixed(1)}}`,
    evaluate: (x, p) => {
      if (x < 0 && p.n !== Math.floor(p.n)) return NaN
      return Math.pow(x, p.n)
    },
    params: [
      { name: 'n', label: 'n (幂次)', value: 2, min: -3, max: 5, step: 0.5 }
    ],
    description: 'n > 0 时过原点，n < 0 时有垂直渐近线。n 为偶数时关于 y 轴对称，n 为奇数时关于原点对称',
    xRange: [-20, 20],
    yRange: [-20, 20]
  },
  tangent: {
    name: '正切函数 y = A·tan(ωx)',
    expression: (p) => `y = ${p.A.toFixed(1)} \\tan(${p.omega.toFixed(1)}x)`,
    evaluate: (x, p) => {
      const val = Math.tan(p.omega * x)
      return Math.abs(val) > 100 ? NaN : p.A * val
    },
    params: [
      { name: 'A', label: 'A (系数)', value: 1, min: 0.5, max: 3, step: 0.1 },
      { name: 'omega', label: 'ω (角频率)', value: 1, min: 0.5, max: 3, step: 0.1 }
    ],
    description: '正切函数周期为 π/ω，在 x = (2k+1)π/(2ω) 处有垂直渐近线',
    xRange: [-2 * Math.PI, 2 * Math.PI],
    yRange: [-6, 6]
  },
  cosine: {
    name: '余弦函数 y = A·cos(ωx + φ)',
    expression: (p) => `y = ${p.A.toFixed(1)} \\cos(${p.omega.toFixed(1)}x ${p.phi >= 0 ? '+' : ''} ${p.phi.toFixed(2)})`,
    evaluate: (x, p) => p.A * Math.cos(p.omega * x + p.phi),
    params: [
      { name: 'A', label: 'A (振幅)', value: 1, min: 0.5, max: 3, step: 0.1 },
      { name: 'omega', label: 'ω (角频率)', value: 1, min: 0.5, max: 4, step: 0.1 },
      { name: 'phi', label: 'φ (初相位)', value: 0, min: -Math.PI, max: Math.PI, step: 0.1 }
    ],
    description: 'cos(x) = sin(x + π/2)，余弦函数是正弦函数的水平平移',
    xRange: [-2 * Math.PI, 2 * Math.PI],
    yRange: [-4, 4]
  },
  squareRoot: {
    name: '根号函数 y = a·√(x + b) + c',
    expression: (p) => `y = ${p.a.toFixed(1)} \\sqrt{x ${p.b >= 0 ? '+' : ''} ${p.b.toFixed(1)}} ${p.c >= 0 ? '+' : ''} ${p.c.toFixed(1)}`,
    evaluate: (x, p) => x + p.b >= 0 ? p.a * Math.sqrt(x + p.b) + p.c : NaN,
    params: [
      { name: 'a', label: 'a (系数)', value: 1, min: -3, max: 3, step: 0.1 },
      { name: 'b', label: 'b (水平平移)', value: 0, min: -5, max: 5, step: 0.1 },
      { name: 'c', label: 'c (垂直平移)', value: 0, min: -5, max: 5, step: 0.1 }
    ],
    description: '根号函数定义域为 x ≥ -b，a > 0 时单调递增，a < 0 时单调递减',
    xRange: [-20, 20],
    yRange: [-20, 20]
  },
  reciprocal: {
    name: '反比例函数 y = a/x + c',
    expression: (p) => `y = \\frac{${p.a.toFixed(1)}}{x} ${p.c >= 0 ? '+' : ''} ${p.c.toFixed(1)}`,
    evaluate: (x, p) => x !== 0 ? p.a / x + p.c : NaN,
    params: [
      { name: 'a', label: 'a (系数)', value: 1, min: -5, max: 5, step: 0.1 },
      { name: 'c', label: 'c (垂直平移)', value: 0, min: -5, max: 5, step: 0.1 }
    ],
    description: '反比例函数在 x = 0 处有垂直渐近线，y = c 是水平渐近线',
    xRange: [-20, 20],
    yRange: [-20, 20]
  }
}

// 当前参数（响应式）
const currentParams = ref<FunctionParam[]>([])

// 初始化参数
const initParams = () => {
  const func = availableFunctions[selectedFunction.value]
  currentParams.value = func.params.map(p => ({ ...p }))
}

// 当前函数表达式
const currentExpression = computed(() => {
  const func = availableFunctions[selectedFunction.value]
  const paramValues: Record<string, number> = {}
  currentParams.value.forEach(p => {
    paramValues[p.name] = p.value
  })
  return func.expression(paramValues)
})

// 当前说明
const currentDescription = computed(() => {
  return availableFunctions[selectedFunction.value].description
})

// 生成函数数据
const generateFunctionData = (): [number, number][] => {
  const func = availableFunctions[selectedFunction.value]
  const paramValues: Record<string, number> = {}
  currentParams.value.forEach(p => {
    paramValues[p.name] = p.value
  })

  const [xMin, xMax] = func.xRange || [-20, 20]
  const points: [number, number][] = []
  const step = (xMax - xMin) / 500

  for (let x = xMin; x <= xMax; x += step) {
    const y = func.evaluate(x, paramValues)
    if (Number.isFinite(y)) {
      points.push([x, y])
    }
  }

  return points
}

// 更新图表
const updateChart = () => {
  if (!chart) return

  const func = availableFunctions[selectedFunction.value]
  const [yMin, yMax] = func.yRange || [-20, 20]
  const [xMin, xMax] = func.xRange || [-20, 20]

  chart.setOption({
    xAxis: { min: xMin, max: xMax },
    yAxis: { min: yMin, max: yMax },
    series: [{
      data: generateFunctionData()
    }]
  })
}

// 初始化图表
const initChart = () => {
  if (!chartContainer.value) return

  const func = availableFunctions[selectedFunction.value]
  const [yMin, yMax] = func.yRange || [-20, 20]
  const [xMin, xMax] = func.xRange || [-20, 20]

  chart = echarts.init(chartContainer.value)
  chart.setOption({
    animation: false,
    grid: { left: 60, right: 40, top: 30, bottom: 50 }, // 优化边距适配正方形
    xAxis: {
      type: 'value',
      min: xMin,
      max: xMax,
      axisLine: { lineStyle: { color: '#666' } },
      splitLine: { lineStyle: { color: '#eee' } },
      name: 'x',
      nameLocation: 'end'
    },
    yAxis: {
      type: 'value',
      min: yMin,
      max: yMax,
      axisLine: { lineStyle: { color: '#666' } },
      splitLine: { lineStyle: { color: '#eee' } },
      name: 'y',
      nameLocation: 'end'
    },
    series: [{
      type: 'line',
      data: generateFunctionData(),
      smooth: false,
      symbol: 'none',
      lineStyle: { color: '#409EFF', width: 2 }
    }],
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        if (!params || !params.length || !params[0].data) return ''
        const [x, y] = params[0].data
        return `x = ${x.toFixed(3)}<br>y = ${y.toFixed(3)}`
      }
    }
  })
}

// 是否已完成首次初始化
let isInitialized = false

// 根据 config 设置初始函数（不触发重新初始化）
const setFunctionFromConfig = () => {
  if (props.config?.expression) {
    const funcKey = expressionToFuncKey[props.config.expression]
    if (funcKey && availableFunctions[funcKey]) {
      selectedFunction.value = funcKey
    }
  }
}

// 重新初始化图表
const reinitChart = () => {
  if (chart) {
    chart.dispose()
    chart = null
  }
  initParams()
  initChart()
}

// 监听函数选择变化（仅在初始化完成后响应）
watch(selectedFunction, () => {
  if (!isInitialized) return
  reinitChart()
})

// 监听 config 变化
watch(() => props.config, () => {
  if (!isInitialized) return
  setFunctionFromConfig()
  reinitChart()
}, { deep: true })

onMounted(async () => {
  // 先设置函数，再初始化
  setFunctionFromConfig()
  initParams()
  // 等待 DOM 渲染完成，确保 chartContainer ref 已准备好
  await nextTick()
  initChart()
  isInitialized = true
  window.addEventListener('resize', () => chart?.resize())
})

onUnmounted(() => {
  chart?.dispose()
})
</script>

<style lang="scss" scoped>
.interactive-function-plot {
  background-color: var(--card-bg);
  border-radius: 12px;
  padding: 20px;
}

.plot-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;

  h4 {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--text-color);

    .el-icon {
      color: var(--primary-color);
    }
  }

  .function-select {
    width: 220px;
  }
}

.function-expression {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background-color: var(--bg-color);
  border-radius: 8px;
  margin-bottom: 16px;

  .label {
    font-size: 14px;
    color: var(--text-color-secondary);
    flex-shrink: 0;
  }

  .expression {
    font-size: 16px;
    color: var(--primary-color);

    :deep(.katex) {
      font-size: 1.1em;
    }
  }
}

.chart-container {
  width: 100%;
  aspect-ratio: 1 / 1; /* 纵横比 1:1 (正方形) */
  margin-bottom: 16px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
}

.parameters-panel {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  padding: 16px;
  background-color: var(--bg-color);
  border-radius: 8px;
  margin-bottom: 16px;

  .param-item {
    .param-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;

      .param-name {
        font-size: 13px;
        color: var(--text-color);
        font-weight: 500;
      }

      .param-value {
        font-size: 14px;
        color: var(--primary-color);
        font-weight: 600;
        font-family: 'Consolas', monospace;
      }
    }

    .param-range {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: var(--text-color-placeholder);
      margin-top: 4px;
    }
  }
}

.plot-description {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px 16px;
  background-color: rgba(var(--primary-color-rgb), 0.08);
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--text-color-secondary);

  .el-icon {
    color: var(--primary-color);
    flex-shrink: 0;
    margin-top: 2px;
  }
}
</style>
