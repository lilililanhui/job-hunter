import { useState } from 'react'
import { Plus, Search, Filter, MoreHorizontal, Building2, Calendar, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn, formatDate, getStatusLabel } from '@/lib/utils'
import { useApplicationStore, useCompanyStore, useJobDescriptionStore } from '@/store'
import type { Application, ApplicationStatus } from '@/types'

const COLUMNS: { id: ApplicationStatus; title: string; color: string }[] = [
  { id: 'pending', title: '待投递', color: 'bg-gray-500' },
  { id: 'submitted', title: '已投递', color: 'bg-blue-500' },
  { id: 'reviewing', title: '简历筛选', color: 'bg-amber-500' },
  { id: 'interviewing', title: '面试中', color: 'bg-purple-500' },
  { id: 'offer', title: '已录用', color: 'bg-green-500' },
  { id: 'rejected', title: '已拒绝', color: 'bg-red-500' },
]

function ApplicationCard({ application }: { application: Application }) {
  const { updateApplicationStatus } = useApplicationStore()

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('applicationId', application.id)
  }

  return (
    <Card
      draggable
      onDragStart={handleDragStart}
      className="kanban-card cursor-grab active:cursor-grabbing mb-3"
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-sm">
              {application.company?.name || '未知公司'}
            </span>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
        
        <h4 className="font-semibold mb-2">
          {application.jobDescription?.title || '未知职位'}
        </h4>

        {application.matchScore && (
          <div className="mb-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                匹配度
              </span>
              <span>{application.matchScore}%</span>
            </div>
            <Progress value={application.matchScore} className="h-1.5" />
          </div>
        )}

        {application.appliedAt && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {formatDate(application.appliedAt)}
          </div>
        )}

        {application.notes && (
          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
            {application.notes}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function KanbanColumn({ 
  column, 
  applications 
}: { 
  column: typeof COLUMNS[0]
  applications: Application[] 
}) {
  const { updateApplicationStatus } = useApplicationStore()

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const applicationId = e.dataTransfer.getData('applicationId')
    if (applicationId) {
      updateApplicationStatus(applicationId, column.id)
    }
  }

  return (
    <div
      className="flex-shrink-0 w-72 bg-muted/50 rounded-lg p-3"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={cn('w-3 h-3 rounded-full', column.color)} />
          <h3 className="font-semibold">{column.title}</h3>
          <Badge variant="secondary" className="ml-1">
            {applications.length}
          </Badge>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-220px)]">
        <div className="pr-2">
          {applications.map((app) => (
            <ApplicationCard key={app.id} application={app} />
          ))}
          {applications.length === 0 && (
            <div className="text-center text-muted-foreground text-sm py-8">
              暂无记录
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

function AddApplicationDialog() {
  const [open, setOpen] = useState(false)
  const [company, setCompany] = useState('')
  const [position, setPosition] = useState('')
  const [requirements, setRequirements] = useState('')
  const [status, setStatus] = useState<ApplicationStatus>('pending')

  const companyStore = useCompanyStore()
  const jdStore = useJobDescriptionStore()
  const appStore = useApplicationStore()

  const handleSubmit = () => {
    if (!company || !position) return

    // 创建或查找公司
    let companyRecord = companyStore.companies.find(
      c => c.name.toLowerCase() === company.toLowerCase()
    )
    if (!companyRecord) {
      companyRecord = companyStore.addCompany({ name: company })
    }

    // 创建JD
    const jd = jdStore.addJobDescription({
      companyId: companyRecord.id,
      title: position,
      requirements,
    })

    // 创建投递记录
    appStore.addApplication({
      companyId: companyRecord.id,
      jobDescriptionId: jd.id,
      status,
    })

    // 重置表单
    setCompany('')
    setPosition('')
    setRequirements('')
    setStatus('pending')
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          添加投递
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>添加投递记录</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="company">公司名称 *</Label>
            <Input
              id="company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="输入公司名称"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="position">职位名称 *</Label>
            <Input
              id="position"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="输入职位名称"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="status">投递状态</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as ApplicationStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COLUMNS.map((col) => (
                  <SelectItem key={col.id} value={col.id}>
                    {col.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="requirements">职位要求 (JD)</Label>
            <Textarea
              id="requirements"
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              placeholder="粘贴职位描述..."
              rows={5}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={!company || !position}>
            添加
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function KanbanView() {
  const [searchQuery, setSearchQuery] = useState('')
  const { getApplicationsWithDetails } = useApplicationStore()
  
  const applications = getApplicationsWithDetails()
  
  // 按状态分组
  const applicationsByStatus = COLUMNS.reduce((acc, col) => {
    acc[col.id] = applications.filter((app) => {
      const matchesStatus = app.status === col.id
      const matchesSearch = !searchQuery || 
        app.company?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.jobDescription?.title.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesStatus && matchesSearch
    })
    return acc
  }, {} as Record<ApplicationStatus, Application[]>)

  // 统计
  const stats = {
    total: applications.length,
    interviewing: applications.filter(a => a.status === 'interviewing').length,
    offers: applications.filter(a => a.status === 'offer').length,
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b bg-card p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">投递看板</h1>
            <p className="text-muted-foreground">
              共 {stats.total} 条记录 · {stats.interviewing} 个面试中 · {stats.offers} 个Offer
            </p>
          </div>
          <AddApplicationDialog />
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索公司或职位..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto p-4">
        <div className="flex gap-4 h-full">
          {COLUMNS.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              applications={applicationsByStatus[column.id]}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
