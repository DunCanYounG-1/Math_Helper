<template>
  <div class="proof-animator">
    <div class="animator-header">
      <div class="header-title">
        <el-icon><Reading /></el-icon>
        <span>定理证明动画</span>
      </div>
      <el-select
        v-model="selectedProofId"
        placeholder="选择定理"
        size="small"
        class="proof-select"
      >
        <el-option
          v-for="proof in proofs"
          :key="proof.id"
          :value="proof.id"
          :label="proof.title"
        />
      </el-select>
    </div>

    <div v-if="currentProof" class="animator-content">
      <!-- 定理陈述 -->
      <div class="theorem-statement">
        <div class="statement-label">定理</div>
        <div class="statement-content" v-html="renderContent(currentProof.statement)"></div>
      </div>

      <!-- 证明步骤 -->
      <div class="proof-steps">
        <div class="steps-header">
          <span class="steps-title">证明过程</span>
          <div class="steps-controls">
            <el-button
              size="small"
              :icon="DArrowLeft"
              :disabled="currentStep === 0"
              @click="goToStep(0)"
            />
            <el-button
              size="small"
              :icon="ArrowLeft"
              :disabled="currentStep === 0"
              @click="prevStep"
            />
            <span class="step-indicator">{{ currentStep + 1 }} / {{ currentProof.steps.length }}</span>
            <el-button
              size="small"
              :icon="ArrowRight"
              :disabled="currentStep === currentProof.steps.length - 1"
              @click="nextStep"
            />
            <el-button
              size="small"
              :icon="DArrowRight"
              :disabled="currentStep === currentProof.steps.length - 1"
              @click="goToStep(currentProof.steps.length - 1)"
            />
          </div>
        </div>

        <!-- 进度条 -->
        <div class="step-progress">
          <div
            class="progress-bar"
            :style="{ width: `${((currentStep + 1) / currentProof.steps.length) * 100}%` }"
          ></div>
          <div class="progress-dots">
            <div
              v-for="(_step, index) in currentProof.steps"
              :key="index"
              class="progress-dot"
              :class="{ active: index <= currentStep, current: index === currentStep }"
              @click="goToStep(index)"
            >
              <span class="dot-number">{{ index + 1 }}</span>
            </div>
          </div>
        </div>

        <!-- 当前步骤内容 -->
        <transition name="step-fade" mode="out-in">
          <div :key="currentStep" class="step-content">
            <div class="step-title">
              <span class="step-number">步骤 {{ currentStep + 1 }}</span>
              <span class="step-name">{{ currentProof.steps[currentStep].title }}</span>
            </div>

            <!-- 数学表达式 -->
            <div
              v-if="currentProof.steps[currentStep].formula"
              class="step-formula"
              v-html="renderFormula(currentProof.steps[currentStep].formula!)"
            ></div>

            <!-- 说明文字 -->
            <div class="step-explanation" v-html="renderContent(currentProof.steps[currentStep].explanation)"></div>

            <!-- 提示 -->
            <div v-if="currentProof.steps[currentStep].hint" class="step-hint">
              <el-icon><InfoFilled /></el-icon>
              <span>{{ currentProof.steps[currentStep].hint }}</span>
            </div>
          </div>
        </transition>
      </div>

      <!-- 可视化区域 -->
      <div v-if="currentProof.hasVisualization" class="visualization-area">
        <div class="viz-header">
          <el-icon><PictureFilled /></el-icon>
          <span>几何直观</span>
        </div>
        <div ref="chartContainer" class="viz-chart"></div>
      </div>

      <!-- 证明技巧 -->
      <div v-if="currentProof.techniques?.length" class="techniques-section">
        <h4>
          <el-icon><MagicStick /></el-icon>
          证明技巧
        </h4>
        <div class="techniques-list">
          <el-tag
            v-for="tech in currentProof.techniques"
            :key="tech"
            type="success"
            size="small"
          >
            {{ tech }}
          </el-tag>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import {
  Reading,
  ArrowLeft,
  ArrowRight,
  DArrowLeft,
  DArrowRight,
  InfoFilled,
  PictureFilled,
  MagicStick
} from '@element-plus/icons-vue'
import katex from 'katex'
import * as echarts from 'echarts'

interface ProofStep {
  title: string
  formula?: string
  explanation: string
  hint?: string
}

