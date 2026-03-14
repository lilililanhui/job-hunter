import { useEffect } from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
import { useAppStore } from '@/store'
import { TooltipProvider } from '@/components/ui/tooltip'

function App() {
  const { darkMode } = useAppStore()

  // 初始化主题
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  return (
    <TooltipProvider>
      <MainLayout />
    </TooltipProvider>
  )
}

export default App
