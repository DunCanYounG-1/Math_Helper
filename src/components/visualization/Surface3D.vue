<template>
  <div class="surface-3d">
    <div class="surface-header">
      <div class="header-title">
        <el-icon><DataAnalysis /></el-icon>
        <span>3D 曲面绘制</span>
      </div>
      <div class="header-actions">
        <el-button-group size="small">
          <el-button @click="resetView" :icon="RefreshRight" title="重置视角" />
          <el-button @click="toggleAutoRotate" :icon="autoRotate ? VideoPause : VideoPlay" :title="autoRotate ? '停止旋转' : '自动旋转'" />
        </el-button-group>
      </div>
    </div>

    <div class="surface-content">
      <!-- 曲面模式切换 -->
      <div class="mode-switch">
        <el-radio-group v-model="surfaceMode" size="small" @change="updateSurface">
          <el-radio-button value="normal">显式曲面 z=f(x,y)</el-radio-button>
          <el-radio-button value="parametric">参数曲面</el-radio-button>
        </el-radio-group>
      </div>

      <!-- 函数输入区（显式曲面模式） -->
      <div v-if="surfaceMode === 'normal'" class="input-section">
        <div class="input-row">
          <span class="input-label">z = f(x, y) =</span>
          <el-input
            v-model="functionInput"
            placeholder="输入函数表达式，如: x^2 + y^2"
            @keyup.enter="updateSurface"
            class="function-input"
          >
            <template #append>
              <el-button @click="updateSurface" :loading="isLoading">绘制</el-button>
            </template>
          </el-input>
        </div>

        <!-- 预设函数 -->
        <div class="preset-row">
          <span class="preset-label">预设函数：</span>
          <div class="preset-list">
            <el-tag
              v-for="preset in presetFunctions"
              :key="preset.name"
              :type="currentPreset === preset.name && surfaceMode === 'normal' ? 'primary' : 'info'"
              class="preset-tag"
              @click="selectPreset(preset)"
            >
              {{ preset.name }}
            </el-tag>
          </div>
        </div>
      </div>

      <!-- 参数曲面选择（参数曲面模式） -->
      <div v-else class="input-section">
        <div class="preset-row">
          <span class="preset-label">选择参数曲面：</span>
          <div class="preset-list">
            <el-tag
              v-for="surface in parametricSurfaces"
              :key="surface.name"
              :type="currentPreset === surface.name && surfaceMode === 'parametric' ? 'primary' : 'info'"
              class="preset-tag"
              @click="selectParametricSurface(surface)"
            >
              {{ surface.name }}
            </el-tag>
          </div>
        </div>
      </div>

      <!-- 参数控制区 -->
      <div class="params-section">
        <div v-if="surfaceMode === 'normal'" class="param-group">
          <span class="param-label">X 范围</span>
          <el-slider
            v-model="xRange"
            range
            :min="-10"
            :max="10"
            :step="0.5"
            :format-tooltip="(val: number) => val.toFixed(1)"
            @change="updateSurface"
          />
        </div>
        <div v-if="surfaceMode === 'normal'" class="param-group">
          <span class="param-label">Y 范围</span>
          <el-slider
            v-model="yRange"
            range
            :min="-10"
            :max="10"
            :step="0.5"
            :format-tooltip="(val: number) => val.toFixed(1)"
            @change="updateSurface"
          />
        </div>
        <div class="param-group">
          <span class="param-label">精度</span>
          <el-slider
            v-model="resolution"
            :min="20"
            :max="100"
            :step="10"
            @change="updateSurface"
          />
        </div>
        <div class="param-group color-group">
          <span class="param-label">配色</span>
          <el-select v-model="colorScheme" size="small" @change="updateSurface">
            <el-option label="蓝绿渐变" value="blue-green" />
            <el-option label="彩虹色" value="rainbow" />
            <el-option label="热力图" value="heat" />
            <el-option label="单色" value="mono" />
          </el-select>
        </div>
      </div>

      <!-- 高级可视化选项 -->
      <div class="advanced-options">
        <span class="options-label">可视化选项：</span>
        <el-checkbox-group v-model="displayOptions" size="small" @change="updateSurface">
          <el-checkbox label="wireframe">网格线</el-checkbox>
          <el-checkbox label="contour" :disabled="surfaceMode === 'parametric'">等值线</el-checkbox>
        </el-checkbox-group>
        <el-checkbox v-model="showCriticalPoints" size="small" :disabled="surfaceMode === 'parametric'" @change="updateSurface">
          临界点
        </el-checkbox>
        <el-checkbox v-model="showGradient" size="small" :disabled="surfaceMode === 'parametric'" @change="updateSurface">
          梯度场
        </el-checkbox>
        <el-checkbox v-model="showTangentPlane" size="small" :disabled="surfaceMode === 'parametric'" @change="updateSurface">
          切平面
        </el-checkbox>
      </div>

      <!-- 切平面控制（当启用切平面时显示） -->
      <div v-if="showTangentPlane && surfaceMode === 'normal'" class="tangent-controls">
        <span class="control-label">切点位置：</span>
        <div class="tangent-inputs">
          <span>x =</span>
          <el-input-number v-model="tangentPoint.x" :step="0.5" :min="xRange[0]" :max="xRange[1]" size="small" @change="updateSurface" />
          <span>y =</span>
          <el-input-number v-model="tangentPoint.y" :step="0.5" :min="yRange[0]" :max="yRange[1]" size="small" @change="updateSurface" />
        </div>
      </div>

      <!-- 3D 图表容器 -->
      <div ref="chartContainer" class="chart-container"></div>

      <!-- 临界点列表 -->
      <div v-if="showCriticalPoints && criticalPoints.length > 0" class="critical-points-list">
        <h4>发现的临界点：</h4>
        <div class="points-grid">
          <div v-for="(point, index) in criticalPoints" :key="index" class="point-item" :class="point.type">
            <span class="point-type">{{ point.type }}</span>
            <span class="point-coords">({{ point.x.toFixed(2) }}, {{ point.y.toFixed(2) }}, {{ point.z.toFixed(2) }})</span>
          </div>
        </div>
      </div>

      <!-- 函数信息 -->
      <div v-if="functionInfo" class="function-info">
        <div class="info-item">
          <span class="info-label">函数表达式：</span>
          <span class="info-value" v-html="renderFormula(functionInfo.formula)"></span>
        </div>
        <div v-if="functionInfo.description" class="info-item">
          <span class="info-label">说明：</span>
          <span class="info-value">{{ functionInfo.description }}</span>
        </div>
      </div>

      <!-- 操作提示 -->
      <div class="tips-section">
        <el-icon><InfoFilled /></el-icon>
        <span>鼠标拖拽旋转视角，滚轮缩放，右键平移</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import {
  DataAnalysis,
  RefreshRight,
  VideoPlay,
  VideoPause,
  InfoFilled
} from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import 'echarts-gl'
import { math } from '@/utils/mathjs'
import katex from 'katex'

