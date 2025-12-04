<template>
  <el-dialog
    v-model="visible"
    title="键盘快捷键"
    width="500px"
    :append-to-body="true"
  >
    <div class="shortcuts-content">
      <div class="shortcut-group">
        <h4>全局导航</h4>
        <div class="shortcut-item">
          <span class="shortcut-keys"><kbd>Ctrl</kbd> + <kbd>H</kbd></span>
          <span class="shortcut-desc">返回首页</span>
        </div>
        <div class="shortcut-item">
          <span class="shortcut-keys"><kbd>Ctrl</kbd> + <kbd>L</kbd></span>
          <span class="shortcut-desc">知识学习</span>
        </div>
        <div class="shortcut-item">
          <span class="shortcut-keys"><kbd>Ctrl</kbd> + <kbd>P</kbd></span>
          <span class="shortcut-desc">例题练习</span>
        </div>
        <div class="shortcut-item">
          <span class="shortcut-keys"><kbd>Ctrl</kbd> + <kbd>F</kbd></span>
          <span class="shortcut-desc">公式速查</span>
        </div>
        <div class="shortcut-item">
          <span class="shortcut-keys"><kbd>Ctrl</kbd> + <kbd>G</kbd></span>
          <span class="shortcut-desc">函数绘图</span>
        </div>
      </div>

      <div class="shortcut-group">
        <h4>章节导航（学习页面）</h4>
        <div class="shortcut-item">
          <span class="shortcut-keys"><kbd>↑</kbd> / <kbd>↓</kbd></span>
          <span class="shortcut-desc">切换知识点</span>
        </div>
        <div class="shortcut-item">
          <span class="shortcut-keys"><kbd>←</kbd> / <kbd>→</kbd></span>
          <span class="shortcut-desc">折叠/展开章节</span>
        </div>
        <div class="shortcut-item">
          <span class="shortcut-keys"><kbd>Enter</kbd></span>
          <span class="shortcut-desc">进入知识点/展开</span>
        </div>
      </div>

      <div class="shortcut-group">
        <h4>练习页面</h4>
        <div class="shortcut-item">
          <span class="shortcut-keys"><kbd>空格</kbd></span>
          <span class="shortcut-desc">显示/隐藏答案</span>
        </div>
        <div class="shortcut-item">
          <span class="shortcut-keys"><kbd>1</kbd> / <kbd>2</kbd> / <kbd>3</kbd></span>
          <span class="shortcut-desc">正确/错误/跳过</span>
        </div>
        <div class="shortcut-item">
          <span class="shortcut-keys"><kbd>Enter</kbd></span>
          <span class="shortcut-desc">下一题</span>
        </div>
      </div>

      <div class="shortcut-group">
        <h4>通用</h4>
        <div class="shortcut-item">
          <span class="shortcut-keys"><kbd>?</kbd></span>
          <span class="shortcut-desc">显示此帮助</span>
        </div>
        <div class="shortcut-item">
          <span class="shortcut-keys"><kbd>Esc</kbd></span>
          <span class="shortcut-desc">关闭弹窗</span>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const visible = ref(false)

const handleKeydown = (e: KeyboardEvent) => {
  // 如果在输入框中，不处理
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
    return
  }

  // ? 键显示帮助
  if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
    e.preventDefault()
    visible.value = true
    return
  }

  // Esc 关闭帮助
  if (e.key === 'Escape' && visible.value) {
    visible.value = false
    return
  }

  // Ctrl/Cmd 组合键
  if (e.ctrlKey || e.metaKey) {
    switch (e.key.toLowerCase()) {
      case 'h':
        e.preventDefault()
        router.push('/')
        break
      case 'l':
        e.preventDefault()
        router.push('/learn')
        break
      case 'p':
        e.preventDefault()
        router.push('/practice')
        break
      case 'g':
        e.preventDefault()
        router.push('/graph')
        break
      // Ctrl+F 保留给浏览器默认的搜索功能
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})

// 暴露方法供外部调用
defineExpose({
  show: () => { visible.value = true },
  hide: () => { visible.value = false }
})
</script>

<style lang="scss" scoped>
.shortcuts-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.shortcut-group {
  h4 {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-color);
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--border-color);
  }
}

.shortcut-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;

  .shortcut-keys {
    display: flex;
    align-items: center;
    gap: 4px;

    kbd {
      display: inline-block;
      padding: 4px 8px;
      font-size: 12px;
      font-family: monospace;
      background-color: var(--bg-color);
      border: 1px solid var(--border-color);
      border-radius: 4px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      min-width: 24px;
      text-align: center;
    }
  }

  .shortcut-desc {
    font-size: 13px;
    color: var(--text-color-secondary);
  }
}
</style>
