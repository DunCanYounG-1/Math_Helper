# Math Helper 技术架构文档

> Technical Architecture Document v1.1

---

## 1. 文档信息

| 属性 | 值 |
|------|-----|
| 产品名称 | Math Helper |
| 版本 | v1.1 |
| 创建日期 | 2025-12-03 |
| 更新日期 | 2025-12-18 |
| 状态 | 已实施 |
| 作者 | DuncanYoung |

---

## 2. 架构概述

### 2.1 架构目标

| 目标 | 描述 |
|------|------|
| 高性能 | 动画流畅60fps，公式渲染<100ms |
| 可维护 | 模块化设计，职责清晰 |
| 可扩展 | 易于添加新的知识点和可视化 |
| 离线优先 | 核心功能无需网络 |

### 2.2 架构风格

采用 **分层架构 + 模块化设计**：

```
┌─────────────────────────────────────────────────────────────┐
│                      Electron Main Process                   │
│                    (窗口管理、系统集成、IPC)                    │
├─────────────────────────────────────────────────────────────┤
│                    Electron Renderer Process                 │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                    Vue 3 Application                   │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │              Presentation Layer                  │  │  │
│  │  │         (Views, Components, Layouts)             │  │  │
│  │  ├─────────────────────────────────────────────────┤  │  │
│  │  │              Business Layer                      │  │  │
│  │  │    (Composables, Services, State Management)     │  │  │
│  │  ├─────────────────────────────────────────────────┤  │  │
│  │  │                Core Layer                        │  │  │
│  │  │     (Math Engine, Visualization Engine, AI)      │  │  │
│  │  ├─────────────────────────────────────────────────┤  │  │
│  │  │               Data Layer                         │  │  │
│  │  │      (Knowledge Base, User Storage, API)         │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. 技术栈

### 3.1 技术选型

| 层级 | 技术 | 版本 | 选型理由 |
|------|------|------|----------|
| 桌面框架 | Electron | ^28.0.0 | 成熟稳定，生态丰富，跨平台 |
| 前端框架 | Vue 3 | ^3.4.0 | 组合式API，响应式优秀，中文社区活跃 |
| 类型系统 | TypeScript | ^5.3.0 | 类型安全，IDE支持好 |
| 构建工具 | Vite | ^5.0.0 | 快速HMR，开箱即用 |
| 状态管理 | Pinia | ^2.1.0 | Vue官方推荐，轻量简洁 |
| UI组件库 | Element Plus | ^2.4.0 | Vue3生态首选，组件丰富 |
| 路由 | Vue Router | ^4.2.0 | Vue官方路由 |
| 图表库 | ECharts | ^5.4.0 | 功能强大，文档完善 |
| 3D渲染 | ECharts GL | ^2.0.9 | 3D曲面可视化 |
| 可视化 | D3.js | ^7.8.0 | 灵活自由，适合复杂动画 |
| 公式渲染 | KaTeX | ^0.16.0 | 高性能，渲染速度快 |
| Markdown | Marked | ^17.0.0 | Markdown渲染 |
| 公式解析 | Math.js | ^12.2.0 | 功能完整，支持符号计算 |
| HTTP客户端 | Axios | ^1.6.0 | 成熟稳定 |
| 样式 | SCSS | - | CSS预处理，变量和嵌套 |

### 3.2 开发工具

| 工具 | 用途 |
|------|------|
| ESLint | 代码规范检查 |
| Prettier | 代码格式化 |
| Vitest | 单元测试 |
| electron-builder | 应用打包 |

---

## 4. 项目目录结构

```
math-helper/
├── electron/                     # Electron主进程代码
│   ├── main.ts                   # 主进程入口
│   ├── preload.ts                # 预加载脚本
│   └── ipc/                      # IPC通信处理
│       └── handlers.ts
│
├── src/                          # 渲染进程(Vue应用)
│   ├── main.ts                   # Vue入口
│   ├── App.vue                   # 根组件
│   │
│   ├── assets/                   # 静态资源
│   │   ├── styles/               # 全局样式
│   │   │   ├── variables.scss    # SCSS变量
│   │   │   ├── mixins.scss       # SCSS混入
│   │   │   └── global.scss       # 全局样式
│   │   └── icons/                # 图标资源
│   │
│   ├── components/               # 通用组件
│   │   ├── common/               # 基础通用组件
│   │   │   ├── AppHeader.vue
│   │   │   ├── AppSidebar.vue
│   │   │   └── LoadingSpinner.vue
│   │   ├── graph/                # 绘图相关组件
│   │   │   ├── FunctionInput.vue        # 函数输入框
│   │   │   ├── ParameterSlider.vue      # 参数滑动条
│   │   │   ├── CoordinateSystem.vue     # 坐标系
│   │   │   ├── FunctionCurve.vue        # 函数曲线
│   │   │   ├── SpecialPoints.vue        # 特殊点标注
│   │   │   └── Surface3D.vue            # 3D曲面
│   │   ├── visualization/        # 可视化动画组件
│   │   │   ├── LimitAnimation.vue       # 极限动画
│   │   │   ├── DerivativeAnimation.vue  # 导数动画
│   │   │   ├── IntegralAnimation.vue    # 积分动画
│   │   │   ├── SeriesAnimation.vue      # 级数动画
│   │   │   ├── TaylorAnimation.vue      # 泰勒展开
│   │   │   └── AnimationControls.vue    # 动画控制器
│   │   ├── knowledge/            # 知识体系组件
│   │   │   ├── ChapterTree.vue          # 章节树
│   │   │   ├── KnowledgeGraph.vue       # 知识图谱
│   │   │   ├── FormulaCard.vue          # 公式卡片
│   │   │   └── MetaphorDisplay.vue      # 比喻展示
│   │   └── ai/                   # AI相关组件
│   │       ├── MetaphorGenerator.vue    # 比喻生成
│   │       └── ChatPanel.vue            # 问答面板
│   │
│   ├── views/                    # 页面视图
│   │   ├── HomeView.vue          # 首页
│   │   ├── GraphView.vue         # 函数绘图页
│   │   ├── LearnView.vue         # 知识学习页
│   │   ├── FormulaView.vue       # 公式速查页
│   │   └── SettingsView.vue      # 设置页
│   │
│   ├── layouts/                  # 布局组件
│   │   └── MainLayout.vue        # 主布局
│   │
│   ├── router/                   # 路由配置
│   │   └── index.ts
│   │
│   ├── stores/                   # Pinia状态管理
│   │   ├── index.ts              # Store入口
│   │   ├── graphStore.ts         # 绘图状态
│   │   ├── knowledgeStore.ts     # 知识点状态
│   │   ├── userStore.ts          # 用户状态
│   │   └── settingsStore.ts      # 设置状态
│   │
│   ├── composables/              # 组合式函数
│   │   ├── useGraph.ts           # 绘图逻辑
│   │   ├── useAnimation.ts       # 动画控制
│   │   ├── useMathParser.ts      # 公式解析
│   │   └── useAI.ts              # AI调用
│   │
│   ├── services/                 # 服务层
│   │   ├── mathEngine.ts         # 数学计算引擎
│   │   ├── visualizationEngine.ts # 可视化引擎
│   │   ├── aiService.ts          # AI服务
│   │   └── storageService.ts     # 本地存储
│   │
│   ├── core/                     # 核心模块
│   │   ├── math/                 # 数学核心
│   │   │   ├── parser.ts         # 表达式解析
│   │   │   ├── evaluator.ts      # 表达式求值
│   │   │   ├── derivative.ts     # 求导计算
│   │   │   ├── integral.ts       # 积分计算
│   │   │   └── specialPoints.ts  # 特殊点计算
│   │   └── visualization/        # 可视化核心
│   │       ├── bindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindCoordinate bindbindBindbindbindBindbindbindbindbindbindbindbindbindBindbindBindbindBindbindcoordSystembindbindbindbindBindBindbindBindBindBindbindbindbindbindBindBindBindBindBindBindBindBindBindBindBindBindBindcoordSystem.ts   # 坐标系渲染
│   │       bindbindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindbindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBind bindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindbindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBind├bindBindBindBindBindBindBindBindBind bindBindBindBindBindBindBindBind bindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBind bindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBind bindBindBindBindBindBind bindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBind bindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBind── bindBindBindBindBindBindBindBindBindBindBindbindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindcurveBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindRenderer.ts       # 曲线渲染
│   │       bindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBind└── bindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBind bindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBind bindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBind bindBindBindBindBindBindBindBindBindBind animationBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindEngine.ts      # 动画引擎
│   │
│   ├── data/                     # 静态数据
│   │   ├── knowledgeBase/        # 知识库
│   │   │   ├── chapters.json     # 章节数据
│   │   │   ├── knowledgePoints.json  # 知识点数据
│   │   │   ├── metaphors.json    # 预设比喻
│   │   │   └── formulas.json     # 公式数据
│   │   └── config/               # 配置数据
│   │       └── visualization.json # 可视化配置
│   │
│   ├── types/                    # TypeScript类型定义
│   │   ├── math.ts               # 数学相关类型
│   │   ├── knowledge.ts          # 知识点类型
│   │   ├── visualization.ts      # 可视化类型
│   │   └── api.ts                # API类型
│   │
│   └── utils/                    # 工具函数
│       ├── formatters.ts         # 格式化工具
│       ├── validators.ts         # 验证工具
│       └── helpers.ts            # 辅助函数
│
├── public/                       # 公共静态资源
│   └── favicon.ico
│
├── tests/                        # 测试文件
│   ├── unit/                     # 单元测试
│   └── e2e/                      # 端到端测试
│
├── scripts/                      # 构建脚本
│   └── build.ts
│
├── package.json
├── tsconfig.json
├── vite.config.ts
├── electron-builder.json         # 打包配置
└── README.md
```

---

## 5. 核心模块设计

### 5.1 数学引擎 (Math Engine)

**职责**: 解析数学表达式、计算函数值、求导求积、识别特殊点

```typescript
// src/core/math/parser.ts
import { parse, compile, EvalFunction } from 'mathjs';

