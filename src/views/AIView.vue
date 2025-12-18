<template>
  <div class="ai-view">
    <div class="view-header">
      <h1>
        <el-icon><ChatDotRound /></el-icon>
        AI 智能助手
      </h1>
      <p class="view-desc">你的数学学习伙伴，可以解答问题、解释概念、引导解题</p>
    </div>

    <div class="ai-content">
      <!-- AI 聊天区域 -->
      <div class="chat-section">
        <div class="chat-container">
          <div class="chat-header-bar">
            <div class="mode-selector">
              <div
                v-for="mode in chatModes"
                :key="mode.value"
                class="mode-item"
                :class="{ active: chatMode === mode.value }"
                @click="chatMode = mode.value"
              >
                <el-icon><component :is="mode.icon" /></el-icon>
                <span>{{ mode.label }}</span>
              </div>
            </div>
            <el-button :icon="Delete" text @click="clearHistory" title="清空对话">
              清空
            </el-button>
          </div>

          <!-- 对话内容 -->
          <div class="chat-messages" ref="messagesRef">
            <div v-if="messages.length === 0" class="welcome-message">
              <div class="welcome-icon">
                <el-icon :size="64"><MagicStick /></el-icon>
              </div>
              <div class="welcome-title">你好，我是数学助手</div>
              <div class="welcome-desc">我可以帮你解答高等数学相关问题，选择一个模式开始吧！</div>
              <div class="quick-questions">
                <div class="quick-title">试试这些问题：</div>
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
              :rows="3"
              placeholder="输入你的问题... (Enter发送，Shift+Enter换行)"
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
              size="large"
            >
              发送
            </el-button>
          </div>

          <div v-if="!isConfigured" class="config-hint">
            <el-icon><Warning /></el-icon>
            <span>请先在设置中配置 AI API Key</span>
            <el-button type="primary" link @click="goToSettings">前往设置</el-button>
          </div>
        </div>
      </div>

      <!-- 功能说明侧边栏 -->
      <div class="features-sidebar">
        <div class="feature-card">
          <div class="feature-icon">
            <el-icon><QuestionFilled /></el-icon>
          </div>
          <div class="feature-info">
            <h4>自由问答</h4>
            <p>任意数学问题，AI都能帮你解答</p>
          </div>
        </div>
        <div class="feature-card">
          <div class="feature-icon">
            <el-icon><Memo /></el-icon>
          </div>
          <div class="feature-info">
            <h4>概念解释</h4>
            <p>用通俗易懂的语言解释数学概念</p>
          </div>
        </div>
        <div class="feature-card">
          <div class="feature-icon">
            <el-icon><Compass /></el-icon>
          </div>
          <div class="feature-info">
            <h4>解题引导</h4>
            <p>一步步引导你思考，掌握解题方法</p>
          </div>
        </div>
        <div class="feature-card">
          <div class="feature-icon">
            <el-icon><Connection /></el-icon>
          </div>
          <div class="feature-info">
            <h4>当前模型</h4>
            <p class="model-info">{{ currentModelInfo }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import {
  ChatDotRound,
  Delete,
  MagicStick,
  User,
  Promotion,
  Warning,
  QuestionFilled,
  Memo,
  Compass,
  Connection
} from '@element-plus/icons-vue'
import { isConfigured as checkConfigured, getAIConfig, providerConfigs } from '@/services/aiService'
import katex from 'katex'
import { marked } from 'marked'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

const router = useRouter()

const inputText = ref('')
const messages = ref<ChatMessage[]>([])
const isLoading = ref(false)
const messagesRef = ref<HTMLElement | null>(null)
const chatMode = ref('general')

const isConfigured = computed(() => checkConfigured())

const currentModelInfo = computed(() => {
  if (!isConfigured.value) return '未配置'
  const config = getAIConfig()
  const providerConfig = providerConfigs[config.provider]
  const modelInfo = providerConfig?.models.find(m => m.value === config.model)
  return modelInfo?.label || config.model
})

const chatModes = [
  { value: 'general', label: '自由问答', icon: QuestionFilled },
  { value: 'explain', label: '概念解释', icon: Memo },
  { value: 'solve', label: '解题引导', icon: Compass }
]

const quickQuestions = [
  '什么是极限？',
  '导数的几何意义是什么？',
  '如何计算不定积分？',
  '什么是泰勒展开？',
  '如何判断级数收敛？',
  '拉格朗日中值定理怎么用？'
]

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

const renderContent = (content: string) => {
  // 1. 保护LaTeX公式，用占位符替换
  const blockFormulas: string[] = []
  const inlineFormulas: string[] = []

  // 先处理块级公式 $$...$$
  let result = content.replace(/\$\$([^$]+)\$\$/g, (_, formula) => {
    blockFormulas.push(formula)
    return `%%BLOCK_FORMULA_${blockFormulas.length - 1}%%`
  })

  // 再处理行内公式 $...$
  result = result.replace(/\$([^$]+)\$/g, (_, formula) => {
    inlineFormulas.push(formula)
    return `%%INLINE_FORMULA_${inlineFormulas.length - 1}%%`
  })

  // 2. 解析Markdown
  result = marked.parse(result, { async: false }) as string

  // 3. 还原并渲染LaTeX公式
  // 还原块级公式
  result = result.replace(/%%BLOCK_FORMULA_(\d+)%%/g, (_, index) => {
    const formula = blockFormulas[parseInt(index)]
    try {
      return `<div class="formula-block">${katex.renderToString(formula, { throwOnError: false, displayMode: true })}</div>`
    } catch {
      return `$$${formula}$$`
    }
  })

  // 还原行内公式
  result = result.replace(/%%INLINE_FORMULA_(\d+)%%/g, (_, index) => {
    const formula = inlineFormulas[parseInt(index)]
    try {
      return katex.renderToString(formula, { throwOnError: false, displayMode: false })
    } catch {
      return `$${formula}$`
    }
  })

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

  messages.value.push({
    role: 'user',
    content: text,
    timestamp: Date.now()
  })
  inputText.value = ''
  scrollToBottom()

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

const askQuestion = async (question: string): Promise<string> => {
  const config = getAIConfig()

  let modeInstruction = ''
  if (chatMode.value === 'explain') {
    modeInstruction = '用户希望你详细解释数学概念，请多用比喻和例子，语言通俗易懂。'
  } else if (chatMode.value === 'solve') {
    modeInstruction = '用户希望你帮助解题，请先引导思考，分步骤讲解，不要直接给出答案。'
  }

  const systemPrompt = `你是一位资深的高等数学老师，擅长用通俗易懂的语言解释复杂的数学概念。

## 回答要求
1. 语言简洁明了，避免过于学术化的表达
2. 数学公式使用 LaTeX 格式，行内公式用 $...$，独立公式用 $$...$$
3. 适当使用比喻和生活例子
4. 分步骤讲解，逻辑清晰
5. 鼓励学生思考，不要直接给全部答案

${modeInstruction}`

  const recentMessages = messages.value.slice(-10).map(m => ({
    role: m.role,
    content: m.content
  }))

  const apiMessages = [
    { role: 'system', content: systemPrompt },
    ...recentMessages,
    { role: 'user', content: question }
  ]

  let requestBody: any
  if (config.provider === 'qwen') {
    requestBody = {
      model: config.model,
      input: { messages: apiMessages },
      parameters: {
        temperature: 0.7,
        max_tokens: 1500,
        result_format: 'message'
      }
    }
  } else {
    requestBody = {
      model: config.model,
      messages: apiMessages,
      temperature: 0.7,
      max_tokens: 1500,
      stream: false
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

  if (config.provider === 'qwen') {
    return data.output?.choices?.[0]?.message?.content || data.output?.text || '抱歉，无法获取回答'
  } else {
    return data.choices?.[0]?.message?.content || '抱歉，无法获取回答'
  }
}
</script>

<style lang="scss" scoped>
.ai-view {
  max-width: 1400px;
  margin: 0 auto;
  padding: var(--spacing-md) var(--spacing-lg);
  height: calc(100vh - 88px);
  display: flex;
  flex-direction: column;
}

.view-header {
  text-align: center;
  margin-bottom: var(--spacing-lg);
  flex-shrink: 0;

  h1 {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-sm);
    font-size: 28px;
    font-weight: 700;
    color: var(--text-color);
    margin-bottom: var(--spacing-xs);

    .el-icon {
      color: var(--primary-color);
    }
  }

  .view-desc {
    font-size: 15px;
    color: var(--text-color-tertiary);
    margin: 0;
  }
}

.ai-content {
  flex: 1;
  display: flex;
  gap: var(--spacing-lg);
  min-height: 0;
}

.chat-section {
  flex: 1;
  min-width: 0;
}

.chat-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--card-bg);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  box-shadow: var(--box-shadow);
}

.chat-header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(135deg, var(--primary-color) 0%, #6366f1 100%);

  .mode-selector {
    display: flex;
    gap: 8px;
  }

  .mode-item {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.8);
    background-color: rgba(255, 255, 255, 0.15);
    border-radius: 20px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background-color: rgba(255, 255, 255, 0.25);
      color: white;
    }

    &.active {
      background-color: white;
      color: var(--primary-color);
    }
  }

  .el-button {
    color: rgba(255, 255, 255, 0.8);

    &:hover {
      color: white;
    }
  }
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background-color: var(--bg-color);
}

