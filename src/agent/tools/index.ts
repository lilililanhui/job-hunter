import { progressManagerTools } from './progressManager'
import { introGeneratorTools } from './introGenerator'
import { matchCalculatorTools } from './matchCalculator'
import { interviewHelperTools } from './interviewHelper'

// 导出所有工具
export const allTools = [
  ...progressManagerTools,
  ...introGeneratorTools,
  ...matchCalculatorTools,
  ...interviewHelperTools,
]

// 按类别导出
export {
  progressManagerTools,
  introGeneratorTools,
  matchCalculatorTools,
  interviewHelperTools,
}