interface PresetFunction {
  name: string
  expression: string
  formula: string
  description: string
  xRange?: [number, number]
  yRange?: [number, number]
}

// 普通曲面预设
const presetFunctions: PresetFunction[] = [
  {
    name: '抛物面',
    expression: 'x^2 + y^2',
    formula: 'z = x^2 + y^2',
    description: '椭圆抛物面，开口向上'
  },
  {
    name: '马鞍面',
    expression: 'x^2 - y^2',
    formula: 'z = x^2 - y^2',
    description: '双曲抛物面（马鞍面），鞍点在原点'
  },
  {
    name: '波浪面',
    expression: 'sin(x) * cos(y)',
    formula: 'z = \\sin(x) \\cos(y)',
    description: '正弦余弦乘积形成的波浪曲面'
  },
  {
    name: '钟形曲面',
    expression: 'exp(-(x^2 + y^2) / 2)',
    formula: 'z = e^{-\\frac{x^2+y^2}{2}}',
    description: '二维高斯函数，呈钟形分布'
  },
  {
    name: '涟漪',
    expression: 'sin(sqrt(x^2 + y^2)) / (sqrt(x^2 + y^2) + 0.1)',
    formula: 'z = \\frac{\\sin(\\sqrt{x^2+y^2})}{\\sqrt{x^2+y^2}}',
    description: '类似水面涟漪的同心波纹'
  },
  {
    name: '螺旋面',
    expression: 'sin(x + y)',
    formula: 'z = \\sin(x + y)',
    description: '倾斜的波浪面'
  },
  {
    name: '锥面',
    expression: 'sqrt(x^2 + y^2)',
    formula: 'z = \\sqrt{x^2 + y^2}',
    description: '圆锥面，顶点在原点'
  },
  {
    name: '半球面',
    expression: 'sqrt(max(0, 4 - x^2 - y^2))',
    formula: 'z = \\sqrt{4 - x^2 - y^2}',
    description: '半径为2的上半球面',
    xRange: [-2, 2],
    yRange: [-2, 2]
  },
  {
    name: '双曲面',
    expression: 'sqrt(1 + x^2 + y^2)',
    formula: 'z = \\sqrt{1 + x^2 + y^2}',
    description: '单叶双曲面'
  },
  {
    name: '猴鞍面',
    expression: 'x^3 - 3*x*y^2',
    formula: 'z = x^3 - 3xy^2',
    description: '三阶鞍点曲面（猴鞍）'
  },
  {
    name: 'Enneper曲面',
    expression: 'x - x^3/3 + x*y^2',
    formula: 'z = x - \\frac{x^3}{3} + xy^2',
    description: '经典极小曲面'
  }
]

