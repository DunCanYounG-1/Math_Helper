import { defineStore } from 'pinia'

export interface FunctionParameter {
  name: string
  value: number
  min: number
  max: number
  step: number
}

export interface FunctionItem {
  id: string
  expression: string
  color: string
  visible: boolean
  parameters: FunctionParameter[]
}

export interface GraphState {
  functions: FunctionItem[]
  xRange: [number, number]
  yRange: [number, number]
  showGrid: boolean
  showSpecialPoints: boolean
  activeFunction: string | null
}

const colors = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399', '#9C27B0']

export const useGraphStore = defineStore('graph', {
  state: (): GraphState => ({
    functions: [],
    xRange: [-10, 10],
    yRange: [-10, 10],
    showGrid: true,
    showSpecialPoints: true,
    activeFunction: null
  }),

  getters: {
    visibleFunctions: (state) => state.functions.filter((f) => f.visible),

    getFunctionById: (state) => (id: string) =>
      state.functions.find((f) => f.id === id)
  },

  actions: {
    addFunction(expression: string = ''): string {
      const id = `func_${Date.now()}`
      this.functions.push({
        id,
        expression,
        color: colors[this.functions.length % colors.length],
        visible: true,
        parameters: []
      })
      return id
    },

    updateFunction(id: string, updates: Partial<FunctionItem>) {
      const index = this.functions.findIndex((f) => f.id === id)
      if (index !== -1) {
        this.functions[index] = { ...this.functions[index], ...updates }
      }
    },

    removeFunction(id: string) {
      this.functions = this.functions.filter((f) => f.id !== id)
    },

    toggleFunctionVisibility(id: string) {
      const func = this.functions.find((f) => f.id === id)
      if (func) {
        func.visible = !func.visible
      }
    },

    updateParameter(funcId: string, paramName: string, value: number) {
      const func = this.functions.find((f) => f.id === funcId)
      if (func) {
        const param = func.parameters.find((p) => p.name === paramName)
        if (param) {
          param.value = value
        }
      }
    },

    setXRange(range: [number, number]) {
      this.xRange = range
    },

    setYRange(range: [number, number]) {
      this.yRange = range
    },

    clearAll() {
      this.functions = []
      this.activeFunction = null
    }
  }
})
