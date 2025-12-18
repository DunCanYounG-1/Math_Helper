/**
 * 特殊点计算工具
 * 使用数值方法查找函数的极值点、拐点和零点
 */

export interface SpecialPoint {
  type: 'maximum' | 'minimum' | 'inflection' | 'zero'
  x: number
  y: number
}

/**
 * 数值求导（中心差分法）
 */
function numericalDerivative(
  f: (x: number) => number,
  x: number,
  h: number = 1e-6
): number {
  return (f(x + h) - f(x - h)) / (2 * h)
}

/**
 * 数值求二阶导数
 */
function numericalSecondDerivative(
  f: (x: number) => number,
  x: number,
  h: number = 1e-5
): number {
  return (f(x + h) - 2 * f(x) + f(x - h)) / (h * h)
}

/**
 * 二分法求根
 */
function bisectionMethod(
  f: (x: number) => number,
  a: number,
  b: number,
  tol: number = 1e-8,
  maxIter: number = 100
): number | null {
  let fa = f(a)
  let fb = f(b)

  if (fa * fb > 0) return null // 无法确定有根

  for (let i = 0; i < maxIter; i++) {
    const c = (a + b) / 2
    const fc = f(c)

    if (Math.abs(fc) < tol || (b - a) / 2 < tol) {
      return c
    }

    if (fa * fc < 0) {
      b = c
      fb = fc
    } else {
      a = c
      fa = fc
    }
  }

  return (a + b) / 2
}

/**
 * 查找函数的零点
 */
export function findZeros(
  f: (x: number) => number,
  xRange: [number, number],
  resolution: number = 200
): SpecialPoint[] {
  const zeros: SpecialPoint[] = []
  const [xMin, xMax] = xRange
  const step = (xMax - xMin) / resolution
  const foundX = new Set<string>()

  for (let x = xMin; x < xMax; x += step) {
    try {
      const y1 = f(x)
      const y2 = f(x + step)

      // 检测符号变化（说明有零点）
      if (Number.isFinite(y1) && Number.isFinite(y2) && y1 * y2 < 0) {
        const root = bisectionMethod(f, x, x + step)
        if (root !== null) {
          const key = root.toFixed(4)
          if (!foundX.has(key)) {
            foundX.add(key)
            zeros.push({
              type: 'zero',
              x: root,
              y: 0
            })
          }
        }
      }

      // 检测接近零的点
      if (Math.abs(y1) < 1e-6 && Number.isFinite(y1)) {
        const key = x.toFixed(4)
        if (!foundX.has(key)) {
          foundX.add(key)
          zeros.push({
            type: 'zero',
            x: x,
            y: y1
          })
        }
      }
    } catch {
      // 跳过计算错误的点
    }
  }

  return zeros
}

/**
 * 查找极值点（极大值和极小值）
 */
export function findExtrema(
  f: (x: number) => number,
  xRange: [number, number],
  resolution: number = 200
): SpecialPoint[] {
  const extrema: SpecialPoint[] = []
  const [xMin, xMax] = xRange
  const step = (xMax - xMin) / resolution
  const foundX = new Set<string>()

  // 导数函数
  const df = (x: number) => numericalDerivative(f, x)

  for (let x = xMin + step; x < xMax - step; x += step) {
    try {
      const df1 = df(x)
      const df2 = df(x + step)

      // 检测导数符号变化
      if (Number.isFinite(df1) && Number.isFinite(df2) && df1 * df2 < 0) {
        // 使用二分法精确找到导数为零的点
        const criticalX = bisectionMethod(df, x, x + step)

        if (criticalX !== null) {
          const key = criticalX.toFixed(4)
          if (!foundX.has(key)) {
            foundX.add(key)

            const y = f(criticalX)
            if (!Number.isFinite(y)) continue

            // 用二阶导数判断极值类型
            const d2f = numericalSecondDerivative(f, criticalX)

            if (d2f < -1e-6) {
              // 极大值
              extrema.push({
                type: 'maximum',
                x: criticalX,
                y: y
              })
            } else if (d2f > 1e-6) {
              // 极小值
              extrema.push({
                type: 'minimum',
                x: criticalX,
                y: y
              })
            }
            // 如果二阶导数接近0，可能是拐点，不作为极值
          }
        }
      }
    } catch {
      // 跳过计算错误的点
    }
  }

  return extrema
}

/**
 * 查找拐点（二阶导数为零且变号的点）
 */
export function findInflectionPoints(
  f: (x: number) => number,
  xRange: [number, number],
  resolution: number = 200
): SpecialPoint[] {
  const inflections: SpecialPoint[] = []
  const [xMin, xMax] = xRange
  const step = (xMax - xMin) / resolution
  const foundX = new Set<string>()

  // 二阶导数函数
  const d2f = (x: number) => numericalSecondDerivative(f, x)

  for (let x = xMin + step; x < xMax - step; x += step) {
    try {
      const d2f1 = d2f(x)
      const d2f2 = d2f(x + step)

      // 检测二阶导数符号变化
      if (Number.isFinite(d2f1) && Number.isFinite(d2f2) && d2f1 * d2f2 < 0) {
        const inflectionX = bisectionMethod(d2f, x, x + step)

        if (inflectionX !== null) {
          const key = inflectionX.toFixed(4)
          if (!foundX.has(key)) {
            foundX.add(key)

            const y = f(inflectionX)
            if (Number.isFinite(y)) {
              inflections.push({
                type: 'inflection',
                x: inflectionX,
                y: y
              })
            }
          }
        }
      }
    } catch {
      // 跳过计算错误的点
    }
  }

  return inflections
}

/**
 * 查找所有特殊点
 */
export function findAllSpecialPoints(
  f: (x: number) => number,
  xRange: [number, number],
  options?: {
    findZeros?: boolean
    findExtrema?: boolean
    findInflections?: boolean
    resolution?: number
  }
): SpecialPoint[] {
  const {
    findZeros: doFindZeros = true,
    findExtrema: doFindExtrema = true,
    findInflections: doFindInflections = true,
    resolution = 200
  } = options || {}

  const points: SpecialPoint[] = []

  if (doFindZeros) {
    points.push(...findZeros(f, xRange, resolution))
  }

  if (doFindExtrema) {
    points.push(...findExtrema(f, xRange, resolution))
  }

  if (doFindInflections) {
    points.push(...findInflectionPoints(f, xRange, resolution))
  }

  // 按x坐标排序
  return points.sort((a, b) => a.x - b.x)
}

/**
 * 获取特殊点的显示配置
 */
export function getSpecialPointStyle(type: SpecialPoint['type']): {
  color: string
  symbol: string
  label: string
} {
  switch (type) {
    case 'maximum':
      return { color: '#F56C6C', symbol: 'triangle', label: '极大值' }
    case 'minimum':
      return { color: '#409EFF', symbol: 'triangle', label: '极小值' }
    case 'inflection':
      return { color: '#67C23A', symbol: 'diamond', label: '拐点' }
    case 'zero':
      return { color: '#E6A23C', symbol: 'circle', label: '零点' }
  }
}
