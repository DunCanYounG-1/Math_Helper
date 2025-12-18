<template>
  <div class="knowledge-graph" ref="containerRef">
    <div class="graph-header">
      <div class="graph-title">
        <el-icon><Share /></el-icon>
        <span>知识图谱</span>
      </div>
      <div class="graph-controls">
        <!-- 搜索框 -->
        <el-input
          v-model="searchQuery"
          placeholder="搜索知识点..."
          clearable
          size="small"
          class="search-input"
          @input="handleSearch"
          @clear="clearSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select v-model="filterChapter" placeholder="筛选章节" clearable size="small" class="chapter-filter">
          <el-option value="" label="全部章节" />
          <el-option
            v-for="chapter in chapters"
            :key="chapter.id"
            :value="chapter.id"
            :label="chapter.title"
          />
        </el-select>
        <el-select v-model="viewMode" size="small" class="view-mode-select">
          <el-option value="chapter" label="按章节着色" />
          <el-option value="progress" label="按学习进度" />
          <el-option value="difficulty" label="按难度等级" />
        </el-select>
        <el-button-group size="small">
          <el-button @click="zoomIn" :icon="ZoomIn" title="放大" />
          <el-button @click="zoomOut" :icon="ZoomOut" title="缩小" />
          <el-button @click="resetView" :icon="RefreshRight" title="重置视图" />
          <el-button @click="toggleLayout" :icon="Operation" title="切换布局" />
        </el-button-group>
      </div>
    </div>

    <!-- 搜索结果列表 -->
    <div class="search-results" v-if="searchResults.length > 0 && searchQuery">
      <div class="search-results-header">
        <span>找到 {{ searchResults.length }} 个结果</span>
        <el-button link size="small" @click="clearSearch">清除</el-button>
      </div>
      <div class="search-results-list">
        <div
          v-for="result in searchResults"
          :key="result.id"
          class="search-result-item"
          @click="focusOnNode(result.id)"
        >
          <span class="result-title">{{ result.title }}</span>
          <el-tag size="small" :style="{ backgroundColor: chapterColors[result.chapterId], color: '#fff' }">
            {{ getChapterShortName(result.chapterId) }}
          </el-tag>
        </div>
      </div>
    </div>

    <div class="graph-container" ref="graphRef"></div>

    <!-- 统计信息 -->
    <div class="graph-stats">
      <div class="stat-item">
        <span class="stat-value">{{ filteredKnowledgePoints.length }}</span>
        <span class="stat-label">知识点</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{{ linkCount }}</span>
        <span class="stat-label">关联</span>
      </div>
      <div class="stat-item" v-if="viewMode === 'progress'">
        <span class="stat-value">{{ masteredCount }}</span>
        <span class="stat-label">已掌握</span>
      </div>
    </div>

    <!-- 图例 -->
    <div class="graph-legend">
      <div class="legend-title">图例</div>

      <!-- 章节颜色图例 -->
      <div class="legend-items" v-if="viewMode === 'chapter'">
        <div class="legend-item" v-for="(color, chapter) in chapterColors" :key="chapter">
          <span class="legend-dot" :style="{ backgroundColor: color }"></span>
          <span class="legend-label">{{ getChapterShortName(chapter) }}</span>
        </div>
      </div>

      <!-- 学习进度图例 -->
      <div class="legend-items" v-else-if="viewMode === 'progress'">
        <div class="legend-item">
          <span class="legend-dot" style="background-color: #67C23A"></span>
          <span class="legend-label">已掌握</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot" style="background-color: #409EFF"></span>
          <span class="legend-label">已完成</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot" style="background-color: #E6A23C"></span>
          <span class="legend-label">学习中</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot" style="background-color: #909399"></span>
          <span class="legend-label">未开始</span>
        </div>
      </div>

      <!-- 难度图例 -->
      <div class="legend-items" v-else-if="viewMode === 'difficulty'">
        <div class="legend-item">
          <span class="legend-dot" style="background-color: #67C23A"></span>
          <span class="legend-label">基础/简单</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot" style="background-color: #E6A23C"></span>
          <span class="legend-label">中等</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot" style="background-color: #F56C6C"></span>
          <span class="legend-label">较难/困难</span>
        </div>
      </div>

      <div class="legend-hint">
        <div class="hint-item">
          <span class="hint-line solid"></span>
          <span>前置依赖</span>
        </div>
        <div class="hint-item">
          <span class="hint-icon">●</span>
          <span>节点大小 = 重要程度</span>
        </div>
      </div>
    </div>

    <!-- 节点详情悬浮卡片 -->
    <transition name="fade">
      <div
        v-if="hoveredNode"
        class="node-tooltip"
        :style="{ left: tooltipPosition.x + 'px', top: tooltipPosition.y + 'px' }"
      >
        <div class="tooltip-header">
          <span class="tooltip-title">{{ hoveredNode.title }}</span>
          <el-tag size="small" :type="getDifficultyType(hoveredNode.difficulty)">
            {{ getDifficultyLabel(hoveredNode.difficulty) }}
          </el-tag>
        </div>
        <div class="tooltip-chapter">{{ getChapterName(hoveredNode.chapterId) }}</div>
        <div class="tooltip-desc">{{ truncateText(hoveredNode.description, 100) }}</div>
        <div class="tooltip-meta">
          <span v-if="hoveredNode.hasVisualization" class="meta-tag">
            <el-icon><VideoCamera /></el-icon> 有可视化
          </span>
          <span v-if="hoveredNode.examFrequency === 'very-high'" class="meta-tag hot">
            <el-icon><Star /></el-icon> 高频考点
          </span>
        </div>
        <div class="tooltip-hint">点击查看详情</div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { Share, ZoomIn, ZoomOut, RefreshRight, VideoCamera, Star, Search, Operation } from '@element-plus/icons-vue'
