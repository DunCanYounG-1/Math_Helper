<template>
  <div class="graph-view">
    <div class="graph-toolbar">
      <h1 class="page-title">函数绘图</h1>
      <div class="toolbar-actions">
        <el-switch
          v-model="showSpecialPoints"
          active-text="显示特殊点"
          @change="updateChart"
        />
        <el-switch
          v-model="showTangentLine"
          active-text="切线工具"
          @change="onTangentToggle"
        />
        <el-button @click="addFunction">
          <el-icon><Plus /></el-icon>
          添加函数
        </el-button>
        <el-button @click="clearAll">
          <el-icon><Delete /></el-icon>
          清空
        </el-button>
      </div>
    </div>

    <div class="graph-content">
      <!-- 左侧：函数输入区 -->
      <div class="input-panel card">
        <h3>函数列表</h3>

        <div class="function-list">
          <div
            v-for="(func, index) in functions"
            :key="func.id"
            class="function-item"
            :class="{ active: activeFunctionId === func.id }"
          >
            <div class="function-header">
              <span
                class="color-dot"
                :style="{ backgroundColor: func.color }"
              ></span>
              <span class="function-label">y{{ index + 1 }} =</span>
              <el-input
                :ref="(el: any) => setInputRef(func.id, el)"
                v-model="func.expression"
                placeholder="输入表达式，如 x^2 + sin(x)"
                @input="onExpressionChange(func)"
                @focus="setActiveFunction(func.id)"
                @click="setActiveFunction(func.id)"
              />
              <el-button
                :icon="func.visible ? View : Hide"
                text
                @click="toggleVisibility(func)"
              />
              <el-button
                :icon="Delete"
                text
                type="danger"
                @click="removeFunction(func.id)"
              />
            </div>

            <!-- 参数滑动条 -->
            <div v-if="func.parameters.length > 0" class="parameters">
              <div
                v-for="param in func.parameters"
                :key="param.name"
                class="parameter-item"
              >
                <span class="param-name">{{ param.name }} =</span>
                <el-slider
                  v-model="param.value"
                  :min="param.min"
                  :max="param.max"
                  :step="param.step"
                  show-input
                  @input="onParameterChange"
                />
              </div>
            </div>

            <div v-if="func.error" class="error-message">
              {{ func.error }}
            </div>
          </div>
        </div>

        <!-- 坐标范围设置 -->
        <div class="range-settings">
          <h4>坐标范围</h4>
          <div class="range-inputs">
            <div class="range-group">
              <span>X:</span>
              <el-input-number v-model="xRange[0]" :step="1" size="small" />
              <span>~</span>
              <el-input-number v-model="xRange[1]" :step="1" size="small" />
            </div>
            <div class="range-group">
              <span>Y:</span>
              <el-input-number v-model="yRange[0]" :step="1" size="small" />
              <span>~</span>
              <el-input-number v-model="yRange[1]" :step="1" size="small" />
            </div>
          </div>
        </div>

        <!-- 特殊点列表 -->
        <div v-if="showSpecialPoints && allSpecialPoints.length > 0" class="special-points-list">
          <h4>特殊点 ({{ allSpecialPoints.length }})</h4>
          <div class="points-container">
            <div
              v-for="(point, index) in allSpecialPoints"
              :key="index"
              class="point-item"
              :style="{ borderLeftColor: getPointStyle(point.type).color }"
            >
              <span class="point-type">{{ getPointStyle(point.type).label }}</span>
              <span class="point-coords">
                ({{ point.x.toFixed(4) }}, {{ point.y.toFixed(4) }})
              </span>
            </div>
          </div>
        </div>

        <!-- 切线工具面板 -->
        <div v-if="showTangentLine" class="tangent-panel">
          <h4>切线工具</h4>
          <div class="tangent-controls">
            <div class="tangent-row">
              <span class="tangent-label">选择函数:</span>
              <el-select v-model="tangentFuncId" placeholder="选择函数" size="small">
                <el-option
                  v-for="func in visibleFunctions"
                  :key="func.id"
                  :label="`y = ${func.expression || '(空)'}`"
                  :value="func.id"
                />
              </el-select>
            </div>
            <div class="tangent-row">
              <span class="tangent-label">切点 x =</span>
              <el-input-number
                v-model="tangentX"
                :step="0.1"
                :min="xRange[0]"
                :max="xRange[1]"
                size="small"
                @change="updateTangent"
              />
            </div>
            <div class="tangent-row">
              <el-checkbox v-model="showNormalLine" @change="updateChart">显示法线</el-checkbox>
            </div>
          </div>
          <div v-if="tangentInfo" class="tangent-info">
            <div class="info-item">
              <span class="info-label">切点:</span>
              <span class="info-value">({{ tangentInfo.x.toFixed(4) }}, {{ tangentInfo.y.toFixed(4) }})</span>
            </div>
            <div class="info-item">
              <span class="info-label">斜率:</span>
              <span class="info-value">k = {{ tangentInfo.slope.toFixed(4) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">切线方程:</span>
              <span class="info-value equation">{{ tangentInfo.equation }}</span>
            </div>
            <div v-if="showNormalLine" class="info-item">
              <span class="info-label">法线方程:</span>
              <span class="info-value equation">{{ tangentInfo.normalEquation }}</span>
            </div>
          </div>
          <p class="tangent-tip">提示: 点击图表可直接选择切点</p>
        </div>

        <!-- 数学键盘 -->
        <MathKeyboard
          class="math-keyboard-container"
          @input="handleKeyboardInput"
          @clear="handleKeyboardClear"
          @backspace="handleKeyboardBackspace"
        />
      </div>

      <!-- 右侧：图表区 -->
      <div class="chart-panel card">
        <div ref="chartContainer" class="chart-container"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { Plus, Delete, View, Hide } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { create, all } from 'mathjs'
import {
  findAllSpecialPoints,
  getSpecialPointStyle,
  type SpecialPoint
} from '@/utils/specialPoints'
import MathKeyboard from '@/components/graph/MathKeyboard.vue'

const math = create(all)

interface FunctionItem {
  id: string
  expression: string
  color: string
  visible: boolean
  parameters: Array<{
    name: string
    value: number
    min: number
    max: number
    step: number
  }>
  error: string | null
}

const chartContainer = ref<HTMLElement | null>(null)
let chart: echarts.ECharts | null = null

const colors = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399', '#9C27B0']
const functions = ref<FunctionItem[]>([])
const xRange = ref<[number, number]>([-10, 10])
const yRange = ref<[number, number]>([-10, 10])
const showSpecialPoints = ref(true)
const allSpecialPoints = ref<SpecialPoint[]>([])

// 切线工具相关
const showTangentLine = ref(false)
const tangentFuncId = ref<string | null>(null)
const tangentX = ref(0)
const showNormalLine = ref(false)
interface TangentInfo {
  x: number
  y: number
  slope: number
  equation: string
  normalEquation: string
}
const tangentInfo = ref<TangentInfo | null>(null)

// 可见函数列表
const visibleFunctions = computed(() => {
  return functions.value.filter(f => f.visible && f.expression.trim() && !f.error)
})

// 当前激活的函数输入框
const activeFunctionId = ref<string | null>(null)
const activeInputRef = ref<HTMLInputElement | null>(null)
// 存储每个函数输入框的 ref
const inputRefs = ref<Record<string, any>>({})

// 设置输入框 ref
const setInputRef = (funcId: string, el: any) => {
  if (el) {
    inputRefs.value[funcId] = el
  }
}

// 设置激活的函数
const setActiveFunction = (funcId: string) => {
  activeFunctionId.value = funcId
  // 通过 el-input 组件获取实际的 input 元素
  const elInput = inputRefs.value[funcId]
  if (elInput) {
    // el-input 组件的内部 input 可以通过 ref 访问
    activeInputRef.value = elInput.$el?.querySelector('input') || elInput.input || null
  }
}

// 键盘输入处理
const handleKeyboardInput = (value: string, cursorOffset?: number) => {
  if (!activeFunctionId.value) {
    // 如果没有激活的函数，激活第一个
    if (functions.value.length > 0) {
      activeFunctionId.value = functions.value[0].id
    } else {
      return
    }
  }

  const func = functions.value.find(f => f.id === activeFunctionId.value)
  if (!func) return

  // 获取当前光标位置
  const input = activeInputRef.value
  if (input) {
    const start = input.selectionStart || func.expression.length
    const end = input.selectionEnd || func.expression.length

    // 插入文本
    const before = func.expression.slice(0, start)
    const after = func.expression.slice(end)
    func.expression = before + value + after

    // 更新光标位置
    const newPos = start + value.length + (cursorOffset || 0)
    setTimeout(() => {
      input.focus()
      input.setSelectionRange(newPos, newPos)
    }, 0)
  } else {
    func.expression += value
  }

  onExpressionChange(func)
}

// 键盘清除处理
const handleKeyboardClear = () => {
  if (!activeFunctionId.value) return
  const func = functions.value.find(f => f.id === activeFunctionId.value)
  if (func) {
    func.expression = ''
    onExpressionChange(func)
  }
}

// 键盘退格处理
const handleKeyboardBackspace = () => {
  if (!activeFunctionId.value) return
  const func = functions.value.find(f => f.id === activeFunctionId.value)
  if (!func || !func.expression) return

  const input = activeInputRef.value
  if (input) {
    const start = input.selectionStart || func.expression.length
    const end = input.selectionEnd || func.expression.length

    if (start === end && start > 0) {
      // 没有选中文本，删除光标前一个字符
      func.expression = func.expression.slice(0, start - 1) + func.expression.slice(end)
      setTimeout(() => {
        input.focus()
        input.setSelectionRange(start - 1, start - 1)
      }, 0)
    } else if (start !== end) {
      // 有选中文本，删除选中部分
      func.expression = func.expression.slice(0, start) + func.expression.slice(end)
      setTimeout(() => {
        input.focus()
        input.setSelectionRange(start, start)
      }, 0)
    }
  } else {
    func.expression = func.expression.slice(0, -1)
  }

  onExpressionChange(func)
}

// 获取特殊点样式
const getPointStyle = (type: SpecialPoint['type']) => {
  return getSpecialPointStyle(type)
}

// 添加函数
const addFunction = () => {
  const id = `func_${Date.now()}`
  functions.value.push({
    id,
    expression: '',
    color: colors[functions.value.length % colors.length],
    visible: true,
    parameters: [],
    error: null
  })
}

// 删除函数
const removeFunction = (id: string) => {
  functions.value = functions.value.filter(f => f.id !== id)
  updateChart()
}

// 切换可见性
const toggleVisibility = (func: FunctionItem) => {
  func.visible = !func.visible
  updateChart()
}

// 清空所有
const clearAll = () => {
  functions.value = []
  updateChart()
}

// mathjs 内置函数和常量，不应被识别为参数
const mathBuiltins = new Set([
  // 三角函数
  'sin', 'cos', 'tan', 'cot', 'sec', 'csc',
  'asin', 'acos', 'atan', 'atan2', 'acot', 'asec', 'acsc',
  'sinh', 'cosh', 'tanh', 'coth', 'sech', 'csch',
  'asinh', 'acosh', 'atanh', 'acoth', 'asech', 'acsch',
  // 指数和对数
  'exp', 'log', 'log10', 'log2', 'ln', 'pow', 'sqrt', 'cbrt',
  // 其他数学函数
  'abs', 'ceil', 'floor', 'round', 'sign', 'mod',
  'min', 'max', 'sum', 'mean', 'median',
  'factorial', 'gamma', 'lgamma',
  // 常量
  'pi', 'e', 'i', 'Infinity', 'NaN', 'phi', 'tau',
  // 其他
  'random', 'randomInt'
])

// 表达式变化处理
const onExpressionChange = (func: FunctionItem) => {
  try {
    if (!func.expression.trim()) {
      func.error = null
      func.parameters = []
      updateChart()
      return
    }

    // 解析表达式，提取参数（排除 x 和内置函数/常量）
    const node = math.parse(func.expression)
    const vars = new Set<string>()
    node.traverse((n: any) => {
      if (n.isSymbolNode && n.name !== 'x' && !mathBuiltins.has(n.name)) {
        vars.add(n.name)
      }
    })

    // 更新参数列表
    const existingParams = new Map(func.parameters.map(p => [p.name, p]))
    func.parameters = Array.from(vars).map(name => {
      const existing = existingParams.get(name)
      return existing || { name, value: 1, min: -10, max: 10, step: 0.1 }
    })

    func.error = null
    updateChart()
  } catch (e) {
    func.error = (e as Error).message
  }
}

// 参数变化处理
const onParameterChange = () => {
  updateChart()
}

// 生成曲线数据点
const generatePoints = (func: FunctionItem): [number, number][] => {
  if (!func.expression.trim() || func.error) return []

  try {
    const compiled = math.compile(func.expression)
    const scope: Record<string, number> = {}

    // 设置参数值
    func.parameters.forEach(p => {
      scope[p.name] = p.value
    })

    const points: [number, number][] = []
    const [xMin, xMax] = xRange.value
    const step = (xMax - xMin) / 500

    for (let x = xMin; x <= xMax; x += step) {
      try {
        scope.x = x
        const y = compiled.evaluate(scope)
        if (Number.isFinite(y) && y >= yRange.value[0] && y <= yRange.value[1]) {
          points.push([x, y])
        }
      } catch {
        // 跳过无效点
      }
    }

    return points
  } catch {
    return []
  }
}

// 创建函数求值器
const createEvaluator = (func: FunctionItem): ((x: number) => number) | null => {
  if (!func.expression.trim() || func.error) return null

  try {
    const compiled = math.compile(func.expression)
    const scope: Record<string, number> = {}

    // 设置参数值
    func.parameters.forEach(p => {
      scope[p.name] = p.value
    })

    return (x: number) => {
      scope.x = x
      return compiled.evaluate(scope)
    }
  } catch {
    return null
  }
}

// 数值微分（计算导数）
const numericalDerivative = (f: (x: number) => number, x: number, h = 0.0001): number => {
  return (f(x + h) - f(x - h)) / (2 * h)
}

// 计算切线信息
const calculateTangentInfo = (): TangentInfo | null => {
  if (!tangentFuncId.value) return null

  const func = functions.value.find(f => f.id === tangentFuncId.value)
  if (!func || !func.expression.trim() || func.error) return null

  const evaluator = createEvaluator(func)
  if (!evaluator) return null

  try {
    const x = tangentX.value
    const y = evaluator(x)

    if (!Number.isFinite(y)) return null

    // 计算导数（斜率）
    const slope = numericalDerivative(evaluator, x)

    if (!Number.isFinite(slope)) return null

    // 切线方程: y - y0 = k(x - x0) => y = kx - kx0 + y0
    const b = y - slope * x
    const equation = formatLineEquation(slope, b)

    // 法线方程: 斜率为 -1/k
    let normalEquation = ''
    if (Math.abs(slope) < 0.0001) {
      normalEquation = `x = ${x.toFixed(4)}`
    } else {
      const normalSlope = -1 / slope
      const normalB = y - normalSlope * x
      normalEquation = formatLineEquation(normalSlope, normalB)
    }

    return { x, y, slope, equation, normalEquation }
  } catch {
    return null
  }
}

// 格式化直线方程
const formatLineEquation = (k: number, b: number): string => {
  const kStr = Math.abs(k) < 0.0001 ? '0' : k.toFixed(4)
  const absB = Math.abs(b)
  const bStr = absB < 0.0001 ? '' : (b >= 0 ? ` + ${absB.toFixed(4)}` : ` - ${absB.toFixed(4)}`)

  if (Math.abs(k) < 0.0001) {
    return `y = ${b.toFixed(4)}`
  }
  return `y = ${kStr}x${bStr}`
}

// 生成切线数据点
const generateTangentLinePoints = (): [number, number][] => {
  if (!tangentInfo.value) return []

  const { x: x0, y: y0, slope } = tangentInfo.value
  const [xMin, xMax] = xRange.value

  // 生成切线两端点
  const points: [number, number][] = []
  const x1 = xMin
  const y1 = y0 + slope * (x1 - x0)
  const x2 = xMax
  const y2 = y0 + slope * (x2 - x0)

  points.push([x1, y1], [x2, y2])
  return points
}

// 生成法线数据点
const generateNormalLinePoints = (): [number, number][] => {
  if (!tangentInfo.value || Math.abs(tangentInfo.value.slope) < 0.0001) return []

  const { x: x0, y: y0, slope } = tangentInfo.value
  const normalSlope = -1 / slope
  const [xMin, xMax] = xRange.value

  const points: [number, number][] = []
  const x1 = xMin
  const y1 = y0 + normalSlope * (x1 - x0)
  const x2 = xMax
  const y2 = y0 + normalSlope * (x2 - x0)

  points.push([x1, y1], [x2, y2])
  return points
}

// 更新切线
const updateTangent = () => {
  tangentInfo.value = calculateTangentInfo()
  updateChart()
}

// 切线工具开关
const onTangentToggle = () => {
  if (showTangentLine.value) {
    // 默认选择第一个可见函数
    if (visibleFunctions.value.length > 0 && !tangentFuncId.value) {
      tangentFuncId.value = visibleFunctions.value[0].id
    }
    updateTangent()
  } else {
    tangentInfo.value = null
    updateChart()
  }
}

// 计算所有特殊点
const calculateSpecialPoints = () => {
  const points: SpecialPoint[] = []

  functions.value
    .filter(f => f.visible && f.expression.trim() && !f.error)
    .forEach(func => {
      const evaluator = createEvaluator(func)
      if (evaluator) {
        try {
          const funcPoints = findAllSpecialPoints(evaluator, xRange.value, {
            resolution: 300
          })
          // 过滤在y范围内的点
          const filteredPoints = funcPoints.filter(
            p => p.y >= yRange.value[0] && p.y <= yRange.value[1]
          )
          points.push(...filteredPoints)
        } catch {
          // 忽略计算错误
        }
      }
    })

  allSpecialPoints.value = points
}

// 更新图表
const updateChart = () => {
  if (!chart) return

  // 曲线系列
  const series: any[] = functions.value
    .filter(f => f.visible && f.expression.trim())
    .map(func => ({
      type: 'line',
      name: func.expression,
      data: generatePoints(func),
      smooth: true,
      symbol: 'none',
      lineStyle: {
        color: func.color,
        width: 2
      }
    }))

  // 计算特殊点
  if (showSpecialPoints.value) {
    calculateSpecialPoints()

    // 按类型分组特殊点
    const pointsByType: Record<string, SpecialPoint[]> = {
      maximum: [],
      minimum: [],
      inflection: [],
      zero: []
    }

    allSpecialPoints.value.forEach(p => {
      pointsByType[p.type].push(p)
    })

    // 为每种类型创建散点系列
    Object.entries(pointsByType).forEach(([type, points]) => {
      if (points.length > 0) {
        const style = getSpecialPointStyle(type as SpecialPoint['type'])
        series.push({
          type: 'scatter',
          name: style.label,
          data: points.map(p => [p.x, p.y]),
          symbolSize: 10,
          symbol: type === 'minimum' ? 'triangle' : (type === 'maximum' ? 'triangle' : style.symbol),
          symbolRotate: type === 'minimum' ? 180 : 0,
          itemStyle: {
            color: style.color,
            borderColor: '#fff',
            borderWidth: 1
          },
          emphasis: {
            scale: 1.5
          },
          z: 10
        })
      }
    })
  } else {
    allSpecialPoints.value = []
  }

  // 切线和法线
  if (showTangentLine.value && tangentInfo.value) {
    // 切线
    series.push({
      type: 'line',
      name: '切线',
      data: generateTangentLinePoints(),
      smooth: false,
      symbol: 'none',
      lineStyle: {
        color: '#E6A23C',
        width: 2,
        type: 'dashed'
      },
      z: 5
    })

    // 切点
    series.push({
      type: 'scatter',
      name: '切点',
      data: [[tangentInfo.value.x, tangentInfo.value.y]],
      symbolSize: 12,
      symbol: 'circle',
      itemStyle: {
        color: '#E6A23C',
        borderColor: '#fff',
        borderWidth: 2
      },
      z: 15
    })

    // 法线
    if (showNormalLine.value) {
      series.push({
        type: 'line',
        name: '法线',
        data: generateNormalLinePoints(),
        smooth: false,
        symbol: 'none',
        lineStyle: {
          color: '#909399',
          width: 2,
          type: 'dotted'
        },
        z: 5
      })
    }
  }

  // 图例数据
  const legendData = ['极大值', '极小值', '拐点', '零点']
  if (showTangentLine.value && tangentInfo.value) {
    legendData.push('切线', '切点')
    if (showNormalLine.value) {
      legendData.push('法线')
    }
  }

  chart.setOption({
    xAxis: {
      min: xRange.value[0],
      max: xRange.value[1]
    },
    yAxis: {
      min: yRange.value[0],
      max: yRange.value[1]
    },
    legend: {
      show: (showSpecialPoints.value && allSpecialPoints.value.length > 0) || (showTangentLine.value && tangentInfo.value !== null),
      bottom: 10,
      data: legendData
    },
    series
  }, true)
}

// 初始化图表
const initChart = () => {
  if (!chartContainer.value) return

  chart = echarts.init(chartContainer.value)
  chart.setOption({
    grid: {
      left: 60,
      right: 40,
      top: 40,
      bottom: 80
    },
    xAxis: {
      type: 'value',
      min: xRange.value[0],
      max: xRange.value[1],
      splitLine: { show: true, lineStyle: { color: '#eee' } },
      axisLine: { lineStyle: { color: '#999' } }
    },
    yAxis: {
      type: 'value',
      min: yRange.value[0],
      max: yRange.value[1],
      splitLine: { show: true, lineStyle: { color: '#eee' } },
      axisLine: { lineStyle: { color: '#999' } }
    },
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        if (!params.data) return ''
        const x = params.data[0].toFixed(4)
        const y = params.data[1].toFixed(4)

        // 检查是否是特殊点
        const specialPointLabels = ['极大值', '极小值', '拐点', '零点']
        if (specialPointLabels.includes(params.seriesName)) {
          return `<strong>${params.seriesName}</strong><br/>x = ${x}<br/>y = ${y}`
        }

        return `${params.marker} ${params.seriesName}<br/>x = ${x}<br/>y = ${y}`
      }
    },
    series: []
  })

  // 点击图表选择切点
  chart.on('click', (params: any) => {
    if (showTangentLine.value && params.event) {
      const pointInPixel = [params.event.offsetX, params.event.offsetY]
      if (chart?.containPixel('grid', pointInPixel)) {
        const pointInGrid = chart.convertFromPixel('grid', pointInPixel)
        tangentX.value = Math.round(pointInGrid[0] * 100) / 100
        updateTangent()
      }
    }
  })

  window.addEventListener('resize', handleResize)
}

