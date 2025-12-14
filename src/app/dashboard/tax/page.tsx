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
  const { t } = useThemeStore();
  const { getActiveStructure, notifications, optimizationResult } = useTaxStore();
  const activeStructure = getActiveStructure();

  const stats = useMemo(() => {
    if (!activeStructure) {
      return {
        totalEntities: 0,
        jurisdictions: 0,
        estimatedTax: 0,
        potentialSavings: 0,
      };
    }

    const uniqueJurisdictions = new Set(
      activeStructure.entities.map((e) => e.jurisdictionCode)
    );

    return {
      totalEntities: activeStructure.entities.length,
      jurisdictions: uniqueJurisdictions.size,
      estimatedTax: 125000, // Mock value
      potentialSavings: optimizationResult?.potentialSavings || 0,
    };
  }, [activeStructure, optimizationResult]);

  const unreadNotifications = notifications.filter((n) => !n.read && !n.dismissed);

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-white/5 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-white/10 p-4"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-500/20">
              <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">{t('tax.entities')}</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalEntities}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-white/5 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-white/10 p-4"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-500/20">
              <Globe className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">{t('tax.jurisdictions')}</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.jurisdictions}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-white/5 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-white/10 p-4"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-500/20">
              <DollarSign className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">{t('tax.estimatedTax')}</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            ${stats.estimatedTax.toLocaleString()}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-white/5 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-white/10 p-4"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-500/20">
              <TrendingDown className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">{t('tax.taxSavings')}</span>
          </div>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            ${stats.potentialSavings.toLocaleString()}
          </p>
        </motion.div>
      </div>

      {/* Notifications & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notifications */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-white/5 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-white/10 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Bell className="w-5 h-5" />
              {t('settings.tabs.notifications')}
            </h3>
            {unreadNotifications.length > 0 && (
              <span className="px-2 py-1 text-xs font-medium bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-full">
                {unreadNotifications.length} new
              </span>
            )}
          </div>

          <div className="space-y-3">
            {unreadNotifications.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm py-4 text-center">
                No new notifications
              </p>
            ) : (
              unreadNotifications.slice(0, 3).map((notification) => (
                <div
                  key={notification.id}
                  className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-lg"
                >
                  <div
                    className={`p-1.5 rounded-lg ${
                      notification.priority === 'HIGH'
                        ? 'bg-red-100 dark:bg-red-500/20'
                        : notification.priority === 'MEDIUM'
                        ? 'bg-amber-100 dark:bg-amber-500/20'
                        : 'bg-blue-100 dark:bg-blue-500/20'
                    }`}
                  >
                    {notification.priority === 'HIGH' ? (
                      <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                    ) : notification.priority === 'MEDIUM' ? (
                      <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    ) : (
                      <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {notification.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                      {notification.message}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-white/5 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-white/10 p-6"
        >
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
          <div className="space-y-2">
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
                  {jurisdiction.corporateTax.standardRate}%
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
                    {/* Withholding Tax - Dividends */}
                    {jurisdiction.withholdingTax && (
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">WHT Dividends</p>
                        <p className="text-gray-900 dark:text-white font-medium">
                          {jurisdiction.withholdingTax.dividends}%
                        </p>
                      </div>
                    )}
                    {/* Withholding Tax - Interest */}
                    {jurisdiction.withholdingTax && (
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">WHT Interest</p>
                        <p className="text-gray-900 dark:text-white font-medium">
                          {jurisdiction.withholdingTax.interest}%
                        </p>
                      </div>
                    )}
                    {/* Withholding Tax - Royalties */}
                    {jurisdiction.withholdingTax && (
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">WHT Royalties</p>
                        <p className="text-gray-900 dark:text-white font-medium">
                          {jurisdiction.withholdingTax.royalties}%
                        </p>
                      </div>
                    )}
                    {/* DTA Partners Count */}
                    {jurisdiction.dtaPartners && (
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">DTA Partners</p>
                        <p className="text-gray-900 dark:text-white font-medium">
                          {jurisdiction.dtaPartners.length}
                        </p>
                      </div>
                    )}
                  </div>
                  {/* Notes if available */}
                  {jurisdiction.corporateTax.notes && (
                    <p className="mt-3 text-xs text-gray-500 dark:text-gray-400 italic">
                      {jurisdiction.corporateTax.notes}
                    </p>
                  )}
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
  const { isLoading, loadDemoData } = useTaxStore();

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
            {isLoading ? t('common.loading') : t('common.refresh')}
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