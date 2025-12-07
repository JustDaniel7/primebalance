'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui';
import {
  Cog6ToothIcon,
  UserCircleIcon,
  BuildingOfficeIcon,
  BellIcon,
  ShieldCheckIcon,
  CreditCardIcon,
  LinkIcon,
  PaintBrushIcon,
  GlobeAltIcon,
  KeyIcon,
  DevicePhoneMobileIcon,
  CloudIcon,
  ArrowPathIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';

type SettingsTab = 'profile' | 'organization' | 'notifications' | 'security' | 'billing' | 'integrations' | 'appearance';

const tabs = [
  { id: 'profile', label: 'Profile', icon: UserCircleIcon },
  { id: 'organization', label: 'Organization', icon: BuildingOfficeIcon },
  { id: 'notifications', label: 'Notifications', icon: BellIcon },
  { id: 'security', label: 'Security', icon: ShieldCheckIcon },
  { id: 'billing', label: 'Billing', icon: CreditCardIcon },
  { id: 'integrations', label: 'Integrations', icon: LinkIcon },
  { id: 'appearance', label: 'Appearance', icon: PaintBrushIcon },
];

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
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-gray-500/20 to-gray-600/10 border border-gray-500/20">
              <Cog6ToothIcon className="w-6 h-6 text-gray-400" />
            </div>
            Settings
          </h1>
          <p className="text-gray-400 mt-1">Manage your account and preferences</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl font-medium text-white shadow-lg shadow-emerald-500/25"
        >
          {saved ? <CheckIcon className="w-5 h-5" /> : <ArrowPathIcon className="w-5 h-5" />}
          {saved ? 'Saved!' : 'Save Changes'}
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
                    ? 'bg-white/10 text-white'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
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
                <h3 className="text-lg font-semibold text-white mb-6">Personal Information</h3>
                <div className="flex items-start gap-6 mb-6">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-3xl font-bold text-white">
                      JD
                    </div>
                    <button className="absolute -bottom-2 -right-2 p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors">
                      <PaintBrushIcon className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">First Name</label>
                        <input
                          type="text"
                          defaultValue="John"
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Last Name</label>
                        <input
                          type="text"
                          defaultValue="Doe"
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
                      <input
                        type="email"
                        defaultValue="john.doe@company.com"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      defaultValue="+1 (555) 123-4567"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Timezone</label>
                    <select className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50">
                      <option>Pacific Time (PT)</option>
                      <option>Mountain Time (MT)</option>
                      <option>Central Time (CT)</option>
                      <option>Eastern Time (ET)</option>
                    </select>
                  </div>
                </div>
              </Card>

              <Card>
                <h3 className="text-lg font-semibold text-white mb-6">Preferences</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white/[0.02] rounded-xl">
                    <div>
                      <p className="font-medium text-white">Language</p>
                      <p className="text-sm text-gray-500">Choose your preferred language</p>
                    </div>
                    <select className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none">
                      <option>English (US)</option>
                      <option>Deutsch</option>
                      <option>Español</option>
                      <option>Français</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white/[0.02] rounded-xl">
                    <div>
                      <p className="font-medium text-white">Currency</p>
                      <p className="text-sm text-gray-500">Default display currency</p>
                    </div>
                    <select className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none">
                      <option>USD ($)</option>
                      <option>EUR (€)</option>
                      <option>GBP (£)</option>
                      <option>CHF (Fr)</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white/[0.02] rounded-xl">
                    <div>
                      <p className="font-medium text-white">Date Format</p>
                      <p className="text-sm text-gray-500">How dates are displayed</p>
                    </div>
                    <select className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none">
                      <option>MM/DD/YYYY</option>
                      <option>DD/MM/YYYY</option>
                      <option>YYYY-MM-DD</option>
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
              className="space-y-6"
            >
              <Card>
                <h3 className="text-lg font-semibold text-white mb-6">Company Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Company Name</label>
                    <input
                      type="text"
                      defaultValue="Acme Corporation"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Industry</label>
                      <select className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50">
                        <option>Technology</option>
                        <option>Finance</option>
                        <option>Healthcare</option>
                        <option>Retail</option>
                        <option>Manufacturing</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Company Size</label>
                      <select className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50">
                        <option>1-10 employees</option>
                        <option>11-50 employees</option>
                        <option>51-200 employees</option>
                        <option>201-1000 employees</option>
                        <option>1000+ employees</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Tax ID / EIN</label>
                    <input
                      type="text"
                      defaultValue="12-3456789"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                  </div>
                </div>
              </Card>

              <Card>
                <h3 className="text-lg font-semibold text-white mb-6">Fiscal Year Settings</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Fiscal Year Start</label>
                    <select className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50">
                      <option>January</option>
                      <option>April</option>
                      <option>July</option>
                      <option>October</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Accounting Method</label>
                    <select className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50">
                      <option>Accrual</option>
                      <option>Cash</option>
                    </select>
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
                <h3 className="text-lg font-semibold text-white mb-6">Notification Preferences</h3>
                <div className="space-y-4">
                  {[
                    { title: 'Transaction Alerts', description: 'Get notified for new transactions', email: true, push: true },
                    { title: 'Weekly Reports', description: 'Receive weekly financial summaries', email: true, push: false },
                    { title: 'Tax Reminders', description: 'Important tax deadlines and updates', email: true, push: true },
                    { title: 'Team Activity', description: 'When team members make changes', email: false, push: true },
                    { title: 'Crypto Price Alerts', description: 'Significant price movements', email: false, push: true },
                    { title: 'AI Insights', description: 'New AI-generated recommendations', email: true, push: false },
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-white/[0.02] rounded-xl">
                      <div>
                        <p className="font-medium text-white">{item.title}</p>
                        <p className="text-sm text-gray-500">{item.description}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            defaultChecked={item.email}
                            className="w-4 h-4 rounded border-white/20 bg-white/5 text-emerald-500 focus:ring-emerald-500/50"
                          />
                          <span className="text-sm text-gray-400">Email</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            defaultChecked={item.push}
                            className="w-4 h-4 rounded border-white/20 bg-white/5 text-emerald-500 focus:ring-emerald-500/50"
                          />
                          <span className="text-sm text-gray-400">Push</span>
                        </label>
                      </div>
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
                <h3 className="text-lg font-semibold text-white mb-6">Password & Authentication</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white/[0.02] rounded-xl">
                    <div className="flex items-center gap-3">
                      <KeyIcon className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium text-white">Password</p>
                        <p className="text-sm text-gray-500">Last changed 30 days ago</p>
                      </div>
                    </div>
                    <button className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium text-gray-300 transition-colors">
                      Change Password
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                    <div className="flex items-center gap-3">
                      <DevicePhoneMobileIcon className="w-5 h-5 text-emerald-400" />
                      <div>
                        <p className="font-medium text-white">Two-Factor Authentication</p>
                        <p className="text-sm text-emerald-400">Enabled via authenticator app</p>
                      </div>
                    </div>
                    <button className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium text-gray-300 transition-colors">
                      Manage
                    </button>
                  </div>
                </div>
              </Card>

              <Card>
                <h3 className="text-lg font-semibold text-white mb-6">Active Sessions</h3>
                <div className="space-y-3">
                  {[
                    { device: 'MacBook Pro', location: 'San Francisco, CA', current: true },
                    { device: 'iPhone 15 Pro', location: 'San Francisco, CA', current: false },
                    { device: 'Chrome on Windows', location: 'New York, NY', current: false },
                  ].map((session, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-white/[0.02] rounded-xl">
                      <div>
                        <p className="font-medium text-white">{session.device}</p>
                        <p className="text-sm text-gray-500">{session.location}</p>
                      </div>
                      {session.current ? (
                        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs rounded-full">
                          Current Session
                        </span>
                      ) : (
                        <button className="text-sm text-rose-400 hover:text-rose-300 transition-colors">
                          Revoke
                        </button>
                      )}
                    </div>
                  ))}
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
              <Card className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 border-violet-500/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Current Plan</p>
                    <p className="text-2xl font-bold text-white">Professional</p>
                    <p className="text-sm text-gray-400 mt-1">$49/month • Billed monthly</p>
                  </div>
                  <button className="px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-600 rounded-lg text-sm font-medium text-white">
                    Upgrade Plan
                  </button>
                </div>
              </Card>

              <Card>
                <h3 className="text-lg font-semibold text-white mb-6">Payment Method</h3>
                <div className="flex items-center justify-between p-4 bg-white/[0.02] rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-blue-400 rounded flex items-center justify-center text-white text-xs font-bold">
                      VISA
                    </div>
                    <div>
                      <p className="font-medium text-white">•••• •••• •••• 4242</p>
                      <p className="text-sm text-gray-500">Expires 12/2026</p>
                    </div>
                  </div>
                  <button className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
                    Update
                  </button>
                </div>
              </Card>

              <Card>
                <h3 className="text-lg font-semibold text-white mb-6">Billing History</h3>
                <div className="space-y-2">
                  {[
                    { date: 'Dec 1, 2024', amount: '$49.00', status: 'Paid' },
                    { date: 'Nov 1, 2024', amount: '$49.00', status: 'Paid' },
                    { date: 'Oct 1, 2024', amount: '$49.00', status: 'Paid' },
                  ].map((invoice, index) => (
                    <div key={index} className="flex items-center justify-between p-3 hover:bg-white/[0.02] rounded-lg transition-colors">
                      <div className="flex items-center gap-4">
                        <span className="text-gray-400">{invoice.date}</span>
                        <span className="text-white font-mono">{invoice.amount}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-emerald-400 text-sm">{invoice.status}</span>
                        <button className="text-sm text-gray-400 hover:text-white transition-colors">
                          Download
                        </button>
                      </div>
                    </div>
                  ))}
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
                <h3 className="text-lg font-semibold text-white mb-6">Connected Services</h3>
                <div className="grid grid-cols-2 gap-4">
                  {integrations.map((integration) => (
                    <div
                      key={integration.id}
                      className="flex items-center justify-between p-4 bg-white/[0.02] rounded-xl hover:bg-white/[0.04] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-xl">
                          {integration.logo}
                        </div>
                        <div>
                          <p className="font-medium text-white">{integration.name}</p>
                          <p className="text-xs text-gray-500">{integration.description}</p>
                        </div>
                      </div>
                      {integration.connected ? (
                        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs rounded-full">
                          Connected
                        </span>
                      ) : (
                        <button className="px-3 py-1 bg-white/5 hover:bg-white/10 text-gray-300 text-xs rounded-full transition-colors">
                          Connect
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
            >
              <Card>
                <h3 className="text-lg font-semibold text-white mb-6">Theme Settings</h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-3">Color Theme</label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { name: 'Dark', bg: 'bg-[#0f1115]', active: true },
                        { name: 'Light', bg: 'bg-gray-100', active: false },
                        { name: 'System', bg: 'bg-gradient-to-r from-[#0f1115] to-gray-100', active: false },
                      ].map((theme) => (
                        <button
                          key={theme.name}
                          className={`p-4 rounded-xl border-2 transition-colors ${
                            theme.active ? 'border-emerald-500' : 'border-white/10 hover:border-white/20'
                          }`}
                        >
                          <div className={`w-full h-12 rounded-lg ${theme.bg} mb-2`} />
                          <p className="text-sm text-white">{theme.name}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-3">Accent Color</label>
                    <div className="flex items-center gap-3">
                      {['emerald', 'blue', 'violet', 'rose', 'amber'].map((color) => (
                        <button
                          key={color}
                          className={`w-10 h-10 rounded-full bg-${color}-500 ${
                            color === 'emerald' ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0f1115]' : ''
                          }`}
                          style={{
                            backgroundColor: 
                              color === 'emerald' ? '#10b981' :
                              color === 'blue' ? '#3b82f6' :
                              color === 'violet' ? '#8b5cf6' :
                              color === 'rose' ? '#f43f5e' :
                              '#f59e0b'
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-3">Sidebar</label>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="sidebar"
                          defaultChecked
                          className="w-4 h-4 text-emerald-500 focus:ring-emerald-500/50"
                        />
                        <span className="text-white">Expanded</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="sidebar"
                          className="w-4 h-4 text-emerald-500 focus:ring-emerald-500/50"
                        />
                        <span className="text-white">Collapsed</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="sidebar"
                          className="w-4 h-4 text-emerald-500 focus:ring-emerald-500/50"
                        />
                        <span className="text-white">Auto-hide</span>
                      </label>
                    </div>
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
