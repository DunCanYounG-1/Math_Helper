<template>
  <div class="math-keyboard" :class="{ collapsed: isCollapsed }">
    <div class="keyboard-header" @click="toggleCollapse">
      <span class="header-title">
        <el-icon><Grid /></el-icon>
        数学键盘
      </span>
      <el-icon class="collapse-icon">
        <ArrowUp v-if="!isCollapsed" />
        <ArrowDown v-else />
      </el-icon>
    </div>

    <div v-show="!isCollapsed" class="keyboard-content">
      <!-- 功能切换 -->
      <div class="keyboard-tabs">
        <span
          v-for="tab in tabs"
          :key="tab.key"
          class="tab-item"
          :class="{ active: activeTab === tab.key }"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </span>
      </div>

      <!-- 基础键盘 -->
      <div v-show="activeTab === 'basic'" class="keyboard-grid basic-grid">
        <button
          v-for="key in basicKeys"
          :key="key.value"
          class="key-btn"
          :class="[key.type, { wide: key.wide }]"
          @click="handleKey(key)"
        >
          <span v-if="key.display" v-html="key.display"></span>
          <span v-else>{{ key.label }}</span>
        </button>
      </div>

      <!-- 函数键盘 -->
      <div v-show="activeTab === 'functions'" class="keyboard-grid function-grid">
        <button
          v-for="key in functionKeys"
          :key="key.value"
          class="key-btn function"
          :class="{ wide: key.wide }"
          @click="handleKey(key)"
        >
          <span v-if="key.display" v-html="key.display"></span>
          <span v-else>{{ key.label }}</span>
        </button>
      </div>

      <!-- 高级函数键盘 -->
      <div v-show="activeTab === 'advanced'" class="keyboard-grid advanced-grid">
        <button
          v-for="key in advancedKeys"
          :key="key.value"
          class="key-btn function"
          :class="{ wide: key.wide }"
          @click="handleKey(key)"
        >
          <span v-if="key.display" v-html="key.display"></span>
          <span v-else>{{ key.label }}</span>
        </button>
      </div>

      <!-- 常用模板 -->
      <div v-show="activeTab === 'templates'" class="keyboard-grid template-grid">
        <button
          v-for="template in templates"
          :key="template.value"
          class="key-btn template"
          @click="handleKey(template, true)"
        >
          <span class="template-label">{{ template.label }}</span>
          <span class="template-preview">{{ template.preview }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Grid, ArrowUp, ArrowDown } from '@element-plus/icons-vue'

interface KeyItem {
  label: string
  value: string
  display?: string
  type?: string
  wide?: boolean
  preview?: string
  cursorOffset?: number
}

const emit = defineEmits<{
  (e: 'input', value: string, cursorOffset?: number): void
  (e: 'clear'): void
  (e: 'backspace'): void
}>()

const isCollapsed = ref(false)
const activeTab = ref('basic')

const tabs = [
  { key: 'basic', label: '基础' },
  { key: 'functions', label: '函数' },
  { key: 'advanced', label: '高级' },
  { key: 'templates', label: '模板' }
]

// 基础键盘
const basicKeys: KeyItem[] = [
  // 第一行
  { label: '(', value: '(', type: 'operator' },
  { label: ')', value: ')', type: 'operator' },
  { label: '^', value: '^', display: 'x<sup>n</sup>', type: 'operator' },
  { label: '√', value: 'sqrt(', display: '√', type: 'operator' },
  { label: 'C', value: 'clear', type: 'action' },
  { label: '⌫', value: 'backspace', type: 'action' },
  // 第二行
  { label: '7', value: '7', type: 'number' },
  { label: '8', value: '8', type: 'number' },
  { label: '9', value: '9', type: 'number' },
  { label: '÷', value: '/', display: '÷', type: 'operator' },
  { label: 'π', value: 'pi', display: 'π', type: 'constant' },
  { label: 'e', value: 'e', type: 'constant' },
  // 第三行
  { label: '4', value: '4', type: 'number' },
  { label: '5', value: '5', type: 'number' },
  { label: '6', value: '6', type: 'number' },
  { label: '×', value: '*', display: '×', type: 'operator' },
  { label: 'x', value: 'x', type: 'variable' },
  { label: 'x²', value: '^2', display: 'x²', type: 'operator' },
  // 第四行
  { label: '1', value: '1', type: 'number' },
  { label: '2', value: '2', type: 'number' },
  { label: '3', value: '3', type: 'number' },
  { label: '-', value: '-', type: 'operator' },
  { label: '|x|', value: 'abs(', type: 'operator' },
  { label: 'x³', value: '^3', display: 'x³', type: 'operator' },
  // 第五行
  { label: '0', value: '0', type: 'number' },
  { label: '.', value: '.', type: 'number' },
  { label: '±', value: '-', display: '±', type: 'operator' },
  { label: '+', value: '+', type: 'operator' },
  { label: '=', value: '', type: 'equal', wide: true }
]

