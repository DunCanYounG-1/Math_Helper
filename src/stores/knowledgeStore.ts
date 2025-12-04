import { defineStore } from 'pinia'
import chaptersData from '@/data/knowledgeBase/chapters.json'
import knowledgePointsData from '@/data/knowledgeBase/knowledgePoints.json'
import formulasData from '@/data/knowledgeBase/formulas.json'
import metaphorsData from '@/data/knowledgeBase/metaphors.json'
import examplesData from '@/data/knowledgeBase/examples.json'
import commonMistakesData from '@/data/knowledgeBase/commonMistakes.json'

export interface Formula {
  id: string
  knowledgePointId: string
  name: string
  latex: string
  description: string
}

export interface Metaphor {
  id: string
  knowledgePointId: string
  title: string
  content: string
  type: 'preset' | 'ai-generated'
  tags: string[]
}

export interface ExampleStep {
  title: string
  content: string
}

export interface ExampleSolution {
  analysis: string
  steps: ExampleStep[]
  answer: string
}

export interface Example {
  id: string
  knowledgePointId: string
  title: string
  difficulty: 'basic' | 'intermediate' | 'advanced'
  problem: string
  solution: ExampleSolution
  tags: string[]
}

export interface MistakeItem {
  wrong: string
  correct: string
  tip: string
}

export interface CommonMistake {
  id: string
  formulaId: string
  knowledgePointId: string
  title: string
  mistakes: MistakeItem[]
  severity: 'high' | 'medium' | 'low'
  examFrequency: 'very-high' | 'high' | 'medium' | 'low'
}

export interface KnowledgePointData {
  id: string
  chapterId: string
  sectionId: string
  title: string
  description: string
  keyPoints: string[]
  formulas: string[]
  metaphors: string[]
  prerequisites: string[]
  hasVisualization: boolean
  visualizationType?: string
  examFrequency: string
  difficulty: number
}

export interface KnowledgePoint {
  id: string
  chapterId: string
  sectionId: string
  title: string
  description: string
  keyPoints: string[]
  metaphors: Metaphor[]
  formulas: Formula[]
  examples: Example[]
  prerequisites: string[]
  hasVisualization: boolean
  visualizationType?: string
  examFrequency?: 'very-high' | 'high' | 'medium' | 'low'
  difficulty: number
}

export interface Section {
  id: string
  title: string
  knowledgePoints: string[]
}

export interface Chapter {
  id: string
  title: string
  order: number
  description: string
  sections: Section[]
}

export interface KnowledgeState {
  chapters: Chapter[]
  knowledgePoints: KnowledgePoint[]
  formulas: Formula[]
  metaphors: Metaphor[]
  examples: Example[]
  commonMistakes: CommonMistake[]
  currentChapterId: string | null
  currentSectionId: string | null
  currentKnowledgePointId: string | null
  expandedChapters: string[]
  isLoading: boolean
}

