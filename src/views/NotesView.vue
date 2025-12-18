<template>
  <div class="notes-view">
    <div class="page-header">
      <h1 class="page-title">
        <el-icon><Notebook /></el-icon>
        我的笔记
        <span v-if="allNotes.length" class="notes-count">（{{ allNotes.length }}）</span>
      </h1>
      <div class="header-actions">
        <el-upload
          ref="uploadRef"
          :auto-upload="false"
          :show-file-list="false"
          accept=".md"
          :on-change="handleFileUpload"
        >
          <el-button type="primary">
            <el-icon><Upload /></el-icon>
            导入 MD 文件
          </el-button>
        </el-upload>
        <el-button @click="showNewNoteDialog = true">
          <el-icon><Plus /></el-icon>
          新建笔记
        </el-button>
      </div>
    </div>

    <!-- 筛选和搜索 -->
    <div class="filter-bar">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索笔记内容..."
        clearable
        :prefix-icon="Search"
        class="search-input"
      />
      <el-select v-model="filterType" placeholder="筛选类型" clearable class="filter-select">
        <el-option label="全部笔记" value="" />
        <el-option label="Markdown 笔记" value="markdown" />
        <el-option label="普通笔记" value="plain" />
        <el-option label="AI 优化过" value="ai" />
      </el-select>
      <el-select v-model="sortBy" class="sort-select">
        <el-option label="最近更新" value="updated" />
        <el-option label="最近创建" value="created" />
        <el-option label="按知识点" value="knowledge" />
      </el-select>
    </div>

    <!-- 笔记列表 -->
    <div v-if="filteredNotes.length" class="notes-grid">
      <div
        v-for="note in filteredNotes"
        :key="note.id"
        class="note-card"
        :class="{ 'is-markdown': note.isMarkdown }"
        @click="viewNote(note)"
      >
        <div class="note-card-header">
          <div class="note-tags">
            <el-tag v-if="note.isMarkdown" size="small" type="success">Markdown</el-tag>
            <el-tag v-if="note.aiOptimized" size="small" type="warning">AI 优化</el-tag>
          </div>
          <el-dropdown trigger="click" @command="handleNoteAction($event, note)">
            <el-button :icon="MoreFilled" text size="small" @click.stop />
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="edit">
                  <el-icon><Edit /></el-icon>
                  编辑
                </el-dropdown-item>
                <el-dropdown-item command="export">
                  <el-icon><Download /></el-icon>
                  导出
                </el-dropdown-item>
                <el-dropdown-item command="delete" divided>
                  <el-icon><Delete /></el-icon>
                  删除
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>

        <div class="note-card-content">
          <div
            v-if="note.isMarkdown"
            class="note-preview markdown-preview"
            v-html="getPreviewContent(note.content)"
          ></div>
          <div v-else class="note-preview">{{ getPlainPreview(note.content) }}</div>
        </div>

        <div class="note-card-footer">
          <div class="note-knowledge-point" @click.stop="goToKnowledgePoint(note.knowledgePointId)">
            <el-icon><Reading /></el-icon>
            {{ getKnowledgePointTitle(note.knowledgePointId) }}
          </div>
          <div class="note-time">{{ formatTime(note.updatedAt) }}</div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <el-empty v-else :description="emptyDescription">
      <el-button type="primary" @click="showNewNoteDialog = true">
        <el-icon><Plus /></el-icon>
        创建第一条笔记
      </el-button>
    </el-empty>

    <!-- 新建/编辑笔记对话框 -->
    <el-dialog
      v-model="showNewNoteDialog"
      :title="editingNote ? '编辑笔记' : '新建笔记'"
      width="800px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <div class="note-dialog-content">
        <div class="dialog-form-item">
          <label>关联知识点：</label>
          <el-select
            v-model="noteForm.knowledgePointId"
            placeholder="选择关联的知识点"
            filterable
            class="knowledge-select"
          >
            <el-option
              v-for="kp in knowledgePoints"
              :key="kp.id"
              :label="kp.title"
              :value="kp.id"
            />
          </el-select>
        </div>

        <div class="dialog-form-item">
          <div class="editor-toolbar">
            <el-radio-group v-model="editorMode" size="small">
              <el-radio-button label="edit">编辑</el-radio-button>
              <el-radio-button label="preview">预览</el-radio-button>
            </el-radio-group>
            <div class="toolbar-right">
              <el-tooltip content="支持 Markdown 和 LaTeX 公式" placement="top">
                <el-icon class="help-icon"><QuestionFilled /></el-icon>
              </el-tooltip>
              <el-button
                v-if="noteForm.content.trim() && isAIConfigured"
                size="small"
                :loading="aiOptimizing"
                @click="optimizeWithAI"
              >
                <el-icon><MagicStick /></el-icon>
                AI 优化
              </el-button>
            </div>
          </div>

          <div v-if="editorMode === 'edit'" class="editor-input">
            <el-input
              v-model="noteForm.content"
              type="textarea"
              :rows="15"
              placeholder="支持 Markdown 语法和 LaTeX 公式&#10;行内公式: $E=mc^2$&#10;块级公式: $$\int_a^b f(x)dx$$"
            />
          </div>
          <div v-else class="editor-preview markdown-body" v-html="previewContent"></div>
        </div>
      </div>

      <template #footer>
        <el-button @click="closeNoteDialog">取消</el-button>
        <el-button
          type="primary"
          :disabled="!noteForm.content.trim() || !noteForm.knowledgePointId"
          @click="saveNote"
        >
          {{ editingNote ? '更新' : '保存' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 查看笔记对话框 -->
    <el-dialog
      v-model="showViewDialog"
      :title="viewingNote ? getKnowledgePointTitle(viewingNote.knowledgePointId) : '查看笔记'"
      width="800px"
      destroy-on-close
    >
      <div v-if="viewingNote" class="note-view-content">
        <div class="note-view-meta">
          <div class="meta-tags">
            <el-tag v-if="viewingNote.isMarkdown" size="small" type="success">Markdown</el-tag>
            <el-tag v-if="viewingNote.aiOptimized" size="small" type="warning">AI 优化</el-tag>
          </div>
          <div class="meta-time">
            <span>创建于 {{ formatDate(viewingNote.createdAt) }}</span>
            <span>更新于 {{ formatDate(viewingNote.updatedAt) }}</span>
          </div>
        </div>
        <div
          v-if="viewingNote.isMarkdown"
          class="note-full-content markdown-body"
          v-html="renderMarkdown(viewingNote.content)"
        ></div>
        <div v-else class="note-full-content plain-text">{{ viewingNote.content }}</div>
      </div>
      <template #footer>
        <el-button @click="showViewDialog = false">关闭</el-button>
        <el-button type="primary" @click="editFromView">编辑</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  Notebook,
  Upload,
  Plus,
  Search,
  MoreFilled,
  Edit,
  Delete,
  Download,
  Reading,
  QuestionFilled,
  MagicStick
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { UploadFile } from 'element-plus'
import { useProgressStore, type StudyNote } from '@/stores/progressStore'
import { useKnowledgeStore } from '@/stores/knowledgeStore'
import { renderMarkdown } from '@/utils/latex'
import { isConfigured, getAIConfig } from '@/services/aiService'

const router = useRouter()
const progressStore = useProgressStore()
const knowledgeStore = useKnowledgeStore()

// 状态
const searchKeyword = ref('')
const filterType = ref('')
const sortBy = ref('updated')
const showNewNoteDialog = ref(false)
const showViewDialog = ref(false)
const editorMode = ref<'edit' | 'preview'>('edit')
const aiOptimizing = ref(false)
const editingNote = ref<StudyNote | null>(null)
const viewingNote = ref<StudyNote | null>(null)

const noteForm = ref({
  knowledgePointId: '',
  content: ''
})

const isAIConfigured = computed(() => isConfigured())

// 获取所有笔记
const allNotes = computed(() => progressStore.notes)

// 获取所有知识点
const knowledgePoints = computed(() => knowledgeStore.knowledgePoints)

// 筛选和排序后的笔记
const filteredNotes = computed(() => {
  let notes = [...allNotes.value]

  // 搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    notes = notes.filter(note =>
      note.content.toLowerCase().includes(keyword) ||
      getKnowledgePointTitle(note.knowledgePointId).toLowerCase().includes(keyword)
    )
  }

  // 筛选
  if (filterType.value === 'markdown') {
    notes = notes.filter(note => note.isMarkdown)
  } else if (filterType.value === 'plain') {
    notes = notes.filter(note => !note.isMarkdown)
  } else if (filterType.value === 'ai') {
    notes = notes.filter(note => note.aiOptimized)
  }

  // 排序
  if (sortBy.value === 'updated') {
    notes.sort((a, b) => b.updatedAt - a.updatedAt)
  } else if (sortBy.value === 'created') {
    notes.sort((a, b) => b.createdAt - a.createdAt)
  } else if (sortBy.value === 'knowledge') {
    notes.sort((a, b) => a.knowledgePointId.localeCompare(b.knowledgePointId))
  }

  return notes
})

