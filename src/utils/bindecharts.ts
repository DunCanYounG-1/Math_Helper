/**
 * ECharts 按需导入配置
 * 只导入项目实际使用的组件，减小打包体积
 */
import * as echarts from 'echarts/core'

// 图表类型
import {
  LineChart,
  ScatterChart,
  BarChart
} from 'echarts/charts'

// 组件
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  DatasetComponent,
  TransformComponent,
  LegendComponent,
  MarkLineComponent,
  MarkPointComponent,
  MarkAreaComponent,
  DataZoomComponent,
  ToolboxComponent,
  VisualMapComponent
} from 'echarts/components'

// 渲染器
import { CanvasRenderer } from 'echarts/renderers'

// 类型
import type {
  LineSeriesOption,
  ScatterSeriesOption,
  BarSeriesOption
} from 'echarts/charts'

import type {
  TitleComponentOption,
  TooltipComponentOption,
  GridComponentOption,
  DatasetComponentOption,
  LegendComponentOption,
  MarkLineComponentOption,
  MarkPointComponentOption,
  MarkAreaComponentOption,
  DataZoomComponentOption,
  ToolboxComponentOption,
  VisualMapComponentOption
} from 'echarts/components'

import type { ComposeOption } from 'echarts/core'

// 注册组件
echarts.use([
  // 图表
  LineChart,
  ScatterChart,
  BarChart,
  // 组件
  TitleComponent,
  TooltipComponent,
  GridComponent,
  DatasetComponent,
  TransformComponent,
  LegendComponent,
  MarkLineComponent,
  MarkPointComponent,
  MarkAreaComponent,
  DataZoomComponent,
  ToolboxComponent,
  VisualMapComponent,
  // 渲染器
  CanvasRenderer
])

// 组合类型
export type ECOption = ComposeOption<
  | LineSeriesOption
  | ScatterSeriesOption
  | BarSeriesOption
  | TitleComponentOption
  | TooltipComponentOption
  | GridComponentOption
  | DatasetComponentOption
  | LegendComponentOption
  | MarkLineComponentOption
  | MarkPointComponentOption
  | MarkAreaComponentOption
  | DataZoomComponentOption
  | ToolboxComponentOption
  | VisualMapComponentOption
>

export { echarts }
export default echarts
