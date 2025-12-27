'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    Filter,
    BookOpen,
    FileText,
    Building2,
    Briefcase,
    FolderOpen,
    FileSignature,
    Calendar,
    ChevronDown,
    Download,
    RotateCcw,
    Trash2,
    Eye,
    Tag,
    Archive,
    X,
    ChevronRight,
} from 'lucide-react';
import { Card, Button, Badge, Input } from '@/components/ui';
import { useThemeStore } from '@/store/theme-store';
import { useArchiveStore } from '@/store/archive-store';
import type { ArchiveCategory, ArchiveItem } from '@/types/archive';

// =============================================================================
// CATEGORY ICONS MAP
// =============================================================================

const categoryIcons: Record<ArchiveCategory, React.ElementType> = {
    bookings: BookOpen,
    invoices: FileText,
    bank: Building2,
    services: Briefcase,
    documents: FolderOpen,
    contracts: FileSignature,
};

const categoryColors: Record<ArchiveCategory, string> = {
    bookings: 'blue',
    invoices: 'green',
    bank: 'purple',
    services: 'amber',
    documents: 'gray',
    contracts: 'rose',
};

// =============================================================================
// ARCHIVE PAGE COMPONENT
// =============================================================================

export default function ArchivePage() {
    const { t, language } = useThemeStore();
    const { items, filter, setFilter, resetFilter, getFilteredItems, getStats, restoreFromArchive, permanentlyDelete, fetchItems, isInitialized, isLoading } = useArchiveStore();
    useEffect(() => {
  if (!isInitialized) {
    fetchItems();
  }
}, [fetchItems, isInitialized]);
    const [selectedCategory, setSelectedCategory] = useState<ArchiveCategory | null>(null);
    const [selectedItem, setSelectedItem] = useState<ArchiveItem | null>(null);
    const [showYearFilter, setShowYearFilter] = useState(false);

    const stats = getStats();
    const filteredItems = getFilteredItems();

    // Get available years
    const availableYears = useMemo(() => {
        const years = Array.from(new Set(items.map((i) => i.fiscalYear))).sort((a, b) => b - a);
        return years;
    }, [items]);

    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat(language === 'de' ? 'de-DE' : language === 'fr' ? 'fr-FR' : language === 'es' ? 'es-ES' : 'en-US', {
            style: 'currency',
            currency,
        }).format(amount);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString(language === 'de' ? 'de-DE' : language === 'fr' ? 'fr-FR' : language === 'es' ? 'es-ES' : 'en-US');
    };

    const getCategoryBadgeColor = (category: ArchiveCategory): 'info' | 'success' | 'warning' | 'neutral' | 'danger' => {
        const map: Record<ArchiveCategory, 'info' | 'success' | 'warning' | 'neutral' | 'danger'> = {
            bookings: 'info',
            invoices: 'success',
            bank: 'info',
            services: 'warning',
            documents: 'neutral',
            contracts: 'danger',
        };
        return map[category];
    };

    const handleCategoryClick = (category: ArchiveCategory) => {
        if (selectedCategory === category) {
            setSelectedCategory(null);
            setFilter({ category: undefined });
        } else {
            setSelectedCategory(category);
            setFilter({ category });
        }
    };

    const handleRestore = (item: ArchiveItem) => {
        restoreFromArchive(item.id);
        setSelectedItem(null);
    };

    const handleDelete = (item: ArchiveItem) => {
        if (confirm(t('archive.confirmDelete'))) {
            permanentlyDelete(item.id);
            setSelectedItem(null);
        }
    };

    // Category Cards
    const categories: Array<{ key: ArchiveCategory; label: string }> = [
        { key: 'bookings', label: t('archive.category.bookings') },
        { key: 'invoices', label: t('archive.category.invoices') },
        { key: 'bank', label: t('archive.category.bank') },
        { key: 'services', label: t('archive.category.services') },
        { key: 'documents', label: t('archive.category.documents') },
        { key: 'contracts', label: t('archive.category.contracts') },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-surface-100 font-display">
                        {t('archive.title')}
                    </h1>
                    <p className="text-gray-500 dark:text-surface-500 mt-1">{t('archive.subtitle')}</p>
                </div>
                <div className="flex gap-2">
                    <div className="relative">
                        <button
                            onClick={() => setShowYearFilter(!showYearFilter)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-surface-800/50 border border-gray-200 dark:border-surface-700 rounded-xl text-gray-700 dark:text-surface-300 hover:bg-gray-50 dark:hover:bg-surface-700/50"
                        >
                            <Calendar size={18} />
                            <span>{filter.fiscalYear || t('archive.allYears')}</span>
                            <ChevronDown size={16} />
                        </button>
                        {showYearFilter && (
                            <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-surface-800 border border-gray-200 dark:border-surface-700 rounded-xl shadow-lg z-10">
                                <button
                                    onClick={() => { setFilter({ fiscalYear: undefined }); setShowYearFilter(false); }}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-surface-700 rounded-t-xl"
                                >
                                    {t('archive.allYears')}
                                </button>
                                {availableYears.map((year) => (
                                    <button
                                        key={year}
                                        onClick={() => { setFilter({ fiscalYear: year }); setShowYearFilter(false); }}
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-surface-700"
                                    >
                                        {year}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card variant="glass" padding="md">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[var(--accent-primary)]/10 flex items-center justify-center">
                            <Archive size={20} className="text-[var(--accent-primary)]" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-surface-400">{t('archive.totalItems')}</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-surface-100">{stats.totalItems}</p>
                        </div>
                    </div>
                </Card>
                <Card variant="glass" padding="md">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                            <FileText size={20} className="text-green-500" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-surface-400">{t('archive.category.invoices')}</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-surface-100">{stats.byCategory.invoices}</p>
                        </div>
                    </div>
                </Card>
                <Card variant="glass" padding="md">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
                            <FileSignature size={20} className="text-rose-500" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-surface-400">{t('archive.category.contracts')}</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-surface-100">{stats.byCategory.contracts}</p>
                        </div>
                    </div>
                </Card>
                <Card variant="glass" padding="md">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                            <Briefcase size={20} className="text-amber-500" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-surface-400">{t('archive.totalValue')}</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-surface-100">{formatCurrency(stats.totalValue, 'EUR')}</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Category Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {categories.map((cat) => {
                    const Icon = categoryIcons[cat.key];
                    const count = stats.byCategory[cat.key];
                    const isSelected = selectedCategory === cat.key;

                    return (
                        <button
                            key={cat.key}
                            onClick={() => handleCategoryClick(cat.key)}
                            className={`p-4 rounded-xl border-2 transition-all text-left ${
                                isSelected
                                    ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/5'
                                    : 'border-gray-200 dark:border-surface-700 hover:border-gray-300 dark:hover:border-surface-600 bg-white dark:bg-surface-800/50'
                            }`}
                        >
                            <Icon size={24} className={isSelected ? 'text-[var(--accent-primary)]' : 'text-gray-400 dark:text-surface-500'} />
                            <p className={`font-medium mt-2 ${isSelected ? 'text-[var(--accent-primary)]' : 'text-gray-900 dark:text-surface-100'}`}>
                                {cat.label}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-surface-400">{count} {t('archive.items')}</p>
                        </button>
                    );
                })}
            </div>

            {/* Search */}
            <div className="flex gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder={t('archive.search')}
                        value={filter.searchQuery || ''}
                        onChange={(e) => setFilter({ searchQuery: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-surface-800/50 border border-gray-200 dark:border-surface-700 rounded-xl text-gray-900 dark:text-surface-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20 focus:border-[var(--accent-primary)]"
                    />
                </div>
                {(filter.category || filter.fiscalYear || filter.searchQuery) && (
                    <Button variant="secondary" onClick={resetFilter}>
                        <X size={18} className="mr-2" />
                        {t('archive.clearFilter')}
                    </Button>
                )}
            </div>

            {/* Items List */}
            <div className="space-y-3">
                {filteredItems.length === 0 ? (
                    <Card variant="glass" padding="lg" className="text-center">
                        <Archive size={48} className="mx-auto text-gray-300 dark:text-surface-600 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-surface-100">{t('archive.noItems')}</h3>
                        <p className="text-gray-500 dark:text-surface-400 mt-1">{t('archive.noItemsDesc')}</p>
                    </Card>
                ) : (
                    filteredItems.map((item, index) => {
                        const Icon = categoryIcons[item.category];
                        return (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.03 }}
                            >
                                <Card variant="glass" padding="md" hover className="cursor-pointer" onClick={() => setSelectedItem(item)}>
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-4 min-w-0">
                                            <div className={`w-10 h-10 rounded-xl bg-${categoryColors[item.category]}-500/10 flex items-center justify-center flex-shrink-0`}>
                                                <Icon size={20} className={`text-${categoryColors[item.category]}-500`} />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900 dark:text-surface-100 truncate">
                            {item.title}
                          </span>
                                                    <Badge variant={getCategoryBadgeColor(item.category)} size="sm">
                                                        {t(`archive.category.${item.category}`)}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-gray-500 dark:text-surface-400 truncate">
                                                    {item.description || item.counterparty}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right hidden sm:block">
                                                {item.amount && (
                                                    <p className="font-semibold text-gray-900 dark:text-surface-100">
                                                        {formatCurrency(item.amount, item.currency || 'EUR')}
                                                    </p>
                                                )}
                                                <p className="text-sm text-gray-500 dark:text-surface-400">
                                                    {formatDate(item.itemDate)}
                                                </p>
                                            </div>
                                            <Badge variant="neutral" size="sm">{item.fiscalYear}</Badge>
                                            <ChevronRight size={16} className="text-gray-400" />
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        );
                    })
                )}
            </div>

            {/* Detail Modal */}
            <AnimatePresence>
                {selectedItem && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                        onClick={() => setSelectedItem(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="w-full max-w-lg bg-white dark:bg-surface-800 rounded-2xl shadow-xl overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="p-6 border-b border-gray-200 dark:border-surface-700">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        {React.createElement(categoryIcons[selectedItem.category], { size: 24, className: 'text-[var(--accent-primary)]' })}
                                        <div>
                                            <h2 className="text-lg font-semibold text-gray-900 dark:text-surface-100">{selectedItem.title}</h2>
                                            <p className="text-sm text-gray-500 dark:text-surface-400">{selectedItem.originalId}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setSelectedItem(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-surface-700 rounded-lg">
                                        <X size={20} className="text-gray-500" />
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6 space-y-4">
                                {selectedItem.description && (
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-surface-400">{t('common.description')}</p>
                                        <p className="text-gray-900 dark:text-surface-100">{selectedItem.description}</p>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    {selectedItem.amount && (
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-surface-400">{t('common.amount')}</p>
                                            <p className="font-semibold text-gray-900 dark:text-surface-100">
                                                {formatCurrency(selectedItem.amount, selectedItem.currency || 'EUR')}
                                            </p>
                                        </div>
                                    )}
                                    {selectedItem.counterparty && (
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-surface-400">{t('archive.counterparty')}</p>
                                            <p className="text-gray-900 dark:text-surface-100">{selectedItem.counterparty}</p>
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-surface-400">{t('common.date')}</p>
                                        <p className="text-gray-900 dark:text-surface-100">{formatDate(selectedItem.itemDate)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-surface-400">{t('archive.archivedAt')}</p>
                                        <p className="text-gray-900 dark:text-surface-100">{formatDate(selectedItem.archivedAt)}</p>
                                    </div>
                                </div>

                                {selectedItem.periodStart && selectedItem.periodEnd && (
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-surface-400">{t('archive.period')}</p>
                                        <p className="text-gray-900 dark:text-surface-100">
                                            {formatDate(selectedItem.periodStart)} - {formatDate(selectedItem.periodEnd)}
                                        </p>
                                    </div>
                                )}

                                {selectedItem.tags && selectedItem.tags.length > 0 && (
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-surface-400 mb-2">{t('archive.tags')}</p>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedItem.tags.map((tag) => (
                                                <span key={tag} className="px-2 py-1 bg-gray-100 dark:bg-surface-700 rounded-lg text-sm text-gray-700 dark:text-surface-300">
                          {tag}
                        </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {selectedItem.attachments && selectedItem.attachments.length > 0 && (
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-surface-400 mb-2">{t('archive.attachments')}</p>
                                        <div className="space-y-2">
                                            {selectedItem.attachments.map((att) => (
                                                <div key={att.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-surface-700/50 rounded-lg">
                                                    <div className="flex items-center gap-2">
                                                        <FileText size={16} className="text-gray-400" />
                                                        <span className="text-sm text-gray-900 dark:text-surface-100">{att.fileName}</span>
                                                    </div>
                                                    <Button variant="secondary" size="sm">
                                                        <Download size={14} />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="p-6 border-t border-gray-200 dark:border-surface-700 flex gap-3">
                                <Button variant="secondary" className="flex-1" onClick={() => handleRestore(selectedItem)}>
                                    <RotateCcw size={18} className="mr-2" />
                                    {t('archive.restore')}
                                </Button>
                                <Button variant="secondary" className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => handleDelete(selectedItem)}>
                                    <Trash2 size={18} />
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}