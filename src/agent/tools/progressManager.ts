import { tool } from '@langchain/core/tools'
import { z } from 'zod'
import { 
  useApplicationStore,
  useCompanyStore,
  useJobDescriptionStore 
} from '@/store'
import type { ApplicationStatus } from '@/types'

// 添加投递记录工具
export const addApplicationTool = tool(
  async ({ company, position, status, requirements, notes }) => {
    const companyStore = useCompanyStore.getState()
    const jdStore = useJobDescriptionStore.getState()
    const appStore = useApplicationStore.getState()

    // 查找或创建公司
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
      requirements: requirements || '',
    })

    // 创建投递记录
    const application = appStore.addApplication({
      companyId: companyRecord.id,
      jobDescriptionId: jd.id,
      status: status as ApplicationStatus,
      notes,
    })

    return JSON.stringify({
      success: true,
      message: `已添加投递记录：${company} - ${position}`,
      applicationId: application.id,
    })
  },
  {
    name: 'add_application',
    description: '添加新的求职投递记录',
    schema: z.object({
      company: z.string().describe('公司名称'),
      position: z.string().describe('职位名称'),
      status: z.enum(['pending', 'submitted', 'reviewing', 'interviewing', 'offer', 'rejected'])
        .default('pending')
        .describe('投递状态'),
      requirements: z.string().optional().describe('职位要求/JD内容'),
      notes: z.string().optional().describe('备注信息'),
    }),
  }
)

// 更新投递状态工具
export const updateApplicationStatusTool = tool(
  async ({ applicationId, company, position, newStatus, notes }) => {
    const appStore = useApplicationStore.getState()
    
    let app = null
    
    // 优先通过ID查找
    if (applicationId) {
      app = appStore.getApplicationById(applicationId)
    }
    
    // 通过公司和职位查找
    if (!app && company) {
      const apps = appStore.getApplicationsWithDetails()
      app = apps.find(a => 
        a.company?.name.toLowerCase().includes(company.toLowerCase()) &&
        (!position || a.jobDescription?.title.toLowerCase().includes(position.toLowerCase()))
      )
    }

    if (!app) {
      return JSON.stringify({
        success: false,
        message: '未找到对应的投递记录',
      })
    }

    appStore.updateApplication(app.id, {
      status: newStatus as ApplicationStatus,
      notes: notes ? `${app.notes || ''}\n${notes}`.trim() : app.notes,
    })

    return JSON.stringify({
      success: true,
      message: `已更新状态：${newStatus}`,
      applicationId: app.id,
    })
  },
  {
    name: 'update_application_status',
    description: '更新投递记录的状态',
    schema: z.object({
      applicationId: z.string().optional().describe('投递记录ID'),
      company: z.string().optional().describe('公司名称（用于模糊查找）'),
      position: z.string().optional().describe('职位名称（用于模糊查找）'),
      newStatus: z.enum(['pending', 'submitted', 'reviewing', 'interviewing', 'offer', 'rejected'])
        .describe('新状态'),
      notes: z.string().optional().describe('状态更新备注'),
    }),
  }
)

// 查询投递记录工具
export const queryApplicationsTool = tool(
  async ({ status, company, limit }) => {
    const appStore = useApplicationStore.getState()
    let apps = appStore.getApplicationsWithDetails()

    // 按状态筛选
    if (status) {
      apps = apps.filter(a => a.status === status)
    }

    // 按公司筛选
    if (company) {
      apps = apps.filter(a => 
        a.company?.name.toLowerCase().includes(company.toLowerCase())
      )
    }

    // 限制数量
    if (limit) {
      apps = apps.slice(0, limit)
    }

    const result = apps.map(a => ({
      id: a.id,
      company: a.company?.name,
      position: a.jobDescription?.title,
      status: a.status,
      matchScore: a.matchScore,
      appliedAt: a.appliedAt,
      notes: a.notes,
    }))

    return JSON.stringify({
      success: true,
      count: result.length,
      applications: result,
    })
  },
  {
    name: 'query_applications',
    description: '查询投递记录',
    schema: z.object({
      status: z.enum(['pending', 'submitted', 'reviewing', 'interviewing', 'offer', 'rejected'])
        .optional()
        .describe('按状态筛选'),
      company: z.string().optional().describe('按公司名称筛选'),
      limit: z.number().optional().describe('返回数量限制'),
    }),
  }
)

// 获取投递统计工具
export const getApplicationStatsTool = tool(
  async () => {
    const appStore = useApplicationStore.getState()
    const apps = appStore.applications

    const stats = {
      total: apps.length,
      byStatus: {
        pending: apps.filter(a => a.status === 'pending').length,
        submitted: apps.filter(a => a.status === 'submitted').length,
        reviewing: apps.filter(a => a.status === 'reviewing').length,
        interviewing: apps.filter(a => a.status === 'interviewing').length,
        offer: apps.filter(a => a.status === 'offer').length,
        rejected: apps.filter(a => a.status === 'rejected').length,
      },
      avgMatchScore: apps.filter(a => a.matchScore)
        .reduce((sum, a) => sum + (a.matchScore || 0), 0) / 
        (apps.filter(a => a.matchScore).length || 1),
    }

    return JSON.stringify({
      success: true,
      stats,
    })
  },
  {
    name: 'get_application_stats',
    description: '获取投递统计数据',
    schema: z.object({}),
  }
)

export const progressManagerTools = [
  addApplicationTool,
  updateApplicationStatusTool,
  queryApplicationsTool,
  getApplicationStatsTool,
]