import { useKnowledgeStore, type KnowledgePoint } from '@/stores/knowledgeStore'
import { useProgressStore } from '@/stores/progressStore'
import * as d3 from 'd3'

const router = useRouter()
const knowledgeStore = useKnowledgeStore()
const progressStore = useProgressStore()

const containerRef = ref<HTMLElement | null>(null)
const graphRef = ref<HTMLElement | null>(null)
const filterChapter = ref('')
const hoveredNode = ref<KnowledgePoint | null>(null)
const tooltipPosition = ref({ x: 0, y: 0 })
const searchQuery = ref('')
const searchResults = ref<KnowledgePoint[]>([])
const viewMode = ref<'chapter' | 'progress' | 'difficulty'>('chapter')
const layoutType = ref<'force' | 'radial' | 'hierarchical'>('force')

// D3 相关变量
let svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | null = null
let simulation: d3.Simulation<d3.SimulationNodeDatum, undefined> | null = null
let zoomBehavior: d3.ZoomBehavior<SVGSVGElement, unknown> | null = null
let graphNodes: GraphNode[] = []
let graphLinks: GraphLink[] = []

// 章节颜色映射
const chapterColors: Record<string, string> = {
  ch1: '#409EFF', // 蓝色 - 极限与连续
  ch2: '#67C23A', // 绿色 - 导数与微分
  ch3: '#E6A23C', // 橙色 - 导数应用
  ch4: '#F56C6C', // 红色 - 不定积分
  ch5: '#909399', // 灰色 - 定积分
  ch6: '#9B59B6', // 紫色 - 微分方程
  ch7: '#1ABC9C'  // 青色 - 无穷级数
}

const chapters = computed(() => knowledgeStore.chapters)

const filteredKnowledgePoints = computed(() => {
  if (!filterChapter.value) {
    return knowledgeStore.knowledgePoints
  }
  return knowledgeStore.knowledgePoints.filter(kp => kp.chapterId === filterChapter.value)
})

// 统计信息
const linkCount = computed(() => graphLinks.length)

const masteredCount = computed(() => {
  return filteredKnowledgePoints.value.filter(kp => {
    const status = progressStore.getStatus(kp.id)
    return status === 'mastered' || status === 'completed'
  }).length
})