export interface ParseResult {
  success: boolean;
  expression?: EvalFunction;
  variables: string[];
  error?: string;
}

export class MathParser {
  /**
   * 解析数学表达式
   */
  parse(expr: string): ParseResult {
    try {
      const node = parse(expr);
      const code = compile(expr);
      const variables = this.extractVariables(node);
      return {
        success: true,
        expression: code,
        variables
      };
    } catch (e) {
      return {
        success: false,
        variables: [],
        error: (e as Error).message
      };
    }
  }

  /**
   * 求值
   */
  evaluate(compiled: EvalFunction, scope: Record<string, number>): number {
    return compiled.evaluate(scope);
  }

  /**
   * 生成函数曲线数据点
   */
  generatePoints(
    compiled: EvalFunction,
    xRange: [number, number],
    resolution: number = 500
  ): { x: number; y: number }[] {
    const [xMin, xMax] = xRange;
    const step = (xMax - xMin) / resolution;
    const points: { x: number; y: number }[] = [];

    for (let x = xMin; x <= xMax; x += step) {
      try {
        const y = compiled.evaluate({ x });
        if (Number.isFinite(y)) {
          points.push({ x, y });
        }
      } catch {
        // 跳过无效点
      }
    }

    return points;
  }
}
```

```typescript
// src/core/math/specialPoints.ts
export interface SpecialPoint {
  type: 'maximum' | 'minimum' | 'inflection' | 'zero';
  x: number;
  y: number;
}

