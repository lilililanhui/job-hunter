import { tool } from '@langchain/core/tools'
import { z } from 'zod'
import { ChatOpenAI } from '@langchain/openai'
import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import { 
  useResumeStore, 
  useProjectStore,
  useJobDescriptionStore,
  useQuestionStore,
  useInterviewStore,
  useUserStore,
  useMaterialStore,
} from '@/store'
import { STAR_ANSWER_PROMPT, INTERVIEW_QUESTION_PROMPT } from '../prompts'

// 生成面试问题预测
export const generateInterviewQuestionsTool = tool(
  async ({ jobId }) => {
    const userStore = useUserStore.getState()
    const resumeStore = useResumeStore.getState()
    const projectStore = useProjectStore.getState()
    const jdStore = useJobDescriptionStore.getState()

    const apiKey = userStore.profile?.openAIApiKey
    if (!apiKey) {
      return JSON.stringify({
        success: false,
        message: '请先在设置中配置 OpenAI API Key',
      })
    }

    const jd = jdStore.getJobDescriptionById(jobId)
    if (!jd) {
      return JSON.stringify({
        success: false,
        message: '未找到对应的职位信息',
      })
    }

    const resume = resumeStore.getDefaultResume()
    const projects = projectStore.projects

    const prompt = INTERVIEW_QUESTION_PROMPT
      .replace('{jobDescription}', `${jd.title}\n${jd.requirements}`)
      .replace('{resumeContent}', resume?.content || '暂无简历')
      .replace('{projectExperiences}', projects.map(p => 
        `${p.name}: ${p.description}\n技术栈: ${p.technologies.join(', ')}`
      ).join('\n\n'))

    try {
      const llm = new ChatOpenAI({
        openAIApiKey: apiKey,
        modelName: 'gpt-4o',
        temperature: 0.7,
      })

      const response = await llm.invoke([
        new SystemMessage('你是一个资深面试官，擅长设计面试问题。'),
        new HumanMessage(prompt),
      ])

      return JSON.stringify({
        success: true,
        jobId,
        questions: response.content,
      })
    } catch (error) {
      return JSON.stringify({
        success: false,
        message: `生成失败: ${error instanceof Error ? error.message : '未知错误'}`,
      })
    }
  },
  {
    name: 'generate_interview_questions',
    description: '根据职位要求生成可能的面试问题',
    schema: z.object({
      jobId: z.string().describe('职位ID'),
    }),
  }
)

// 使用STAR法则生成答案
export const generateStarAnswerTool = tool(
  async ({ question, projectId }) => {
    const userStore = useUserStore.getState()
    const projectStore = useProjectStore.getState()
    const materialStore = useMaterialStore.getState()

    const apiKey = userStore.profile?.openAIApiKey
    if (!apiKey) {
      return JSON.stringify({
        success: false,
        message: '请先在设置中配置 OpenAI API Key',
      })
    }

    // 获取相关经历
    let relevantExperience = ''
    if (projectId) {
      const project = projectStore.projects.find(p => p.id === projectId)
      if (project) {
        relevantExperience = `
项目名称：${project.name}
角色：${project.role}
描述：${project.description}
技术栈：${project.technologies.join(', ')}
成就：
${project.achievements.map((a, i) => `${i + 1}. ${a}`).join('\n')}`
      }
    } else {
      // 使用所有项目
      relevantExperience = projectStore.projects.map(p => 
        `${p.name} (${p.role}): ${p.description}`
      ).join('\n')
    }

    const prompt = STAR_ANSWER_PROMPT
      .replace('{question}', question)
      .replace('{relevantExperience}', relevantExperience)

    try {
      const llm = new ChatOpenAI({
        openAIApiKey: apiKey,
        modelName: 'gpt-4o',
        temperature: 0.7,
      })

      const response = await llm.invoke([
        new SystemMessage('你是一个面试教练，擅长使用STAR法则组织面试答案。'),
        new HumanMessage(prompt),
      ])

      const content = response.content as string

      // 保存生成的答案
      const material = materialStore.addMaterial({
        type: 'answer',
        content,
        prompt: question,
      })

      return JSON.stringify({
        success: true,
        materialId: material.id,
        question,
        answer: content,
      })
    } catch (error) {
      return JSON.stringify({
        success: false,
        message: `生成失败: ${error instanceof Error ? error.message : '未知错误'}`,
      })
    }
  },
  {
    name: 'generate_star_answer',
    description: '使用STAR法则为面试问题生成答案',
    schema: z.object({
      question: z.string().describe('面试问题'),
      projectId: z.string().optional().describe('相关项目ID（可选）'),
    }),
  }
)

