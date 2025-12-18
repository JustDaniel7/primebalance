'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    Filter,
    Download,
    Plus,
    ChevronRight,
    Building2,
    Car,
    Monitor,
    Armchair,
    Code,
    Map,
    HardHat,
    FileSignature,
    Cog,
    MoreVertical,
    Eye,
    Edit2,
    Trash2,
    TrendingDown,
    AlertTriangle,
} from 'lucide-react';
import { Card, Button, Badge, Input } from '@/components/ui';
import { useAssetStore } from '@/store/asset-store';
import { AssetStatus, AssetCategory, BookType, Asset } from '@/types/asset';
import { calculateBookValue } from '@/lib/depreciation-engine';

// =============================================================================
// ICON MAPPING
// =============================================================================

const categoryIcons: Record<AssetCategory, React.ElementType> = {
    [AssetCategory.BUILDINGS]: Building2,
    [AssetCategory.MACHINERY]: Cog,
    [AssetCategory.VEHICLES]: Car,
    [AssetCategory.IT_EQUIPMENT]: Monitor,
    [AssetCategory.FURNITURE]: Armchair,
    [AssetCategory.INTANGIBLE_ASSETS]: FileSignature,
    [AssetCategory.CAPITALIZED_SOFTWARE]: Code,
    [AssetCategory.LEASEHOLD_IMPROVEMENTS]: HardHat,
    [AssetCategory.LAND]: Map,
    [AssetCategory.CONSTRUCTION_IN_PROGRESS]: HardHat,
    [AssetCategory.RIGHT_OF_USE]: FileSignature,
};