export class SpecialPointsFinder {
  /**
   * 查找特殊点
   */
  findAll(
    f: (x: number) => number,
    xRange: [number, number],
    resolution: number = 1000
  ): SpecialPoint[] {
    const points: SpecialPoint[] = [];

    // 数值方法查找零点、极值点、拐点
    // 使用导数符号变化和二阶导数判断

    return points;
  }
}
```

### 5.2 可视化引擎 (Visualization Engine)

**职责**: 管理ECharts/D3实例、渲染坐标系和曲线、执行动画

```typescript
// src/core/visualization/bindbindBindbindbindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindcoordSystem.ts
import * as bindBindBindBindBindBindBindBindBindBindBindBindechBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindarts from 'echarts';

export interface bindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindCoordConfig {
  bindBindBindBindBindBindBindBindBindBindBindBindBindBindxRange: bindBindBindBindBindBindBindBind[number, number];
  yRangebindBindBindBindBindBindBindBindBindBindBindBindBindBind?: bindBindBindBindBindBind[number, number];
  showGridbindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBind?: boolean;
  bindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindshowAxisLabel?: boolean;
}

export class bindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindCoordinateSystem {
  private bindBindBindBindBindBindBindBindBindBindBindBindBindchart: bindBindBindBindBindBindBindBindecharts.bindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindECharts;

