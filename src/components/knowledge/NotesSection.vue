<template>
  <div class="notes-section">
    <div class="notes-header">
      <h3>
        <el-icon><Notebook /></el-icon>
        我的笔记
        <span v-if="notes.length" class="notes-count">（{{ notes.length }}）</span>
      </h3>
      <div class="header-actions">
        <el-upload
          ref="uploadRef"
          :auto-upload="false"
          :show-file-list="false"
          accept=".md"
          :on-change="handleFileChange"
        >
          <el-button size="small">
            <el-icon><Upload /></el-icon>
            导入 MD
          </el-button>
        </el-upload>
        <el-button type="primary" size="small" @click="showEditor = true" v-if="!showEditor">
          <el-icon><Plus /></el-icon>
          添加笔记
        </el-button>
      </div>
    </div>

    <!-- 笔记编辑器 -->
    <div v-if="showEditor" class="note-editor">
      <div class="editor-toolbar">
        <el-radio-group v-model="editorMode" size="small">
          <el-radio-button label="edit">编辑</el-radio-button>
          <el-radio-button label="preview">预览</el-radio-button>
        </el-radio-group>
        <el-tooltip content="支持 Markdown 和 LaTeX 公式（使用 $...$ 或 $$...$$）" placement="top">
          <el-icon class="help-icon"><QuestionFilled /></el-icon>
        </el-tooltip>
      </div>

      <div v-if="editorMode === 'edit'" class="editor-input">
        <el-input
          v-model="editContent"
          type="textarea"
          :rows="8"
          placeholder="支持 Markdown 语法和 LaTeX 公式&#10;行内公式: $E=mc^2$&#10;块级公式: $$\int_a^b f(x)dx$$"
          maxlength="10000"
          show-word-limit
        />
      </div>
      <div v-else class="editor-preview markdown-body" v-html="previewContent"></div>

      <div class="editor-actions">
        <el-button size="small" @click="cancelEdit">取消</el-button>
        <el-button
          v-if="editContent.trim() && isConfigured()"
          size="small"
          :loading="aiOptimizing"
          @click="optimizeWithAI"
        >
          <el-icon><MagicStick /></el-icon>
          AI 优化
        </el-button>
        <el-button type="primary" size="small" @click="saveNote" :disabled="!editContent.trim()">
          {{ editingNoteId ? '更新' : '保存' }}
        </el-button>
      </div>
    </div>

    <!-- 笔记列表 -->
    <div v-if="notes.length" class="notes-list">
      <div
        v-for="note in sortedNotes"
        :key="note.id"
        class="note-item"
        :class="{ 'is-markdown': note.isMarkdown }"
      >
        <div
          v-if="note.isMarkdown"
          class="note-content markdown-body"
          v-html="renderNoteContent(note.content)"
        ></div>
        <div v-else class="note-content">{{ note.content }}</div>
        <div class="note-footer">
          <div class="note-meta">
            <span class="note-time">{{ formatTime(note.updatedAt) }}</span>
            <el-tag v-if="note.isMarkdown" size="small" type="info">Markdown</el-tag>
            <el-tag v-if="note.aiOptimized" size="small" type="success">AI 优化</el-tag>
          </div>
          <div class="note-actions">
            <el-button type="primary" link size="small" @click="editNote(note)">
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-popconfirm
              title="确定删除这条笔记吗？"
              confirm-button-text="删除"
              cancel-button-text="取消"
              @confirm="deleteNote(note.id)"
            >
              <template #reference>
                <el-button type="danger" link size="small">
                  <el-icon><Delete /></el-icon>
                  删除
                </el-button>
              </template>
            </el-popconfirm>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else-if="!showEditor" class="notes-empty">
      <el-icon :size="32"><Notebook /></el-icon>
      <p>暂无笔记，点击上方按钮添加或导入 Markdown 文件</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Notebook, Plus, Edit, Delete, Upload, QuestionFilled, MagicStick } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { UploadFile } from 'element-plus'
import { useProgressStore, type StudyNote } from '@/stores/progressStore'
import { renderMarkdown } from '@/utils/latex'
import { isConfigured, getAIConfig } from '@/services/aiService'

const props = defineProps<{
  knowledgePointId: string
}>()

const progressStore = useProgressStore()

const showEditor = ref(false)
const editContent = ref('')
const editingNoteId = ref<string | null>(null)
const editorMode = ref<'edit' | 'preview'>('edit')
const aiOptimizing = ref(false)
const uploadRef = ref()