// 空状态描述
const emptyDescription = computed(() => {
  if (searchKeyword.value || filterType.value) {
    return '没有找到匹配的笔记'
  }
  return '还没有笔记，开始记录你的学习心得吧'
})

// 预览内容
const previewContent = computed(() => {
  if (!noteForm.value.content.trim()) {
    return '<p class="preview-placeholder">预览内容将显示在这里...</p>'
  }
  return renderMarkdown(noteForm.value.content)
})

// 获取知识点标题
const getKnowledgePointTitle = (kpId: string): string => {
  const kp = knowledgeStore.getKnowledgePointById(kpId)
  return kp?.title || '未关联知识点'
}

// 获取预览内容（截取）
const getPreviewContent = (content: string): string => {
  const maxLength = 200
  const truncated = content.length > maxLength ? content.substring(0, maxLength) + '...' : content
  return renderMarkdown(truncated)
}

const getPlainPreview = (content: string): string => {
  const maxLength = 150
  return content.length > maxLength ? content.substring(0, maxLength) + '...' : content
}

// 格式化时间
const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - timestamp

  if (diff < 60 * 1000) return '刚刚'
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / 3600000)}小时前`
  if (diff < 7 * 24 * 60 * 60 * 1000) return `${Math.floor(diff / 86400000)}天前`

  return date.toLocaleDateString('zh-CN')
}

const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 检测内容是否为 Markdown
const isMarkdownContent = (content: string): boolean => {
  const markdownPatterns = [
    /^#{1,6}\s/m, /\*\*.*\*\*/, /\*[^*]+\*/, /```[\s\S]*```/,
    /`[^`]+`/, /^\s*[-*+]\s/m, /^\s*\d+\.\s/m, /\[.*\]\(.*\)/,
    /!\[.*\]\(.*\)/, /^\s*>/m, /\$.*\$/, /\$\$[\s\S]*\$\$/
  ]
  return markdownPatterns.some(pattern => pattern.test(content))
}