const handleResize = () => {
  chart?.resize()
}

// 监听范围变化
watch([xRange, yRange], () => {
  updateChart()
}, { deep: true })

// 监听切线函数选择变化
watch(tangentFuncId, () => {
  if (showTangentLine.value) {
    updateTangent()
  }
})

onMounted(() => {
  initChart()
  addFunction() // 默认添加一个函数输入
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chart?.dispose()
})
</script>

<style lang="scss" scoped>
.graph-view {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.graph-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  .page-title {
    margin-bottom: 0;
  }

  .toolbar-actions {
    display: flex;
    gap: 8px;
  }
}

.graph-content {
  flex: 1;
  display: flex;
  gap: 20px;
  min-height: 0;
}

.input-panel {
  width: 400px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  overflow: auto;

  h3 {
    font-size: 16px;
    margin-bottom: 16px;
  }
}

.function-list {
  flex: 1;
  overflow: auto;
  min-height: 200px;
  max-height: 400px;
}

.function-item {
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  margin-bottom: 12px;
  transition: all 0.2s ease;

  &.active {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px rgba(var(--primary-color-rgb), 0.1);
  }

  .function-header {
    display: flex;
    align-items: center;
    gap: 8px;

    .color-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .function-label {
      font-weight: 500;
      white-space: nowrap;
    }

    .el-input {
      flex: 1;
    }
  }

  .parameters {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px dashed var(--border-color);
  }

  .parameter-item {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;

    .param-name {
      width: 40px;
      font-weight: 500;
    }

    .el-slider {
      flex: 1;
    }
  }

  .error-message {
    margin-top: 8px;
    padding: 8px;
    background-color: #fef0f0;
    color: #f56c6c;
    border-radius: 4px;
    font-size: 12px;
  }
}