interface Proof {
  id: string
  title: string
  statement: string
  steps: ProofStep[]
  hasVisualization?: boolean
  visualizationConfig?: any
  techniques?: string[]
}

const proofs: Proof[] = [
  {
    id: 'mvt',
    title: '拉格朗日中值定理',
    statement: '若函数 $f(x)$ 在闭区间 $[a,b]$ 上连续，在开区间 $(a,b)$ 内可导，则至少存在一点 $\\xi \\in (a,b)$，使得 $f\'(\\xi) = \\frac{f(b)-f(a)}{b-a}$',
    steps: [
      {
        title: '构造辅助函数',
        formula: '\\varphi(x) = f(x) - \\frac{f(b)-f(a)}{b-a}(x-a)',
        explanation: '构造辅助函数 $\\varphi(x)$，使其满足罗尔定理的条件。这里 $\\frac{f(b)-f(a)}{b-a}(x-a)$ 是过点 $(a, f(a))$ 和 $(b, f(b))$ 的直线方程。',
        hint: '证明的关键在于构造合适的辅助函数'
      },
      {
        title: '验证连续性和可导性',
        explanation: '由于 $f(x)$ 在 $[a,b]$ 连续，$(a,b)$ 可导，而 $\\frac{f(b)-f(a)}{b-a}(x-a)$ 是线性函数（处处连续可导），所以 $\\varphi(x)$ 在 $[a,b]$ 连续，在 $(a,b)$ 可导。'
      },
      {
        title: '验证端点值相等',
        formula: '\\varphi(a) = f(a) - 0 = f(a)',
        explanation: '计算 $\\varphi(a) = f(a) - \\frac{f(b)-f(a)}{b-a} \\cdot 0 = f(a)$\n\n计算 $\\varphi(b) = f(b) - \\frac{f(b)-f(a)}{b-a}(b-a) = f(b) - (f(b)-f(a)) = f(a)$\n\n所以 $\\varphi(a) = \\varphi(b) = f(a)$'
      },
      {
        title: '应用罗尔定理',
        explanation: '$\\varphi(x)$ 满足罗尔定理的三个条件：\n1. 在 $[a,b]$ 连续\n2. 在 $(a,b)$ 可导\n3. $\\varphi(a) = \\varphi(b)$\n\n根据罗尔定理，存在 $\\xi \\in (a,b)$ 使得 $\\varphi\'(\\xi) = 0$'
      },
      {
        title: '得出结论',
        formula: "\\varphi'(\\xi) = f'(\\xi) - \\frac{f(b)-f(a)}{b-a} = 0",
        explanation: '由 $\\varphi\'(\\xi) = 0$ 得到 $f\'(\\xi) = \\frac{f(b)-f(a)}{b-a}$\n\n证毕！',
        hint: '几何意义：曲线上至少存在一点，其切线平行于两端点连线'
      }
    ],
    hasVisualization: true,
    visualizationConfig: {
      func: (x: number) => x * x - 2 * x + 2,
      a: 0,
      b: 3,
      xi: 1.5
    },
    techniques: ['构造辅助函数', '罗尔定理']
  },
  {
    id: 'rolle',
    title: '罗尔定理',
    statement: '若函数 $f(x)$ 在闭区间 $[a,b]$ 上连续，在开区间 $(a,b)$ 内可导，且 $f(a) = f(b)$，则至少存在一点 $\\xi \\in (a,b)$，使得 $f\'(\\xi) = 0$',
    steps: [
      {
        title: '分析：利用闭区间连续函数的性质',
        explanation: '由于 $f(x)$ 在闭区间 $[a,b]$ 上连续，根据最值定理，$f(x)$ 在 $[a,b]$ 上必取得最大值 $M$ 和最小值 $m$。'
      },
      {
        title: '情况一：常数函数',
        formula: 'M = m \\Rightarrow f(x) \\equiv c',
        explanation: '若 $M = m$，则 $f(x)$ 在 $[a,b]$ 上恒为常数 $c$。\n\n此时 $f\'(x) \\equiv 0$，对任意 $\\xi \\in (a,b)$ 都有 $f\'(\\xi) = 0$，结论成立。'
      },
      {
        title: '情况二：非常数函数',
        explanation: '若 $M \\neq m$，由于 $f(a) = f(b)$，所以 $M$ 和 $m$ 中至少有一个不在端点取得（否则 $f(a) = f(b)$ 就等于最大值或最小值，另一个极值也必须在端点，这与 $f(a) = f(b)$ 矛盾）。'
      },
      {
        title: '找到极值点',
        explanation: '不妨设 $M$ 在 $(a,b)$ 内某点 $\\xi$ 处取得，即 $f(\\xi) = M$。\n\n$\\xi$ 是 $f(x)$ 的极大值点。',
        hint: '极值点是关键'
      },
      {
        title: '应用费马引理',
        formula: "f'(\\xi) = 0",
        explanation: '由于 $f(x)$ 在 $\\xi$ 处可导，且 $\\xi$ 是极大值点，根据费马引理（可导函数在极值点导数为0），有 $f\'(\\xi) = 0$。\n\n证毕！'
      }
    ],
    hasVisualization: true,
    visualizationConfig: {
      func: (x: number) => -x * x + 4 * x - 3,
      a: 1,
      b: 3,
      xi: 2
    },
    techniques: ['最值定理', '费马引理', '分类讨论']
  },
  {
    id: 'ftc',
    title: '微积分基本定理（牛顿-莱布尼茨公式）',
    statement: '若 $f(x)$ 在 $[a,b]$ 上连续，$F(x)$ 是 $f(x)$ 的一个原函数，则 $\\int_a^b f(x)dx = F(b) - F(a)$',
    steps: [
      {
        title: '定义变上限积分函数',
        formula: '\\Phi(x) = \\int_a^x f(t)dt',
        explanation: '定义变上限积分函数 $\\Phi(x)$，它表示曲线 $y = f(t)$ 从 $a$ 到 $x$ 与 $t$ 轴围成的面积。'
      },
      {
        title: '证明变上限积分可导',
        formula: "\\Phi'(x) = f(x)",
        explanation: '这是微积分基本定理的第一部分：若 $f(x)$ 连续，则变上限积分 $\\Phi(x) = \\int_a^x f(t)dt$ 可导，且 $\\Phi\'(x) = f(x)$。\n\n这意味着 $\\Phi(x)$ 是 $f(x)$ 的一个原函数。',
        hint: '变上限积分的导数等于被积函数'
      },
      {
        title: '利用原函数的关系',
        formula: 'F(x) - \\Phi(x) = C',
        explanation: '设 $F(x)$ 是 $f(x)$ 的任意一个原函数，则 $F\'(x) = f(x) = \\Phi\'(x)$。\n\n两个函数导数相同，说明它们只相差一个常数 $C$，即 $F(x) = \\Phi(x) + C$。'
      },
      {
        title: '确定常数',
        formula: '\\Phi(a) = \\int_a^a f(t)dt = 0',
        explanation: '由于 $\\Phi(a) = 0$（上下限相同时积分为0），所以 $F(a) = \\Phi(a) + C = C$。\n\n因此 $C = F(a)$，即 $\\Phi(x) = F(x) - F(a)$。'
      },
      {
        title: '代入得出结论',
        formula: '\\int_a^b f(x)dx = \\Phi(b) = F(b) - F(a)',
        explanation: '将 $x = b$ 代入，得到 $\\int_a^b f(x)dx = \\Phi(b) = F(b) - F(a)$。\n\n证毕！这就是著名的牛顿-莱布尼茨公式。',
        hint: '这个公式将微分学和积分学联系在一起'
      }
    ],
    techniques: ['变上限积分', '原函数性质']
  },
  {
    id: 'cauchy-mvt',
    title: '柯西中值定理',
    statement: '若函数 $f(x)$ 和 $g(x)$ 在 $[a,b]$ 上连续，在 $(a,b)$ 上可导，且 $g\'(x) \\neq 0$，则存在 $\\xi \\in (a,b)$，使得 $\\frac{f\'(\\xi)}{g\'(\\xi)} = \\frac{f(b)-f(a)}{g(b)-g(a)}$',
    steps: [
      {
        title: '构造辅助函数',
        formula: '\\varphi(x) = f(x) - \\frac{f(b)-f(a)}{g(b)-g(a)}[g(x) - g(a)]',
        explanation: '类比拉格朗日中值定理，构造辅助函数 $\\varphi(x)$，将比值转化为差值问题。',
        hint: '构造辅助函数是证明中值定理类问题的关键'
      },
      {
        title: '验证 g(b) ≠ g(a)',
        explanation: '由于 $g\'(x) \\neq 0$（$(a,b)$内），若 $g(b) = g(a)$，由罗尔定理存在 $\\eta$ 使 $g\'(\\eta) = 0$，矛盾！\n\n所以 $g(b) \\neq g(a)$，分母不为零。'
      },
      {
        title: '验证 φ(x) 满足罗尔定理条件',
        formula: '\\varphi(a) = f(a),\\quad \\varphi(b) = f(b) - [f(b)-f(a)] = f(a)',
        explanation: '$\\varphi(x)$ 在 $[a,b]$ 连续（$f$, $g$ 连续），在 $(a,b)$ 可导。\n\n且 $\\varphi(a) = \\varphi(b) = f(a)$，满足罗尔定理条件。'
      },
      {
        title: '应用罗尔定理',
        explanation: '由罗尔定理，存在 $\\xi \\in (a,b)$ 使得 $\\varphi\'(\\xi) = 0$。'
      },
      {
        title: '得出结论',
        formula: "\\varphi'(\\xi) = f'(\\xi) - \\frac{f(b)-f(a)}{g(b)-g(a)} \\cdot g'(\\xi) = 0",
        explanation: '由 $\\varphi\'(\\xi) = 0$ 得到：\n\n$f\'(\\xi) = \\frac{f(b)-f(a)}{g(b)-g(a)} \\cdot g\'(\\xi)$\n\n即 $\\frac{f\'(\\xi)}{g\'(\\xi)} = \\frac{f(b)-f(a)}{g(b)-g(a)}$\n\n证毕！',
        hint: '当 g(x) = x 时，就是拉格朗日中值定理'
      }
    ],
    techniques: ['构造辅助函数', '罗尔定理', '反证法']
  },
  {
    id: 'taylor',
    title: '泰勒公式（带拉格朗日余项）',
    statement: '若 $f(x)$ 在 $x_0$ 的某邻域内有 $n+1$ 阶导数，则 $f(x) = \\sum_{k=0}^{n}\\frac{f^{(k)}(x_0)}{k!}(x-x_0)^k + \\frac{f^{(n+1)}(\\xi)}{(n+1)!}(x-x_0)^{n+1}$',
    steps: [
      {
        title: '理解泰勒多项式',
        formula: 'P_n(x) = \\sum_{k=0}^{n}\\frac{f^{(k)}(x_0)}{k!}(x-x_0)^k',
        explanation: '泰勒多项式 $P_n(x)$ 是用多项式来近似函数 $f(x)$，在 $x_0$ 处与 $f(x)$ 有相同的前 $n$ 阶导数。',
        hint: '泰勒多项式的关键：在展开点处各阶导数匹配'
      },
      {
        title: '定义余项',
        formula: 'R_n(x) = f(x) - P_n(x)',
        explanation: '余项 $R_n(x)$ 表示近似的误差，我们需要给出它的具体形式。'
      },
      {
        title: '构造辅助函数证明余项',
        formula: 'G(t) = f(x) - \\sum_{k=0}^{n}\\frac{f^{(k)}(t)}{k!}(x-t)^k - \\frac{R_n(x)}{(x-x_0)^{n+1}}(x-t)^{n+1}',
        explanation: '这是一个关于 $t$ 的函数，令 $t$ 从 $x_0$ 变化到 $x$。'
      },
      {
        title: '验证端点值',
        formula: 'G(x_0) = G(x) = 0',
        explanation: '$G(x_0) = f(x) - P_n(x) - R_n(x) = 0$（由余项定义）\n\n$G(x) = f(x) - f(x) - 0 = 0$（展开式在 $t=x$ 时只剩 $f(x)$）'
      },
      {
        title: '应用罗尔定理',
        formula: "G'(\\xi) = 0,\\quad \\xi \\in (x_0, x)",
        explanation: '由罗尔定理，存在 $\\xi$ 介于 $x_0$ 与 $x$ 之间，使得 $G\'(\\xi) = 0$。'
      },
      {
        title: '计算导数得出结论',
        formula: 'R_n(x) = \\frac{f^{(n+1)}(\\xi)}{(n+1)!}(x-x_0)^{n+1}',
        explanation: '对 $G(t)$ 求导并代入 $t=\\xi$，经过计算可得余项的拉格朗日形式。\n\n证毕！',
        hint: '余项估计是判断泰勒展开精度的关键'
      }
    ],
    techniques: ['构造辅助函数', '罗尔定理', '数学归纳法']
  },
  {
    id: 'integral-mvt',
    title: '积分中值定理',
    statement: '若 $f(x)$ 在 $[a,b]$ 上连续，则存在 $\\xi \\in [a,b]$，使得 $\\int_a^b f(x)dx = f(\\xi)(b-a)$',
    steps: [
      {
        title: '利用连续函数的性质',
        explanation: '由于 $f(x)$ 在闭区间 $[a,b]$ 上连续，根据最值定理，$f(x)$ 在此区间上取得最大值 $M$ 和最小值 $m$。'
      },
      {
        title: '建立不等式',
        formula: 'm \\leq f(x) \\leq M,\\quad \\forall x \\in [a,b]',
        explanation: '对不等式两边在 $[a,b]$ 上积分：\n\n$m(b-a) \\leq \\int_a^b f(x)dx \\leq M(b-a)$'
      },
      {
        title: '转化为平均值',
        formula: 'm \\leq \\frac{1}{b-a}\\int_a^b f(x)dx \\leq M',
        explanation: '除以 $(b-a)$，得到积分的平均值 $\\mu = \\frac{1}{b-a}\\int_a^b f(x)dx$ 介于最小值和最大值之间。',
        hint: '几何意义：函数的平均高度'
      },
      {
        title: '应用介值定理',
        formula: '\\exists\\, \\xi \\in [a,b],\\quad f(\\xi) = \\mu',
        explanation: '由于 $f(x)$ 连续，$\\mu$ 介于最小值 $m$ 和最大值 $M$ 之间，根据介值定理，存在 $\\xi \\in [a,b]$ 使 $f(\\xi) = \\mu$。'
      },
      {
        title: '得出结论',
        formula: '\\int_a^b f(x)dx = f(\\xi)(b-a)',
        explanation: '将 $\\mu = f(\\xi)$ 代回，得到 $\\int_a^b f(x)dx = f(\\xi)(b-a)$。\n\n证毕！',
        hint: '几何意义：曲边梯形面积等于某个矩形面积'
      }
    ],
    hasVisualization: true,
    visualizationConfig: {
      func: (x: number) => Math.sin(x) + 1.5,
      a: 0,
      b: Math.PI,
      xi: Math.PI / 2
    },
    techniques: ['最值定理', '介值定理', '夹逼原理']
  },
  {
    id: 'leibniz',
    title: '莱布尼茨判别法（交错级数）',
    statement: '若交错级数 $\\sum_{n=1}^{\\infty}(-1)^{n-1}a_n$（$a_n > 0$）满足：(1) $a_n$ 单调递减；(2) $\\lim_{n\\to\\infty}a_n = 0$，则级数收敛',
    steps: [
      {
        title: '考虑偶数项部分和',
        formula: 'S_{2n} = (a_1 - a_2) + (a_3 - a_4) + \\cdots + (a_{2n-1} - a_{2n})',
        explanation: '将前 $2n$ 项两两配对，由于 $a_n$ 单调递减，每一对 $(a_{2k-1} - a_{2k}) > 0$。',
        hint: '两两配对是交错级数证明的关键技巧'
      },
      {
        title: '证明 S₂ₙ 单调递增',
        formula: 'S_{2n+2} - S_{2n} = a_{2n+1} - a_{2n+2} > 0',
        explanation: '由于 $a_{2n+1} > a_{2n+2}$（单调递减），所以 $S_{2n}$ 是单调递增的。'
      },
      {
        title: '证明 S₂ₙ 有上界',
        formula: 'S_{2n} = a_1 - (a_2 - a_3) - (a_4 - a_5) - \\cdots - a_{2n} < a_1',
        explanation: '换一种配对方式，每一对 $(a_{2k} - a_{2k+1}) > 0$，所以 $S_{2n} < a_1$。'
      },
      {
        title: '偶数项部分和收敛',
        formula: '\\lim_{n \\to \\infty} S_{2n} = S',
        explanation: '单调递增有上界的数列必收敛，设 $\\lim_{n \\to \\infty} S_{2n} = S$。'
      },
      {
        title: '奇数项部分和也收敛',
        formula: 'S_{2n+1} = S_{2n} + a_{2n+1} \\to S + 0 = S',
        explanation: '由于 $\\lim_{n \\to \\infty} a_{2n+1} = 0$，所以：\n\n$\\lim_{n \\to \\infty} S_{2n+1} = \\lim_{n \\to \\infty} S_{2n} + \\lim_{n \\to \\infty} a_{2n+1} = S + 0 = S$'
      },
      {
        title: '得出结论',
        explanation: '奇数项部分和与偶数项部分和都收敛到同一极限 $S$，所以整个级数收敛。\n\n证毕！\n\n注：还可以证明余项估计 $|R_n| \\leq a_{n+1}$',
        hint: '交错级数的余项不超过被舍弃的第一项'
      }
    ],
    techniques: ['数列配对', '单调有界定理', '夹逼原理']
  },
  {
    id: 'fermat',
    title: '费马引理',
    statement: '若 $f(x)$ 在 $x_0$ 处可导，且 $x_0$ 是 $f(x)$ 的极值点，则 $f\'(x_0) = 0$',
    steps: [
      {
        title: '假设为极大值点',
        explanation: '不妨设 $x_0$ 是极大值点（极小值情况类似）。\n\n即存在 $\\delta > 0$，当 $|x - x_0| < \\delta$ 时，$f(x) \\leq f(x_0)$。'
      },
      {
        title: '考虑左导数',
        formula: "f'_-(x_0) = \\lim_{h \\to 0^-} \\frac{f(x_0+h) - f(x_0)}{h}",
        explanation: '当 $h < 0$ 时，$f(x_0+h) - f(x_0) \\leq 0$（极大值性质），而 $h < 0$。\n\n所以商 $\\frac{f(x_0+h) - f(x_0)}{h} \\geq 0$。\n\n取极限得 $f\'_-(x_0) \\geq 0$。',
        hint: '负数除以负数等于正数'
      },
      {
        title: '考虑右导数',
        formula: "f'_+(x_0) = \\lim_{h \\to 0^+} \\frac{f(x_0+h) - f(x_0)}{h}",
        explanation: '当 $h > 0$ 时，$f(x_0+h) - f(x_0) \\leq 0$，而 $h > 0$。\n\n所以商 $\\frac{f(x_0+h) - f(x_0)}{h} \\leq 0$。\n\n取极限得 $f\'_+(x_0) \\leq 0$。'
      },
      {
        title: '得出结论',
        formula: "f'(x_0) = f'_-(x_0) = f'_+(x_0) = 0",
        explanation: '由于 $f(x)$ 在 $x_0$ 可导，左右导数相等，即 $f\'(x_0) = f\'_-(x_0) = f\'_+(x_0)$。\n\n由 $f\'_-(x_0) \\geq 0$ 和 $f\'_+(x_0) \\leq 0$，以及左右导数相等，必有 $f\'(x_0) = 0$。\n\n证毕！',
        hint: '这是罗尔定理证明的基础'
      }
    ],
    techniques: ['左右导数', '极值定义', '夹逼原理']
  }
]