// 处理文件上传
const handleFileUpload = async (file: UploadFile) => {
  if (!file.raw) return

  try {
    const content = await file.raw.text()
    noteForm.value.content = content
    showNewNoteDialog.value = true
    editorMode.value = 'preview'
    ElMessage.success('文件导入成功')
  } catch (error) {
    ElMessage.error('文件读取失败')
  }
}

// 查看笔记
const viewNote = (note: StudyNote) => {
  viewingNote.value = note
  showViewDialog.value = true
}

// 从查看进入编辑
const editFromView = () => {
  if (viewingNote.value) {
    editNote(viewingNote.value)
    showViewDialog.value = false
  }
}

// 编辑笔记
const editNote = (note: StudyNote) => {
  editingNote.value = note
  noteForm.value = {
    knowledgePointId: note.knowledgePointId,
    content: note.content
  }
  editorMode.value = 'edit'
  showNewNoteDialog.value = true
}

// 处理笔记操作
const handleNoteAction = async (command: string, note: StudyNote) => {
  switch (command) {
    case 'edit':
      editNote(note)
      break
    case 'export':
      exportNote(note)
      break
    case 'delete':
      await deleteNote(note)
      break
  }
}

// 导出笔记
const exportNote = (note: StudyNote) => {
  const fileName = `${getKnowledgePointTitle(note.knowledgePointId)}_笔记.md`
  const blob = new Blob([note.content], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('导出成功')
}

// 删除笔记
const deleteNote = async (note: StudyNote) => {
  try {
    await ElMessageBox.confirm('确定要删除这条笔记吗？删除后无法恢复。', '删除确认', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    })
    progressStore.deleteNote(note.id)
    ElMessage.success('删除成功')
  } catch {
    // 取消删除
  }
}

// 保存笔记
const saveNote = () => {
  const content = noteForm.value.content.trim()
  if (!content || !noteForm.value.knowledgePointId) return

  const isMarkdown = isMarkdownContent(content)

  if (editingNote.value) {
    progressStore.updateNote(editingNote.value.id, content, { isMarkdown })
    ElMessage.success('笔记已更新')
  } else {
    progressStore.addNote(noteForm.value.knowledgePointId, content, { isMarkdown })
    ElMessage.success('笔记已保存')
  }

  closeNoteDialog()
}

// 关闭对话框
const closeNoteDialog = () => {
  showNewNoteDialog.value = false
  editingNote.value = null
  noteForm.value = { knowledgePointId: '', content: '' }
  editorMode.value = 'edit'
}

