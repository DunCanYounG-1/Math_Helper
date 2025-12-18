<template>
  <div class="concavity-visualization">
    <div ref="chartContainer" class="chart-container"></div>

    <!-- 控制面板 -->
    <div class="control-panel">
      <div class="control-row">
        <div class="control-item">
          <label>函数选择:</label>
          <el-select v-model="selectedFunc" @change="handleFuncChange" size="small">
            <el-option v-for="(func, key) in functions" :key="key" :value="key" :label="func.name" />
          </el-select>
        </div>

        <div class="control-item">
          <el-checkbox v-model="showSecondDerivative">显示二阶导函数</el-checkbox>
        </div>

        <div class="control-item">
          <el-checkbox v-model="showTangent">显示切线</el-checkbox>
        </div>
      </div>

      <div class="control-row">
        <div class="control-item">
          <label>探索点 x:</label>
          <el-slider
            v-model="pointX"
            :min="xRange[0]"
            :max="xRange[1]"
            :step="0.05"
            @input="updateChart"
          />
          <span class="value-display">{{ pointX.toFixed(2) }}</span>
        </div>
      </div>

      <!-- 当前点信息 -->
      <div class="point-info">
        <div class="info-item">
          <span class="label">f({{ pointX.toFixed(2) }}) =</span>
          <span class="value">{{ pointY.toFixed(4) }}</span>
        </div>
        <div class="info-item">
          <span class="label">f'({{ pointX.toFixed(2) }}) =</span>
          <span class="value">{{ firstDerivative.toFixed(4) }}</span>
        </div>
        <div class="info-item">
          <span class="label">f''({{ pointX.toFixed(2) }}) =</span>
          <span class="value" :class="secondDerivativeClass">{{ secondDerivative.toFixed(4) }}</span>
        </div>
        <div class="info-item">
          <span class="label">凹凸性:</span>
          <span class="value" :class="concavityClass">{{ concavityText }}</span>
        </div>
      </div>
    </div>

    <!-- 凹凸区间分析 -->
    <div class="interval-analysis">
      <h4>凹凸区间分析</h4>
      <div class="intervals-list">
        <div v-for="interval in concavityIntervals" :key="interval.start + '-' + interval.end"
             class="interval-item" :class="interval.type">
          <span class="interval-icon">{{ interval.type === 'concave-up' ? '∪' : '∩' }}</span>
          <span class="interval-range">
            [{{ formatNumber(interval.start) }}, {{ formatNumber(interval.end) }}]
          </span>
          <span class="interval-type">
            {{ interval.type === 'concave-up' ? '凹（下凸）' : '凸（上凸）' }}
          </span>
          <span class="interval-condition">
            {{ interval.type === 'concave-up' ? 'f\'\'(x) > 0' : 'f\'\'(x) < 0' }}
          </span>
        </div>
      </div>

      <!-- 拐点 -->
      <div class="inflection-list" v-if="inflectionPoints.length > 0">
        <h5>拐点</h5>
        <div v-for="point in inflectionPoints" :key="point.x" class="inflection-item">
          <span class="inflection-icon">◆</span>
          <span>x = {{ formatNumber(point.x) }}</span>
          <span class="inflection-value">f({{ formatNumber(point.x) }}) = {{ formatNumber(point.y) }}</span>
          <span class="inflection-desc">凹凸性在此改变</span>
        </div>
      </div>
    </div>

    <!-- 图形理解 -->
    <div class="visual-explanation">
      <div class="explanation-item concave-up">
        <div class="shape-demo">∪</div>
        <div class="shape-text">
          <strong>凹（下凸）</strong>
          <p>f''(x) > 0，切线在曲线下方，像碗能盛水</p>
        </div>
      </div>
      <div class="explanation-item concave-down">
        <div class="shape-demo">∩</div>
        <div class="shape-text">
          <strong>凸（上凸）</strong>
          <p>f''(x) < 0，切线在曲线上方，像拱桥</p>
        </div>
      </div>
      <div class="explanation-item inflection">
        <div class="shape-demo">◆</div>
        <div class="shape-text">
          <strong>拐点</strong>
          <p>f''(x) = 0 且凹凸性改变的点</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'

const chartContainer = ref<HTMLElement | null>(null)
let chart: echarts.ECharts | null = null

