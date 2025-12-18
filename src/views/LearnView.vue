<template>
  <div class="learn-view">
    <div class="learn-content">
      <!-- 知识点内容区 -->
      <div v-if="currentKnowledgePoint" class="knowledge-content card">
        <!-- 面包屑导航 -->
        <el-breadcrumb separator="/" class="knowledge-breadcrumb">
          <el-breadcrumb-item :to="{ name: 'Home' }">首页</el-breadcrumb-item>
          <el-breadcrumb-item :to="{ name: 'Learn' }">知识学习</el-breadcrumb-item>
          <el-breadcrumb-item v-if="breadcrumbData.chapter">{{ breadcrumbData.chapter }}</el-breadcrumb-item>
          <el-breadcrumb-item v-if="breadcrumbData.section">{{ breadcrumbData.section }}</el-breadcrumb-item>
          <el-breadcrumb-item>{{ currentKnowledgePoint.title }}</el-breadcrumb-item>
        </el-breadcrumb>

        <!-- 进度指示器 -->
        <div class="chapter-progress" v-if="chapterProgress">
          <div class="progress-info">
            <span class="progress-chapter">{{ chapterProgress.chapterTitle }}</span>
            <span class="progress-text">{{ chapterProgress.completed }}/{{ chapterProgress.total }} 已完成</span>
          </div>
          <el-progress
            :percentage="chapterProgress.percentage"
            :stroke-width="6"
            :show-text="false"
            color="#67C23A"
          />
        </div>

        <!-- 标题栏 -->
        <div class="knowledge-header">
          <h2 class="knowledge-title">{{ currentKnowledgePoint.title }}</h2>
          <div class="knowledge-actions">
            <!-- 收藏按钮 -->
            <el-button
              :type="isFavorited ? 'warning' : 'default'"
              :icon="isFavorited ? StarFilled : Star"
              circle
              @click="toggleFavorite"
              :title="isFavorited ? '取消收藏' : '收藏'"
            />
            <!-- 学习状态 -->
            <el-dropdown @command="handleStatusChange">
              <el-button :type="statusButtonType">
                {{ statusLabel }}
                <el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="in-progress">
                    <el-icon><Clock /></el-icon> 学习中
                  </el-dropdown-item>
                  <el-dropdown-item command="completed">
                    <el-icon><Check /></el-icon> 已完成
                  </el-dropdown-item>
                  <el-dropdown-item command="mastered">
                    <el-icon><Trophy /></el-icon> 已掌握
                  </el-dropdown-item>
                  <el-dropdown-item command="not-started" divided>
                    <el-icon><RefreshRight /></el-icon> 重置状态
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
        <div class="knowledge-desc markdown-content" v-html="renderMarkdown(currentKnowledgePoint.description)"></div>

        <!-- 可视化动画区 -->
        <div v-if="currentKnowledgePoint.hasVisualization && getVisualizationComponent(currentKnowledgePoint.visualizationType)" class="visualization-area">
          <component
            :is="getVisualizationComponent(currentKnowledgePoint.visualizationType)"
            :config="currentKnowledgePoint.visualizationConfig"
          />
        </div>

        <!-- 核心要点 -->
        <div v-if="currentKnowledgePoint.keyPoints?.length" class="key-points-section">
          <h3>核心要点</h3>
          <ul class="key-points-list">
            <li v-for="(point, index) in currentKnowledgePoint.keyPoints" :key="index" v-html="renderMarkdown(point)">
            </li>
          </ul>
        </div>

        <!-- AI比喻区 -->
        <div class="metaphor-section">
          <h3>
            <el-icon><MagicStick /></el-icon>
            理解助手 - 比喻解读
          </h3>
          <div class="metaphor-list">
            <div
              v-for="metaphor in currentKnowledgePoint.metaphors"
              :key="metaphor.id"
              class="metaphor-item"
              :class="{ 'ai-generated': metaphor.type === 'ai-generated' }"
            >
              <div class="metaphor-header">
                <span class="metaphor-title">{{ metaphor.title }}</span>
                <div class="metaphor-tags">
                  <el-tag
                    v-for="tag in metaphor.tags"
                    :key="tag"
                    size="small"
                    type="info"
                  >
                    {{ tag }}
                  </el-tag>
                </div>
              </div>
              <div class="metaphor-content markdown-content" v-html="renderMarkdown(metaphor.content)"></div>
            </div>
          </div>
          <el-button
            type="primary"
            plain
            :loading="isGenerating"
            @click="generateNewMetaphor"
          >
            <el-icon v-if="!isGenerating"><MagicStick /></el-icon>
            {{ isGenerating ? '生成中...' : 'AI生成新比喻' }}
          </el-button>
        </div>

        <!-- 相关公式 -->
        <div v-if="currentKnowledgePoint.formulas?.length" class="formulas-section">
          <h3>
            <el-icon><Document /></el-icon>
            相关公式
            <span class="formula-count">（{{ currentKnowledgePoint.formulas.length }} 个）</span>
          </h3>
          <div class="formula-list">
            <div
              v-for="formula in currentKnowledgePoint.formulas"
              :key="formula.id"
              class="formula-card"
            >
              <div class="formula-header">
                <div class="formula-header-left">
                  <span class="formula-name">{{ formula.name }}</span>
                  <!-- 考试频率标签 -->
                  <el-tag
                    v-if="formula.examFrequency"
                    :type="getExamFrequencyType(formula.examFrequency)"
                    size="small"
                    class="exam-frequency-tag"
                  >
                    <el-icon v-if="formula.examFrequency === 'very-high'"><Star /></el-icon>
                    {{ getExamFrequencyLabel(formula.examFrequency) }}
                  </el-tag>
                </div>
                <el-button
                  size="small"
                  text
                  :icon="expandedFormulas.has(formula.id) ? ArrowUp : ArrowDown"
                  @click="toggleFormulaExpand(formula.id)"
                >
                  {{ expandedFormulas.has(formula.id) ? '收起' : '详解' }}
                </el-button>
              </div>
              <div class="formula-latex" v-html="renderFormula(formula.latex, true)"></div>

              <!-- 公式描述 -->
              <div class="formula-description">
                <el-icon><InfoFilled /></el-icon>
                <span>{{ formula.description }}</span>
              </div>

              <!-- 展开的详细解释 -->
              <el-collapse-transition>
                <div v-if="expandedFormulas.has(formula.id)" class="formula-details">
                  <div class="detail-section">
                    <div class="detail-label">
                      <el-icon><Aim /></el-icon>
                      公式含义
                    </div>
                    <div class="detail-content">{{ getFormulaMeaning(formula) }}</div>
                  </div>
                  <div class="detail-section">
                    <div class="detail-label">
                      <el-icon><SetUp /></el-icon>
                      应用场景
                    </div>
                    <div class="detail-content">{{ getFormulaUsage(formula) }}</div>
                  </div>
                  <div class="detail-section" v-if="getFormulaExample(formula)">
                    <div class="detail-label">
                      <el-icon><EditPen /></el-icon>
                      使用示例
                    </div>
                    <div class="detail-content formula-example" v-html="renderFormula(getFormulaExample(formula), true)"></div>
                  </div>
                  <!-- 记忆口诀 -->
                  <div class="detail-section memory-tip-section" v-if="formula.memoryTip">
                    <div class="detail-label">
                      <el-icon><MagicStick /></el-icon>
                      记忆口诀
                    </div>
                    <div class="detail-content memory-tip">{{ formula.memoryTip }}</div>
                  </div>
                </div>
              </el-collapse-transition>
            </div>
          </div>
        </div>

        <!-- 易错点提醒 -->
        <CommonMistakesPanel
          v-if="currentMistakes.length > 0"
          :mistakes="currentMistakes"
          :initial-expanded="true"
        />

        <!-- 典型例题 -->
        <div v-if="currentKnowledgePoint.examples?.length" class="examples-section">
          <h3>
            <el-icon><EditPen /></el-icon>
            典型例题
            <span class="examples-count">（{{ currentKnowledgePoint.examples.length }} 道）</span>
          </h3>
          <div class="examples-list">
            <ExampleDisplay
              v-for="example in currentKnowledgePoint.examples"
              :key="example.id"
              :example="example"
            />
          </div>
        </div>

        <!-- 笔记区域 -->
        <NotesSection :knowledge-point-id="currentKnowledgePoint.id" />

        <!-- 相关知识点 -->
        <div class="related-section" v-if="relatedKnowledgePoints.prev.length || relatedKnowledgePoints.next.length">
          <h3>
            <el-icon><Connection /></el-icon>
            相关知识点
          </h3>
          <div class="related-grid">
            <!-- 前置知识 -->
            <div class="related-group" v-if="relatedKnowledgePoints.prev.length">
              <div class="related-label">
                <el-icon><Back /></el-icon>
                前置知识
              </div>
              <div class="related-list">
                <div
                  v-for="kp in relatedKnowledgePoints.prev"
                  :key="kp.id"
                  class="related-item"
                  @click="goToKnowledgePoint(kp.id)"
                >
                  <span class="related-title">{{ kp.title }}</span>
                  <el-icon class="related-arrow"><Right /></el-icon>
                </div>
              </div>
            </div>
            <!-- 后继知识 -->
            <div class="related-group" v-if="relatedKnowledgePoints.next.length">
              <div class="related-label">
                <el-icon><Right /></el-icon>
                后继知识
              </div>
              <div class="related-list">
                <div
                  v-for="kp in relatedKnowledgePoints.next"
                  :key="kp.id"
                  class="related-item"
                  @click="goToKnowledgePoint(kp.id)"
                >
                  <span class="related-title">{{ kp.title }}</span>
                  <el-icon class="related-arrow"><Right /></el-icon>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 快速操作区 -->
        <div class="quick-actions-section">
          <h3>
            <el-icon><Opportunity /></el-icon>
            下一步
          </h3>
          <div class="quick-actions">
            <div class="action-card" @click="goToPractice">
              <el-icon :size="28"><EditPen /></el-icon>
              <span class="action-title">开始练习</span>
              <span class="action-desc">通过例题巩固所学</span>
            </div>
            <div class="action-card" @click="goToFormula">
              <el-icon :size="28"><Document /></el-icon>
              <span class="action-title">公式速查</span>
              <span class="action-desc">快速查阅相关公式</span>
            </div>
            <div class="action-card" v-if="nextKnowledgePoint" @click="goToKnowledgePoint(nextKnowledgePoint.id)">
              <el-icon :size="28"><Right /></el-icon>
              <span class="action-title">继续学习</span>
              <span class="action-desc">{{ nextKnowledgePoint.title }}</span>
            </div>
          </div>
        </div>

        <!-- 前后导航 -->
        <div class="nav-footer">
          <el-button
            v-if="prevKnowledgePoint"
            @click="goToKnowledgePoint(prevKnowledgePoint.id)"
            class="nav-btn prev"
          >
            <el-icon><ArrowLeft /></el-icon>
            <div class="nav-info">
              <span class="nav-label">上一节</span>
              <span class="nav-title">{{ prevKnowledgePoint.title }}</span>
            </div>
          </el-button>
          <div v-else class="nav-placeholder"></div>

          <el-button
            v-if="nextKnowledgePoint"
            @click="goToKnowledgePoint(nextKnowledgePoint.id)"
            class="nav-btn next"
            type="primary"
          >
            <div class="nav-info">
              <span class="nav-label">下一节</span>
              <span class="nav-title">{{ nextKnowledgePoint.title }}</span>
            </div>
            <el-icon><ArrowRight /></el-icon>
          </el-button>
          <div v-else class="nav-placeholder"></div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="empty-state card">
        <el-icon :size="64"><Reading /></el-icon>
        <h3>选择一个知识点开始学习</h3>
        <p>从左侧章节树中选择您想要学习的知识点</p>
      </div>
    </div>

    <!-- AI 智能问答面板 -->
    <ChatPanel :knowledge-point-id="currentKnowledgePoint?.id" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, defineAsyncComponent } from 'vue'