const selectedProofId = ref('mvt')
const currentStep = ref(0)
const chartContainer = ref<HTMLElement | null>(null)
let chart: echarts.ECharts | null = null

const currentProof = computed(() => {
  return proofs.find(p => p.id === selectedProofId.value)
})

const nextStep = () => {
  if (currentProof.value && currentStep.value < currentProof.value.steps.length - 1) {
    currentStep.value++
  }
}

const prevStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

const goToStep = (step: number) => {
  currentStep.value = step
}

const renderFormula = (formula: string) => {
  try {
    return katex.renderToString(formula, { throwOnError: false, displayMode: true })
  } catch {
    return formula
  }
}

const renderContent = (content: string) => {
  // 处理换行
  let result = content.replace(/\n/g, '<br>')
  // 处理行内公式
  result = result.replace(/\$([^$]+)\$/g, (_, formula) => {
    try {
      return katex.renderToString(formula, { throwOnError: false, displayMode: false })
    } catch {
      return `$${formula}$`
    }
  })
  return result
}

const renderVisualization = () => {
  if (!currentProof.value?.hasVisualization || !chartContainer.value) return

  const config = currentProof.value.visualizationConfig
  if (!config) return

  if (chart) {
    chart.dispose()
  }

  chart = echarts.init(chartContainer.value)

  // 生成函数数据
  const xData: number[] = []
  const yData: number[] = []
  const step = (config.b - config.a + 1) / 100

  for (let x = config.a - 0.5; x <= config.b + 0.5; x += step) {
    xData.push(x)
    yData.push(config.func(x))
  }

  // 计算切线
  const xiY = config.func(config.xi)
  const slope = (config.func(config.b) - config.func(config.a)) / (config.b - config.a)
  const tangentY = (x: number) => xiY + slope * (x - config.xi)

  const option: echarts.EChartsOption = {
    grid: { left: 50, right: 30, top: 30, bottom: 40 },
    xAxis: {
      type: 'value',
      min: config.a - 0.5,
      max: config.b + 0.5,
      axisLine: { lineStyle: { color: '#666' } }
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: '#666' } }
    },
    series: [
      // 函数曲线
      {
        type: 'line',
        data: xData.map((x, i) => [x, yData[i]]),
        smooth: true,
        showSymbol: false,
        lineStyle: { color: '#409EFF', width: 2 },
        name: 'f(x)'
      },
      // 割线（端点连线）
      {
        type: 'line',
        data: [[config.a, config.func(config.a)], [config.b, config.func(config.b)]],
        lineStyle: { color: '#E6A23C', width: 2, type: 'dashed' },
        showSymbol: false,
        name: '割线'
      },
      // 切线
      {
        type: 'line',
        data: [[config.xi - 1, tangentY(config.xi - 1)], [config.xi + 1, tangentY(config.xi + 1)]],
        lineStyle: { color: '#67C23A', width: 2 },
        showSymbol: false,
        name: '切线'
      },
      // 端点
      {
        type: 'scatter',
        data: [[config.a, config.func(config.a)], [config.b, config.func(config.b)]],
        symbolSize: 10,
        itemStyle: { color: '#E6A23C' },
        label: {
          show: true,
          formatter: (params: any) => params.dataIndex === 0 ? 'A' : 'B',
          position: 'bottom'
        }
      },
      // ξ点
      {
        type: 'scatter',
        data: [[config.xi, xiY]],
        symbolSize: 12,
        itemStyle: { color: '#67C23A' },
        label: {
          show: true,
          formatter: 'ξ',
          position: 'top',
          fontSize: 14
        }
      }
    ],
    legend: {
      show: true,
      bottom: 0,
      textStyle: { fontSize: 11 }
    }
  }

  chart.setOption(option)
}

