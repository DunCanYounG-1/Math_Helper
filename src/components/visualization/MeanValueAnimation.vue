<template>
  <div class="mean-value-animation">
    <div ref="chartContainer" class="chart-container"></div>

    <!-- 控制面板 -->
    <div class="control-panel">
      <div class="control-row">
        <div class="control-item">
          <label>区间 [a, b]:</label>
          <el-slider
            v-model="range"
            range
            :min="-4"
            :max="4"
            :step="0.1"
            @input="findXi"
          />
          <span class="value-display">[{{ range[0].toFixed(1) }}, {{ range[1].toFixed(1) }}]</span>
        </div>
      </div>

      <div class="control-row">
        <div class="control-item">
          <label>函数选择:</label>
          <el-select v-model="selectedFunc" @change="findXi">
            <el-option label="f(x) = x²" value="x2" />
            <el-option label="f(x) = x³ - x" value="x3-x" />
            <el-option label="f(x) = sin(x)" value="sin" />
            <el-option label="f(x) = ln(x+5)" value="ln" />
          </el-select>
        </div>

        <div class="info-display">
          <div class="info-item">
            <span class="label">割线斜率 k =</span>
            <span class="value">{{ secantSlope.toFixed(4) }}</span>
          </div>
          <div class="info-item">
            <span class="label">切点 ξ =</span>
            <span class="value highlight">{{ xi.toFixed(4) }}</span>
          </div>
          <div class="info-item">
            <span class="label">f'(ξ) =</span>
            <span class="value highlight">{{ derivativeAtXi.toFixed(4) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 定理说明 -->
    <div class="theorem-box">
      <h4>拉格朗日中值定理</h4>
      <p class="theorem-statement">
        若函数 f(x) 在闭区间 [a, b] 上连续，在开区间 (a, b) 内可导，<br>
        则至少存在一点 ξ ∈ (a, b)，使得：
        <span class="formula">f'(ξ) = [f(b) - f(a)] / (b - a)</span>
      </p>
    </div>

    <!-- 几何解释 -->
    <div class="explanation">
      <p>
        <strong>几何意义：</strong>
        连接曲线两端点 A({{ range[0].toFixed(1) }}, {{ fa.toFixed(2) }})
        和 B({{ range[1].toFixed(1) }}, {{ fb.toFixed(2) }}) 的
        <span class="secant">割线</span>的斜率为 {{ secantSlope.toFixed(4) }}，
        在点 ξ = {{ xi.toFixed(4) }} 处的
        <span class="tangent">切线</span>与割线平行。
      </p>
      <p class="hint">拖动滑块改变区间，观察切点 ξ 如何随之变化。</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'

const chartContainer = ref<HTMLElement | null>(null)
let chart: echarts.ECharts | null = null

const range = ref<[number, number]>([-2, 3])
const selectedFunc = ref('x2')
const xi = ref(0.5)
const secantSlope = ref(0)
const derivativeAtXi = ref(0)

// 函数定义
const functions: Record<string, { f: (x: number) => number; fPrime: (x: number) => number; name: string }> = {
  'x2': {
    f: (x: number) => x * x,
    fPrime: (x: number) => 2 * x,
    name: 'x²'
  },
  'x3-x': {
    f: (x: number) => x * x * x - x,
    fPrime: (x: number) => 3 * x * x - 1,
    name: 'x³ - x'
  },
  'sin': {
    f: (x: number) => Math.sin(x),
    fPrime: (x: number) => Math.cos(x),
    name: 'sin(x)'
  },
  'ln': {
    f: (x: number) => Math.log(x + 5),
    fPrime: (x: number) => 1 / (x + 5),
    name: 'ln(x+5)'
  }
}

const currentFunc = computed(() => functions[selectedFunc.value])
const fa = computed(() => currentFunc.value.f(range.value[0]))
const fb = computed(() => currentFunc.value.f(range.value[1]))

// 生成曲线数据
const generateCurveData = () => {
  const points: [number, number][] = []
  const f = currentFunc.value.f
  for (let x = -5; x <= 5; x += 0.05) {
    const y = f(x)
    if (isFinite(y) && Math.abs(y) < 100) {
      points.push([x, y])
    }
  }
  return points
}

// 生成割线数据（连接端点的直线）
const generateSecantData = () => {
  const a = range.value[0]
  const b = range.value[1]
  const ya = fa.value
  const yb = fb.value
  const k = (yb - ya) / (b - a)

  const points: [number, number][] = []
  for (let x = a - 1; x <= b + 1; x += 0.1) {
    const y = k * (x - a) + ya
    points.push([x, y])
  }
  return points
}

// 生成切线数据（在 xi 处的切线）
const generateTangentData = () => {
  const x0 = xi.value
  const y0 = currentFunc.value.f(x0)
  const k = currentFunc.value.fPrime(x0)

  const points: [number, number][] = []
  for (let x = x0 - 1.5; x <= x0 + 1.5; x += 0.1) {
    const y = k * (x - x0) + y0
    points.push([x, y])
  }
  return points
}

// 用数值方法找到满足条件的 xi
const findXi = () => {
  const a = range.value[0]
  const b = range.value[1]
  const f = currentFunc.value.f
  const fPrime = currentFunc.value.fPrime

  // 割线斜率
  const targetSlope = (f(b) - f(a)) / (b - a)
  secantSlope.value = targetSlope

  // 用二分法或牛顿法找到 f'(xi) = targetSlope 的点
  // 简化：在区间内搜索
  let bestXi = (a + b) / 2
  let minDiff = Infinity

  for (let x = a + 0.001; x < b; x += 0.001) {
    const diff = Math.abs(fPrime(x) - targetSlope)
    if (diff < minDiff) {
      minDiff = diff
      bestXi = x
    }
  }

  xi.value = bestXi
  derivativeAtXi.value = fPrime(bestXi)

  updateChart()
}

const updateChart = () => {
  if (!chart) return

  const a = range.value[0]
  const b = range.value[1]
  const f = currentFunc.value.f

  chart.setOption({
    series: [
      {
        id: 'curve',
        type: 'line',
        data: generateCurveData(),
        smooth: true,
        symbol: 'none',
        lineStyle: { color: '#409EFF', width: 2 },
        z: 1
      },
      {
        id: 'secant',
        type: 'line',
        data: generateSecantData(),
        symbol: 'none',
        lineStyle: { color: '#E6A23C', width: 2, type: 'dashed' },
        z: 2
      },
      {
        id: 'tangent',
        type: 'line',
        data: generateTangentData(),
        symbol: 'none',
        lineStyle: { color: '#67C23A', width: 2 },
        z: 2
      },
      {
        id: 'endpoints',
        type: 'scatter',
        data: [
          [a, fa.value],
          [b, fb.value]
        ],
        symbolSize: 10,
        itemStyle: { color: '#E6A23C' },
        z: 10
      },
      {
        id: 'xiPoint',
        type: 'scatter',
        data: [[xi.value, f(xi.value)]],
        symbolSize: 12,
        itemStyle: { color: '#67C23A' },
        z: 10
      }
    ]
  })
}

const initChart = () => {
  if (!chartContainer.value) return

  chart = echarts.init(chartContainer.value)
  chart.setOption({
    grid: { left: 50, right: 30, top: 30, bottom: 50 },
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
      max: 10,
      axisLine: { lineStyle: { color: '#999' } },
      splitLine: { lineStyle: { color: '#eee' } },
      name: 'y'
    },
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const data = params[0]
        return `x: ${data.data[0].toFixed(2)}<br>y: ${data.data[1].toFixed(2)}`
      }
    },
    legend: {
      data: ['函数曲线', '割线 (AB)', '切线 (在ξ处)'],
      bottom: 10
    },
    series: [
      { id: 'curve', name: '函数曲线', type: 'line', data: [] },
      { id: 'secant', name: '割线 (AB)', type: 'line', data: [] },
      { id: 'tangent', name: '切线 (在ξ处)', type: 'line', data: [] },
      { id: 'endpoints', type: 'scatter', data: [] },
      { id: 'xiPoint', type: 'scatter', data: [] }
    ]
  })

  findXi()
}

