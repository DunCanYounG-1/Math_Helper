# Math Helper - Epics & Stories

> 基于 PRD v1.0 和头脑风暴会议成果生成
> 生成日期: 2025-12-12

---

## Epic 概览

| Epic ID | 名称 | Stories | 优先级 | 状态 |
|---------|------|---------|--------|------|
| E1 | 核心绘图引擎 | 4 | P0 | TODO |
| E2 | 知识点可视化动画 | 5 | P0 | TODO |
| E3 | AI 辅助理解 | 4 | P1 | TODO |
| E4 | 知识体系导航 | 3 | P1 | TODO |
| E5 | 深度理解三件套 | 3 | P1 | TODO |
| E6 | 3D 可视化 | 1 | P2 | TODO |

---

## E1: 核心绘图引擎

**Epic 目标**: 实现函数表达式输入、解析、绘制的核心能力，支持参数化调节和多函数对比

**用户价值**: 让学生能够直观看到数学函数的图像，通过参数调节理解函数变化规律

**技术依赖**: Math.js (解析), ECharts/D3.js (绑图)

### Story E1-S1: 公式输入与基础绘图

**来源**: FR-A1

**描述**: 作为学生，我想输入数学公式并看到对应的函数曲线，以便直观理解函数形状

**验收标准**:

```gherkin
Feature: 函数表达式绘图
  Scenario: 输入合法表达式绘制曲线
    Given 用户在函数输入框中
    When 输入表达式 "x^2 + sin(x)"
    Then 100ms 内在坐标系中显示对应曲线
    And 曲线平滑无锯齿

  Scenario: 语法错误提示
    Given 用户在函数输入框中
    When 输入无效表达式 "x^2 +"
    Then 输入框下方显示红色错误提示
    And 提示信息明确指出错误位置

  Scenario: 支持常用数学函数
    Given 系统支持的函数列表
    When 用户输入包含 sin, cos, tan, log, ln, exp, sqrt, abs 的表达式
    Then 均能正确解析并绘制

  Scenario: 处理无效点
    Given 表达式 "1/x"
    When x=0 时
    Then 该点不绘制，曲线在 x=0 处断开
```

**技术任务**:
- [ ] 实现 MathParser 类，封装 Math.js
- [ ] 实现 generatePoints() 生成曲线数据点
- [ ] 实现 FunctionInput.vue 组件
- [ ] 实现 CoordinateSystem.vue 坐标系组件
- [ ] 实现 FunctionCurve.vue 曲线渲染组件
- [ ] 添加错误处理和用户提示

**估算**: 3 个技术任务

---

### Story E1-S2: 参数动态调节

**来源**: FR-A2

**描述**: 作为学生，我想通过滑动条调整函数参数，以便观察参数变化对函数的影响

**验收标准**:

```gherkin
Feature: 参数滑动条
  Scenario: 自动识别参数
    Given 用户输入表达式 "a*x^2 + b*x + c"
    When 表达式解析完成
    Then 自动生成 a, b, c 三个滑动条
    And 每个滑动条显示参数名和当前值

  Scenario: 实时更新曲线
    Given 已绘制表达式 "a*sin(x)" 且 a=1
    When 用户拖动滑动条将 a 改为 2
    Then 曲线立即更新，振幅变为原来的 2 倍
    And 更新过程无延迟感 (< 16ms)

  Scenario: 自定义参数范围
    Given 参数 a 的滑动条
    When 用户设置范围为 [-10, 10]，步长为 0.5
    Then 滑动条按新范围和步长工作

  Scenario: 多参数支持
    Given 表达式包含 5 个参数
    When 同时调节多个参数
    Then 曲线正确响应所有参数变化
```

**技术任务**:
- [ ] 实现 extractVariables() 提取表达式参数
- [ ] 实现 ParameterSlider.vue 滑动条组件
- [ ] 实现参数范围和步长配置 UI
- [ ] 优化实时更新性能 (debounce/throttle)

**估算**: 2 个技术任务

---

### Story E1-S3: 多函数叠加显示

**来源**: FR-A3

**描述**: 作为学生，我想在同一坐标系中显示多个函数，以便对比它们的差异

