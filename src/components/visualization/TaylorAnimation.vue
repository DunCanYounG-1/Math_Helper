<template>
  <div class="taylor-animation">
    <div ref="chartContainer" class="chart-container"></div>

    <!-- 控制面板 -->
    <div class="control-panel">
      <div class="control-row">
        <div class="control-item">
          <label>展开阶数 n:</label>
          <el-slider
            v-model="order"
            :min="0"
            :max="10"
            :step="1"
            :marks="orderMarks"
            show-stops
            @input="updateChart"
          />
        </div>
      </div>

      <div class="control-row">
        <div class="control-item">
          <label>函数选择:</label>
          <el-select v-model="selectedFunc" @change="updateChart">
            <el-option label="e^x" value="exp" />
            <el-option label="sin(x)" value="sin" />
            <el-option label="cos(x)" value="cos" />
            <el-option label="ln(1+x)" value="ln1px" />
            <el-option label="1/(1-x)" value="geometric" />
          </el-select>
        </div>

        <div class="control-item">
          <label>展开中心 x₀:</label>
          <el-input-number
            v-model="x0"
            :min="-2"
            :max="2"
            :step="0.5"
            :precision="1"
            @change="updateChart"
          />
        </div>

        <button
          v-if="!isAnimating"
          class="demo-btn"
          @click="animateOrder"
        >
          <span class="btn-icon"><el-icon><VideoPlay /></el-icon></span>
          <span class="btn-text">自动演示</span>
        </button>
        <button
          v-else
          class="demo-btn playing"
          @click="stopAnimation"
        >
          <span class="btn-icon"><el-icon><VideoPause /></el-icon></span>
          <span class="btn-text">停止</span>
          <span class="pulse-ring"></span>
        </button>
      </div>
    </div>

    <!-- 泰勒多项式显示 -->
    <div class="polynomial-display">
      <div class="polynomial-title">泰勒多项式 T{{ order }}(x) =</div>
      <div class="polynomial-formula" v-html="taylorFormula"></div>
    </div>

    <!-- 误差信息 -->
    <div class="error-info">
      <div class="error-item">
        <span class="label">在 x = {{ testPoint.toFixed(1) }} 处:</span>
        <span class="value">f(x) = {{ fAtTestPoint.toFixed(6) }}</span>
        <span class="value">T{{ order }}(x) = {{ taylorAtTestPoint.toFixed(6) }}</span>
        <span class="value error">误差 = {{ Math.abs(fAtTestPoint - taylorAtTestPoint).toExponential(2) }}</span>
      </div>
    </div>

    <!-- 说明 -->
    <div class="explanation">
      <p>
        <strong>泰勒展开的意义：</strong>
        用多项式逼近复杂函数。阶数 n 越大，<span class="highlight">逼近越精确</span>，
        但多项式也越复杂。注意观察：在展开点 x₀ = {{ x0 }} 附近逼近效果最好，
        远离展开点时误差增大。
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import { VideoPlay, VideoPause } from '@element-plus/icons-vue'

interface TaylorConfig {
  type?: string
  expression?: string
  showFunctionSelect?: boolean
}

interface Props {
  config?: TaylorConfig
}

const props = withDefaults(defineProps<Props>(), {
  config: () => ({})
})

const chartContainer = ref<HTMLElement | null>(null)
let chart: echarts.ECharts | null = null

const order = ref(3)
const selectedFunc = ref('sin')
const x0 = ref(0)
const testPoint = ref(1)
const isAnimating = ref(false)
let animationAborted = false

// 表达式到函数 key 的映射
const expressionToFuncKey: Record<string, string> = {
  'e^x': 'exp',
  'sin': 'sin',
  'cos': 'cos',
  'ln(1+x)': 'ln1px',
  'ln': 'ln1px',
  '1/(1-x)': 'geometric',
  '(1+x)^(1/x)': 'exp',  // 近似处理
  'exp': 'exp'
}

const orderMarks = {
  0: '0',
  2: '2',
  4: '4',
  6: '6',
  8: '8',
  10: '10'
}

// 阶乘
const factorial = (n: number): number => {
  if (n <= 1) return 1
  let result = 1
  for (let i = 2; i <= n; i++) result *= i
  return result
}

// 函数定义
interface FuncDef {
  f: (x: number) => number
  derivatives: ((x: number) => number)[]  // 在 x0 处的 n 阶导数
  name: string
  latex: string
}

