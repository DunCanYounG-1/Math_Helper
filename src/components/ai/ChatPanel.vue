<template>
  <div class="chat-panel" :class="{ expanded: isExpanded }">
    <!-- 折叠状态显示的按钮 -->
    <div v-if="!isExpanded" class="chat-trigger" @click="toggleExpand">
      <el-icon><ChatDotRound /></el-icon>
      <span>AI 助手</span>
    </div>

    <!-- 展开状态的聊天面板 -->
    <div v-else class="chat-container">
      <div class="chat-header">
        <div class="header-title">
          <el-icon><ChatDotRound /></el-icon>
          <span>AI 智能问答</span>
        </div>
        <div class="header-actions">
          <el-button :icon="Delete" size="small" text @click="clearHistory" title="清空对话" />
          <el-button :icon="Minus" size="small" text @click="toggleExpand" title="收起" />
        </div>
      </div>

      <!-- 对话模式选择 -->
      <div class="chat-mode-selector">
        <div
          v-for="mode in chatModes"
          :key="mode.value"
          class="mode-item"
          :class="{ active: chatMode === mode.value }"
          @click="chatMode = mode.value as ChatMode"
        >
          <el-icon><component :is="mode.icon" /></el-icon>
          <span>{{ mode.label }}</span>
        </div>
      </div>

      <!-- 对话内容区域 -->
      <div class="chat-messages" ref="messagesRef">
        <!-- 欢迎消息 -->
        <div v-if="messages.length === 0" class="welcome-message">
          <div class="welcome-icon">
            <el-icon :size="48"><MagicStick /></el-icon>
          </div>
          <div class="welcome-title">你好，我是数学助手</div>
          <div class="welcome-desc">
            <template v-if="currentKnowledgePoint">
              当前正在学习「{{ currentKnowledgePoint.title }}」，你可以问我任何相关问题！
            </template>
            <template v-else>
              我可以帮你解答高等数学相关问题，试试问我吧！
            </template>
          </div>
          <div class="quick-questions">
            <div class="quick-title">快速提问：</div>
            <div class="quick-list">
              <el-tag
                v-for="(question, index) in quickQuestions"
                :key="index"
                class="quick-tag"
                @click="sendQuickQuestion(question)"
              >
                {{ question }}
              </el-tag>
            </div>
          </div>
        </div>

        <!-- 消息列表 -->
        <div
          v-for="(msg, index) in messages"
          :key="index"
          class="message-item"
          :class="msg.role"
        >
          <div class="message-avatar">
            <el-icon v-if="msg.role === 'assistant'"><MagicStick /></el-icon>
            <el-icon v-else><User /></el-icon>
          </div>
          <div class="message-content">
            <div class="message-text" v-html="renderContent(msg.content)"></div>
            <div class="message-time">{{ formatTime(msg.timestamp) }}</div>
          </div>
        </div>

        <!-- 加载中提示 -->
        <div v-if="isLoading" class="message-item assistant loading">
          <div class="message-avatar">
            <el-icon><MagicStick /></el-icon>
          </div>
          <div class="message-content">
            <div class="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      </div>

      <!-- 输入区域 -->
      <div class="chat-input">
        <el-input
          v-model="inputText"
          type="textarea"
          :rows="2"
          placeholder="输入你的问题..."
          resize="none"
          @keydown.enter.exact.prevent="sendMessage"
          :disabled="isLoading || !isConfigured"
        />
        <el-button
          type="primary"
          :icon="Promotion"
          :loading="isLoading"
          :disabled="!inputText.trim() || !isConfigured"
          @click="sendMessage"
        >
          发送
        </el-button>
      </div>

      <!-- 未配置API提示 -->
      <div v-if="!isConfigured" class="config-hint">
        <el-icon><Warning /></el-icon>
        <span>请先在设置中配置 AI API Key</span>
        <el-button type="primary" link @click="goToSettings">前往设置</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import {
  ChatDotRound,
  Minus,
  Delete,
  MagicStick,
  User,
  Promotion,
  Warning,
  QuestionFilled,
  Memo,
  Compass
} from '@element-plus/icons-vue'
import { isConfigured as checkConfigured, getAIConfig } from '@/services/aiService'
import { useKnowledgeStore, type KnowledgePoint } from '@/stores/knowledgeStore'
import { getGeneralQAPrompt, QUICK_QUESTIONS } from '@/config/aiPrompts'
import katex from 'katex'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

const props = defineProps<{
  knowledgePointId?: string
}>()

const router = useRouter()
const knowledgeStore = useKnowledgeStore()

const isExpanded = ref(false)
const inputText = ref('')
const messages = ref<ChatMessage[]>([])
const isLoading = ref(false)
const messagesRef = ref<HTMLElement | null>(null)

const isConfigured = computed(() => checkConfigured())

