<template>
  <div class="limit-animation">
    <div ref="chartContainer" class="chart-container"></div>

    <!-- 动画控制器 -->
    <div class="animation-controls">
      <div class="controls-left">
        <!-- 一体化播放控制栏 -->
        <div class="unified-player">
          <button
            class="player-btn reset-btn"
            @click="reset"
            title="重置"
          >
            <el-icon><RefreshLeft /></el-icon>
          </button>
          <button
            class="player-btn step-btn"
            :class="{ disabled: currentStep <= 0 }"
            :disabled="currentStep <= 0"
            @click="stepBackward"
            title="后退一步"
          >
            <el-icon><CaretLeft /></el-icon>
          </button>
          <button
            @click="togglePlay"
            class="player-btn play-btn"
            :class="{ playing: isPlaying }"
            :title="isPlaying ? '暂停' : '播放'"
          >
            <span class="play-icon">
              <el-icon v-if="isPlaying"><VideoPause /></el-icon>
              <el-icon v-else><VideoPlay /></el-icon>
            </span>
            <span class="pulse-ring" v-if="isPlaying"></span>
          </button>
          <button
            class="player-btn step-btn"
            :class="{ disabled: currentStep >= totalSteps }"
            :disabled="currentStep >= totalSteps"
            @click="stepForward"
            title="前进一步"
          >
            <el-icon><CaretRight /></el-icon>
          </button>
          <button
            class="player-btn loop-btn"
            :class="{ active: loopEnabled }"
            @click="loopEnabled = !loopEnabled"
            title="循环播放"
          >
            <el-icon><Refresh /></el-icon>
          </button>
        </div>
      </div>

      <div class="progress-info">
        <el-slider
          v-model="currentStep"
          :max="totalSteps"
          :show-tooltip="false"
          @input="onSliderChange"
        />
        <span class="step-label">{{ Math.round(currentStep / totalSteps * 100) }}%</span>
      </div>

      <div class="controls-right">
        <el-select v-model="speed" size="small" class="speed-select" title="播放速度">
          <el-option :value="0.5" label="0.5x 慢速" />
          <el-option :value="1" label="1x 正常" />
          <el-option :value="2" label="2x 快速" />
          <el-option :value="3" label="3x 极速" />
        </el-select>

        <el-tooltip content="全屏" placement="top">
          <el-button @click="toggleFullscreen" circle size="small">
            <el-icon><FullScreen /></el-icon>
          </el-button>
        </el-tooltip>
      </div>
    </div>

    <!-- 说明文字 -->
    <div class="explanation">
      <p>
        <span v-html="currentExplanation"></span>
      </p>
      <p class="current-values">
        {{ currentValuesText }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import {
  RefreshLeft,
  CaretLeft,
  CaretRight,
  VideoPlay,
  VideoPause,
  Refresh,
  FullScreen
} from '@element-plus/icons-vue'
import * as echarts from 'echarts'

interface LimitConfig {
  type?: 'function-limit' | 'sequence-limit' | 'first-limit' | 'second-limit' | 'continuity' | 'discontinuity' | 'infinitesimal'
  expression?: string
  targetX?: number
  limitValue?: number
  funcName?: string
  title?: string
  description?: string
}

interface Props {
  config?: LimitConfig
}

const props = withDefaults(defineProps<Props>(), {
  config: () => ({
    type: 'function-limit',
    expression: 'sin(x)/x',
    targetX: 0,
    limitValue: 1,
    funcName: 'sin(x)/x'
  })
})

const chartContainer = ref<HTMLElement | null>(null)
let chart: echarts.ECharts | null = null

const isPlaying = ref(false)
const currentStep = ref(0)
const totalSteps = ref(100)
const speed = ref(1)
const loopEnabled = ref(false)

const currentX = ref(3)
const currentY = ref(0)
const currentN = ref(1)

// 用于双侧趋近的第二个点
const currentX2 = ref(-3)
const currentY2 = ref(0)
const showBothSides = ref(true)

let animationTimer: number | null = null

// 缓存曲线数据，避免每帧重新计算
let cachedCurveData: [number, number][] | null = null

// 获取当前配置
const limitType = computed(() => props.config?.type || 'function-limit')
const targetX = computed(() => props.config?.targetX ?? 0)
const limitValue = computed(() => props.config?.limitValue ?? 1)
const funcName = computed(() => props.config?.funcName || props.config?.expression || 'f(x)')

// 预定义的函数
// animRange: [leftDistance, rightDistance] 定义点从目标点向左/右的最大距离
const functions: Record<string, { f: (x: number) => number; fName: string; limit: number; target: number; description: string; animRange?: [number, number] }> = {
  'sin(x)/x': {
    f: (x: number) => Math.abs(x) < 0.0001 ? 1 : Math.sin(x) / x,
    fName: 'sin(x)/x',
    limit: 1,
    target: 0,
    description: '第一重要极限：当 x → 0 时，sin(x)/x → 1',
    animRange: [2.5, 2.5]  // 左右对称
  },
  '(1-cos(x))/x^2': {
    f: (x: number) => Math.abs(x) < 0.0001 ? 0.5 : (1 - Math.cos(x)) / (x * x),
    fName: '(1-cos(x))/x²',
    limit: 0.5,
    target: 0,
    description: '当 x → 0 时，(1-cos(x))/x² → 1/2',
    animRange: [2.5, 2.5]
  },
  'tan(x)/x': {
    f: (x: number) => Math.abs(x) < 0.0001 ? 1 : Math.tan(x) / x,
    fName: 'tan(x)/x',
    limit: 1,
    target: 0,
    description: '当 x → 0 时，tan(x)/x → 1',
    animRange: [1.2, 1.2]  // tan(x) 在 ±π/2 有渐近线，限制范围
  },
  '(e^x-1)/x': {
    f: (x: number) => Math.abs(x) < 0.0001 ? 1 : (Math.exp(x) - 1) / x,
    fName: '(eˣ-1)/x',
    limit: 1,
    target: 0,
    description: '当 x → 0 时，(eˣ-1)/x → 1',
    animRange: [2.5, 2.5]
  },
  'ln(1+x)/x': {
    f: (x: number) => Math.abs(x) < 0.0001 ? 1 : Math.log(1 + x) / x,
    fName: 'ln(1+x)/x',
    limit: 1,
    target: 0,
    description: '当 x → 0 时，ln(1+x)/x → 1',
    animRange: [0.85, 2.5]  // 左侧受限于 x > -1
  },
  '(1+1/x)^x': {
    f: (x: number) => Math.pow(1 + 1/x, x),
    fName: '(1+1/x)ˣ',
    limit: Math.E,
    target: Infinity,
    description: '第二重要极限：当 x → ∞ 时，(1+1/x)ˣ → e ≈ 2.718'
    // 这个函数有特殊处理，不需要 animRange
  },
  '(1+x)^(1/x)': {
    f: (x: number) => Math.abs(x) < 0.0001 ? Math.E : Math.pow(1 + x, 1/x),
    fName: '(1+x)^(1/x)',
    limit: Math.E,
    target: 0,
    description: '当 x → 0 时，(1+x)^(1/x) → e ≈ 2.718',
    animRange: [0.9, 2.5]  // 左侧受限于 x > -1
  },
  'x^2': {
    f: (x: number) => x * x,
    fName: 'x²',
    limit: 4,
    target: 2,
    description: '函数连续性示例：当 x → 2 时，x² → 4',
    animRange: [2.5, 2.5]
  },
  'discontinuous': {
    f: (x: number) => x < 0 ? -1 : (x > 0 ? 1 : 0),
    fName: 'sgn(x)',
    limit: NaN,
    target: 0,
    description: '跳跃间断点：左极限 = -1，右极限 = 1'
    // 这个函数有特殊处理，不需要 animRange
  },
  'removable': {
    f: (x: number) => Math.abs(x - 1) < 0.0001 ? 2 : (x * x - 1) / (x - 1),
    fName: '(x²-1)/(x-1)',
    limit: 2,
    target: 1,
    description: '可去间断点：当 x → 1 时，(x²-1)/(x-1) = x+1 → 2',
    animRange: [2.5, 2.5]
  }
}

// 获取当前使用的函数
const currentFunc = computed(() => {
  const expr = props.config?.expression || 'sin(x)/x'
  return functions[expr] || functions['sin(x)/x']
})

// 当前说明文字
const currentExplanation = computed(() => {
  const func = currentFunc.value
  if (limitType.value === 'second-limit' || props.config?.expression === '(1+1/x)^x') {
    return `当 <span class="math">x → ∞</span> 时，<span class="math">${func.fName} → ${func.limit.toFixed(4)}</span>`
  }
  if (limitType.value === 'discontinuity' || props.config?.expression === 'discontinuous') {
    return `跳跃间断点：在 x = 0 处，<span class="highlight">左极限 = -1，右极限 = 1</span>，极限不存在`
  }
  return `当 <span class="math">x → ${func.target}</span> 时，<span class="math">${func.fName} → ${func.limit.toFixed(4)}</span>`
})

// 当前值文字
const currentValuesText = computed(() => {
  if (limitType.value === 'sequence-limit') {
    return `当前: n = ${currentN.value}, aₙ = ${currentY.value.toFixed(6)}`
  }
  if (limitType.value === 'second-limit' || props.config?.expression === '(1+1/x)^x') {
    return `当前: x = ${currentX.value.toFixed(2)}, f(x) = ${currentY.value.toFixed(6)}`
  }
  if (showBothSides.value && props.config?.expression !== 'discontinuous') {
    return `右侧: x = ${currentX.value.toFixed(4)}, f(x) = ${currentY.value.toFixed(6)} | 左侧: x = ${currentX2.value.toFixed(4)}, f(x) = ${currentY2.value.toFixed(6)}`
  }
  return `当前: x = ${currentX.value.toFixed(6)}, f(x) = ${currentY.value.toFixed(6)}`
})

// 生成函数曲线数据
// 使用较小的步长生成密集的数据点，确保在关闭贝塞尔平滑后曲线仍然视觉平滑
// 接收 func 参数以确保与点位置计算使用完全相同的函数对象
const generateCurveData = (func: typeof functions[keyof typeof functions], forceRegenerate = false): [number, number][] => {
  // 使用缓存优化性能（ECharts动画已禁用，缓存不会造成同步问题）
  if (cachedCurveData && !forceRegenerate) {
    return cachedCurveData
  }

  // 使用与 currentFunc 相同的表达式逻辑，确保一致性
  const expr = props.config?.expression || 'sin(x)/x'
  // 确认 expr 在 functions 中存在，否则使用默认值
  const validExpr = functions[expr] ? expr : 'sin(x)/x'
  const points: [number, number][] = []

  if (validExpr === '(1+1/x)^x') {
    // 第二重要极限，x 从 0.5 到 100
    // 使用更密集的点以减少线性插值误差
    for (let x = 0.5; x <= 10; x += 0.02) {  // 从0.1改为0.02，更密集
      const y = func.f(x)
      if (Number.isFinite(y)) {
        points.push([x, y])
      }
    }
    for (let x = 10; x <= 100; x += 0.2) {  // 从1改为0.2，更密集
      const y = func.f(x)
      if (Number.isFinite(y)) {
        points.push([x, y])
      }
    }
  } else if (validExpr === 'discontinuous') {
    // 跳跃间断点：分两段绘制（水平线不需要密集点）
    for (let x = -4; x < -0.01; x += 0.1) {
      points.push([x, -1])
    }
    // 添加一个断点标记
    points.push([NaN, NaN])
    for (let x = 0.01; x <= 4; x += 0.1) {
      points.push([x, 1])
    }
  } else if (validExpr === 'x^2') {
    // x² 函数 - 使用高密度
    for (let x = -1; x <= 5; x += 0.005) {
      const y = func.f(x)
      if (Number.isFinite(y) && y < 15) {
        points.push([x, y])
      }
    }
  } else if (validExpr === 'removable') {
    // 可去间断点函数 - 使用高密度
    for (let x = -2; x <= 4; x += 0.005) {
      if (Math.abs(x - 1) < 0.002) continue // 跳过间断点附近
      const y = func.f(x)
      if (Number.isFinite(y) && Math.abs(y) < 10) {
        points.push([x, y])
      }
    }
  } else if (validExpr === '(1+x)^(1/x)') {
    // (1+x)^(1/x) 函数，只在 x > -1 且 x ≠ 0 时有定义 - 使用高密度
    for (let x = -0.99; x <= 3; x += 0.005) {
      if (Math.abs(x) < 0.002) continue
      const y = func.f(x)
      if (Number.isFinite(y) && y > 0 && y < 10) {
        points.push([x, y])
      }
    }
  } else if (validExpr === 'ln(1+x)/x') {
    // ln(1+x)/x 函数，x > -1 且 x ≠ 0 - 使用高密度
    for (let x = -0.9; x <= 4; x += 0.005) {
      if (Math.abs(x) < 0.002) continue
      const y = func.f(x)
      if (Number.isFinite(y) && Math.abs(y) < 10) {
        points.push([x, y])
      }
    }
  } else {
    // 默认：趋近于 0 的函数 (sin(x)/x, tan(x)/x 等)
    // 使用更密集的点(0.005步长)以确保动画点位置与曲线匹配
    for (let x = -4; x <= 4; x += 0.005) {
      if (Math.abs(x - func.target) < 0.001) continue // 减小跳过阈值
      const y = func.f(x)
      if (Number.isFinite(y) && Math.abs(y) < 10) {
        points.push([x, y])
      }
    }
  }

  // 缓存曲线数据
  cachedCurveData = points
  return points
}

// 缓动函数：使点移动呈现"趋近"效果（开始快，接近目标时慢）
const easeOutExpo = (t: number): number => {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

// 更新图表
const updateChart = () => {
  if (!chart) return

  const func = currentFunc.value
  const progress = currentStep.value / totalSteps.value
  // 使用缓动函数让点移动更符合"趋近"的数学直觉
  const easedProgress = easeOutExpo(progress)
  const target = func.target

  // 计算当前动点位置
  if (props.config?.expression === '(1+1/x)^x') {
    // 第二重要极限：x 从小到大趋近于无穷（使用指数增长）
    const startX = 1
    const endX = 100
    // 指数增长更符合趋近无穷的感觉
    currentX.value = startX * Math.pow(endX / startX, easedProgress)
    currentY.value = func.f(currentX.value)
    showBothSides.value = false
  } else if (props.config?.expression === 'discontinuous') {
    // 跳跃间断点：同时从两侧趋近
    showBothSides.value = true
    const distance = 3
    const minDistance = 0.02
    // 左侧点：从 -distance 趋近于 -minDistance
    currentX2.value = -distance + easedProgress * (distance - minDistance)
    currentY2.value = func.f(currentX2.value)
    // 右侧点：从 distance 趋近于 minDistance
    currentX.value = distance - easedProgress * (distance - minDistance)
    currentY.value = func.f(currentX.value)
  } else {
    // 普通极限：从两侧同时趋近目标点
    showBothSides.value = true

    // 从函数配置获取动画范围，如果没有配置则使用默认值
    const animRange = func.animRange || [2.5, 2.5]
    const leftDistance = animRange[0]   // 左侧点到目标的最大距离
    const rightDistance = animRange[1]  // 右侧点到目标的最大距离
    const minDistance = 0.02 // 最接近目标点的距离

    // 使用缓动后的进度计算位置
    // 右侧点：从 target+rightDistance 趋近于 target+minDistance
    const rightOffset = rightDistance - easedProgress * (rightDistance - minDistance)
    currentX.value = target + rightOffset
    currentY.value = func.f(currentX.value)

    // 左侧点：从 target-leftDistance 趋近于 target-minDistance
    const leftOffset = leftDistance - easedProgress * (leftDistance - minDistance)
    currentX2.value = target - leftOffset
    // 对于某些函数，左侧可能没有定义
    const leftY = func.f(currentX2.value)
    currentY2.value = Number.isFinite(leftY) ? leftY : currentY.value
  }

  const series: any[] = [
    {
      id: 'curve',
      type: 'line',
      name: '函数曲线',
      data: generateCurveData(func),  // 传入同一个 func 对象确保一致性
      // 关闭贝塞尔平滑插值，确保点在实际曲线上
      // 通过增加数据点密度来保持视觉平滑
      smooth: false,
      symbol: 'none',
      lineStyle: { color: '#409EFF', width: 2 },
      animation: false  // 禁用曲线动画，确保与点同步
    },
    {
      id: 'point',
      type: 'scatter',
      name: '右侧趋近点',
      data: [[currentX.value, currentY.value]],
      symbolSize: 14,
      itemStyle: { color: '#F56C6C' },
      z: 10,
      animation: false  // 禁用点动画
    }
  ]

  // 如果是双侧趋近，添加左侧点
  if (showBothSides.value && Number.isFinite(currentY2.value)) {
    series.push({
      id: 'point2',
      type: 'scatter',
      name: '左侧趋近点',
      data: [[currentX2.value, currentY2.value]],
      symbolSize: 14,
      itemStyle: { color: '#E6A23C' },
      z: 10,
      animation: false  // 禁用点动画
    })
  }

  // 添加极限线
  if (Number.isFinite(func.limit)) {
    const xMin = props.config?.expression === '(1+1/x)^x' ? 0 : -5
    const xMax = props.config?.expression === '(1+1/x)^x' ? 100 : 5
    series.push({
      id: 'limitLine',
      type: 'line',
      name: `极限值 L = ${func.limit.toFixed(4)}`,
      data: [[xMin, func.limit], [xMax, func.limit]],
      lineStyle: { color: '#67C23A', type: 'dashed', width: 2 },
      symbol: 'none'
    })
  }

  // 添加目标点的垂直线
  if (Number.isFinite(func.target)) {
    series.push({
      id: 'verticalLine',
      type: 'line',
      name: `x = ${func.target}`,
      data: [[func.target, -10], [func.target, 10]],
      lineStyle: { color: '#909399', type: 'dashed', width: 1 },
      symbol: 'none'
    })
  }

  chart.setOption({ series })
}

// 初始化图表
const initChart = () => {
  if (!chartContainer.value) return

  const func = currentFunc.value
  const expr = props.config?.expression || 'sin(x)/x'

  // 根据函数类型设置合适的坐标轴范围
  let xMin = -4, xMax = 4, yMin = -0.5, yMax = 1.5

  if (expr === '(1+1/x)^x') {
    xMin = 0
    xMax = 100
    yMin = 1
    yMax = 3.5
  } else if (expr === 'discontinuous') {
    xMin = -4
    xMax = 4
    yMin = -1.5
    yMax = 1.5
  } else if (expr === 'x^2') {
    xMin = -1
    xMax = 5
    yMin = 0
    yMax = 10
  } else if (expr === 'removable') {
    xMin = -2
    xMax = 4
    yMin = -1
    yMax = 5
  } else if (expr === '(1+x)^(1/x)') {
    xMin = -1
    xMax = 3
    yMin = 0
    yMax = 4
  } else if (expr === 'ln(1+x)/x') {
    xMin = -0.5
    xMax = 4
    yMin = 0
    yMax = 2
  } else {
    // 默认范围适合 sin(x)/x, tan(x)/x 等趋近于 0 的极限
    xMin = -4
    xMax = 4
    yMin = -0.5
    yMax = 1.5
  }

  chart = echarts.init(chartContainer.value)
  chart.setOption({
    animation: false,  // 全局禁用动画，确保曲线和点完全同步
    grid: { left: 60, right: 30, top: 40, bottom: 60 },
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
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        if (!params || !params.length) return ''
        const lines = params.map((p: any) => {
          if (p.data && p.data.length >= 2) {
            return `${p.seriesName}: (${p.data[0].toFixed(4)}, ${p.data[1].toFixed(4)})`
          }
          return ''
        }).filter(Boolean)
        return lines.join('<br>')
      }
    },
    legend: {
      show: true,
      bottom: 5,
      textStyle: { fontSize: 11 }
    },
    series: []
  })

  updateChart()
}

