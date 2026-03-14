import { tool } from '@langchain/core/tools'
import { z } from 'zod'
import { ChatOpenAI } from '@langchain/openai'
import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import { 
  useResumeStore, 
  useProjectStore, 
  useJobDescriptionStore,
  useMaterialStore,
  useUserStore 
} from '@/store'
import { INTRO_GENERATION_PROMPT } from '../prompts'

// 根据时长计算字数
const getDurationWordCount = (duration: string): number => {
  const map: Record<string, number> = {
    '1min': 200,
    '3min': 600,
    '5min': 1000,
  }
  return map[duration] || 600
}

export const generateIntroTool = tool(
  async ({ jobId, duration, focusPoints }) => {
    const userStore = useUserStore.getState()
    const resumeStore = useResumeStore.getState()
    const projectStore = useProjectStore.getState()
    const jdStore = useJobDescriptionStore.getState()
    const materialStore = useMaterialStore.getState()

    // 检查API Key
    const apiKey = userStore.profile?.openAIApiKey
    if (!apiKey) {
      return JSON.stringify({
        success: false,
        message: '请先在设置中配置 OpenAI API Key',
      })
    }

    // 获取JD信息
    const jd = jdStore.getJobDescriptionById(jobId)
    if (!jd) {
      return JSON.stringify({
        success: false,
        message: '未找到对应的职位信息',
      })
    }

    // 获取简历
    const resume = resumeStore.getDefaultResume()
    if (!resume) {
      return JSON.stringify({
        success: false,
        message: '请先添加简历',
      })
    }

    // 获取项目经历
    const projects = projectStore.projects

    // 构建提示词
    const wordCount = getDurationWordCount(duration)
    const prompt = INTRO_GENERATION_PROMPT
      .replace('{duration}', duration.replace('min', ''))
      .replace('{jobTitle}', jd.title)
      .replace('{company}', '目标公司')
      .replace('{jobRequirements}', jd.requirements)
      .replace('{resumeContent}', resume.content)
      .replace('{projectExperiences}', projects.map(p => 
        `${p.name}: ${p.description}\n成就: ${p.achievements.join(', ')}`
      ).join('\n\n'))
      .replace('{wordCount}', wordCount.toString())

    if (focusPoints) {
      prompt.concat(`\n\n重点突出以下方面：${focusPoints}`)
    }

    try {
      const llm = new ChatOpenAI({
        openAIApiKey: apiKey,
        modelName: 'gpt-4o',
        temperature: 0.8,
      })

      const response = await llm.invoke([
        new SystemMessage('你是一个专业的求职顾问，擅长撰写有吸引力的自我介绍。'),
        new HumanMessage(prompt),
      ])

      const content = response.content as string

      // 保存生成的素材
      const material = materialStore.addMaterial({
        type: 'intro',
        targetJobId: jobId,
        duration,
        content,
        prompt,
      })

      return JSON.stringify({
        success: true,
        materialId: material.id,
        duration,
        content,
        wordCount: content.length,
      })
    } catch (error) {
      return JSON.stringify({
        success: false,
        message: `生成失败: ${error instanceof Error ? error.message : '未知错误'}`,
      })
    }
  },
  {
    name: 'generate_intro',
    description: '根据目标职位生成自我介绍',
    schema: z.object({
      jobId: z.string().describe('目标职位ID'),
      duration: z.enum(['1min', '3min', '5min']).describe('自我介绍时长'),
      focusPoints: z.string().optional().describe('希望重点突出的方面'),
    }),
  }
)

// 获取已生成的自我介绍
export const getGeneratedIntrosTool = tool(
  async ({ jobId }) => {
    const materialStore = useMaterialStore.getState()
    
    let materials = materialStore.getMaterialsByType('intro')
    
    if (jobId) {
      materials = materials.filter(m => m.targetJobId === jobId)
    }

    return JSON.stringify({
      success: true,
      count: materials.length,
      intros: materials.map(m => ({
        id: m.id,
        duration: m.duration,
        content: m.content.slice(0, 100) + '...',
        createdAt: m.createdAt,
      })),
    })
  },
  {
    name: 'get_generated_intros',
    description: '获取已生成的自我介绍列表',
    schema: z.object({
      jobId: z.string().optional().describe('按职位ID筛选'),
    }),
  }
)

export const introGeneratorTools = [
  generateIntroTool,
  getGeneratedIntrosTool,
]