import { useRoute } from 'vue-router'
import { Reading, MagicStick, Star, StarFilled, ArrowDown, ArrowUp, ArrowLeft, ArrowRight, Clock, Check, Trophy, RefreshRight, EditPen, Document, InfoFilled, Aim, SetUp, Connection, Back, Right, Opportunity } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useKnowledgeStore, type Metaphor } from '@/stores/knowledgeStore'
import ExampleDisplay from '@/components/knowledge/ExampleDisplay.vue'
import NotesSection from '@/components/knowledge/NotesSection.vue'
import CommonMistakesPanel from '@/components/learn/CommonMistakesPanel.vue'
import ChatPanel from '@/components/ai/ChatPanel.vue'
import { useSettingsStore } from '@/stores/settingsStore'
import { useProgressStore } from '@/stores/progressStore'
import { createMetaphor, setAIConfig, isConfigured } from '@/services/aiService'
import { renderMarkdown, renderFormula } from '@/utils/latex'
import 'katex/dist/katex.min.css'

const route = useRoute()
const router = useRouter()
const knowledgeStore = useKnowledgeStore()
const settingsStore = useSettingsStore()
const progressStore = useProgressStore()

const isGenerating = ref(false)
const expandedFormulas = ref(new Set<string>())

// 公式展开/收起
const toggleFormulaExpand = (formulaId: string) => {
  if (expandedFormulas.value.has(formulaId)) {
    expandedFormulas.value.delete(formulaId)
  } else {
    expandedFormulas.value.add(formulaId)
  }
  // 触发响应式更新
  expandedFormulas.value = new Set(expandedFormulas.value)
}