**验收标准**:

```gherkin
Feature: 多函数对比
  Scenario: 添加多条曲线
    Given 已有一条曲线 y=x^2
    When 点击 "添加函数" 并输入 y=x^3
    Then 两条曲线同时显示在坐标系中
    And 每条曲线颜色不同

  Scenario: 图例交互
    Given 坐标系中有 3 条曲线
    When 点击图例中某曲线的标签
    Then 该曲线隐藏/显示状态切换

  Scenario: 删除曲线
    Given 坐标系中有多条曲线
    When 点击某曲线的删除按钮
    Then 该曲线从坐标系中移除

  Scenario: 颜色自定义
    Given 一条默认颜色的曲线
    When 点击颜色选择器并选择新颜色
    Then 曲线颜色更新为所选颜色
```

**技术任务**:
- [ ] 实现 graphStore 管理多函数状态
- [ ] 实现函数列表 UI (添加/删除/颜色)
- [ ] 实现 FunctionLegend.vue 图例组件
- [ ] 支持至少 10 条曲线同时显示

**估算**: 2 个技术任务

---

### Story E1-S4: 特殊点标注

**来源**: FR-A4

**描述**: 作为学生，我想看到函数的特殊点标注，以便快速识别极值、拐点等

**验收标准**:

```gherkin
Feature: 特殊点识别与标注
  Scenario: 极值点标注
    Given 曲线 y = x^3 - 3x
    When 特殊点分析完成
    Then 在 x=1 处标注红色极小值点
    And 在 x=-1 处标注蓝色极大值点

  Scenario: 零点标注
    Given 曲线 y = x^2 - 1
    When 特殊点分析完成
    Then 在 x=1 和 x=-1 处标注黄色零点

  Scenario: 悬停显示坐标
    Given 曲线上有标注的特殊点
    When 鼠标悬停在标注点上
    Then 显示精确坐标 (保留 4 位小数)

  Scenario: 拐点标注
    Given 曲线 y = x^3
    When 特殊点分析完成
    Then 在 x=0 处标注绿色拐点
```

**技术任务**:
- [ ] 实现 SpecialPointsFinder 类
- [ ] 实现数值方法查找零点 (二分法)
- [ ] 实现数值方法查找极值点 (导数符号变化)
- [ ] 实现 SpecialPoints.vue 标注渲染组件

**估算**: 3 个技术任务

---

## E2: 知识点可视化动画

**Epic 目标**: 为核心数学概念提供交互式动画演示，帮助学生理解抽象概念

**用户价值**: 通过动态可视化将抽象概念具象化，建立数学直觉

**技术依赖**: D3.js (动画), AnimationEngine (控制)

### Story E2-S1: 极限动画演示

**来源**: FR-B1

**描述**: 作为学生，我想看到极限过程的动画演示，以便理解"趋近"的含义

**验收标准**:

```gherkin
Feature: 极限动画
  Scenario: 函数极限演示
    Given 选择函数极限演示 lim(x→a) f(x)
    When 点击播放
    Then 动点从远处向 a 移动
    And 同步显示 f(x) 值趋近 L
    And 动画流畅 (>= 60fps)

  Scenario: 数列极限演示
    Given 选择数列极限演示 lim(n→∞) a_n
    When 点击播放
    Then 依次绘制 a_1, a_2, a_3, ...
    And 显示极限线 y=L
    And 标注每项与极限的距离

  Scenario: 动画控制
    Given 极限动画正在播放
    When 点击暂停/播放/重置按钮
    Then 动画状态相应改变

  Scenario: 速度调节
    Given 极限动画
    When 选择 0.5x/1x/2x 速度
    Then 动画按对应速度播放
```

**技术任务**:
- [ ] 实现 AnimationEngine 动画控制引擎
- [ ] 实现 LimitAnimation.vue 极限动画组件
- [ ] 实现 AnimationControls.vue 播放控制组件
- [ ] 实现函数极限和数列极限两种模式

**估算**: 3 个技术任务

---

### Story E2-S2: 导数几何意义演示

**来源**: FR-B2

