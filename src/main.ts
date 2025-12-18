import { createApp } from 'vue'
import { createPinia } from 'pinia'
// Element Plus 按需导入 - 组件自动注册，只需导入命令式组件样式
import 'element-plus/es/components/message/style/css'
import 'element-plus/es/components/message-box/style/css'
import 'element-plus/es/components/notification/style/css'
import 'element-plus/es/components/loading/style/css'
import 'katex/dist/katex.min.css'

import App from './App.vue'
import router from './router'

import './assets/styles/global.scss'
import './assets/styles/ios-overrides.scss'

const app = createApp(App)

// 全局错误处理
app.config.errorHandler = (err, vm, info) => {
  console.error('Global Error:', err)
  console.error('Component:', vm)
  console.error('Info:', info)
}

app.use(createPinia())
app.use(router)

app.mount('#app')