// 搜索功能
const handleSearch = () => {
  if (!searchQuery.value.trim()) {
    searchResults.value = []
    return
  }

  const query = searchQuery.value.toLowerCase()
  searchResults.value = knowledgeStore.knowledgePoints.filter(kp =>
    kp.title.toLowerCase().includes(query) ||
    kp.description.toLowerCase().includes(query) ||
    kp.keyPoints?.some(point => point.toLowerCase().includes(query))
  ).slice(0, 10)
}

const clearSearch = () => {
  searchQuery.value = ''
  searchResults.value = []
  if (svg) {
    // 重置所有节点高亮
    svg.selectAll('.node circle').attr('stroke-width', 2).attr('stroke', '#fff')
  }
}

// 聚焦到指定节点
const focusOnNode = (nodeId: string) => {
  if (!svg || !zoomBehavior) return

  const node = graphNodes.find(n => n.id === nodeId)
  if (!node || node.x === undefined || node.y === undefined) return

  // 高亮该节点
  svg.selectAll('.node circle')
    .attr('stroke-width', (d: any) => d.id === nodeId ? 4 : 2)
    .attr('stroke', (d: any) => d.id === nodeId ? '#F56C6C' : '#fff')

  // 动画移动到节点位置
  const container = graphRef.value
  if (!container) return

  const width = container.clientWidth
  const height = container.clientHeight
  const scale = 1.5

  svg.transition()
    .duration(750)
    .call(
      zoomBehavior.transform,
      d3.zoomIdentity
        .translate(width / 2, height / 2)
        .scale(scale)
        .translate(-node.x, -node.y)
    )
}

// 切换布局
const toggleLayout = () => {
  const layouts: Array<'force' | 'radial' | 'hierarchical'> = ['force', 'radial', 'hierarchical']
  const currentIndex = layouts.indexOf(layoutType.value)
  layoutType.value = layouts[(currentIndex + 1) % layouts.length]
  initGraph()
}

// 获取节点颜色
const getNodeColor = (node: GraphNode): string => {
  if (viewMode.value === 'chapter') {
    return chapterColors[node.chapterId] || '#409EFF'
  } else if (viewMode.value === 'progress') {
    const status = progressStore.getStatus(node.id)
    switch (status) {
      case 'mastered': return '#67C23A'
      case 'completed': return '#409EFF'
      case 'in-progress': return '#E6A23C'
      default: return '#909399'
    }
  } else {
    // difficulty
    if (node.difficulty <= 2) return '#67C23A'
    if (node.difficulty <= 3) return '#E6A23C'
    return '#F56C6C'
  }
}

// 构建图谱数据
interface GraphNode extends d3.SimulationNodeDatum {
  id: string
  title: string
  chapterId: string
  difficulty: number
  hasVisualization: boolean
  examFrequency?: string
  description: string
  prerequisites: string[]
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode
  target: string | GraphNode
}

const buildGraphData = () => {
  const nodes: GraphNode[] = filteredKnowledgePoints.value.map(kp => ({
    id: kp.id,
    title: kp.title,
    chapterId: kp.chapterId,
    difficulty: kp.difficulty,
    hasVisualization: kp.hasVisualization,
    examFrequency: kp.examFrequency,
    description: kp.description,
    prerequisites: kp.prerequisites
  }))

  const nodeIds = new Set(nodes.map(n => n.id))
  const links: GraphLink[] = []

  // 构建依赖关系链接
  filteredKnowledgePoints.value.forEach(kp => {
    kp.prerequisites.forEach(prereqId => {
      // 只添加在当前过滤范围内的链接
      if (nodeIds.has(prereqId)) {
        links.push({
          source: prereqId,
          target: kp.id
        })
      }
    })
  })

  // 保存到模块变量以供其他函数使用
  graphNodes = nodes
  graphLinks = links

  return { nodes, links }
}

