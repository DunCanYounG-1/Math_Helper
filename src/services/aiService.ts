/**
 * AI服务 - 多服务商集成
 * 支持通义千问、DeepSeek等AI服务
 */

// AI 服务商类型
export type AIProvider = 'qwen' | 'deepseek'

export interface AIConfig {
  provider: AIProvider
  apiKey: string
  model: string
  baseUrl: string
}

export interface MetaphorRequest {
  knowledgePointTitle: string
  knowledgePointDescription: string
  keyPoints: string[]
  existingMetaphors: string[]
}

export interface MetaphorResponse {
  title: string
  content: string
  tags: string[]
}

// 判断是否为开发环境
const isDev = import.meta.env.DEV

// 服务商配置
export const providerConfigs: Record<AIProvider, { baseUrl: string; defaultModel: string; models: { value: string; label: string }[] }> = {
  qwen: {
    // 开发环境使用代理，生产环境直连
    baseUrl: isDev
      ? '/api/qwen/api/v1/services/aigc/text-generation/generation'
      : 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
    defaultModel: 'qwen-turbo',
    models: [
      { value: 'qwen-turbo', label: 'Qwen Turbo (快速)' },
      { value: 'qwen-plus', label: 'Qwen Plus (均衡)' },
      { value: 'qwen-max', label: 'Qwen Max (强力)' }
    ]
  },
  deepseek: {
    // 开发环境使用代理，生产环境直连
    // DeepSeek API 官方地址，兼容 OpenAI 格式
    baseUrl: isDev
      ? '/api/deepseek/chat/completions'
      : 'https://api.deepseek.com/chat/completions',
    defaultModel: 'deepseek-chat',
    models: [
      { value: 'deepseek-chat', label: 'DeepSeek-V3 (通用对话)' },
      { value: 'deepseek-reasoner', label: 'DeepSeek-R1 (深度推理)' }
    ]
  }
}

// 默认配置
const defaultConfig: AIConfig = {
  provider: 'qwen',
  apiKey: '',
  model: 'qwen-turbo',
  baseUrl: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation'
}

let config: AIConfig = { ...defaultConfig }

/**
 * 设置AI配置
 */
export function setAIConfig(newConfig: Partial<AIConfig>) {
  config = { ...config, ...newConfig }
}

/**
 * 获取当前配置
 */
export function getAIConfig(): AIConfig {
  return { ...config }
}

/**
 * 检查API Key是否已配置
 */
export function isConfigured(): boolean {
  return !!config.apiKey && config.apiKey.length > 0
}

/**
 * 构建生成比喻的提示词
 */
function buildMetaphorPrompt(request: MetaphorRequest): string {
  const existingList = request.existingMetaphors.length > 0
    ? `\n已有的比喻（请生成不同角度的新比喻）：\n${request.existingMetaphors.map((m, i) => `${i + 1}. ${m}`).join('\n')}`
    : ''

  return `你是一位资深的高等数学教师，擅长用生动形象的比喻帮助学生理解抽象的数学概念。

请为以下数学知识点生成一个新颖、易懂的比喻：

【知识点】${request.knowledgePointTitle}
【描述】${request.knowledgePointDescription}
【核心要点】
${request.keyPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}
${existingList}

要求：
1. 比喻要贴近大学生的生活经验（如：游戏、社交、网购、外卖等）
2. 能准确反映数学概念的本质特征
3. 语言生动有趣，易于记忆
4. 避免使用已有的比喻角度

请按以下JSON格式输出：
{
  "title": "比喻标题（10字以内）",
  "content": "详细的比喻内容（100-200字）",
  "tags": ["标签1", "标签2"]
}

标签可选：生活类比、物理类比、形象比喻、游戏类比、科技类比、趣味性、入门级、进阶级`
}

/**
 * 构建 API 请求体（根据服务商不同）
 */
function buildRequestBody(messages: { role: string; content: string }[], options: { temperature?: number; max_tokens?: number } = {}) {
  const { temperature = 0.8, max_tokens = 500 } = options

  if (config.provider === 'deepseek') {
    // DeepSeek 使用 OpenAI 兼容格式
    // 参考: https://api-docs.deepseek.com/api/create-chat-completion
    return {
      model: config.model,
      messages,
      temperature,
      max_tokens,
      stream: false  // 必须设置为 false
    }
  } else {
    // 通义千问格式
    return {
      model: config.model,
      input: { messages },
      parameters: {
        temperature,
        max_tokens,
        result_format: 'message'
      }
    }
  }
}

/**
 * 解析 API 响应内容（根据服务商不同）
 */
function parseResponseContent(data: any): string {
  if (config.provider === 'deepseek') {
    // DeepSeek (OpenAI 兼容) 响应格式
    return data.choices?.[0]?.message?.content || ''
  } else {
    // 通义千问响应格式
    return data.output?.choices?.[0]?.message?.content || data.output?.text || ''
  }
}

/**
 * 调用AI API生成比喻
 */