// 参数曲面预设
interface ParametricSurface {
  name: string
  xExpr: string
  yExpr: string
  zExpr: string
  formula: string
  description: string
  uRange: [number, number]
  vRange: [number, number]
}

const parametricSurfaces: ParametricSurface[] = [
  {
    name: '球面',
    xExpr: '2 * sin(u) * cos(v)',
    yExpr: '2 * sin(u) * sin(v)',
    zExpr: '2 * cos(u)',
    formula: 'x = 2\\sin u\\cos v, y = 2\\sin u\\sin v, z = 2\\cos u',
    description: '半径为2的球面',
    uRange: [0, Math.PI],
    vRange: [0, 2 * Math.PI]
  },
  {
    name: '圆环面',
    xExpr: '(3 + cos(v)) * cos(u)',
    yExpr: '(3 + cos(v)) * sin(u)',
    zExpr: 'sin(v)',
    formula: 'x = (3+\\cos v)\\cos u, y = (3+\\cos v)\\sin u, z = \\sin v',
    description: '圆环面（甜甜圈形状）',
    uRange: [0, 2 * Math.PI],
    vRange: [0, 2 * Math.PI]
  },
  {
    name: '莫比乌斯带',
    xExpr: '(1 + v/2 * cos(u/2)) * cos(u)',
    yExpr: '(1 + v/2 * cos(u/2)) * sin(u)',
    zExpr: 'v/2 * sin(u/2)',
    formula: '莫比乌斯带参数方程',
    description: '只有一个面的神奇曲面',
    uRange: [0, 2 * Math.PI],
    vRange: [-1, 1]
  },
  {
    name: '螺旋面',
    xExpr: 'v * cos(u)',
    yExpr: 'v * sin(u)',
    zExpr: 'u / (2 * pi)',
    formula: 'x = v\\cos u, y = v\\sin u, z = \\frac{u}{2\\pi}',
    description: '像螺丝的螺旋曲面',
    uRange: [0, 4 * Math.PI],
    vRange: [0, 2]
  },
  {
    name: '克莱因瓶',
    xExpr: '(2 + cos(u/2) * sin(v) - sin(u/2) * sin(2*v)) * cos(u)',
    yExpr: '(2 + cos(u/2) * sin(v) - sin(u/2) * sin(2*v)) * sin(u)',
    zExpr: 'sin(u/2) * sin(v) + cos(u/2) * sin(2*v)',
    formula: '克莱因瓶参数方程',
    description: '无内外之分的四维曲面在三维的投影',
    uRange: [0, 2 * Math.PI],
    vRange: [0, 2 * Math.PI]
  },
  {
    name: '圆柱面',
    xExpr: 'cos(u)',
    yExpr: 'sin(u)',
    zExpr: 'v',
    formula: 'x = \\cos u, y = \\sin u, z = v',
    description: '半径为1的圆柱面',
    uRange: [0, 2 * Math.PI],
    vRange: [-2, 2]
  }
]

