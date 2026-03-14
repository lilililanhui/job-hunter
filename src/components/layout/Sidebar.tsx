import { 
  LayoutDashboard, 
  MessageSquare, 
  FileText, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Briefcase
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useAppStore } from '@/store'

const menuItems = [
  { id: 'kanban' as const, label: '投递看板', icon: LayoutDashboard },
  { id: 'chat' as const, label: 'AI 助手', icon: MessageSquare },
  { id: 'resume' as const, label: '简历管理', icon: FileText },
  { id: 'settings' as const, label: '设置', icon: Settings },
]

export function Sidebar() {
  const { currentView, setCurrentView, sidebarCollapsed, setSidebarCollapsed } = useAppStore()

  return (
    <aside
      className={cn(
        'h-screen bg-card border-r flex flex-col transition-all duration-300',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b">
        <Briefcase className="h-8 w-8 text-primary shrink-0" />
        {!sidebarCollapsed && (
          <span className="ml-3 font-bold text-xl">求职助手</span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <Button
            key={item.id}
            variant={currentView === item.id ? 'secondary' : 'ghost'}
            className={cn(
              'w-full justify-start',
              sidebarCollapsed && 'justify-center px-2'
            )}
            onClick={() => setCurrentView(item.id)}
          >
            <item.icon className={cn('h-5 w-5', !sidebarCollapsed && 'mr-3')} />
            {!sidebarCollapsed && item.label}
          </Button>
        ))}
      </nav>

      <Separator />

      {/* Collapse Toggle */}
      <div className="p-4">
        <Button
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 mr-2" />
              收起
            </>
          )}
        </Button>
      </div>
    </aside>
  )
}
