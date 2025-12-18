<template>
  <div class="concept-comparison">
    <div class="comparison-header">
      <div class="header-title">
        <el-icon><Switch /></el-icon>
        <span>概念对比</span>
      </div>
      <el-select
        v-model="selectedPairId"
        placeholder="选择对比组"
        size="small"
        class="pair-select"
      >
        <el-option
          v-for="pair in comparisonPairs"
          :key="pair.id"
          :value="pair.id"
          :label="`${pair.conceptA.name} vs ${pair.conceptB.name}`"
        />
      </el-select>
    </div>

    <div v-if="currentPair" class="comparison-content">
      <!-- 概念卡片对比 -->
      <div class="concepts-row">
        <div class="concept-card concept-a">
          <div class="concept-badge">A</div>
          <h3 class="concept-name">{{ currentPair.conceptA.name }}</h3>
          <div class="concept-formula" v-html="renderFormula(currentPair.conceptA.formula)"></div>
          <p class="concept-definition">{{ currentPair.conceptA.definition }}</p>
        </div>

        <div class="vs-divider">
          <span>VS</span>
        </div>

        <div class="concept-card concept-b">
          <div class="concept-badge">B</div>
          <h3 class="concept-name">{{ currentPair.conceptB.name }}</h3>
          <div class="concept-formula" v-html="renderFormula(currentPair.conceptB.formula)"></div>
          <p class="concept-definition">{{ currentPair.conceptB.definition }}</p>
        </div>
      </div>

      <!-- 对比表格 -->
      <div class="comparison-table">
        <div class="table-header">
          <div class="col-aspect">对比维度</div>
          <div class="col-a">{{ currentPair.conceptA.name }}</div>
          <div class="col-b">{{ currentPair.conceptB.name }}</div>
        </div>
        <div
          v-for="(row, index) in currentPair.comparisons"
          :key="index"
          class="table-row"
        >
          <div class="col-aspect">
            <el-icon><Aim /></el-icon>
            {{ row.aspect }}
          </div>
          <div class="col-a" v-html="renderContent(row.valueA)"></div>
          <div class="col-b" v-html="renderContent(row.valueB)"></div>
        </div>
      </div>

      <!-- 关键区别 -->
      <div class="key-differences">
        <h4>
          <el-icon><Warning /></el-icon>
          关键区别
        </h4>
        <ul class="differences-list">
          <li v-for="(diff, index) in currentPair.keyDifferences" :key="index">
            {{ diff }}
          </li>
        </ul>
      </div>

      <!-- 常见混淆 -->
      <div v-if="currentPair.commonConfusions?.length" class="common-confusions">
        <h4>
          <el-icon><QuestionFilled /></el-icon>
          常见混淆点
        </h4>
        <div class="confusion-list">
          <div
            v-for="(confusion, index) in currentPair.commonConfusions"
            :key="index"
            class="confusion-item"
          >
            <div class="confusion-wrong">
              <el-icon><CircleClose /></el-icon>
              <span>{{ confusion.wrong }}</span>
            </div>
            <div class="confusion-right">
              <el-icon><CircleCheck /></el-icon>
              <span>{{ confusion.correct }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 记忆口诀 -->
      <div v-if="currentPair.mnemonic" class="mnemonic-section">
        <h4>
          <el-icon><MagicStick /></el-icon>
          记忆口诀
        </h4>
        <div class="mnemonic-content">
          {{ currentPair.mnemonic }}
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <el-icon :size="48"><Switch /></el-icon>
      <p>选择一组概念进行对比</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  Switch,
  Aim,
  Warning,
  QuestionFilled,
  CircleClose,
  CircleCheck,
  MagicStick
} from '@element-plus/icons-vue'
import katex from 'katex'

interface Concept {
  name: string
  formula: string
  definition: string
}

interface ComparisonRow {
  aspect: string
  valueA: string
  valueB: string
}

interface Confusion {
  wrong: string
  correct: string
}

interface ComparisonPair {
  id: string
  conceptA: Concept
  conceptB: Concept
  comparisons: ComparisonRow[]
  keyDifferences: string[]
  commonConfusions?: Confusion[]
  mnemonic?: string
}

