'use client'

import { useStore } from '@/index'
import Sidebar from './Sidebar'
import Header from './Header'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { sidebarOpen } = useStore()

  return (
    <div className="min-h-screen bg-surface-950">
      <Sidebar />
      <div
        className={`transition-all duration-300 ${
          sidebarOpen ? 'lg:ml-72' : ''
        }`}
      >
        <Header />
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