  constructor(bindBindBindBindcontainer: HTMLElement) {
    this bindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBind.bindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindchbindBindart = bindBindechartbindBindBindBindBindBindBindBindBindBindBindBindBinds.init(container);
  }

  bindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindbindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindinitbindBindBindBindBindBindBind(configbindBindBindBindBindBindBindBindBind: CoordConfig bindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBind): void {bindBindBindBindBindBindBindBindBindBindBindBindBind
    bindBindBindBindBindBindBindBindBindBindbindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBind bindBindBindBindBindthis.bindBindBindBindBindBindBindBindBindBindBindchart.setOption({
      bindBindBindBindBindBindBindBindBindBindBindBindxAxisBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBind: {bindBindBindBindBindBindBindBindBindBindBind
        bindBindBindBindBindBindBindBindBindBindBindBindBindtype: 'value',
        bindBindBindBindBindBindBindBindBindBindBindBindBindmin: config.xRangebindBindBindBindBindBindBindBindBindBind[bindBindBindBindBindBindBindBindBindBindBindBind0],
        max:bind configbindBindBindBind.xRange[1],
        bindBindBindBindBindBindBindsplitLine: { showbindBindBindBindBind: config.showGrid ?? true }
      },
      yAxis: {
        type: 'value',
        min: config.yRange?.[0],
        max: config.yRange?.[1]
      },
      bindBindBindBindBindBindBindBindBindgrid: {
        bindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindleftbindBindBindBindBindBindBindBindBindBind: bindBindBindBindBindBindBindBindBindBind60,
        right: 40,bindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBind
        bindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindBindtopbindBindBindBindBindBindBindBindBind: 40,
        bottom: 60
      }
    });
  bindBindBindBindBindBindBindBindBindBindBindBind}

  bindBindBindBindBindBindBindBindBindBindBindBindBindupbindBindBindBindBind bindBindBindBindBindBinddateSeriesbindBindBind(bindBindBindBindBindBindBindBindBindBindBindBind bindbindBindBindBindBindBindBindBindBinddata: bindBindBindBindBindBindBindBindBindBindBindBind{ x: number; y: number }[]): void {
    this.chart.setOption({
      series: bindBindbindBindBindBindBindBindBindBindBindBind[{
        type: 'line',
        databind: databindBindBindBindBind.bindBindBindBindBindBindBindBindBindBindBindBindBindBindmap(p => bindBindBindBindBindBindBindBindBindBindBind[p.x, p.y]),
        smobindBindBindBindBindBindBindBindoth:bindBindBindBindBindBindBindBindBindBindBindBindBind true,
        bindBindBindBindBindBindBindBindBindBindBindBindBindBindsymbolbindBindBindBindBindBindBindBindBindBindBindBindBind: bindBindBindBindBindBindBindBindBindbindBindBindBindBindBindbindBindBindBindBindBindBind'none'
      }]
    });
  }
}
```

```typescript
// src/core/visualization/animationEngine.ts
export interface AnimationConfig {
  duration: number;       // 动画时长(ms)
  fps: number;            // 帧率
  easing: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
}

export class AnimationEngine {
  private animationId: number | null = null;
  private isPaused: boolean = false;
  private currentFrame: number = 0;
  private totalFrames: number = 0;

  constructor(private config: AnimationConfig) {
    this.totalFrames = (config.duration / 1000) * config.fps;
  }

  /**
   * 开始动画
   */
  start(onFrame: (progress: number) => void, onComplete?: () => void): void {
    const frameInterval = 1000 / this.config.fps;
    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      if (this.isPaused) {
        this.animationId = requestAnimationFrame(animate);
        return;
      }

      if (currentTime - lastTime >= frameInterval) {
        this.currentFrame++;
        const progress = this.currentFrame / this.totalFrames;

        onFrame(this.applyEasing(progress));

        if (this.currentFrame >= this.totalFrames) {
          onComplete?.();
          return;
        }

        lastTime = currentTime;
      }

      this.animationId = requestAnimationFrame(animate);
    };