// 函数键盘
const functionKeys: KeyItem[] = [
  // 三角函数
  { label: 'sin', value: 'sin(', display: 'sin' },
  { label: 'cos', value: 'cos(', display: 'cos' },
  { label: 'tan', value: 'tan(', display: 'tan' },
  { label: 'cot', value: '1/tan(', display: 'cot' },
  // 反三角函数
  { label: 'asin', value: 'asin(', display: 'sin⁻¹' },
  { label: 'acos', value: 'acos(', display: 'cos⁻¹' },
  { label: 'atan', value: 'atan(', display: 'tan⁻¹' },
  { label: 'acot', value: 'atan(1/', display: 'cot⁻¹' },
  // 对数函数
  { label: 'ln', value: 'log(', display: 'ln' },
  { label: 'log', value: 'log10(', display: 'log₁₀' },
  { label: 'log₂', value: 'log2(', display: 'log₂' },
  { label: 'logₙ', value: 'log(,)', display: 'log<sub>n</sub>', cursorOffset: -2 },
  // 指数函数
  { label: 'eˣ', value: 'exp(', display: 'e<sup>x</sup>' },
  { label: '10ˣ', value: '10^', display: '10<sup>x</sup>' },
  { label: '2ˣ', value: '2^', display: '2<sup>x</sup>' },
  { label: 'xʸ', value: '^', display: 'x<sup>y</sup>' },
  // 根号
  { label: '√', value: 'sqrt(', display: '√x' },
  { label: '∛', value: 'cbrt(', display: '∛x' },
  { label: 'ⁿ√', value: 'nthRoot(,)', display: '<sup>n</sup>√x', cursorOffset: -2 },
  { label: '1/x', value: '1/', display: 'x⁻¹' }
]

// 高级函数键盘
const advancedKeys: KeyItem[] = [
  // 双曲函数
  { label: 'sinh', value: 'sinh(' },
  { label: 'cosh', value: 'cosh(' },
  { label: 'tanh', value: 'tanh(' },
  { label: 'coth', value: '1/tanh(' },
  // 反双曲函数
  { label: 'asinh', value: 'asinh(' },
  { label: 'acosh', value: 'acosh(' },
  { label: 'atanh', value: 'atanh(' },
  { label: 'acoth', value: 'atanh(1/' },
  // 取整函数
  { label: 'floor', value: 'floor(' },
  { label: 'ceil', value: 'ceil(' },
  { label: 'round', value: 'round(' },
  { label: 'sign', value: 'sign(' },
  // 其他
  { label: 'mod', value: ' mod ', display: 'mod' },
  { label: 'min', value: 'min(,)', cursorOffset: -2 },
  { label: 'max', value: 'max(,)', cursorOffset: -2 },
  { label: '!', value: '!', display: 'n!' },
  // 常数
  { label: 'π', value: 'pi', display: 'π' },
  { label: 'e', value: 'e' },
  { label: '∞', value: 'Infinity', display: '∞' },
  { label: 'φ', value: '(1+sqrt(5))/2', display: 'φ' }
]

// 常用模板
const templates: KeyItem[] = [
  { label: '一次函数', value: 'a*x+b', preview: 'ax + b' },
  { label: '二次函数', value: 'a*x^2+b*x+c', preview: 'ax² + bx + c' },
  { label: '三次函数', value: 'a*x^3+b*x^2+c*x+d', preview: 'ax³ + bx² + cx + d' },
  { label: '幂函数', value: 'x^a', preview: 'xᵃ' },
  { label: '指数函数', value: 'a^x', preview: 'aˣ' },
  { label: '对数函数', value: 'log(x)/log(a)', preview: 'logₐx' },
  { label: '正弦函数', value: 'a*sin(b*x+c)+d', preview: 'A·sin(Bx+C)+D' },
  { label: '余弦函数', value: 'a*cos(b*x+c)+d', preview: 'A·cos(Bx+C)+D' },
  { label: '正切函数', value: 'a*tan(b*x+c)', preview: 'A·tan(Bx+C)' },
  { label: '反比例函数', value: 'a/x', preview: 'a/x' },
  { label: '平方根', value: 'sqrt(x)', preview: '√x' },
  { label: '绝对值', value: 'abs(x)', preview: '|x|' },
  { label: '双曲正弦', value: 'sinh(x)', preview: 'sinh(x)' },
  { label: '高斯函数', value: 'exp(-x^2)', preview: 'e⁻ˣ²' },
  { label: '洛伦兹函数', value: '1/(1+x^2)', preview: '1/(1+x²)' },
  { label: 'S型曲线', value: '1/(1+exp(-x))', preview: 'sigmoid(x)' }
]

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
}