const pointX = ref(0)
const pointY = ref(0)
const firstDerivative = ref(0)
const secondDerivative = ref(0)
const selectedFunc = ref('x^3')
const showSecondDerivative = ref(true)
const showTangent = ref(true)

// 预定义函数库
const functions: Record<string, {
  f: (x: number) => number
  fPrime: (x: number) => number
  fDoublePrime: (x: number) => number
  name: string
  xRange: [number, number]
  yRange: [number, number]
  inflectionPoints: number[] // 拐点
}> = {
  'x^3': {
    f: (x) => x * x * x,
    fPrime: (x) => 3 * x * x,
    fDoublePrime: (x) => 6 * x,
    name: 'f(x) = x³',
    xRange: [-3, 3],
    yRange: [-10, 10],
    inflectionPoints: [0]
  },
  'x^3-3x': {
    f: (x) => x * x * x - 3 * x,
    fPrime: (x) => 3 * x * x - 3,
    fDoublePrime: (x) => 6 * x,
    name: 'f(x) = x³ - 3x',
    xRange: [-3, 3],
    yRange: [-5, 5],
    inflectionPoints: [0]
  },
  'x^4-6x^2': {
    f: (x) => x**4 - 6*x*x,
    fPrime: (x) => 4*x**3 - 12*x,
    fDoublePrime: (x) => 12*x*x - 12,
    name: 'f(x) = x⁴ - 6x²',
    xRange: [-3, 3],
    yRange: [-12, 10],
    inflectionPoints: [-1, 1]
  },
  'sin': {
    f: (x) => Math.sin(x),
    fPrime: (x) => Math.cos(x),
    fDoublePrime: (x) => -Math.sin(x),
    name: 'f(x) = sin(x)',
    xRange: [-2 * Math.PI, 2 * Math.PI],
    yRange: [-1.5, 1.5],
    inflectionPoints: [-Math.PI, 0, Math.PI]
  },
  'e^(-x^2)': {
    f: (x) => Math.exp(-x * x),
    fPrime: (x) => -2 * x * Math.exp(-x * x),
    fDoublePrime: (x) => (4 * x * x - 2) * Math.exp(-x * x),
    name: 'f(x) = e^(-x²) [高斯函数]',
    xRange: [-3, 3],
    yRange: [-0.2, 1.2],
    inflectionPoints: [-Math.sqrt(0.5), Math.sqrt(0.5)]
  },
  '1/(1+x^2)': {
    f: (x) => 1 / (1 + x * x),
    fPrime: (x) => -2 * x / Math.pow(1 + x * x, 2),
    fDoublePrime: (x) => (6 * x * x - 2) / Math.pow(1 + x * x, 3),
    name: 'f(x) = 1/(1+x²) [柯西分布]',
    xRange: [-4, 4],
    yRange: [-0.2, 1.2],
    inflectionPoints: [-Math.sqrt(1/3), Math.sqrt(1/3)]
  },
  'x*ln(x)': {
    f: (x) => x > 0 ? x * Math.log(x) : NaN,
    fPrime: (x) => x > 0 ? Math.log(x) + 1 : NaN,
    fDoublePrime: (x) => x > 0 ? 1 / x : NaN,
    name: 'f(x) = x·ln(x)',
    xRange: [0.1, 4],
    yRange: [-1, 6],
    inflectionPoints: []
  },
  'x^2*e^(-x)': {
    f: (x) => x * x * Math.exp(-x),
    fPrime: (x) => x * (2 - x) * Math.exp(-x),
    fDoublePrime: (x) => (x * x - 4 * x + 2) * Math.exp(-x),
    name: 'f(x) = x²e^(-x)',
    xRange: [-0.5, 6],
    yRange: [-0.2, 0.6],
    inflectionPoints: [2 - Math.sqrt(2), 2 + Math.sqrt(2)]
  }
}

// 计算属性
const currentFunc = computed(() => functions[selectedFunc.value])
const xRange = computed(() => currentFunc.value.xRange)

const secondDerivativeClass = computed(() => {
  if (Math.abs(secondDerivative.value) < 0.01) return 'zero'
  return secondDerivative.value > 0 ? 'positive' : 'negative'
})

const concavityText = computed(() => {
  if (Math.abs(secondDerivative.value) < 0.01) return '可能是拐点'
  return secondDerivative.value > 0 ? '凹（下凸）∪' : '凸（上凸）∩'
})