.welcome-message {
  text-align: center;
  padding: 40px 20px;

  .welcome-icon {
    color: var(--primary-color);
    margin-bottom: 16px;
  }

  .welcome-title {
    font-size: 24px;
    font-weight: 600;
    color: var(--text-color);
    margin-bottom: 8px;
  }

  .welcome-desc {
    font-size: 15px;
    color: var(--text-color-secondary);
    margin-bottom: 32px;
  }

  .quick-questions {
    text-align: left;
    max-width: 500px;
    margin: 0 auto;

    .quick-title {
      font-size: 13px;
      color: var(--text-color-secondary);
      margin-bottom: 12px;
    }

    .quick-list {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }

    .quick-tag {
      cursor: pointer;
      font-size: 13px;
      padding: 8px 14px;
      transition: all 0.2s;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }
    }
  }
}

.message-item {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;

  &.user {
    flex-direction: row-reverse;

    .message-content {
      background-color: var(--primary-color);
      color: white;
      border-radius: 18px 18px 4px 18px;
    }

    .message-time {
      text-align: right;
      color: rgba(255, 255, 255, 0.7);
    }
  }

  &.assistant {
    .message-content {
      background-color: var(--card-bg);
      border-radius: 18px 18px 18px 4px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }
  }

  &.loading .message-content {
    padding: 20px 24px;
  }
}