const chartContainer = ref<HTMLElement | null>(null)
const functionInput = ref('x^2 + y^2')
const xRange = ref<[number, number]>([-3, 3])
const yRange = ref<[number, number]>([-3, 3])
const resolution = ref(50)
const colorScheme = ref('blue-green')
const autoRotate = ref(true)
const isLoading = ref(false)
const currentPreset = ref('抛物面')
const displayOptions = ref<string[]>([])
const functionInfo = ref<{ formula: string; description?: string } | null>({
  formula: 'z = x^2 + y^2',
  description: '椭圆抛物面，开口向上'
})

// 新增：曲面模式（普通/参数）
const surfaceMode = ref<'normal' | 'parametric'>('normal')
const currentParametric = ref<ParametricSurface | null>(null)

// 新增：高级可视化选项
const showGradient = ref(false)
const showTangentPlane = ref(false)
const tangentPoint = ref({ x: 0, y: 0 })
const showCriticalPoints = ref(false)
const criticalPoints = ref<Array<{ x: number; y: number; z: number; type: string }>>([])

let chart: echarts.ECharts | null = null

const colorSchemes: Record<string, string[]> = {
  'blue-green': ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffbf', '#fee090', '#fdae61', '#f46d43', '#d73027'],
  'rainbow': ['#9400D3', '#4B0082', '#0000FF', '#00FF00', '#FFFF00', '#FF7F00', '#FF0000'],
  'heat': ['#000080', '#0000FF', '#00FFFF', '#00FF00', '#FFFF00', '#FF0000', '#800000'],
  'mono': ['#409EFF', '#66b1ff', '#a0cfff', '#c6e2ff', '#e6f2ff']
}

const selectPreset = (preset: PresetFunction) => {
  surfaceMode.value = 'normal'
  currentPreset.value = preset.name
  functionInput.value = preset.expression
  functionInfo.value = {
    formula: preset.formula,
    description: preset.description
  }
  if (preset.xRange) xRange.value = preset.xRange
  if (preset.yRange) yRange.value = preset.yRange
  currentParametric.value = null
  updateSurface()
}

// 新增：选择参数曲面
const selectParametricSurface = (surface: ParametricSurface) => {
  surfaceMode.value = 'parametric'
  currentParametric.value = surface
  currentPreset.value = surface.name
  functionInfo.value = {
    formula: surface.formula,
    description: surface.description
  }
  updateSurface()
}

// 生成参数曲面数据
const generateParametricData = () => {
  if (!currentParametric.value) return []

  const surface = currentParametric.value
  const data: (number | null)[][] = []
  const uMin = surface.uRange[0]
  const uMax = surface.uRange[1]
  const vMin = surface.vRange[0]
  const vMax = surface.vRange[1]
  const uStep = (uMax - uMin) / resolution.value
  const vStep = (vMax - vMin) / resolution.value

  let xFunc: any, yFunc: any, zFunc: any
  try {
    xFunc = math.compile(surface.xExpr)
    yFunc = math.compile(surface.yExpr)
    zFunc = math.compile(surface.zExpr)
  } catch (e) {
    console.error('参数曲面表达式解析错误:', e)
    return data
  }

  for (let i = 0; i <= resolution.value; i++) {
    for (let j = 0; j <= resolution.value; j++) {
      const u = uMin + i * uStep
      const v = vMin + j * vStep
      try {
        const scope = { u, v, pi: Math.PI }
        const x = xFunc.evaluate(scope)
        const y = yFunc.evaluate(scope)
        const z = zFunc.evaluate(scope)
        if (isFinite(x) && isFinite(y) && isFinite(z)) {
          data.push([x, y, z])
        } else {
          data.push([null, null, null])
        }
      } catch {
        data.push([null, null, null])
      }
    }
  }

  return data
}

// 计算数值偏导数
const numericalPartialDerivative = (
  compiledFunc: any,
  x: number,
  y: number,
  variable: 'x' | 'y',
  h = 0.0001
): number => {
  try {
    if (variable === 'x') {
      const f1 = compiledFunc.evaluate({ x: x + h, y })
      const f2 = compiledFunc.evaluate({ x: x - h, y })
      return (f1 - f2) / (2 * h)
    } else {
      const f1 = compiledFunc.evaluate({ x, y: y + h })
      const f2 = compiledFunc.evaluate({ x, y: y - h })
      return (f1 - f2) / (2 * h)
    }
  } catch {
    return NaN
  }
}

