/**
 * 数学相关类型定义
 */

export interface Point2D {
  x: number
  y: number
}

export interface Point3D {
  x: number
  y: number
  z: number
}

export interface Range {
  min: number
  max: number
}

export interface ParseResult {
  success: boolean
  expression?: any
  variables: string[]
  error?: string
}

export interface SpecialPoint {
  type: 'maximum' | 'minimum' | 'inflection' | 'zero'
  x: number
  y: number
  label?: string
}

export interface FunctionData {
  expression: string
  points: Point2D[]
  specialPoints: SpecialPoint[]
}

export interface AnimationConfig {
  duration: number
  fps: number
  easing: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut'
}

export interface VisualizationConfig {
  type: string
  params: Record<string, any>
}