**描述**: 作为学生，我想看到导数的几何意义动画，以便理解切线斜率

**验收标准**:

```gherkin
Feature: 导数动画
  Scenario: 切线随动点移动
    Given 显示曲线 y=f(x) 和动点 P
    When 动点 P 沿曲线移动
    Then 点 P 处的切线实时更新
    And 显示切线斜率值 k=f'(x)

  Scenario: 手动拖动
    Given 曲线上的动点 P
    When 用户拖动点 P
    Then 点 P 沿曲线移动
    And 切线和斜率实时更新

  Scenario: 斜率数值准确
    Given 曲线 y=x^2，点 P 在 x=2
    When 查看斜率显示
    Then 斜率值为 4 (f'(2)=2*2=4)
```

**技术任务**:
- [ ] 实现 DerivativeAnimation.vue 导数动画组件
- [ ] 实现切线计算和渲染
- [ ] 实现点拖动交互
- [ ] 实现斜率数值显示

**估算**: 2 个技术任务

---

### Story E2-S3: 定积分面积演示

**来源**: FR-B3

**描述**: 作为学生，我想看到定积分的面积填充动画，以便理解积分的几何意义

**验收标准**:

```gherkin
Feature: 定积分动画
  Scenario: 连续填充模式
    Given 曲线 y=f(x) 和积分区间 [a, b]
    When 播放填充动画
    Then 从 a 到 b 逐渐填充曲线下方区域
    And 实时显示累计面积值

  Scenario: 黎曼和模式
    Given 曲线和积分区间
    When 选择黎曼和模式并调整 n
    Then 显示 n 个矩形逼近
    And 显示矩形面积总和

  Scenario: 正负面积区分
    Given 曲线 y=sin(x)，区间 [0, 2π]
    When 积分演示
    Then 曲线上方区域填充正色
    And 曲线下方区域填充负色

  Scenario: 调整积分区间
    Given 积分动画
    When 拖动区间端点 a 或 b
    Then 填充区域和面积值实时更新
```

**技术任务**:
- [ ] 实现 IntegralAnimation.vue 积分动画组件
- [ ] 实现连续填充动画效果
- [ ] 实现黎曼和矩形逼近可视化
- [ ] 实现数值积分计算

**估算**: 3 个技术任务

---

### Story E2-S4: 级数收敛动画

**来源**: FR-B4

**描述**: 作为学生，我想看到级数部分和的累加动画，以便理解收敛过程

**验收标准**:

```gherkin
Feature: 级数动画
  Scenario: 部分和累加
    Given 级数 Σ(1/n^2)
    When 播放动画
    Then 逐项显示 S_1, S_2, S_3, ...
    And 标注收敛值 π²/6

  Scenario: 误差显示
    Given 部分和 S_n 和收敛值 L
    When 动画进行中
    Then 显示 |S_n - L| 误差变化
```

**技术任务**:
- [ ] 实现 SeriesAnimation.vue 级数动画组件
- [ ] 实现部分和计算逻辑
- [ ] 实现收敛值标注和误差显示

**估算**: 2 个技术任务

---

### Story E2-S5: 泰勒展开动画

**来源**: FR-B5

**描述**: 作为学生，我想对比不同阶数泰勒展开的逼近效果，以便理解多项式逼近

**验收标准**:

```gherkin
Feature: 泰勒展开动画
  Scenario: 阶数滑动条
    Given 函数 f(x) = e^x 的泰勒展开
    When 拖动阶数滑动条从 1 到 10
    Then 展开多项式曲线实时更新
    And 原函数曲线始终显示

  Scenario: 逼近误差
    Given 原函数和 n 阶泰勒展开
    When 显示误差区域
    Then 高亮原函数与展开式之间的差距
```

**技术任务**:
- [ ] 实现 TaylorAnimation.vue 泰勒动画组件
- [ ] 实现泰勒展开系数计算
- [ ] 实现阶数控制和误差可视化

**估算**: 2 个技术任务

---

## E3: AI 辅助理解

**Epic 目标**: 通过 AI 能力提供个性化学习辅助，包括比喻生成和智能问答

**用户价值**: 用熟悉的生活场景理解抽象概念，获得即时的学习支持