// 查找临界点
const findCriticalPoints = () => {
  if (surfaceMode.value !== 'normal') {
    criticalPoints.value = []
    return
  }

  const points: Array<{ x: number; y: number; z: number; type: string }> = []
  let compiledFunc: any

  try {
    compiledFunc = math.compile(functionInput.value)
  } catch {
    criticalPoints.value = []
    return
  }

  const xMin = xRange.value[0]
  const xMax = xRange.value[1]
  const yMin = yRange.value[0]
  const yMax = yRange.value[1]
  const step = 0.5
  const threshold = 0.1

  for (let x = xMin + step; x < xMax - step; x += step) {
    for (let y = yMin + step; y < yMax - step; y += step) {
      const fx = numericalPartialDerivative(compiledFunc, x, y, 'x')
      const fy = numericalPartialDerivative(compiledFunc, x, y, 'y')

      if (Math.abs(fx) < threshold && Math.abs(fy) < threshold) {
        // 计算Hessian矩阵
        const h = 0.01
        const fxx = (compiledFunc.evaluate({ x: x + h, y }) - 2 * compiledFunc.evaluate({ x, y }) + compiledFunc.evaluate({ x: x - h, y })) / (h * h)
        const fyy = (compiledFunc.evaluate({ x, y: y + h }) - 2 * compiledFunc.evaluate({ x, y }) + compiledFunc.evaluate({ x, y: y - h })) / (h * h)
        const fxy = (compiledFunc.evaluate({ x: x + h, y: y + h }) - compiledFunc.evaluate({ x: x + h, y: y - h }) - compiledFunc.evaluate({ x: x - h, y: y + h }) + compiledFunc.evaluate({ x: x - h, y: y - h })) / (4 * h * h)

        const det = fxx * fyy - fxy * fxy
        const z = compiledFunc.evaluate({ x, y })

        let type = '临界点'
        if (det > 0 && fxx > 0) type = '极小值'
        else if (det > 0 && fxx < 0) type = '极大值'
        else if (det < 0) type = '鞍点'

        if (isFinite(z)) {
          points.push({ x, y, z, type })
        }
      }
    }
  }

  criticalPoints.value = points
}

// 生成切平面数据
const generateTangentPlaneData = () => {
  if (surfaceMode.value !== 'normal' || !showTangentPlane.value) return []

  let compiledFunc: any
  try {
    compiledFunc = math.compile(functionInput.value)
  } catch {
    return []
  }

  const x0 = tangentPoint.value.x
  const y0 = tangentPoint.value.y
  const z0 = compiledFunc.evaluate({ x: x0, y: y0 })
  const fx = numericalPartialDerivative(compiledFunc, x0, y0, 'x')
  const fy = numericalPartialDerivative(compiledFunc, x0, y0, 'y')

  if (!isFinite(z0) || !isFinite(fx) || !isFinite(fy)) return []

  // 切平面方程: z - z0 = fx*(x - x0) + fy*(y - y0)
  const data: number[][] = []
  const range = 1.5
  const step = range / 10

  for (let dx = -range; dx <= range; dx += step) {
    for (let dy = -range; dy <= range; dy += step) {
      const x = x0 + dx
      const y = y0 + dy
      const z = z0 + fx * dx + fy * dy
      data.push([x, y, z])
    }
  }

  return data
}