// 播放控制
const togglePlay = () => {
  isPlaying.value = !isPlaying.value
  if (isPlaying.value) {
    startAnimation()
  } else {
    stopAnimation()
  }
}

const startAnimation = () => {
  // 基础间隔 80ms，1x速度下完成动画约8秒，适合观察
  // speed 越大，interval 越小，动画越快
  const baseInterval = 80
  const interval = baseInterval / speed.value

  animationTimer = window.setInterval(() => {
    if (currentStep.value >= totalSteps.value) {
      if (loopEnabled.value) {
        currentStep.value = 0
        updateChart()
      } else {
        stopAnimation()
        isPlaying.value = false
      }
      return
    }
    currentStep.value++
    updateChart()
  }, interval)
}

const stopAnimation = () => {
  if (animationTimer) {
    clearInterval(animationTimer)
    animationTimer = null
  }
}

const reset = () => {
  stopAnimation()
  isPlaying.value = false
  currentStep.value = 0
  updateChart()
}

const stepForward = () => {
  if (currentStep.value < totalSteps.value) {
    currentStep.value++
    updateChart()
  }
}

const stepBackward = () => {
  if (currentStep.value > 0) {
    currentStep.value--
    updateChart()
  }
}

const onSliderChange = () => {
  updateChart()
}

