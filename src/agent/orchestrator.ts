import { ChatOpenAI } from '@langchain/openai'
import { HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages'
import type { BaseMessage } from '@langchain/core/messages'
import { allTools } from './tools'
import { SYSTEM_PROMPT } from './prompts'
import { useChatStore, useUserStore } from '@/store'
import type { ChatMessage, AIProvider } from '@/types'
import { AI_PROVIDERS } from './llm'

export class JobHunterAgent {
  private llm: ChatOpenAI | null = null
  private conversationHistory: BaseMessage[] = []

  constructor() {
    this.initializeFromStore()
  }

  private initializeFromStore() {
    const { profile } = useUserStore.getState()
    const apiKey = profile?.apiKey || profile?.openAIApiKey
    if (apiKey) {
      this.initialize(
        apiKey, 
        profile?.aiProvider || 'qwen',
        profile?.aiModel,
        profile?.customBaseURL
      )
    }
  }

  initialize(
    apiKey: string, 
    provider: AIProvider = 'qwen',
    modelName?: string,
    customBaseURL?: string
  ) {
    if (!apiKey) {
      console.error('Agent 初始化失败: API Key 为空')
      return
    }

    const providerConfig = AI_PROVIDERS[provider]
    const baseURL = provider === 'custom' ? customBaseURL : providerConfig.baseURL
    const model = modelName || providerConfig.defaultModel

    console.log('初始化 Agent:', { provider, model, baseURL, hasApiKey: !!apiKey })

    this.llm = new ChatOpenAI({
      apiKey: apiKey,
      model: model,
      temperature: 0.7,
      configuration: {
        baseURL,
      },
    }).bindTools(allTools)

    // 添加系统提示
    this.conversationHistory = [new SystemMessage(SYSTEM_PROMPT)]

    // 从store恢复历史记录
    const { messages } = useChatStore.getState()
    messages.slice(-10).forEach((msg: ChatMessage) => {
      if (msg.role === 'user') {
        this.conversationHistory.push(new HumanMessage(msg.content))
      } else if (msg.role === 'assistant') {
        this.conversationHistory.push(new AIMessage(msg.content))
      }
    })
  }

  isInitialized(): boolean {
    return this.llm !== null
  }

  async chat(userMessage: string): Promise<string> {
    if (!this.llm) {
      return '请先在设置中配置 AI 服务的 API Key'
    }

    const chatStore = useChatStore.getState()

    // 保存用户消息
    chatStore.addMessage({ role: 'user', content: userMessage })
    this.conversationHistory.push(new HumanMessage(userMessage))

    try {
      // 调用LLM
      let response = await this.llm.invoke(this.conversationHistory)
      
      // 处理工具调用
      while (response.tool_calls && response.tool_calls.length > 0) {
        // 执行工具调用
        const toolResults = []
        
        for (const toolCall of response.tool_calls) {
          const tool = allTools.find(t => t.name === toolCall.name)
          if (tool) {
            try {
              const result = await tool.invoke(toolCall.args)
              toolResults.push({
                tool_call_id: toolCall.id,
                content: typeof result === 'string' ? result : JSON.stringify(result),
              })
            } catch (error) {
              toolResults.push({
                tool_call_id: toolCall.id,
                content: JSON.stringify({ 
                  error: error instanceof Error ? error.message : '工具执行失败' 
                }),
              })
            }
          }
        }

        // 添加工具调用结果到历史
        this.conversationHistory.push(response)
        
        // 创建工具结果消息
        const toolMessage = {
          role: 'tool' as const,
          content: toolResults.map(r => r.content).join('\n'),
          tool_call_id: toolResults[0]?.tool_call_id,
        }
        
        // 继续对话
        response = await this.llm.invoke([
          ...this.conversationHistory,
          toolMessage,
        ])
      }

      // 提取最终回复
      const assistantMessage = typeof response.content === 'string' 
        ? response.content 
        : JSON.stringify(response.content)

      // 保存助手消息
      chatStore.addMessage({ role: 'assistant', content: assistantMessage })
      this.conversationHistory.push(new AIMessage(assistantMessage))

      // 保持历史记录不超过20条
      if (this.conversationHistory.length > 21) {
        this.conversationHistory = [
          this.conversationHistory[0], // 保留系统消息
          ...this.conversationHistory.slice(-20),
        ]
      }

      return assistantMessage
    } catch (error) {
      const errorMessage = `抱歉，处理您的请求时出现错误: ${
        error instanceof Error ? error.message : '未知错误'
      }`
      chatStore.addMessage({ role: 'assistant', content: errorMessage })
      return errorMessage
    }
  }

  clearHistory() {
    this.conversationHistory = [new SystemMessage(SYSTEM_PROMPT)]
    useChatStore.getState().clearMessages()
  }
}

// 单例实例
let agentInstance: JobHunterAgent | null = null

export function getAgent(): JobHunterAgent {
  if (!agentInstance) {
    agentInstance = new JobHunterAgent()
  }
  return agentInstance
}

export function reinitializeAgent(
  apiKey: string,
  provider: AIProvider = 'qwen',
  modelName?: string,
  customBaseURL?: string
) {
  if (!agentInstance) {
    agentInstance = new JobHunterAgent()
  }
  agentInstance.initialize(apiKey, provider, modelName, customBaseURL)
  return agentInstance
}
