import { ChatOpenAI } from '@langchain/openai'

// 支持的 AI 服务提供商
export type AIProvider = 'openai' | 'qwen' | 'deepseek' | 'custom'

// AI 服务提供商配置
export const AI_PROVIDERS: Record<AIProvider, {
  name: string
  baseURL: string
  defaultModel: string
  models: string[]
  keyPrefix: string
  helpUrl: string
}> = {
  openai: {
    name: 'OpenAI',
    baseURL: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    keyPrefix: 'sk-',
    helpUrl: 'https://platform.openai.com/api-keys',
  },
  qwen: {
    name: '通义千问 (Qwen)',
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    defaultModel: 'qwen-plus',
    models: ['qwen-turbo', 'qwen-plus', 'qwen-max', 'qwen-max-longcontext'],
    keyPrefix: 'sk-',
    helpUrl: 'https://dashscope.console.aliyun.com/apiKey',
  },
  deepseek: {
    name: 'DeepSeek',
    baseURL: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
    models: ['deepseek-chat', 'deepseek-coder'],
    keyPrefix: 'sk-',
    helpUrl: 'https://platform.deepseek.com/api_keys',
  },
  custom: {
    name: '自定义',
    baseURL: '',
    defaultModel: '',
    models: [],
    keyPrefix: '',
    helpUrl: '',
  },
}

let llmInstance: ChatOpenAI | null = null
let currentProvider: AIProvider = 'qwen'

export function initializeLLM(
  apiKey: string, 
  provider: AIProvider = 'qwen',
  modelName?: string,
  customBaseURL?: string
): ChatOpenAI {
  const providerConfig = AI_PROVIDERS[provider]
  const baseURL = provider === 'custom' ? customBaseURL : providerConfig.baseURL
  const model = modelName || providerConfig.defaultModel
  
  currentProvider = provider
  
  llmInstance = new ChatOpenAI({
    apiKey: apiKey,
    model: model,
    temperature: 0.7,
    maxTokens: 2000,
    configuration: {
      baseURL,
    },
  })
  return llmInstance
}

export function getLLM(): ChatOpenAI {
  if (!llmInstance) {
    throw new Error('LLM 尚未初始化。请在设置中配置你的 API Key。')
  }
  return llmInstance
}

export function isLLMInitialized(): boolean {
  return llmInstance !== null
}

export function getCurrentProvider(): AIProvider {
  return currentProvider
}

// 用于特定任务的 LLM 配置
export function getCreativeLLM(
  apiKey: string, 
  provider: AIProvider = 'qwen',
  customBaseURL?: string
): ChatOpenAI {
  const providerConfig = AI_PROVIDERS[provider]
  const baseURL = provider === 'custom' ? customBaseURL : providerConfig.baseURL
  
  // 使用各个提供商的最强模型
  const creativeModels: Record<AIProvider, string> = {
    openai: 'gpt-4o',
    qwen: 'qwen-max',
    deepseek: 'deepseek-chat',
    custom: providerConfig.defaultModel,
  }
  
  return new ChatOpenAI({
    apiKey: apiKey,
    model: creativeModels[provider],
    temperature: 0.9,
    maxTokens: 3000,
    configuration: {
      baseURL,
    },
  })
}

export function getAnalysisLLM(
  apiKey: string, 
  provider: AIProvider = 'qwen',
  customBaseURL?: string
): ChatOpenAI {
  const providerConfig = AI_PROVIDERS[provider]
  const baseURL = provider === 'custom' ? customBaseURL : providerConfig.baseURL
  
  return new ChatOpenAI({
    apiKey: apiKey,
    model: providerConfig.defaultModel,
    temperature: 0.3,
    maxTokens: 2000,
    configuration: {
      baseURL,
    },
  })
}