const getChapterShortName = (chapterId: string) => {
  const chapter = knowledgeStore.chapters.find(ch => ch.id === chapterId)
  if (!chapter) return chapterId
  // 提取章节简称，如 "第一章 函数、极限与连续" -> "极限"
  const match = chapter.title.match(/第.章\s*(.+)/)
  if (match) {
    const name = match[1]
    if (name.includes('极限')) return '极限'
    if (name.includes('导数') && name.includes('微分')) return '导数'
    if (name.includes('导数应用')) return '应用'
    if (name.includes('不定积分')) return '不定积分'
    if (name.includes('定积分')) return '定积分'
    if (name.includes('微分方程')) return '微分方程'
    if (name.includes('级数')) return '级数'
    return name.substring(0, 4)
  }
  return chapterId
}

const getChapterName = (chapterId: string) => {
  const chapter = knowledgeStore.chapters.find(ch => ch.id === chapterId)
  return chapter?.title || ''
}

const getDifficultyType = (difficulty: number) => {
  if (difficulty <= 2) return 'success'
  if (difficulty <= 3) return 'warning'
  return 'danger'
}

const getDifficultyLabel = (difficulty: number) => {
  if (difficulty <= 1) return '基础'
  if (difficulty <= 2) return '简单'
  if (difficulty <= 3) return '中等'
  if (difficulty <= 4) return '较难'
  return '困难'
}

