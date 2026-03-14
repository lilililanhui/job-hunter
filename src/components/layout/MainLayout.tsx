import { Sidebar } from './Sidebar'
import { useAppStore } from '@/store'
import { KanbanView } from '@/components/views/KanbanView'
import { ChatView } from '@/components/views/ChatView'
import { ResumeView } from '@/components/views/ResumeView'
import { SettingsView } from '@/components/views/SettingsView'

export function MainLayout() {
  const { currentView } = useAppStore()

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        {currentView === 'kanban' && <KanbanView />}
        {currentView === 'chat' && <ChatView />}
        {currentView === 'resume' && <ResumeView />}
        {currentView === 'settings' && <SettingsView />}
      </main>
    </div>
  )
}
