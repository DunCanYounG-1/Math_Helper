<template>
  <div class="monotonicity-visualization">
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
          <el-checkbox v-model="showDerivative">显示导函数</el-checkbox>
        </div>

        <div class="control-item">
          <el-checkbox v-model="showIntervals">显示单调区间</el-checkbox>
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
          <span class="value" :class="derivativeClass">{{ derivative.toFixed(4) }}</span>
        </div>
        <div class="info-item">
          <span class="label">单调性:</span>
          <span class="value" :class="monotonicityClass">{{ monotonicityText }}</span>
        </div>
      </div>
    </div>

    <!-- 单调区间分析 -->
    <div class="interval-analysis" v-if="showIntervals">
      <h4>单调区间分析</h4>
      <div class="intervals-list">
        <div v-for="interval in monotonicIntervals" :key="interval.start + '-' + interval.end"
             class="interval-item" :class="interval.type">
          <span class="interval-range">
            [{{ formatNumber(interval.start) }}, {{ formatNumber(interval.end) }}]
          </span>
          <span class="interval-type">
            {{ interval.type === 'increasing' ? '↗ 单调递增' : '↘ 单调递减' }}
          </span>
          <span class="interval-desc" v-if="interval.description">
            {{ interval.description }}
          </span>
        </div>
      </div>

      <!-- 极值点 -->
      <div class="extrema-list" v-if="extremaPoints.length > 0">
        <h5>极值点</h5>
        <div v-for="point in extremaPoints" :key="point.x" class="extrema-item" :class="point.type">
          <span class="extrema-icon">{{ point.type === 'max' ? '▲' : '▼' }}</span>
          <span>x = {{ formatNumber(point.x) }}</span>
          <span class="extrema-value">
            {{ point.type === 'max' ? '极大值' : '极小值' }} = {{ formatNumber(point.y) }}
          </span>
        </div>
      </div>
    </div>

    <!-- 说明 -->
    <div class="explanation">
      <p>
        <strong>单调性判断规则：</strong>
        <br>• 当 f'(x) > 0 时，函数<span class="increasing">单调递增</span>（曲线上升）
        <br>• 当 f'(x) < 0 时，函数<span class="decreasing">单调递减</span>（曲线下降）
        <br>• 当 f'(x) = 0 时，可能是<span class="extrema">极值点</span>或<span class="inflection">拐点</span>
      </p>
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
const derivative = ref(0)
const selectedFunc = ref('x^3-3x')
const showDerivative = ref(true)
const showIntervals = ref(true)

// 预定义函数库
const functions: Record<string, {
  f: (x: number) => number
  fPrime: (x: number) => number
  name: string
  xRange: [number, number]
  yRange: [number, number]
  criticalPoints: number[] // 临界点（f'=0的点）
}> = {
  'x^3-3x': {
    f: (x) => x * x * x - 3 * x,
    fPrime: (x) => 3 * x * x - 3,
    name: 'f(x) = x³ - 3x',
    xRange: [-3, 3],
    yRange: [-5, 5],
    criticalPoints: [-1, 1]
  },
  'x^2': {
    f: (x) => x * x,
    fPrime: (x) => 2 * x,
    name: 'f(x) = x²',
    xRange: [-4, 4],
    yRange: [-1, 10],
    criticalPoints: [0]
  },
  'x^4-2x^2': {
    f: (x) => x**4 - 2*x*x,
    fPrime: (x) => 4*x**3 - 4*x,
    name: 'f(x) = x⁴ - 2x²',
    xRange: [-2.5, 2.5],
    yRange: [-2, 4],
    criticalPoints: [-1, 0, 1]
  },
  'sin': {
    f: (x) => Math.sin(x),
    fPrime: (x) => Math.cos(x),
    name: 'f(x) = sin(x)',
    xRange: [-2 * Math.PI, 2 * Math.PI],
    yRange: [-1.5, 1.5],
    criticalPoints: [-Math.PI * 1.5, -Math.PI * 0.5, Math.PI * 0.5, Math.PI * 1.5]
  },
  'x/(1+x^2)': {
    f: (x) => x / (1 + x * x),
    fPrime: (x) => (1 - x * x) / Math.pow(1 + x * x, 2),
    name: 'f(x) = x/(1+x²)',
    xRange: [-5, 5],
    yRange: [-1, 1],
    criticalPoints: [-1, 1]
  },
  'e^(-x^2)': {
    f: (x) => Math.exp(-x * x),
    fPrime: (x) => -2 * x * Math.exp(-x * x),
    name: 'f(x) = e^(-x²) [正态分布形状]',
    xRange: [-3, 3],
    yRange: [-0.2, 1.2],
    criticalPoints: [0]
  },
  'x*e^(-x)': {
    f: (x) => x * Math.exp(-x),
    fPrime: (x) => (1 - x) * Math.exp(-x),
    name: 'f(x) = xe^(-x)',
    xRange: [-1, 5],
    yRange: [-0.5, 0.5],
    criticalPoints: [1]
  },
  'ln(1+x^2)': {
    f: (x) => Math.log(1 + x * x),
    fPrime: (x) => 2 * x / (1 + x * x),
    name: 'f(x) = ln(1+x²)',
    xRange: [-4, 4],
    yRange: [-0.5, 3],
    criticalPoints: [0]
  }
}

