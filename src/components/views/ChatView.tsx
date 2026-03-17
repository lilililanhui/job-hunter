import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Loader2, Sparkles, RefreshCw, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { useChatStore, useUserStore } from '@/store'
import { getAgent, reinitializeAgent } from '@/agent/orchestrator'
import type { ChatMessage } from '@/types'

const QUICK_ACTIONS = [
  { label: '查看投递统计', prompt: '帮我统计一下当前的投递情况' },
  { label: '生成自我介绍', prompt: '帮我生成一份3分钟的自我介绍' },
  { label: '准备面试题', prompt: '帮我准备一些常见的面试问题和答案' },
  { label: '分析匹配度', prompt: '帮我分析我的简历和目标职位的匹配度' },
]

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'

  return (
    <div
      className={cn(
        'flex gap-3 animate-fade-in',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      <Avatar className={cn('h-8 w-8', isUser ? 'bg-primary' : 'bg-secondary')}>
        <AvatarFallback>
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>
      
      <div
        className={cn(
          'max-w-[80%] rounded-lg px-4 py-3',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted'
        )}
      >
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        <span className="text-xs opacity-60 mt-1 block">
          {new Date(message.timestamp).toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
    </div>
  )
}

export function ChatView() {
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const { messages, clearMessages } = useChatStore()
  const { profile } = useUserStore()
  const agent = getAgent()

  // 获取 API Key（兼容新旧字段）
  const currentApiKey = profile?.apiKey || profile?.openAIApiKey
  
  // 检查 API Key 是否配置
  const isConfigured = currentApiKey && agent.isInitialized()

  // 滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  // 初始化 Agent
  useEffect(() => {
    if (currentApiKey && !agent.isInitialized()) {
      reinitializeAgent(
        currentApiKey,
        profile?.aiProvider || 'qwen',
        profile?.aiModel,
        profile?.customBaseURL
      )
    }
  }, [currentApiKey, profile?.aiProvider, profile?.aiModel])

  const handleSend = async () => {
    if (!input.trim() || isLoading || !isConfigured) return

    const userMessage = input.trim()
    setInput('')
    setIsLoading(true)

    try {
      await agent.chat(userMessage)
    } catch (error) {
      console.error('Chat error:', error)
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleQuickAction = (prompt: string) => {
    setInput(prompt)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleClearHistory = () => {
    agent.clearHistory()
    clearMessages()
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">AI 求职助手</h1>
              <p className="text-sm text-muted-foreground">
                {isConfigured ? '随时为您服务' : '请先配置 API Key'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleClearHistory}>
              <Trash2 className="h-4 w-4 mr-2" />
              清空记录
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Bot className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-semibold mb-2">开始对话</h2>
              <p className="text-muted-foreground mb-6">
                我可以帮你管理投递进度、生成面试素材、分析职位匹配度
              </p>
              
              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-2 max-w-md mx-auto">
                {QUICK_ACTIONS.map((action, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="h-auto py-3 px-4 text-left"
                    onClick={() => handleQuickAction(action.prompt)}
                    disabled={!isConfigured}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))
          )}
          
          {isLoading && (
            <div className="flex gap-3">
              <Avatar className="h-8 w-8 bg-secondary">
                <AvatarFallback>
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-muted rounded-lg px-4 py-3">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}
          
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t bg-card p-4">
        <div className="max-w-3xl mx-auto">
          {!isConfigured && (
            <Card className="mb-4 border-amber-200 bg-amber-50 dark:bg-amber-950/20">
              <CardContent className="p-3 flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <RefreshCw className="h-4 w-4" />
                <span className="text-sm">请先在设置中配置 API Key</span>
              </CardContent>
            </Card>
          )}
          
          <div className="flex gap-2">
            <Textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isConfigured ? '输入消息... (Enter 发送, Shift+Enter 换行)' : '请先配置 API Key'}
              disabled={!isConfigured || isLoading}
              className="min-h-[56px] max-h-32 resize-none"
              rows={1}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading || !isConfigured}
              className="h-14 w-14"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