// 公式详解 - 含义
const formulaMeanings: Record<string, string> = {
  // 导数公式
  'f-2-1-1': '导数表示函数在某点的瞬时变化率，通过极限过程将"平均变化率"精确化为"瞬时变化率"。几何上，导数值就是函数图像在该点切线的斜率。',
  'f-2-1-3': '常数不随自变量变化，所以其变化率恒为0。这是最基本的导数公式。',
  'f-2-1-4': '幂函数求导时，指数降下来作为系数，同时指数减1。这个公式适用于任意实数指数。',
  'f-2-1-5': '根式函数可以写成分数指数幂的形式，再应用幂函数求导公式。',
  'f-2-1-6': '指数函数e^x的导数就是它本身，这是e的一个重要特性。对于一般底数a，需要乘以ln(a)。',
  'f-2-1-7': '自然对数ln(x)的导数是1/x。对于其他底数的对数，需要除以ln(底数)。',
  'f-2-1-8': '正弦函数的导数是余弦函数，余弦函数的导数是负的正弦函数。可以用单位圆或极限定义来证明。',
  'f-2-1-9': '正切函数的导数是正割的平方（或1/cos²x），余切函数的导数是负的余割的平方。',
  'f-2-2-1': '函数和（差）的导数等于导数的和（差）。这说明求导运算是线性运算。',
  'f-2-2-2': '乘积的导数不等于导数的乘积！而是"前导后不导 + 前不导后导"。',
  'f-2-2-3': '商的导数公式可以记忆为"下乘上导减上乘下导，结果除以下的平方"。',
  'f-2-2-4': '链式法则将复合函数的导数分解为各层函数导数的乘积，是最常用的求导法则之一。',
  // 极限公式
  'f-1-6-1': '当角度趋近于0时，正弦值和角度值几乎相等（弧度制）。这个极限是推导三角函数导数的基础。',
  'f-1-6-3': '这个极限定义了自然对数的底e≈2.718。它描述了复利增长在连续复利时的极限。',
  // 积分公式
  'f-4-1-1': '不定积分是求导的逆运算，找出所有导数等于被积函数的函数。由于常数的导数为0，所以需要加任意常数C。',
  'f-4-1-2': '幂函数积分时，指数加1，同时除以新的指数。这是幂函数求导公式的逆运算。',
  'f-4-3-1': '分部积分将两函数乘积的积分转化为另一个积分，选择合适的u和dv是关键。',
  'f-5-2-2': '牛顿-莱布尼茨公式是微积分的核心定理，它将定积分的计算转化为求原函数的差值。'
}

// 公式详解 - 应用场景
const formulaUsages: Record<string, string> = {
  'f-2-1-1': '① 求函数在某点的切线方程 ② 判断函数的单调性 ③ 求函数的极值和最值 ④ 物理中求瞬时速度、加速度',
  'f-2-1-3': '① 处理含常数项的函数求导 ② 简化复杂函数的导数计算',
  'f-2-1-4': '① 求多项式函数的导数 ② 处理含根式的函数（转化为分数指数）③ 求幂函数型函数的极值',
  'f-2-1-6': '① 处理指数增长/衰减问题 ② 复利计算 ③ 放射性衰变 ④ 人口增长模型',
  'f-2-1-7': '① 对数函数的求导 ② 使用对数求导法简化复杂乘积/商/幂的求导',
  'f-2-1-8': '① 三角函数的求导 ② 简谐运动的速度和加速度 ③ 波动方程的分析',
  'f-2-2-2': '① 两函数乘积的求导 ② 多项式与其他函数乘积的求导',
  'f-2-2-4': '① 复合函数求导（最常用）② 隐函数求导 ③ 参数方程求导',
  'f-1-6-1': '① 三角函数极限计算 ② 证明三角函数的导数 ③ 等价无穷小替换',
  'f-1-6-3': '① 1^∞型极限的计算 ② 指数函数极限 ③ 自然对数相关计算',
  'f-4-1-1': '① 求不定积分 ② 求微分方程的通解 ③ 求曲线下面积（结合定积分）',
  'f-4-3-1': '① 对数函数、反三角函数的积分 ② 指数函数与多项式乘积的积分 ③ 三角函数与多项式乘积的积分',
  'f-5-2-2': '① 计算定积分 ② 求曲线下面积 ③ 求旋转体体积 ④ 求弧长'
}

