import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type {
  Application,
  ApplicationStatus,
  ChatMessage,
  Company,
  GeneratedMaterial,
  Interview,
  InterviewQuestion,
  JobDescription,
  Project,
  Resume,
  UserProfile,
} from '@/types'
import { generateId } from '@/lib/utils'

// ==================== 应用状态 Store ====================
interface AppState {
  // 当前视图
  currentView: 'kanban' | 'chat' | 'resume' | 'settings'
  setCurrentView: (view: AppState['currentView']) => void
  
  // 选中的应用
  selectedApplicationId: string | null
  setSelectedApplicationId: (id: string | null) => void
  
  // 侧边栏状态
  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
  
  // 暗色模式
  darkMode: boolean
  setDarkMode: (dark: boolean) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      currentView: 'kanban',
      setCurrentView: (view) => set({ currentView: view }),
      
      selectedApplicationId: null,
      setSelectedApplicationId: (id) => set({ selectedApplicationId: id }),
      
      sidebarCollapsed: false,
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      
      darkMode: false,
      setDarkMode: (dark) => set({ darkMode: dark }),
    }),
    {
      name: 'job-hunter-app-state',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

// ==================== 用户数据 Store ====================
interface UserStore {
  profile: UserProfile | null
  setProfile: (profile: UserProfile) => void
  updateProfile: (updates: Partial<UserProfile>) => void
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      profile: null,
      setProfile: (profile) => set({ profile }),
      updateProfile: (updates) =>
        set((state) => ({
          profile: state.profile
            ? { ...state.profile, ...updates, updatedAt: new Date().toISOString() }
            : null,
        })),
    }),
    {
      name: 'job-hunter-user',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

// ==================== 公司数据 Store ====================
interface CompanyStore {
  companies: Company[]
  addCompany: (company: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>) => Company
  updateCompany: (id: string, updates: Partial<Company>) => void
  deleteCompany: (id: string) => void
  getCompanyById: (id: string) => Company | undefined
}

export const useCompanyStore = create<CompanyStore>()(
  persist(
    (set, get) => ({
      companies: [],
      addCompany: (companyData) => {
        const now = new Date().toISOString()
        const company: Company = {
          ...companyData,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
        }
        set((state) => ({ companies: [...state.companies, company] }))
        return company
      },
      updateCompany: (id, updates) =>
        set((state) => ({
          companies: state.companies.map((c) =>
            c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
          ),
        })),
      deleteCompany: (id) =>
        set((state) => ({
          companies: state.companies.filter((c) => c.id !== id),
        })),
      getCompanyById: (id) => get().companies.find((c) => c.id === id),
    }),
    {
      name: 'job-hunter-companies',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

// ==================== JD数据 Store ====================
interface JobDescriptionStore {
  jobDescriptions: JobDescription[]
  addJobDescription: (jd: Omit<JobDescription, 'id' | 'createdAt' | 'updatedAt'>) => JobDescription
  updateJobDescription: (id: string, updates: Partial<JobDescription>) => void
  deleteJobDescription: (id: string) => void
  getJobDescriptionById: (id: string) => JobDescription | undefined
  getJobDescriptionsByCompany: (companyId: string) => JobDescription[]
}

export const useJobDescriptionStore = create<JobDescriptionStore>()(
  persist(
    (set, get) => ({
      jobDescriptions: [],
      addJobDescription: (jdData) => {
        const now = new Date().toISOString()
        const jd: JobDescription = {
          ...jdData,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
        }
        set((state) => ({ jobDescriptions: [...state.jobDescriptions, jd] }))
        return jd
      },
      updateJobDescription: (id, updates) =>
        set((state) => ({
          jobDescriptions: state.jobDescriptions.map((j) =>
            j.id === id ? { ...j, ...updates, updatedAt: new Date().toISOString() } : j
          ),
        })),
      deleteJobDescription: (id) =>
        set((state) => ({
          jobDescriptions: state.jobDescriptions.filter((j) => j.id !== id),
        })),
      getJobDescriptionById: (id) => get().jobDescriptions.find((j) => j.id === id),
      getJobDescriptionsByCompany: (companyId) =>
        get().jobDescriptions.filter((j) => j.companyId === companyId),
    }),
    {
      name: 'job-hunter-jds',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

// ==================== 投递记录 Store ====================
interface ApplicationStore {
  applications: Application[]
  addApplication: (app: Omit<Application, 'id' | 'createdAt' | 'updatedAt'>) => Application
  updateApplication: (id: string, updates: Partial<Application>) => void
  updateApplicationStatus: (id: string, status: ApplicationStatus) => void
  deleteApplication: (id: string) => void
  getApplicationById: (id: string) => Application | undefined
  getApplicationsByStatus: (status: ApplicationStatus) => Application[]
  getApplicationsWithDetails: () => Application[]
}

export const useApplicationStore = create<ApplicationStore>()(
  persist(
    (set, get) => ({
      applications: [],
      addApplication: (appData) => {
        const now = new Date().toISOString()
        const app: Application = {
          ...appData,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
        }
        set((state) => ({ applications: [...state.applications, app] }))
        return app
      },
      updateApplication: (id, updates) =>
        set((state) => ({
          applications: state.applications.map((a) =>
            a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a
          ),
        })),
      updateApplicationStatus: (id, status) =>
        set((state) => ({
          applications: state.applications.map((a) =>
            a.id === id
              ? {
                  ...a,
                  status,
                  appliedAt: status === 'submitted' && !a.appliedAt ? new Date().toISOString() : a.appliedAt,
                  updatedAt: new Date().toISOString(),
                }
              : a
          ),
        })),
      deleteApplication: (id) =>
        set((state) => ({
          applications: state.applications.filter((a) => a.id !== id),
        })),
      getApplicationById: (id) => get().applications.find((a) => a.id === id),
      getApplicationsByStatus: (status) => get().applications.filter((a) => a.status === status),
      getApplicationsWithDetails: () => {
        const { companies } = useCompanyStore.getState()
        const { jobDescriptions } = useJobDescriptionStore.getState()
        const { interviews } = useInterviewStore.getState()
        
        return get().applications.map((app) => ({
          ...app,
          company: companies.find((c) => c.id === app.companyId),
          jobDescription: jobDescriptions.find((j) => j.id === app.jobDescriptionId),
          interviews: interviews.filter((i) => i.applicationId === app.id),
        }))
      },
    }),
    {
      name: 'job-hunter-applications',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

// ==================== 面试记录 Store ====================
interface InterviewStore {
  interviews: Interview[]
  addInterview: (interview: Omit<Interview, 'id' | 'createdAt' | 'updatedAt'>) => Interview
  updateInterview: (id: string, updates: Partial<Interview>) => void
  deleteInterview: (id: string) => void
  getInterviewById: (id: string) => Interview | undefined
  getInterviewsByApplication: (applicationId: string) => Interview[]
}

export const useInterviewStore = create<InterviewStore>()(
  persist(
    (set, get) => ({
      interviews: [],
      addInterview: (interviewData) => {
        const now = new Date().toISOString()
        const interview: Interview = {
          ...interviewData,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
        }
        set((state) => ({ interviews: [...state.interviews, interview] }))
        return interview
      },
      updateInterview: (id, updates) =>
        set((state) => ({
          interviews: state.interviews.map((i) =>
            i.id === id ? { ...i, ...updates, updatedAt: new Date().toISOString() } : i
          ),
        })),
      deleteInterview: (id) =>
        set((state) => ({
          interviews: state.interviews.filter((i) => i.id !== id),
        })),
      getInterviewById: (id) => get().interviews.find((i) => i.id === id),
      getInterviewsByApplication: (applicationId) =>
        get().interviews.filter((i) => i.applicationId === applicationId),
    }),
    {
      name: 'job-hunter-interviews',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

// ==================== 面试问题 Store ====================
interface QuestionStore {
  questions: InterviewQuestion[]
  addQuestion: (question: Omit<InterviewQuestion, 'id' | 'createdAt' | 'updatedAt'>) => InterviewQuestion
  updateQuestion: (id: string, updates: Partial<InterviewQuestion>) => void
  deleteQuestion: (id: string) => void
  getQuestionsByInterview: (interviewId: string) => InterviewQuestion[]
  getQuestionsByCategory: (category: string) => InterviewQuestion[]
}

export const useQuestionStore = create<QuestionStore>()(
  persist(
    (set, get) => ({
      questions: [],
      addQuestion: (questionData) => {
        const now = new Date().toISOString()
        const question: InterviewQuestion = {
          ...questionData,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
        }
        set((state) => ({ questions: [...state.questions, question] }))
        return question
      },
      updateQuestion: (id, updates) =>
        set((state) => ({
          questions: state.questions.map((q) =>
            q.id === id ? { ...q, ...updates, updatedAt: new Date().toISOString() } : q
          ),
        })),
      deleteQuestion: (id) =>
        set((state) => ({
          questions: state.questions.filter((q) => q.id !== id),
        })),
      getQuestionsByInterview: (interviewId) =>
        get().questions.filter((q) => q.interviewId === interviewId),
      getQuestionsByCategory: (category) =>
        get().questions.filter((q) => q.category === category),
    }),
    {
      name: 'job-hunter-questions',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

// ==================== 简历 Store ====================
interface ResumeStore {
  resumes: Resume[]
  addResume: (resume: Omit<Resume, 'id' | 'createdAt' | 'updatedAt'>) => Resume
  updateResume: (id: string, updates: Partial<Resume>) => void
  deleteResume: (id: string) => void
  getDefaultResume: () => Resume | undefined
  setDefaultResume: (id: string) => void
}

export const useResumeStore = create<ResumeStore>()(
  persist(
    (set, get) => ({
      resumes: [],
      addResume: (resumeData) => {
        const now = new Date().toISOString()
        const resume: Resume = {
          ...resumeData,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
        }
        set((state) => ({ resumes: [...state.resumes, resume] }))
        return resume
      },
      updateResume: (id, updates) =>
        set((state) => ({
          resumes: state.resumes.map((r) =>
            r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r
          ),
        })),
      deleteResume: (id) =>
        set((state) => ({
          resumes: state.resumes.filter((r) => r.id !== id),
        })),
      getDefaultResume: () => get().resumes.find((r) => r.isDefault),
      setDefaultResume: (id) =>
        set((state) => ({
          resumes: state.resumes.map((r) => ({
            ...r,
            isDefault: r.id === id,
            updatedAt: new Date().toISOString(),
          })),
        })),
    }),
    {
      name: 'job-hunter-resumes',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

// ==================== 项目经历 Store ====================
interface ProjectStore {
  projects: Project[]
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Project
  updateProject: (id: string, updates: Partial<Project>) => void
  deleteProject: (id: string) => void
}

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set) => ({
      projects: [],
      addProject: (projectData) => {
        const now = new Date().toISOString()
        const project: Project = {
          ...projectData,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
        }
        set((state) => ({ projects: [...state.projects, project] }))
        return project
      },
      updateProject: (id, updates) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
          ),
        })),
      deleteProject: (id) =>
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
        })),
    }),
    {
      name: 'job-hunter-projects',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

// ==================== 聊天记录 Store ====================
interface ChatStore {
  messages: ChatMessage[]
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => ChatMessage
  clearMessages: () => void
  getRecentMessages: (count: number) => ChatMessage[]
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      messages: [],
      addMessage: (messageData) => {
        const message: ChatMessage = {
          ...messageData,
          id: generateId(),
          timestamp: new Date().toISOString(),
        }
        set((state) => ({ messages: [...state.messages, message] }))
        return message
      },
      clearMessages: () => set({ messages: [] }),
      getRecentMessages: (count) => get().messages.slice(-count),
    }),
    {
      name: 'job-hunter-chat',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

// ==================== 生成素材 Store ====================
interface MaterialStore {
  materials: GeneratedMaterial[]
  addMaterial: (material: Omit<GeneratedMaterial, 'id' | 'createdAt'>) => GeneratedMaterial
  deleteMaterial: (id: string) => void
  getMaterialsByType: (type: GeneratedMaterial['type']) => GeneratedMaterial[]
  getMaterialsByJob: (jobId: string) => GeneratedMaterial[]
}

export const useMaterialStore = create<MaterialStore>()(
  persist(
    (set, get) => ({
      materials: [],
      addMaterial: (materialData) => {
        const material: GeneratedMaterial = {
          ...materialData,
          id: generateId(),
          createdAt: new Date().toISOString(),
        }
        set((state) => ({ materials: [...state.materials, material] }))
        return material
      },
      deleteMaterial: (id) =>
        set((state) => ({
          materials: state.materials.filter((m) => m.id !== id),
        })),
      getMaterialsByType: (type) => get().materials.filter((m) => m.type === type),
      getMaterialsByJob: (jobId) => get().materials.filter((m) => m.targetJobId === jobId),
    }),
    {
      name: 'job-hunter-materials',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