// AI 优化笔记
const optimizeWithAI = async () => {
  if (!noteForm.value.content.trim()) return

  aiOptimizing.value = true

  try {
    const config = getAIConfig()

    const response = await fetch(config.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.model,
        input: {
          messages: [
            {
              role: 'system',
              content: `你是一位专业的学习笔记整理助手，擅长优化数学学习笔记。请帮助用户优化笔记内容，使其：
1. 结构更清晰（使用合适的标题和列表）
2. 重点更突出（使用加粗或高亮）
3. 公式更规范（使用 LaTeX 格式）
4. 语言更简洁
5. 保留原有的核心内容和知识点

请直接输出优化后的笔记内容，使用 Markdown 格式。`
            },
            {
              role: 'user',
              content: `请优化以下学习笔记：\n\n${noteForm.value.content}`
            }
          ]
        },
        parameters: {
          temperature: 0.7,
          max_tokens: 2000,
          result_format: 'message'
        }
      })
    })

    if (!response.ok) throw new Error('AI 服务请求失败')

    const data = await response.json()
    const optimizedContent = data.output?.choices?.[0]?.message?.content || data.output?.text || ''

    if (optimizedContent) {
      noteForm.value.content = optimizedContent
      editorMode.value = 'preview'
      ElMessage.success('笔记优化完成')
    } else {
      throw new Error('AI 返回内容为空')
    }
  } catch (error) {
    ElMessage.error('AI 优化失败，请检查网络或 API 配置')
  } finally {
    aiOptimizing.value = false
  }
}

// 跳转到知识点
const goToKnowledgePoint = (kpId: string) => {
  router.push(`/learn/${kpId}`)
}

// 数据已在 App.vue 中全局加载，无需重复加载
</script>

<style lang="scss" scoped>
// ============================================
// iOS 风格笔记视图
// ============================================
.notes-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--spacing-md);
  background-color: var(--bg-color);
}

// iOS 大标题风格头部
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
  flex-wrap: wrap;
  gap: var(--spacing-sm);

  .page-title {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    margin: 0;
    font-size: 34px;
    font-weight: 700;
    color: var(--text-color);
    letter-spacing: 0.01em;

    .el-icon {
      color: var(--primary-color);
      font-size: 28px;
    }

    .notes-count {
      font-size: 17px;
      font-weight: 400;
      color: var(--text-color-tertiary);
    }
  }

  .header-actions {
    display: flex;
    gap: var(--spacing-sm);

    :deep(.el-button) {
      border-radius: var(--border-radius);
      font-weight: 500;
    }
  }
}

// iOS 风格筛选栏
.filter-bar {
  display: flex;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
  flex-wrap: wrap;

  .search-input {
    width: 300px;

    :deep(.el-input__wrapper) {
      border-radius: var(--border-radius);
      background-color: rgba(118, 118, 128, 0.12);
      box-shadow: none;
    }
  }

  .filter-select,
  .sort-select {
    :deep(.el-select__wrapper) {
      border-radius: var(--border-radius);
      box-shadow: none;
      border: 0.5px solid var(--separator-color);
    }
  }

  .filter-select {
    width: 150px;
  }

  .sort-select {
    width: 130px;
  }
}

// iOS App 风格笔记卡片网格
.notes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: var(--spacing-md);
}

.note-card {
  background-color: var(--card-bg);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-lg);
  cursor: pointer;
  transition: all 0.25s var(--transition-timing);
  display: flex;
  flex-direction: column;

  &:active {
    transform: scale(0.98);
    background-color: var(--active-bg);
  }

  &.is-markdown {
    border-left: 3px solid var(--ios-green);
  }
}

.note-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-sm);

  .note-tags {
    display: flex;
    gap: var(--spacing-xs);
  }

  :deep(.el-button.is-text) {
    padding: 6px;
  }
}

.note-card-content {
  flex: 1;
  margin-bottom: var(--spacing-md);

  .note-preview {
    color: var(--text-color-secondary);
    line-height: 1.6;
    max-height: 120px;
    overflow: hidden;
    position: relative;
    font-size: 14px;

    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 40px;
      background: linear-gradient(transparent, var(--card-bg));
    }
  }

  .markdown-preview {
    :deep(h1), :deep(h2), :deep(h3) {
      font-size: 14px;
      margin: 4px 0;
    }

    :deep(p) {
      margin: 4px 0;
    }

    :deep(code) {
      font-size: 12px;
    }
  }
}

.note-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: var(--spacing-sm);
  border-top: 0.5px solid var(--separator-color);

  .note-knowledge-point {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: var(--primary-color);
    cursor: pointer;
    font-weight: 500;

    &:active {
      opacity: 0.7;
    }
  }

  .note-time {
    font-size: 12px;
    color: var(--text-color-placeholder);
    font-feature-settings: 'tnum';
  }
}