// 概念对比数据
const comparisonPairs: ComparisonPair[] = [
  {
    id: 'limit-continuous',
    conceptA: {
      name: '极限存在',
      formula: '\\lim_{x \\to a} f(x) = L',
      definition: '当x无限接近a时，f(x)无限接近某个确定的值L'
    },
    conceptB: {
      name: '函数连续',
      formula: '\\lim_{x \\to a} f(x) = f(a)',
      definition: '极限值等于函数在该点的值，且函数在该点有定义'
    },
    comparisons: [
      { aspect: '核心要求', valueA: '左右极限存在且相等', valueB: '极限存在 + 函数有定义 + 极限等于函数值' },
      { aspect: '函数值要求', valueA: '不要求$f(a)$存在', valueB: '必须$f(a)$存在' },
      { aspect: '图像特征', valueA: '可以有"洞"', valueB: '图像连贯无断点' },
      { aspect: '条件数量', valueA: '1个条件', valueB: '3个条件' }
    ],
    keyDifferences: [
      '极限存在只关注"趋近"行为，不管函数在该点的实际值',
      '连续是更强的条件，包含了极限存在',
      '极限存在但不连续的典型例子：$f(x)=\\frac{x^2-1}{x-1}$ 在 $x=1$ 处'
    ],
    commonConfusions: [
      { wrong: '极限存在就连续', correct: '连续需要三个条件同时满足' },
      { wrong: '函数有定义就连续', correct: '还需要极限存在且等于函数值' }
    ],
    mnemonic: '连续三条件：有定义、有极限、极限等于值'
  },
  {
    id: 'derivative-differential',
    conceptA: {
      name: '导数',
      formula: "f'(x) = \\lim_{\\Delta x \\to 0} \\frac{f(x+\\Delta x)-f(x)}{\\Delta x}",
      definition: '函数在某点的瞬时变化率，是一个数值'
    },
    conceptB: {
      name: '微分',
      formula: 'dy = f\'(x) \\cdot dx',
      definition: '函数增量的线性主部，是一个无穷小量'
    },
    comparisons: [
      { aspect: '本质', valueA: '变化率（比值的极限）', valueB: '线性近似增量' },
      { aspect: '结果类型', valueA: '一个确定的数', valueB: '一个无穷小量' },
      { aspect: '几何意义', valueA: '切线斜率', valueB: '切线上的增量' },
      { aspect: '表达式', valueA: "$f'(x)$ 或 $\\frac{dy}{dx}$", valueB: '$dy = f\'(x)dx$' },
      { aspect: '应用', valueA: '求极值、单调性', valueB: '近似计算、误差估计' }
    ],
    keyDifferences: [
      '导数是微分与自变量增量之比的极限',
      '可导必可微，可微必可导（一元函数）',
      '$\\frac{dy}{dx}$ 整体是导数符号，不是 $dy$ 除以 $dx$'
    ],
    commonConfusions: [
      { wrong: '$dy = \\Delta y$', correct: '$dy \\approx \\Delta y$，微分是增量的近似' },
      { wrong: '$dx$ 是无穷小', correct: '$dx = \\Delta x$ 是自变量的任意增量' }
    ],
    mnemonic: '导数问"多快"，微分问"多少"'
  },
  {
    id: 'definite-indefinite',
    conceptA: {
      name: '不定积分',
      formula: '\\int f(x)dx = F(x) + C',
      definition: '求所有原函数，结果是函数族'
    },
    conceptB: {
      name: '定积分',
      formula: '\\int_a^b f(x)dx = F(b) - F(a)',
      definition: '求曲线下面积，结果是一个数'
    },
    comparisons: [
      { aspect: '结果类型', valueA: '函数（带常数C）', valueB: '数值' },
      { aspect: '几何意义', valueA: '原函数曲线族', valueB: '曲线与x轴围成的面积' },
      { aspect: '积分限', valueA: '无积分上下限', valueB: '有确定的上下限' },
      { aspect: '运算本质', valueA: '求导的逆运算', valueB: '无穷小量的累加' },
      { aspect: '常数C', valueA: '必须加+C', valueB: '无需加C' }
    ],
    keyDifferences: [
      '不定积分是"求原函数"，定积分是"算面积"',
      '牛顿-莱布尼茨公式连接了两者',
      '定积分可以用不定积分来计算，但概念完全不同'
    ],
    commonConfusions: [
      { wrong: '定积分不需要原函数', correct: '计算定积分最常用的方法就是先求原函数' },
      { wrong: '不定积分结果忘记+C', correct: '不定积分必须加任意常数C' }
    ],
    mnemonic: '不定求函数加C，定积算数有上下'
  },
  {
    id: 'convergence-absolute',
    conceptA: {
      name: '条件收敛',
      formula: '\\sum a_n 收敛，\\sum |a_n| 发散',
      definition: '级数本身收敛，但绝对值级数发散'
    },
    conceptB: {
      name: '绝对收敛',
      formula: '\\sum |a_n| 收敛',
      definition: '绝对值级数收敛（则原级数必收敛）'
    },
    comparisons: [
      { aspect: '收敛强度', valueA: '弱收敛', valueB: '强收敛' },
      { aspect: '重排不变性', valueA: '重排后可能改变和', valueB: '重排后和不变' },
      { aspect: '典型例子', valueA: '交错调和级数 $\\sum\\frac{(-1)^n}{n}$', valueB: '几何级数 $\\sum\\frac{1}{2^n}$' },
      { aspect: '判别条件', valueA: '常用莱布尼茨判别法', valueB: '常用比值、根值判别法' }
    ],
    keyDifferences: [
      '绝对收敛 → 条件收敛（反之不成立）',
      '绝对收敛的级数更"稳定"，可以任意重排',
      '条件收敛依赖正负项的"抵消"效应'
    ],
    commonConfusions: [
      { wrong: '收敛就是绝对收敛', correct: '收敛分为绝对收敛和条件收敛' },
      { wrong: '调和级数收敛', correct: '调和级数 $\\sum\\frac{1}{n}$ 发散' }
    ],
    mnemonic: '绝对更强条件弱，绝对可排条件抖'
  },
  {
    id: 'partial-total',
    conceptA: {
      name: '偏导数',
      formula: '\\frac{\\partial f}{\\partial x} = \\lim_{\\Delta x \\to 0}\\frac{f(x+\\Delta x, y)-f(x,y)}{\\Delta x}',
      definition: '固定其他变量，对单一变量求导'
    },
    conceptB: {
      name: '全微分',
      formula: 'dz = \\frac{\\partial f}{\\partial x}dx + \\frac{\\partial f}{\\partial y}dy',
      definition: '所有变量同时变化时的线性增量'
    },
    comparisons: [
      { aspect: '变量变化', valueA: '只有一个变量变化', valueB: '所有变量同时变化' },
      { aspect: '几何意义', valueA: '沿坐标轴方向的切线斜率', valueB: '切平面' },
      { aspect: '可微条件', valueA: '偏导存在不保证可微', valueB: '可微则偏导必存在' },
      { aspect: '连续性', valueA: '偏导存在不保证连续', valueB: '可微必连续' }
    ],
    keyDifferences: [
      '偏导数存在不能推出函数连续',
      '偏导数连续可以推出函数可微',
      '全微分需要函数在各方向都"光滑"变化'
    ],
    commonConfusions: [
      { wrong: '偏导存在则可微', correct: '偏导存在且连续才能保证可微' },
      { wrong: '偏导数就是普通导数', correct: '偏导数是多元函数对单个变量的变化率' }
    ],
    mnemonic: '偏导看一个，全微看全部'
  },
  {
    id: 'left-right-limit',
    conceptA: {
      name: '左极限',
      formula: '\\lim_{x \\to a^-} f(x) = L',
      definition: '从左边（小于a的方向）趋近时的极限'
    },
    conceptB: {
      name: '右极限',
      formula: '\\lim_{x \\to a^+} f(x) = L',
      definition: '从右边（大于a的方向）趋近时的极限'
    },
    comparisons: [
      { aspect: '趋近方向', valueA: '$x < a$ 且 $x \\to a$', valueB: '$x > a$ 且 $x \\to a$' },
      { aspect: '记号', valueA: '$f(a^-)$ 或 $\\lim_{x \\to a^-}$', valueB: '$f(a^+)$ 或 $\\lim_{x \\to a^+}$' },
      { aspect: '应用场景', valueA: '分段函数左边界', valueB: '分段函数右边界' },
      { aspect: '极限存在关系', valueA: '左右极限都存在且相等 ⟺ 极限存在', valueB: '左右极限都存在且相等 ⟺ 极限存在' }
    ],
    keyDifferences: [
      '极限存在的充要条件：左极限 = 右极限',
      '分段函数在分界点处需要分别计算左右极限',
      '有些函数只有单侧极限（如 $\\frac{1}{x}$ 在 $x=0$）'
    ],
    commonConfusions: [
      { wrong: '只算一边就够了', correct: '必须验证左右极限都存在且相等' },
      { wrong: '左极限用左边的公式', correct: '需要用趋近该点的表达式' }
    ],
    mnemonic: '左趋右趋要相等，极限才能说存在'
  },
  {
    id: 'maximum-supremum',
    conceptA: {
      name: '最大值',
      formula: '\\exists x_0 \\in D: f(x_0) = \\max_{x \\in D} f(x)',
      definition: '函数在定义域内实际取到的最大函数值'
    },
    conceptB: {
      name: '上确界',
      formula: 'M = \\sup_{x \\in D} f(x)',
      definition: '函数值的最小上界，不一定取到'
    },
    comparisons: [
      { aspect: '能否取到', valueA: '必须在定义域内取到', valueB: '可以取到也可以取不到' },
      { aspect: '存在性', valueA: '闭区间连续函数必有', valueB: '有界函数必有上确界' },
      { aspect: '与极限关系', valueA: '可能不等于极限', valueB: '可能等于极限值' },
      { aspect: '典型例子', valueA: '$f(x)=x^2$ 在 $[-1,1]$ 最大值1', valueB: '$f(x)=\\frac{1}{x}$ 在 $(0,1]$ 上确界 $+\\infty$' }
    ],
    keyDifferences: [
      '最大值一定是上确界，但上确界不一定是最大值',
      '开区间上的连续函数可能没有最大值，但有上确界',
      '上确界概念更广泛，在实分析中非常重要'
    ],
    commonConfusions: [
      { wrong: '上确界就是最大值', correct: '上确界可能取不到，最大值必须取到' },
      { wrong: '函数无最大值则无界', correct: '可能有上确界但取不到最大值' }
    ],
    mnemonic: '最值要取到，确界只求界'
  },
  {
    id: 'uniform-pointwise',
    conceptA: {
      name: '逐点收敛',
      formula: '\\forall x: \\lim_{n \\to \\infty} f_n(x) = f(x)',
      definition: '对每个固定的x，函数序列收敛'
    },
    conceptB: {
      name: '一致收敛',
      formula: '\\lim_{n \\to \\infty} \\sup_x |f_n(x) - f(x)| = 0',
      definition: '收敛速度与x无关，整体一致趋近'
    },
    comparisons: [
      { aspect: '收敛要求', valueA: '每点各自收敛', valueB: '所有点同步收敛' },
      { aspect: '收敛速度', valueA: '可能依赖于x', valueB: '与x无关' },
      { aspect: '连续性保持', valueA: '不保持', valueB: '保持（连续函数列一致收敛于连续函数）' },
      { aspect: '积分极限交换', valueA: '不能交换', valueB: '可以交换' }
    ],
    keyDifferences: [
      '一致收敛是更强的收敛概念',
      '一致收敛保持函数的良好性质（连续、可积等）',
      '逐点收敛可能破坏连续性'
    ],
    commonConfusions: [
      { wrong: '收敛就是一致收敛', correct: '一致收敛要求更严格' },
      { wrong: '连续函数列的极限连续', correct: '只有一致收敛才能保证极限连续' }
    ],
    mnemonic: '逐点各走各，一致齐步走'
  }
]