watch(selectedProofId, () => {
  currentStep.value = 0
  nextTick(renderVisualization)
})

watch(currentStep, () => {
  // 可以根据步骤更新可视化
})

// 保存 resize 处理函数的引用，以便正确移除
const handleResize = () => chart?.resize()

onMounted(() => {
  nextTick(renderVisualization)
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chart?.dispose()
})
</script>

<style lang="scss" scoped>
// ============================================
// iOS 风格证明动画器
// ============================================
.proof-animator {
  background-color: var(--card-bg);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
}

.animator-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(135deg, var(--ios-green) 0%, var(--ios-teal) 100%);
  color: white;
  gap: 12px;
  flex-wrap: wrap;

  .header-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-weight: 600;
    font-size: 15px;
    flex-shrink: 0;
  }

  .proof-select {
    width: 160px;
    max-width: 50%;
    flex-shrink: 1;

    :deep(.el-select__wrapper) {
      background-color: rgba(255, 255, 255, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.3);
      box-shadow: none;

      .el-select__placeholder,
      .el-select__selected-item {
        color: white;
        font-weight: 500;
      }

      .el-select__suffix {
        color: white;
      }

      &:hover {
        background-color: rgba(255, 255, 255, 0.25);
      }
    }

    :deep(.el-select__wrapper.is-focused) {
      background-color: rgba(255, 255, 255, 0.3);
      border-color: rgba(255, 255, 255, 0.5);
    }
  }
}