// 获取当前知识点的笔记
const notes = computed(() => {
  return progressStore.getNotesByKnowledgePoint(props.knowledgePointId)
})

// 按时间排序（最新的在前）
const sortedNotes = computed(() => {
  return [...notes.value].sort((a, b) => b.updatedAt - a.updatedAt)
})

// 预览内容
const previewContent = computed(() => {
  if (!editContent.value.trim()) {
    return '<p class="preview-placeholder">预览内容将显示在这里...</p>'
  }
  return renderMarkdown(editContent.value)
})

// 渲染笔记内容
const renderNoteContent = (content: string): string => {
  return renderMarkdown(content)
}

// 检测内容是否为 Markdown
const isMarkdownContent = (content: string): boolean => {
  // 检测常见的 Markdown 语法
  const markdownPatterns = [
    /^#{1,6}\s/m,           // 标题
    /\*\*.*\*\*/,           // 粗体
    /\*[^*]+\*/,            // 斜体
    /```[\s\S]*```/,        // 代码块
    /`[^`]+`/,              // 行内代码
    /^\s*[-*+]\s/m,         // 无序列表
    /^\s*\d+\.\s/m,         // 有序列表
    /\[.*\]\(.*\)/,         // 链接
    /!\[.*\]\(.*\)/,        // 图片
    /^\s*>/m,               // 引用
    /\$.*\$/,               // LaTeX 公式
    /\$\$[\s\S]*\$\$/       // 块级公式
  ]
  return markdownPatterns.some(pattern => pattern.test(content))
}

// 监听知识点变化，重置编辑状态
watch(() => props.knowledgePointId, () => {
  showEditor.value = false
  editContent.value = ''
  editingNoteId.value = null
  editorMode.value = 'edit'
})

// 处理文件上传
const handleFileChange = async (file: UploadFile) => {
  if (!file.raw) return

  try {
    const content = await file.raw.text()
    editContent.value = content
    showEditor.value = true
    editorMode.value = 'preview'
    ElMessage.success('文件导入成功，可以预览和编辑')
  } catch (error) {
    ElMessage.error('文件读取失败')
    console.error('File read error:', error)
  }
}

// 保存笔记
const saveNote = () => {
  const content = editContent.value.trim()
  if (!content) return

  const isMarkdown = isMarkdownContent(content)
  const noteData = {
    content,
    isMarkdown,
    aiOptimized: false
  }

  if (editingNoteId.value) {
    progressStore.updateNote(editingNoteId.value, content, { isMarkdown })
    ElMessage.success('笔记已更新')
  } else {
    progressStore.addNote(props.knowledgePointId, content, { isMarkdown })
    ElMessage.success('笔记已保存')
  }

  cancelEdit()
}

// 编辑笔记
const editNote = (note: StudyNote) => {
  editingNoteId.value = note.id
  editContent.value = note.content
  showEditor.value = true
  editorMode.value = 'edit'
}

// 删除笔记
const deleteNote = (noteId: string) => {
  progressStore.deleteNote(noteId)
  ElMessage.success('笔记已删除')
}

// 取消编辑
const cancelEdit = () => {
  showEditor.value = false
  editContent.value = ''
  editingNoteId.value = null
  editorMode.value = 'edit'
}

// AI 优化笔记
const optimizeWithAI = async () => {
  if (!editContent.value.trim()) return

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
              content: `请优化以下学习笔记：\n\n${editContent.value}`
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

    if (!response.ok) {
      throw new Error('AI 服务请求失败')
    }

    const data = await response.json()
    const optimizedContent = data.output?.choices?.[0]?.message?.content
      || data.output?.text
      || ''

    if (optimizedContent) {
      editContent.value = optimizedContent
      editorMode.value = 'preview'
      ElMessage.success('笔记优化完成，请预览确认')
    } else {
      throw new Error('AI 返回内容为空')
    }
  } catch (error) {
    console.error('AI optimization error:', error)
    ElMessage.error('AI 优化失败，请检查网络或 API 配置')
  } finally {
    aiOptimizing.value = false
  }
}

// 格式化时间
const formatTime = (timestamp: number) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - timestamp

  // 今天
  if (date.toDateString() === now.toDateString()) {
    return `今天 ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`
  }

  // 昨天
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) {
    return `昨天 ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`
  }

  // 7天内
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    const days = Math.floor(diff / (24 * 60 * 60 * 1000))
    return `${days}天前`
  }

  // 其他
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}
</script>

<style lang="scss" scoped>
.notes-section {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--border-color);
}

.notes-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;

  h3 {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 600;
    color: var(--text-color);
    margin: 0;

    .el-icon {
      color: var(--primary-color);
    }

    .notes-count {
      font-size: 14px;
      font-weight: 400;
      color: var(--text-color-secondary);
    }
  }

  .header-actions {
    display: flex;
    gap: 8px;
  }
}

.note-editor {
  background-color: var(--bg-color);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;

  .editor-toolbar {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;

    .help-icon {
      color: var(--text-color-placeholder);
      cursor: help;
    }
  }

  .editor-input {
    :deep(.el-textarea__inner) {
      font-family: 'Consolas', 'Monaco', monospace;
      line-height: 1.6;
    }
  }

  .editor-preview {
    min-height: 200px;
    max-height: 400px;
    overflow-y: auto;
    padding: 12px;
    background-color: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: 4px;

    .preview-placeholder {
      color: var(--text-color-placeholder);
      font-style: italic;
    }
  }

  .editor-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 12px;
  }
}

.notes-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.note-item {
  background-color: var(--bg-color);
  border-radius: 8px;
  padding: 16px;
  border-left: 3px solid var(--primary-color);

  &.is-markdown {
    border-left-color: #67C23A;
  }

  .note-content {
    color: var(--text-color);
    line-height: 1.8;
    white-space: pre-wrap;
    word-break: break-word;

    &.markdown-body {
      white-space: normal;
    }
  }

  .note-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px dashed var(--border-color);

    .note-meta {
      display: flex;
      align-items: center;
      gap: 8px;

      .note-time {
        font-size: 12px;
        color: var(--text-color-placeholder);
      }
    }

    .note-actions {
      display: flex;
      gap: 8px;
    }
  }
}

.notes-empty {
  text-align: center;
  padding: 32px;
  color: var(--text-color-placeholder);

  .el-icon {
    margin-bottom: 8px;
  }

  p {
    margin: 0;
    font-size: 14px;
  }
}

// Markdown 渲染样式
.markdown-body {
  :deep(h1), :deep(h2), :deep(h3), :deep(h4), :deep(h5), :deep(h6) {
    margin-top: 16px;
    margin-bottom: 8px;
    font-weight: 600;
    line-height: 1.4;
    color: var(--text-color);
  }

  :deep(h1) { font-size: 1.5em; }
  :deep(h2) { font-size: 1.3em; }
  :deep(h3) { font-size: 1.1em; }

  :deep(p) {
    margin: 8px 0;
    line-height: 1.8;
  }

  :deep(ul), :deep(ol) {
    margin: 8px 0;
    padding-left: 24px;
  }

  :deep(li) {
    margin: 4px 0;
  }

  :deep(code) {
    background-color: var(--bg-color-mute, #f5f5f5);
    padding: 2px 6px;
    border-radius: 4px;
    font-family: 'Consolas', 'Monaco', monospace;
    font-size: 0.9em;
  }

  :deep(pre) {
    background-color: var(--bg-color-mute, #f5f5f5);
    padding: 12px;
    border-radius: 8px;
    overflow-x: auto;

    code {
      background: none;
      padding: 0;
    }
  }

  :deep(blockquote) {
    margin: 12px 0;
    padding: 8px 16px;
    border-left: 4px solid var(--primary-color);
    background-color: var(--bg-color-mute, #f9f9f9);
    color: var(--text-color-secondary);
  }

  :deep(table) {
    width: 100%;
    border-collapse: collapse;
    margin: 12px 0;

    th, td {
      border: 1px solid var(--border-color);
      padding: 8px 12px;
      text-align: left;
    }

    th {
      background-color: var(--bg-color-mute, #f5f5f5);
      font-weight: 600;
    }
  }

  :deep(a) {
    color: var(--primary-color);
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  :deep(strong) {
    font-weight: 600;
    color: var(--text-color);
  }

  :deep(em) {
    font-style: italic;
  }

  :deep(hr) {
    margin: 16px 0;
    border: none;
    border-top: 1px solid var(--border-color);
  }

  // KaTeX 公式样式
  :deep(.katex-display) {
    margin: 16px 0;
    overflow-x: auto;
    overflow-y: hidden;
  }

  :deep(.katex-block-wrapper) {
    margin: 16px 0;
    text-align: center;
  }
}
</style>