const currentKnowledgePoint = computed<KnowledgePoint | null>(() => {
  if (!props.knowledgePointId) return null
  return knowledgeStore.getKnowledgePointById(props.knowledgePointId) || null
})

// 对话模式
type ChatMode = 'general' | 'explain' | 'solve'
const chatMode = ref<ChatMode>('general')

const chatModes = [
  { value: 'general', label: '自由问答', icon: QuestionFilled },
  { value: 'explain', label: '概念解释', icon: Memo },
  { value: 'solve', label: '解题引导', icon: Compass }
]

// 快速问题列表（根据当前知识点和章节动态生成）
const quickQuestions = computed(() => {
  if (currentKnowledgePoint.value) {
    const kp = currentKnowledgePoint.value
    return QUICK_QUESTIONS.forKnowledgePoint(kp.title, kp.keyPoints)
  }
  return QUICK_QUESTIONS.GENERAL
})

const toggleExpand = () => {
  isExpanded.value = !isExpanded.value
}

const clearHistory = () => {
  messages.value = []
}

const goToSettings = () => {
  router.push('/settings')
}

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

// 渲染消息内容（支持LaTeX公式）
const renderContent = (content: string) => {
  // 处理行内公式 $...$
  let result = content.replace(/\$([^$]+)\$/g, (_, formula) => {
    try {
      return katex.renderToString(formula, { throwOnError: false, displayMode: false })
    } catch {
      return `$${formula}$`
    }
  })

  // 处理块级公式 $$...$$
  result = result.replace(/\$\$([^$]+)\$\$/g, (_, formula) => {
    try {
      return `<div class="formula-block">${katex.renderToString(formula, { throwOnError: false, displayMode: true })}</div>`
    } catch {
      return `$$${formula}$$`
    }
  })

  // 处理换行
  result = result.replace(/\n/g, '<br>')

  return result
}

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesRef.value) {
      messagesRef.value.scrollTop = messagesRef.value.scrollHeight
    }
  })
}

const sendQuickQuestion = (question: string) => {
  inputText.value = question
  sendMessage()
}

const sendMessage = async () => {
  const text = inputText.value.trim()
  if (!text || isLoading.value || !isConfigured.value) return

  // 添加用户消息
  messages.value.push({
    role: 'user',
    content: text,
    timestamp: Date.now()
  })
  inputText.value = ''
  scrollToBottom()

  // 调用AI
  isLoading.value = true
  try {
    const response = await askQuestion(text)
    messages.value.push({
      role: 'assistant',
      content: response,
      timestamp: Date.now()
    })
  } catch (error) {
    messages.value.push({
      role: 'assistant',
      content: error instanceof Error ? `抱歉，发生错误：${error.message}` : '抱歉，发生未知错误',
      timestamp: Date.now()
    })
  } finally {
    isLoading.value = false
    scrollToBottom()
  }
}