export async function generateMetaphor(request: MetaphorRequest): Promise<MetaphorResponse> {
  if (!isConfigured()) {
    throw new Error('请先配置 API Key')
  }

  const prompt = buildMetaphorPrompt(request)
  const messages = [
    {
      role: 'system',
      content: '你是一位数学教育专家，擅长用比喻解释数学概念。请始终以JSON格式输出。'
    },
    {
      role: 'user',
      content: prompt
    }
  ]

  try {
    const requestBody = buildRequestBody(messages, { temperature: 0.8, max_tokens: 500 })
    console.log('[AI Service] Request URL:', config.baseUrl)
    console.log('[AI Service] Request Body:', JSON.stringify(requestBody, null, 2))

    const response = await fetch(config.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify(requestBody)
    })

    console.log('[AI Service] Response Status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[AI Service] Error Response:', errorText)
      let errorMessage = `API请求失败: ${response.status}`
      try {
        const errorData = JSON.parse(errorText)
        errorMessage = errorData.error?.message || errorData.message || errorMessage
      } catch {
        // 解析失败，使用原始错误文本
        if (errorText) errorMessage = errorText
      }
      throw new Error(errorMessage)
    }

    const data = await response.json()
    console.log('[AI Service] Response Data:', JSON.stringify(data, null, 2))
    const content = parseResponseContent(data)

    // 尝试解析JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('AI响应格式错误')
    }

    const result = JSON.parse(jsonMatch[0]) as MetaphorResponse

    // 验证必要字段
    if (!result.title || !result.content) {
      throw new Error('AI响应缺少必要字段')
    }

    // 确保tags是数组
    if (!Array.isArray(result.tags)) {
      result.tags = ['AI生成']
    }

    return result

  } catch (error) {
    console.error('[AI Service] Error:', error)
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error('网络请求失败，可能是 CORS 限制或网络问题。请检查网络连接。')
    }
    if (error instanceof Error) {
      throw error
    }
    throw new Error('生成比喻时发生未知错误')
  }
}

/**
 * 生成知识点解释
 */
export async function explainConcept(
  title: string,
  description: string,
  question?: string
): Promise<string> {
  if (!isConfigured()) {
    throw new Error('请先配置 API Key')
  }

  const prompt = question
    ? `关于"${title}"的问题：${question}\n\n背景：${description}`
    : `请用通俗易懂的语言解释"${title}"：\n${description}`

  const messages = [
    {
      role: 'system',
      content: '你是一位耐心的高等数学老师，善于用简洁明了的语言解释数学概念。回答要简洁、准确、易懂。'
    },
    {
      role: 'user',
      content: prompt
    }
  ]

  try {
    const response = await fetch(config.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify(buildRequestBody(messages, { temperature: 0.7, max_tokens: 800 }))
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || errorData.error?.message || `API请求失败: ${response.status}`)
    }

    const data = await response.json()
    return parseResponseContent(data) || '抱歉，无法生成解释'

  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('生成解释时发生未知错误')
  }
}

// 模拟模式（用于测试）
let mockMode = false

export function enableMockMode(enable: boolean = true) {
  mockMode = enable
}

/**
 * 生成模拟比喻（用于测试）
 */
export async function generateMockMetaphor(request: MetaphorRequest): Promise<MetaphorResponse> {
  // 模拟API延迟
  await new Promise(resolve => setTimeout(resolve, 1000))

  const mockMetaphors: Record<string, MetaphorResponse> = {
    '函数极限': {
      title: '极限就像抢红包',
      content: '函数极限就像微信群里抢红包：你点进去的速度（x趋近于x₀）决定了你能抢到多少钱（f(x)的值）。极限值就是当你的手速无限快时理论上能抢到的金额。即使你永远达不到光速，但你知道那个理论最大值是确定的。而且无论你从群聊的上方还是下方进入（左极限和右极限），只要手速一样快，抢到的钱是一样的！',
      tags: ['生活类比', '趣味性']
    },
    '导数的概念': {
      title: '导数是王者荣耀的伤害',
      content: '导数就像打王者荣耀看DPS（每秒伤害）：你的总伤害是随时间累积的函数，而DPS就是导数。瞬间爆发伤害高意味着那一刻导数大；平A输出稳定说明导数比较恒定。团战时看DPS就像看切线斜率，能判断谁在该时刻输出最猛。技能打出时DPS飙升（导数增大），技能CD时DPS下降（导数减小）。',
      tags: ['游戏类比', '趣味性']
    },
    default: {
      title: '数学概念新解',
      content: `关于"${request.knowledgePointTitle}"，可以这样理解：${request.knowledgePointDescription}。这个概念的关键在于理解其本质，就像生活中的许多现象一样，看似复杂，实则有迹可循。`,
      tags: ['AI生成', '入门级']
    }
  }

  return mockMetaphors[request.knowledgePointTitle] || mockMetaphors.default
}

/**
 * 统一的生成比喻接口
 */
export async function createMetaphor(request: MetaphorRequest): Promise<MetaphorResponse> {
  if (mockMode || !isConfigured()) {
    return generateMockMetaphor(request)
  }
  return generateMetaphor(request)
}

/**
 * 测试 API 连接（简单请求）
 */
export async function testConnection(): Promise<string> {
  if (!isConfigured()) {
    throw new Error('请先配置 API Key')
  }

  const messages = [
    {
      role: 'user',
      content: '请回复"连接成功"四个字'
    }
  ]

  try {
    const requestBody = buildRequestBody(messages, { temperature: 0.1, max_tokens: 50 })
    console.log('[AI Service] Test Connection - URL:', config.baseUrl)

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
      console.error('[AI Service] Test Connection Error:', errorText)
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
    const content = parseResponseContent(data)
    console.log('[AI Service] Test Connection Success:', content)

    return content || '连接成功'
  } catch (error) {
    console.error('[AI Service] Test Connection Error:', error)
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error('网络请求失败，请检查网络连接')
    }
    if (error instanceof Error) {
      throw error
    }
    throw new Error('连接测试失败')
  }
}
