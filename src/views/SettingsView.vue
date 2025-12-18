<template>
  <div class="settings-view">
    <h1 class="page-title">设置</h1>

    <div class="settings-section card">
      <h2>外观</h2>
      <div class="setting-item">
        <div class="setting-label">
          <span>主题</span>
          <span class="setting-desc">选择应用的显示主题</span>
        </div>
        <el-radio-group v-model="theme" @change="onThemeChange">
          <el-radio-button value="light">浅色</el-radio-button>
          <el-radio-button value="dark">深色</el-radio-button>
        </el-radio-group>
      </div>
    </div>

    <div class="settings-section card">
      <h2>绘图</h2>
      <div class="setting-item">
        <div class="setting-label">
          <span>默认X轴范围</span>
          <span class="setting-desc">函数绘图的默认坐标范围</span>
        </div>
        <div class="range-input">
          <el-input-number v-model="defaultXRange[0]" :step="1" />
          <span>~</span>
          <el-input-number v-model="defaultXRange[1]" :step="1" />
        </div>
      </div>
      <div class="setting-item">
        <div class="setting-label">
          <span>动画速度</span>
          <span class="setting-desc">知识点可视化动画的播放速度</span>
        </div>
        <el-select v-model="animationSpeed">
          <el-option :value="0.5" label="0.5x (慢速)" />
          <el-option :value="1" label="1x (正常)" />
          <el-option :value="2" label="2x (快速)" />
        </el-select>
      </div>
    </div>

    <div class="settings-section card">
      <h2>AI服务</h2>
      <div class="setting-item">
        <div class="setting-label">
          <span>AI 服务商</span>
          <span class="setting-desc">选择 AI API 提供商</span>
        </div>
        <el-select v-model="aiProvider" @change="onProviderChange" style="width: 200px">
          <el-option value="qwen" label="通义千问 (阿里云)" />
          <el-option value="deepseek" label="DeepSeek" />
          <el-option value="openai" label="OpenAI (GPT)" />
          <el-option value="zhipu" label="智谱AI (GLM)" />
          <el-option value="moonshot" label="月之暗面 (Kimi)" />
          <el-option value="siliconflow" label="硅基流动 (开源模型)" />
        </el-select>
      </div>
      <div class="setting-item">
        <div class="setting-label">
          <span>模型</span>
          <span class="setting-desc">选择要使用的 AI 模型</span>
        </div>
        <el-select v-model="aiModel" style="width: 200px">
          <el-option
            v-for="model in currentModels"
            :key="model.value"
            :value="model.value"
            :label="model.label"
          />
        </el-select>
      </div>
      <div class="setting-item">
        <div class="setting-label">
          <span>API Key</span>
          <span class="setting-desc">{{ providerLabels[aiProvider] }} API 密钥</span>
        </div>
        <div class="api-key-input">
          <el-input
            v-model="aiApiKey"
            type="password"
            placeholder="请输入API Key"
            show-password
            style="width: 300px"
          />
          <el-button type="success" plain @click="testAIConnection">
            测试连接
          </el-button>
        </div>
      </div>
      <el-alert
        type="info"
        :closable="false"
        show-icon
      >
        <template #title>
          如何获取 {{ providerLabels[aiProvider] }} API Key？
        </template>
        <!-- DeepSeek -->
        <div v-if="aiProvider === 'deepseek'">
          <div>
            1. 访问 <a href="https://platform.deepseek.com/" target="_blank">DeepSeek 开放平台</a><br>
            2. 注册并登录账号<br>
            3. 在「API Keys」页面创建 API Key
          </div>
          <div style="margin-top: 12px">
            <strong>可用模型：</strong>
            <ul style="margin: 8px 0 0 20px">
              <li><strong>deepseek-chat</strong>：DeepSeek-V3 通用对话模型</li>
              <li><strong>deepseek-reasoner</strong>：DeepSeek-R1 深度推理模型，适合数学推理</li>
            </ul>
          </div>
        </div>
        <!-- OpenAI -->
        <div v-else-if="aiProvider === 'openai'">
          <div>
            1. 访问 <a href="https://platform.openai.com/" target="_blank">OpenAI Platform</a><br>
            2. 注册并登录账号（需要海外手机号）<br>
            3. 在「API Keys」页面创建 API Key
          </div>
          <div style="margin-top: 12px">
            <strong>可用模型：</strong>
            <ul style="margin: 8px 0 0 20px">
              <li><strong>gpt-4o-mini</strong>：快速经济，适合日常对话</li>
              <li><strong>gpt-4o</strong>：推荐使用，能力均衡</li>
              <li><strong>gpt-4-turbo</strong>：强力模型</li>
            </ul>
          </div>
          <div style="margin-top: 12px; color: var(--ios-orange)">
            <strong>提示：</strong>OpenAI 服务需要科学上网环境
          </div>
        </div>
        <!-- 智谱AI -->
        <div v-else-if="aiProvider === 'zhipu'">
          <div>
            1. 访问 <a href="https://open.bigmodel.cn/" target="_blank">智谱AI开放平台</a><br>
            2. 注册并登录账号<br>
            3. 在「API Keys」页面创建 API Key
          </div>
          <div style="margin-top: 12px">
            <strong>可用模型：</strong>
            <ul style="margin: 8px 0 0 20px">
              <li><strong>glm-4-flash</strong>：快速免费，适合日常使用</li>
              <li><strong>glm-4-air</strong>：性价比高，能力均衡</li>
              <li><strong>glm-4</strong>：强力模型</li>
              <li><strong>glm-4-plus</strong>：旗舰模型</li>
            </ul>
          </div>
          <div style="margin-top: 12px; color: var(--ios-green)">
            <strong>推荐：</strong>GLM-4-Flash 免费额度充足，国内访问稳定
          </div>
        </div>
        <!-- Moonshot -->
        <div v-else-if="aiProvider === 'moonshot'">
          <div>
            1. 访问 <a href="https://platform.moonshot.cn/" target="_blank">Moonshot AI 开放平台</a><br>
            2. 注册并登录账号<br>
            3. 在「API Key 管理」页面创建 API Key
          </div>
          <div style="margin-top: 12px">
            <strong>可用模型：</strong>
            <ul style="margin: 8px 0 0 20px">
              <li><strong>moonshot-v1-8k</strong>：标准上下文，快速响应</li>
              <li><strong>moonshot-v1-32k</strong>：长上下文，适合复杂问题</li>
              <li><strong>moonshot-v1-128k</strong>：超长上下文，适合长文档分析</li>
            </ul>
          </div>
          <div style="margin-top: 12px; color: var(--ios-green)">
            <strong>推荐：</strong>Kimi 以长上下文能力著称，适合数学推理
          </div>
        </div>
        <!-- 硅基流动 -->
        <div v-else-if="aiProvider === 'siliconflow'">
          <div>
            1. 访问 <a href="https://cloud.siliconflow.cn/" target="_blank">硅基流动云平台</a><br>
            2. 注册并登录账号<br>
            3. 在「API 密钥」页面创建 API Key
          </div>
          <div style="margin-top: 12px">
            <strong>可用模型：</strong>
            <ul style="margin: 8px 0 0 20px">
              <li><strong>Qwen2.5-7B</strong>：快速免费，适合日常使用</li>
              <li><strong>Qwen2.5-72B</strong>：强力模型</li>
              <li><strong>DeepSeek-V3/R1</strong>：深度推理</li>
              <li><strong>GLM-4-9B</strong>：智谱开源模型</li>
              <li><strong>Llama-3.3-70B</strong>：Meta 开源模型</li>
            </ul>
          </div>
          <div style="margin-top: 12px; color: var(--ios-green)">
            <strong>推荐：</strong>硅基流动提供多种开源模型，新用户有免费额度
          </div>
        </div>
        <!-- 通义千问 (默认) -->
        <div v-else>
          <p>
            1. 访问 <a href="https://dashscope.aliyun.com/" target="_blank">阿里云百炼平台</a><br>
            2. 注册并登录账号<br>
            3. 在「API-KEY管理」页面创建 API Key<br>
            <br>
            <strong>提示：</strong>如果不配置 API Key，将使用内置的模拟数据演示功能
          </p>
        </div>
      </el-alert>
    </div>

    <div class="settings-section card">
      <h2>学习数据</h2>
      <div class="data-stats">
        <div class="stat-item">
          <span class="stat-label">已掌握知识点</span>
          <span class="stat-value">{{ progressStore.learnedCount }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">学习中</span>
          <span class="stat-value">{{ progressStore.inProgressCount }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">总学习时间</span>
          <span class="stat-value">{{ progressStore.totalTimeSpent }} 分钟</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">收藏数</span>
          <span class="stat-value">{{ progressStore.favoritesCount }}</span>
        </div>
      </div>
      <div class="data-actions">
        <el-button @click="exportProgress">
          <el-icon><Download /></el-icon>
          导出数据
        </el-button>
        <el-button @click="importProgress">
          <el-icon><Upload /></el-icon>
          导入数据
        </el-button>
        <el-button type="danger" plain @click="resetProgress">
          <el-icon><Delete /></el-icon>
          重置进度
        </el-button>
      </div>
      <input
        ref="fileInput"
        type="file"
        accept=".json"
        style="display: none"
        @change="handleFileImport"
      />
    </div>

    <div class="settings-section card">
      <h2>关于</h2>
      <div class="about-info">
        <div class="app-info">
          <p><strong>Math Helper</strong> - 高等数学可视化学习工具</p>
          <p>版本：v0.1.0 (MVP)</p>
          <p class="slogan">让抽象数学变得直观易懂</p>
        </div>
        <div class="developer-section">
          <div class="developer-badge">
            <el-icon class="dev-icon"><UserFilled /></el-icon>
            <div class="developer-info">
              <span class="developer-label">开发者</span>
              <span class="developer-name">DuncanYoung</span>
            </div>
          </div>
          <div class="project-links">
            <a
              href="https://github.com/DunCanYounG-1/Math_Helper"
              target="_blank"
              class="github-link"
            >
              <el-icon><Link /></el-icon>
              <span>开源项目地址</span>
              <el-icon class="external-icon"><Right /></el-icon>
            </a>
          </div>
          <p class="copyright">© 2024 DuncanYoung. All rights reserved.</p>
        </div>
      </div>
    </div>

    <div class="settings-actions">
      <el-button type="primary" @click="saveSettings">保存设置</el-button>
      <el-button @click="resetSettings">恢复默认</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Download, Upload, Delete, UserFilled, Link, Right } from '@element-plus/icons-vue'
import { useSettingsStore } from '@/stores/settingsStore'
import { useProgressStore } from '@/stores/progressStore'
import { setAIConfig, testConnection, providerConfigs, type AIProvider } from '@/services/aiService'

const settingsStore = useSettingsStore()
const progressStore = useProgressStore()
const fileInput = ref<HTMLInputElement | null>(null)

// 使用computed来双向绑定store状态
const theme = computed({
  get: () => settingsStore.theme,
  set: (value: 'light' | 'dark') => settingsStore.setTheme(value)
})

const animationSpeed = computed({
  get: () => settingsStore.animationSpeed,
  set: (value: number) => settingsStore.setAnimationSpeed(value)
})

const defaultXRange = computed({
  get: () => settingsStore.defaultXRange,
  set: (value: [number, number]) => settingsStore.setDefaultXRange(value)
})

// AI 配置
const aiProvider = computed({
  get: () => settingsStore.aiProvider,
  set: (value: AIProvider) => settingsStore.setAIProvider(value)
})

const aiApiKey = computed({
  get: () => settingsStore.aiApiKey,
  set: (value: string) => settingsStore.setAIApiKey(value)
})

const aiModel = computed({
  get: () => settingsStore.aiModel,
  set: (value: string) => settingsStore.setAIModel(value)
})

// 当前服务商的可用模型
const currentModels = computed(() => {
  return providerConfigs[aiProvider.value]?.models || []
})

// 服务商显示名称
const providerLabels: Record<AIProvider, string> = {
  qwen: '通义千问',
  deepseek: 'DeepSeek',
  openai: 'OpenAI',
  zhipu: '智谱AI',
  moonshot: 'Moonshot',
  siliconflow: '硅基流动'
}

// 切换服务商时重置模型
const onProviderChange = (provider: AIProvider) => {
  const defaultModel = providerConfigs[provider]?.defaultModel || ''
  settingsStore.setAIModel(defaultModel)
}

const onThemeChange = (newTheme: string | number | boolean | undefined) => {
  if (newTheme === 'light' || newTheme === 'dark') {
    theme.value = newTheme
  }
}

const saveSettings = () => {
  // 更新AI配置
  const providerConfig = providerConfigs[aiProvider.value]
  setAIConfig({
    provider: aiProvider.value,
    apiKey: aiApiKey.value,
    model: aiModel.value,
    baseUrl: providerConfig?.baseUrl || ''
  })
  settingsStore.saveToStorage()
  ElMessage.success({ message: '设置已保存', duration: 1500 })
}

const resetSettings = () => {
  settingsStore.resetToDefault()
  ElMessage.info({ message: '已恢复默认设置', duration: 1500 })
}

// 测试AI连接
const testAIConnection = async () => {
  if (!aiApiKey.value) {
    ElMessage.warning({ message: '请先输入API Key', duration: 1500 })
    return
  }

  const providerConfig = providerConfigs[aiProvider.value]
  setAIConfig({
    provider: aiProvider.value,
    apiKey: aiApiKey.value,
    model: aiModel.value,
    baseUrl: providerConfig?.baseUrl || ''
  })

  try {
    ElMessage.info({ message: '正在测试连接...', duration: 1500 })
    await testConnection()
    ElMessage.success({ message: '连接成功！', duration: 1500 })
  } catch (error) {
    ElMessage.error({ message: `连接失败：${(error as Error).message}`, duration: 2000 })
  }
}

// 导出进度数据
const exportProgress = () => {
  const data = progressStore.exportData()
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `math-helper-progress-${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success({ message: '数据已导出', duration: 1500 })
}

// 触发导入
const importProgress = () => {
  fileInput.value?.click()
}

// 处理文件导入
const handleFileImport = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target?.result as string)
      progressStore.importData(data)
      ElMessage.success({ message: '数据已导入', duration: 1500 })
    } catch {
      ElMessage.error({ message: '导入失败：文件格式错误', duration: 2000 })
    }
  }
  reader.readAsText(file)
  input.value = ''
}

// 重置进度
const resetProgress = async () => {
  try {
    await ElMessageBox.confirm(
      '此操作将清除所有学习进度、收藏和笔记，是否继续？',
      '确认重置',
      {
        confirmButtonText: '确定重置',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    progressStore.resetAllProgress()
    ElMessage.success({ message: '学习进度已重置', duration: 1500 })
  } catch {
    // 用户取消
  }
}

onMounted(() => {
  // 数据已在 App.vue 中全局加载，无需重复加载
  // 初始化AI配置
  if (settingsStore.aiApiKey) {
    const providerConfig = providerConfigs[settingsStore.aiProvider]
    setAIConfig({
      provider: settingsStore.aiProvider,
      apiKey: settingsStore.aiApiKey,
      model: settingsStore.aiModel,
      baseUrl: providerConfig?.baseUrl || ''
    })
  }
})
</script>

<style lang="scss" scoped>
// ============================================
// iOS 风格设置页面
// ============================================
.settings-view {
  max-width: 800px;
  margin: 0 auto;
  padding: var(--spacing-md);
  background-color: var(--bg-color);

  .page-title {
    font-size: 34px;
    font-weight: 700;
    color: var(--text-color);
    margin-bottom: var(--spacing-lg);
    letter-spacing: 0.01em;
  }
}

// iOS 风格设置分组
.settings-section {
  margin-bottom: var(--spacing-lg);
  background-color: var(--card-bg);
  border-radius: var(--border-radius-lg);
  overflow: hidden;

  h2 {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-color-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.02em;
    padding: var(--spacing-md) var(--spacing-lg);
    padding-bottom: var(--spacing-sm);
    background-color: transparent;
  }
}

// iOS 风格设置项
.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px var(--spacing-lg);
  position: relative;
  background-color: var(--card-bg);

  // iOS 风格分隔线
  &:not(:last-child)::after {
    content: '';
    position: absolute;
    left: var(--spacing-lg);
    right: 0;
    bottom: 0;
    height: 0.5px;
    background-color: var(--separator-color);
  }
}

.setting-label {
  span {
    display: block;

    &:first-child {
      font-weight: 400;
      font-size: 17px;
      color: var(--text-color);
      margin-bottom: 2px;
    }
  }

  .setting-desc {
    font-size: 13px;
    color: var(--text-color-tertiary);
  }
}

.range-input {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);

  .el-input-number {
    width: 90px;

    :deep(.el-input__wrapper) {
      border-radius: var(--border-radius);
      box-shadow: none;
      background-color: var(--bg-color);
      border: 0.5px solid var(--separator-color);
    }
  }
}

.api-key-input {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);

  :deep(.el-input__wrapper) {
    border-radius: var(--border-radius);
  }
}

// iOS 风格数据统计
.data-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
  padding: 0 var(--spacing-lg);

  @media (max-width: 600px) {
    grid-template-columns: repeat(2, 1fr);
  }

  .stat-item {
    text-align: center;
    padding: var(--spacing-md);
    background-color: var(--bg-color);
    border-radius: var(--border-radius);

    .stat-label {
      display: block;
      font-size: 12px;
      color: var(--text-color-tertiary);
      margin-bottom: var(--spacing-xs);
    }

    .stat-value {
      font-size: 22px;
      font-weight: 700;
      color: var(--primary-color);
      font-feature-settings: 'tnum';
    }
  }
}

// iOS 风格数据操作按钮
.data-actions {
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
  padding: var(--spacing-md) var(--spacing-lg);

  :deep(.el-button) {
    border-radius: var(--border-radius);
    font-weight: 500;
  }
}

// iOS 风格关于信息
.about-info {
  padding: 0 var(--spacing-lg) var(--spacing-lg);

  .app-info {
    p {
      margin-bottom: var(--spacing-sm);
      line-height: 1.6;
      font-size: 15px;
      color: var(--text-color);
    }

    .slogan {
      color: var(--text-color-tertiary);
      font-style: italic;
      margin-top: var(--spacing-md);
    }
  }

  .developer-section {
    margin-top: var(--spacing-lg);
    padding-top: var(--spacing-lg);
    border-top: 0.5px solid var(--separator-color);

    .developer-badge {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      padding: var(--spacing-md);
      background: linear-gradient(135deg, rgba(0, 122, 255, 0.1) 0%, rgba(90, 200, 250, 0.1) 100%);
      border-radius: var(--border-radius);
      margin-bottom: var(--spacing-md);

      .dev-icon {
        font-size: 28px;
        color: var(--primary-color);
        padding: 10px;
        background-color: rgba(0, 122, 255, 0.15);
        border-radius: 50%;
      }

      .developer-info {
        display: flex;
        flex-direction: column;
        gap: 2px;

        .developer-label {
          font-size: 12px;
          color: var(--text-color-tertiary);
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }

        .developer-name {
          font-size: 17px;
          font-weight: 600;
          color: var(--primary-color);
        }
      }
    }

    .project-links {
      margin-bottom: var(--spacing-md);

      .github-link {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        padding: 11px var(--spacing-md);
        background-color: var(--bg-color);
        border-radius: var(--border-radius);
        color: var(--text-color);
        text-decoration: none;
        transition: all 0.25s var(--transition-timing);
        font-size: 15px;

        &:active {
          background-color: var(--active-bg);
          transform: scale(0.98);
        }

        .el-icon {
          color: var(--primary-color);

          &.external-icon {
            margin-left: auto;
            color: var(--text-color-tertiary);
          }
        }

        span {
          flex: 1;
        }
      }
    }

    .copyright {
      text-align: center;
      font-size: 12px;
      color: var(--text-color-placeholder);
      margin: 0;
      padding-top: var(--spacing-sm);
    }
  }
}

// iOS 风格保存按钮区
.settings-actions {
  display: flex;
  gap: var(--spacing-sm);
  padding: var(--spacing-lg) 0;

  :deep(.el-button) {
    border-radius: var(--border-radius);
    font-weight: 500;
    height: 44px;
    padding: 0 var(--spacing-lg);
  }
}

// iOS 风格提示框
.el-alert {
  margin: var(--spacing-md) var(--spacing-lg);
  border-radius: var(--border-radius);

  a {
    color: var(--primary-color);
  }
}

// iOS 风格单选按钮组
:deep(.el-radio-group) {
  .el-radio-button__inner {
    border-radius: 7px;
    font-size: 14px;
    font-weight: 500;
    padding: 8px 16px;
  }
}

// iOS 风格下拉选择
:deep(.el-select) {
  .el-select__wrapper {
    border-radius: var(--border-radius);
    box-shadow: none;
    border: 0.5px solid var(--separator-color);
  }
}
</style>
