/**
 * AI服务 - 多服务商集成
 * 支持通义千问、DeepSeek等AI服务
 */

// 调试模式 - 生产环境设为 false
const DEBUG = import.meta.env.DEV

// AI 服务商类型
export type AIProvider = 'qwen' | 'deepseek' | 'openai' | 'zhipu' | 'moonshot' | 'siliconflow'

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

// 服务商配置 - 2025年12月更新
export const providerConfigs: Record<AIProvider, { baseUrl: string; defaultModel: string; models: { value: string; label: string }[] }> = {
  qwen: {
    // 开发环境使用代理，生产环境直连
    baseUrl: isDev
      ? '/api/qwen/api/v1/services/aigc/text-generation/generation'
      : 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
    defaultModel: 'qwen-turbo',
    models: [
      { value: 'qwen-turbo', label: 'Qwen Turbo (快速经济)' },
      { value: 'qwen-plus', label: 'Qwen Plus (均衡)' },
      { value: 'qwen-max', label: 'Qwen Max (强力)' },
      { value: 'qwen-long', label: 'Qwen Long (百万上下文)' },
      { value: 'qwen3-235b-a22b', label: 'Qwen3-235B (旗舰MoE)' }
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
  },
  openai: {
    // OpenAI API
    baseUrl: isDev
      ? '/api/openai/v1/chat/completions'
      : 'https://api.openai.com/v1/chat/completions',
    defaultModel: 'gpt-4o-mini',
    models: [
      { value: 'gpt-4o-mini', label: 'GPT-4o Mini (快速经济)' },
      { value: 'gpt-4o', label: 'GPT-4o (推荐)' },
      { value: 'gpt-4.1-mini', label: 'GPT-4.1 Mini (新一代快速)' },
      { value: 'gpt-4.1', label: 'GPT-4.1 (新一代旗舰)' },
      { value: 'o3-mini', label: 'O3 Mini (推理快速)' },
      { value: 'o3', label: 'O3 (推理旗舰)' }
    ]
  },
  zhipu: {
    // 智谱AI API - 兼容 OpenAI 格式
    baseUrl: isDev
      ? '/api/zhipu/api/paas/v4/chat/completions'
      : 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    defaultModel: 'glm-4-flash',
    models: [
      { value: 'glm-4-flash', label: 'GLM-4-Flash (快速免费)' },
      { value: 'glm-4-air', label: 'GLM-4-Air (均衡)' },
      { value: 'glm-4-long', label: 'GLM-4-Long (长上下文)' },
      { value: 'glm-4', label: 'GLM-4 (强力)' },
      { value: 'glm-4-plus', label: 'GLM-4-Plus (旗舰)' },
      { value: 'glm-z1-air', label: 'GLM-Z1-Air (推理)' }
    ]
  },
  moonshot: {
    // 月之暗面 Kimi API - 兼容 OpenAI 格式
    baseUrl: isDev
      ? '/api/moonshot/v1/chat/completions'
      : 'https://api.moonshot.cn/v1/chat/completions',
    defaultModel: 'moonshot-v1-8k',
    models: [
      { value: 'moonshot-v1-8k', label: 'Moonshot v1 8K (快速)' },
      { value: 'moonshot-v1-32k', label: 'Moonshot v1 32K (长上下文)' },
      { value: 'moonshot-v1-128k', label: 'Moonshot v1 128K (超长上下文)' },
      { value: 'kimi-latest', label: 'Kimi Latest (最新版)' }
    ]
  },
  siliconflow: {
    // 硅基流动 API - 兼容 OpenAI 格式，提供多种开源模型
    baseUrl: isDev
      ? '/api/siliconflow/v1/chat/completions'
      : 'https://api.siliconflow.cn/v1/chat/completions',
    defaultModel: 'Qwen/Qwen2.5-7B-Instruct',
    models: [
      { value: 'Qwen/Qwen2.5-7B-Instruct', label: 'Qwen2.5-7B (快速免费)' },
      { value: 'Qwen/Qwen2.5-32B-Instruct', label: 'Qwen2.5-32B (均衡)' },
      { value: 'Qwen/Qwen2.5-72B-Instruct', label: 'Qwen2.5-72B (强力)' },
      { value: 'deepseek-ai/DeepSeek-V3', label: 'DeepSeek-V3' },
      { value: 'deepseek-ai/DeepSeek-R1', label: 'DeepSeek-R1 (推理)' },
      { value: 'Pro/deepseek-ai/DeepSeek-V3', label: 'DeepSeek-V3 Pro (付费增强)' },
      { value: 'THUDM/glm-4-9b-chat', label: 'GLM-4-9B' },
      { value: 'meta-llama/Llama-3.3-70B-Instruct', label: 'Llama-3.3-70B' }
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

  // 通义千问使用特殊格式，其他服务商使用 OpenAI 兼容格式
  if (config.provider === 'qwen') {
    return {
      model: config.model,
      input: { messages },
      parameters: {
        temperature,
        max_tokens,
        result_format: 'message'
      }
    }
  } else {
    // OpenAI 兼容格式（DeepSeek、OpenAI、智谱、Moonshot、硅基流动）
    return {
      model: config.model,
      messages,
      temperature,
      max_tokens,
      stream: false
    }
  }
}

/**
 * 解析 API 响应内容（根据服务商不同）
 */
function parseResponseContent(data: any): string {
  // 通义千问使用特殊响应格式
  if (config.provider === 'qwen') {
    return data.output?.choices?.[0]?.message?.content || data.output?.text || ''
  } else {
    // OpenAI 兼容格式（DeepSeek、OpenAI、智谱、Moonshot、硅基流动）
    return data.choices?.[0]?.message?.content || ''
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
    if (DEBUG) {
      console.log('[AI Service] Request URL:', config.baseUrl)
      console.log('[AI Service] Request Body:', JSON.stringify(requestBody, null, 2))
    }

    const response = await fetch(config.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify(requestBody)
    })

    if (DEBUG) console.log('[AI Service] Response Status:', response.status)

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
    if (DEBUG) console.log('[AI Service] Response Data:', JSON.stringify(data, null, 2))
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
    if (DEBUG) console.log('[AI Service] Test Connection - URL:', config.baseUrl)

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
    if (DEBUG) console.log('[AI Service] Test Connection Success:', content)

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

// ============ 解题引导功能 ============

export interface ProblemHintRequest {
  problem: string                    // 题目内容
  problemType?: string               // 题目类型（极限、导数、积分等）
  knowledgePoints?: string[]         // 相关知识点
  studentAttempt?: string            // 学生的尝试（可选）
  hintLevel: 'hint' | 'guide' | 'solution'  // 提示级别
}

export interface ProblemHintResponse {
  hintLevel: 'hint' | 'guide' | 'solution'
  content: string
  keyIdea?: string                   // 核心思路
  steps?: string[]                   // 解题步骤
  relatedConcepts?: string[]         // 相关概念
  commonMistakes?: string[]          // 常见错误提醒
  encouragement?: string             // 鼓励语
}

/**
 * 构建解题引导的提示词
 */
function buildProblemHintPrompt(request: ProblemHintRequest): string {
  const levelDescriptions = {
    hint: '只给出解题方向的提示，不要透露具体步骤或答案',
    guide: '给出分步解题引导，每一步给出思路提示但不直接计算',
    solution: '给出完整的解题过程，包含详细步骤和计算'
  }

  const knowledgeContext = request.knowledgePoints && request.knowledgePoints.length > 0
    ? `\n相关知识点：${request.knowledgePoints.join('、')}`
    : ''

  const studentAttemptContext = request.studentAttempt
    ? `\n\n学生的尝试：\n${request.studentAttempt}\n\n请针对学生的尝试给出反馈，指出问题所在并引导正确方向。`
    : ''

  return `你是一位有爱心的高等数学老师，擅长引导学生自主思考而不是直接给出答案。

【题目】
${request.problem}
${knowledgeContext}
${studentAttemptContext}

【任务要求】
${levelDescriptions[request.hintLevel]}

请按照以下JSON格式输出：
{
  "hintLevel": "${request.hintLevel}",
  "content": "主要内容（根据提示级别调整详细程度）",
  "keyIdea": "核心解题思路（一句话概括）",
  "steps": ["步骤1的提示", "步骤2的提示", ...],
  "relatedConcepts": ["相关概念1", "相关概念2"],
  "commonMistakes": ["常见错误1", "常见错误2"],
  "encouragement": "给学生的鼓励语"
}

注意：
1. ${request.hintLevel === 'hint' ? '只给方向性提示，激发学生思考' : ''}
2. ${request.hintLevel === 'guide' ? '每个步骤只给思路，不写出具体计算' : ''}
3. ${request.hintLevel === 'solution' ? '详细展示计算过程，使用LaTeX格式写数学公式' : ''}
4. 语气要温和、鼓励性强
5. 数学公式请用 $...$ 或 $$...$$ 包裹`
}

/**
 * AI 解题引导
 */
export async function getProblemHint(request: ProblemHintRequest): Promise<ProblemHintResponse> {
  if (!isConfigured()) {
    throw new Error('请先配置 API Key')
  }

  const prompt = buildProblemHintPrompt(request)
  const messages = [
    {
      role: 'system',
      content: '你是一位富有经验的高等数学老师，善于通过引导式提问帮助学生理解和解决数学问题。你的目标是培养学生的数学思维能力，而不是简单地给出答案。请始终以JSON格式输出。'
    },
    {
      role: 'user',
      content: prompt
    }
  ]

  try {
    const maxTokens = request.hintLevel === 'solution' ? 1500 : 800
    const requestBody = buildRequestBody(messages, { temperature: 0.7, max_tokens: maxTokens })

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
    const content = parseResponseContent(data)

    // 尝试解析JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      // 如果无法解析JSON，返回原始内容作为content
      return {
        hintLevel: request.hintLevel,
        content: content,
        encouragement: '加油，你可以的！'
      }
    }

    const result = JSON.parse(jsonMatch[0]) as ProblemHintResponse

    // 确保必要字段
    if (!result.content) {
      result.content = content
    }
    result.hintLevel = request.hintLevel

    return result

  } catch (error) {
    console.error('[AI Service] getProblemHint Error:', error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error('获取解题提示时发生未知错误')
  }
}

/**
 * 模拟解题引导（用于测试或未配置API时）
 */
export async function getMockProblemHint(request: ProblemHintRequest): Promise<ProblemHintResponse> {
  await new Promise(resolve => setTimeout(resolve, 800))

  const mockResponses: Record<string, Partial<ProblemHintResponse>> = {
    hint: {
      content: '这道题考查的是基本的计算技巧。想一想：题目中有什么特殊的结构？能否应用我们学过的公式或定理？',
      keyIdea: '识别题目结构，联想相关公式',
      steps: [
        '仔细审题，找出关键信息',
        '思考这类问题的一般解法',
        '尝试应用相关定理或公式'
      ],
      relatedConcepts: ['基本定理', '常用公式'],
      commonMistakes: ['忽略条件的使用', '计算错误'],
      encouragement: '相信自己，你已经掌握了解这道题的知识！'
    },
    guide: {
      content: '让我们一步步来分析这道题：\n\n**第一步**：观察题目结构，确定使用的方法\n**第二步**：应用相关公式或定理进行变换\n**第三步**：简化并计算结果',
      keyIdea: '分步转化，逐步求解',
      steps: [
        '第一步：识别问题类型，选择合适方法',
        '第二步：进行必要的数学变换',
        '第三步：应用公式求值',
        '第四步：检验结果的合理性'
      ],
      relatedConcepts: ['数学变换', '公式应用'],
      commonMistakes: [
        '变换过程中符号出错',
        '忘记检验结果'
      ],
      encouragement: '按照这个思路走，你一定能解出来！'
    },
    solution: {
      content: '**详细解答**\n\n**分析**：这道题需要我们...\n\n**解答**：\n$$ \\text{步骤1：...} $$\n$$ \\text{步骤2：...} $$\n$$ \\text{步骤3：...} $$\n\n**答案**：...',
      keyIdea: '运用基本方法求解',
      steps: [
        '步骤1：确定解题方向',
        '步骤2：进行数学运算',
        '步骤3：得出最终答案'
      ],
      relatedConcepts: ['核心概念1', '核心概念2'],
      commonMistakes: [
        '这类题常见的错误是...',
        '注意不要忽略...'
      ],
      encouragement: '理解了这道题的解法，类似的题目你也能轻松应对！'
    }
  }

  return {
    hintLevel: request.hintLevel,
    ...mockResponses[request.hintLevel]
  } as ProblemHintResponse
}

/**
 * 统一的解题引导接口
 */
export async function getHint(request: ProblemHintRequest): Promise<ProblemHintResponse> {
  if (mockMode || !isConfigured()) {
    return getMockProblemHint(request)
  }
  return getProblemHint(request)
}

// ============ 错题分析功能 ============

export interface WrongAnswerAnalysisRequest {
  problem: string                    // 题目
  correctAnswer: string              // 正确答案
  studentAnswer: string              // 学生答案
  knowledgePoints?: string[]         // 相关知识点
}

export interface WrongAnswerAnalysisResponse {
  errorType: string                  // 错误类型
  errorAnalysis: string              // 错误分析
  correctApproach: string            // 正确思路
  suggestions: string[]              // 改进建议
  relatedMistakes?: string[]         // 关联的常见错误
  practiceRecommendation?: string    // 练习建议
}

/**
 * AI 错题分析
 */
export async function analyzeWrongAnswer(request: WrongAnswerAnalysisRequest): Promise<WrongAnswerAnalysisResponse> {
  if (!isConfigured()) {
    throw new Error('请先配置 API Key')
  }

  const knowledgeContext = request.knowledgePoints && request.knowledgePoints.length > 0
    ? `\n相关知识点：${request.knowledgePoints.join('、')}`
    : ''

  const prompt = `你是一位善于诊断学生学习问题的数学老师。请分析以下错题：

【题目】
${request.problem}
${knowledgeContext}

【正确答案】
${request.correctAnswer}

【学生答案】
${request.studentAnswer}

请分析学生的错误并给出改进建议，以JSON格式输出：
{
  "errorType": "错误类型（如：概念理解错误、计算错误、方法选择错误等）",
  "errorAnalysis": "详细分析学生错在哪里，为什么会错",
  "correctApproach": "正确的解题思路",
  "suggestions": ["改进建议1", "改进建议2", ...],
  "relatedMistakes": ["关联的常见错误类型"],
  "practiceRecommendation": "针对性的练习建议"
}

分析要求：
1. 语气温和友善，不要打击学生自信心
2. 找出错误的根本原因，不只是表面错误
3. 给出具体可操作的改进建议`

  const messages = [
    {
      role: 'system',
      content: '你是一位富有同理心的数学老师，擅长分析学生的错误并给出建设性的反馈。请始终以JSON格式输出。'
    },
    {
      role: 'user',
      content: prompt
    }
  ]

  try {
    const requestBody = buildRequestBody(messages, { temperature: 0.6, max_tokens: 1000 })

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
    const content = parseResponseContent(data)

    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return {
        errorType: '未知错误',
        errorAnalysis: content,
        correctApproach: '请参考正确答案',
        suggestions: ['多加练习']
      }
    }

    return JSON.parse(jsonMatch[0]) as WrongAnswerAnalysisResponse

  } catch (error) {
    console.error('[AI Service] analyzeWrongAnswer Error:', error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error('分析错题时发生未知错误')
  }
}

// ============ 笔记优化功能 ============

export interface NoteOptimizationRequest {
  originalNote: string               // 原始笔记
  knowledgePointTitle: string        // 知识点标题
  optimizationType: 'structure' | 'expand' | 'simplify' | 'format'
}

export interface NoteOptimizationResponse {
  optimizedNote: string              // 优化后的笔记
  changes: string[]                  // 改进说明
  suggestions?: string[]             // 后续建议
}

/**
 * AI 笔记优化
 */
export async function optimizeNote(request: NoteOptimizationRequest): Promise<NoteOptimizationResponse> {
  if (!isConfigured()) {
    throw new Error('请先配置 API Key')
  }

  const typeDescriptions = {
    structure: '优化笔记结构，使其更有条理',
    expand: '扩展笔记内容，补充重要细节',
    simplify: '精简笔记，提取核心要点',
    format: '优化格式，使用Markdown使笔记更美观'
  }

  const prompt = `你是一位帮助学生整理学习笔记的助手。

【知识点】${request.knowledgePointTitle}

【原始笔记】
${request.originalNote}

【优化要求】${typeDescriptions[request.optimizationType]}

请以JSON格式输出：
{
  "optimizedNote": "优化后的笔记（使用Markdown格式）",
  "changes": ["改进1的说明", "改进2的说明", ...],
  "suggestions": ["后续学习建议"]
}

注意：
1. 保持笔记的个人风格
2. 数学公式使用 $...$ 包裹
3. 结构清晰，重点突出`

  const messages = [
    {
      role: 'system',
      content: '你是一位学习方法专家，善于帮助学生整理和优化笔记。请始终以JSON格式输出。'
    },
    {
      role: 'user',
      content: prompt
    }
  ]

  try {
    const requestBody = buildRequestBody(messages, { temperature: 0.7, max_tokens: 1200 })

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
    const content = parseResponseContent(data)

    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return {
        optimizedNote: request.originalNote,
        changes: ['无法优化'],
        suggestions: []
      }
    }

    return JSON.parse(jsonMatch[0]) as NoteOptimizationResponse

  } catch (error) {
    console.error('[AI Service] optimizeNote Error:', error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error('优化笔记时发生未知错误')
  }
}