// 公式详解 - 使用示例
const formulaExamples: Record<string, string> = {
  'f-2-1-4': '\\text{例：} (x^3)\' = 3x^2, \\quad (\\sqrt{x})\' = (x^{1/2})\' = \\frac{1}{2}x^{-1/2} = \\frac{1}{2\\sqrt{x}}',
  'f-2-1-6': '\\text{例：} (2^x)\' = 2^x \\ln 2, \\quad (e^{2x})\' = 2e^{2x}',
  'f-2-2-2': '\\text{例：} (x^2 \\sin x)\' = 2x \\sin x + x^2 \\cos x',
  'f-2-2-4': '\\text{例：} (\\sin(x^2))\' = \\cos(x^2) \\cdot 2x = 2x\\cos(x^2)',
  'f-1-6-1': '\\text{例：} \\lim_{x \\to 0} \\frac{\\sin 3x}{x} = \\lim_{x \\to 0} \\frac{3 \\sin 3x}{3x} = 3',
  'f-4-1-2': '\\text{例：} \\int x^3 dx = \\frac{x^4}{4} + C, \\quad \\int \\frac{1}{\\sqrt{x}} dx = 2\\sqrt{x} + C'
}

const getFormulaMeaning = (formula: any) => {
  return formulaMeanings[formula.id] || '这个公式描述了数学中一个重要的关系或运算规则，是进行相关计算的基础工具。'
}

const getFormulaUsage = (formula: any) => {
  return formulaUsages[formula.id] || '① 相关知识点的计算和证明 ② 解决具体数学问题 ③ 为更高级的概念提供基础'
}

const getFormulaExample = (formula: any) => {
  return formulaExamples[formula.id] || ''
}

// 考试频率标签类型
const getExamFrequencyType = (freq: string): 'primary' | 'success' | 'warning' | 'info' | 'danger' => {
  const types: Record<string, 'primary' | 'success' | 'warning' | 'info' | 'danger'> = {
    'very-high': 'danger',
    'high': 'warning',
    'medium': 'info',
    'low': 'info'
  }
  return types[freq] || 'info'
}

// 考试频率标签文字
const getExamFrequencyLabel = (freq: string) => {
  const labels: Record<string, string> = {
    'very-high': '必考',
    'high': '高频',
    'medium': '中频',
    'low': '低频'
  }
  return labels[freq] || freq
}

// 相关知识点（前置和后继）
const relatedKnowledgePoints = computed(() => {
  const kp = currentKnowledgePoint.value
  if (!kp) return { prev: [] as Array<{ id: string; title: string }>, next: [] as Array<{ id: string; title: string }> }

  // 前置知识点
  const prev = (kp.prerequisites || [])
    .map((id: string) => knowledgeStore.getKnowledgePointById(id))
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .map(item => ({ id: item.id, title: item.title }))
    .slice(0, 3)

  // 后继知识点（依赖当前知识点的）
  const next = knowledgeStore.knowledgePoints
    .filter(other => other.prerequisites?.includes(kp.id))
    .map(item => ({ id: item.id, title: item.title }))
    .slice(0, 3)

  return { prev, next }
})

// 前后知识点导航
const allKnowledgePointIds = computed(() => {
  const ids: string[] = []
  knowledgeStore.chapters.forEach(chapter => {
    chapter.sections.forEach(section => {
      ids.push(...section.knowledgePoints)
    })
  })
  return ids
})

const prevKnowledgePoint = computed(() => {
  const kp = currentKnowledgePoint.value
  if (!kp) return null
  const currentIndex = allKnowledgePointIds.value.indexOf(kp.id)
  if (currentIndex > 0) {
    return knowledgeStore.getKnowledgePointById(allKnowledgePointIds.value[currentIndex - 1])
  }
  return null
})

const nextKnowledgePoint = computed(() => {
  const kp = currentKnowledgePoint.value
  if (!kp) return null
  const currentIndex = allKnowledgePointIds.value.indexOf(kp.id)
  if (currentIndex >= 0 && currentIndex < allKnowledgePointIds.value.length - 1) {
    return knowledgeStore.getKnowledgePointById(allKnowledgePointIds.value[currentIndex + 1])
  }
  return null
})

// 导航方法
const goToKnowledgePoint = (id: string) => {
  router.push(`/learn/${id}`)
}

const goToPractice = () => {
  router.push('/practice')
}

const goToFormula = () => {
  router.push('/formula')
}

// 进度追踪相关
const currentStatus = computed(() => {
  const kp = currentKnowledgePoint.value
  if (!kp) return 'not-started'
  return progressStore.getStatus(kp.id)
})

const statusLabel = computed(() => {
  const labels: Record<string, string> = {
    'not-started': '未学习',
    'in-progress': '学习中',
    'completed': '已完成',
    'mastered': '已掌握'
  }
  return labels[currentStatus.value] || '未学习'
})

