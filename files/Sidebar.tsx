'use client'

import { useStore } from '@/store'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  DashboardIcon,
  TransactionsIcon,
  AccountsIcon,
  WalletIcon,
  ReportsIcon,
  ReceiptIcon,
  AIIcon,
  ChatIcon,
  SettingsIcon,
  TaxIcon,
  MenuIcon,
  CloseIcon,
  SparklesIcon,
} from '@/components/ui/Icons'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: DashboardIcon },
  { name: 'Transactions', href: '/dashboard/transactions', icon: TransactionsIcon },
  { name: 'Accounts', href: '/dashboard/accounts', icon: AccountsIcon },
  { name: 'Wallet & Crypto', href: '/dashboard/wallet', icon: WalletIcon },
  { name: 'Receipts', href: '/dashboard/receipts', icon: ReceiptIcon },
  { name: 'Reports', href: '/dashboard/reports', icon: ReportsIcon },
  { name: 'Tax Center', href: '/dashboard/tax', icon: TaxIcon },
]

const secondaryNavigation = [
  { name: 'AI Assistant', href: '/dashboard/assistant', icon: AIIcon },
  { name: 'Team Chat', href: '/dashboard/chat', icon: ChatIcon },
  { name: 'Settings', href: '/dashboard/settings', icon: SettingsIcon },
]

export default function Sidebar() {
  const { sidebarOpen, setSidebarOpen, user } = useStore()
  const pathname = usePathname()

  return (
    <>
      {/* Mobile backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile toggle button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-xl bg-surface-900/90 border border-surface-700 shadow-lg"
      >
        {sidebarOpen ? <CloseIcon size={20} /> : <MenuIcon size={20} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-40 h-screen
          w-72 transition-transform duration-300 ease-out
          lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full bg-surface-950/95 border-r border-surface-800/50 backdrop-blur-xl">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 h-20 border-b border-surface-800/50">
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/20">
              <span className="text-xl font-bold text-surface-950">F</span>
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent-500 flex items-center justify-center">
                <SparklesIcon size={10} className="text-surface-950" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-surface-100 font-display">FinBook</h1>
              <p className="text-xs text-surface-500">AI-Powered Accounting</p>
            </div>
          </div>

          {/* Main navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto scrollbar-hide">
            <div className="mb-4">
              <p className="px-4 text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2">
                Main
              </p>
              {navigation.map((item) => {
                const isActive = pathname === item.href || 
                  (item.href !== '/dashboard' && pathname.startsWith(item.href))
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-xl
                      text-sm font-medium transition-all duration-200
                      ${isActive
                        ? 'text-primary-400 bg-primary-500/10 shadow-inner-light'
                        : 'text-surface-400 hover:text-surface-100 hover:bg-surface-800/50'
                      }
                    `}
                  >
                    <item.icon
                      size={20}
                      className={isActive ? 'text-primary-400' : 'text-surface-500'}
                    />
                    {item.name}
                    {isActive && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-400"
                      />
                    )}
                  </Link>
                )
              })}
            </div>

            <div className="pt-4 border-t border-surface-800/50">
              <p className="px-4 text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2">
                Tools
              </p>
              {secondaryNavigation.map((item) => {
                const isActive = pathname === item.href
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-xl
                      text-sm font-medium transition-all duration-200
                      ${isActive
                        ? 'text-primary-400 bg-primary-500/10 shadow-inner-light'
                        : 'text-surface-400 hover:text-surface-100 hover:bg-surface-800/50'
                      }
                    `}
                  >
                    <item.icon
                      size={20}
                      className={isActive ? 'text-primary-400' : 'text-surface-500'}
                    />
                    {item.name}
                    {item.name === 'AI Assistant' && (
                      <span className="ml-auto px-2 py-0.5 text-[10px] font-semibold rounded-full bg-accent-500/20 text-accent-400">
                        AI
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          </nav>

          {/* User section */}
          <div className="px-4 py-4 border-t border-surface-800/50">
            <Link
              href="/dashboard/settings"
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-800/50 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-surface-700 to-surface-800 flex items-center justify-center text-surface-300 font-medium">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-surface-200 truncate">
                  {user?.name || 'User'}
                </p>
                <p className="text-xs text-surface-500 truncate">
                  {user?.organization?.name || 'Organization'}
                </p>
              </div>
            </Link>
          </div>
        </div>
      </aside>
    </>
  )
}
