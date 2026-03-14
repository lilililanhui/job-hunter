import { useState, useEffect } from 'react'
import { Save, Key, User, Target, Check, AlertCircle, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useUserStore, useAppStore } from '@/store'
import { reinitializeAgent, getAgent } from '@/agent/orchestrator'

export function SettingsView() {
  const { profile, setProfile, updateProfile } = useUserStore()
  const { darkMode, setDarkMode } = useAppStore()
  
  const [apiKey, setApiKey] = useState(profile?.openAIApiKey || '')
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

  // 初始化个人资料
  useEffect(() => {
    if (!profile) {
      const now = new Date().toISOString()
      setProfile({
        id: crypto.randomUUID(),
        name: '',
        createdAt: now,
        updatedAt: now,
      })
    }
  }, [])

  // 验证 API Key
  const validateApiKey = async () => {
    if (!apiKey) {
      setApiKeyValid(null)
      return
    }

    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      })
      setApiKeyValid(response.ok)
      
      if (response.ok) {
        reinitializeAgent(apiKey)
      }
    } catch {
      setApiKeyValid(false)
    }
  }

  const handleSave = () => {
    updateProfile({
      openAIApiKey: apiKey,
      name,
      email,
      targetRole,
      skills: skills.split(',').map((s) => s.trim()).filter(Boolean),
      yearsOfExperience: yearsOfExperience ? parseInt(yearsOfExperience) : undefined,
      summary,
    })

    if (apiKey && apiKey !== profile?.openAIApiKey) {
      reinitializeAgent(apiKey)
      validateApiKey()
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
            <p className="text-muted-foreground">配置你的个人信息和 API 密钥</p>
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
          {/* API Key */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                OpenAI API Key
              </CardTitle>
              <CardDescription>
                配置 OpenAI API Key 以启用 AI 功能
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="apiKey">API Key</Label>
                <div className="flex gap-2">
                  <Input
                    id="apiKey"
                    type="password"
                    value={apiKey}
                    onChange={(e) => {
                      setApiKey(e.target.value)
                      setApiKeyValid(null)
                    }}
                    placeholder="sk-..."
                    className="flex-1"
                  />
                  <Button variant="outline" onClick={validateApiKey}>
                    验证
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
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline ml-1"
                >
                  获取 API Key
                </a>
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
