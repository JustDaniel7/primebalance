'use client';

import { useStore } from '@/store';
import { useThemeStore } from '@/store/theme-store';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight, PanelLeftClose, PanelLeft, FileText, Package, Archive,Globe, Landmark, TablePropertiesIcon, Shield, Wallet, Vault, Boxes, GitMerge, FolderKanban, CalendarCheck, Truck, Users, ClipboardList } from 'lucide-react';
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
} from '@/components/ui/Icons';


export default function Sidebar() {
  const { sidebarOpen, setSidebarOpen, user } = useStore();
  const { sidebarMode, sidebarExpanded, setSidebarHovered, toggleSidebar, t } = useThemeStore();
  const pathname = usePathname();

  const navigation = [
    { name: t('nav.dashboard'), href: '/dashboard', icon: DashboardIcon },
    { name: t('nav.transactions'), href: '/dashboard/transactions', icon: TransactionsIcon },
    { name: t('nav.accounts'), href: '/dashboard/accounts', icon: AccountsIcon },
    { name: t('nav.wallet'), href: '/dashboard/wallet', icon: WalletIcon },
    { name: t('nav.receipts'), href: '/dashboard/receipts', icon: ReceiptIcon },
    { name: t('nav.reports'), href: '/dashboard/reports', icon: ReportsIcon },
    { name: t('nav.taxCenter'), href: '/dashboard/tax', icon: TaxIcon },
    { name: t('nav.invoices'), href: '/dashboard/invoices', icon: FileText },
    { name: t('nav.orders'), href: '/dashboard/orders', icon: Package },
    { name: t('nav.archive'), href: '/dashboard/archive', icon: Archive },
    { name: t('nav.liabilities'), href: '/dashboard/liabilities', icon: Landmark },
    { name: t('nav.inventory'), href: '/dashboard/inventory', icon: TablePropertiesIcon },
    { name: t('nav.receivables'), href: '/dashboard/receivables', icon: Wallet },
    { name: t('nav.treasury'), href: '/dashboard/treasury', icon: Vault },
    { name: t('nav.assets'), href: '/dashboard/assets', icon: Boxes },
    { name: t('nav.projects'), href: '/dashboard/projects', icon: FolderKanban },
    { name: t('nav.periodClose'), href: '/dashboard/period-close', icon: CalendarCheck },
    { name: t('nav.customers'), href: '/dashboard/customers', icon: Users },
    { name: t('nav.suppliers'), href: '/dashboard/suppliers', icon: Truck },
    { name: t('nav.netting'), href: '/dashboard/netting', icon: GitMerge },
    { name: t('nav.investor'), href: '/dashboard/investor', icon: Shield },
    { name: t('nav.fx'), href: '/dashboard/fx', icon: Globe},
    { name: t('nav.taskCenter') || 'Task Center', href: '/dashboard/task-center', icon: ClipboardList },
  ];

  const secondaryNavigation = [
    { name: t('nav.aiAssistant'), href: '/dashboard/assistant', icon: AIIcon, badge: 'AI' },
    { name: t('nav.teamChat'), href: '/dashboard/chat', icon: ChatIcon },
    { name: t('nav.settings'), href: '/dashboard/settings', icon: SettingsIcon },
  ];

  // Calculate if sidebar should show text (expanded state)
  const showText = sidebarMode === 'expanded' || 
    (sidebarMode === 'autohide' && sidebarExpanded) ||
    (sidebarMode === 'collapsed' && false);

  // Calculate sidebar width class
  const sidebarWidthClass = sidebarMode === 'collapsed' 
    ? 'w-20' 
    : sidebarMode === 'autohide' 
      ? (sidebarExpanded ? 'w-72' : 'w-0 -translate-x-full')
      : 'w-72';

  return (
    <>
      {/* Mobile backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 dark:bg-black/60 light:bg-black/40 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile toggle button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-xl bg-white dark:bg-surface-900/90 border border-gray-200 dark:border-surface-700 shadow-lg"
      >
        {sidebarOpen ? <CloseIcon size={20} /> : <MenuIcon size={20} />}
      </button>

      {/* Autohide hover trigger zone */}
      {sidebarMode === 'autohide' && (
        <div
          className="fixed top-0 left-0 w-4 h-full z-30 hidden lg:block"
          onMouseEnter={() => setSidebarHovered(true)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-40 h-screen
          transition-all duration-300 ease-out
          ${sidebarWidthClass}
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${sidebarMode === 'autohide' && !sidebarExpanded ? 'lg:-translate-x-full' : 'lg:translate-x-0'}
        `}
        onMouseEnter={() => sidebarMode === 'autohide' && setSidebarHovered(true)}
        onMouseLeave={() => sidebarMode === 'autohide' && setSidebarHovered(false)}
      >
        <div className="flex flex-col h-full bg-white dark:bg-surface-950/95 border-r border-gray-200 dark:border-surface-800/50 backdrop-blur-xl">
          {/* Logo */}
          <div className={`flex items-center gap-3 h-16 lg:h-20 border-b border-gray-200 dark:border-surface-800/50 ${
            sidebarMode === 'collapsed' ? 'px-3 justify-center' : 'px-6'
          }`}>
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-primary-hover)] flex items-center justify-center shadow-lg shrink-0">
              <span className="text-xl font-bold text-white">P</span>
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center">
                <SparklesIcon size={10} className="text-white" />
              </div>
            </div>
            {showText && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="overflow-hidden"
              >
                <h1 className="text-xl font-bold text-gray-900 dark:text-surface-100 font-display whitespace-nowrap">
                  PrimeBalance
                </h1>
                <p className="text-xs text-gray-500 dark:text-surface-500 whitespace-nowrap">
                  AI-Powered Accounting
                </p>
              </motion.div>
            )}
          </div>

          {/* Toggle button for desktop (collapsed mode) */}
          {sidebarMode !== 'autohide' && (
            <button
              onClick={toggleSidebar}
              className="hidden lg:flex absolute -right-3 top-24 w-6 h-6 items-center justify-center rounded-full bg-white dark:bg-surface-800 border border-gray-200 dark:border-surface-700 shadow-md hover:bg-gray-50 dark:hover:bg-surface-700 transition-colors z-50"
            >
              {sidebarMode === 'expanded' ? (
                <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-surface-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-600 dark:text-surface-400" />
              )}
            </button>
          )}

          {/* Main navigation */}
          <nav className={`flex-1 py-4 lg:py-6 space-y-1 overflow-y-auto scrollbar-hide ${
            sidebarMode === 'collapsed' ? 'px-2' : 'px-4'
          }`}>
            <div className="mb-4">
              {showText && (
                <p className="px-4 text-xs font-semibold text-gray-400 dark:text-surface-500 uppercase tracking-wider mb-2">
                  {t('nav.main')}
                </p>
              )}
              {navigation.map((item) => {
                const isActive = pathname === item.href || 
                  (item.href !== '/dashboard' && pathname.startsWith(item.href));
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`
                      flex items-center gap-3 py-3 rounded-xl
                      text-sm font-medium transition-all duration-200
                      ${sidebarMode === 'collapsed' ? 'justify-center px-3' : 'px-4'}
                      ${isActive
                        ? 'text-[var(--accent-primary)] bg-[var(--accent-primary)]/10'
                        : 'text-gray-600 dark:text-surface-400 hover:text-gray-900 dark:hover:text-surface-100 hover:bg-gray-100 dark:hover:bg-surface-800/50'
                      }
                    `}
                    title={item.name}
                  >
                    <item.icon
                      size={20}
                      className={`shrink-0 ${isActive ? 'text-[var(--accent-primary)]' : 'text-gray-500 dark:text-surface-500'}`}
                    />
                    {showText && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="truncate"
                      >
                        {item.name}
                      </motion.span>
                    )}
                    {isActive && showText && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)]"
                      />
                    )}
                  </Link>
                );
              })}
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-surface-800/50">
              {showText && (
                <p className="px-4 text-xs font-semibold text-gray-400 dark:text-surface-500 uppercase tracking-wider mb-2">
                  {t('nav.tools')}
                </p>
              )}
              {secondaryNavigation.map((item) => {
                const isActive = pathname === item.href;
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`
                      flex items-center gap-3 py-3 rounded-xl
                      text-sm font-medium transition-all duration-200
                      ${sidebarMode === 'collapsed' ? 'justify-center px-3' : 'px-4'}
                      ${isActive
                        ? 'text-[var(--accent-primary)] bg-[var(--accent-primary)]/10'
                        : 'text-gray-600 dark:text-surface-400 hover:text-gray-900 dark:hover:text-surface-100 hover:bg-gray-100 dark:hover:bg-surface-800/50'
                      }
                    `}
                    title={item.name}
                  >
                    <item.icon
                      size={20}
                      className={`shrink-0 ${isActive ? 'text-[var(--accent-primary)]' : 'text-gray-500 dark:text-surface-500'}`}
                    />
                    {showText && (
                      <>
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="truncate"
                        >
                          {item.name}
                        </motion.span>
                        {item.badge && (
                          <span className="ml-auto px-2 py-0.5 text-[10px] font-semibold rounded-full bg-amber-500/20 text-amber-500">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* User section */}
          <div className={`py-4 border-t border-gray-200 dark:border-surface-800/50 ${
            sidebarMode === 'collapsed' ? 'px-2' : 'px-4'
          }`}>
            <Link
              href="/dashboard/settings"
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-surface-800/50 transition-colors ${
                sidebarMode === 'collapsed' ? 'justify-center' : ''
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-200 to-gray-300 dark:from-surface-700 dark:to-surface-800 flex items-center justify-center text-gray-700 dark:text-surface-300 font-medium shrink-0">
                {user?.name?.charAt(0) || 'U'}
              </div>
              {showText && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex-1 min-w-0"
                >
                  <p className="text-sm font-medium text-gray-900 dark:text-surface-200 truncate">
                    {user?.name || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-surface-500 truncate">
                    {user?.organization?.name || 'Organization'}
                  </p>
                </motion.div>
              )}
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