**技术依赖**: 通义千问 API, AIService

### Story E3-S1: 知识点比喻生成

**来源**: FR-C1

**描述**: 作为学生，我想获得知识点的生活化比喻，以便用熟悉事物理解抽象概念

**验收标准**:

```gherkin
Feature: 比喻生成
  Scenario: 显示预设比喻
    Given 知识点 "极限" 有预设比喻
    When 查看该知识点
    Then 显示 2-3 个预设比喻

  Scenario: AI 生成新比喻
    Given 用户点击 "换一个比喻"
    When 调用 AI 服务
    Then 5 秒内返回新的比喻
    And 比喻通俗易懂

  Scenario: 离线回退
    Given 无网络连接
    When 请求新比喻
    Then 显示 "网络不可用，请查看预设比喻"
```

**技术任务**:
- [ ] 创建预设比喻数据库 (metaphors.json)
- [ ] 实现 AIService.generateMetaphor()
- [ ] 实现 MetaphorDisplay.vue 比喻展示组件
- [ ] 实现离线回退逻辑

**估算**: 2 个技术任务

---

### Story E3-S2: 智能问答

**来源**: FR-C2

**描述**: 作为学生，我想针对知识点提问并获得AI解答，以便解决具体疑惑

**验收标准**:

```gherkin
Feature: 智能问答
  Scenario: 提问并获得解答
    Given 用户正在学习 "导数" 知识点
    When 输入问题 "为什么 e^x 的导数是它本身？"
    Then 5 秒内显示 AI 解答
    And 解答准确且包含 LaTeX 公式

  Scenario: 上下文关联
    Given 用户在 "积分" 页面提问
    When AI 生成回答
    Then 回答与积分知识点相关

  Scenario: 公式渲染
    Given AI 回答包含 LaTeX 公式
    When 显示回答
    Then 公式由 KaTeX 正确渲染
```

**技术任务**:
- [ ] 实现 AIService.askQuestion()
- [ ] 实现 ChatPanel.vue 问答面板组件
- [ ] 实现 Prompt 模板管理
- [ ] 集成 KaTeX 渲染 AI 回答中的公式

**估算**: 2 个技术任务

---

### Story E3-S3: 常见误区展示

**来源**: FR-C3

**描述**: 作为学生，我想了解常见的理解误区，以便避免错误认知

**验收标准**:

```gherkin
Feature: 误区展示
  Scenario: 显示知识点误区
    Given 知识点 "连续与可导"
    When 查看误区列表
    Then 显示 "连续不一定可导" 等常见误区
    And 每个误区有正确解释
```

**技术任务**:
- [ ] 创建误区数据库 (misconceptions.json)
- [ ] 实现误区展示 UI 组件

**估算**: 1 个技术任务

---

### Story E3-S4: 学习路径推荐

**来源**: FR-C4

**描述**: 作为学生，我想获得个性化学习路径推荐，以便高效复习

**验收标准**:

```gherkin
Feature: 学习路径
  Scenario: 显示知识点依赖
    Given 用户选择 "定积分"
    When 查看前置知识
    Then 显示 "极限" → "导数" → "不定积分" → "定积分" 路径

  Scenario: 推荐学习顺序
    Given 用户学习历史
    When 分析薄弱点
    Then 推荐优先学习的知识点
```

**技术任务**:
- [ ] 在 knowledgePoints.json 中添加 prerequisites 字段
- [ ] 实现学习路径可视化组件
- [ ] 实现简单的薄弱点分析逻辑

**估算**: 2 个技术任务

---

## E4: 知识体系导航

**Epic 目标**: 提供结构化的知识浏览和检索能力

**用户价值**: 快速定位目标知识点，建立整体知识结构认知

**技术依赖**: Vue Router, Pinia (knowledgeStore)

### Story E4-S1: 知识图谱

**来源**: FR-D1

**描述**: 作为学生，我想看到知识点之间的关联图谱，以便理解整体结构

**验收标准**:

```gherkin
Feature: 知识图谱
  Scenario: 图谱展示
    Given 打开知识图谱页面
    When 图谱加载完成
    Then 显示所有知识点节点
    And 连线表示依赖关系

  Scenario: 节点交互
    Given 图谱中的知识点节点
    When 点击节点
    Then 高亮关联节点
    And 可跳转到详情页

  Scenario: 缩放平移
    Given 知识图谱视图
    When 滚轮缩放或拖动
    Then 图谱视角相应变化
```

**技术任务**:
- [ ] 实现 KnowledgeGraph.vue 图谱组件 (D3.js force layout)
- [ ] 实现节点点击交互
- [ ] 实现缩放平移控制

**估算**: 2 个技术任务

---

### Story E4-S2: 章节大纲导航

**来源**: FR-D2

**描述**: 作为学生，我想通过章节大纲快速导航，以便找到目标内容

**验收标准**:

```gherkin
Feature: 章节导航
  Scenario: 树形结构展示
    Given 侧边栏章节树
    When 展开第一章
    Then 显示该章所有小节
    And 标识哪些有可视化内容

  Scenario: 点击跳转
    Given 章节树中某知识点
    When 点击该知识点
    Then 主内容区显示对应内容

  Scenario: 展开折叠
    Given 章节树
    When 点击章节标题
    Then 切换展开/折叠状态
```

**技术任务**:
- [ ] 创建 chapters.json 章节数据
- [ ] 实现 ChapterTree.vue 章节树组件
- [ ] 实现 knowledgeStore 状态管理
- [ ] 实现路由跳转逻辑

**估算**: 2 个技术任务

---

### Story E4-S3: 公式速查卡片

**来源**: FR-D4

**描述**: 作为学生，我想快速查阅公式卡片，以便复习和记忆

**验收标准**:

```gherkin
Feature: 公式卡片
  Scenario: 公式展示
    Given 公式速查页面
    When 页面加载
    Then 按分类显示公式卡片
    And 公式由 KaTeX 清晰渲染

  Scenario: 搜索公式
    Given 公式搜索框
    When 输入 "求导"
    Then 显示所有包含 "求导" 的公式

  Scenario: 展开详情
    Given 一张公式卡片
    When 点击卡片
    Then 展开显示适用场景和示例
```

**技术任务**:
- [ ] 创建 formulas.json 公式数据
- [ ] 实现 FormulaCard.vue 公式卡片组件
- [ ] 实现 FormulaView.vue 公式速查页面
- [ ] 实现公式搜索和分类筛选

**估算**: 2 个技术任务

---

## E5: 深度理解三件套

**Epic 目标**: 提供进阶的深度理解功能，帮助学生真正掌握数学概念

**用户价值**: 从"知道"到"理解"，建立扎实的数学基础

**技术依赖**: JSXGraph (N9), 现有技术栈 (N10, N11)

### Story E5-S1: 概念对比器

**来源**: FR-N11 (头脑风暴)

**描述**: 作为学生，我想对比易混淆的数学概念，以便准确区分它们

**验收标准**:

```gherkin
Feature: 概念对比器
  Scenario: 左右分栏对比
    Given 选择 "定积分 vs 不定积分"
    When 对比页面加载
    Then 左侧显示定积分定义、公式、特点
    And 右侧显示不定积分定义、公式、特点
    And 差异点高亮显示

  Scenario: 同步高亮
    Given 对比中的两个概念
    When 鼠标悬停左侧某定义
    Then 右侧对应定义同步高亮

  Scenario: 快速测验
    Given 概念对比完成
    When 点击 "测试区分"
    Then 出现简单判断题测试理解

  Scenario: 概念对列表
    Given 概念对比页面
    When 查看可用对比
    Then 显示 25 组易混淆概念
```

**技术任务**:
- [ ] 创建 conceptPairs.json 概念对比数据 (25 组)
- [ ] 实现 ConceptComparison.vue 对比组件
- [ ] 实现左右分栏对比布局
- [ ] 实现同步高亮和快速测验

**估算**: 2 个技术任务

---

### Story E5-S2: 反例生成器

**来源**: FR-N10 (头脑风暴)

**描述**: 作为学生，我想看到数学命题的反例，以便纠正错误认知

**验收标准**:

