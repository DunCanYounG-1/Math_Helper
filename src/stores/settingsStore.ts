import { defineStore } from 'pinia'
import type { AIProvider } from '@/services/aiService'

export interface SettingsState {
  theme: 'light' | 'dark'
  animationSpeed: number
  defaultXRange: [number, number]
  // AI 配置
  aiProvider: AIProvider
  aiApiKey: string
  aiModel: string
  language: string
}

const STORAGE_KEY = 'mathhelper_settings'

export const useSettingsStore = defineStore('settings', {
  state: (): SettingsState => ({
    theme: 'light',
    animationSpeed: 1,
    defaultXRange: [-20, 20],
    // AI 配置默认值
    aiProvider: 'qwen',
    aiApiKey: '',
    aiModel: 'qwen-turbo',
    language: 'zh-CN'
  }),

  actions: {
    setTheme(theme: 'light' | 'dark') {
      this.theme = theme
      document.documentElement.setAttribute('data-theme', theme)
      this.saveToStorage()
    },

    setAnimationSpeed(speed: number) {
      this.animationSpeed = speed
      this.saveToStorage()
    },

    setDefaultXRange(range: [number, number]) {
      this.defaultXRange = range
      this.saveToStorage()
    },

    setAIProvider(provider: AIProvider) {
      this.aiProvider = provider
      this.saveToStorage()
    },

    setAIApiKey(key: string) {
      this.aiApiKey = key
      this.saveToStorage()
    },

    setAIModel(model: string) {
      this.aiModel = model
      this.saveToStorage()
    },

    loadFromStorage() {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        try {
          const settings = JSON.parse(saved)
          Object.assign(this.$state, settings)
          // 应用主题
          document.documentElement.setAttribute('data-theme', this.theme)
        } catch (e) {
          console.error('Failed to load settings:', e)
        }
      }
    },

    saveToStorage() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.$state))
      } catch (e) {
        console.error('Failed to save settings:', e)
      }
    },

    resetToDefault() {
      this.$reset()
      this.saveToStorage()
      document.documentElement.setAttribute('data-theme', 'light')
    }
  }
})
