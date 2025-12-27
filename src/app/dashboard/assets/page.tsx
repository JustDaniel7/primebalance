'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Package,
    TrendingDown,
    DollarSign,
    BarChart3,
    Bell,
    Settings,
    RefreshCw,
} from 'lucide-react';
import { Card } from '@/components/ui';
import { useAssetStore } from '@/store/asset-store';
import { useThemeStore } from '@/store/theme-store';
import {
    AssetMetricsCards,
    AssetRegister,
    AssetForm,
    AssetDetail,
} from '@/components/assets';
import { Asset, BookType } from '@/types/asset';

// =============================================================================
// TAB TYPES
// =============================================================================

type TabId = 'register' | 'depreciation' | 'capex' | 'reports';

// =============================================================================
// DEPRECIATION TAB
// =============================================================================

const DepreciationTab: React.FC = () => {
    const { assets, assetBooks, schedules, postAllDueDepreciation, fetchAssets, isInitialized, isLoading } = useAssetStore();
    useEffect(() => {
  if (!isInitialized) {
    fetchAssets();
  }
}, [fetchAssets, isInitialized]);
    const { t } = useThemeStore();
    const [isRunning, setIsRunning] = useState(false);
    const [lastRunResult, setLastRunResult] = useState<number | null>(null);

    const pendingDepreciations = schedules.reduce((count, schedule) => {
        const pending = schedule.entries.filter(e => !e.isPosted && new Date(e.periodEndDate) <= new Date()).length;
        return count + pending;
    }, 0);

    const handleRunDepreciation = async () => {
        setIsRunning(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        const count = postAllDueDepreciation(new Date().toISOString().split('T')[0], 'user');
        setLastRunResult(count);
        setIsRunning(false);
    };

    return (
        <div className="space-y-6">
            {/* Run Depreciation Card */}
            <Card variant="glass" padding="lg">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('assets.depreciation.runDepreciation')}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {pendingDepreciations > 0
                                ? `${pendingDepreciations} ${t('assets.depreciation.entriesPending')}`
                                : t('assets.depreciation.upToDate')}
                        </p>
                    </div>
                    <button
                        onClick={handleRunDepreciation}
                        disabled={isRunning || pendingDepreciations === 0}
                        className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <RefreshCw className={`w-5 h-5 ${isRunning ? 'animate-spin' : ''}`} />
                        {isRunning ? t('assets.depreciation.running') : t('assets.depreciation.runNow')}
                    </button>
                </div>

                {lastRunResult !== null && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg"
                    >
                        <p className="text-sm text-green-700 dark:text-green-400">
                            ✓ {t('assets.depreciation.posted')} {lastRunResult} {t('assets.depreciation.entriesSuccessfully')}
                        </p>
                    </motion.div>
                )}
            </Card>

            {/* Depreciation Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card variant="glass" padding="md">
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('assets.depreciation.mtdDepreciation')}</p>
                    <p className="text-2xl font-bold text-purple-600 mt-1">
                        €{assetBooks
                        .filter(b => b.bookType === BookType.STATUTORY)
                        .reduce((sum, b) => {
                            const monthly = (b.acquisitionCost - b.salvageValue) / b.usefulLifeMonths;
                            return sum + monthly;
                        }, 0)
                        .toLocaleString('de-DE', { minimumFractionDigits: 0 })}
                    </p>
                </Card>

                <Card variant="glass" padding="md">
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('assets.depreciation.ytdDepreciation')}</p>
                    <p className="text-2xl font-bold text-purple-600 mt-1">
                        €{assetBooks
                        .filter(b => b.bookType === BookType.STATUTORY)
                        .reduce((sum, b) => sum + b.accumulatedDepreciation, 0)
                        .toLocaleString('de-DE', { minimumFractionDigits: 0 })}
                    </p>
                </Card>

                <Card variant="glass" padding="md">
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('assets.depreciation.assetsDepreciating')}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                        {assets.filter(a => a.isActive && !a.isCIP).length}
                    </p>
                </Card>
            </div>

            {/* Upcoming Depreciation */}
            <Card variant="glass" padding="md">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('assets.depreciation.upcomingDepreciation')}</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                            <th className="text-left py-2 text-gray-500">{t('assets.table.asset')}</th>
                            <th className="text-left py-2 text-gray-500">{t('assets.depreciation.period')}</th>
                            <th className="text-right py-2 text-gray-500">{t('assets.depreciation.amount')}</th>
                            <th className="text-right py-2 text-gray-500">{t('assets.depreciation.newNBV')}</th>
                        </tr>
                        </thead>
                        <tbody>
                        {schedules.slice(0, 5).flatMap(schedule => {
                            const asset = assets.find(a => a.id === schedule.assetId);
                            const nextEntry = schedule.entries.find(e => !e.isPosted);
                            if (!asset || !nextEntry) return [];
                            return [{
                                asset,
                                entry: nextEntry,
                            }];
                        }).map(({ asset, entry }) => (
                            <tr key={entry.id} className="border-b border-gray-100 dark:border-gray-800">
                                <td className="py-2 text-gray-900 dark:text-white">{asset.name}</td>
                                <td className="py-2 text-gray-600 dark:text-gray-400">
                                    {new Date(entry.periodStartDate).toLocaleDateString('de-DE', { month: 'short', year: 'numeric' })}
                                </td>
                                <td className="py-2 text-right text-purple-600">
                                    €{entry.depreciationAmount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="py-2 text-right text-gray-900 dark:text-white">
                                    €{entry.closingBookValue.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

// =============================================================================
// CAPEX TAB
// =============================================================================

const CapExTab: React.FC = () => {
    const { capExBudgets, createCapExBudget } = useAssetStore();
    const { t } = useThemeStore();

    return (
        <div className="space-y-6">
            {capExBudgets.length === 0 ? (
                <Card variant="glass" padding="lg" className="text-center">
                    <DollarSign className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('assets.capex.nobudgets')}</h3>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 mb-4">
                        {t('assets.capex.noBudgetsDesc')}
                    </p>
                    <button
                        onClick={() => createCapExBudget({
                            name: `FY${new Date().getFullYear()} CapEx Budget`,
                            fiscalYear: String(new Date().getFullYear()),
                            budgetAmount: 100000,
                            currency: 'EUR',
                        })}
                        className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                        {t('assets.capex.createBudget')}
                    </button>
                </Card>
            ) : (
                <>
                    {capExBudgets.map(budget => (
                        <Card key={budget.id} variant="glass" padding="md">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{budget.name}</h3>
                                    <p className="text-sm text-gray-500">{budget.fiscalYear}</p>
                                </div>
                                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  €{budget.budgetAmount.toLocaleString('de-DE')}
                </span>
                            </div>

                            {/* Progress */}
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">{t('assets.capex.spent')}</span>
                                    <span className="text-gray-900 dark:text-white">
                    €{budget.spentAmount.toLocaleString('de-DE')} ({((budget.spentAmount / budget.budgetAmount) * 100).toFixed(1)}%)
                  </span>
                                </div>
                                <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div className="h-full flex">
                                        <div className="bg-green-500 h-full" style={{ width: `${(budget.spentAmount / budget.budgetAmount) * 100}%` }} />
                                        <div className="bg-yellow-500 h-full" style={{ width: `${(budget.committedAmount / budget.budgetAmount) * 100}%` }} />
                                    </div>
                                </div>
                                <div className="flex justify-between text-xs text-gray-500">
                                    <span>{t('assets.capex.committed')}: €{budget.committedAmount.toLocaleString('de-DE')}</span>
                                    <span>{t('assets.capex.remaining')}: €{budget.remainingAmount.toLocaleString('de-DE')}</span>
                                </div>
                            </div>
                        </Card>
                    ))}
                </>
            )}
        </div>
    );
};

// =============================================================================
// REPORTS TAB
// =============================================================================

const ReportsTab: React.FC = () => {
    const { t } = useThemeStore();

    const reports = [
        { name: t('assets.reports.assetRegister'), desc: t('assets.reports.assetRegisterDesc') },
        { name: t('assets.reports.depSchedule'), desc: t('assets.reports.depScheduleDesc') },
        { name: t('assets.reports.movementReport'), desc: t('assets.reports.movementReportDesc') },
        { name: t('assets.reports.nbvSummary'), desc: t('assets.reports.nbvSummaryDesc') },
    ];

    return (
        <Card variant="glass" padding="lg" className="text-center">
            <BarChart3 className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('assets.reports.title')}</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
                {t('assets.reports.description')}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                {reports.map(report => (
                    <button
                        key={report.name}
                        className="p-4 bg-gray-50 dark:bg-slate-900 rounded-lg text-left hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <p className="font-medium text-gray-900 dark:text-white">{report.name}</p>
                        <p className="text-xs text-gray-500 mt-1">{report.desc}</p>
                    </button>
                ))}
            </div>
        </Card>
    );
};

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

export default function AssetsPage() {
    const { notifications } = useAssetStore();
    const { t } = useThemeStore();
    const [activeTab, setActiveTab] = useState<TabId>('register');
    const [showAssetForm, setShowAssetForm] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

    const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
        { id: 'register', label: t('assets.tabs.register'), icon: Package },
        { id: 'depreciation', label: t('assets.tabs.depreciation'), icon: TrendingDown },
        { id: 'capex', label: t('assets.tabs.capex'), icon: DollarSign },
        { id: 'reports', label: t('assets.tabs.reports'), icon: BarChart3 },
    ];

    // Initialize demo data on first load
    const { fetchAssets, isInitialized } = useAssetStore();

    useEffect(() => {
        if (!isInitialized) {
            fetchAssets();
        }
    }, [isInitialized, fetchAssets]);

    const unreadNotifications = notifications.filter(n => !n.readAt).length;

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('assets.title')}</h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        {t('assets.subtitle')}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg relative">
                        <Bell className="w-5 h-5 text-gray-500" />
                        {unreadNotifications > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {unreadNotifications}
              </span>
                        )}
                    </button>
                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg">
                        <Settings className="w-5 h-5 text-gray-500" />
                    </button>
                </div>
            </div>

            {/* Metrics */}
            <AssetMetricsCards />

            {/* Tab Navigation */}
            <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700">
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
                                activeTab === tab.id
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
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
                    {activeTab === 'register' && (
                        <AssetRegister
                            onSelectAsset={setSelectedAsset}
                            onCreateNew={() => setShowAssetForm(true)}
                        />
                    )}

                    {activeTab === 'depreciation' && <DepreciationTab />}

                    {activeTab === 'capex' && <CapExTab />}

                    {activeTab === 'reports' && <ReportsTab />}
                </motion.div>
            </AnimatePresence>

            {/* Asset Form Modal */}
            <AnimatePresence>
                {showAssetForm && (
                    <AssetForm
                        onClose={() => setShowAssetForm(false)}
                        onSuccess={(id) => {
                            setShowAssetForm(false);
                        }}
                    />
                )}
            </AnimatePresence>

            {/* Asset Detail Modal */}
            <AnimatePresence>
                {selectedAsset && (
                    <AssetDetail
                        asset={selectedAsset}
                        onClose={() => setSelectedAsset(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}