const concavityClass = computed(() => {
  if (Math.abs(secondDerivative.value) < 0.01) return 'inflection'
  return secondDerivative.value > 0 ? 'concave-up' : 'concave-down'
})

// 计算凹凸区间
const concavityIntervals = computed(() => {
  const func = currentFunc.value
  const intervals: Array<{
    start: number
    end: number
    type: 'concave-up' | 'concave-down'
  }> = []

  const sortedInflectionPoints = [...func.inflectionPoints]
    .filter(p => p >= func.xRange[0] && p <= func.xRange[1])
    .sort((a, b) => a - b)
  const allPoints = [func.xRange[0], ...sortedInflectionPoints, func.xRange[1]]

  for (let i = 0; i < allPoints.length - 1; i++) {
    const start = allPoints[i]
    const end = allPoints[i + 1]
    const mid = (start + end) / 2
    const secondDerivAtMid = func.fDoublePrime(mid)

    if (Number.isFinite(secondDerivAtMid)) {
      const type = secondDerivAtMid > 0 ? 'concave-up' : 'concave-down'
      intervals.push({ start, end, type })
    }
  }

  return intervals
})

// 计算拐点
const inflectionPoints = computed(() => {
  const func = currentFunc.value
  return func.inflectionPoints
    .filter(x => x >= func.xRange[0] && x <= func.xRange[1])
    .map(x => ({
      x,
      y: func.f(x)
    }))
})

const formatNumber = (n: number) => {
  if (Math.abs(n - Math.PI) < 0.01) return 'π'
  if (Math.abs(n + Math.PI) < 0.01) return '-π'
  if (Math.abs(n - Math.sqrt(0.5)) < 0.01) return '√(1/2)'
  if (Math.abs(n + Math.sqrt(0.5)) < 0.01) return '-√(1/2)'
  return n.toFixed(2)
}

// 生成主曲线数据
const generateCurveData = () => {
  const func = currentFunc.value
  const points: [number, number][] = []
  const step = (func.xRange[1] - func.xRange[0]) / 300

  for (let x = func.xRange[0]; x <= func.xRange[1]; x += step) {
    const y = func.f(x)
    if (Number.isFinite(y) && Math.abs(y) < 1000) {
      points.push([x, y])
    }
  }
  return points
}

