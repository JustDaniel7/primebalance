'use client'

import { useStore } from '@/store'
import Sidebar from './Sidebar'
import Header from './Header'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-surface-950">
      <Sidebar />
      {/* ml-0 on mobile, ml-[70px] on tablet, ml-72 on desktop */}
      <div className="ml-0 lg:ml-72 transition-all duration-300">
        <Header />
        <main className="p-4 lg:p-8 pt-20 lg:pt-8">{children}</main>
      </div>
    </div>
  )
}