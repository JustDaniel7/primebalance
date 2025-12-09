'use client'

import { useState, useRef, useEffect } from 'react'
import { useStore } from '@/store'
import { useSession, signOut } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { SearchIcon, BellIcon, PlusIcon, ChevronDownIcon } from '@/components/ui/Icons'
import Button from '@/components/ui/Button'

export default function Header() {
  const { user } = useStore()
  const { data: session } = useSession()
  const router = useRouter()
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)
  const notificationRef = useRef<HTMLDivElement>(null)

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false)
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const notifications = [
    {
      id: '1',
      title: 'Tax deadline approaching',
      message: 'Q4 estimated taxes due in 15 days',
      time: '2 hours ago',
      unread: true,
    },
    {
      id: '2',
      title: 'Transaction synced',
      message: '23 new transactions from Stripe',
      time: '5 hours ago',
      unread: true,
    },
    {
      id: '3',
      title: 'AI suggestion',
      message: 'New optimization found for expenses',
      time: '1 day ago',
      unread: false,
    },
  ]

  const unreadCount = notifications.filter((n) => n.unread).length
  const displayName = session?.user?.name || user?.name || 'User'
  const displayEmail = session?.user?.email || user?.email || ''

  const handleSignOut = () => {
    signOut({ callbackUrl: '/auth/login' })
  }

  return (
    <header className="sticky top-0 z-30 h-16 lg:h-20 bg-surface-950/80 border-b border-surface-800/50 backdrop-blur-xl">
      <div className="flex items-center justify-between h-full px-4 lg:px-8">
        {/* Search - hidden on mobile, visible on larger screens */}
        <div className="hidden md:block flex-1 max-w-xl">
          <div className="relative">
            <SearchIcon
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-500"
            />
            <input
              type="text"
              placeholder="Search transactions, accounts, reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchOpen(true)}
              onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-surface-900/60 border border-surface-700/50 text-surface-100 placeholder:text-surface-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500/30"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden lg:block">
              <kbd className="px-2 py-1 text-xs text-surface-500 bg-surface-800 rounded-md border border-surface-700">
                ⌘K
              </kbd>
            </div>
          </div>

          {/* Search results dropdown */}
          <AnimatePresence>
            {searchOpen && searchQuery && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 max-w-xl mt-2 glass-card rounded-xl overflow-hidden"
              >
                <div className="p-2">
                  <p className="px-3 py-2 text-xs font-medium text-surface-500 uppercase">
                    Quick Results
                  </p>
                  <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-800/50 transition-colors text-left">
                    <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center">
                      <SearchIcon size={16} className="text-primary-400" />
                    </div>
                    <div>
                      <p className="text-sm text-surface-200">
                        Search for &quot;{searchQuery}&quot;
                      </p>
                      <p className="text-xs text-surface-500">
                        Press Enter to search
                      </p>
                    </div>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Mobile spacer */}
        <div className="md:hidden flex-1" />

        {/* Actions */}
        <div className="flex items-center gap-2 lg:gap-3 ml-4">
          {/* Quick add button */}
          <Button
            variant="primary"
            size="sm"
            leftIcon={<PlusIcon size={16} />}
            className="hidden sm:flex"
          >
            <span className="hidden lg:inline">New Transaction</span>
            <span className="lg:hidden">New</span>
          </Button>
          
          {/* Mobile: icon only */}
          <Button
            variant="primary"
            size="sm"
            className="sm:hidden p-2"
            onClick={() => router.push('/dashboard/transactions')}
          >
            <PlusIcon size={16} />
          </Button>

          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => {
                setNotificationsOpen(!notificationsOpen)
                setProfileOpen(false)
              }}
              className="relative p-2 lg:p-2.5 rounded-xl hover:bg-surface-800/50 transition-colors"
            >
              <BellIcon size={20} className="text-surface-400" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 lg:top-1.5 lg:right-1.5 w-4 h-4 rounded-full bg-accent-500 text-[10px] font-bold text-surface-950 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {notificationsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 top-full mt-2 w-80 glass-card rounded-xl overflow-hidden z-50"
                >
                  <div className="p-4 border-b border-surface-800/50">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-surface-100">Notifications</h3>
                      <button className="text-xs text-primary-400 hover:text-primary-300">
                        Mark all read
                      </button>
                    </div>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.map((notification) => (
                      <button
                        key={notification.id}
                        className="w-full p-4 text-left hover:bg-surface-800/30 transition-colors border-b border-surface-800/30 last:border-0"
                      >
                        <div className="flex items-start gap-3">
                          {notification.unread && (
                            <span className="w-2 h-2 mt-2 rounded-full bg-primary-400 flex-shrink-0" />
                          )}
                          <div className={notification.unread ? '' : 'ml-5'}>
                            <p className="text-sm font-medium text-surface-200">
                              {notification.title}
                            </p>
                            <p className="text-xs text-surface-400 mt-0.5">
                              {notification.message}
                            </p>
                            <p className="text-xs text-surface-500 mt-1">
                              {notification.time}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="p-3 border-t border-surface-800/50">
                    <button className="w-full py-2 text-sm text-center text-primary-400 hover:text-primary-300 transition-colors">
                      View all notifications
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User dropdown */}
          <div className="relative" ref={profileRef}>
            <button 
              onClick={() => {
                setProfileOpen(!profileOpen)
                setNotificationsOpen(false)
              }}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-surface-800/50 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-surface-950 font-medium text-sm">
                {displayName?.charAt(0).toUpperCase() || 'U'}
              </div>
              <ChevronDownIcon size={16} className={`text-surface-500 hidden sm:block transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 top-full mt-2 w-64 glass-card rounded-xl overflow-hidden z-50"
                >
                  {/* User info */}
                  <div className="p-4 border-b border-surface-800/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-surface-950 font-medium">
                        {displayName?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-surface-100 truncate">
                          {displayName}
                        </p>
                        <p className="text-xs text-surface-500 truncate">
                          {displayEmail}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Menu items */}
                  <div className="py-2">
                    <Link
                      href="/dashboard/settings"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-surface-300 hover:bg-surface-800/50 hover:text-surface-100 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Profile Settings
                    </Link>
                    <Link
                      href="/dashboard/settings"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-surface-300 hover:bg-surface-800/50 hover:text-surface-100 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Account Settings
                    </Link>
                    <Link
                      href="/dashboard/reports"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-surface-300 hover:bg-surface-800/50 hover:text-surface-100 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Billing & Reports
                    </Link>
                  </div>

                  {/* Sign out */}
                  <div className="py-2 border-t border-surface-800/50">
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 w-full transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  )
}