// 生成二阶导函数曲线数据
const generateSecondDerivativeCurveData = () => {
  const func = currentFunc.value
  const points: [number, number][] = []
  const step = (func.xRange[1] - func.xRange[0]) / 300

  for (let x = func.xRange[0]; x <= func.xRange[1]; x += step) {
    const y = func.fDoublePrime(x)
    if (Number.isFinite(y) && Math.abs(y) < 100) {
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

  if (!Number.isFinite(k) || !Number.isFinite(y0)) return []

  const points: [number, number][] = []
  const range = 1.5
  for (let x = x0 - range; x <= x0 + range; x += 0.1) {
    const y = k * (x - x0) + y0
    points.push([x, y])
  }
  return points
}

// 生成凹凸区间的区域数据
const generateIntervalAreaData = () => {
  const areas: any[] = []
  const func = currentFunc.value

  for (const interval of concavityIntervals.value) {
    const color = interval.type === 'concave-up'
      ? 'rgba(64, 158, 255, 0.12)'
      : 'rgba(230, 162, 60, 0.12)'

    areas.push({
      type: 'rect',
      shape: {
        x: interval.start,
        y: func.yRange[0],
        width: interval.end - interval.start,
        height: func.yRange[1] - func.yRange[0]
      },
      style: {
        fill: color
      },
      z: -1
    })
  }

  return areas
}

const handleFuncChange = () => {
  const func = currentFunc.value
  const midPoint = (func.xRange[0] + func.xRange[1]) / 2
  pointX.value = Math.max(func.xRange[0], Math.min(func.xRange[1], midPoint))
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
  firstDerivative.value = func.fPrime(pointX.value)
  secondDerivative.value = func.fDoublePrime(pointX.value)

  const series: any[] = [
    {
      id: 'curve',
      type: 'line',
      name: '原函数 f(x)',
      data: generateCurveData(),
      smooth: true,
      symbol: 'none',
      lineStyle: { color: '#409EFF', width: 2.5 },
      z: 3
    },
    {
      id: 'point',
      type: 'scatter',
      name: '当前点',
      data: [[pointX.value, pointY.value]],
      symbolSize: 14,
      itemStyle: { color: '#67C23A', borderColor: '#fff', borderWidth: 2 },
      z: 10
    },
    // x轴零线
    {
      id: 'xAxis',
      type: 'line',
      data: [[xRange.value[0], 0], [xRange.value[1], 0]],
      symbol: 'none',
      lineStyle: { color: '#909399', width: 1 },
      z: 1
    }
  ]

  // 显示切线
  if (showTangent.value) {
    const tangentData = generateTangentData()
    if (tangentData.length > 0) {
      series.push({
        id: 'tangent',
        type: 'line',
        name: '切线',
        data: tangentData,
        symbol: 'none',
        lineStyle: { color: '#F56C6C', width: 2, type: 'solid' },
        z: 4
      })
    }
  }

  // 显示二阶导函数
  if (showSecondDerivative.value) {
    series.push({
      id: 'secondDerivativeCurve',
      type: 'line',
      name: '二阶导函数 f\'\'(x)',
      data: generateSecondDerivativeCurveData(),
      smooth: true,
      symbol: 'none',
      lineStyle: { color: '#E6A23C', width: 2, type: 'dashed' },
      z: 2
    })
  }

  // 标记拐点
  const inflectionData = inflectionPoints.value.map(p => [p.x, p.y])
  if (inflectionData.length > 0) {
    series.push({
      id: 'inflection',
      type: 'scatter',
      name: '拐点',
      data: inflectionData,
      symbolSize: 16,
      symbol: 'diamond',
      itemStyle: { color: '#9B59B6', borderColor: '#fff', borderWidth: 2 },
      z: 8
    })
  }

  // 更新图表
  const func2 = currentFunc.value
  chart.setOption({
    xAxis: {
      min: func2.xRange[0],
      max: func2.xRange[1]
    },
    yAxis: {
      min: func2.yRange[0],
      max: func2.yRange[1]
    },
    series,
    graphic: generateIntervalAreaData().map((area, index) => ({
      ...area,
      id: `area-${index}`
    }))
  })
}

const initChart = () => {
  if (!chartContainer.value) return

  const func = currentFunc.value
  pointY.value = func.f(pointX.value)
  firstDerivative.value = func.fPrime(pointX.value)
  secondDerivative.value = func.fDoublePrime(pointX.value)

  chart = echarts.init(chartContainer.value)
  chart.setOption({
    grid: { left: 60, right: 30, top: 40, bottom: 70 },
    xAxis: {
      type: 'value',
      min: func.xRange[0],
      max: func.xRange[1],
      axisLine: { lineStyle: { color: '#666' } },
      splitLine: { lineStyle: { color: '#eee' } },
      name: 'x'
    },
    yAxis: {
      type: 'value',
      min: func.yRange[0],
      max: func.yRange[1],
      axisLine: { lineStyle: { color: '#666' } },
      splitLine: { lineStyle: { color: '#eee' } },
      name: 'y'
    },
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        if (!params || params.length === 0) return ''
        const x = params[0].value[0]
        let result = `x = ${x.toFixed(2)}<br/>`
        params.forEach((p: any) => {
          if (p.value && p.value[1] !== undefined) {
            result += `${p.seriesName}: ${p.value[1].toFixed(4)}<br/>`
          }
        })
        return result
      }
    },
    legend: {
      data: showSecondDerivative.value
        ? ['原函数 f(x)', '二阶导函数 f\'\'(x)', '切线', '拐点', '当前点']
        : ['原函数 f(x)', '切线', '拐点', '当前点'],
      bottom: 5,
      textStyle: { fontSize: 12 }
    },
    series: []
  })

  updateChart()
}

// 监听选项变化
watch([showSecondDerivative, showTangent], () => {
  updateChart()
})

const handleResize = () => chart?.resize()