// 调用AI问答
const askQuestion = async (question: string): Promise<string> => {
  const config = getAIConfig()

  // 构建上下文
  let context = ''
  if (currentKnowledgePoint.value) {
    const kp = currentKnowledgePoint.value
    context = `当前用户正在学习的知识点：
**标题**：${kp.title}
**描述**：${kp.description}
**核心要点**：${kp.keyPoints.join('、')}
${kp.formulas?.length ? `**相关公式**：${kp.formulas.map(f => f.name).join('、')}` : ''}`
  }

  // 构建对话历史（最近5轮）
  const recentMessages = messages.value.slice(-10).map(m => ({
    role: m.role,
    content: m.content
  }))

  // 使用新的提示词配置
  const systemPrompt = getGeneralQAPrompt(context)

  // 根据对话模式添加补充指令
  let modeInstruction = ''
  if (chatMode.value === 'explain') {
    modeInstruction = '\n\n## 当前模式：概念解释\n用户希望你详细解释概念，请多用比喻和例子。'
  } else if (chatMode.value === 'solve') {
    modeInstruction = '\n\n## 当前模式：解题引导\n用户希望你帮助解题，请先引导思考，分步骤讲解。'
  }

  const apiMessages = [
    { role: 'system', content: systemPrompt + modeInstruction },
    ...recentMessages,
    { role: 'user', content: question }
  ]

  // 根据服务商构建请求
  let requestBody: any
  if (config.provider === 'deepseek') {
    requestBody = {
      model: config.model,
      messages: apiMessages,
      temperature: 0.7,
      max_tokens: 1500,
      stream: false
    }
  } else {
    requestBody = {
      model: config.model,
      input: { messages: apiMessages },
      parameters: {
        temperature: 0.7,
        max_tokens: 1500,
        result_format: 'message'
      }
    }
  }

  const response = await fetch(config.baseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`
    },
    body: JSON.stringify(requestBody)
  })

  if (!response.ok) {
    const errorText = await response.text()
    let errorMessage = `API请求失败: ${response.status}`
    try {
      const errorData = JSON.parse(errorText)
      errorMessage = errorData.error?.message || errorData.message || errorMessage
    } catch {
      if (errorText) errorMessage = errorText
    }
    throw new Error(errorMessage)
  }

  const data = await response.json()

  // 解析响应
  if (config.provider === 'deepseek') {
    return data.choices?.[0]?.message?.content || '抱歉，无法获取回答'
  } else {
    return data.output?.choices?.[0]?.message?.content || data.output?.text || '抱歉，无法获取回答'
  }
}

// 监听知识点变化，添加提示消息
watch(() => props.knowledgePointId, (newId, oldId) => {
  if (newId && newId !== oldId && currentKnowledgePoint.value) {
    // 可选：添加切换提示
  }
})

// 数据已在 App.vue 中全局加载，无需重复加载
</script>

<style lang="scss" scoped>
.chat-panel {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 100;

  &.expanded {
    width: 400px;
    height: 560px;
  }
}

.chat-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: linear-gradient(135deg, var(--primary-color) 0%, #6366f1 100%);
  color: white;
  border-radius: 24px;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.4);
  transition: all 0.3s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(64, 158, 255, 0.5);
  }

  .el-icon {
    font-size: 20px;
  }
}

.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--card-bg);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(135deg, var(--primary-color) 0%, #6366f1 100%);
  color: white;

  .header-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;

    .el-icon {
      font-size: 20px;
    }
  }

  .header-actions {
    display: flex;
    gap: 4px;

    .el-button {
      color: white;
      opacity: 0.8;

      &:hover {
        opacity: 1;
      }
    }
  }
}

.chat-mode-selector {
  display: flex;
  padding: 8px 12px;
  gap: 8px;
  background-color: var(--card-bg);
  border-bottom: 1px solid var(--border-color);

  .mode-item {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 8px 12px;
    font-size: 12px;
    color: var(--text-color-secondary);
    background-color: var(--bg-color);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;

    .el-icon {
      font-size: 14px;
    }

    &:hover {
      color: var(--primary-color);
      background-color: var(--primary-color-light);
    }

    &.active {
      color: white;
      background: linear-gradient(135deg, var(--primary-color) 0%, #6366f1 100%);
    }
  }
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background-color: var(--bg-color);
}

.welcome-message {
  text-align: center;
  padding: 24px 16px;

  .welcome-icon {
    color: var(--primary-color);
    margin-bottom: 12px;
  }

  .welcome-title {
    font-size: 18px;
    font-weight: 600;
    color: var(--text-color);
    margin-bottom: 8px;
  }

  .welcome-desc {
    font-size: 14px;
    color: var(--text-color-secondary);
    margin-bottom: 20px;
  }

  .quick-questions {
    text-align: left;

    .quick-title {
      font-size: 12px;
      color: var(--text-color-secondary);
      margin-bottom: 8px;
    }

    .quick-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .quick-tag {
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }
    }
  }
}

.message-item {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;

  &.user {
    flex-direction: row-reverse;

    .message-content {
      background-color: var(--primary-color);
      color: white;
      border-radius: 16px 16px 4px 16px;
    }

    .message-time {
      text-align: right;
      color: rgba(255, 255, 255, 0.7);
    }
  }

  &.assistant {
    .message-content {
      background-color: var(--card-bg);
      border-radius: 16px 16px 16px 4px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }
  }

  &.loading {
    .message-content {
      padding: 16px 20px;
    }
  }
}

.message-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: var(--primary-color-light);
  color: var(--primary-color);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  .user & {
    background-color: var(--primary-color);
    color: white;
  }
}

.message-content {
  max-width: 280px;
  padding: 12px 16px;

  .message-text {
    font-size: 14px;
    line-height: 1.6;

    :deep(.formula-block) {
      margin: 12px 0;
      overflow-x: auto;
    }
  }

  .message-time {
    font-size: 11px;
    color: var(--text-color-placeholder);
    margin-top: 4px;
  }
}

.typing-indicator {
  display: flex;
  gap: 4px;

  span {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: var(--primary-color);
    animation: typing 1.4s infinite ease-in-out;

    &:nth-child(1) { animation-delay: 0s; }
    &:nth-child(2) { animation-delay: 0.2s; }
    &:nth-child(3) { animation-delay: 0.4s; }
  }
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  30% {
    transform: translateY(-8px);
    opacity: 1;
  }
}

.chat-input {
  display: flex;
  gap: 12px;
  padding: 16px;
  border-top: 1px solid var(--border-color);
  background-color: var(--card-bg);

  .el-textarea {
    flex: 1;

    :deep(.el-textarea__inner) {
      border-radius: 12px;
      resize: none;
    }
  }

  .el-button {
    height: auto;
    border-radius: 12px;
    padding: 0 20px;
  }
}

.config-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  background-color: #fef0f0;
  color: #f56c6c;
  font-size: 13px;

  .el-icon {
    font-size: 16px;
  }
}
</style>