const selectedPairId = ref<string>('limit-continuous')

const currentPair = computed(() => {
  return comparisonPairs.find(p => p.id === selectedPairId.value)
})

const renderFormula = (formula: string) => {
  try {
    return katex.renderToString(formula, { throwOnError: false, displayMode: true })
  } catch {
    return formula
  }
}

const renderContent = (content: string) => {
  // 处理行内公式
  return content.replace(/\$([^$]+)\$/g, (_, formula) => {
    try {
      return katex.renderToString(formula, { throwOnError: false, displayMode: false })
    } catch {
      return `$${formula}$`
    }
  })
}
</script>

<style lang="scss" scoped>
.concept-comparison {
  background-color: var(--card-bg);
  border-radius: 12px;
  overflow: hidden;
}

.comparison-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(135deg, var(--ios-indigo) 0%, var(--ios-purple) 100%);
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

  .pair-select {
    width: 180px;
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

.comparison-content {
  padding: 20px;
}

.concepts-row {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.concept-card {
  flex: 1;
  padding: 20px;
  border-radius: 12px;
  position: relative;

  &.concept-a {
    background: linear-gradient(135deg, rgba(33, 150, 243, 0.1) 0%, rgba(33, 150, 243, 0.15) 100%);
    border: 2px solid #2196f3;
  }

  &.concept-b {
    background: linear-gradient(135deg, rgba(233, 30, 99, 0.1) 0%, rgba(233, 30, 99, 0.15) 100%);
    border: 2px solid #e91e63;
  }

  .concept-badge {
    position: absolute;
    top: -12px;
    left: 16px;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 14px;
    color: white;
  }

  &.concept-a .concept-badge { background-color: #2196f3; }
  &.concept-b .concept-badge { background-color: #e91e63; }

  .concept-name {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 12px;
    color: var(--text-color);
  }

  .concept-formula {
    margin-bottom: 12px;
    padding: 12px;
    background-color: var(--card-bg);
    border-radius: 8px;
    overflow-x: auto;
  }

  .concept-definition {
    font-size: 14px;
    color: var(--text-color-secondary);
    line-height: 1.6;
    margin: 0;
  }
}

.vs-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  span {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(135deg, #ff6b6b 0%, #feca57 100%);
    color: white;
    font-weight: 700;
    font-size: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.comparison-table {
  margin-bottom: 24px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--border-color);

  .table-header,
  .table-row {
    display: grid;
    grid-template-columns: 120px 1fr 1fr;
  }

  .table-header {
    background-color: var(--bg-color);
    font-weight: 600;
    font-size: 13px;

    > div {
      padding: 12px 16px;
      border-bottom: 1px solid var(--border-color);
    }

    .col-a { color: #2196f3; }
    .col-b { color: #e91e63; }
  }

  .table-row {
    &:not(:last-child) > div {
      border-bottom: 1px solid var(--border-color);
    }

    > div {
      padding: 12px 16px;
      font-size: 13px;
      line-height: 1.6;
    }

    .col-aspect {
      background-color: var(--bg-color);
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 500;
      color: var(--text-color);

      .el-icon {
        color: var(--primary-color);
        font-size: 14px;
      }
    }

    .col-a {
      background-color: rgba(33, 150, 243, 0.05);
    }

    .col-b {
      background-color: rgba(233, 30, 99, 0.05);
    }
  }
}

.key-differences,
.common-confusions,
.mnemonic-section {
  margin-bottom: 20px;

  h4 {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 15px;
    font-weight: 600;
    color: var(--text-color);
    margin-bottom: 12px;

    .el-icon {
      color: var(--primary-color);
    }
  }
}

.key-differences {
  h4 .el-icon { color: var(--ios-orange); }

  .differences-list {
    list-style: none;
    padding: 0;
    margin: 0;

    li {
      position: relative;
      padding: 8px 0 8px 24px;
      font-size: 14px;
      line-height: 1.6;
      color: var(--text-color-secondary);

      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 12px;
        width: 8px;
        height: 8px;
        background-color: var(--ios-orange);
        border-radius: 50%;
      }
    }
  }
}

.common-confusions {
  h4 .el-icon { color: var(--ios-red); }

  .confusion-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .confusion-item {
    padding: 12px 16px;
    background-color: var(--bg-color);
    border-radius: 8px;
  }

  .confusion-wrong,
  .confusion-right {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    font-size: 13px;
    line-height: 1.6;

    .el-icon {
      flex-shrink: 0;
      margin-top: 3px;
    }
  }

  .confusion-wrong {
    color: var(--ios-red);
    margin-bottom: 8px;
    text-decoration: line-through;
    opacity: 0.8;
  }

  .confusion-right {
    color: var(--ios-green);
  }
}

.mnemonic-section {
  h4 .el-icon { color: var(--ios-purple); }

  .mnemonic-content {
    padding: 16px;
    background: linear-gradient(135deg, rgba(175, 82, 222, 0.1) 0%, rgba(175, 82, 222, 0.15) 100%);
    border-radius: 8px;
    font-size: 16px;
    font-weight: 500;
    color: var(--ios-purple);
    text-align: center;
    line-height: 1.8;
  }
}

.empty-state {
  padding: 60px 20px;
  text-align: center;
  color: var(--text-color-secondary);

  .el-icon {
    margin-bottom: 16px;
    opacity: 0.5;
  }

  p {
    margin: 0;
    font-size: 14px;
  }
}
</style>