const statusButtonType = computed((): '' | 'default' | 'text' | 'primary' | 'success' | 'warning' | 'info' | 'danger' => {
  const types: Record<string, '' | 'default' | 'text' | 'primary' | 'success' | 'warning' | 'info' | 'danger'> = {
    'not-started': 'info',
    'in-progress': 'warning',
    'completed': 'success',
    'mastered': 'primary'
  }
  return types[currentStatus.value] || 'info'
})

const isFavorited = computed(() => {
  const kp = currentKnowledgePoint.value
  if (!kp) return false
  return progressStore.isFavorite(kp.id, 'knowledge-point')
})

// 面包屑数据
const breadcrumbData = computed(() => {
  const kp = currentKnowledgePoint.value
  if (!kp) return { chapter: '', section: '' }

  // 使用索引 O(1) 查找
  const chapter = knowledgeStore.getChapterById(kp.chapterId)
  if (!chapter) return { chapter: '', section: '' }

  let sectionTitle = ''
  for (const section of chapter.sections) {
    if (section.knowledgePoints.includes(kp.id)) {
      sectionTitle = section.title
      break
    }
  }

  return {
    chapter: chapter.title.replace(/^第.章\s*/, ''),
    section: sectionTitle
  }
})

// 章节进度
const chapterProgress = computed(() => {
  const kp = currentKnowledgePoint.value
  if (!kp) return null

  // 使用索引 O(1) 查找
  const chapter = knowledgeStore.getChapterById(kp.chapterId)
  if (!chapter) return null

  // 获取章节下所有知识点ID
  const allKpIds: string[] = []
  chapter.sections.forEach(section => {
    allKpIds.push(...section.knowledgePoints)
  })

  const progress = progressStore.getChapterProgress(chapter.id, allKpIds)

  return {
    chapterTitle: chapter.title,
    ...progress
  }
})

const handleStatusChange = (status: string) => {
  const kp = currentKnowledgePoint.value
  if (!kp) return

  switch (status) {
    case 'in-progress':
      progressStore.startLearning(kp.id)
      break
    case 'completed':
      progressStore.markAsCompleted(kp.id)
      ElMessage.success('已标记为完成')
      break
    case 'mastered':
      progressStore.markAsMastered(kp.id)
      ElMessage.success('已标记为掌握')
      break
    case 'not-started':
      progressStore.resetStatus(kp.id)
      ElMessage.info('已重置学习状态')
      break
  }
}

const toggleFavorite = () => {
  const kp = currentKnowledgePoint.value
  if (!kp) return

  if (isFavorited.value) {
    progressStore.removeFavorite(kp.id, 'knowledge-point')
    ElMessage.info('已取消收藏')
  } else {
    progressStore.addFavorite({ id: kp.id, type: 'knowledge-point' })
    ElMessage.success('已添加收藏')
  }
}

// 监听知识点变化，自动开始学习
watch(() => currentKnowledgePoint.value?.id, (newId, oldId) => {
  if (oldId) {
    progressStore.endLearningSession()
  }
  if (newId) {
    progressStore.startLearning(newId)
  }
}, { immediate: true })

// 可视化组件映射 - 优化：每种组件只定义一次，避免重复创建 AsyncComponent
const LimitAnimation = defineAsyncComponent(() => import('@/components/visualization/LimitAnimation.vue'))
const DerivativeAnimation = defineAsyncComponent(() => import('@/components/visualization/DerivativeAnimation.vue'))
const MeanValueAnimation = defineAsyncComponent(() => import('@/components/visualization/MeanValueAnimation.vue'))
const InteractiveFunctionPlot = defineAsyncComponent(() => import('@/components/visualization/InteractiveFunctionPlot.vue'))
const IntegralAnimation = defineAsyncComponent(() => import('@/components/visualization/IntegralAnimation.vue'))
const TaylorAnimation = defineAsyncComponent(() => import('@/components/visualization/TaylorAnimation.vue'))

// 将知识点中的 visualizationType 映射到实际的组件
const visualizationComponents: Record<string, ReturnType<typeof defineAsyncComponent>> = {
  // 极限相关
  'limit': LimitAnimation,
  'limit-animation': LimitAnimation,
  'sequence-limit': LimitAnimation,
  'first-limit': LimitAnimation,
  'second-limit': LimitAnimation,
  'infinitesimal-compare': LimitAnimation,
  'continuity': LimitAnimation,
  'discontinuity': LimitAnimation,

  // 导数相关
  'derivative': DerivativeAnimation,
  'derivative-definition': DerivativeAnimation,
  'chain-rule': DerivativeAnimation,
  'higher-derivatives': DerivativeAnimation,
  'implicit-derivative': DerivativeAnimation,
  'differential': DerivativeAnimation,
  'rolle-theorem': DerivativeAnimation,

  // 中值定理
  'mean-value': MeanValueAnimation,

  // 交互式函数图
  'interactive-plot': InteractiveFunctionPlot,
  'function-explorer': InteractiveFunctionPlot,

  // 函数应用相关
  'function-plot': InteractiveFunctionPlot,
  'function-properties': InteractiveFunctionPlot,
  'monotonicity': DerivativeAnimation,
  'extrema': DerivativeAnimation,
  'concavity': DerivativeAnimation,
  'asymptote': DerivativeAnimation,

  // 积分相关
  'integral': IntegralAnimation,
  'antiderivative': IntegralAnimation,
  'definite-integral': IntegralAnimation,
  'ftc': IntegralAnimation,
  'integral-applications': IntegralAnimation,

  // 泰勒级数相关
  'taylor': TaylorAnimation,
  'power-series': TaylorAnimation,
  'series-convergence': TaylorAnimation,

  // 微分方程相关 - 使用导数动画
  'direction-field': DerivativeAnimation
}