// 生成梯度向量场数据
const generateGradientField = () => {
  if (surfaceMode.value !== 'normal' || !showGradient.value) return []

  let compiledFunc: any
  try {
    compiledFunc = math.compile(functionInput.value)
  } catch {
    return []
  }

  const data: Array<{ start: number[]; end: number[] }> = []
  const xMin = xRange.value[0]
  const xMax = xRange.value[1]
  const yMin = yRange.value[0]
  const yMax = yRange.value[1]
  const step = (xMax - xMin) / 8

  for (let x = xMin + step / 2; x < xMax; x += step) {
    for (let y = yMin + step / 2; y < yMax; y += step) {
      try {
        const z = compiledFunc.evaluate({ x, y })
        const fx = numericalPartialDerivative(compiledFunc, x, y, 'x')
        const fy = numericalPartialDerivative(compiledFunc, x, y, 'y')

        if (isFinite(z) && isFinite(fx) && isFinite(fy)) {
          const mag = Math.sqrt(fx * fx + fy * fy)
          if (mag > 0.01) {
            const scale = Math.min(0.5, mag * 0.3)
            data.push({
              start: [x, y, z + 0.1],
              end: [x + fx * scale / mag, y + fy * scale / mag, z + 0.1]
            })
          }
        }
      } catch {
        // 忽略计算错误
      }
    }
  }

  return data
}

const generateSurfaceData = () => {
  const data: (number | null)[][] = []
  const xMin = xRange.value[0]
  const xMax = xRange.value[1]
  const yMin = yRange.value[0]
  const yMax = yRange.value[1]
  const xStep = (xMax - xMin) / resolution.value
  const yStep = (yMax - yMin) / resolution.value

  // 编译函数表达式
  let compiledFunc: any
  try {
    compiledFunc = math.compile(functionInput.value)
  } catch (e) {
    console.error('函数表达式解析错误:', e)
    return data
  }

  for (let i = 0; i <= resolution.value; i++) {
    for (let j = 0; j <= resolution.value; j++) {
      const x = xMin + i * xStep
      const y = yMin + j * yStep
      try {
        let z = compiledFunc.evaluate({ x, y })
        // 处理无穷大和NaN
        if (!isFinite(z) || isNaN(z)) {
          z = null
        }
        data.push([x, y, z])
      } catch {
        data.push([x, y, null])
      }
    }
  }

  return data
}

