import { ChatOpenAI } from '@langchain/openai'

let llmInstance: ChatOpenAI | null = null

export function initializeLLM(apiKey: string, modelName: string = 'gpt-4o-mini'): ChatOpenAI {
  llmInstance = new ChatOpenAI({
    openAIApiKey: apiKey,
    modelName,
    temperature: 0.7,
    maxTokens: 2000,
  })
  return llmInstance
}

export function getLLM(): ChatOpenAI {
  if (!llmInstance) {
    throw new Error('LLM not initialized. Please set your OpenAI API key in settings.')
  }
  return llmInstance
}

export function isLLMInitialized(): boolean {
  return llmInstance !== null
}

// 用于特定任务的 LLM 配置
export function getCreativeLLM(apiKey: string): ChatOpenAI {
  return new ChatOpenAI({
    openAIApiKey: apiKey,
    modelName: 'gpt-4o',
    temperature: 0.9,
    maxTokens: 3000,
  })
}

export function getAnalysisLLM(apiKey: string): ChatOpenAI {
  return new ChatOpenAI({
    openAIApiKey: apiKey,
    modelName: 'gpt-4o',
    temperature: 0.3,
    maxTokens: 2000,
  })
}
