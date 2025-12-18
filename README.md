# Math Helper

![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS-lightgrey.svg)

**高等数学可视化学习工具** - 让抽象数学变得直观易懂

面向大学生和考研群体的桌面应用，通过交互式动画、AI 辅助和科学的学习管理，帮助用户深入理解高等数学概念。

## 核心功能

### 函数绘图引擎

- **公式输入绘图** - 支持标准数学表达式，实时渲染函数曲线
- **参数动态调节** - 滑动条实时调整参数，观察曲线变化
- **多函数叠加** - 同一坐标系显示多条曲线，便于对比分析
- **特殊点标注** - 自动识别并标注极值点、拐点、零点
- **3D 曲面绘制** - 二元函数三维可视化，支持显式曲面和参数曲面
  - 预设曲面：抛物面、马鞍面、波浪面、球面、圆环面、莫比乌斯带等
  - 临界点分析、梯度场显示、切平面可视化
  - 多种配色方案，支持自动旋转

### 知识点可视化

- **极限动画** - 动态演示 ε-δ 语言和极限过程
- **导数几何意义** - 切线动画，直观理解变化率
- **积分面积填充** - 定积分区域可视化，理解"求和"本质
- **泰勒展开对比** - 多阶展开逼近效果对比
- **中值定理动画** - 几何直观演示拉格朗日中值定理
- **单调性与凹凸性** - 函数性质的动态演示

### AI 辅助理解

- **知识点比喻生成** - 用生活化比喻解释抽象概念，支持预览确认
- **智能问答面板** - 针对知识点进行对话式答疑，支持 Markdown 和 LaTeX 渲染
- **独立 AI 助手** - 全功能数学问答助手
- **错误诊断** - 分析常见误区和易错点
- **多模型支持** - 支持 6 大 AI 服务商：
  - 通义千问（阿里云）
  - DeepSeek（深度推理）
  - OpenAI（GPT 系列）
  - 智谱 AI（GLM 系列）
  - 月之暗面（Kimi）
  - 硅基流动（开源模型）

### 深度理解模块

- **知识图谱** - 可视化知识点之间的关联关系
- **学习路径** - 智能推荐学习顺序
- **概念关联** - 展示前置知识和后继知识

### 学习管理

- **学习进度追踪** - 记录每个知识点的学习状态（未学习/学习中/已完成/已掌握）
- **公式闪卡** - 间隔重复算法优化记忆
- **错题本** - 收集错题，智能复习提醒
- **笔记系统** - 关联知识点的笔记管理
- **收藏夹** - 收藏重要知识点和公式
- **学习数据导出/导入** - 支持备份和迁移学习进度

### 公式速查

- **分类卡片库** - 按章节和主题分类的公式卡片
- **LaTeX 渲染** - 高质量数学公式显示
- **快速搜索** - 关键词检索公式
- **考试频率标签** - 标注必考/高频/中频公式
- **记忆口诀** - 辅助记忆的口诀提示

## 高等数学知识体系

完整覆盖高等数学核心内容：

```
第一章  函数、极限与连续
├── 1.1 函数的概念与基本性质
├── 1.2 函数的四则运算与复合
├── 1.3 基本初等函数
├── 1.4 初等函数
├── 1.5 数列极限
├── 1.6 函数极限
├── 1.7 无穷小与无穷大
└── 1.8 函数的连续性

第二章  导数与微分
├── 2.1 导数的概念
├── 2.2 求导法则
├── 2.3 高阶导数
├── 2.4 隐函数与参数方程求导
├── 2.5 微分的概念
└── 2.6 微分的应用

第三章  导数的应用
├── 3.1 中值定理
├── 3.2 洛必达法则
├── 3.3 泰勒公式
├── 3.4 函数单调性与极值
├── 3.5 函数凹凸性与拐点
└── 3.6 曲线的渐近线

第四章  不定积分
├── 4.1 不定积分的概念
├── 4.2 换元积分法
├── 4.3 分部积分法
└── 4.4 有理函数积分

第五章  定积分
├── 5.1 定积分的概念
├── 5.2 微积分基本定理
├── 5.3 定积分的计算
├── 5.4 反常积分
└── 5.5 定积分的应用

第六章  微分方程
├── 6.1 微分方程基本概念
├── 6.2 一阶微分方程
├── 6.3 二阶常系数微分方程
└── 6.4 微分方程应用

第七章  多元函数微分
├── 7.1 多元函数基本概念
├── 7.2 偏导数
├── 7.3 全微分
├── 7.4 多元复合函数求导
├── 7.5 隐函数求导
└── 7.6 多元函数极值

第八章  重积分
├── 8.1 二重积分
├── 8.2 三重积分
└── 8.3 重积分应用

第九章  无穷级数
├── 9.1 数项级数基本概念
├── 9.2 正项级数
├── 9.3 交错级数
├── 9.4 幂级数
├── 9.5 函数展开为幂级数
└── 9.6 傅里叶级数
```

