# Math Helper

高等数学可视化学习工具 - 让抽象数学变得直观易懂

## 功能特性

- **函数绘图**: 输入数学公式，实时绘制函数曲线，支持参数动态调节
- **知识可视化**: 交互式动画演示极限、导数、积分等核心概念
- **AI辅助理解**: 用生活化比喻解释抽象概念，智能问答
- **公式速查**: 完整的高等数学公式卡片库

## 技术栈

- **桌面框架**: Electron
- **前端框架**: Vue 3 + TypeScript
- **状态管理**: Pinia
- **UI组件**: Element Plus
- **图表**: ECharts + D3.js
- **公式渲染**: KaTeX
- **数学计算**: Math.js

## 开发

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
# 仅启动Web开发服务器
npm run dev

# 启动Electron开发环境
npm run electron:dev
```

### 构建

```bash
# 构建Web
npm run build

# 构建桌面应用
npm run electron:build
```

## 项目结构

```
math-helper/
├── electron/          # Electron主进程
├── src/
│   ├── assets/        # 静态资源和样式
│   ├── components/    # Vue组件
│   ├── views/         # 页面视图
│   ├── stores/        # Pinia状态管理
│   ├── router/        # 路由配置
│   ├── types/         # TypeScript类型
│   └── main.ts        # 入口文件
├── public/            # 公共资源
└── md/                # 项目文档
```

## 文档

- [产品简报](md/product-brief.md)
- [产品需求文档](md/prd.md)
- [技术架构文档](md/architecture.md)

## License

MIT
