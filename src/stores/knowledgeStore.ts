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
  examFrequency?: 'very-high' | 'high' | 'medium' | 'low'
  memoryTip?: string
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
  visualizationConfig?: Record<string, any>
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
  // 索引 Map - 用于 O(1) 快速查找
  _formulaIndex: Map<string, Formula>
  _metaphorIndex: Map<string, Metaphor>
  _exampleIndex: Map<string, Example>
  _knowledgePointIndex: Map<string, KnowledgePoint>
  _chapterIndex: Map<string, Chapter>
  // 关联索引 - 用于快速获取关联数据
  _formulasByKpId: Map<string, Formula[]>
  _metaphorsByKpId: Map<string, Metaphor[]>
  _examplesByKpId: Map<string, Example[]>
  _mistakesByKpId: Map<string, CommonMistake[]>
  _mistakesByFormulaId: Map<string, CommonMistake[]>
  _kpsByChapterId: Map<string, KnowledgePoint[]>
  _kpsBySectionId: Map<string, KnowledgePoint[]>
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
    isLoading: false,
    // 索引初始化
    _formulaIndex: new Map(),
    _metaphorIndex: new Map(),
    _exampleIndex: new Map(),
    _knowledgePointIndex: new Map(),
    _chapterIndex: new Map(),
    _formulasByKpId: new Map(),
    _metaphorsByKpId: new Map(),
    _examplesByKpId: new Map(),
    _mistakesByKpId: new Map(),
    _mistakesByFormulaId: new Map(),
    _kpsByChapterId: new Map(),
    _kpsBySectionId: new Map()
  }),

  getters: {
    currentChapter: (state): Chapter | undefined => {
      if (!state.currentChapterId) return undefined
      // 使用索引 O(1) 查找
      return state._chapterIndex.get(state.currentChapterId)
    },

    currentKnowledgePoint: (state): KnowledgePoint | undefined => {
      if (!state.currentKnowledgePointId) return undefined
      // 使用索引 O(1) 查找
      return state._knowledgePointIndex.get(state.currentKnowledgePointId)
    },

    getChapterById: (state) => (id: string) => {
      // 使用索引 O(1) 查找
      return state._chapterIndex.get(id)
    },

    getKnowledgePointById: (state) => (id: string) => {
      // 使用索引 O(1) 查找
      return state._knowledgePointIndex.get(id)
    },

    getKnowledgePointsByChapter: (state) => (chapterId: string) => {
      // 使用关联索引 O(1) 查找
      return state._kpsByChapterId.get(chapterId) || []
    },

    getKnowledgePointsBySection: (state) => (sectionId: string) => {
      // 使用关联索引 O(1) 查找
      return state._kpsBySectionId.get(sectionId) || []
    },

    getFormulasByKnowledgePoint: (state) => (kpId: string) => {
      // 使用关联索引 O(1) 查找
      return state._formulasByKpId.get(kpId) || []
    },

    getMetaphorsByKnowledgePoint: (state) => (kpId: string) => {
      // 使用关联索引 O(1) 查找
      return state._metaphorsByKpId.get(kpId) || []
    },

    getExamplesByKnowledgePoint: (state) => (kpId: string) => {
      // 使用关联索引 O(1) 查找
      return state._examplesByKpId.get(kpId) || []
    },

    getPrerequisites: (state) => (kpId: string) => {
      const kp = state._knowledgePointIndex.get(kpId)
      if (!kp) return []
      // 使用索引查找前置知识点
      return kp.prerequisites
        .map((id) => state._knowledgePointIndex.get(id))
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
      // 使用关联索引 O(1) 查找
      return state._mistakesByFormulaId.get(formulaId) || []
    },

    // 获取知识点相关的常见错误
    getCommonMistakesByKnowledgePoint: (state) => (kpId: string) => {
      // 使用关联索引 O(1) 查找
      return state._mistakesByKpId.get(kpId) || []
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
        // 1. 加载原始数据
        this.chapters = chaptersData as Chapter[]
        this.formulas = formulasData as Formula[]
        this.metaphors = metaphorsData as Metaphor[]
        this.examples = examplesData as Example[]
        this.commonMistakes = commonMistakesData as CommonMistake[]

        // 2. 构建章节索引
        for (const chapter of this.chapters) {
          this._chapterIndex.set(chapter.id, chapter)
        }

        // 3. 构建公式索引和关联索引
        for (const formula of this.formulas) {
          this._formulaIndex.set(formula.id, formula)
          // 按知识点ID分组
          const kpFormulas = this._formulasByKpId.get(formula.knowledgePointId) || []
          kpFormulas.push(formula)
          this._formulasByKpId.set(formula.knowledgePointId, kpFormulas)
        }

        // 4. 构建比喻索引和关联索引
        for (const metaphor of this.metaphors) {
          this._metaphorIndex.set(metaphor.id, metaphor)
          // 按知识点ID分组
          const kpMetaphors = this._metaphorsByKpId.get(metaphor.knowledgePointId) || []
          kpMetaphors.push(metaphor)
          this._metaphorsByKpId.set(metaphor.knowledgePointId, kpMetaphors)
        }

        // 5. 构建例题索引和关联索引
        for (const example of this.examples) {
          this._exampleIndex.set(example.id, example)
          // 按知识点ID分组
          const kpExamples = this._examplesByKpId.get(example.knowledgePointId) || []
          kpExamples.push(example)
          this._examplesByKpId.set(example.knowledgePointId, kpExamples)
        }

        // 6. 构建常见错误索引
        for (const mistake of this.commonMistakes) {
          // 按知识点ID分组
          const kpMistakes = this._mistakesByKpId.get(mistake.knowledgePointId) || []
          kpMistakes.push(mistake)
          this._mistakesByKpId.set(mistake.knowledgePointId, kpMistakes)
          // 按公式ID分组
          const formulaMistakes = this._mistakesByFormulaId.get(mistake.formulaId) || []
          formulaMistakes.push(mistake)
          this._mistakesByFormulaId.set(mistake.formulaId, formulaMistakes)
        }

        // 7. 加载知识点并使用索引进行 O(1) 关联（原来是 O(n²)）
        const rawKnowledgePoints = knowledgePointsData as KnowledgePointData[]
        this.knowledgePoints = rawKnowledgePoints.map((kp) => {
          // 使用索引获取关联的公式（O(1) 查找 + O(m) 映射，m为公式数量）
          const associatedFormulas = kp.formulas
            .map(id => this._formulaIndex.get(id))
            .filter((f): f is Formula => f !== undefined)

          // 使用索引获取关联的比喻
          const associatedMetaphors = kp.metaphors
            .map(id => this._metaphorIndex.get(id))
            .filter((m): m is Metaphor => m !== undefined)

          // 使用关联索引获取例题（O(1) 查找）
          const associatedExamples = this._examplesByKpId.get(kp.id) || []

          return {
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
            formulas: associatedFormulas,
            metaphors: associatedMetaphors,
            examples: associatedExamples
          }
        })

        // 8. 构建知识点索引和分组索引
        for (const kp of this.knowledgePoints) {
          this._knowledgePointIndex.set(kp.id, kp)
          // 按章节ID分组
          const chapterKps = this._kpsByChapterId.get(kp.chapterId) || []
          chapterKps.push(kp)
          this._kpsByChapterId.set(kp.chapterId, chapterKps)
          // 按节ID分组
          const sectionKps = this._kpsBySectionId.get(kp.sectionId) || []
          sectionKps.push(kp)
          this._kpsBySectionId.set(kp.sectionId, sectionKps)
        }

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
        // 使用索引 O(1) 查找
        const kp = this._knowledgePointIndex.get(id)
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
      // 更新索引
      this._metaphorIndex.set(metaphor.id, metaphor)
      // 更新关联索引
      const kpMetaphors = this._metaphorsByKpId.get(metaphor.knowledgePointId) || []
      kpMetaphors.push(metaphor)
      this._metaphorsByKpId.set(metaphor.knowledgePointId, kpMetaphors)
      // 更新对应知识点的比喻列表（使用索引 O(1) 查找）
      const kp = this._knowledgePointIndex.get(metaphor.knowledgePointId)
      if (kp) {
        kp.metaphors.push(metaphor)
      }
    }
  }
})