    this.animationId = requestAnimationFrame(animate);
  }

  pause(): void {
    this.isPaused = true;
  }

  resume(): void {
    this.isPaused = false;
  }

  stop(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.currentFrame = 0;
  }

  setSpeed(multiplier: number): void {
    this.config.duration = this.config.duration / multiplier;
    this.totalFrames = (this.config.duration / 1000) * this.config.fps;
  }

  private applyEasing(t: number): number {
    switch (this.config.easing) {
      case 'easeIn': return t * t;
      case 'easeOut': return t * (2 - t);
      case 'easeInOut': return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      default: return t;
    }
  }
}
```

### 5.3 AI服务 (AI Service)

**职责**: 封装多个AI服务商API调用、管理对话上下文、生成比喻和回答问题

**支持的AI服务商**:
| 服务商 | 模型 | 特点 |
|--------|------|------|
| 通义千问 | qwen-turbo, qwen-plus | 国内稳定，响应快 |
| DeepSeek | deepseek-chat, deepseek-reasoner | 深度推理，适合数学 |
| OpenAI | gpt-4o-mini, gpt-4o | 能力强，需科学上网 |
| 智谱AI | glm-4-flash, glm-4 | 免费额度充足 |
| 月之暗面 | moonshot-v1-8k/32k/128k | 长上下文支持 |
| 硅基流动 | Qwen2.5, DeepSeek, GLM等 | 多种开源模型 |

```typescript
// src/services/aiService.ts
import axios from 'axios';

export type AIProvider = 'qwen' | 'deepseek' | 'openai' | 'zhipu' | 'moonshot' | 'siliconflow';

export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  baseUrl: string;
  model: string;
}

// 各服务商配置
export const providerConfigs: Record<AIProvider, {
  baseUrl: string;
  models: { value: string; label: string }[];
  defaultModel: string;
}> = {
  qwen: {
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    models: [
      { value: 'qwen-turbo', label: 'Qwen Turbo (快速)' },
      { value: 'qwen-plus', label: 'Qwen Plus (增强)' }
    ],
    defaultModel: 'qwen-turbo'
  },
  deepseek: {
    baseUrl: 'https://api.deepseek.com/v1',
    models: [
      { value: 'deepseek-chat', label: 'DeepSeek Chat' },
      { value: 'deepseek-reasoner', label: 'DeepSeek Reasoner (推理)' }
    ],
    defaultModel: 'deepseek-chat'
  },
  // ... 其他服务商配置
};

export interface MetaphorRequest {
  knowledgePointTitle: string;
  knowledgePointDescription: string;
  keyPoints: string[];
  existingMetaphors: string[];
}

export async function createMetaphor(request: MetaphorRequest): Promise<{
  title: string;
  content: string;
  tags: string[];
}> {
  // 调用配置的AI服务生成比喻
}

export interface ChatRequest {
  message: string;
  knowledgePoint?: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export class AIService {
  private config: AIConfig;

  constructor(config: AIConfig) {
    this.config = config;
  }

  /**
   * 生成知识点比喻
   */
  async generateMetaphor(request: MetaphorRequest): Promise<string> {
    const prompt = `请用一个生活化的比喻来解释"${request.knowledgePoint}"这个数学概念。
要求:
1. 比喻要通俗易懂，使用日常生活场景
2. 比喻要准确反映概念的核心特征
3. 长度控制在2-3句话
${request.context ? `\n补充背景: ${request.context}` : ''}`;

    return this.chat([{ role: 'user', content: prompt }]);
  }

  /**
   * 智能问答
   */
  async askQuestion(request: ChatRequest): Promise<string> {
    const systemPrompt = `你是一个高等数学辅导老师，擅长用通俗易懂的方式解释数学概念。
${request.knowledgePoint ? `当前用户正在学习: ${request.knowledgePoint}` : ''}
请给出准确、易懂的解答。如果涉及公式，请用LaTeX格式（用$包裹）。`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...(request.history || []),
      { role: 'user' as const, content: request.message }
    ];

    return this.chat(messages);
  }

