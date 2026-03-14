// 投递状态枚举
export type ApplicationStatus = 
  | 'pending'      // 待投递
  | 'submitted'    // 已投递
  | 'reviewing'    // 简历筛选
  | 'interviewing' // 面试中
  | 'offer'        // 已录用
  | 'rejected'     // 已拒绝
  | 'withdrawn'    // 已撤回

// 面试轮次类型
export type InterviewRound = 
  | 'phone'        // 电话面试
  | 'hr'           // HR面试
  | 'tech1'        // 一面
  | 'tech2'        // 二面
  | 'tech3'        // 三面
  | 'final'        // 终面
  | 'other'        // 其他

// 公司信息
export interface Company {
  id: string
  name: string
  industry?: string
  size?: string
  website?: string
  location?: string
  description?: string
  createdAt: string
  updatedAt: string
}

// 职位描述
export interface JobDescription {
  id: string
  companyId: string
  title: string
  department?: string
  location?: string
  salaryRange?: string
  requirements: string
  responsibilities?: string
  benefits?: string
  source?: string  // 来源平台
  sourceUrl?: string
  rawContent?: string  // 原始JD文本
  createdAt: string
  updatedAt: string
}

// 投递记录
export interface Application {
  id: string
  companyId: string
  jobDescriptionId: string
  status: ApplicationStatus
  matchScore?: number  // 匹配度分数
  appliedAt?: string
  resumeVersion?: string
  coverLetter?: string
  notes?: string
  createdAt: string
  updatedAt: string
  // 关联数据（前端使用）
  company?: Company
  jobDescription?: JobDescription
  interviews?: Interview[]
}

// 面试记录
export interface Interview {
  id: string
  applicationId: string
  round: InterviewRound
  scheduledAt?: string
  duration?: number  // 分钟
  interviewers?: string
  mode?: 'onsite' | 'remote' | 'phone'
  feedback?: string
  result?: 'pass' | 'fail' | 'pending'
  notes?: string
  questions?: InterviewQuestion[]
  createdAt: string
  updatedAt: string
}

// 面试问题
export interface InterviewQuestion {
  id: string
  interviewId?: string
  category: string  // 技术/行为/项目/其他
  question: string
  answer?: string   // 我的回答
  standardAnswer?: string  // AI生成的标准答案
  rating?: number   // 1-5
  notes?: string
  createdAt: string
  updatedAt: string
}

// 用户简历
export interface Resume {
  id: string
  name: string
  version: string
  content: string  // Markdown或JSON格式
  isDefault: boolean
  tags?: string[]
  createdAt: string
  updatedAt: string
}

// 项目经历
export interface Project {
  id: string
  name: string
  role: string
  description: string
  technologies: string[]
  achievements: string[]  // STAR格式的成就
  startDate?: string
  endDate?: string
  createdAt: string
  updatedAt: string
}

// 用户配置
export interface UserProfile {
  id: string
  name: string
  email?: string
  phone?: string
  targetRole?: string
  targetIndustry?: string[]
  targetSalary?: string
  skills?: string[]
  yearsOfExperience?: number
  education?: string
  summary?: string
  openAIApiKey?: string
  createdAt: string
  updatedAt: string
}

// 聊天消息
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  metadata?: {
    toolCalls?: string[]
    applicationId?: string
    interviewId?: string
  }
}

// 生成的素材
export interface GeneratedMaterial {
  id: string
  type: 'intro' | 'answer' | 'cover_letter' | 'follow_up'
  targetJobId?: string
  duration?: string  // 1min, 3min, 5min (仅自我介绍)
  content: string
  prompt?: string
  createdAt: string
}

// 看板列配置
export interface KanbanColumn {
  id: ApplicationStatus
  title: string
  color: string
  applications: Application[]
}