const updateSurface = () => {
  if (!chart || !chartContainer.value) return

  isLoading.value = true

  // 先清除旧图表，确保新数据能正确渲染
  chart.clear()

  nextTick(() => {
    // 根据模式生成数据
    const data = surfaceMode.value === 'parametric'
      ? generateParametricData()
      : generateSurfaceData()

    // 计算z的范围用于颜色映射
    const zValues = data.map(d => d[2]).filter(z => z !== null) as number[]
    const zMin = Math.min(...zValues)
    const zMax = Math.max(...zValues)

    // 查找临界点
    if (showCriticalPoints.value && surfaceMode.value === 'normal') {
      findCriticalPoints()
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const option: any = {
      tooltip: {
        show: true,
        formatter: (params: any) => {
          const data = params.data
          if (data && data.length >= 3) {
            return `x: ${data[0].toFixed(2)}<br/>y: ${data[1].toFixed(2)}<br/>z: ${data[2]?.toFixed(2) ?? 'undefined'}`
          }
          return ''
        }
      },
      visualMap: {
        show: true,
        dimension: 2,
        min: zMin,
        max: zMax,
        inRange: {
          color: colorSchemes[colorScheme.value]
        },
        orient: 'vertical',
        right: 10,
        top: 'center',
        text: ['高', '低'],
        textStyle: {
          color: '#666'
        }
      },
      xAxis3D: {
        type: 'value',
        name: 'x'
      },
      yAxis3D: {
        type: 'value',
        name: 'y'
      },
      zAxis3D: {
        type: 'value',
        name: 'z'
      },
      grid3D: {
        viewControl: {
          autoRotate: autoRotate.value,
          autoRotateSpeed: 10,
          distance: 200,
          alpha: 30,
          beta: 40
        },
        light: {
          main: {
            intensity: 1.2,
            shadow: true
          },
          ambient: {
            intensity: 0.3
          }
        },
        boxWidth: 100,
        boxHeight: 80,
        boxDepth: 100
      },
      series: [{
        type: 'surface',
        wireframe: {
          show: displayOptions.value.includes('wireframe')
        },
        shading: displayOptions.value.includes('wireframe') ? 'color' : 'realistic',
        realisticMaterial: {
          roughness: 0.5,
          metalness: 0
        },
        data: data,
        itemStyle: {
          opacity: displayOptions.value.includes('wireframe') ? 0.8 : 0.95
        }
      }]
    }

    // 添加等值线（投影到底部）
    if (displayOptions.value.includes('contour') && surfaceMode.value === 'normal') {
      const contourData: number[][] = []
      const contourLevels = 10
      const zStep = (zMax - zMin) / contourLevels

      for (let level = 0; level < contourLevels; level++) {
        const zLevel = zMin + level * zStep
        for (let i = 0; i < data.length; i++) {
          const point = data[i]
          if (point[2] !== null && Math.abs(point[2]! - zLevel) < zStep / 2) {
            contourData.push([point[0]!, point[1]!, zMin - (zMax - zMin) * 0.1])
          }
        }
      }

      (option.series as any[]).push({
        type: 'scatter3D',
        data: contourData,
        symbolSize: 2,
        itemStyle: {
          color: '#333',
          opacity: 0.6
        }
      })
    }

    // 添加临界点标记
    if (showCriticalPoints.value && criticalPoints.value.length > 0) {
      const criticalPointsData = criticalPoints.value.map(p => ({
        value: [p.x, p.y, p.z],
        name: p.type,
        itemStyle: {
          color: p.type === '极大值' ? '#F56C6C' :
                 p.type === '极小值' ? '#67C23A' :
                 p.type === '鞍点' ? '#E6A23C' : '#909399'
        }
      }));

      (option.series as any[]).push({
        type: 'scatter3D',
        name: '临界点',
        data: criticalPointsData,
        symbolSize: 16,
        symbol: 'pin',
        label: {
          show: true,
          formatter: (params: any) => params.name,
          distance: 10,
          textStyle: {
            fontSize: 12,
            fontWeight: 'bold'
          }
        }
      })
    }

    // 添加切平面
    if (showTangentPlane.value && surfaceMode.value === 'normal') {
      const tangentData = generateTangentPlaneData()
      if (tangentData.length > 0) {
        (option.series as any[]).push({
          type: 'surface',
          name: '切平面',
          data: tangentData,
          wireframe: { show: true },
          shading: 'color',
          itemStyle: {
            color: '#E6A23C',
            opacity: 0.5
          }
        })

        // 添加切点标记
        let compiledFunc: any
        try {
          compiledFunc = math.compile(functionInput.value)
          const z0 = compiledFunc.evaluate({ x: tangentPoint.value.x, y: tangentPoint.value.y });
          (option.series as any[]).push({
            type: 'scatter3D',
            name: '切点',
            data: [[tangentPoint.value.x, tangentPoint.value.y, z0]],
            symbolSize: 14,
            symbol: 'circle',
            itemStyle: {
              color: '#E6A23C',
              borderColor: '#fff',
              borderWidth: 2
            }
          })
        } catch {
          // 忽略错误
        }
      }
    }

    // 添加梯度向量场
    if (showGradient.value && surfaceMode.value === 'normal') {
      const gradientData = generateGradientField()
      gradientData.forEach((arrow, index) => {
        (option.series as any[]).push({
          type: 'line3D',
          name: index === 0 ? '梯度场' : undefined,
          data: [arrow.start, arrow.end],
          lineStyle: {
            color: '#67C23A',
            width: 3
          }
        })
      })
    }

    chart!.setOption(option, true)
    isLoading.value = false
  })
}

const resetView = () => {
  if (!chart) return
  chart.setOption({
    grid3D: {
      viewControl: {
        alpha: 30,
        beta: 40,
        distance: 200
      }
    }
  })
}

const toggleAutoRotate = () => {
  autoRotate.value = !autoRotate.value
  if (chart) {
    chart.setOption({
      grid3D: {
        viewControl: {
          autoRotate: autoRotate.value
        }
      }
    })
  }
}

const renderFormula = (formula: string) => {
  try {
    return katex.renderToString(formula, { throwOnError: false, displayMode: false })
  } catch {
    return formula
  }
}

const handleResize = () => {
  chart?.resize()
}

onMounted(() => {
  if (chartContainer.value) {
    chart = echarts.init(chartContainer.value)
    updateSurface()
    window.addEventListener('resize', handleResize)
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chart?.dispose()
})
</script>

<style lang="scss" scoped>
.surface-3d {
  background-color: var(--card-bg);
  border-radius: 12px;
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.surface-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;

  .header-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    font-size: 16px;
  }

  .header-actions .el-button {
    background-color: rgba(255, 255, 255, 0.2);
    border-color: transparent;
    color: white;

    &:hover {
      background-color: rgba(255, 255, 255, 0.3);
    }
  }
}

.surface-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 16px;
  overflow: hidden;
}

