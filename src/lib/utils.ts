import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function generateId(): string {
  return crypto.randomUUID()
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'bg-gray-500',
    submitted: 'bg-blue-500',
    reviewing: 'bg-amber-500',
    interviewing: 'bg-purple-500',
    offer: 'bg-green-500',
    rejected: 'bg-red-500',
    withdrawn: 'bg-gray-400',
  }
  return colors[status] || 'bg-gray-500'
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: '待投递',
    submitted: '已投递',
    reviewing: '简历筛选',
    interviewing: '面试中',
    offer: '已录用',
    rejected: '已拒绝',
    withdrawn: '已撤回',
  }
  return labels[status] || status
}