  private async chat(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
  ): Promise<string> {
    try {
      const response = await axios.post(
        `${this.config.baseUrl}/chat/completions`,
        {
          model: this.config.model,
          messages,
          temperature: 0.7,
          max_tokens: 1000
        },
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('AI Service Error:', error);
      throw new Error('AI服务调用失败，请检查网络连接');
    }
  }
}
```

---

## 6. 状态管理设计

### 6.1 Store结构

```typescript
// src/stores/graphStore.ts
import { defineStore } from 'pinia';

export interface FunctionItem {
  id: string;
  expression: string;
  color: string;
  visible: boolean;
  parameters: Array<{
    name: string;
    value: number;
    min: number;
    max: number;
    step: number;
  }>;
}

export const useGraphStore = defineStore('graph', {
  state: () => ({
    functions: [] as FunctionItem[],
    xRange: [-10, 10] as [number, number],
    yRange: [-10, 10] as [number, number],
    showGrid: true,
    showSpecialPoints: true,
    activeFunction: null as string | null
  }),

  getters: {
    visibleFunctions: (state) => state.functions.filter(f => f.visible),
    getFunctionById: (state) => (id: string) =>
      state.functions.find(f => f.id === id)
  },

  actions: {
    addFunction(expression: string) {
      const id = `func_${Date.now()}`;
      const colors = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399'];
      this.functions.push({
        id,
        expression,
        color: colors[this.functions.length % colors.length],
        visible: true,
        parameters: []
      });
      return id;
    },

    updateFunction(id: string, updates: Partial<FunctionItem>) {
      const index = this.functions.findIndex(f => f.id === id);
      if (index !== -1) {
        this.functions[index] = { ...this.functions[index], ...updates };
      }
    },

    removeFunction(id: string) {
      this.functions = this.functions.filter(f => f.id !== id);
    },

    updateParameter(funcId: string, paramName: string, value: number) {
      const func = this.functions.find(f => f.id === funcId);
      if (func) {
        const param = func.parameters.find(p => p.name === paramName);
        if (param) {
          param.value = value;
        }
      }
    }
  }
});
```

```typescript
// src/stores/knowledgeStore.ts
import { defineStore } from 'pinia';
import type { Chapter, KnowledgePoint } from '@/types/knowledge';
import chaptersData from '@/data/knowledgeBase/chapters.json';
import knowledgePointsData from '@/data/knowledgeBase/knowledgePoints.json';

export const useKnowledgeStore = defineStore('knowledge', {
  state: () => ({
    chapters: chaptersData as Chapter[],
    knowledgePoints: knowledgePointsData as KnowledgePoint[],
    currentChapter: null as string | null,
    currentKnowledgePoint: null as string | null,
    expandedChapters: [] as string[]
  }),

  getters: {
    currentKP: (state) =>
      state.knowledgePoints.find(kp => kp.id === state.currentKnowledgePoint),

    getKPsByChapter: (state) => (chapterId: string) =>
      state.knowledgePoints.filter(kp => kp.chapterId === chapterId),

    getPrerequisites: (state) => (kpId: string) => {
      const kp = state.knowledgePoints.find(k => k.id === kpId);
      if (!kp) return [];
      return kp.prerequisites.map(id =>
        state.knowledgePoints.find(k => k.id === id)
      ).filter(Boolean);
    }
  },

  actions: {
    setCurrentKnowledgePoint(id: string) {
      this.currentKnowledgePoint = id;
      const kp = this.knowledgePoints.find(k => k.id === id);
      if (kp) {
        this.currentChapter = kp.chapterId;
      }
    },

    toggleChapter(chapterId: string) {
      const index = this.expandedChapters.indexOf(chapterId);
      if (index === -1) {
        this.expandedChapters.push(chapterId);
      } else {
        this.expandedChapters.splice(index, 1);
      }
    }
  }
});
```

```typescript
// src/stores/settingsStore.ts
import { defineStore } from 'pinia';

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    theme: 'light' as 'light' | 'dark',
    animationSpeed: 1,
    defaultXRange: [-10, 10] as [number, number],
    aiApiKey: '',
    language: 'zh-CN'
  }),

  actions: {
    setTheme(theme: 'light' | 'dark') {
      this.theme = theme;
      document.documentElement.setAttribute('data-theme', theme);
    },

    setAIApiKey(key: string) {
      this.aiApiKey = key;
    },

    loadFromStorage() {
      const saved = localStorage.getItem('mathhelper_settings');
      if (saved) {
        const settings = JSON.parse(saved);
        Object.assign(this, settings);
      }
    },

    saveToStorage() {
      localStorage.setItem('mathhelper_settings', JSON.stringify(this.$state));
    }
  }
});
```

---

## 7. 组件架构

### 7.1 组件层次图

```
App.vue
└── MainLayout.vue
    ├── AppHeader.vue
    │   └── 导航标签、窗口控制按钮
    ├── AppSidebar.vue
    │   └── ChapterTree.vue
    └── RouterView
        ├── GraphView.vue (绘图页)
        │   ├── FunctionInput.vue
        │   ├── ParameterSlider.vue (多个)
        │   ├── CoordinateSystem.vue
        │   │   ├── FunctionCurve.vue (多个)
        │   │   └── SpecialPoints.vue
        │   └── FunctionLegend.vue
        │
        ├── LearnView.vue (学习页)
        │   ├── KnowledgeContent.vue
        │   │   ├── 动态加载可视化组件
        │   │   │   ├── LimitAnimation.vue
        │   │   │   ├── DerivativeAnimation.vue
        │   │   │   └── ...
        │   │   └── AnimationControls.vue
        │   ├── MetaphorDisplay.vue
        │   └── ChatPanel.vue
        │
        ├── FormulaView.vue (公式页)
        │   ├── FormulaSearch.vue
        │   ├── FormulaFilter.vue
        │   └── FormulaCard.vue (多个)
        │
        └── SettingsView.vue (设置页)
            └── 各种设置表单
