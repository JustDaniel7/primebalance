'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    MapPin,
    TrendingDown,
    FileText,
    AlertTriangle,
    ArrowRight,
    ShoppingCart,
    Ban,
} from 'lucide-react';
import { useAssetStore } from '@/store/asset-store';
import toast from 'react-hot-toast';
import { useThemeStore } from '@/store/theme-store';
import { Asset, AssetStatus, AssetCategory, BookType } from '@/types/asset';
import { calculateBookValue, canDepreciate } from '@/lib/depreciation-engine';
import { ASSET_CLASS_CONFIGS } from '@/data/asset-classes';
import { DepreciationScheduleView } from './DepreciationScheduleView';
import { AssetLifecycleTimeline } from './AssetLifecycleTimeline';
import { DisposalForm } from './DisposalForm';

interface AssetDetailProps {
    asset: Asset;
    onClose: () => void;
}

export const AssetDetail: React.FC<AssetDetailProps> = ({ asset, onClose }) => {
    const { assetBooks, getSchedule, holdForSale, writeOffAsset } = useAssetStore();
    const { t } = useThemeStore();
    const [activeTab, setActiveTab] = useState<'overview' | 'depreciation' | 'history'>('overview');
    const [showDisposalForm, setShowDisposalForm] = useState(false);
    const [showWriteOffConfirm, setShowWriteOffConfirm] = useState(false);

    const statutoryBook = assetBooks.find(b => b.assetId === asset.id && b.bookType === BookType.STATUTORY);
    const taxBook = assetBooks.find(b => b.assetId === asset.id && b.bookType === BookType.TAX);
    const schedule = getSchedule(asset.id, BookType.STATUTORY);

    const netBookValue = statutoryBook ? calculateBookValue(statutoryBook) : asset.capitalizedCost;
    const categoryConfig = ASSET_CLASS_CONFIGS[asset.category];

    const depreciableBase = (statutoryBook?.acquisitionCost || asset.acquisitionCost) - (statutoryBook?.salvageValue || asset.salvageValue);
    const percentDepreciated = depreciableBase > 0 ? ((statutoryBook?.accumulatedDepreciation || 0) / depreciableBase) * 100 : 0;

    const categoryLabels: Record<AssetCategory, string> = {
        [AssetCategory.BUILDINGS]: t('assets.category.buildings'),
        [AssetCategory.MACHINERY]: t('assets.category.machinery'),
        [AssetCategory.VEHICLES]: t('assets.category.vehicles'),
        [AssetCategory.IT_EQUIPMENT]: t('assets.category.itEquipment'),
        [AssetCategory.FURNITURE]: t('assets.category.furniture'),
        [AssetCategory.INTANGIBLE_ASSETS]: t('assets.category.intangibleAssets'),
        [AssetCategory.CAPITALIZED_SOFTWARE]: t('assets.category.capitalizedSoftware'),
        [AssetCategory.LEASEHOLD_IMPROVEMENTS]: t('assets.category.leaseholdImprovements'),
        [AssetCategory.LAND]: t('assets.category.land'),
        [AssetCategory.CONSTRUCTION_IN_PROGRESS]: t('assets.category.constructionInProgress'),
        [AssetCategory.RIGHT_OF_USE]: t('assets.category.rightOfUse'),
    };

    const statusLabels: Record<AssetStatus, string> = {
        [AssetStatus.PLANNED]: t('assets.status.planned'),
        [AssetStatus.ACQUIRED]: t('assets.status.acquired'),
        [AssetStatus.CAPITALIZED]: t('assets.status.capitalized'),
        [AssetStatus.IN_USE]: t('assets.status.inUse'),
        [AssetStatus.FULLY_DEPRECIATED]: t('assets.status.fullyDepreciated'),
        [AssetStatus.IMPAIRED]: t('assets.status.impaired'),
        [AssetStatus.HELD_FOR_SALE]: t('assets.status.heldForSale'),
        [AssetStatus.DISPOSED]: t('assets.status.disposed'),
        [AssetStatus.SOLD]: t('assets.status.sold'),
        [AssetStatus.WRITTEN_OFF]: t('assets.status.writtenOff'),
    };

    const tabLabels: Record<string, string> = {
        overview: t('assets.detail.overview'),
        depreciation: t('assets.detail.depreciation'),
        history: t('assets.detail.history'),
    };

    const handleHoldForSale = () => {
        holdForSale(asset.id, t('assets.event.heldForSale'), 'user');
        toast.success(t('assets.detail.heldForSaleSuccess') || 'Asset marked as held for sale');
        onClose();
    };

    const handleWriteOff = () => {
        writeOffAsset(asset.id, t('assets.event.writtenOff'), 'user');
        setShowWriteOffConfirm(false);
        toast.success(t('assets.detail.writeOffSuccess') || 'Asset written off successfully');
        onClose();
    };

    const statusColors: Record<AssetStatus, string> = {
        [AssetStatus.PLANNED]: 'bg-slate-100 text-slate-700',
        [AssetStatus.ACQUIRED]: 'bg-blue-100 text-blue-700',
        [AssetStatus.CAPITALIZED]: 'bg-cyan-100 text-cyan-700',
        [AssetStatus.IN_USE]: 'bg-green-100 text-green-700',
        [AssetStatus.FULLY_DEPRECIATED]: 'bg-purple-100 text-purple-700',
        [AssetStatus.IMPAIRED]: 'bg-amber-100 text-amber-700',
        [AssetStatus.HELD_FOR_SALE]: 'bg-orange-100 text-orange-700',
        [AssetStatus.DISPOSED]: 'bg-red-100 text-red-700',
        [AssetStatus.SOLD]: 'bg-emerald-100 text-emerald-700',
        [AssetStatus.WRITTEN_OFF]: 'bg-red-100 text-red-700',
    };

    return (
        <>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto"
                onClick={(e) => e.target === e.currentTarget && onClose()}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-4xl w-full my-8"
                >
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="flex items-center gap-3">
                                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{asset.name}</h2>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[asset.status]}`}>
                                        {statusLabels[asset.status]}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    {asset.assetNumber} • {categoryLabels[asset.category]}
                                </p>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-4 mt-4">
                            {(['overview', 'depreciation', 'history'] as const).map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                                        activeTab === tab
                                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                                            : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                                >
                                    {tabLabels[tab]}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        {activeTab === 'overview' && (
                            <div className="space-y-6">
                                {/* Key Metrics */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="p-4 bg-gray-50 dark:bg-slate-900 rounded-xl">
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{t('assets.table.acquisitionCost')}</p>
                                        <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                                            €{asset.acquisitionCost.toLocaleString('de-DE')}
                                        </p>
                                    </div>
                                    <div className="p-4 bg-gray-50 dark:bg-slate-900 rounded-xl">
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{t('assets.netBookValue')}</p>
                                        <p className="text-lg font-bold text-green-600 mt-1">
                                            €{netBookValue.toLocaleString('de-DE')}
                                        </p>
                                    </div>
                                    <div className="p-4 bg-gray-50 dark:bg-slate-900 rounded-xl">
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{t('assets.detail.accumulatedDep')}</p>
                                        <p className="text-lg font-bold text-purple-600 mt-1">
                                            €{(statutoryBook?.accumulatedDepreciation || 0).toLocaleString('de-DE')}
                                        </p>
                                    </div>
                                    <div className="p-4 bg-gray-50 dark:bg-slate-900 rounded-xl">
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{t('assets.depreciated')}</p>
                                        <p className="text-lg font-bold text-blue-600 mt-1">
                                            {percentDepreciated.toFixed(1)}%
                                        </p>
                                    </div>
                                </div>

                                {/* Asset Information */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                            <FileText className="w-4 h-4" /> {t('assets.detail.assetInformation')}
                                        </h3>
                                        <div className="space-y-3">
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-500">{t('assets.detail.assetNumber')}</span>
                                                <span className="text-sm font-medium text-gray-900 dark:text-white">{asset.assetNumber}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-500">{t('assets.detail.type')}</span>
                                                <span className="text-sm font-medium text-gray-900 dark:text-white">{asset.assetType}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-500">{t('assets.detail.category')}</span>
                                                <span className="text-sm font-medium text-gray-900 dark:text-white">{categoryLabels[asset.category]}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-500">{t('assets.detail.usefulLife')}</span>
                                                <span className="text-sm font-medium text-gray-900 dark:text-white">{asset.usefulLifeMonths} {t('assets.detail.months')}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                            <MapPin className="w-4 h-4" /> {t('assets.detail.locationAssignment')}
                                        </h3>
                                        <div className="space-y-3">
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-500">{t('assets.detail.entity')}</span>
                                                <span className="text-sm font-medium text-gray-900 dark:text-white">{asset.legalEntityId || t('assets.detail.notAssigned')}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-500">{t('assets.detail.costCenter')}</span>
                                                <span className="text-sm font-medium text-gray-900 dark:text-white">{asset.costCenterId || t('assets.detail.notAssigned')}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-500">{t('assets.detail.location')}</span>
                                                <span className="text-sm font-medium text-gray-900 dark:text-white">{asset.location || t('assets.detail.notAssigned')}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-500">{t('assets.detail.responsible')}</span>
                                                <span className="text-sm font-medium text-gray-900 dark:text-white">{asset.responsibleParty || t('assets.detail.notAssigned')}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Tax Book Comparison */}
                                {taxBook && statutoryBook && (
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                            <FileText className="w-4 h-4" /> {t('assets.detail.bookComparison')}
                                        </h3>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                <tr className="border-b border-gray-200 dark:border-gray-700">
                                                    <th className="text-left py-2 text-gray-500"></th>
                                                    <th className="text-right py-2 text-gray-500">{t('assets.detail.statutory')}</th>
                                                    <th className="text-right py-2 text-gray-500">{t('assets.detail.tax')}</th>
                                                    <th className="text-right py-2 text-gray-500">Δ</th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                <tr className="border-b border-gray-100 dark:border-gray-800">
                                                    <td className="py-2">{t('assets.detail.nbv')}</td>
                                                    <td className="py-2 text-right">€{calculateBookValue(statutoryBook).toLocaleString('de-DE')}</td>
                                                    <td className="py-2 text-right">€{calculateBookValue(taxBook).toLocaleString('de-DE')}</td>
                                                    <td className="py-2 text-right font-medium">
                                                        €{(calculateBookValue(statutoryBook) - calculateBookValue(taxBook)).toLocaleString('de-DE')}
                                                    </td>
                                                </tr>
                                                <tr className="border-b border-gray-100 dark:border-gray-800">
                                                    <td className="py-2">{t('assets.detail.accumulatedDep')}</td>
                                                    <td className="py-2 text-right">€{statutoryBook.accumulatedDepreciation.toLocaleString('de-DE')}</td>
                                                    <td className="py-2 text-right">€{taxBook.accumulatedDepreciation.toLocaleString('de-DE')}</td>
                                                    <td className="py-2 text-right font-medium">
                                                        €{(statutoryBook.accumulatedDepreciation - taxBook.accumulatedDepreciation).toLocaleString('de-DE')}
                                                    </td>
                                                </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* Actions */}
                                {asset.isActive && (
                                    <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                                        {canDepreciate(asset) && (
                                            <button className="px-4 py-2 text-sm bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 flex items-center gap-2">
                                                <TrendingDown className="w-4 h-4" /> {t('assets.detail.runDepreciation')}
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setShowDisposalForm(true)}
                                            className="px-4 py-2 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 flex items-center gap-2"
                                        >
                                            <ShoppingCart className="w-4 h-4" /> {t('assets.detail.disposeSell')}
                                        </button>
                                        <button
                                            onClick={handleHoldForSale}
                                            className="px-4 py-2 text-sm bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-900/50 flex items-center gap-2"
                                        >
                                            <ArrowRight className="w-4 h-4" /> {t('assets.detail.holdForSale')}
                                        </button>
                                        <button
                                            onClick={() => setShowWriteOffConfirm(true)}
                                            className="px-4 py-2 text-sm bg-red-100 dark:bg-red-900/30 text-red-600 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 flex items-center gap-2"
                                        >
                                            <Ban className="w-4 h-4" /> {t('assets.detail.writeOff')}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'depreciation' && (
                            <DepreciationScheduleView assetId={asset.id} bookType={BookType.STATUTORY} />
                        )}

                        {activeTab === 'history' && (
                            <AssetLifecycleTimeline assetId={asset.id} />
                        )}
                    </div>
                </motion.div>
            </motion.div>

            {/* Disposal Form Modal */}
            <AnimatePresence>
                {showDisposalForm && (
                    <DisposalForm asset={asset} onClose={() => setShowDisposalForm(false)} />
                )}
            </AnimatePresence>

            {/* Write-off Confirmation */}
            <AnimatePresence>
                {showWriteOffConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.95 }}
                            className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-md w-full"
                        >
                            <div className="flex items-center gap-3 text-red-600 mb-4">
                                <AlertTriangle className="w-6 h-6" />
                                <h3 className="text-lg font-semibold">{t('assets.detail.confirmWriteOff')}</h3>
                            </div>
                            <p className="text-gray-600 dark:text-gray-300 mb-4">
                                {t('assets.detail.writeOffWarning')} €{netBookValue.toLocaleString('de-DE')}. {t('assets.detail.writeOffReason')}
                            </p>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setShowWriteOffConfirm(false)}
                                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900"
                                >
                                    {t('common.cancel')}
                                </button>
                                <button
                                    onClick={handleWriteOff}
                                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                                >
                                    {t('assets.detail.confirmWriteOffButton')}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};