onMounted(async () => {
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
.concavity-visualization {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 16px;
}

.chart-container {
  flex: 1;
  min-height: 350px;
  background: linear-gradient(135deg, #fafbfc 0%, #f5f7fa 100%);
  border-radius: 12px;
}

.control-panel {
  padding: 16px;
  background-color: var(--card-bg);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

  .control-row {
    display: flex;
    align-items: center;
    gap: 24px;
    margin-bottom: 16px;
    flex-wrap: wrap;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .control-item {
    display: flex;
    align-items: center;
    gap: 12px;

    label {
      font-weight: 500;
      white-space: nowrap;
      color: var(--text-color);
    }

    .el-slider {
      width: 200px;
    }

    .el-select {
      width: 220px;
    }

    .value-display {
      width: 60px;
      text-align: right;
      font-family: 'SF Mono', Monaco, monospace;
      font-weight: 500;
      color: var(--primary-color);
    }
  }

  .point-info {
    display: flex;
    gap: 24px;
    flex-wrap: wrap;
    padding-top: 16px;
    border-top: 1px solid var(--border-color);

    .info-item {
      .label {
        color: var(--text-color-secondary);
        margin-right: 8px;
        font-size: 14px;
      }

      .value {
        font-family: 'SF Mono', Monaco, monospace;
        font-weight: 600;
        font-size: 15px;

        &.positive { color: #409EFF; }
        &.negative { color: #E6A23C; }
        &.zero { color: #9B59B6; }
        &.concave-up { color: #409EFF; }
        &.concave-down { color: #E6A23C; }
        &.inflection { color: #9B59B6; }
      }
    }
  }
}

.interval-analysis {
  padding: 16px;
  background-color: var(--card-bg);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

  h4 {
    margin: 0 0 12px 0;
    font-size: 15px;
    font-weight: 600;
    color: var(--text-color);
  }

  h5 {
    margin: 16px 0 8px 0;
    font-size: 14px;
    font-weight: 600;
    color: var(--text-color-secondary);
  }

  .intervals-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .interval-item {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 10px 14px;
    border-radius: 8px;
    font-size: 14px;

    &.concave-up {
      background-color: rgba(64, 158, 255, 0.1);
      border-left: 3px solid #409EFF;
    }

    &.concave-down {
      background-color: rgba(230, 162, 60, 0.1);
      border-left: 3px solid #E6A23C;
    }

    .interval-icon {
      font-size: 18px;
      font-weight: bold;
    }

    .interval-range {
      font-family: 'SF Mono', Monaco, monospace;
      font-weight: 500;
      min-width: 120px;
    }

    .interval-type {
      font-weight: 600;
    }

    .interval-condition {
      color: var(--text-color-secondary);
      font-family: 'SF Mono', Monaco, monospace;
      font-size: 13px;
    }
  }

  .inflection-list {
    margin-top: 12px;
  }

  .inflection-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 14px;
    margin-bottom: 6px;
    background-color: rgba(155, 89, 182, 0.1);

    .inflection-icon {
      color: #9B59B6;
      font-size: 14px;
    }

    .inflection-value {
      font-family: 'SF Mono', Monaco, monospace;
    }

    .inflection-desc {
      color: var(--text-color-secondary);
      margin-left: auto;
      font-size: 13px;
    }
  }
}

.visual-explanation {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;

  .explanation-item {
    flex: 1;
    min-width: 180px;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    border-radius: 12px;

    &.concave-up {
      background: linear-gradient(135deg, rgba(64, 158, 255, 0.15) 0%, rgba(64, 158, 255, 0.05) 100%);
      .shape-demo { color: #409EFF; }
    }

    &.concave-down {
      background: linear-gradient(135deg, rgba(230, 162, 60, 0.15) 0%, rgba(230, 162, 60, 0.05) 100%);
      .shape-demo { color: #E6A23C; }
    }

    &.inflection {
      background: linear-gradient(135deg, rgba(155, 89, 182, 0.15) 0%, rgba(155, 89, 182, 0.05) 100%);
      .shape-demo { color: #9B59B6; }
    }

    .shape-demo {
      font-size: 32px;
      font-weight: bold;
    }

    .shape-text {
      strong {
        display: block;
        font-size: 14px;
        margin-bottom: 4px;
        color: var(--text-color);
      }

      p {
        margin: 0;
        font-size: 12px;
        color: var(--text-color-secondary);
        line-height: 1.5;
      }
    }
  }
}

@media (max-width: 768px) {
  .control-panel {
    .control-row {
      flex-direction: column;
      align-items: flex-start;
    }

    .control-item {
      width: 100%;

      .el-slider, .el-select {
        flex: 1;
      }
    }

    .point-info {
      flex-direction: column;
      gap: 12px;
    }
  }

  .interval-item {
    flex-wrap: wrap;
  }

  .visual-explanation {
    flex-direction: column;

    .explanation-item {
      min-width: auto;
    }
  }
}
</style>