```

### 7.2 核心组件接口

```typescript
// FunctionInput.vue Props & Events
interface FunctionInputProps {
  modelValue: string;
  placeholder?: string;
  error?: string;
}
interface FunctionInputEmits {
  (e: 'update:modelValue', value: string): void;
  (e: 'submit'): void;
}

// ParameterSlider.vue Props & Events
interface ParameterSliderProps {
  name: string;
  value: number;
  min: number;
  max: number;
  step?: number;
}
interface ParameterSliderEmits {
  (e: 'update:value', value: number): void;
}

// AnimationControls.vue Props & Events
interface AnimationControlsProps {
  isPlaying: boolean;
  progress: number;  // 0-1
  speed: number;     // 0.5, 1, 2
}
interface AnimationControlsEmits {
  (e: 'play'): void;
  (e: 'pause'): void;
  (e: 'reset'): void;
  (e: 'step', direction: 'forward' | 'backward'): void;
  (e: 'speedChange', speed: number): void;
}
```

---

## 8. 数据流设计

### 8.1 函数绘图数据流

```
用户输入表达式
       ↓
FunctionInput.vue (emit: update:modelValue)
       ↓
GraphView.vue (调用 useMathParser)
       ↓
MathParser.parse() → ParseResult
       ↓
   ┌───┴───┐
   ↓       ↓
成功     失败
   ↓       ↓
graphStore.addFunction()  显示错误提示
   ↓
CoordinateSystem.vue (watch functions)
       ↓
MathParser.generatePoints()
       ↓
ECharts.bindbindBindBindBindBindBindBindBindBindBindBindBindBindsetOption()
       ↓
曲线渲染
```

### 8.2 知识点可视化数据流

```
用户选择知识点
       ↓
ChapterTree.vue (emit: select)
       ↓
LearnView.vue
       ↓
knowledgeStore.setCurrentKnowledgePoint()
       ↓
动态加载对应可视化组件
       ↓
组件初始化动画引擎
       ↓
AnimationControls.vue ←→ AnimationEngine
       ↓
动画帧更新 → 可视化渲染
```

### 8.3 AI服务数据流

```
用户请求比喻/提问
       ↓
MetaphorGenerator.vue / ChatPanel.vue
       ↓
useAI composable
       ↓
检查是否有预设比喻
   ┌───┴───┐
   ↓       ↓
 有预设   无预设
   ↓       ↓
直接返回  AIService.generateMetaphor()
             ↓
          通义千问API
             ↓
          返回结果
             ↓
          渲染展示
```

---

## 9. Electron集成

### 9.1 主进程设计

```typescript
// electron/main.ts
import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    frame: false,  // 自定义标题栏
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC处理
ipcMain.handle('window:minimize', () => {
  mainWindow?.minimize();
});