.animator-content {
  padding: var(--spacing-lg);
}

// iOS 风格定理陈述卡片
.theorem-statement {
  padding: var(--spacing-md);
  background: linear-gradient(135deg, rgba(52, 199, 89, 0.12) 0%, rgba(90, 200, 250, 0.12) 100%);
  border-radius: var(--border-radius);
  margin-bottom: var(--spacing-lg);
  border-left: 3px solid var(--ios-green);

  .statement-label {
    font-size: 12px;
    font-weight: 600;
    color: var(--ios-green);
    margin-bottom: var(--spacing-sm);
    text-transform: uppercase;
    letter-spacing: 0.02em;
  }

  .statement-content {
    font-size: 15px;
    line-height: 1.7;
    color: var(--text-color);
  }
}

.proof-steps {
  margin-bottom: var(--spacing-lg);
}

.steps-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);

  .steps-title {
    font-size: 17px;
    font-weight: 600;
    color: var(--text-color);
  }

  .steps-controls {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);

    .step-indicator {
      font-size: 13px;
      color: var(--text-color-tertiary);
      min-width: 50px;
      text-align: center;
      font-feature-settings: 'tnum';
    }
  }
}

// iOS 风格进度条
.step-progress {
  position: relative;
  margin-bottom: var(--spacing-lg);
  padding: 0 14px;

  .progress-bar {
    position: absolute;
    top: 14px;
    left: 14px;
    height: 3px;
    background-color: var(--ios-green);
    border-radius: 1.5px;
    transition: width 0.3s var(--transition-timing);
    z-index: 0;
  }

  .progress-dots {
    display: flex;
    justify-content: space-between;
    position: relative;
    z-index: 1;

    &::before {
      content: '';
      position: absolute;
      top: 14px;
      left: 0;
      right: 0;
      height: 3px;
      background-color: var(--separator-color);
      border-radius: 1.5px;
      z-index: -1;
    }
  }

  .progress-dot {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background-color: var(--card-bg);
    border: 2px solid var(--separator-color);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.25s var(--transition-timing);

    .dot-number {
      font-size: 13px;
      font-weight: 600;
      color: var(--text-color-tertiary);
    }

    &.active {
      border-color: var(--ios-green);
      background-color: var(--ios-green);

      .dot-number {
        color: white;
      }
    }

    &.current {
      transform: scale(1.15);
      box-shadow: 0 0 0 4px rgba(52, 199, 89, 0.2);
    }

    &:active {
      transform: scale(0.95);
    }
  }
}