const statusConfig: Record<AssetStatus, { label: string; color: string }> = {
    [AssetStatus.PLANNED]: { label: 'Planned', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
    [AssetStatus.ACQUIRED]: { label: 'Acquired', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    [AssetStatus.CAPITALIZED]: { label: 'Capitalized', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400' },
    [AssetStatus.IN_USE]: { label: 'In Use', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    [AssetStatus.FULLY_DEPRECIATED]: { label: 'Fully Depreciated', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
    [AssetStatus.IMPAIRED]: { label: 'Impaired', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    [AssetStatus.HELD_FOR_SALE]: { label: 'Held for Sale', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
    [AssetStatus.DISPOSED]: { label: 'Disposed', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
    [AssetStatus.SOLD]: { label: 'Sold', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
    [AssetStatus.WRITTEN_OFF]: { label: 'Written Off', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
};

// =============================================================================
// COMPONENT
// =============================================================================

interface AssetRegisterProps {
    onSelectAsset: (asset: Asset) => void;
    onCreateNew: () => void;
}

export const AssetRegister: React.FC<AssetRegisterProps> = ({ onSelectAsset, onCreateNew }) => {
    const { assets, assetBooks, dashboardState, setFilters } = useAssetStore();
    const [showFilters, setShowFilters] = useState(false);
    const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

    const filteredAssets = useMemo(() => {
        const { filters } = dashboardState;

        return assets.filter(asset => {
            if (filters.status !== 'ALL' && asset.status !== filters.status) return false;
            if (filters.category !== 'ALL' && asset.category !== filters.category) return false;
            if (filters.entityId && asset.legalEntityId !== filters.entityId) return false;
            if (filters.searchQuery) {
                const query = filters.searchQuery.toLowerCase();
                return (
                    asset.name.toLowerCase().includes(query) ||
                    asset.assetNumber.toLowerCase().includes(query) ||
                    asset.description?.toLowerCase().includes(query)
                );
            }
            return true;
        });
    }, [assets, dashboardState.filters]);

    const getAssetBookValue = (assetId: string): number => {
        const book = assetBooks.find(b => b.assetId === assetId && b.bookType === BookType.STATUTORY);
        return book ? calculateBookValue(book) : 0;
    };

    const getDepreciationPercent = (assetId: string): number => {
        const book = assetBooks.find(b => b.assetId === assetId && b.bookType === BookType.STATUTORY);
        if (!book) return 0;
        const depreciableBase = book.acquisitionCost - book.salvageValue;
        return depreciableBase > 0 ? (book.accumulatedDepreciation / depreciableBase) * 100 : 0;
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search assets..."
                        value={dashboardState.filters.searchQuery}
                        onChange={(e) => setFilters({ searchQuery: e.target.value })}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`px-3 py-2 rounded-lg border transition-colors flex items-center gap-2 ${
                            showFilters
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                                : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-slate-800'
                        }`}
                    >
                        <Filter className="w-4 h-4" />
                        Filters
                    </button>

                    <button className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2">
                        <Download className="w-4 h-4" />
                        Export
                    </button>

                    <button
                        onClick={onCreateNew}
                        className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Add Asset
                    </button>
                </div>
            </div>

            {/* Filters Panel */}
            <AnimatePresence>
                {showFilters && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                    >
                        <Card variant="glass" padding="md">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Status
                                    </label>
                                    <select
                                        value={dashboardState.filters.status}
                                        onChange={(e) => setFilters({ status: e.target.value as AssetStatus | 'ALL' })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                                    >
                                        <option value="ALL">All Statuses</option>
                                        {Object.values(AssetStatus).map(status => (
                                            <option key={status} value={status}>{statusConfig[status].label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Category
                                    </label>
                                    <select
                                        value={dashboardState.filters.category}
                                        onChange={(e) => setFilters({ category: e.target.value as AssetCategory | 'ALL' })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                                    >
                                        <option value="ALL">All Categories</option>
                                        {Object.values(AssetCategory).map(cat => (
                                            <option key={cat} value={cat}>{cat.replace(/_/g, ' ')}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex items-end">
                                    <button
                                        onClick={() => setFilters({ status: 'ALL', category: 'ALL', searchQuery: '' })}
                                        className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                                    >
                                        Clear Filters
                                    </button>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Asset List */}
            <Card variant="glass" padding="none">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">Asset</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">Category</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
                            <th className="text-right px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">Acquisition Cost</th>
                            <th className="text-right px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">Net Book Value</th>
                            <th className="text-right px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">Depreciated</th>
                            <th className="text-center px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filteredAssets.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                                    No assets found. Create your first asset to get started.
                                </td>
                            </tr>
                        ) : (
                            filteredAssets.map((asset, index) => {
                                const Icon = categoryIcons[asset.category];
                                const status = statusConfig[asset.status];
                                const nbv = getAssetBookValue(asset.id);
                                const depPercent = getDepreciationPercent(asset.id);

                                return (
                                    <motion.tr
                                        key={asset.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: index * 0.03 }}
                                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-slate-800/50 cursor-pointer"
                                        onClick={() => onSelectAsset(asset)}
                                    >
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-gray-100 dark:bg-slate-700">
                                                    <Icon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-white">{asset.name}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{asset.assetNumber}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {asset.category.replace(/_/g, ' ')}
                        </span>
                                        </td>
                                        <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                          {status.label}
                        </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                        <span className="text-sm text-gray-900 dark:text-white">
                          €{asset.acquisitionCost.toLocaleString('de-DE')}
                        </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          €{nbv.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                        </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-blue-500 rounded-full"
                                                        style={{ width: `${Math.min(100, depPercent)}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs text-gray-500 dark:text-gray-400 w-12 text-right">
                            {depPercent.toFixed(1)}%
                          </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-center relative">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setMenuOpenId(menuOpenId === asset.id ? null : asset.id);
                                                    }}
                                                    className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded"
                                                >
                                                    <MoreVertical className="w-4 h-4 text-gray-500" />
                                                </button>

                                                <AnimatePresence>
                                                    {menuOpenId === asset.id && (
                                                        <motion.div
                                                            initial={{ opacity: 0, scale: 0.95 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            exit={{ opacity: 0, scale: 0.95 }}
                                                            className="absolute right-0 top-full mt-1 z-10 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[120px]"
                                                        >
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onSelectAsset(asset);
                                                                    setMenuOpenId(null);
                                                                }}
                                                                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2"
                                                            >
                                                                <Eye className="w-4 h-4" /> View
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setMenuOpenId(null);
                                                                }}
                                                                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2"
                                                            >
                                                                <Edit2 className="w-4 h-4" /> Edit
                                                            </button>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </td>
                                    </motion.tr>
                                );
                            })
                        )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};