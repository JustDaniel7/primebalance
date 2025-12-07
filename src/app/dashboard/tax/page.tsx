'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui';
import {
  CalculatorIcon,
  GlobeAltIcon,
  DocumentTextIcon,
  LightBulbIcon,
  CalendarDaysIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  SparklesIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  FlagIcon,
} from '@heroicons/react/24/outline';

const jurisdictions = [
  { code: 'US-FED', name: 'United States (Federal)', flag: '🇺🇸', taxRate: '21%' },
  { code: 'US-CA', name: 'California', flag: '🇺🇸', taxRate: '8.84%' },
  { code: 'US-DE', name: 'Delaware', flag: '🇺🇸', taxRate: '8.7%' },
  { code: 'US-TX', name: 'Texas', flag: '🇺🇸', taxRate: '0%' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', taxRate: '15-33%' },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭', taxRate: '11.9-21.6%' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬', taxRate: '17%' },
  { code: 'AE', name: 'UAE', flag: '🇦🇪', taxRate: '9%' },
];

const taxAlerts = [
  { id: 1, type: 'warning', title: 'Q4 Estimated Tax Due', message: 'Quarterly estimated tax payment due January 15, 2025', dueDate: '2025-01-15' },
  { id: 2, type: 'info', title: 'Crypto Tax Optimization', message: 'Consider harvesting $3,200 in losses before year end', savings: '$960' },
  { id: 3, type: 'success', title: 'R&D Tax Credit', message: 'Your software development may qualify for R&D credits', savings: '$12,500' },
];

const structureOptimizations = [
  {
    id: 1,
    title: 'Delaware Holding Company',
    description: 'Establish a Delaware holding company for IP management and reduced state taxes.',
    potentialSavings: '$15,000/year',
    complexity: 'Medium',
    timeframe: '2-3 months',
  },
  {
    id: 2,
    title: 'Qualified Small Business Stock',
    description: 'Structure equity for QSBS treatment - potential 100% exclusion on gains.',
    potentialSavings: 'Up to $10M',
    complexity: 'Low',
    timeframe: '1 month',
  },
  {
    id: 3,
    title: 'Singapore Regional HQ',
    description: 'Establish Singapore entity for APAC operations with favorable treaty benefits.',
    potentialSavings: '$45,000/year',
    complexity: 'High',
    timeframe: '6-12 months',
  },
];

const taxDeadlines = [
  { date: '2025-01-15', title: 'Q4 Estimated Tax', type: 'payment', jurisdiction: 'US-FED' },
  { date: '2025-01-31', title: 'W-2/1099 Filing Deadline', type: 'filing', jurisdiction: 'US-FED' },
  { date: '2025-03-15', title: 'S-Corp/Partnership Returns', type: 'filing', jurisdiction: 'US-FED' },
  { date: '2025-04-15', title: 'Individual/C-Corp Returns', type: 'filing', jurisdiction: 'US-FED' },
  { date: '2025-04-15', title: 'Q1 Estimated Tax', type: 'payment', jurisdiction: 'US-FED' },
  { date: '2025-05-31', title: 'VAT Return', type: 'filing', jurisdiction: 'DE' },
];

export default function TaxPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'jurisdictions' | 'optimizations' | 'calendar'>('overview');
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<string | null>(null);
  const [expandedOptimization, setExpandedOptimization] = useState<number | null>(null);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-teal-500/20 to-cyan-600/10 border border-teal-500/20">
              <CalculatorIcon className="w-6 h-6 text-teal-400" />
            </div>
            Tax Center
          </h1>
          <p className="text-gray-400 mt-1">International tax compliance and optimization</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl font-medium text-white shadow-lg shadow-emerald-500/25"
        >
          <SparklesIcon className="w-5 h-5" />
          AI Tax Analysis
        </motion.button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-white/5 rounded-xl w-fit">
        {[
          { id: 'overview', label: 'Overview', icon: DocumentTextIcon },
          { id: 'jurisdictions', label: 'Jurisdictions', icon: GlobeAltIcon },
          { id: 'optimizations', label: 'Optimizations', icon: LightBulbIcon },
          { id: 'calendar', label: 'Calendar', icon: CalendarDaysIcon },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id 
                  ? 'bg-white/10 text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <CurrencyDollarIcon className="w-5 h-5 text-emerald-400" />
                </div>
                <span className="text-sm text-gray-400">Est. Tax Liability</span>
              </div>
              <p className="text-2xl font-bold text-white font-mono">$42,402</p>
              <p className="text-xs text-gray-500 mt-1">2024 Tax Year</p>
            </Card>
            <Card>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-sky-500/10">
                  <CheckCircleIcon className="w-5 h-5 text-sky-400" />
                </div>
                <span className="text-sm text-gray-400">Taxes Paid YTD</span>
              </div>
              <p className="text-2xl font-bold text-white font-mono">$31,500</p>
              <p className="text-xs text-emerald-400 mt-1">74% of estimated</p>
            </Card>
            <Card>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-violet-500/10">
                  <GlobeAltIcon className="w-5 h-5 text-violet-400" />
                </div>
                <span className="text-sm text-gray-400">Jurisdictions</span>
              </div>
              <p className="text-2xl font-bold text-white">3</p>
              <p className="text-xs text-gray-500 mt-1">Active tax nexus</p>
            </Card>
            <Card>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <LightBulbIcon className="w-5 h-5 text-amber-400" />
                </div>
                <span className="text-sm text-gray-400">Potential Savings</span>
              </div>
              <p className="text-2xl font-bold text-emerald-400 font-mono">$28,460</p>
              <p className="text-xs text-gray-500 mt-1">With optimizations</p>
            </Card>
          </div>

          {/* Alerts & Recommendations */}
          <Card>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <ExclamationTriangleIcon className="w-5 h-5 text-amber-400" />
              Tax Alerts & Recommendations
            </h3>
            <div className="space-y-3">
              {taxAlerts.map((alert, index) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-start gap-4 p-4 rounded-xl ${
                    alert.type === 'warning' ? 'bg-amber-500/10 border border-amber-500/20' :
                    alert.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20' :
                    'bg-sky-500/10 border border-sky-500/20'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${
                    alert.type === 'warning' ? 'bg-amber-500/20' :
                    alert.type === 'success' ? 'bg-emerald-500/20' :
                    'bg-sky-500/20'
                  }`}>
                    {alert.type === 'warning' && <ExclamationTriangleIcon className="w-5 h-5 text-amber-400" />}
                    {alert.type === 'success' && <CheckCircleIcon className="w-5 h-5 text-emerald-400" />}
                    {alert.type === 'info' && <LightBulbIcon className="w-5 h-5 text-sky-400" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-white">{alert.title}</p>
                    <p className="text-sm text-gray-400 mt-1">{alert.message}</p>
                  </div>
                  {alert.savings && (
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Potential Savings</p>
                      <p className="font-mono font-semibold text-emerald-400">{alert.savings}</p>
                    </div>
                  )}
                  {alert.dueDate && (
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Due Date</p>
                      <p className="font-medium text-amber-400">{alert.dueDate}</p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Jurisdictions Tab */}
      {activeTab === 'jurisdictions' && (
        <div className="space-y-6">
          <Card>
            <h3 className="text-lg font-semibold text-white mb-4">Tax Jurisdictions</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {jurisdictions.map((jurisdiction) => (
                <motion.button
                  key={jurisdiction.code}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedJurisdiction(
                    selectedJurisdiction === jurisdiction.code ? null : jurisdiction.code
                  )}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    selectedJurisdiction === jurisdiction.code
                      ? 'bg-emerald-500/10 border-emerald-500/30'
                      : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{jurisdiction.flag}</span>
                    <div>
                      <p className="font-medium text-white">{jurisdiction.name}</p>
                      <p className="text-xs text-gray-500">{jurisdiction.code}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                    <span className="text-xs text-gray-500">Tax Rate</span>
                    <span className="font-mono text-sm text-emerald-400">{jurisdiction.taxRate}</span>
                  </div>
                </motion.button>
              ))}
            </div>
          </Card>

          {/* US State Taxes Detail */}
          <Card>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <FlagIcon className="w-5 h-5 text-sky-400" />
              US State Tax Nexus Analysis
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-white/[0.02] rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-white">California</span>
                  <span className="text-emerald-400 text-sm">Active Nexus</span>
                </div>
                <p className="text-sm text-gray-400 mb-3">Physical presence, employees, significant sales</p>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Apportionment</p>
                    <p className="font-mono text-white">45%</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Taxable Income</p>
                    <p className="font-mono text-white">$55,350</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Est. Tax</p>
                    <p className="font-mono text-amber-400">$4,893</p>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-white/[0.02] rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-white">Delaware</span>
                  <span className="text-sky-400 text-sm">Holding Company</span>
                </div>
                <p className="text-sm text-gray-400 mb-3">Registered agent, no physical presence</p>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Franchise Tax</p>
                    <p className="font-mono text-white">$300/yr</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Income Tax</p>
                    <p className="font-mono text-white">$0</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Status</p>
                    <p className="font-mono text-emerald-400">Compliant</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Optimizations Tab */}
      {activeTab === 'optimizations' && (
        <div className="space-y-4">
          <Card className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 border-violet-500/20">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-violet-500/20">
                <SparklesIcon className="w-6 h-6 text-violet-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white">AI-Powered Structure Optimization</h3>
                <p className="text-sm text-gray-400">Based on your business activity and growth projections</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Total Potential Savings</p>
                <p className="text-2xl font-bold font-mono text-emerald-400">$72,500/yr</p>
              </div>
            </div>
          </Card>

          {structureOptimizations.map((opt, index) => (
            <motion.div
              key={opt.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card 
                className="cursor-pointer hover:border-white/20 transition-colors"
                onClick={() => setExpandedOptimization(expandedOptimization === opt.id ? null : opt.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-emerald-500/10">
                      <BuildingOfficeIcon className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">{opt.title}</h4>
                      <p className="text-sm text-gray-400 mt-1">{opt.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Potential Savings</p>
                      <p className="font-mono font-semibold text-emerald-400">{opt.potentialSavings}</p>
                    </div>
                    <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform ${
                      expandedOptimization === opt.id ? 'rotate-180' : ''
                    }`} />
                  </div>
                </div>
                <AnimatePresence>
                  {expandedOptimization === opt.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t border-white/5"
                    >
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="p-3 bg-white/[0.02] rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Complexity</p>
                          <p className="font-medium text-white">{opt.complexity}</p>
                        </div>
                        <div className="p-3 bg-white/[0.02] rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Timeframe</p>
                          <p className="font-medium text-white">{opt.timeframe}</p>
                        </div>
                        <div className="p-3 bg-white/[0.02] rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">ROI</p>
                          <p className="font-medium text-emerald-400">High</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button className="flex-1 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg font-medium text-white text-sm">
                          Get Started
                        </button>
                        <button className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg font-medium text-gray-300 text-sm transition-colors">
                          Learn More
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Calendar Tab */}
      {activeTab === 'calendar' && (
        <Card>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <CalendarDaysIcon className="w-5 h-5 text-sky-400" />
            Upcoming Tax Deadlines
          </h3>
          <div className="space-y-3">
            {taxDeadlines.map((deadline, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-4 bg-white/[0.02] rounded-xl hover:bg-white/[0.04] transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-white/5 flex flex-col items-center justify-center">
                    <span className="text-xs text-gray-500">{new Date(deadline.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                    <span className="text-lg font-bold text-white">{new Date(deadline.date).getDate()}</span>
                  </div>
                  <div>
                    <p className="font-medium text-white">{deadline.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        deadline.type === 'payment' ? 'bg-amber-500/10 text-amber-400' : 'bg-sky-500/10 text-sky-400'
                      }`}>
                        {deadline.type}
                      </span>
                      <span className="text-xs text-gray-500">{deadline.jurisdiction}</span>
                    </div>
                  </div>
                </div>
                <button className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium text-gray-300 transition-colors">
                  Set Reminder
                </button>
              </motion.div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
