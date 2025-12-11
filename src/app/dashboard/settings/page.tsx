'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui';
import { 
  useThemeStore, 
  accentColors, 
  languages,
  ThemeMode, 
  AccentColor, 
  SidebarMode,
  Language,
} from '@/store/theme-store';
import {
  Cog6ToothIcon,
  UserCircleIcon,
  BuildingOfficeIcon,
  BellIcon,
  ShieldCheckIcon,
  CreditCardIcon,
  LinkIcon,
  PaintBrushIcon,
  ArrowPathIcon,
  CheckIcon,
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';
import { 
  PanelLeft, 
  PanelLeftClose, 
  PanelLeftInactive,
  Check,
  Globe,
} from 'lucide-react';

type SettingsTab = 'profile' | 'organization' | 'notifications' | 'security' | 'billing' | 'integrations' | 'appearance';

const integrations = [
  { id: 'quickbooks', name: 'QuickBooks', description: 'Import transactions and sync data', connected: true, logo: '📊' },
  { id: 'stripe', name: 'Stripe', description: 'Payment processing and invoicing', connected: true, logo: '💳' },
  { id: 'plaid', name: 'Plaid', description: 'Bank account connections', connected: true, logo: '🏦' },
  { id: 'xero', name: 'Xero', description: 'Accounting software sync', connected: false, logo: '📈' },
  { id: 'shopify', name: 'Shopify', description: 'E-commerce sales tracking', connected: false, logo: '🛒' },
  { id: 'slack', name: 'Slack', description: 'Team notifications', connected: true, logo: '💬' },
  { id: 'google', name: 'Google Workspace', description: 'Drive, Calendar, Gmail', connected: true, logo: '🔵' },
  { id: 'metamask', name: 'MetaMask', description: 'Crypto wallet connection', connected: true, logo: '🦊' },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('appearance');
  const [saved, setSaved] = useState(false);
  
  const { 
    themeMode, 
    accentColor, 
    sidebarMode,
    language,
    setThemeMode, 
    setAccentColor, 
    setSidebarMode,
    setLanguage,
    resolvedTheme,
    t,
  } = useThemeStore();

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const tabs = [
    { id: 'profile', labelKey: 'settings.tabs.profile', icon: UserCircleIcon },
    { id: 'organization', labelKey: 'settings.tabs.organization', icon: BuildingOfficeIcon },
    { id: 'notifications', labelKey: 'settings.tabs.notifications', icon: BellIcon },
    { id: 'security', labelKey: 'settings.tabs.security', icon: ShieldCheckIcon },
    { id: 'billing', labelKey: 'settings.tabs.billing', icon: CreditCardIcon },
    { id: 'integrations', labelKey: 'settings.tabs.integrations', icon: LinkIcon },
    { id: 'appearance', labelKey: 'settings.tabs.appearance', icon: PaintBrushIcon },
  ];

  const themeModes: { id: ThemeMode; nameKey: string; icon: any; descKey: string }[] = [
    { id: 'light', nameKey: 'appearance.light', icon: SunIcon, descKey: 'appearance.lightDesc' },
    { id: 'dark', nameKey: 'appearance.dark', icon: MoonIcon, descKey: 'appearance.darkDesc' },
    { id: 'system', nameKey: 'appearance.system', icon: ComputerDesktopIcon, descKey: 'appearance.systemDesc' },
  ];

  const sidebarModes: { id: SidebarMode; nameKey: string; icon: any; descKey: string }[] = [
    { id: 'expanded', nameKey: 'appearance.expanded', icon: PanelLeft, descKey: 'appearance.expandedDesc' },
    { id: 'collapsed', nameKey: 'appearance.collapsed', icon: PanelLeftClose, descKey: 'appearance.collapsedDesc' },
    { id: 'autohide', nameKey: 'appearance.autohide', icon: PanelLeftInactive, descKey: 'appearance.autohideDesc' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-gray-500/20 to-gray-600/10 border border-gray-300 dark:border-gray-500/20">
              <Cog6ToothIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </div>
            {t('settings.title')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{t('settings.subtitle')}</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2.5 bg-[var(--accent-primary)] hover:opacity-90 rounded-xl font-medium text-white shadow-lg transition-opacity"
        >
          {saved ? <CheckIcon className="w-5 h-5" /> : <ArrowPathIcon className="w-5 h-5" />}
          {saved ? t('settings.saved') : t('settings.save')}
        </motion.button>
      </div>

      <div className="flex gap-6">
        {/* Sidebar Tabs */}
        <div className="w-56 space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as SettingsTab)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                {t(tab.labelKey)}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1">
          {/* Profile Settings */}
          {activeTab === 'profile' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">{t('profile.personalInfo')}</h3>
                <div className="flex items-start gap-6 mb-6">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-primary-hover)] flex items-center justify-center text-3xl font-bold text-white">
                      JD
                    </div>
                    <button className="absolute -bottom-2 -right-2 p-2 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 rounded-lg text-gray-700 dark:text-white transition-colors">
                      <PaintBrushIcon className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{t('profile.firstName')}</label>
                        <input
                          type="text"
                          defaultValue="John"
                          className="w-full px-4 py-3 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{t('profile.lastName')}</label>
                        <input
                          type="text"
                          defaultValue="Doe"
                          className="w-full px-4 py-3 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{t('profile.email')}</label>
                      <input
                        type="email"
                        defaultValue="john.doe@company.com"
                        className="w-full px-4 py-3 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{t('profile.phone')}</label>
                    <input
                      type="tel"
                      defaultValue="+1 (555) 123-4567"
                      className="w-full px-4 py-3 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{t('profile.timezone')}</label>
                    <select className="w-full px-4 py-3 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50">
                      <option>Pacific Time (PT)</option>
                      <option>Mountain Time (MT)</option>
                      <option>Central Time (CT)</option>
                      <option>Eastern Time (ET)</option>
                      <option>Central European Time (CET)</option>
                    </select>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Organization Settings */}
          {activeTab === 'organization' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">{t('org.details')}</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{t('org.companyName')}</label>
                    <input
                      type="text"
                      defaultValue="Acme Corp"
                      className="w-full px-4 py-3 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{t('org.industry')}</label>
                      <select className="w-full px-4 py-3 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50">
                        <option>Technology</option>
                        <option>Finance</option>
                        <option>Healthcare</option>
                        <option>Retail</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{t('org.companySize')}</label>
                      <select className="w-full px-4 py-3 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50">
                        <option>1-10</option>
                        <option>11-50</option>
                        <option>51-200</option>
                        <option>200+</option>
                      </select>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Notifications Settings */}
          {activeTab === 'notifications' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">{t('notifications.preferences')}</h3>
                <div className="space-y-4">
                  {[
                    { labelKey: 'notifications.transactionAlerts', descKey: 'notifications.transactionAlertsDesc' },
                    { labelKey: 'notifications.weeklyReports', descKey: 'notifications.weeklyReportsDesc' },
                    { labelKey: 'notifications.taxReminders', descKey: 'notifications.taxRemindersDesc' },
                    { labelKey: 'notifications.teamUpdates', descKey: 'notifications.teamUpdatesDesc' },
                  ].map((item) => (
                    <div key={item.labelKey} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/[0.02] rounded-xl">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{t(item.labelKey)}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{t(item.descKey)}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-300 dark:bg-surface-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--accent-primary)]"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">{t('security.password')}</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{t('security.currentPassword')}</label>
                    <input
                      type="password"
                      className="w-full px-4 py-3 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{t('security.newPassword')}</label>
                      <input
                        type="password"
                        className="w-full px-4 py-3 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{t('security.confirmPassword')}</label>
                      <input
                        type="password"
                        className="w-full px-4 py-3 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50"
                      />
                    </div>
                  </div>
                </div>
              </Card>

              <Card>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">{t('security.twoFactor')}</h3>
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/[0.02] rounded-xl">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{t('security.authenticatorApp')}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('security.authenticatorAppDesc')}</p>
                  </div>
                  <button className="px-4 py-2 bg-[var(--accent-primary)] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
                    {t('security.enable')}
                  </button>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Billing Settings */}
          {activeTab === 'billing' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">{t('billing.currentPlan')}</h3>
                <div className="p-4 bg-gradient-to-r from-[var(--accent-primary)]/10 to-transparent rounded-xl border border-[var(--accent-primary)]/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">{t('billing.professionalPlan')}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">$49/month • Renews Dec 1, 2025</p>
                    </div>
                    <button className="px-4 py-2 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors">
                      {t('billing.upgrade')}
                    </button>
                  </div>
                </div>
              </Card>

              <Card>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">{t('billing.paymentMethod')}</h3>
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/[0.02] rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-blue-400 rounded flex items-center justify-center text-white text-xs font-bold">
                      VISA
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">•••• •••• •••• 4242</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Expires 12/2026</p>
                    </div>
                  </div>
                  <button className="text-sm text-[var(--accent-primary)] hover:opacity-80 transition-opacity">
                    {t('billing.update')}
                  </button>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Integrations Settings */}
          {activeTab === 'integrations' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">{t('integrations.connectedServices')}</h3>
                <div className="grid grid-cols-2 gap-4">
                  {integrations.map((integration) => (
                    <div
                      key={integration.id}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/[0.02] rounded-xl hover:bg-gray-100 dark:hover:bg-white/[0.04] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center text-xl">
                          {integration.logo}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{integration.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{integration.description}</p>
                        </div>
                      </div>
                      {integration.connected ? (
                        <span className="px-3 py-1 bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] text-xs rounded-full">
                          {t('integrations.connected')}
                        </span>
                      ) : (
                        <button className="px-3 py-1 bg-gray-200 dark:bg-white/5 hover:bg-gray-300 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 text-xs rounded-full transition-colors">
                          {t('integrations.connect')}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}

          {/* Appearance Settings */}
          {activeTab === 'appearance' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Language */}
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('appearance.language')}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t('appearance.languageDesc')}</p>
                <div className="grid grid-cols-2 gap-4">
                  {languages.map((lang) => {
                    const isActive = language === lang.code;
                    return (
                      <button
                        key={lang.code}
                        onClick={() => setLanguage(lang.code)}
                        className={`relative flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                          isActive 
                            ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/5' 
                            : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
                        }`}
                      >
                        {isActive && (
                          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[var(--accent-primary)] flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                        <span className="text-3xl">{lang.flag}</span>
                        <div className="text-left">
                          <p className="font-medium text-gray-900 dark:text-white">{lang.nativeName}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{lang.name}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </Card>

              {/* Theme Mode */}
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('appearance.theme')}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t('appearance.themeDesc')}</p>
                <div className="grid grid-cols-3 gap-4">
                  {themeModes.map((mode) => {
                    const Icon = mode.icon;
                    const isActive = themeMode === mode.id;
                    return (
                      <button
                        key={mode.id}
                        onClick={() => setThemeMode(mode.id)}
                        className={`relative p-4 rounded-xl border-2 transition-all ${
                          isActive 
                            ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/5' 
                            : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
                        }`}
                      >
                        {isActive && (
                          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[var(--accent-primary)] flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                        <div className={`w-full h-20 rounded-lg mb-3 flex items-center justify-center ${
                          mode.id === 'light' 
                            ? 'bg-gray-100 border border-gray-200' 
                            : mode.id === 'dark' 
                            ? 'bg-gray-900 border border-gray-700' 
                            : 'bg-gradient-to-r from-gray-900 to-gray-100 border border-gray-400'
                        }`}>
                          <Icon className={`w-8 h-8 ${
                            mode.id === 'light' ? 'text-amber-500' : mode.id === 'dark' ? 'text-blue-400' : 'text-gray-500'
                          }`} />
                        </div>
                        <p className="font-medium text-gray-900 dark:text-white">{t(mode.nameKey)}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t(mode.descKey)}</p>
                      </button>
                    );
                  })}
                </div>
              </Card>

              {/* Accent Color */}
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('appearance.accentColor')}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t('appearance.accentColorDesc')}</p>
                <div className="flex flex-wrap gap-3">
                  {accentColors.map((color) => {
                    const isActive = accentColor === color.value;
                    return (
                      <button
                        key={color.value}
                        onClick={() => setAccentColor(color.value)}
                        className={`group relative flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${
                          isActive 
                            ? 'bg-gray-100 dark:bg-white/10' 
                            : 'hover:bg-gray-50 dark:hover:bg-white/5'
                        }`}
                      >
                        <div 
                          className={`w-10 h-10 rounded-full transition-transform ${
                            isActive ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 scale-110' : 'group-hover:scale-105'
                          }`}
                          style={{ 
                            backgroundColor: color.primary,
                            ['--tw-ring-color' as any]: color.primary,
                          }}
                        >
                          {isActive && (
                            <div className="w-full h-full flex items-center justify-center">
                              <Check className="w-5 h-5 text-white" />
                            </div>
                          )}
                        </div>
                        <span className={`text-xs font-medium ${
                          isActive ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'
                        }`}>
                          {color.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </Card>

              {/* Sidebar Mode */}
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('appearance.sidebar')}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t('appearance.sidebarDesc')}</p>
                <div className="grid grid-cols-3 gap-4">
                  {sidebarModes.map((mode) => {
                    const Icon = mode.icon;
                    const isActive = sidebarMode === mode.id;
                    return (
                      <button
                        key={mode.id}
                        onClick={() => setSidebarMode(mode.id)}
                        className={`relative p-4 rounded-xl border-2 transition-all ${
                          isActive 
                            ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/5' 
                            : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
                        }`}
                      >
                        {isActive && (
                          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[var(--accent-primary)] flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                        <div className="w-full h-16 rounded-lg mb-3 bg-gray-100 dark:bg-white/5 flex items-center justify-center">
                          <Icon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                        </div>
                        <p className="font-medium text-gray-900 dark:text-white">{t(mode.nameKey)}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t(mode.descKey)}</p>
                      </button>
                    );
                  })}
                </div>
              </Card>

              {/* Preview */}
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('appearance.preview')}</h3>
                <div className="p-4 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                  <div className="flex items-center gap-3 mb-4">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: 'var(--accent-primary)' }}
                    >
                      P
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{t('appearance.currentSettings')}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Theme: {themeMode} ({resolvedTheme}) • Accent: {accentColor} • Sidebar: {sidebarMode} • Lang: {language}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      className="px-4 py-2 rounded-lg text-white text-sm font-medium"
                      style={{ backgroundColor: 'var(--accent-primary)' }}
                    >
                      {t('appearance.primaryButton')}
                    </button>
                    <button className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300 text-sm font-medium">
                      {t('appearance.secondary')}
                    </button>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