// 全屏切换
const toggleFullscreen = () => {
  const container = chartContainer.value?.parentElement
  if (!container) return

  if (!document.fullscreenElement) {
    container.requestFullscreen?.()
  } else {
    document.exitFullscreen?.()
  }
}

watch(speed, () => {
  if (isPlaying.value) {
    stopAnimation()
    startAnimation()
  }
})

// 监听配置变化
watch(() => props.config, () => {
  // 停止正在播放的动画
  stopAnimation()
  isPlaying.value = false
  currentStep.value = 0

  // 清除曲线缓存，强制重新生成
  cachedCurveData = null

  if (chart) {
    chart.dispose()
    chart = null
  }
  initChart()
}, { deep: true })

onMounted(async () => {
  // 等待 DOM 渲染完成，确保 chartContainer ref 已准备好
  await nextTick()
  initChart()
  window.addEventListener('resize', () => chart?.resize())
})

onUnmounted(() => {
  stopAnimation()
  chart?.dispose()
})
</script>

<style lang="scss" scoped>
.limit-animation {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chart-container {
  flex: 1;
  min-height: 300px;
}

.animation-controls {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background-color: var(--card-bg);
  border-radius: 8px;
  margin-top: 16px;

  .controls-left {
    display: flex;
    align-items: center;
    gap: 8px;

    // 一体化播放控制栏
    .unified-player {
      display: flex;
      align-items: center;
      background: linear-gradient(135deg, rgba(64, 158, 255, 0.08) 0%, rgba(64, 158, 255, 0.15) 100%);
      border-radius: 28px;
      padding: 6px 8px;
      gap: 4px;
      border: 1px solid rgba(64, 158, 255, 0.2);
      box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);

      .player-btn {
        border: none;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        color: var(--text-color-secondary);
        background: transparent;
        border-radius: 50%;

        &:hover:not(.disabled) {
          color: var(--primary-color);
          background: rgba(64, 158, 255, 0.15);
          transform: scale(1.1);
        }

        &:active:not(.disabled) {
          transform: scale(0.95);
        }

        &.disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
      }

      // 重置按钮
      .reset-btn {
        width: 32px;
        height: 32px;
        font-size: 14px;
      }

      // 快退/快进按钮
      .step-btn {
        width: 36px;
        height: 36px;
        font-size: 16px;
        background: rgba(255, 255, 255, 0.6);
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

        &:hover:not(.disabled) {
          background: rgba(64, 158, 255, 0.2);
          box-shadow: 0 2px 6px rgba(64, 158, 255, 0.3);
        }
      }

      // 播放/暂停按钮（核心按钮，突出显示）
      .play-btn {
        position: relative;
        width: 48px;
        height: 48px;
        background: linear-gradient(135deg, #409EFF 0%, #337ecc 100%);
        color: white;
        box-shadow: 0 4px 12px rgba(64, 158, 255, 0.4);
        margin: 0 4px;
        overflow: visible;

        .play-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          z-index: 2;
          transition: transform 0.2s ease;
        }

        &:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 16px rgba(64, 158, 255, 0.5);
          background: linear-gradient(135deg, #66b1ff 0%, #409EFF 100%);
        }

        &:active {
          transform: scale(0.95);
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
            width: 100%;
            height: 100%;
            border-radius: 50%;
            border: 2px solid #F56C6C;
            animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
            pointer-events: none;
          }
        }
      }

      // 循环播放按钮
      .loop-btn {
        width: 32px;
        height: 32px;
        font-size: 14px;

        &.active {
          color: var(--primary-color);
          background: rgba(64, 158, 255, 0.2);

          &:hover {
            background: rgba(64, 158, 255, 0.3);
          }
        }
      }
    }

    @keyframes pulse {
      0% {
        transform: scale(1);
        opacity: 0.8;
      }
      50% {
        transform: scale(1.4);
        opacity: 0;
      }
      100% {
        transform: scale(1);
        opacity: 0;
      }
    }
  }

  .progress-info {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 12px;

    .el-slider {
      flex: 1;
    }

    .step-label {
      font-size: 12px;
      color: var(--text-color-secondary);
      white-space: nowrap;
      min-width: 40px;
      text-align: right;
    }
  }

  .controls-right {
    display: flex;
    align-items: center;
    gap: 8px;

    .speed-select {
      width: 80px;
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

  :deep(.math) {
    font-family: 'Times New Roman', serif;
    font-style: italic;
    color: var(--primary-color);
    font-weight: 500;
  }

  :deep(.highlight) {
    color: #F56C6C;
    font-weight: 600;
  }

  .current-values {
    font-size: 13px;
    color: var(--text-color-secondary);
    margin-top: 4px;
  }
}
</style>