.mode-switch {
  margin-bottom: 16px;
  display: flex;
  justify-content: center;

  :deep(.el-radio-group) {
    background-color: var(--bg-color);
    padding: 4px;
    border-radius: 8px;
  }

  :deep(.el-radio-button__inner) {
    border: none;
    border-radius: 6px !important;
  }

  :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    box-shadow: none;
  }
}

.input-section {
  margin-bottom: 16px;

  .input-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;

    .input-label {
      font-size: 14px;
      font-weight: 500;
      color: var(--text-color);
      white-space: nowrap;
    }

    .function-input {
      flex: 1;
    }
  }

  .preset-row {
    display: flex;
    align-items: center;
    gap: 12px;

    .preset-label {
      font-size: 13px;
      color: var(--text-color-secondary);
      white-space: nowrap;
    }

    .preset-list {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .preset-tag {
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        transform: translateY(-1px);
      }
    }
  }
}

.params-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
  padding: 12px 16px;
  background-color: var(--bg-color);
  border-radius: 8px;

  .param-group {
    .param-label {
      display: block;
      font-size: 12px;
      color: var(--text-color-secondary);
      margin-bottom: 8px;
    }
  }

  .color-group {
    :deep(.el-select) {
      width: 100%;
    }
  }
}

.advanced-options {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 16px;
  padding: 12px 16px;
  background-color: var(--bg-color);
  border-radius: 8px;

  .options-label {
    font-size: 13px;
    color: var(--text-color-secondary);
  }

  :deep(.el-checkbox) {
    margin-right: 0;
  }
}

.tangent-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: linear-gradient(135deg, rgba(230, 162, 60, 0.1) 0%, rgba(255, 149, 0, 0.1) 100%);
  border-radius: 8px;
  border-left: 3px solid #E6A23C;

  .control-label {
    font-size: 13px;
    color: var(--text-color-secondary);
    white-space: nowrap;
  }

  .tangent-inputs {
    display: flex;
    align-items: center;
    gap: 8px;

    span {
      font-size: 13px;
      color: var(--text-color);
    }

    .el-input-number {
      width: 100px;
    }
  }
}

.chart-container {
  flex: 1;
  min-height: 400px;
  background-color: var(--bg-color);
  border-radius: 8px;
}

.critical-points-list {
  margin-top: 12px;
  padding: 12px 16px;
  background-color: var(--bg-color);
  border-radius: 8px;

  h4 {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-color);
    margin: 0 0 10px 0;
  }

  .points-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .point-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 12px;

    &.极大值 {
      background-color: rgba(245, 108, 108, 0.15);
      border-left: 3px solid #F56C6C;
    }

    &.极小值 {
      background-color: rgba(103, 194, 58, 0.15);
      border-left: 3px solid #67C23A;
    }

    &.鞍点 {
      background-color: rgba(230, 162, 60, 0.15);
      border-left: 3px solid #E6A23C;
    }

    .point-type {
      font-weight: 600;
      color: var(--text-color);
    }

    .point-coords {
      font-family: 'SF Mono', Monaco, monospace;
      color: var(--text-color-secondary);
    }
  }
}

.function-info {
  margin-top: 12px;
  padding: 12px 16px;
  background-color: var(--bg-color);
  border-radius: 8px;

  .info-item {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;

    &:last-child {
      margin-bottom: 0;
    }

    .info-label {
      font-size: 13px;
      color: var(--text-color-secondary);
    }

    .info-value {
      font-size: 14px;
      color: var(--text-color);
    }
  }
}

.tips-section {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  font-size: 12px;
  color: var(--text-color-placeholder);

  .el-icon {
    font-size: 14px;
  }
}

@media (max-width: 768px) {
  .params-section {
    grid-template-columns: repeat(2, 1fr);
  }

  .advanced-options {
    flex-direction: column;
    align-items: flex-start;
  }

  .tangent-controls {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
