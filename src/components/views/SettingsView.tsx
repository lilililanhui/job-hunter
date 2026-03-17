import { useState, useEffect } from 'react'
import { Save, Key, User, Target, Check, AlertCircle, Moon, Sun, Bot } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useUserStore, useAppStore } from '@/store'
import { reinitializeAgent } from '@/agent/orchestrator'
import { AI_PROVIDERS, type AIProvider } from '@/agent/llm'

export function SettingsView() {
  const { profile, setProfile, updateProfile } = useUserStore()
  const { darkMode, setDarkMode } = useAppStore()
  
  // AI 配置
  const [aiProvider, setAiProvider] = useState<AIProvider>(
    profile?.aiProvider || 'qwen'
  )
  const [apiKey, setApiKey] = useState(profile?.apiKey || profile?.openAIApiKey || '')
  const [aiModel, setAiModel] = useState(
    profile?.aiModel || AI_PROVIDERS[aiProvider].defaultModel
  )
  const [customBaseURL, setCustomBaseURL] = useState(profile?.customBaseURL || '')
  
  // 个人信息
  const [name, setName] = useState(profile?.name || '')
  const [email, setEmail] = useState(profile?.email || '')
  const [targetRole, setTargetRole] = useState(profile?.targetRole || '')
  const [skills, setSkills] = useState(profile?.skills?.join(', ') || '')
  const [yearsOfExperience, setYearsOfExperience] = useState(
    profile?.yearsOfExperience?.toString() || ''
  )
  const [summary, setSummary] = useState(profile?.summary || '')
  
  const [saved, setSaved] = useState(false)
  const [apiKeyValid, setApiKeyValid] = useState<boolean | null>(null)
  const [validating, setValidating] = useState(false)

  const currentProviderConfig = AI_PROVIDERS[aiProvider]

  // 初始化个人资料
  useEffect(() => {
    if (!profile) {
      const now = new Date().toISOString()
      setProfile({
        id: crypto.randomUUID(),
        name: '',
        aiProvider: 'qwen',
        createdAt: now,
        updatedAt: now,
      })
    }
  }, [])

  // 当切换提供商时，更新默认模型
  useEffect(() => {
    const providerConfig = AI_PROVIDERS[aiProvider]
    if (!providerConfig.models.includes(aiModel)) {
      setAiModel(providerConfig.defaultModel)
    }
  }, [aiProvider])

  // 验证 API Key
  const validateApiKey = async () => {
    if (!apiKey) {
      setApiKeyValid(null)
      return
    }

    setValidating(true)
    
    try {
      const baseURL = aiProvider === 'custom' 
        ? customBaseURL 
        : currentProviderConfig.baseURL
      
      // 使用一个简单的模型列表请求来验证 Key
      const response = await fetch(`${baseURL}/models`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      })
      
      // 有些 API 可能不支持 /models 端点，但只要返回非 401 就认为可能有效
      const isValid = response.ok || (response.status !== 401 && response.status !== 403)
      setApiKeyValid(isValid)
      
      if (isValid) {
        reinitializeAgent(apiKey, aiProvider, aiModel, customBaseURL)
      }
    } catch (error) {
      // 如果是网络错误（如 CORS），我们假设 key 可能有效，保存后由后端验证
      console.warn('验证请求失败（可能是 CORS 问题）:', error)
      setApiKeyValid(true)
      reinitializeAgent(apiKey, aiProvider, aiModel, customBaseURL)
    } finally {
      setValidating(false)
    }
  }

  const handleSave = () => {
    updateProfile({
      aiProvider,
      apiKey,
      aiModel,
      customBaseURL: aiProvider === 'custom' ? customBaseURL : undefined,
      // 保持旧字段兼容
      openAIApiKey: apiKey,
      name,
      email,
      targetRole,
      skills: skills.split(',').map((s) => s.trim()).filter(Boolean),
      yearsOfExperience: yearsOfExperience ? parseInt(yearsOfExperience) : undefined,
      summary,
    })

    if (apiKey) {
      reinitializeAgent(apiKey, aiProvider, aiModel, customBaseURL)
    }

    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  // 切换主题
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b bg-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-1">设置</h1>
            <p className="text-muted-foreground">配置你的个人信息和 AI 服务</p>
          </div>
          <Button onClick={handleSave}>
            {saved ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                已保存
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                保存设置
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 max-w-2xl mx-auto space-y-6">
          {/* AI 配置 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                AI 服务配置
              </CardTitle>
              <CardDescription>
                选择 AI 服务提供商并配置 API Key
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 提供商选择 */}
              <div className="grid gap-2">
                <Label>AI 服务提供商</Label>
                <Select
                  value={aiProvider}
                  onValueChange={(value: AIProvider) => {
                    setAiProvider(value)
                    setApiKeyValid(null)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.entries(AI_PROVIDERS) as [AIProvider, typeof AI_PROVIDERS[AIProvider]][]).map(
                      ([key, config]) => (
                        <SelectItem key={key} value={key}>
                          {config.name}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* 自定义 Base URL（仅自定义模式） */}
              {aiProvider === 'custom' && (
                <div className="grid gap-2">
                  <Label htmlFor="baseUrl">API Base URL</Label>
                  <Input
                    id="baseUrl"
                    value={customBaseURL}
                    onChange={(e) => setCustomBaseURL(e.target.value)}
                    placeholder="https://api.example.com/v1"
                  />
                </div>
              )}

              {/* 模型选择 */}
              <div className="grid gap-2">
                <Label>模型</Label>
                {aiProvider === 'custom' ? (
                  <Input
                    value={aiModel}
                    onChange={(e) => setAiModel(e.target.value)}
                    placeholder="输入模型名称"
                  />
                ) : (
                  <Select value={aiModel} onValueChange={setAiModel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currentProviderConfig.models.map((model) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* API Key */}
              <div className="grid gap-2">
                <Label htmlFor="apiKey">
                  <div className="flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    API Key
                  </div>
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="apiKey"
                    type="password"
                    value={apiKey}
                    onChange={(e) => {
                      setApiKey(e.target.value)
                      setApiKeyValid(null)
                    }}
                    placeholder={currentProviderConfig.keyPrefix + '...'}
                    className="flex-1"
                  />
                  <Button 
                    variant="outline" 
                    onClick={validateApiKey}
                    disabled={validating}
                  >
                    {validating ? '验证中...' : '验证'}
                  </Button>
                </div>
                {apiKeyValid !== null && (
                  <div
                    className={cn(
                      'flex items-center gap-2 text-sm',
                      apiKeyValid ? 'text-green-600' : 'text-red-600'
                    )}
                  >
                    {apiKeyValid ? (
                      <>
                        <Check className="h-4 w-4" />
                        API Key 有效
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-4 w-4" />
                        API Key 无效
                      </>
                    )}
                  </div>
                )}
              </div>
              
              <p className="text-sm text-muted-foreground">
                API Key 仅保存在本地，不会上传到任何服务器。
                {currentProviderConfig.helpUrl && (
                  <a
                    href={currentProviderConfig.helpUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline ml-1"
                  >
                    获取 API Key
                  </a>
                )}
              </p>
            </CardContent>
          </Card>

          {/* Personal Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                个人信息
              </CardTitle>
              <CardDescription>用于生成定制化的求职素材</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">姓名</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="你的姓名"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">邮箱</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="summary">个人简介</Label>
                <Textarea
                  id="summary"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="简要介绍你自己..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Target */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                求职目标
              </CardTitle>
              <CardDescription>帮助 AI 更好地为你推荐和生成内容</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="targetRole">目标岗位</Label>
                  <Input
                    id="targetRole"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    placeholder="例如：前端工程师"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="years">工作年限</Label>
                  <Input
                    id="years"
                    type="number"
                    value={yearsOfExperience}
                    onChange={(e) => setYearsOfExperience(e.target.value)}
                    placeholder="年"
                    min={0}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="skills">技能标签</Label>
                <Input
                  id="skills"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="用逗号分隔，例如：React, TypeScript, Node.js"
                />
                <div className="flex flex-wrap gap-1 mt-2">
                  {skills
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean)
                    .map((skill, i) => (
                      <Badge key={i} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Appearance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {darkMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                外观
              </CardTitle>
              <CardDescription>自定义应用外观</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <Label>深色模式</Label>
                  <p className="text-sm text-muted-foreground">
                    切换明亮/深色主题
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setDarkMode(!darkMode)}
                >
                  {darkMode ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  )
}
