import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

export default defineConfig({
  plugins: [
    vue(),
    // 自动导入 Vue 相关函数和 Element Plus
    AutoImport({
      imports: ['vue', 'vue-router', 'pinia'],
      resolvers: [ElementPlusResolver()],
      dts: 'src/types/auto-imports.d.ts'
    }),
    // 自动注册组件
    Components({
      resolvers: [ElementPlusResolver()],
      dts: 'src/types/components.d.ts'
    })
  ],
  base: './', // Electron 需要使用相对路径
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler'
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // 代码分割优化
    rollupOptions: {
      output: {
        manualChunks(id) {
          // node_modules 依赖分割
          if (id.includes('node_modules')) {
            // Vue 核心（精简）
            if (id.includes('/vue/') || id.includes('/@vue/')) {
              return 'vue-core'
            }
            if (id.includes('vue-router')) {
              return 'vue-router'
            }
            if (id.includes('pinia')) {
              return 'pinia'
            }
            // Element Plus 图标单独分离
            if (id.includes('@element-plus/icons')) {
              return 'el-icons'
            }
            // Element Plus 主体（无法再分割，这是整体打包的库）
            if (id.includes('element-plus')) {
              return 'element-plus'
            }
            // ECharts GL 和 claygl
            if (id.includes('echarts-gl') || id.includes('claygl')) {
              return 'echarts-gl'
            }
            // ECharts 核心渲染引擎
            if (id.includes('zrender')) {
              return 'zrender'
            }
            // ECharts 主体
            if (id.includes('echarts')) {
              return 'echarts'
            }
            // D3 可视化
            if (id.includes('d3')) {
              return 'd3'
            }
            // mathjs 及其依赖
            if (id.includes('mathjs')) {
              return 'mathjs-core'
            }
            if (id.includes('decimal.js') || id.includes('complex.js') || id.includes('fraction.js') || id.includes('typed-function')) {
              return 'mathjs-deps'
            }
            // 公式渲染
            if (id.includes('katex')) {
              return 'katex'
            }
            // Markdown
            if (id.includes('marked')) {
              return 'marked'
            }
            // Axios
            if (id.includes('axios')) {
              return 'axios'
            }
          }
        },
        // 优化 chunk 命名
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
          if (facadeModuleId && facadeModuleId.includes('views')) {
            return 'assets/views/[name]-[hash].js'
          }
          return 'assets/[name]-[hash].js'
        }
      }
    },
    // 调整 chunk 大小警告阈值
    chunkSizeWarningLimit: 700
  },
  server: {
    port: 5173,
    proxy: {
      // DeepSeek API 代理
      '/api/deepseek': {
        target: 'https://api.deepseek.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/deepseek/, ''),
        secure: true
      },
      // 通义千问 API 代理
      '/api/qwen': {
        target: 'https://dashscope.aliyuncs.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/qwen/, ''),
        secure: true
      },
      // OpenAI API 代理
      '/api/openai': {
        target: 'https://api.openai.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/openai/, ''),
        secure: true
      },
      // 智谱AI API 代理
      '/api/zhipu': {
        target: 'https://open.bigmodel.cn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/zhipu/, ''),
        secure: true
      },
      // Moonshot (月之暗面) API 代理
      '/api/moonshot': {
        target: 'https://api.moonshot.cn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/moonshot/, ''),
        secure: true
      },
      // 硅基流动 API 代理
      '/api/siliconflow': {
        target: 'https://api.siliconflow.cn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/siliconflow/, ''),
        secure: true
      }
    }
  }
})