```gherkin
Feature: 反例生成器
  Scenario: 误区库模式
    Given 选择 "连续但不可导"
    When 查看反例
    Then 显示 f(x)=|x| 在 x=0 的图像
    And 解释为什么连续但不可导

  Scenario: 条件移除模式
    Given 罗尔定理页面
    When 关闭 "f(a)=f(b)" 条件
    Then 显示反例函数图像
    And 解释为什么定理不成立

  Scenario: 图像可视化
    Given 反例函数
    When 显示反例
    Then 用图像直观展示反例
    And 关键点有标注
```

**技术任务**:
- [ ] 创建 counterexamples.json 反例数据 (20 个误区)
- [ ] 实现 CounterexampleCard.vue 反例卡片组件
- [ ] 复用绑图模块渲染反例函数图像
- [ ] 实现条件移除交互模式

**估算**: 2 个技术任务

---

### Story E5-S3: 证明过程动画

**来源**: FR-N9 (头脑风暴)

**描述**: 作为学生，我想看到定理证明的动画演示，以便理解定理为什么成立

**验收标准**:

```gherkin
Feature: 证明动画
  Scenario: 夹逼定理证明
    Given 选择夹逼定理证明
    When 播放动画
    Then 显示 g(x) ≤ f(x) ≤ h(x) 三条曲线
    And 动态演示当 g,h → L 时 f → L
    And 步骤控制: 上一步/下一步/自动播放

  Scenario: 参数交互
    Given 证明动画
    When 拖动滑块改变参数
    Then 图像实时更新
    And 证明条件动态变化

  Scenario: 条件破坏演示
    Given 中值定理证明
    When 关闭某必要条件
    Then 演示定理如何失效
```

**技术任务**:
- [ ] 引入 JSXGraph 库并封装 Vue 组件
- [ ] 实现 ProofAnimator.vue 证明动画组件
- [ ] 实现步骤状态机和播放控制
- [ ] 制作 5 个核心定理证明 (夹逼、罗尔、拉格朗日、微积分基本定理、牛顿-莱布尼茨)

**估算**: 4 个技术任务 (含内容制作)

---

## E6: 3D 可视化

**Epic 目标**: 支持二元函数的三维曲面绘制

**用户价值**: 理解多元函数的空间形态

**技术依赖**: ECharts GL / Three.js

### Story E6-S1: 3D 曲面绘制

**来源**: FR-A5

**描述**: 作为学生，我想绘制三维曲面图，以便理解二元函数

**验收标准**:

```gherkin
Feature: 3D曲面
  Scenario: 曲面渲染
    Given 输入 z = x^2 + y^2
    When 点击绘制
    Then 显示抛物面 3D 曲面

  Scenario: 视角控制
    Given 3D 曲面
    When 鼠标拖动或滚轮
    Then 视角旋转或缩放

  Scenario: 颜色映射
    Given 3D 曲面
    When 渲染曲面
    Then 颜色根据 z 值映射 (高处红，低处蓝)
```

**技术任务**:
- [ ] 实现 Surface3D.vue 3D 曲面组件
- [ ] 集成 ECharts GL 或 Three.js
- [ ] 实现视角控制和颜色映射

**估算**: 2 个技术任务

---

## 附录: Story 优先级矩阵

| 优先级 | Stories |
|--------|---------|
| P0 (MVP) | E1-S1, E1-S2, E1-S3, E2-S1, E2-S2, E2-S3, E4-S2 |
| P1 | E1-S4, E3-S1, E4-S1, E4-S3, E5-S1, E5-S2 |
| P2 | E2-S4, E2-S5, E3-S2, E3-S3, E3-S4, E5-S3, E6-S1 |

---

## 附录: 技术任务统计

| Epic | Stories | 技术任务数 |
|------|---------|-----------|
| E1 | 4 | 10 |
| E2 | 5 | 12 |
| E3 | 4 | 7 |
| E4 | 3 | 6 |
| E5 | 3 | 8 |
| E6 | 1 | 2 |
| **合计** | **20** | **45** |

---

**文档版本**: v1.0
**生成日期**: 2025-12-12
**状态**: 待 Sprint 规划
