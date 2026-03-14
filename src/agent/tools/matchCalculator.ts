import { tool } from '@langchain/core/tools'
import { z } from 'zod'
import { ChatOpenAI } from '@langchain/openai'
import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import { 
  useResumeStore, 
  useJobDescriptionStore,
  useApplicationStore,
  useUserStore,
} from '@/store'
import { MATCH_ANALYSIS_PROMPT } from '../prompts'

interface MatchResult {
  overallScore: number
  dimensions: {
    skills: { score: number; matched: string[]; missing: string[] }
    experience: { score: number; analysis: string }
    industry: { score: number; analysis: string }
    education: { score: number; analysis: string }
  }
  suggestions: string[]
  highlights: string[]
}

export const calculateMatchScoreTool = tool(
  async ({ jobId, resumeId }) => {
    const userStore = useUserStore.getState()
    const resumeStore = useResumeStore.getState()
    const jdStore = useJobDescriptionStore.getState()
    const appStore = useApplicationStore.getState()

    // 检查API Key
    const apiKey = userStore.profile?.openAIApiKey
    if (!apiKey) {
      return JSON.stringify({
        success: false,
        message: '请先在设置中配置 OpenAI API Key',
      })
    }

    // 获取JD
    const jd = jdStore.getJobDescriptionById(jobId)
    if (!jd) {
      return JSON.stringify({
        success: false,
        message: '未找到对应的职位信息',
      })
    }

    // 获取简历
    const resume = resumeId 
      ? resumeStore.resumes.find(r => r.id === resumeId)
      : resumeStore.getDefaultResume()
    
    if (!resume) {
      return JSON.stringify({
        success: false,
        message: '请先添加简历',
      })
    }

    // 构建提示词
    const prompt = MATCH_ANALYSIS_PROMPT
      .replace('{jobDescription}', `${jd.title}\n${jd.requirements}\n${jd.responsibilities || ''}`)
      .replace('{resumeContent}', resume.content)

    try {
      const llm = new ChatOpenAI({
        openAIApiKey: apiKey,
        modelName: 'gpt-4o',
        temperature: 0.3,
      })

      const response = await llm.invoke([
        new SystemMessage('你是一个专业的HR，擅长分析简历与职位的匹配度。请严格按照JSON格式输出。'),
        new HumanMessage(prompt),
      ])

      const content = response.content as string
      
      // 解析JSON结果
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('无法解析分析结果')
      }
      
      const result: MatchResult = JSON.parse(jsonMatch[0])

      // 更新投递记录的匹配分数
      const apps = appStore.applications.filter(a => a.jobDescriptionId === jobId)
      apps.forEach(app => {
        appStore.updateApplication(app.id, { matchScore: result.overallScore })
      })

      return JSON.stringify({
        success: true,
        jobId,
        jobTitle: jd.title,
        ...result,
      })
    } catch (error) {
      return JSON.stringify({
        success: false,
        message: `分析失败: ${error instanceof Error ? error.message : '未知错误'}`,
      })
    }
  },
  {
    name: 'calculate_match_score',
    description: '计算简历与职位的匹配度分数',
    schema: z.object({
      jobId: z.string().describe('职位ID'),
      resumeId: z.string().optional().describe('简历ID（可选，默认使用默认简历）'),
    }),
  }
)

// 批量计算匹配度
export const batchCalculateMatchTool = tool(
  async ({ jobIds }) => {
    const userStore = useUserStore.getState()
    const resumeStore = useResumeStore.getState()
    const jdStore = useJobDescriptionStore.getState()

    const apiKey = userStore.profile?.openAIApiKey
    if (!apiKey) {
      return JSON.stringify({
        success: false,
        message: '请先在设置中配置 OpenAI API Key',
      })
    }

    const resume = resumeStore.getDefaultResume()
    if (!resume) {
      return JSON.stringify({
        success: false,
        message: '请先添加简历',
      })
    }

    const results = []
    
    for (const jobId of jobIds) {
      const jd = jdStore.getJobDescriptionById(jobId)
      if (!jd) continue

      try {
        const llm = new ChatOpenAI({
          openAIApiKey: apiKey,
          modelName: 'gpt-4o-mini',
          temperature: 0.3,
        })

        const simplePrompt = `
请快速评估以下简历与职位的匹配度，返回0-100的分数。

职位要求：${jd.requirements.slice(0, 500)}

简历摘要：${resume.content.slice(0, 500)}

仅返回一个数字分数。`

        const response = await llm.invoke([
          new HumanMessage(simplePrompt),
        ])

        const score = parseInt(response.content as string) || 0
        results.push({
          jobId,
          title: jd.title,
          score: Math.min(100, Math.max(0, score)),
        })
      } catch {
        results.push({
          jobId,
          title: jd.title,
          score: 0,
          error: '计算失败',
        })
      }
    }

    return JSON.stringify({
      success: true,
      results,
    })
  },
  {
    name: 'batch_calculate_match',
    description: '批量计算多个职位的匹配度',
    schema: z.object({
      jobIds: z.array(z.string()).describe('职位ID列表'),
    }),
  }
)

export const matchCalculatorTools = [
  calculateMatchScoreTool,
  batchCalculateMatchTool,
]