// 计算属性
const currentFunc = computed(() => functions[selectedFunc.value])
const xRange = computed(() => currentFunc.value.xRange)

const derivativeClass = computed(() => {
  if (Math.abs(derivative.value) < 0.01) return 'zero'
  return derivative.value > 0 ? 'positive' : 'negative'
})

const monotonicityText = computed(() => {
  if (Math.abs(derivative.value) < 0.01) return '可能是极值点'
  return derivative.value > 0 ? '递增' : '递减'
})

const monotonicityClass = computed(() => {
  if (Math.abs(derivative.value) < 0.01) return 'extrema'
  return derivative.value > 0 ? 'increasing' : 'decreasing'
})

// 计算单调区间
const monotonicIntervals = computed(() => {
  const func = currentFunc.value
  const intervals: Array<{
    start: number
    end: number
    type: 'increasing' | 'decreasing'
    description?: string
  }> = []

  const sortedCriticalPoints = [...func.criticalPoints].sort((a, b) => a - b)
  const allPoints = [func.xRange[0], ...sortedCriticalPoints, func.xRange[1]]

  for (let i = 0; i < allPoints.length - 1; i++) {
    const start = allPoints[i]
    const end = allPoints[i + 1]
    const mid = (start + end) / 2
    const derivativeAtMid = func.fPrime(mid)
    const type = derivativeAtMid > 0 ? 'increasing' : 'decreasing'

    intervals.push({
      start,
      end,
      type,
      description: type === 'increasing'
        ? `f'(x) > 0，曲线上升`
        : `f'(x) < 0，曲线下降`
    })
  }

  return intervals
})

// 计算极值点
const extremaPoints = computed(() => {
  const func = currentFunc.value
  const points: Array<{
    x: number
    y: number
    type: 'max' | 'min'
  }> = []

  for (const cp of func.criticalPoints) {
    if (cp < func.xRange[0] || cp > func.xRange[1]) continue

    const y = func.f(cp)
    // 判断是极大还是极小（通过比较临近点）
    const delta = 0.1
    const leftY = func.f(cp - delta)
    const rightY = func.f(cp + delta)

    if (y > leftY && y > rightY) {
      points.push({ x: cp, y, type: 'max' })
    } else if (y < leftY && y < rightY) {
      points.push({ x: cp, y, type: 'min' })
    }
  }

  return points
})

