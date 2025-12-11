'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Globe,
  Lightbulb,
  FileText,
  Bell,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  MapPin,
  Percent,
  Search,
  Filter,
  Download,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Info,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Settings,
  X,
  Sparkles,
  Calculator,
  ChevronDown,
} from 'lucide-react';
import { CorporateStructureEditor, TaxOptimizationPanel } from '@/components/tax';
import { useTaxStore, initializeDemoTaxData } from '@/store/tax-store';
import { useThemeStore } from '@/store/theme-store';
import {
  ALL_JURISDICTIONS,
  getJurisdiction,
  getGroupedJurisdictions,
  calculateCorporateTax,
  compareJurisdictions,
  getNoIncomeTaxStates,
  getLowTaxJurisdictions,
} from '@/data/jurisdictions';
import { TaxJurisdictionFull, JurisdictionType } from '@/types/tax';

// =============================================================================
// TAB NAVIGATION
// =============================================================================

type TabId = 'overview' | 'structure' | 'jurisdictions' | 'optimization';

// =============================================================================
// OVERVIEW TAB COMPONENT
// =============================================================================

const OverviewTab: React.FC = () => {
  const { getActiveStructure, notifications, optimizationResult } = useTaxStore();
  const { t } = useThemeStore();
  const structure = getActiveStructure();

  const jurisdictionCount = useMemo(() => {
    if (!structure) return 0;
    return new Set(structure.entities.map(e => e.jurisdictionCode)).size;
  }, [structure]);

  const entityCount = structure?.entities.length || 0;

  const upcomingDeadlines = useMemo(() => {
    return notifications
      .filter(n => n.category === 'DEADLINE' && !n.dismissed)
      .slice(0, 5);
  }, [notifications]);

  const unreadNotifications = notifications.filter(n => !n.read && !n.dismissed);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-100 dark:bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-gray-200 dark:border-white/10"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('tax.entities')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {entityCount}
              </p>
            </div>
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <Building2 className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-100 dark:bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-gray-200 dark:border-white/10"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('tax.jurisdictions')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {jurisdictionCount}
              </p>
            </div>
            <div className="p-3 bg-green-500/20 rounded-lg">
              <Globe className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-100 dark:bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-gray-200 dark:border-white/10"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('tax.taxSavings')}</p>
              <p className="text-2xl font-bold text-emerald-400 mt-1">
                {optimizationResult?.suggestions.length || 0}
              </p>
            </div>
            <div className="p-3 bg-emerald-500/20 rounded-lg">
              <Lightbulb className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-100 dark:bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-gray-200 dark:border-white/10"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('common.warning')}</p>
              <p className="text-2xl font-bold text-orange-400 mt-1">
                {unreadNotifications.length}
              </p>
            </div>
            <div className="p-3 bg-orange-500/20 rounded-lg">
              <Bell className="w-6 h-6 text-orange-400" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Deadlines */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gray-100 dark:bg-white/5 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-white/10"
        >
          <div className="p-4 border-b border-gray-200 dark:border-white/10">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-400" />
              {t('tax.nextDeadline')}
            </h3>
          </div>
          <div className="p-4">
            {upcomingDeadlines.length > 0 ? (
              <div className="space-y-3">
                {upcomingDeadlines.map((deadline) => {
                  const jurisdiction = deadline.relatedJurisdiction 
                    ? getJurisdiction(deadline.relatedJurisdiction)
                    : null;
                  
                  return (
                    <div
                      key={deadline.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/5 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          deadline.priority === 'HIGH' ? 'bg-red-400' :
                          deadline.priority === 'MEDIUM' ? 'bg-yellow-400' : 'bg-green-400'
                        }`} />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{deadline.title}</p>
                          {jurisdiction && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {jurisdiction.flag} {jurisdiction.name}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(deadline.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                {t('common.noData')}
              </p>
            )}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gray-100 dark:bg-white/5 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-white/10"
        >
          <div className="p-4 border-b border-gray-200 dark:border-white/10">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              {t('common.actions')}
            </h3>
          </div>
          <div className="p-4 space-y-3">
            <button className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-white/5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-blue-400" />
                <span className="text-sm text-gray-900 dark:text-white">{t('tax.addEntity')}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
            <button className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-white/5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
              <div className="flex items-center gap-3">
                <Calculator className="w-5 h-5 text-green-400" />
                <span className="text-sm text-gray-900 dark:text-white">{t('tax.runOptimization')}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
            <button className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-white/5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
              <div className="flex items-center gap-3">
                <Download className="w-5 h-5 text-purple-400" />
                <span className="text-sm text-gray-900 dark:text-white">{t('reports.exportPDF')}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

// =============================================================================
// JURISDICTIONS TAB COMPONENT
// =============================================================================

const JurisdictionsTab: React.FC = () => {
  const { t } = useThemeStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<JurisdictionType | 'ALL'>('ALL');
  const [expandedJurisdiction, setExpandedJurisdiction] = useState<string | null>(null);

  const groupedJurisdictions = getGroupedJurisdictions();

  const filteredJurisdictions = useMemo(() => {
    return ALL_JURISDICTIONS.filter((j) => {
      const matchesSearch = j.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           j.code.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = selectedType === 'ALL' || j.type === selectedType;
      return matchesSearch && matchesType;
    });
  }, [searchQuery, selectedType]);

  const jurisdictionTypes: Array<{ value: JurisdictionType | 'ALL'; label: string }> = [
    { value: 'ALL', label: t('common.all') },
    { value: JurisdictionType.US_STATE, label: 'US States' },
    { value: JurisdictionType.US_TERRITORY, label: 'US Territories' },
    { value: JurisdictionType.COUNTRY, label: 'Countries' },
    { value: JurisdictionType.SPECIAL_ZONE, label: 'Special Zones' },
  ];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={t('common.search') + '...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/30"
            />
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {jurisdictionTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => setSelectedType(type.value)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                selectedType === type.value
                  ? 'bg-[var(--accent-primary)] text-white'
                  : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Jurisdictions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredJurisdictions.slice(0, 12).map((jurisdiction, index) => (
          <motion.div
            key={jurisdiction.code}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-gray-100 dark:bg-white/5 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-white/10 p-4 hover:border-[var(--accent-primary)]/50 transition-colors cursor-pointer"
            onClick={() => setExpandedJurisdiction(
              expandedJurisdiction === jurisdiction.code ? null : jurisdiction.code
            )}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{jurisdiction.flag}</span>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{jurisdiction.name}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{jurisdiction.code}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-[var(--accent-primary)]">
                  {jurisdiction.corporateTax.rate}%
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('tax.taxRate')}</p>
              </div>
            </div>

            <AnimatePresence>
              {expandedJurisdiction === jurisdiction.code && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-4 pt-4 border-t border-gray-200 dark:border-white/10"
                >
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {jurisdiction.personalIncomeTax && (
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Income Tax</p>
                        <p className="text-gray-900 dark:text-white font-medium">
                          {jurisdiction.personalIncomeTax.maxRate}%
                        </p>
                      </div>
                    )}
                    {jurisdiction.salesTax && (
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Sales Tax</p>
                        <p className="text-gray-900 dark:text-white font-medium">
                          {jurisdiction.salesTax.stateRate}%
                        </p>
                      </div>
                    )}
                    {jurisdiction.capitalGainsTax && (
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Capital Gains</p>
                        <p className="text-gray-900 dark:text-white font-medium">
                          {jurisdiction.capitalGainsTax.shortTermRate}%
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {filteredJurisdictions.length > 12 && (
        <p className="text-center text-gray-500 dark:text-gray-400 text-sm">
          +{filteredJurisdictions.length - 12} more jurisdictions
        </p>
      )}
    </div>
  );
};

// =============================================================================
// MAIN TAX CENTER PAGE
// =============================================================================

export default function TaxCenterPage() {
  const { t } = useThemeStore();
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const { loadDemoData, isLoading } = useTaxStore();

  // Initialize demo data
  useEffect(() => {
    initializeDemoTaxData();
  }, []);

  const tabs = [
    { id: 'overview' as TabId, label: t('nav.dashboard'), icon: BarChart3 },
    { id: 'structure' as TabId, label: t('tax.corporateStructure'), icon: Building2 },
    { id: 'jurisdictions' as TabId, label: t('tax.jurisdictions'), icon: Globe },
    { id: 'optimization' as TabId, label: t('tax.optimization'), icon: Lightbulb },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-display">
            {t('tax.title')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {t('tax.subtitle')}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => loadDemoData()}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            {t('common.loading')}
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-primary-hover)] transition-colors">
            <Plus className="w-4 h-4" />
            {t('tax.addEntity')}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-white/10 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-[var(--accent-primary)] text-[var(--accent-primary)]'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'structure' && <CorporateStructureEditor />}
          {activeTab === 'jurisdictions' && <JurisdictionsTab />}
          {activeTab === 'optimization' && <TaxOptimizationPanel />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