// iOS 风格对话框
.note-dialog-content {
  .dialog-form-item {
    margin-bottom: var(--spacing-lg);

    > label {
      display: block;
      margin-bottom: var(--spacing-sm);
      font-weight: 600;
      font-size: 13px;
      color: var(--text-color-tertiary);
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }

    .knowledge-select {
      width: 100%;

      :deep(.el-select__wrapper) {
        border-radius: var(--border-radius);
      }
    }
  }

  .editor-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-sm);

    :deep(.el-radio-group) {
      background-color: rgba(118, 118, 128, 0.12);
      border-radius: var(--border-radius);
      padding: 2px;
    }

    :deep(.el-radio-button__inner) {
      border: none;
      border-radius: 7px;
      font-size: 13px;
      font-weight: 500;
      background: transparent;
    }

    :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
      background-color: var(--card-bg);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .toolbar-right {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);

      .help-icon {
        color: var(--text-color-placeholder);
        cursor: help;
      }

      :deep(.el-button) {
        border-radius: var(--border-radius);
        font-weight: 500;
      }
    }
  }

  .editor-input {
    :deep(.el-textarea__inner) {
      font-family: 'SF Mono', 'Consolas', monospace;
      line-height: 1.6;
      border-radius: var(--border-radius);
    }
  }

  .editor-preview {
    min-height: 300px;
    max-height: 450px;
    overflow-y: auto;
    padding: var(--spacing-md);
    background-color: var(--bg-color);
    border-radius: var(--border-radius);
  }
}

// iOS 风格查看笔记对话框
.note-view-content {
  .note-view-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-lg);
    padding-bottom: var(--spacing-md);
    border-bottom: 0.5px solid var(--separator-color);

    .meta-tags {
      display: flex;
      gap: var(--spacing-sm);
    }

    .meta-time {
      display: flex;
      gap: var(--spacing-md);
      font-size: 12px;
      color: var(--text-color-placeholder);
      font-feature-settings: 'tnum';
    }
  }

  .note-full-content {
    min-height: 200px;
    max-height: 500px;
    overflow-y: auto;

    &.plain-text {
      white-space: pre-wrap;
      line-height: 1.8;
      color: var(--text-color);
      font-size: 15px;
    }
  }
}

// iOS 风格 Markdown 样式
.markdown-body {
  :deep(h1), :deep(h2), :deep(h3), :deep(h4), :deep(h5), :deep(h6) {
    margin-top: var(--spacing-md);
    margin-bottom: var(--spacing-sm);
    font-weight: 600;
    line-height: 1.4;
    color: var(--text-color);
  }

  :deep(h1) { font-size: 1.5em; }
  :deep(h2) { font-size: 1.3em; }
  :deep(h3) { font-size: 1.1em; }

  :deep(p) {
    margin: var(--spacing-sm) 0;
    line-height: 1.8;
    font-size: 15px;
  }

  :deep(ul), :deep(ol) {
    margin: var(--spacing-sm) 0;
    padding-left: 24px;
  }

  :deep(code) {
    background-color: rgba(0, 122, 255, 0.1);
    padding: 2px 6px;
    border-radius: 4px;
    font-family: 'SF Mono', 'Consolas', monospace;
    font-size: 0.9em;
    color: var(--primary-color);
  }

  :deep(pre) {
    background-color: var(--bg-color);
    padding: var(--spacing-md);
    border-radius: var(--border-radius);
    overflow-x: auto;

    code {
      background: none;
      padding: 0;
      color: inherit;
    }
  }

  :deep(blockquote) {
    margin: var(--spacing-md) 0;
    padding: var(--spacing-sm) var(--spacing-md);
    border-left: 3px solid var(--primary-color);
    background-color: rgba(0, 122, 255, 0.05);
    color: var(--text-color-secondary);
    border-radius: 0 var(--border-radius) var(--border-radius) 0;
  }

  :deep(.katex-display) {
    margin: var(--spacing-md) 0;
    overflow-x: auto;
  }

  :deep(.katex-block-wrapper) {
    margin: var(--spacing-md) 0;
    text-align: center;
  }
}

// iOS 风格空状态
:deep(.el-empty) {
  padding: var(--spacing-xl) 0;

  .el-empty__description {
    font-size: 15px;
    color: var(--text-color-tertiary);
  }

  .el-button {
    border-radius: var(--border-radius);
    font-weight: 500;
  }
}

// 响应式
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .filter-bar {
    flex-direction: column;

    .search-input,
    .filter-select,
    .sort-select {
      width: 100%;
    }
  }

  .notes-grid {
    grid-template-columns: 1fr;
  }
}
</style>