watch([range, selectedFunc], findXi)

onMounted(async () => {
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
.mean-value-animation {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chart-container {
  flex: 1;
  min-height: 320px;
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
      min-width: 80px;
    }

    .el-slider {
      flex: 1;
      max-width: 300px;
    }

    .el-select {
      width: 160px;
    }

    .value-display {
      width: 80px;
      text-align: right;
      font-family: monospace;
      font-size: 13px;
    }
  }

  .info-display {
    display: flex;
    gap: 20px;
    flex-wrap: wrap;

    .info-item {
      .label {
        color: var(--text-color-secondary);
        margin-right: 4px;
        font-size: 13px;
      }

      .value {
        font-family: monospace;
        font-weight: 500;

        &.highlight {
          color: var(--success-color);
          font-size: 15px;
        }
      }
    }
  }
}

.theorem-box {
  padding: 16px;
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.1), rgba(103, 194, 58, 0.1));
  border-radius: 8px;
  margin-top: 16px;
  border-left: 4px solid var(--primary-color);

  h4 {
    margin: 0 0 8px;
    color: var(--primary-color);
    font-size: 15px;
  }

  .theorem-statement {
    margin: 0;
    line-height: 1.8;
    color: var(--text-color);
  }

  .formula {
    display: inline-block;
    padding: 4px 8px;
    background-color: var(--bg-color);
    border-radius: 4px;
    font-family: "Times New Roman", serif;
    font-style: italic;
    font-weight: 500;
    margin-top: 4px;
  }
}

.explanation {
  padding: 16px;
  background-color: var(--bg-color);
  border-radius: 8px;
  margin-top: 16px;

  p {
    margin: 0 0 8px;
    line-height: 1.8;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .secant {
    color: #E6A23C;
    font-weight: 600;
  }

  .tangent {
    color: #67C23A;
    font-weight: 600;
  }

  .hint {
    font-size: 13px;
    color: var(--text-color-secondary);
  }
}
</style>
