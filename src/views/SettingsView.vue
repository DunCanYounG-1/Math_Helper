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
          <span class="setting-desc">{{ aiProvider === 'deepseek' ? 'DeepSeek' : '通义千问' }} API 密钥</span>
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
          如何获取 {{ aiProvider === 'deepseek' ? 'DeepSeek' : '通义千问' }} API Key？
        </template>
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
          <div style="margin-top: 12px">
            <strong>API 文档：</strong><a href="https://api-docs.deepseek.com/" target="_blank">api-docs.deepseek.com</a>
          </div>
        </div>
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
        <p><strong>Math Helper</strong> - 高等数学可视化学习工具</p>
        <p>版本：v0.1.0 (MVP)</p>
        <p>让抽象数学变得直观易懂</p>
        <p class="developer">开发者：DuncanYoung</p>
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
import { Download, Upload, Delete } from '@element-plus/icons-vue'
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

// 切换服务商时重置模型
const onProviderChange = (provider: AIProvider) => {
  const defaultModel = providerConfigs[provider]?.defaultModel || ''
  settingsStore.setAIModel(defaultModel)
}

const onThemeChange = (newTheme: 'light' | 'dark') => {
  theme.value = newTheme
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
  ElMessage.success('设置已保存')
}

const resetSettings = () => {
  settingsStore.resetToDefault()
  ElMessage.info('已恢复默认设置')
}

// 测试AI连接
const testAIConnection = async () => {
  if (!aiApiKey.value) {
    ElMessage.warning('请先输入API Key')
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
    ElMessage.info('正在测试连接...')
    const result = await testConnection()
    ElMessage.success(`连接成功！AI响应：${result.substring(0, 50)}${result.length > 50 ? '...' : ''}`)
  } catch (error) {
    ElMessage.error(`连接失败：${(error as Error).message}`)
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
  ElMessage.success('数据已导出')
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
      ElMessage.success('数据已导入')
    } catch {
      ElMessage.error('导入失败：文件格式错误')
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
    ElMessage.success('学习进度已重置')
  } catch {
    // 用户取消
  }
}

onMounted(() => {
  settingsStore.loadFromStorage()
  progressStore.loadFromStorage()
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
.settings-view {
  max-width: 800px;
  margin: 0 auto;
}

.settings-section {
  margin-bottom: 24px;

  h2 {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 20px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--border-color);
  }
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-color);

  &:last-child {
    border-bottom: none;
  }
}

.setting-label {
  span {
    display: block;

    &:first-child {
      font-weight: 500;
      margin-bottom: 4px;
    }
  }

  .setting-desc {
    font-size: 12px;
    color: var(--text-color-secondary);
  }
}

.range-input {
  display: flex;
  align-items: center;
  gap: 8px;

  .el-input-number {
    width: 100px;
  }
}

.api-key-input {
  display: flex;
  align-items: center;
  gap: 12px;
}

.data-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;

  @media (max-width: 600px) {
    grid-template-columns: repeat(2, 1fr);
  }

  .stat-item {
    text-align: center;
    padding: 12px;
    background-color: var(--bg-color);
    border-radius: 8px;

    .stat-label {
      display: block;
      font-size: 12px;
      color: var(--text-color-secondary);
      margin-bottom: 4px;
    }

    .stat-value {
      font-size: 20px;
      font-weight: 600;
      color: var(--primary-color);
    }
  }
}

.data-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.about-info {
  p {
    margin-bottom: 8px;
    line-height: 1.6;
  }

  .developer {
    margin-top: 16px;
    padding-top: 12px;
    border-top: 1px dashed var(--border-color);
    color: var(--primary-color);
    font-weight: 500;
  }
}

.settings-actions {
  display: flex;
  gap: 12px;
}

.el-alert {
  margin-top: 16px;

  a {
    color: var(--primary-color);
  }
}
</style>