const currentKnowledgePoint = computed(() => {
  const id = route.params.knowledgePointId as string
  if (id) {
    return knowledgeStore.getKnowledgePointById(id)
  }
  return knowledgeStore.currentKnowledgePoint
})

// 获取当前知识点的常见错误
const currentMistakes = computed(() => {
  if (!currentKnowledgePoint.value) return []
  return knowledgeStore.getCommonMistakesByKnowledgePoint(currentKnowledgePoint.value.id)
})

const getVisualizationComponent = (type: string | undefined): ReturnType<typeof defineAsyncComponent> | null => {
  if (!type) return null
  return visualizationComponents[type] || null
}

const generateNewMetaphor = async () => {
  const kp = currentKnowledgePoint.value
  if (!kp) return

  // 检查API Key配置
  if (settingsStore.aiApiKey) {
    setAIConfig({ apiKey: settingsStore.aiApiKey })
  }

  if (!isConfigured()) {
    try {
      const { value } = await ElMessageBox.prompt(
        '请输入通义千问API Key以启用AI生成功能（可在设置页面配置）',
        '配置AI服务',
        {
          confirmButtonText: '确定',
          cancelButtonText: '使用模拟数据',
          inputPlaceholder: 'sk-xxxxxxxx',
          distinguishCancelAndClose: true
        }
      )
      if (value) {
        settingsStore.setAIApiKey(value)
        setAIConfig({ apiKey: value })
      }
    } catch (action) {
      if (action === 'cancel') {
        // 使用模拟数据
        ElMessage.info('将使用模拟数据生成比喻')
      } else {
        return
      }
    }
  }

  isGenerating.value = true
  try {
    const result = await createMetaphor({
      knowledgePointTitle: kp.title,
      knowledgePointDescription: kp.description,
      keyPoints: kp.keyPoints || [],
      existingMetaphors: kp.metaphors.map(m => m.title)
    })

    // 创建新比喻对象
    const newMetaphor: Metaphor = {
      id: `m-ai-${Date.now()}`,
      knowledgePointId: kp.id,
      title: result.title,
      content: result.content,
      type: 'ai-generated',
      tags: result.tags
    }

    // 添加到store
    knowledgeStore.addMetaphor(newMetaphor)
    ElMessage.success('新比喻已生成！')

  } catch (error) {
    ElMessage.error((error as Error).message || '生成比喻失败')
  } finally {
    isGenerating.value = false
  }
}

onMounted(() => {
  // 数据已在 App.vue 中全局加载，无需重复加载
  // 初始化AI配置
  if (settingsStore.aiApiKey) {
    setAIConfig({ apiKey: settingsStore.aiApiKey })
  }
})

onUnmounted(() => {
  // 结束当前学习会话
  progressStore.endLearningSession()
})
</script>

<style lang="scss" scoped>
// ============================================
// iOS 风格学习视图
// ============================================
.learn-view {
  height: 100%;
  overflow: auto;
  background-color: var(--bg-color);
}

.learn-content {
  min-height: 100%;
  padding: var(--spacing-md);
}

.knowledge-content {
  min-height: auto;
  background-color: var(--card-bg);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-lg);
}

// iOS 风格面包屑
.knowledge-breadcrumb {
  margin-bottom: var(--spacing-md);
  padding: var(--spacing-sm) 0;

  :deep(.el-breadcrumb__item) {
    .el-breadcrumb__inner {
      color: var(--text-color-tertiary);
      font-size: 13px;

      &.is-link:hover {
        color: var(--primary-color);
      }
    }

    &:last-child .el-breadcrumb__inner {
      color: var(--text-color);
      font-weight: 500;
    }
  }
}

// iOS 风格进度条
.chapter-progress {
  margin-bottom: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--bg-color);
  border-radius: var(--border-radius);

  .progress-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-sm);

    .progress-chapter {
      font-size: 13px;
      color: var(--text-color);
      font-weight: 500;
    }

    .progress-text {
      font-size: 12px;
      color: var(--text-color-tertiary);
      font-feature-settings: 'tnum';
    }
  }
}

// iOS 大标题风格
.knowledge-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-sm);
  gap: var(--spacing-md);
}

.knowledge-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-color);
  margin: 0;
  flex: 1;
  letter-spacing: -0.01em;
}

.knowledge-actions {
  display: flex;
  gap: var(--spacing-sm);
  flex-shrink: 0;
}

.knowledge-desc {
  color: var(--text-color-secondary);
  line-height: 1.7;
  margin-bottom: var(--spacing-lg);
  font-size: 15px;
}

// iOS 风格可视化区域
.visualization-area {
  background-color: var(--bg-color);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
  min-height: 400px;
}

// iOS 风格要点列表
.key-points-section {
  margin-bottom: var(--spacing-lg);

  h3 {
    font-size: 17px;
    font-weight: 600;
    margin-bottom: var(--spacing-sm);
    color: var(--text-color);
  }

  .key-points-list {
    list-style: none;
    padding: 0;
    background-color: var(--bg-color);
    border-radius: var(--border-radius);
    overflow: hidden;

    li {
      position: relative;
      padding: 11px var(--spacing-md) 11px 32px;
      line-height: 1.7;
      font-size: 15px;

      &::before {
        content: '';
        position: absolute;
        left: var(--spacing-md);
        top: 50%;
        transform: translateY(-50%);
        width: 6px;
        height: 6px;
        background-color: var(--primary-color);
        border-radius: 50%;
      }

      // iOS 分隔线
      &:not(:last-child)::after {
        content: '';
        position: absolute;
        left: 32px;
        right: 0;
        bottom: 0;
        height: 0.5px;
        background-color: var(--separator-color);
      }
    }
  }
}