const functions: Record<string, FuncDef> = {
  'exp': {
    f: (x: number) => Math.exp(x),
    derivatives: Array.from({ length: 11 }, () => (x: number) => Math.exp(x)),
    name: 'e^x',
    latex: 'e^x'
  },
  'sin': {
    f: (x: number) => Math.sin(x),
    derivatives: [
      (x) => Math.sin(x),      // f
      (x) => Math.cos(x),      // f'
      (x) => -Math.sin(x),     // f''
      (x) => -Math.cos(x),     // f'''
      (x) => Math.sin(x),      // f''''
      (x) => Math.cos(x),
      (x) => -Math.sin(x),
      (x) => -Math.cos(x),
      (x) => Math.sin(x),
      (x) => Math.cos(x),
      (x) => -Math.sin(x)
    ],
    name: 'sin(x)',
    latex: '\\sin(x)'
  },
  'cos': {
    f: (x: number) => Math.cos(x),
    derivatives: [
      (x) => Math.cos(x),
      (x) => -Math.sin(x),
      (x) => -Math.cos(x),
      (x) => Math.sin(x),
      (x) => Math.cos(x),
      (x) => -Math.sin(x),
      (x) => -Math.cos(x),
      (x) => Math.sin(x),
      (x) => Math.cos(x),
      (x) => -Math.sin(x),
      (x) => -Math.cos(x)
    ],
    name: 'cos(x)',
    latex: '\\cos(x)'
  },
  'ln1px': {
    f: (x: number) => Math.log(1 + x),
    derivatives: [
      (x) => Math.log(1 + x),
      (x) => 1 / (1 + x),
      (x) => -1 / Math.pow(1 + x, 2),
      (x) => 2 / Math.pow(1 + x, 3),
      (x) => -6 / Math.pow(1 + x, 4),
      (x) => 24 / Math.pow(1 + x, 5),
      (x) => -120 / Math.pow(1 + x, 6),
      (x) => 720 / Math.pow(1 + x, 7),
      (x) => -5040 / Math.pow(1 + x, 8),
      (x) => 40320 / Math.pow(1 + x, 9),
      (x) => -362880 / Math.pow(1 + x, 10)
    ],
    name: 'ln(1+x)',
    latex: '\\ln(1+x)'
  },
  'geometric': {
    f: (x: number) => 1 / (1 - x),
    derivatives: Array.from({ length: 11 }, (_, n) =>
      (x: number) => factorial(n) / Math.pow(1 - x, n + 1)
    ),
    name: '1/(1-x)',
    latex: '\\frac{1}{1-x}'
  }
}

const currentFunc = computed(() => functions[selectedFunc.value])

// 计算泰勒多项式在 x 处的值
const taylorValue = (x: number, n: number): number => {
  let sum = 0
  const func = currentFunc.value
  for (let k = 0; k <= n; k++) {
    const coef = func.derivatives[k](x0.value) / factorial(k)
    sum += coef * Math.pow(x - x0.value, k)
  }
  return sum
}

// 测试点的函数值和泰勒值
const fAtTestPoint = computed(() => currentFunc.value.f(testPoint.value))
const taylorAtTestPoint = computed(() => taylorValue(testPoint.value, order.value))

// 生成泰勒公式显示
const taylorFormula = computed(() => {
  const func = currentFunc.value
  const terms: string[] = []

  for (let k = 0; k <= order.value && k <= 5; k++) {
    const coef = func.derivatives[k](x0.value) / factorial(k)
    if (Math.abs(coef) < 1e-10) continue

    let term = ''
    const coefStr = Math.abs(coef) === 1 && k > 0 ? '' : Math.abs(coef).toFixed(2)

    if (k === 0) {
      term = coef.toFixed(2)
    } else if (k === 1) {
      const xPart = x0.value === 0 ? 'x' : `(x-${x0.value})`
      term = `${coefStr}${xPart}`
    } else {
      const xPart = x0.value === 0 ? `x<sup>${k}</sup>` : `(x-${x0.value})<sup>${k}</sup>`
      term = `${coefStr}${xPart}`
    }

    if (terms.length === 0) {
      terms.push(coef < 0 ? `-${term}` : term)
    } else {
      terms.push(coef < 0 ? ` - ${term}` : ` + ${term}`)
    }
  }

  if (order.value > 5) {
    terms.push(' + ...')
  }

  return terms.join('') || '0'
})

// 生成曲线数据
const generateCurveData = () => {
  const points: [number, number][] = []
  const f = currentFunc.value.f
  for (let x = -5; x <= 5; x += 0.05) {
    const y = f(x)
    if (isFinite(y) && Math.abs(y) < 20) {
      points.push([x, y])
    }
  }
  return points
}

// 生成泰勒多项式数据
const generateTaylorData = () => {
  const points: [number, number][] = []
  for (let x = -5; x <= 5; x += 0.05) {
    const y = taylorValue(x, order.value)
    if (isFinite(y) && Math.abs(y) < 20) {
      points.push([x, y])
    }
  }
  return points
}

const updateChart = () => {
  if (!chart) return

  chart.setOption({
    series: [
      {
        id: 'original',
        type: 'line',
        name: currentFunc.value.name,
        data: generateCurveData(),
        smooth: true,
        symbol: 'none',
        lineStyle: { color: '#409EFF', width: 3 },
        z: 1
      },
      {
        id: 'taylor',
        type: 'line',
        name: `T${order.value}(x)`,
        data: generateTaylorData(),
        smooth: true,
        symbol: 'none',
        lineStyle: { color: '#F56C6C', width: 2, type: 'dashed' },
        z: 2
      },
      {
        id: 'x0Point',
        type: 'scatter',
        data: [[x0.value, currentFunc.value.f(x0.value)]],
        symbolSize: 10,
        itemStyle: { color: '#67C23A' },
        z: 10
      },
      {
        id: 'testPoint',
        type: 'scatter',
        data: [[testPoint.value, fAtTestPoint.value]],
        symbolSize: 8,
        itemStyle: { color: '#E6A23C' },
        z: 10
      }
    ]
  })
}