const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// 初始化图谱
const initGraph = () => {
  if (!graphRef.value) return

  const container = graphRef.value
  const width = container.clientWidth
  const height = container.clientHeight

  // 清除现有内容
  d3.select(container).selectAll('*').remove()

  const { nodes, links } = buildGraphData()

  if (nodes.length === 0) return

  // 创建 SVG
  svg = d3.select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', [0, 0, width, height])

  // 创建缩放行为
  zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.3, 3])
    .on('zoom', (event) => {
      g.attr('transform', event.transform)
    })

  svg.call(zoomBehavior)

  // 创建主容器
  const g = svg.append('g')

  // 定义箭头标记
  svg.append('defs').append('marker')
    .attr('id', 'arrowhead')
    .attr('viewBox', '-0 -5 10 10')
    .attr('refX', 20)
    .attr('refY', 0)
    .attr('orient', 'auto')
    .attr('markerWidth', 6)
    .attr('markerHeight', 6)
    .append('path')
    .attr('d', 'M 0,-5 L 10,0 L 0,5')
    .attr('fill', '#999')

  // 创建力导向模拟
  simulation = d3.forceSimulation(nodes as d3.SimulationNodeDatum[])
    .force('link', d3.forceLink(links)
      .id((d: any) => d.id)
      .distance(120)
      .strength(0.5))
    .force('charge', d3.forceManyBody()
      .strength(-300)
      .distanceMax(400))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collision', d3.forceCollide().radius(40))

  // 绘制链接
  const link = g.append('g')
    .attr('class', 'links')
    .selectAll('line')
    .data(links)
    .join('line')
    .attr('stroke', '#ccc')
    .attr('stroke-width', 1.5)
    .attr('stroke-opacity', 0.6)
    .attr('marker-end', 'url(#arrowhead)')

  // 绘制节点容器
  const node = g.append('g')
    .attr('class', 'nodes')
    .selectAll('g')
    .data(nodes)
    .join('g')
    .attr('class', 'node')
    .call(d3.drag<SVGGElement, GraphNode>()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended) as any)

  // 绘制节点圆形
  node.append('circle')
    .attr('r', (d: GraphNode) => {
      // 根据难度和是否高频调整大小
      let r = 12
      if (d.examFrequency === 'very-high') r += 4
      if (d.hasVisualization) r += 2
      return r
    })
    .attr('fill', (d: GraphNode) => getNodeColor(d))
    .attr('stroke', '#fff')
    .attr('stroke-width', 2)
    .style('cursor', 'pointer')

  // 高频考点标记
  node.filter((d: GraphNode) => d.examFrequency === 'very-high')
    .append('circle')
    .attr('r', 5)
    .attr('cx', 10)
    .attr('cy', -10)
    .attr('fill', '#F56C6C')

  // 绘制节点标签
  node.append('text')
    .text((d: GraphNode) => truncateText(d.title, 8))
    .attr('x', 0)
    .attr('y', 30)
    .attr('text-anchor', 'middle')
    .attr('font-size', '11px')
    .attr('fill', '#333')
    .style('pointer-events', 'none')

  // 节点交互事件
  node.on('click', (_event: MouseEvent, d: GraphNode) => {
    router.push(`/learn/${d.id}`)
  })
  .on('mouseenter', (event: MouseEvent, d: GraphNode) => {
    const kp = knowledgeStore.getKnowledgePointById(d.id)
    if (kp) {
      hoveredNode.value = kp
      tooltipPosition.value = {
        x: event.clientX + 15,
        y: event.clientY + 15
      }
    }
    // 高亮相关节点
    highlightRelated(d.id)
  })
  .on('mouseleave', () => {
    hoveredNode.value = null
    resetHighlight()
  })
  .on('mousemove', (event: MouseEvent) => {
    tooltipPosition.value = {
      x: event.clientX + 15,
      y: event.clientY + 15
    }
  })

  // 更新位置
  simulation.on('tick', () => {
    link
      .attr('x1', (d: any) => d.source.x)
      .attr('y1', (d: any) => d.source.y)
      .attr('x2', (d: any) => d.target.x)
      .attr('y2', (d: any) => d.target.y)

    node.attr('transform', (d: any) => `translate(${d.x},${d.y})`)
  })

  // 高亮相关节点函数
  function highlightRelated(nodeId: string) {
    const relatedIds = new Set<string>([nodeId])

    // 找到所有前置和后继节点
    links.forEach((l: any) => {
      if (l.source.id === nodeId) relatedIds.add(l.target.id)
      if (l.target.id === nodeId) relatedIds.add(l.source.id)
    })

    node.selectAll('circle')
      .attr('opacity', (d: any) => relatedIds.has(d.id) ? 1 : 0.3)

    node.selectAll('text')
      .attr('opacity', (d: any) => relatedIds.has(d.id) ? 1 : 0.3)

    link
      .attr('stroke-opacity', (d: any) =>
        d.source.id === nodeId || d.target.id === nodeId ? 1 : 0.1)
      .attr('stroke', (d: any) =>
        d.source.id === nodeId || d.target.id === nodeId ? '#409EFF' : '#ccc')
  }

  function resetHighlight() {
    node.selectAll('circle').attr('opacity', 1)
    node.selectAll('text').attr('opacity', 1)
    link.attr('stroke-opacity', 0.6).attr('stroke', '#ccc')
  }

  // 拖拽函数
  function dragstarted(event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>) {
    if (!event.active) simulation?.alphaTarget(0.3).restart()
    event.subject.fx = event.subject.x
    event.subject.fy = event.subject.y
  }

  function dragged(event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>) {
    event.subject.fx = event.x
    event.subject.fy = event.y
  }

  function dragended(event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>) {
    if (!event.active) simulation?.alphaTarget(0)
    event.subject.fx = null
    event.subject.fy = null
  }
}

// 缩放控制
const zoomIn = () => {
  if (svg && zoomBehavior) {
    svg.transition().duration(300).call(zoomBehavior.scaleBy, 1.3)
  }
}

const zoomOut = () => {
  if (svg && zoomBehavior) {
    svg.transition().duration(300).call(zoomBehavior.scaleBy, 0.7)
  }
}

const resetView = () => {
  if (svg && zoomBehavior) {
    svg.transition().duration(500).call(zoomBehavior.transform, d3.zoomIdentity)
  }
}

// 监听筛选变化
watch(filterChapter, () => {
  nextTick(() => {
    initGraph()
  })
})

// 监听视图模式变化
watch(viewMode, () => {
  if (svg) {
    svg.selectAll('.node circle')
      .transition()
      .duration(300)
      .attr('fill', (d: any) => getNodeColor(d))
  }
})