// iOS 风格比喻区
.metaphor-section {
  margin-bottom: var(--spacing-lg);

  h3 {
    font-size: 17px;
    font-weight: 600;
    margin-bottom: var(--spacing-sm);
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    color: var(--text-color);

    .el-icon {
      color: var(--primary-color);
    }
  }
}

.metaphor-list {
  margin-bottom: var(--spacing-sm);
}

.metaphor-item {
  padding: var(--spacing-md);
  background-color: var(--primary-color-light);
  border-radius: var(--border-radius);
  margin-bottom: var(--spacing-sm);
  border-left: 3px solid var(--primary-color);

  &.ai-generated {
    border-left-color: var(--ios-green);
    background-color: rgba(52, 199, 89, 0.1);
  }

  .metaphor-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: var(--spacing-sm);
    flex-wrap: wrap;
    gap: var(--spacing-sm);
  }

  .metaphor-title {
    font-weight: 600;
    color: var(--text-color);
    font-size: 15px;
  }

  .metaphor-tags {
    display: flex;
    gap: var(--spacing-xs);
    flex-wrap: wrap;
  }

  .metaphor-content {
    line-height: 1.7;
    color: var(--text-color-secondary);
    white-space: pre-wrap;
    font-size: 15px;
  }
}

// iOS 风格公式区
.formulas-section {
  margin-bottom: var(--spacing-lg);

  h3 {
    font-size: 17px;
    font-weight: 600;
    margin-bottom: var(--spacing-sm);
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    color: var(--text-color);

    .el-icon {
      color: var(--primary-color);
    }

    .formula-count {
      font-size: 13px;
      font-weight: 400;
      color: var(--text-color-tertiary);
    }
  }
}

.formula-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

// iOS 风格公式卡片
.formula-card {
  padding: var(--spacing-md);
  background-color: var(--bg-color);
  border-radius: var(--border-radius);
  transition: all 0.25s var(--transition-timing);

  &:active {
    background-color: var(--active-bg);
  }

  .formula-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-sm);
  }

  .formula-header-left {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    flex-wrap: wrap;
  }

  .formula-name {
    font-weight: 600;
    font-size: 15px;
    color: var(--text-color);
  }

  .exam-frequency-tag {
    display: inline-flex;
    align-items: center;
    gap: 2px;

    .el-icon {
      font-size: 12px;
    }
  }

  .formula-latex {
    text-align: center;
    padding: var(--spacing-md);
    background-color: var(--card-bg);
    border-radius: var(--border-radius);
    margin-bottom: var(--spacing-sm);

    :deep(.katex) {
      font-size: 1.15em;
    }
  }

  .formula-description {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm) var(--spacing-md);
    background-color: rgba(0, 122, 255, 0.08);
    border-radius: var(--border-radius);
    font-size: 14px;
    line-height: 1.6;
    color: var(--text-color-secondary);

    .el-icon {
      color: var(--primary-color);
      flex-shrink: 0;
      margin-top: 2px;
    }
  }

  .formula-details {
    margin-top: var(--spacing-md);
    padding-top: var(--spacing-md);
    border-top: 0.5px solid var(--separator-color);

    .detail-section {
      margin-bottom: var(--spacing-md);

      &:last-child {
        margin-bottom: 0;
      }

      .detail-label {
        display: flex;
        align-items: center;
        gap: var(--spacing-xs);
        font-size: 13px;
        font-weight: 600;
        color: var(--text-color);
        margin-bottom: var(--spacing-xs);
        text-transform: uppercase;
        letter-spacing: 0.02em;

        .el-icon {
          color: var(--primary-color);
        }
      }

      .detail-content {
        font-size: 14px;
        line-height: 1.7;
        color: var(--text-color-secondary);
        padding-left: var(--spacing-lg);
      }

      .formula-example {
        background-color: var(--card-bg);
        padding: var(--spacing-sm) var(--spacing-md);
        border-radius: var(--border-radius);
        margin-left: 0;
        padding-left: var(--spacing-md);

        :deep(.katex) {
          font-size: 1.1em;
        }
      }

      // iOS 风格记忆口诀
      &.memory-tip-section {
        background: linear-gradient(135deg, rgba(52, 199, 89, 0.1) 0%, rgba(90, 200, 250, 0.1) 100%);
        padding: var(--spacing-sm) var(--spacing-md);
        border-radius: var(--border-radius);
        border-left: 3px solid var(--ios-green);

        .detail-label {
          color: var(--ios-green);

          .el-icon {
            color: var(--ios-green);
          }
        }

        .memory-tip {
          padding-left: 0;
          font-size: 14px;
          line-height: 1.7;
          color: var(--text-color);
          font-weight: 500;
        }
      }
    }
  }
}

.examples-section {
  margin-top: var(--spacing-xl);
  padding-top: var(--spacing-lg);
  border-top: 0.5px solid var(--separator-color);

  h3 {
    font-size: 17px;
    font-weight: 600;
    margin-bottom: var(--spacing-md);
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    color: var(--text-color);

    .el-icon {
      color: var(--primary-color);
    }

    .examples-count {
      font-size: 13px;
      font-weight: 400;
      color: var(--text-color-tertiary);
    }
  }
}

.examples-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

// iOS 风格空状态
.empty-state {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: var(--spacing-xl);

  .el-icon {
    color: var(--text-color-placeholder);
    margin-bottom: var(--spacing-md);
  }

  h3 {
    font-size: 17px;
    color: var(--text-color);
    margin-bottom: var(--spacing-sm);
  }

  p {
    color: var(--text-color-tertiary);
    font-size: 15px;
  }
}