.range-settings {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
  flex-shrink: 0;

  h4 {
    font-size: 14px;
    margin-bottom: 12px;
  }

  .range-inputs {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .range-group {
    display: flex;
    align-items: center;
    gap: 8px;

    span {
      font-weight: 500;
    }

    .el-input-number {
      width: 100px;
    }
  }
}

.chart-panel {
  flex: 1;
  min-width: 0;
}

.chart-container {
  width: 100%;
  height: 100%;
  min-height: 400px;
}

.special-points-list {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
  flex-shrink: 0;

  h4 {
    font-size: 14px;
    margin-bottom: 12px;
  }

  .points-container {
    max-height: 120px;
    overflow-y: auto;
  }

  .point-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    margin-bottom: 4px;
    background-color: var(--bg-color);
    border-radius: 4px;
    border-left: 3px solid;
    font-size: 13px;

    .point-type {
      font-weight: 500;
    }

    .point-coords {
      font-family: monospace;
      color: var(--text-color-secondary);
    }
  }
}

.tangent-panel {
  margin-top: 16px;
  padding: 16px;
  border-top: 1px solid var(--border-color);
  background-color: rgba(230, 162, 60, 0.05);
  border-radius: 8px;
  flex-shrink: 0;

  h4 {
    font-size: 14px;
    margin-bottom: 12px;
    color: #E6A23C;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .tangent-controls {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .tangent-row {
    display: flex;
    align-items: center;
    gap: 8px;

    .tangent-label {
      font-size: 13px;
      color: var(--text-color-secondary);
      white-space: nowrap;
    }

    .el-select {
      flex: 1;
    }

    .el-input-number {
      width: 120px;
    }
  }

  .tangent-info {
    margin-top: 16px;
    padding: 12px;
    background-color: var(--card-bg);
    border-radius: 6px;
    border: 1px solid var(--border-color);

    .info-item {
      display: flex;
      align-items: baseline;
      gap: 8px;
      margin-bottom: 8px;

      &:last-child {
        margin-bottom: 0;
      }

      .info-label {
        font-size: 12px;
        color: var(--text-color-secondary);
        flex-shrink: 0;
      }

      .info-value {
        font-size: 13px;
        font-weight: 500;
        color: var(--text-color);

        &.equation {
          font-family: 'Cambria Math', 'Times New Roman', serif;
          font-style: italic;
          color: #E6A23C;
        }
      }
    }
  }

  .tangent-tip {
    margin-top: 12px;
    font-size: 12px;
    color: var(--text-color-placeholder);
  }
}

.math-keyboard-container {
  margin-top: 16px;
  flex-shrink: 0;
}
</style>