// 监听窗口大小变化
const handleResize = () => {
  initGraph()
}

onMounted(async () => {
  // 数据已在 App.vue 中全局加载，无需重复加载
  nextTick(() => {
    initGraph()
  })
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  simulation?.stop()
  window.removeEventListener('resize', handleResize)
})
</script>

<style lang="scss" scoped>
.knowledge-graph {
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
  background-color: var(--card-bg);
  border-radius: 8px;
  overflow: hidden;
}

.graph-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
  background-color: var(--card-bg);
  z-index: 10;

  .graph-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 600;
    color: var(--text-color);

    .el-icon {
      color: var(--primary-color);
    }
  }

  .graph-controls {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;

    .search-input {
      width: 180px;
    }

    .chapter-filter {
      width: 140px;
    }

    .view-mode-select {
      width: 130px;
    }
  }
}

// 搜索结果面板
.search-results {
  position: absolute;
  top: 70px;
  left: 20px;
  width: 260px;
  max-height: 280px;
  background-color: rgba(255, 255, 255, 0.98);
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  z-index: 20;
  overflow: hidden;

  .search-results-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 14px;
    background-color: var(--primary-color-light);
    font-size: 12px;
    color: var(--primary-color);
  }

  .search-results-list {
    max-height: 230px;
    overflow-y: auto;
  }

  .search-result-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 14px;
    cursor: pointer;
    transition: background-color 0.2s;
    border-bottom: 1px solid var(--border-color);

    &:last-child {
      border-bottom: none;
    }

    &:hover {
      background-color: var(--bg-color);
    }

    .result-title {
      font-size: 13px;
      color: var(--text-color);
    }
  }
}

// 统计信息
.graph-stats {
  position: absolute;
  top: 70px;
  right: 20px;
  display: flex;
  gap: 16px;
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
  padding: 10px 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  z-index: 10;

  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;

    .stat-value {
      font-size: 18px;
      font-weight: 700;
      color: var(--primary-color);
    }

    .stat-label {
      font-size: 11px;
      color: var(--text-color-secondary);
    }
  }
}

.graph-container {
  flex: 1;
  overflow: hidden;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e7ed 100%);

  :deep(svg) {
    display: block;
  }

  :deep(.node) {
    transition: transform 0.1s;

    &:hover circle {
      filter: brightness(1.1);
      transform: scale(1.1);
    }
  }
}

.graph-legend {
  position: absolute;
  bottom: 20px;
  left: 20px;
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
  padding: 12px 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  z-index: 10;

  .legend-title {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-color);
    margin-bottom: 8px;
  }

  .legend-items {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 16px;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    color: var(--text-color-secondary);

    .legend-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }
  }

  .legend-hint {
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid var(--border-color);

    .hint-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      color: var(--text-color-secondary);
      margin-bottom: 4px;

      &:last-child {
        margin-bottom: 0;
      }

      .hint-line {
        width: 20px;
        height: 2px;
        background-color: #ccc;

        &.solid {
          background-color: #999;
        }
      }

      .hint-icon {
        font-size: 8px;
        color: #409EFF;
      }
    }
  }
}

.node-tooltip {
  position: fixed;
  z-index: 1000;
  max-width: 280px;
  padding: 12px 16px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  pointer-events: none;

  .tooltip-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
  }

  .tooltip-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-color);
  }

  .tooltip-chapter {
    font-size: 12px;
    color: var(--primary-color);
    margin-bottom: 8px;
  }

  .tooltip-desc {
    font-size: 12px;
    color: var(--text-color-secondary);
    line-height: 1.6;
    margin-bottom: 8px;
  }

  .tooltip-meta {
    display: flex;
    gap: 8px;
    margin-bottom: 8px;

    .meta-tag {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      color: var(--text-color-secondary);

      &.hot {
        color: #F56C6C;
      }
    }
  }

  .tooltip-hint {
    font-size: 11px;
    color: var(--text-color-placeholder);
    text-align: center;
    padding-top: 8px;
    border-top: 1px dashed var(--border-color);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