## 技术栈

| 类别 | 技术 | 版本 |
|------|------|------|
| 桌面框架 | Electron | 28.0.0 |
| 前端框架 | Vue 3 | 3.4.0 |
| 开发语言 | TypeScript | 5.3.0 |
| 状态管理 | Pinia | 2.1.0 |
| UI 组件 | Element Plus | 2.4.0 |
| 构建工具 | Vite | 5.0.0 |
| 图表库 | ECharts | 5.4.0 |
| 3D 渲染 | ECharts GL | 2.0.9 |
| 动画库 | D3.js | 7.8.0 |
| 公式渲染 | KaTeX | 0.16.0 |
| Markdown | Marked | 17.0.0 |
| 数学计算 | Math.js | 12.2.0 |
| HTTP 客户端 | Axios | 1.6.0 |

## 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
# Web 开发服务器 (http://localhost:5173)
npm run dev

# Electron 桌面开发环境（支持热更新）
npm run electron:dev
```

### 构建发布

```bash
# 构建 Web 版本
npm run build

# 构建桌面应用
npm run electron:build
```

### 代码质量

```bash
# 运行测试
npm run test

# 代码检查
npm run lint

# 代码格式化
npm run format
```

## 项目结构

```
Math_Helper/
├── electron/                # Electron 主进程
│   ├── main.ts             # 主进程入口
│   └── preload.ts          # 预加载脚本
├── src/
│   ├── assets/             # 静态资源和样式
│   │   └── styles/         # SCSS 样式文件
│   ├── components/         # Vue 组件
│   │   ├── ai/             # AI 相关组件
│   │   │   └── ChatPanel.vue       # AI 问答面板
│   │   ├── common/         # 通用组件
│   │   │   ├── AppHeader.vue       # iOS 风格导航栏
│   │   │   └── GlobalSearch.vue    # 全局搜索
│   │   ├── deep-understanding/     # 深度理解组件
│   │   ├── graph/          # 绘图相关组件
│   │   ├── knowledge/      # 知识点组件
│   │   │   ├── ChapterTree.vue     # 章节树
│   │   │   ├── KnowledgeGraph.vue  # 知识图谱
│   │   │   └── NotesSection.vue    # 笔记区域
│   │   ├── learn/          # 学习模块组件
│   │   │   ├── CommonMistakesPanel.vue  # 易错点面板
│   │   │   └── LearningPathPanel.vue    # 学习路径
│   │   ├── memory/         # 记忆/闪卡组件
│   │   ├── practice/       # 练习模块组件
│   │   └── visualization/  # 可视化动画组件
│   │       ├── DerivativeAnimation.vue   # 导数动画
│   │       ├── IntegralAnimation.vue     # 积分动画
│   │       ├── LimitAnimation.vue        # 极限动画
│   │       ├── TaylorAnimation.vue       # 泰勒展开
│   │       ├── MeanValueAnimation.vue    # 中值定理
│   │       ├── Surface3D.vue             # 3D 曲面
│   │       └── InteractiveFunctionPlot.vue # 交互式函数图
│   ├── views/              # 页面视图
│   │   ├── HomeView.vue            # 首页仪表板
│   │   ├── GraphView.vue           # 2D 函数绘图
│   │   ├── Graph3DView.vue         # 3D 曲面绘图
│   │   ├── LearnView.vue           # 知识学习
│   │   ├── KnowledgeGraphView.vue  # 知识图谱
│   │   ├── DeepUnderstandingView.vue # 深度理解
│   │   ├── PracticeView.vue        # 例题练习
│   │   ├── FormulaView.vue         # 公式速查
│   │   ├── NotesView.vue           # 笔记管理
│   │   ├── FavoritesView.vue       # 收藏夹
│   │   ├── WrongQuestionsView.vue  # 错题本
│   │   └── SettingsView.vue        # 设置页面
│   ├── stores/             # Pinia 状态管理
│   │   ├── knowledgeStore.ts   # 知识库状态
│   │   ├── progressStore.ts    # 学习进度
│   │   └── settingsStore.ts    # 应用设置
│   ├── services/           # 业务服务层
│   │   ├── aiService.ts    # AI 服务（多模型支持）
│   │   └── spacedRepetition.ts  # 间隔重复算法
│   ├── router/             # 路由配置
│   ├── types/              # TypeScript 类型定义
│   ├── utils/              # 工具函数
│   │   ├── latex.ts        # LaTeX/Markdown 渲染
│   │   ├── mathjs.ts       # 数学计算封装
│   │   └── specialPoints.ts # 特殊点计算
│   ├── data/               # 知识库数据
│   │   └── knowledgeBase/  # JSON 数据文件
│   │       ├── chapters.json        # 章节结构
│   │       ├── knowledgePoints.json # 知识点定义
│   │       ├── formulas.json        # 公式库
│   │       ├── examples.json        # 例题库
│   │       ├── commonMistakes.json  # 常见错误
│   │       └── metaphors.json       # 比喻库
│   └── main.ts             # Vue 应用入口
├── md/                      # 项目文档
├── public/                  # 公共资源
└── release/                 # 构建输出
```

## 页面功能

| 页面 | 路由 | 说明 |
|------|------|------|
| 首页 | `/` | 学习仪表板，快速入口 |
| 函数绘图 | `/graph` | 2D 交互式函数绘图工具 |
| 3D 绘图 | `/graph-3d` | 3D 曲面可视化 |
| 知识学习 | `/learn` | 知识点学习和动画演示 |
| 知识图谱 | `/knowledge-graph` | 知识点关联可视化 |
| 深度理解 | `/deep-understanding` | 深入学习模块 |
| 例题练习 | `/practice` | 分步解题练习 |
| AI 助手 | `/ai` | 独立 AI 问答助手 |
| 公式速查 | `/formula` | 公式卡片库 |
| 笔记管理 | `/notes` | 学习笔记 |
| 收藏夹 | `/favorites` | 收藏的知识点和公式 |
| 错题本 | `/wrong-questions` | 错题记录和复习 |
| 设置 | `/settings` | 应用设置、AI 配置 |

## AI 服务配置

应用支持多种 AI 服务商，可在设置页面配置：

| 服务商 | 推荐模型 | 特点 |
|--------|----------|------|
| 通义千问 | qwen-turbo | 国内稳定，响应快速 |
| DeepSeek | deepseek-reasoner | 深度推理，适合数学 |
| OpenAI | gpt-4o | 能力强大，需科学上网 |
| 智谱 AI | glm-4-flash | 免费额度充足 |
| 月之暗面 | moonshot-v1-32k | 长上下文支持 |
| 硅基流动 | Qwen2.5-72B | 多种开源模型 |

## 文档

- [产品简报](md/product-brief.md) - 产品愿景和目标
- [产品需求文档](md/prd.md) - 详细功能规格
- [技术架构文档](md/architecture.md) - 系统设计说明

## 特性亮点

- **离线优先** - 核心功能无需网络，本地存储学习数据
- **高性能渲染** - 公式渲染 <100ms，动画保持 60fps
- **无需登录** - 数据存储在本地，保护隐私
- **主题切换** - 支持浅色/深色主题
- **自定义标题栏** - macOS 风格窗口控制
- **iOS 设计风格** - 现代化的用户界面
- **响应式布局** - 适配不同屏幕尺寸

## 更新日志

### v0.1.0 (2024-12)

- 初始版本发布
- 2D/3D 函数绘图功能
- 知识点可视化动画
- AI 多模型支持（6 大服务商）
- 学习进度管理
- 公式速查和闪卡
- 笔记和收藏功能
- 错题本功能

## License

[MIT](LICENSE)

## 作者

DuncanYoung

---

如有问题或建议，欢迎提交 Issue 或 Pull Request。