const handleKey = (key: KeyItem, isTemplate = false) => {
  if (key.value === 'clear') {
    emit('clear')
  } else if (key.value === 'backspace') {
    emit('backspace')
  } else if (key.value === '') {
    // 等号键，不做任何操作
  } else {
    // 如果是模板，先清空再输入
    if (isTemplate) {
      emit('clear')
      // 使用 setTimeout 确保清空操作完成后再输入
      setTimeout(() => {
        emit('input', key.value, key.cursorOffset)
      }, 0)
    } else {
      emit('input', key.value, key.cursorOffset)
    }
  }
}
</script>

<style lang="scss" scoped>
.math-keyboard {
  background: var(--card-bg);
  border-radius: 12px;
  box-shadow: var(--box-shadow-light);
  overflow: hidden;
  transition: all 0.3s ease;

  &.collapsed {
    .keyboard-content {
      display: none;
    }
  }
}

.keyboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--bg-color);
  cursor: pointer;
  user-select: none;
  transition: background 0.2s;

  &:hover {
    background: var(--hover-bg);
  }

  .header-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    color: var(--text-color);

    .el-icon {
      color: var(--primary-color);
    }
  }

  .collapse-icon {
    color: var(--text-color-secondary);
    transition: transform 0.3s;
  }
}

.keyboard-content {
  padding: 12px;
}

.keyboard-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 12px;
  padding: 4px;
  background: var(--bg-color);
  border-radius: 8px;

  .tab-item {
    flex: 1;
    padding: 8px 12px;
    text-align: center;
    font-size: 13px;
    color: var(--text-color-secondary);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      color: var(--text-color);
      background: rgba(var(--primary-color-rgb), 0.1);
    }

    &.active {
      color: white;
      background: var(--primary-color);
      font-weight: 500;
    }
  }
}

.keyboard-grid {
  display: grid;
  gap: 8px;

  &.basic-grid {
    grid-template-columns: repeat(6, 1fr);
  }

  &.function-grid {
    grid-template-columns: repeat(4, 1fr);
  }

  &.advanced-grid {
    grid-template-columns: repeat(4, 1fr);
  }

  &.template-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.key-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 12px 8px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  background: var(--bg-color);
  color: var(--text-color);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  &:active {
    transform: translateY(0);
  }

  &.wide {
    grid-column: span 2;
  }

  // 数字键
  &.number {
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    font-size: 18px;
  }

  // 运算符键
  &.operator {
    background: rgba(var(--primary-color-rgb), 0.1);
    color: var(--primary-color);
  }

  // 常量键
  &.constant {
    background: rgba(103, 194, 58, 0.1);
    color: #67C23A;
  }

  // 变量键
  &.variable {
    background: rgba(230, 162, 60, 0.1);
    color: #E6A23C;
    font-style: italic;
  }

  // 操作键
  &.action {
    background: rgba(245, 108, 108, 0.1);
    color: #F56C6C;

    &:hover {
      background: rgba(245, 108, 108, 0.2);
    }
  }

  // 等号键
  &.equal {
    background: var(--primary-color);
    color: white;

    &:hover {
      background: var(--primary-color-dark);
    }
  }

  // 函数键
  &.function {
    background: var(--bg-color);
    font-size: 14px;
    padding: 10px 6px;

    &:hover {
      background: rgba(var(--primary-color-rgb), 0.1);
      color: var(--primary-color);
    }
  }

  // 模板键
  &.template {
    flex-direction: column;
    align-items: flex-start;
    padding: 12px;
    text-align: left;

    .template-label {
      font-size: 13px;
      font-weight: 600;
      color: var(--text-color);
      margin-bottom: 4px;
    }

    .template-preview {
      font-size: 12px;
      color: var(--text-color-secondary);
      font-family: 'Cambria Math', 'Times New Roman', serif;
    }

    &:hover {
      background: rgba(var(--primary-color-rgb), 0.1);

      .template-label {
        color: var(--primary-color);
      }
    }
  }

  // 上标下标样式
  :deep(sup) {
    font-size: 10px;
    vertical-align: super;
  }

  :deep(sub) {
    font-size: 10px;
    vertical-align: sub;
  }
}

// 响应式布局
@media (max-width: 500px) {
  .keyboard-grid {
    &.basic-grid {
      grid-template-columns: repeat(4, 1fr);
    }

    &.function-grid,
    &.advanced-grid {
      grid-template-columns: repeat(3, 1fr);
    }

    &.template-grid {
      grid-template-columns: 1fr;
    }
  }

  .key-btn {
    padding: 10px 6px;
    font-size: 14px;

    &.number {
      font-size: 16px;
    }
  }
}

// 按键按下动画
@keyframes keyPress {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(0.95);
  }
  100% {
    transform: scale(1);
  }
}

.key-btn:active {
  animation: keyPress 0.1s ease;
}
</style>