// 记录面试问题
export const recordInterviewQuestionTool = tool(
  async ({ interviewId, question, myAnswer, category }) => {
    const questionStore = useQuestionStore.getState()

    const q = questionStore.addQuestion({
      interviewId,
      question,
      answer: myAnswer,
      category: category || '其他',
    })

    return JSON.stringify({
      success: true,
      message: '问题已记录',
      questionId: q.id,
    })
  },
  {
    name: 'record_interview_question',
    description: '记录面试中的问题',
    schema: z.object({
      interviewId: z.string().optional().describe('面试记录ID'),
      question: z.string().describe('面试问题'),
      myAnswer: z.string().optional().describe('我的回答'),
      category: z.string().optional().describe('问题分类（技术/行为/项目/其他）'),
    }),
  }
)

// 生成问题的标准答案
export const generateStandardAnswerTool = tool(
  async ({ questionId }) => {
    const userStore = useUserStore.getState()
    const questionStore = useQuestionStore.getState()
    const projectStore = useProjectStore.getState()

    const apiKey = userStore.profile?.openAIApiKey
    if (!apiKey) {
      return JSON.stringify({
        success: false,
        message: '请先在设置中配置 OpenAI API Key',
      })
    }

    const question = questionStore.questions.find(q => q.id === questionId)
    if (!question) {
      return JSON.stringify({
        success: false,
        message: '未找到对应的问题',
      })
    }

    const projects = projectStore.projects
    const prompt = `
请为以下面试问题生成一个专业的标准答案。

问题：${question.question}
分类：${question.category}
${question.answer ? `我的回答：${question.answer}` : ''}

可参考的项目经历：
${projects.map(p => `${p.name}: ${p.description}`).join('\n')}

请提供：
1. 结构清晰的标准答案
2. 关键要点
3. 如果我有回答，指出可以改进的地方`

    try {
      const llm = new ChatOpenAI({
        openAIApiKey: apiKey,
        modelName: 'gpt-4o',
        temperature: 0.5,
      })

      const response = await llm.invoke([
        new SystemMessage('你是一个面试专家，擅长提供面试问题的标准答案。'),
        new HumanMessage(prompt),
      ])

      const standardAnswer = response.content as string

      // 更新问题记录
      questionStore.updateQuestion(questionId, { standardAnswer })

      return JSON.stringify({
        success: true,
        questionId,
        standardAnswer,
      })
    } catch (error) {
      return JSON.stringify({
        success: false,
        message: `生成失败: ${error instanceof Error ? error.message : '未知错误'}`,
      })
    }
  },
  {
    name: 'generate_standard_answer',
    description: '为已记录的面试问题生成标准答案',
    schema: z.object({
      questionId: z.string().describe('问题记录ID'),
    }),
  }
)

// 添加面试记录
export const addInterviewTool = tool(
  async ({ applicationId, round, scheduledAt, mode, interviewers }) => {
    const interviewStore = useInterviewStore.getState()

    const interview = interviewStore.addInterview({
      applicationId,
      round: round as 'phone' | 'hr' | 'tech1' | 'tech2' | 'tech3' | 'final' | 'other',
      scheduledAt,
      mode: mode as 'onsite' | 'remote' | 'phone',
      interviewers,
    })

    return JSON.stringify({
      success: true,
      message: '面试记录已添加',
      interviewId: interview.id,
    })
  },
  {
    name: 'add_interview',
    description: '添加面试记录',
    schema: z.object({
      applicationId: z.string().describe('投递记录ID'),
      round: z.enum(['phone', 'hr', 'tech1', 'tech2', 'tech3', 'final', 'other'])
        .describe('面试轮次'),
      scheduledAt: z.string().optional().describe('面试时间'),
      mode: z.enum(['onsite', 'remote', 'phone']).optional().describe('面试形式'),
      interviewers: z.string().optional().describe('面试官'),
    }),
  }
)

export const interviewHelperTools = [
  generateInterviewQuestionsTool,
  generateStarAnswerTool,
  recordInterviewQuestionTool,
  generateStandardAnswerTool,
  addInterviewTool,
]