export const useKnowledgeStore = defineStore('knowledge', {
  state: (): KnowledgeState => ({
    chapters: [],
    knowledgePoints: [],
    formulas: [],
    metaphors: [],
    examples: [],
    commonMistakes: [],
    currentChapterId: null,
    currentSectionId: null,
    currentKnowledgePointId: null,
    expandedChapters: [],
    isLoading: false
  }),

  getters: {
    currentChapter: (state): Chapter | undefined => {
      if (!state.currentChapterId) return undefined
      return state.chapters.find((ch) => ch.id === state.currentChapterId)
    },

    currentKnowledgePoint: (state): KnowledgePoint | undefined => {
      if (!state.currentKnowledgePointId) return undefined
      return state.knowledgePoints.find(
        (kp) => kp.id === state.currentKnowledgePointId
      )
    },

    getChapterById: (state) => (id: string) => {
      return state.chapters.find((ch) => ch.id === id)
    },

    getKnowledgePointById: (state) => (id: string) => {
      return state.knowledgePoints.find((kp) => kp.id === id)
    },

    getKnowledgePointsByChapter: (state) => (chapterId: string) => {
      return state.knowledgePoints.filter((kp) => kp.chapterId === chapterId)
    },

    getKnowledgePointsBySection: (state) => (sectionId: string) => {
      return state.knowledgePoints.filter((kp) => kp.sectionId === sectionId)
    },

    getFormulasByKnowledgePoint: (state) => (kpId: string) => {
      return state.formulas.filter((f) => f.knowledgePointId === kpId)
    },

    getMetaphorsByKnowledgePoint: (state) => (kpId: string) => {
      return state.metaphors.filter((m) => m.knowledgePointId === kpId)
    },

    getExamplesByKnowledgePoint: (state) => (kpId: string) => {
      return state.examples.filter((e) => e.knowledgePointId === kpId)
    },

    getPrerequisites: (state) => (kpId: string) => {
      const kp = state.knowledgePoints.find((k) => k.id === kpId)
      if (!kp) return []
      return kp.prerequisites
        .map((id) => state.knowledgePoints.find((k) => k.id === id))
        .filter(Boolean) as KnowledgePoint[]
    },

    // 获取章节的学习进度（预留）
    getChapterProgress: () => (_chapterId: string) => {
      // TODO: 实现学习进度追踪
      return 0
    },

    // 获取高频考点
    getHighFrequencyPoints: (state) => {
      return state.knowledgePoints.filter(
        (kp) => kp.examFrequency === 'very-high' || kp.examFrequency === 'high'
      )
    },

    // 搜索知识点
    searchKnowledgePoints: (state) => (query: string) => {
      const lowerQuery = query.toLowerCase()
      return state.knowledgePoints.filter(
        (kp) =>
          kp.title.toLowerCase().includes(lowerQuery) ||
          kp.description.toLowerCase().includes(lowerQuery) ||
          kp.keyPoints.some((point) => point.toLowerCase().includes(lowerQuery))
      )
    },

    // 获取公式相关的常见错误
    getCommonMistakesByFormula: (state) => (formulaId: string) => {
      return state.commonMistakes.filter((cm) => cm.formulaId === formulaId)
    },

    // 获取知识点相关的常见错误
    getCommonMistakesByKnowledgePoint: (state) => (kpId: string) => {
      return state.commonMistakes.filter((cm) => cm.knowledgePointId === kpId)
    },

    // 获取高频易错点
    getHighFrequencyMistakes: (state) => {
      return state.commonMistakes.filter(
        (cm) => cm.examFrequency === 'very-high' || cm.examFrequency === 'high'
      )
    }
  },

  actions: {
    async loadKnowledgeData() {
      if (this.chapters.length > 0) return // 已加载

      this.isLoading = true
      try {
        // 加载章节数据
        this.chapters = chaptersData as Chapter[]

        // 加载公式数据
        this.formulas = formulasData as Formula[]

        // 加载比喻数据
        this.metaphors = metaphorsData as Metaphor[]

        // 加载例题数据
        this.examples = examplesData as Example[]

        // 加载常见错误数据
        this.commonMistakes = commonMistakesData as CommonMistake[]

        // 加载知识点数据并关联公式、比喻和例题
        const rawKnowledgePoints = knowledgePointsData as KnowledgePointData[]
        this.knowledgePoints = rawKnowledgePoints.map((kp) => ({
          id: kp.id,
          chapterId: kp.chapterId,
          sectionId: kp.sectionId,
          title: kp.title,
          description: kp.description,
          keyPoints: kp.keyPoints,
          prerequisites: kp.prerequisites,
          hasVisualization: kp.hasVisualization,
          visualizationType: kp.visualizationType,
          examFrequency: kp.examFrequency as KnowledgePoint['examFrequency'],
          difficulty: kp.difficulty,
          // 关联公式
          formulas: this.formulas.filter((f) => kp.formulas.includes(f.id)),
          // 关联比喻
          metaphors: this.metaphors.filter((m) => kp.metaphors.includes(m.id)),
          // 关联例题
          examples: this.examples.filter((e) => e.knowledgePointId === kp.id)
        }))

        // 默认展开第一章
        if (this.chapters.length > 0) {
          this.expandedChapters = [this.chapters[0].id]
        }
      } finally {
        this.isLoading = false
      }
    },

    setCurrentChapter(id: string | null) {
      this.currentChapterId = id
      if (id && !this.expandedChapters.includes(id)) {
        this.expandedChapters.push(id)
      }
    },

    setCurrentSection(id: string | null) {
      this.currentSectionId = id
    },

    setCurrentKnowledgePoint(id: string | null) {
      this.currentKnowledgePointId = id
      if (id) {
        const kp = this.knowledgePoints.find((k) => k.id === id)
        if (kp) {
          this.currentChapterId = kp.chapterId
          this.currentSectionId = kp.sectionId
          // 确保章节展开
          if (!this.expandedChapters.includes(kp.chapterId)) {
            this.expandedChapters.push(kp.chapterId)
          }
        }
      }
    },

    toggleChapter(chapterId: string) {
      const index = this.expandedChapters.indexOf(chapterId)
      if (index === -1) {
        this.expandedChapters.push(chapterId)
      } else {
        this.expandedChapters.splice(index, 1)
      }
    },

    // 添加AI生成的比喻
    addMetaphor(metaphor: Metaphor) {
      this.metaphors.push(metaphor)
      // 更新对应知识点的比喻列表
      const kp = this.knowledgePoints.find(
        (k) => k.id === metaphor.knowledgePointId
      )
      if (kp) {
        kp.metaphors.push(metaphor)
      }
    }
  }
})
