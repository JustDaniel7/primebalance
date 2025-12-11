'use client'

import { useStore } from '@/store'
import { useThemeStore } from '@/store/theme-store'
import Sidebar from './Sidebar'
import Header from './Header'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { sidebarMode, sidebarExpanded } = useThemeStore();
  
  // Calculate main content margin based on sidebar mode
  const getMainMargin = () => {
    switch (sidebarMode) {
      case 'expanded':
        return 'lg:ml-72';
      case 'collapsed':
        return 'lg:ml-20';
      case 'autohide':
        return 'lg:ml-0';
      default:
        return 'lg:ml-72';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-950 transition-colors duration-300">
      <Sidebar />
      {/* Responsive margin based on sidebar state */}
      <div className={`ml-0 ${getMainMargin()} transition-all duration-300`}>
        <Header />
        <main className="p-4 lg:p-8 pt-20 lg:pt-8">{children}</main>
      </div>
    </div>
  )
}