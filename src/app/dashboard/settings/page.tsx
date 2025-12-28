'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui';
import {
  useThemeStore,
  accentColors,
  languages,
  ThemeMode,
  AccentColor,
  SidebarMode,
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
  CheckIcon,
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import {
  PanelLeft,
  PanelLeftClose,
  PanelLeftInactive,
  Check,
  Loader2,
} from 'lucide-react';

type SettingsTab = 'profile' | 'organization' | 'notifications' | 'security' | 'billing' | 'integrations' | 'appearance';

interface Integration {
  id: string;
  name: string;
  description: string;
  connected: boolean;
  logo: string;
}

const initialIntegrations: Integration[] = [
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
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Profile state
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePhone, setProfilePhone] = useState('+1 (555) 123-4567');
  const [profileTimezone, setProfileTimezone] = useState('Europe/Zurich');

  // Organization state
  const [orgName, setOrgName] = useState('');
  const [orgIndustry, setOrgIndustry] = useState('Technology');
  const [orgSize, setOrgSize] = useState('11-50');

  // Notification state
  const [notifications, setNotifications] = useState({
    transactionAlerts: true,
    weeklyReports: true,
    taxReminders: true,
    teamUpdates: true,
  });

  // Security state
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  });
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  // Integrations state
  const [integrations, setIntegrations] = useState<Integration[]>(initialIntegrations);

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

  // Show toast notification
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch profile
        const profileRes = await fetch('/api/user/profile');
        if (profileRes.ok) {
          const profile = await profileRes.json();
          setProfileName(profile.name || '');
          setProfileEmail(profile.email || '');
          if (profile.settings) {
            setProfileTimezone(profile.settings.timezone || 'Europe/Zurich');
          }
        }

        // Fetch organization
        const orgRes = await fetch('/api/organization/settings');
        if (orgRes.ok) {
          const org = await orgRes.json();
          setOrgName(org.name || '');
          setOrgIndustry(org.industry || 'Technology');
        }

        // Fetch user settings (notifications)
        const settingsRes = await fetch('/api/settings');
        if (settingsRes.ok) {
          const settings = await settingsRes.json();
          setNotifications({
            transactionAlerts: settings.transactionNotifications ?? true,
            weeklyReports: settings.reportNotifications ?? true,
            taxReminders: settings.emailNotifications ?? true,
            teamUpdates: settings.pushNotifications ?? true,
          });
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Save profile
  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: profileName, email: profileEmail }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to save profile');
      }

      showToast('Profile saved successfully');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to save profile', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Save organization
  const handleSaveOrganization = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/organization/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: orgName, industry: orgIndustry }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to save organization');
      }

      showToast('Organization settings saved');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to save organization', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Save notifications
  const handleSaveNotifications = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionNotifications: notifications.transactionAlerts,
          reportNotifications: notifications.weeklyReports,
          emailNotifications: notifications.taxReminders,
          pushNotifications: notifications.teamUpdates,
        }),
      });

      if (!res.ok) throw new Error('Failed to save notifications');
      showToast('Notification preferences saved');
    } catch {
      showToast('Failed to save notifications', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle notification toggle
  const handleNotificationToggle = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Handle password change
  const handlePasswordChange = async () => {
    if (!passwords.current || !passwords.new || !passwords.confirm) {
      showToast('Please fill in all password fields', 'error');
      return;
    }
    if (passwords.new !== passwords.confirm) {
      showToast('New passwords do not match', 'error');
      return;
    }
    if (passwords.new.length < 8) {
      showToast('Password must be at least 8 characters', 'error');
      return;
    }

    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    showToast('Password change requires additional backend configuration', 'error');
    setPasswords({ current: '', new: '', confirm: '' });
    setIsSaving(false);
  };

  // Handle 2FA toggle
  const handle2FAToggle = () => {
    showToast('Two-factor authentication setup requires additional configuration', 'error');
  };

  // Handle integration toggle
  const handleIntegrationToggle = (id: string) => {
    const integration = integrations.find(i => i.id === id);
    if (integration?.connected) {
      setIntegrations(prev => prev.map(i => i.id === id ? { ...i, connected: false } : i));
      showToast(`${integration.name} disconnected`);
    } else {
      showToast(`${integration?.name} integration requires OAuth configuration`, 'error');
    }
  };

  // Handle billing actions
  const handleUpgrade = () => {
    showToast('Billing management will be available in a future update', 'error');
  };

  const handleUpdatePayment = () => {
    showToast('Payment method update requires Stripe integration', 'error');
  };

  // Handle avatar upload
  const handleAvatarUpload = () => {
    showToast('Avatar upload will be available in a future update', 'error');
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

  const themeModes: { id: ThemeMode; nameKey: string; icon: React.ComponentType<{ className?: string }>; descKey: string }[] = [
    { id: 'light', nameKey: 'appearance.light', icon: SunIcon, descKey: 'appearance.lightDesc' },
    { id: 'dark', nameKey: 'appearance.dark', icon: MoonIcon, descKey: 'appearance.darkDesc' },
    { id: 'system', nameKey: 'appearance.system', icon: ComputerDesktopIcon, descKey: 'appearance.systemDesc' },
  ];

  const sidebarModes: { id: SidebarMode; nameKey: string; icon: React.ComponentType<{ className?: string }>; descKey: string }[] = [
    { id: 'expanded', nameKey: 'appearance.expanded', icon: PanelLeft, descKey: 'appearance.expandedDesc' },
    { id: 'collapsed', nameKey: 'appearance.collapsed', icon: PanelLeftClose, descKey: 'appearance.collapsedDesc' },
    { id: 'autohide', nameKey: 'appearance.autohide', icon: PanelLeftInactive, descKey: 'appearance.autohideDesc' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-primary)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast notification */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 ${
            toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}
        >
          {toast.type === 'success' ? <CheckIcon className="w-5 h-5" /> : <ExclamationTriangleIcon className="w-5 h-5" />}
          {toast.message}
        </motion.div>
      )}

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
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">{t('profile.personalInfo')}</h3>
                <div className="flex items-start gap-6 mb-6">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-primary-hover)] flex items-center justify-center text-3xl font-bold text-white">
                      {profileName ? profileName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'U'}
                    </div>
                    <button
                      onClick={handleAvatarUpload}
                      className="absolute -bottom-2 -right-2 p-2 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 rounded-lg text-gray-700 dark:text-white transition-colors"
                    >
                      <PaintBrushIcon className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex-1 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{t('profile.firstName')} / {t('profile.lastName')}</label>
                      <input
                        type="text"
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        placeholder="Full Name"
                        className="w-full px-4 py-3 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{t('profile.email')}</label>
                      <input
                        type="email"
                        value={profileEmail}
                        onChange={(e) => setProfileEmail(e.target.value)}
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
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{t('profile.timezone')}</label>
                    <select
                      value={profileTimezone}
                      onChange={(e) => setProfileTimezone(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50"
                    >
                      <option value="America/Los_Angeles">Pacific Time (PT)</option>
                      <option value="America/Denver">Mountain Time (MT)</option>
                      <option value="America/Chicago">Central Time (CT)</option>
                      <option value="America/New_York">Eastern Time (ET)</option>
                      <option value="Europe/Zurich">Central European Time (CET)</option>
                      <option value="Europe/London">Greenwich Mean Time (GMT)</option>
                    </select>
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[var(--accent-primary)] hover:opacity-90 rounded-xl font-medium text-white shadow-lg transition-opacity disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckIcon className="w-5 h-5" />}
                    Save Profile
                  </button>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Organization Settings */}
          {activeTab === 'organization' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">{t('org.details')}</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{t('org.companyName')}</label>
                    <input
                      type="text"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{t('org.industry')}</label>
                      <select
                        value={orgIndustry}
                        onChange={(e) => setOrgIndustry(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50"
                      >
                        <option value="Technology">Technology</option>
                        <option value="Finance">Finance</option>
                        <option value="Healthcare">Healthcare</option>
                        <option value="Retail">Retail</option>
                        <option value="Manufacturing">Manufacturing</option>
                        <option value="Services">Services</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{t('org.companySize')}</label>
                      <select
                        value={orgSize}
                        onChange={(e) => setOrgSize(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50"
                      >
                        <option value="1-10">1-10</option>
                        <option value="11-50">11-50</option>
                        <option value="51-200">51-200</option>
                        <option value="200+">200+</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={handleSaveOrganization}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[var(--accent-primary)] hover:opacity-90 rounded-xl font-medium text-white shadow-lg transition-opacity disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckIcon className="w-5 h-5" />}
                    Save Organization
                  </button>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Notifications Settings */}
          {activeTab === 'notifications' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">{t('notifications.preferences')}</h3>
                <div className="space-y-4">
                  {[
                    { key: 'transactionAlerts' as const, labelKey: 'notifications.transactionAlerts', descKey: 'notifications.transactionAlertsDesc' },
                    { key: 'weeklyReports' as const, labelKey: 'notifications.weeklyReports', descKey: 'notifications.weeklyReportsDesc' },
                    { key: 'taxReminders' as const, labelKey: 'notifications.taxReminders', descKey: 'notifications.taxRemindersDesc' },
                    { key: 'teamUpdates' as const, labelKey: 'notifications.teamUpdates', descKey: 'notifications.teamUpdatesDesc' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/[0.02] rounded-xl">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{t(item.labelKey)}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{t(item.descKey)}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifications[item.key]}
                          onChange={() => handleNotificationToggle(item.key)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-300 dark:bg-surface-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--accent-primary)]"></div>
                      </label>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={handleSaveNotifications}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[var(--accent-primary)] hover:opacity-90 rounded-xl font-medium text-white shadow-lg transition-opacity disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckIcon className="w-5 h-5" />}
                    Save Notifications
                  </button>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">{t('security.password')}</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{t('security.currentPassword')}</label>
                    <input
                      type="password"
                      value={passwords.current}
                      onChange={(e) => setPasswords(p => ({ ...p, current: e.target.value }))}
                      className="w-full px-4 py-3 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{t('security.newPassword')}</label>
                      <input
                        type="password"
                        value={passwords.new}
                        onChange={(e) => setPasswords(p => ({ ...p, new: e.target.value }))}
                        className="w-full px-4 py-3 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{t('security.confirmPassword')}</label>
                      <input
                        type="password"
                        value={passwords.confirm}
                        onChange={(e) => setPasswords(p => ({ ...p, confirm: e.target.value }))}
                        className="w-full px-4 py-3 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50"
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={handlePasswordChange}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[var(--accent-primary)] hover:opacity-90 rounded-xl font-medium text-white shadow-lg transition-opacity disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckIcon className="w-5 h-5" />}
                    Change Password
                  </button>
                </div>
              </Card>

              <Card>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">{t('security.twoFactor')}</h3>
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/[0.02] rounded-xl">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{t('security.authenticatorApp')}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('security.authenticatorAppDesc')}</p>
                  </div>
                  <button
                    onClick={handle2FAToggle}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      twoFactorEnabled
                        ? 'bg-red-100 dark:bg-red-900/20 text-red-600 hover:bg-red-200 dark:hover:bg-red-900/30'
                        : 'bg-[var(--accent-primary)] text-white hover:opacity-90'
                    }`}
                  >
                    {twoFactorEnabled ? 'Disable' : t('security.enable')}
                  </button>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Billing Settings */}
          {activeTab === 'billing' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">{t('billing.currentPlan')}</h3>
                <div className="p-4 bg-gradient-to-r from-[var(--accent-primary)]/10 to-transparent rounded-xl border border-[var(--accent-primary)]/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">{t('billing.professionalPlan')}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">$49/month • Renews Dec 1, 2025</p>
                    </div>
                    <button
                      onClick={handleUpgrade}
                      className="px-4 py-2 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
                    >
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
                  <button
                    onClick={handleUpdatePayment}
                    className="text-sm text-[var(--accent-primary)] hover:opacity-80 transition-opacity"
                  >
                    {t('billing.update')}
                  </button>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Integrations Settings */}
          {activeTab === 'integrations' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
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
                        <button
                          onClick={() => handleIntegrationToggle(integration.id)}
                          className="px-3 py-1 bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] text-xs rounded-full hover:bg-[var(--accent-primary)]/20 transition-colors"
                        >
                          {t('integrations.connected')}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleIntegrationToggle(integration.id)}
                          className="px-3 py-1 bg-gray-200 dark:bg-white/5 hover:bg-gray-300 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 text-xs rounded-full transition-colors"
                        >
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
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
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
                          isActive ? 'bg-gray-100 dark:bg-white/10' : 'hover:bg-gray-50 dark:hover:bg-white/5'
                        }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-full transition-transform ${
                            isActive ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 scale-110' : 'group-hover:scale-105'
                          }`}
                          style={{ backgroundColor: color.primary, boxShadow: isActive ? `0 0 0 2px ${color.primary}` : undefined }}
                        >
                          {isActive && (
                            <div className="w-full h-full flex items-center justify-center">
                              <Check className="w-5 h-5 text-white" />
                            </div>
                          )}
                        </div>
                        <span className={`text-xs font-medium ${isActive ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
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
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold" style={{ backgroundColor: 'var(--accent-primary)' }}>
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
                    <button className="px-4 py-2 rounded-lg text-white text-sm font-medium" style={{ backgroundColor: 'var(--accent-primary)' }}>
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