ipcMain.handle('window:maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});

ipcMain.handle('window:close', () => {
  mainWindow?.close();
});
```

### 9.2 预加载脚本

```typescript
// electron/preload.ts
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close')
  },
  platform: process.platform
});
```

### 9.3 渲染进程类型声明

```typescript
// src/types/electron.d.ts
export interface ElectronAPI {
  window: {
    minimize: () => Promise<void>;
    maximize: () => Promise<void>;
    close: () => Promise<void>;
  };
  platform: NodeJS.Platform;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
```

---

## 10. 构建与部署

### 10.1 开发环境配置

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/assets/styles/variables.scss";`
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
});
```

### 10.2 Electron打包配置

```json
// electron-builder.json
{
  "appId": "com.mathhelper.app",
  "productName": "Math Helper",
  "directories": {
    "output": "release"
  },
  "files": [
    "dist/**/*",
    "electron/**/*"
  ],
  "win": {
    "target": ["nsis"],
    "icon": "public/icon.ico"
  },
  "mac": {
    "target": ["dmg"],
    "icon": "public/icon.icns"
  },
  "nsis": {
    "oneClick": false,
    "allowToChangeInstallationDirectory": true,
    "createDesktopShortcut": true
  }
}
```

### 10.3 NPM脚本

```json
// package.json (部分)
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "electron:dev": "concurrently \"vite\" \"electron .\"",
    "electron:build": "vite build && electron-builder",
    "test": "vitest",
    "lint": "eslint src --ext .vue,.ts,.tsx",
    "format": "prettier --write src"
  }
}
```

---

## 11. 性能优化策略

### 11.1 渲染性能

| 策略 | 实施方法 |
|------|----------|
| 虚拟化长列表 | 使用 vue-virtual-scroller |
| 图表懒加载 | ECharts 按需加载组件 |
| 动画帧控制 | requestAnimationFrame + 节流 |
| Canvas渲染 | 复杂可视化使用Canvas而非SVG |

### 11.2 包体积优化

| 策略 | 实施方法 |
|------|----------|
| Tree Shaking | 使用ESM导入 |
| 代码分割 | 路由级懒加载 |
| 依赖精简 | 按需引入Element Plus组件 |
| 资源压缩 | 生产环境启用压缩 |

### 11.3 内存管理

| 策略 | 实施方法 |
|------|----------|
| 组件销毁清理 | onUnmounted中清理定时器、事件监听 |
| 大数据分页 | 数据点超过阈值时采样显示 |
| 图表实例复用 | 避免重复创建ECharts实例 |

---

## 12. 错误处理策略

### 12.1 全局错误处理

```typescript
// src/main.ts
import { createApp } from 'vue';
import App from './App.vue';

const app = createApp(App);

app.config.errorHandler = (err, vm, info) => {
  console.error('Global Error:', err);
  console.error('Component:', vm);
  console.error('Info:', info);
  // 可以上报错误到监控服务
};

app.mount('#app');
```

### 12.2 API错误处理

```typescript
// src/utils/errorHandler.ts
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public recoverable: boolean = true
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function handleError(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return '发生未知错误';
}
```

---

## 13. 安全考虑

| 风险 | 对策 |
|------|------|
| API Key泄露 | 用户自行配置，存储在本地，不上传 |
| XSS攻击 | 使用Vue自动转义，KaTeX安全渲染 |
| 代码注入 | Math.js表达式沙箱执行 |
| 恶意公式 | 限制表达式长度和复杂度 |

---

## 14. 附录

### A. 依赖版本锁定

```json
{
  "dependencies": {
    "vue": "^3.4.0",
    "pinia": "^2.1.0",
    "vue-router": "^4.2.0",
    "element-plus": "^2.4.0",
    "echarts": "^5.4.0",
    "d3": "^7.8.0",
    "mathjs": "^12.2.0",
    "katex": "^0.16.0",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "electron": "^28.0.0",
    "vite": "^5.0.0",
    "typescript": "^5.3.0",
    "electron-builder": "^24.0.0"
  }
}
```

### B. 术语表

| 术语 | 定义 |
|------|------|
| Composable | Vue 3 组合式函数，封装可复用逻辑 |
| Store | Pinia 状态容器 |
| IPC | Inter-Process Communication，进程间通信 |

---

**文档版本**: v1.1
**创建日期**: 2025-12-03
**更新日期**: 2025-12-18
**状态**: 已实施