// iOS 风格 Markdown 内容
.markdown-content {
  :deep(p) {
    margin: 0 0 0.5em 0;
    line-height: 1.7;

    &:last-child {
      margin-bottom: 0;
    }
  }

  :deep(h1), :deep(h2), :deep(h3), :deep(h4), :deep(h5), :deep(h6) {
    margin: 1em 0 0.5em 0;
    font-weight: 600;
    line-height: 1.4;
  }

  :deep(ul), :deep(ol) {
    padding-left: 1.5em;
    margin: 0.5em 0;
  }

  :deep(li) {
    margin-bottom: 0.25em;
    line-height: 1.7;
  }

  :deep(code) {
    background-color: rgba(0, 122, 255, 0.1);
    padding: 0.2em 0.4em;
    border-radius: 4px;
    font-family: 'SF Mono', 'Consolas', monospace;
    font-size: 0.9em;
    color: var(--primary-color);
  }

  :deep(pre) {
    background-color: var(--bg-color);
    padding: var(--spacing-sm) var(--spacing-md);
    border-radius: var(--border-radius);
    overflow-x: auto;
    margin: 0.5em 0;

    code {
      background: none;
      padding: 0;
      color: inherit;
    }
  }

  :deep(blockquote) {
    border-left: 3px solid var(--primary-color);
    padding-left: var(--spacing-md);
    margin: 0.5em 0;
    color: var(--text-color-secondary);
  }

  :deep(table) {
    width: 100%;
    border-collapse: collapse;
    margin: 0.5em 0;
    border-radius: var(--border-radius);
    overflow: hidden;

    th, td {
      border: 0.5px solid var(--separator-color);
      padding: var(--spacing-sm) var(--spacing-md);
      text-align: left;
    }

    th {
      background-color: var(--bg-color);
      font-weight: 600;
    }
  }

  :deep(a) {
    color: var(--primary-color);
    text-decoration: none;
  }

  :deep(strong) {
    font-weight: 600;
    color: var(--text-color);
  }

  :deep(hr) {
    border: none;
    border-top: 0.5px solid var(--separator-color);
    margin: 1em 0;
  }

  :deep(.katex-display) {
    margin: 0.5em 0;
    overflow-x: auto;
  }

  :deep(.katex-block-wrapper) {
    margin: 1em 0;
    text-align: center;
    overflow-x: auto;
  }
}

.key-points-list {
  li {
    :deep(p) {
      display: inline;
      margin: 0;
    }
  }
}

// iOS 风格相关知识点
.related-section {
  margin-top: var(--spacing-xl);
  padding-top: var(--spacing-lg);
  border-top: 0.5px solid var(--separator-color);

  h3 {
    font-size: 17px;
    font-weight: 600;
    margin-bottom: var(--spacing-md);
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    color: var(--text-color);

    .el-icon {
      color: var(--primary-color);
    }
  }

  .related-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-lg);

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
    }
  }

  .related-group {
    .related-label {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
      font-size: 13px;
      font-weight: 500;
      color: var(--text-color-tertiary);
      margin-bottom: var(--spacing-sm);
      text-transform: uppercase;
      letter-spacing: 0.02em;

      .el-icon {
        font-size: 14px;
      }
    }

    .related-list {
      display: flex;
      flex-direction: column;
      background-color: var(--bg-color);
      border-radius: var(--border-radius);
      overflow: hidden;
    }

    .related-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 11px var(--spacing-md);
      cursor: pointer;
      transition: background-color 0.15s ease;
      position: relative;

      &:not(:last-child)::after {
        content: '';
        position: absolute;
        left: var(--spacing-md);
        right: 0;
        bottom: 0;
        height: 0.5px;
        background-color: var(--separator-color);
      }

      &:active {
        background-color: var(--active-bg);
      }

      .related-title {
        font-size: 15px;
        color: var(--text-color);
      }

      .related-arrow {
        color: var(--text-color-tertiary);
      }
    }
  }
}

// iOS 风格快速操作区
.quick-actions-section {
  margin-top: var(--spacing-xl);
  padding-top: var(--spacing-lg);
  border-top: 0.5px solid var(--separator-color);

  h3 {
    font-size: 17px;
    font-weight: 600;
    margin-bottom: var(--spacing-md);
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    color: var(--text-color);

    .el-icon {
      color: var(--ios-orange);
    }
  }

  .quick-actions {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--spacing-md);

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
    }
  }

  .action-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-lg) var(--spacing-md);
    background-color: var(--bg-color);
    border-radius: var(--border-radius-lg);
    cursor: pointer;
    transition: all 0.25s var(--transition-timing);

    &:active {
      transform: scale(0.98);
      background-color: var(--active-bg);
    }

    .el-icon {
      color: var(--text-color-secondary);
      transition: color 0.25s;
    }

    .action-title {
      font-size: 15px;
      font-weight: 600;
      color: var(--text-color);
    }

    .action-desc {
      font-size: 12px;
      color: var(--text-color-tertiary);
      text-align: center;
      display: -webkit-box;
      -webkit-line-clamp: 1;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  }
}

// iOS 风格前后导航
.nav-footer {
  display: flex;
  justify-content: space-between;
  gap: var(--spacing-md);
  margin-top: var(--spacing-xl);
  padding-top: var(--spacing-lg);
  border-top: 0.5px solid var(--separator-color);

  .nav-placeholder {
    flex: 1;
  }

  .nav-btn {
    flex: 1;
    max-width: 260px;
    height: auto;
    padding: var(--spacing-sm) var(--spacing-md);
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    border-radius: var(--border-radius);

    &.prev {
      justify-content: flex-start;
    }

    &.next {
      justify-content: flex-end;
    }

    .nav-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
      text-align: left;

      .nav-label {
        font-size: 12px;
        opacity: 0.7;
      }

      .nav-title {
        font-size: 14px;
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 160px;
      }
    }

    &.next .nav-info {
      text-align: right;
    }
  }
}
</style>