.message-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: var(--primary-color-light);
  color: var(--primary-color);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 20px;

  .user & {
    background-color: var(--primary-color);
    color: white;
  }
}

.message-content {
  max-width: 70%;
  padding: 14px 18px;

  .message-text {
    font-size: 15px;
    line-height: 1.7;

    :deep(.formula-block) {
      margin: 16px 0;
      overflow-x: auto;
    }

    // Markdown 样式支持
    :deep(h1), :deep(h2), :deep(h3), :deep(h4), :deep(h5), :deep(h6) {
      margin: 16px 0 8px 0;
      font-weight: 600;
      line-height: 1.4;
    }

    :deep(h1) { font-size: 1.4em; }
    :deep(h2) { font-size: 1.25em; }
    :deep(h3) { font-size: 1.15em; }
    :deep(h4), :deep(h5), :deep(h6) { font-size: 1em; }

    :deep(p) {
      margin: 8px 0;
    }

    :deep(ul), :deep(ol) {
      margin: 8px 0;
      padding-left: 20px;
    }

    :deep(li) {
      margin: 4px 0;
    }

    :deep(code) {
      background-color: rgba(0, 0, 0, 0.06);
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'SF Mono', Monaco, Consolas, monospace;
      font-size: 0.9em;
    }

    :deep(pre) {
      background-color: rgba(0, 0, 0, 0.06);
      padding: 12px 16px;
      border-radius: 8px;
      overflow-x: auto;
      margin: 12px 0;

      code {
        background: none;
        padding: 0;
        font-size: 13px;
        line-height: 1.5;
      }
    }

    :deep(blockquote) {
      margin: 12px 0;
      padding: 8px 16px;
      border-left: 3px solid var(--primary-color);
      background-color: rgba(0, 122, 255, 0.06);
      border-radius: 0 8px 8px 0;

      p {
        margin: 0;
      }
    }

    :deep(table) {
      border-collapse: collapse;
      margin: 12px 0;
      width: 100%;
      font-size: 14px;
    }

    :deep(th), :deep(td) {
      border: 1px solid var(--border-color);
      padding: 8px 12px;
      text-align: left;
    }

    :deep(th) {
      background-color: rgba(0, 0, 0, 0.04);
      font-weight: 600;
    }

    :deep(hr) {
      border: none;
      border-top: 1px solid var(--border-color);
      margin: 16px 0;
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
    }

    :deep(em) {
      font-style: italic;
    }
  }

  .message-time {
    font-size: 11px;
    color: var(--text-color-placeholder);
    margin-top: 6px;
  }
}

.typing-indicator {
  display: flex;
  gap: 6px;

  span {
    width: 10px;
    height: 10px;
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
    transform: translateY(-10px);
    opacity: 1;
  }
}

.chat-input {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid var(--border-color);
  background-color: var(--card-bg);

  .el-textarea {
    flex: 1;

    :deep(.el-textarea__inner) {
      border-radius: 12px;
      resize: none;
      font-size: 15px;
    }
  }

  .el-button {
    height: auto;
    border-radius: 12px;
    padding: 0 24px;
    font-size: 15px;
  }
}

.config-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px;
  background-color: rgba(255, 149, 0, 0.1);
  color: var(--ios-orange);
  font-size: 14px;
}

.features-sidebar {
  width: 280px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.feature-card {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 16px;
  background-color: var(--card-bg);
  border-radius: var(--border-radius);
  box-shadow: var(--box-shadow-sm);

  .feature-icon {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: linear-gradient(135deg, var(--primary-color) 0%, #6366f1 100%);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    .el-icon {
      font-size: 22px;
    }
  }

  .feature-info {
    h4 {
      font-size: 15px;
      font-weight: 600;
      color: var(--text-color);
      margin-bottom: 4px;
    }

    p {
      font-size: 13px;
      color: var(--text-color-secondary);
      margin: 0;
      line-height: 1.5;
    }

    .model-info {
      color: var(--primary-color);
      font-weight: 500;
    }
  }
}

@media (max-width: 900px) {
  .features-sidebar {
    display: none;
  }

  .message-content {
    max-width: 85%;
  }
}
</style>
