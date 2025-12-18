/**
 * 共享的 mathjs 实例
 * 避免在多个组件中重复创建实例，减少包体积
 */
import { create, all, type MathJsInstance } from 'mathjs'

// 创建单例 mathjs 实例
export const math: MathJsInstance = create(all)

// 导出常用函数的快捷方式
export const compile = math.compile.bind(math)
export const evaluate = math.evaluate.bind(math)
export const parse = math.parse.bind(math)
export const derivative = math.derivative.bind(math)
export const simplify = math.simplify.bind(math)

// 安全求值函数（处理无穷大和NaN）
export function safeEvaluate(
  expression: string,
  scope: Record<string, number>
): number | null {
  try {
    const compiled = math.compile(expression)
    const result = compiled.evaluate(scope)
    if (!isFinite(result) || isNaN(result)) {
      return null
    }
    return result
  } catch {
    return null
  }
}

// 批量计算函数值（用于绑图）
export function evaluateRange(
  expression: string,
  variable: string,
  start: number,
  end: number,
  steps: number
): Array<{ x: number; y: number | null }> {
  const compiled = math.compile(expression)
  const step = (end - start) / steps
  const result: Array<{ x: number; y: number | null }> = []

  for (let i = 0; i <= steps; i++) {
    const x = start + i * step
    try {
      const y = compiled.evaluate({ [variable]: x })
      result.push({
        x,
        y: isFinite(y) && !isNaN(y) ? y : null
      })
    } catch {
      result.push({ x, y: null })
    }
  }

  return result
}

// 计算二元函数值（用于3D曲面）
export function evaluate3D(
  expression: string,
  xRange: [number, number],
  yRange: [number, number],
  resolution: number
): Array<[number, number, number | null]> {
  const compiled = math.compile(expression)
  const xStep = (xRange[1] - xRange[0]) / resolution
  const yStep = (yRange[1] - yRange[0]) / resolution
  const result: Array<[number, number, number | null]> = []

  for (let i = 0; i <= resolution; i++) {
    for (let j = 0; j <= resolution; j++) {
      const x = xRange[0] + i * xStep
      const y = yRange[0] + j * yStep
      try {
        const z = compiled.evaluate({ x, y })
        result.push([x, y, isFinite(z) && !isNaN(z) ? z : null])
      } catch {
        result.push([x, y, null])
      }
    }
  }

  return result
}

export default math