// iOS 风格步骤内容
.step-content {
  padding: var(--spacing-lg);
  background-color: var(--bg-color);
  border-radius: var(--border-radius);

  .step-title {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-md);

    .step-number {
      padding: 4px 10px;
      background-color: var(--primary-color);
      color: white;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
    }

    .step-name {
      font-size: 17px;
      font-weight: 600;
      color: var(--text-color);
    }
  }

  .step-formula {
    margin-bottom: var(--spacing-md);
    padding: var(--spacing-md);
    background-color: var(--card-bg);
    border-radius: var(--border-radius);
    overflow-x: auto;
  }

  .step-explanation {
    font-size: 15px;
    line-height: 1.7;
    color: var(--text-color-secondary);
    margin-bottom: var(--spacing-sm);
  }

  .step-hint {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm) var(--spacing-md);
    background-color: rgba(255, 149, 0, 0.12);
    border-radius: var(--border-radius);
    font-size: 13px;
    color: var(--ios-orange);

    .el-icon {
      flex-shrink: 0;
      margin-top: 2px;
    }
  }
}

// 可视化区域
.visualization-area {
  margin-bottom: var(--spacing-lg);

  .viz-header {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    font-size: 15px;
    font-weight: 600;
    color: var(--text-color);
    margin-bottom: var(--spacing-sm);

    .el-icon {
      color: var(--primary-color);
    }
  }

  .viz-chart {
    width: 100%;
    height: 260px;
    background-color: var(--bg-color);
    border-radius: var(--border-radius);
  }
}

// 证明技巧区域
.techniques-section {
  h4 {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    font-size: 15px;
    font-weight: 600;
    color: var(--text-color);
    margin-bottom: var(--spacing-sm);

    .el-icon {
      color: var(--ios-purple);
    }
  }

  .techniques-list {
    display: flex;
    gap: var(--spacing-sm);
    flex-wrap: wrap;
  }
}

// iOS 风格步骤切换动画
.step-fade-enter-active,
.step-fade-leave-active {
  transition: all 0.25s var(--transition-timing);
}

.step-fade-enter-from {
  opacity: 0;
  transform: translateX(16px);
}

.step-fade-leave-to {
  opacity: 0;
  transform: translateX(-16px);
}
</style>