// 停止动画
const stopAnimation = () => {
  animationAborted = true
  isAnimating.value = false
}

// 自动演示动画
const animateOrder = async () => {
  animationAborted = false
  isAnimating.value = true
  order.value = 0
  updateChart()

  for (let i = 1; i <= 10; i++) {
    await new Promise(resolve => setTimeout(resolve, 500))
    // 检查是否被中止
    if (animationAborted) {
      return
    }
    order.value = i
    updateChart()
  }

  isAnimating.value = false
}

const initChart = () => {
  if (!chartContainer.value) return

  chart = echarts.init(chartContainer.value)
  chart.setOption({
    grid: { left: 50, right: 30, top: 40, bottom: 60 },
    xAxis: {
      type: 'value',
      min: -5,
      max: 5,
      axisLine: { lineStyle: { color: '#999' } },
      splitLine: { lineStyle: { color: '#eee' } },
      name: 'x'
    },
    yAxis: {
      type: 'value',
      min: -5,
      max: 5,
      axisLine: { lineStyle: { color: '#999' } },
      splitLine: { lineStyle: { color: '#eee' } },
      name: 'y'
    },
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: [currentFunc.value.name, `T${order.value}(x)`],
      bottom: 5
    },
    series: []
  })

  updateChart()
}

// 是否已完成首次初始化
let isInitialized = false

// 根据 config 设置初始函数
const setFunctionFromConfig = () => {
  if (props.config?.expression) {
    const funcKey = expressionToFuncKey[props.config.expression]
    if (funcKey && functions[funcKey]) {
      selectedFunc.value = funcKey
    }
  }
}

// 监听 config 变化
watch(() => props.config, () => {
  if (!isInitialized) return
  stopAnimation()
  setFunctionFromConfig()
  if (chart) {
    chart.dispose()
    chart = null
  }
  initChart()
}, { deep: true })

// 保存 resize 处理函数的引用，以便正确移除
const handleResize = () => chart?.resize()

onMounted(async () => {
  setFunctionFromConfig()
  // 等待 DOM 渲染完成，确保 chartContainer ref 已准备好
  await nextTick()
  initChart()
  isInitialized = true
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  stopAnimation()
  window.removeEventListener('resize', handleResize)
  chart?.dispose()
})
</script>

<style lang="scss" scoped>
.taylor-animation {
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
    margin-bottom: 16px;

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
      min-width: 90px;
    }

    .el-slider {
      flex: 1;
    }

    .el-select {
      width: 140px;
    }
  }

  .demo-btn {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    border-radius: 24px;
    border: none;
    cursor: pointer;
    background: linear-gradient(135deg, #409EFF 0%, #337ecc 100%);
    color: white;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.4);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    overflow: visible;

    .btn-icon {
      display: flex;
      align-items: center;
      font-size: 16px;
    }

    .btn-text {
      white-space: nowrap;
    }

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(64, 158, 255, 0.5);
      background: linear-gradient(135deg, #66b1ff 0%, #409EFF 100%);
    }

    &:active {
      transform: translateY(0);
    }

    &.playing {
      background: linear-gradient(135deg, #F56C6C 0%, #c45656 100%);
      box-shadow: 0 4px 12px rgba(245, 108, 108, 0.4);

      &:hover {
        box-shadow: 0 6px 16px rgba(245, 108, 108, 0.5);
        background: linear-gradient(135deg, #f89898 0%, #F56C6C 100%);
      }

      .pulse-ring {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        border-radius: 24px;
        border: 2px solid #F56C6C;
        animation: pulse-btn 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        pointer-events: none;
      }
    }
  }
}

@keyframes pulse-btn {
  0% {
    transform: scale(1);
    opacity: 0.8;
  }
  50% {
    transform: scale(1.1);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 0;
  }
}

.polynomial-display {
  padding: 12px 16px;
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.1), rgba(245, 108, 108, 0.1));
  border-radius: 8px;
  margin-top: 16px;
  border-left: 4px solid var(--primary-color);

  .polynomial-title {
    font-weight: 600;
    color: var(--text-color);
    margin-bottom: 8px;
  }

  .polynomial-formula {
    font-family: "Times New Roman", serif;
    font-size: 16px;
    color: var(--text-color);
    overflow-x: auto;
    white-space: nowrap;
  }
}

.error-info {
  padding: 12px 16px;
  background-color: var(--bg-color);
  border-radius: 8px;
  margin-top: 12px;

  .error-item {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
    align-items: center;

    .label {
      font-weight: 500;
      color: var(--text-color);
    }

    .value {
      font-family: monospace;
      color: var(--text-color-secondary);

      &.error {
        color: #F56C6C;
        font-weight: 600;
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

  .highlight {
    color: var(--primary-color);
    font-weight: 600;
  }
}
</style>