const formatNumber = (n: number) => {
  if (Math.abs(n - Math.PI) < 0.01) return 'π'
  if (Math.abs(n + Math.PI) < 0.01) return '-π'
  if (Math.abs(n - Math.PI / 2) < 0.01) return 'π/2'
  if (Math.abs(n + Math.PI / 2) < 0.01) return '-π/2'
  if (Math.abs(n - Math.PI * 1.5) < 0.01) return '3π/2'
  if (Math.abs(n + Math.PI * 1.5) < 0.01) return '-3π/2'
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

// 生成导函数曲线数据
const generateDerivativeCurveData = () => {
  const func = currentFunc.value
  const points: [number, number][] = []
  const step = (func.xRange[1] - func.xRange[0]) / 300

  for (let x = func.xRange[0]; x <= func.xRange[1]; x += step) {
    const y = func.fPrime(x)
    if (Number.isFinite(y) && Math.abs(y) < 100) {
      points.push([x, y])
    }
  }
  return points
}

// 生成单调区间的区域数据
const generateIntervalAreaData = () => {
  const areas: any[] = []
  const func = currentFunc.value

  for (const interval of monotonicIntervals.value) {
    const color = interval.type === 'increasing'
      ? 'rgba(103, 194, 58, 0.15)'
      : 'rgba(245, 108, 108, 0.15)'

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
  pointX.value = Math.max(func.xRange[0], Math.min(func.xRange[1], 0))
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

  // 显示导函数
  if (showDerivative.value) {
    series.push({
      id: 'derivativeCurve',
      type: 'line',
      name: '导函数 f\'(x)',
      data: generateDerivativeCurveData(),
      smooth: true,
      symbol: 'none',
      lineStyle: { color: '#E6A23C', width: 2, type: 'dashed' },
      z: 2
    })
  }

  // 标记极值点
  const extremaData = extremaPoints.value.map(p => ({
    value: [p.x, p.y],
    symbol: p.type === 'max' ? 'triangle' : 'triangle',
    symbolRotate: p.type === 'max' ? 0 : 180,
    itemStyle: { color: p.type === 'max' ? '#F56C6C' : '#67C23A' }
  }))
  if (extremaData.length > 0) {
    series.push({
      id: 'extrema',
      type: 'scatter',
      name: '极值点',
      data: extremaData,
      symbolSize: 16,
      z: 8
    })
  }

  // 标记临界点在x轴上的位置
  const criticalMarkers = currentFunc.value.criticalPoints
    .filter(cp => cp >= xRange.value[0] && cp <= xRange.value[1])
    .map(cp => [cp, 0])
  if (criticalMarkers.length > 0) {
    series.push({
      id: 'criticalPoints',
      type: 'scatter',
      name: '临界点',
      data: criticalMarkers,
      symbolSize: 10,
      itemStyle: { color: '#909399', borderColor: '#fff', borderWidth: 2 },
      z: 5
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
    graphic: showIntervals.value ? generateIntervalAreaData().map((area, index) => ({
      ...area,
      id: `area-${index}`
    })) : []
  })
}

const initChart = () => {
  if (!chartContainer.value) return

  const func = currentFunc.value
  pointY.value = func.f(pointX.value)
  derivative.value = func.fPrime(pointX.value)

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
          result += `${p.seriesName}: ${p.value[1]?.toFixed(4) ?? 'N/A'}<br/>`
        })
        return result
      }
    },
    legend: {
      data: showDerivative.value
        ? ['原函数 f(x)', '导函数 f\'(x)', '极值点', '当前点']
        : ['原函数 f(x)', '极值点', '当前点'],
      bottom: 5,
      textStyle: { fontSize: 12 }
    },
    series: []
  })

  updateChart()
}

// 监听选项变化
watch([showDerivative, showIntervals], () => {
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
.monotonicity-visualization {
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
      width: 200px;
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
    gap: 32px;
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

        &.positive { color: #67C23A; }
        &.negative { color: #F56C6C; }
        &.zero { color: #E6A23C; }
        &.increasing { color: #67C23A; }
        &.decreasing { color: #F56C6C; }
        &.extrema { color: #E6A23C; }
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

    &.increasing {
      background-color: rgba(103, 194, 58, 0.1);
      border-left: 3px solid #67C23A;
    }

    &.decreasing {
      background-color: rgba(245, 108, 108, 0.1);
      border-left: 3px solid #F56C6C;
    }

    .interval-range {
      font-family: 'SF Mono', Monaco, monospace;
      font-weight: 500;
      min-width: 120px;
    }

    .interval-type {
      font-weight: 600;
    }

    .interval-desc {
      color: var(--text-color-secondary);
      font-size: 13px;
    }
  }

  .extrema-list {
    margin-top: 12px;
  }

  .extrema-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 14px;
    margin-bottom: 6px;

    &.max {
      background-color: rgba(245, 108, 108, 0.1);
      .extrema-icon { color: #F56C6C; }
    }

    &.min {
      background-color: rgba(103, 194, 58, 0.1);
      .extrema-icon { color: #67C23A; }
    }

    .extrema-icon {
      font-size: 12px;
    }

    .extrema-value {
      color: var(--text-color-secondary);
      margin-left: auto;
    }
  }
}

.explanation {
  padding: 16px;
  background: linear-gradient(135deg, #ecf5ff 0%, #f0f9eb 100%);
  border-radius: 12px;

  p {
    margin: 0;
    line-height: 2;
    font-size: 14px;
    color: var(--text-color);
  }

  .increasing {
    color: #67C23A;
    font-weight: 600;
  }

  .decreasing {
    color: #F56C6C;
    font-weight: 600;
  }

  .extrema {
    color: #E6A23C;
    font-weight: 600;
  }

  .inflection {
    color: #409EFF;
    font-weight: 600;
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
}
</style>
