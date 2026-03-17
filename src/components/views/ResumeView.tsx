import { useState, useRef } from 'react'
import { 
  Plus, 
  FileText, 
  Star, 
  Edit, 
  Trash2, 
  FolderPlus,
  Briefcase,
  Check,
  Upload,
  FileUp,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { cn, formatDate } from '@/lib/utils'
import { useResumeStore, useProjectStore } from '@/store'
import type { Resume, Project } from '@/types'
import { extractTextFromPDF, isPDFFile, formatFileSize } from '@/lib/pdfParser'

function ResumeCard({ resume, onEdit }: { resume: Resume; onEdit: (r: Resume) => void }) {
  const { setDefaultResume, deleteResume } = useResumeStore()

  return (
    <Card className={cn(resume.isDefault && 'border-primary')}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-base">{resume.name}</CardTitle>
              <CardDescription>版本: {resume.version}</CardDescription>
            </div>
          </div>
          {resume.isDefault && (
            <Badge variant="default">
              <Star className="h-3 w-3 mr-1" />
              默认
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
          {resume.content.slice(0, 150)}...
        </p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            更新于 {formatDate(resume.updatedAt)}
          </span>
          <div className="flex gap-2">
            {!resume.isDefault && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDefaultResume(resume.id)}
              >
                <Check className="h-4 w-4 mr-1" />
                设为默认
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={() => onEdit(resume)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => deleteResume(resume.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ProjectCard({ project, onEdit }: { project: Project; onEdit: (p: Project) => void }) {
  const { deleteProject } = useProjectStore()

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-base">{project.name}</CardTitle>
              <CardDescription>{project.role}</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-3">
          {project.description}
        </p>
        <div className="flex flex-wrap gap-1 mb-3">
          {project.technologies.slice(0, 5).map((tech, i) => (
            <Badge key={i} variant="secondary" className="text-xs">
              {tech}
            </Badge>
          ))}
          {project.technologies.length > 5 && (
            <Badge variant="outline" className="text-xs">
              +{project.technologies.length - 5}
            </Badge>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {project.achievements.length} 个成就
          </span>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={() => onEdit(project)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => deleteProject(project.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function AddResumeDialog() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [version, setVersion] = useState('1.0')
  const [content, setContent] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: number } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { addResume, resumes } = useResumeStore()

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!isPDFFile(file)) {
      alert('请上传 PDF 格式的文件')
      return
    }

    setUploading(true)
    setUploadedFile({ name: file.name, size: file.size })

    try {
      const extractedText = await extractTextFromPDF(file)
      setContent(extractedText)
      
      // 如果没有设置名称，使用文件名
      if (!name) {
        const fileName = file.name.replace(/\.pdf$/i, '')
        setName(fileName)
      }
    } catch (error) {
      console.error('PDF 解析失败:', error)
      alert('PDF 解析失败，请尝试手动输入简历内容')
      setUploadedFile(null)
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = () => {
    if (!name || !content) return

    addResume({
      name,
      version,
      content,
      isDefault: resumes.length === 0,
    })

    setName('')
    setVersion('1.0')
    setContent('')
    setUploadedFile(null)
    setOpen(false)
  }

  const handleClose = () => {
    setName('')
    setVersion('1.0')
    setContent('')
    setUploadedFile(null)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => isOpen ? setOpen(true) : handleClose()}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          添加简历
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>添加简历</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4 overflow-y-auto flex-1">
          {/* PDF 上传区域 */}
          <div className="grid gap-2">
            <Label>上传 PDF 简历</Label>
            <div
              className={cn(
                'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
                'hover:border-primary hover:bg-primary/5',
                uploading && 'pointer-events-none opacity-60'
              )}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
              {uploading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  <p className="text-sm text-muted-foreground">正在解析 PDF...</p>
                </div>
              ) : uploadedFile ? (
                <div className="flex flex-col items-center gap-2">
                  <FileText className="h-8 w-8 text-green-500" />
                  <p className="text-sm font-medium">{uploadedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(uploadedFile.size)} · 已解析
                  </p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={(e) => {
                      e.stopPropagation()
                      setUploadedFile(null)
                      setContent('')
                      if (fileInputRef.current) {
                        fileInputRef.current.value = ''
                      }
                    }}
                  >
                    重新选择
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <FileUp className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-medium">点击或拖拽上传 PDF 简历</p>
                  <p className="text-xs text-muted-foreground">
                    支持 PDF 格式，自动提取文本内容
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                或手动输入
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">简历名称 *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：前端工程师简历"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="version">版本号</Label>
              <Input
                id="version"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="1.0"
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="content">简历内容 *</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="粘贴你的简历内容（支持 Markdown 格式）或上传 PDF 文件自动提取..."
              rows={10}
              className="font-mono text-sm"
            />
            {content && (
              <p className="text-xs text-muted-foreground text-right">
                {content.length} 字符
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={!name || !content}>
            添加
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function AddProjectDialog() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [description, setDescription] = useState('')
  const [technologies, setTechnologies] = useState('')
  const [achievements, setAchievements] = useState('')

  const { addProject } = useProjectStore()

  const handleSubmit = () => {
    if (!name || !role || !description) return

    addProject({
      name,
      role,
      description,
      technologies: technologies.split(',').map((t) => t.trim()).filter(Boolean),
      achievements: achievements.split('\n').map((a) => a.trim()).filter(Boolean),
    })

    setName('')
    setRole('')
    setDescription('')
    setTechnologies('')
    setAchievements('')
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <FolderPlus className="h-4 w-4 mr-2" />
          添加项目
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>添加项目经历</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="proj-name">项目名称 *</Label>
              <Input
                id="proj-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="项目名称"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="proj-role">担任角色 *</Label>
              <Input
                id="proj-role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="例如：前端负责人"
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="proj-desc">项目描述 *</Label>
            <Textarea
              id="proj-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="简要描述项目背景和你的工作..."
              rows={3}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="proj-tech">技术栈</Label>
            <Input
              id="proj-tech"
              value={technologies}
              onChange={(e) => setTechnologies(e.target.value)}
              placeholder="用逗号分隔，例如：React, TypeScript, Node.js"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="proj-ach">成就亮点（STAR格式）</Label>
            <Textarea
              id="proj-ach"
              value={achievements}
              onChange={(e) => setAchievements(e.target.value)}
              placeholder="每行一个成就，例如：&#10;主导重构项目，性能提升50%&#10;独立完成核心模块开发"
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={!name || !role || !description}>
            添加
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// 编辑简历对话框
function EditResumeDialog({ 
  resume, 
  open, 
  onOpenChange 
}: { 
  resume: Resume | null
  open: boolean
  onOpenChange: (open: boolean) => void 
}) {
  const { updateResume } = useResumeStore()
  const [name, setName] = useState(resume?.name || '')
  const [version, setVersion] = useState(resume?.version || '')
  const [content, setContent] = useState(resume?.content || '')

  // 当 resume 变化时更新表单
  useState(() => {
    if (resume) {
      setName(resume.name)
      setVersion(resume.version)
      setContent(resume.content)
    }
  })

  const handleSubmit = () => {
    if (!resume || !name || !content) return
    
    updateResume(resume.id, { name, version, content })
    onOpenChange(false)
  }

  if (!resume) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>编辑简历</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">简历名称 *</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：前端工程师简历"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-version">版本号</Label>
              <Input
                id="edit-version"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="1.0"
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-content">简历内容 *</Label>
            <Textarea
              id="edit-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="简历内容..."
              rows={12}
              className="font-mono text-sm"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={!name || !content}>
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function ResumeView() {
  const { resumes } = useResumeStore()
  const { projects } = useProjectStore()
  const [editingResume, setEditingResume] = useState<Resume | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  const handleEditResume = (resume: Resume) => {
    setEditingResume(resume)
    setEditDialogOpen(true)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b bg-card p-4">
        <h1 className="text-2xl font-bold mb-1">简历管理</h1>
        <p className="text-muted-foreground">
          管理你的简历和项目经历，用于 AI 生成素材
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="resumes" className="h-full flex flex-col">
          <div className="border-b px-4">
            <TabsList className="h-12">
              <TabsTrigger value="resumes" className="gap-2">
                <FileText className="h-4 w-4" />
                简历 ({resumes.length})
              </TabsTrigger>
              <TabsTrigger value="projects" className="gap-2">
                <Briefcase className="h-4 w-4" />
                项目经历 ({projects.length})
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="resumes" className="flex-1 overflow-hidden m-0">
            <ScrollArea className="h-full">
              <div className="p-4">
                <div className="flex justify-end mb-4">
                  <AddResumeDialog />
                </div>
                
                {resumes.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">还没有简历</h3>
                    <p className="text-muted-foreground mb-4">
                      添加你的简历，让 AI 更好地为你生成素材
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      支持上传 PDF 文件或手动输入
                    </p>
                    <AddResumeDialog />
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {resumes.map((resume) => (
                      <ResumeCard
                        key={resume.id}
                        resume={resume}
                        onEdit={handleEditResume}
                      />
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="projects" className="flex-1 overflow-hidden m-0">
            <ScrollArea className="h-full">
              <div className="p-4">
                <div className="flex justify-end mb-4">
                  <AddProjectDialog />
                </div>
                
                {projects.length === 0 ? (
                  <div className="text-center py-12">
                    <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">还没有项目经历</h3>
                    <p className="text-muted-foreground mb-4">
                      添加你的项目经历，用于生成 STAR 格式的面试回答
                    </p>
                    <AddProjectDialog />
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {projects.map((project) => (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        onEdit={() => {}}
                      />
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>

      {/* 编辑简历对话框 */}
      <EditResumeDialog 
        resume={editingResume}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />
    </div>
  )
}
