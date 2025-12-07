'use client'

import { useState } from 'react'
import { useStore } from '@/index'
import { motion, AnimatePresence } from 'framer-motion'
import { SearchIcon, BellIcon, PlusIcon, ChevronDownIcon } from '@/components/ui/Icons'
import Button from '@/components/ui/Button'

export default function Header() {
  const { user } = useStore()
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [notificationsOpen, setNotificationsOpen] = useState(false)

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

  return (
    <header className="sticky top-0 z-30 h-20 bg-surface-950/80 border-b border-surface-800/50 backdrop-blur-xl">
      <div className="flex items-center justify-between h-full px-6 lg:px-8">
        {/* Search */}
        <div className="flex-1 max-w-xl">
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
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
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

        {/* Actions */}
        <div className="flex items-center gap-3 ml-4">
          {/* Quick add button */}
          <Button
            variant="primary"
            size="sm"
            leftIcon={<PlusIcon size={16} />}
          >
            <span className="hidden sm:inline">New Transaction</span>
            <span className="sm:hidden">New</span>
          </Button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative p-2.5 rounded-xl hover:bg-surface-800/50 transition-colors"
            >
              <BellIcon size={20} className="text-surface-400" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-accent-500 text-[10px] font-bold text-surface-950 flex items-center justify-center">
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
                  className="absolute right-0 top-full mt-2 w-80 glass-card rounded-xl overflow-hidden"
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
          <button className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-surface-800/50 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-surface-950 font-medium text-sm">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <ChevronDownIcon size={16} className="text-surface-500 hidden sm:block" />
          </button>
        </div>
      </div>
    </header>
  )
}
