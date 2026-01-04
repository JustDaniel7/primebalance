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
    Tag,
    Archive,
    X,
    ChevronRight,
    Shield,
    Settings,
    Activity,
    Loader2,
} from 'lucide-react';
import { Card, Button, Badge } from '@/components/ui';
import { useThemeStore } from '@/store/theme-store';
import { useArchiveStore } from '@/store/archive-store';
import { ArchiveCategory, type ArchiveRecord } from '@/types/archive';
import toast from 'react-hot-toast';

// =============================================================================
// CATEGORY ICONS MAP
// =============================================================================

const categoryIcons: Record<ArchiveCategory | string, React.ElementType> = {
    [ArchiveCategory.FINANCIAL]: FileText,
    [ArchiveCategory.ACCOUNTING]: BookOpen,
    [ArchiveCategory.COMPLIANCE]: Shield,
    [ArchiveCategory.GOVERNANCE]: Building2,
    [ArchiveCategory.SYSTEM]: Settings,
    [ArchiveCategory.OPERATIONAL]: Activity,
};

const categoryColors: Record<ArchiveCategory | string, string> = {
    [ArchiveCategory.FINANCIAL]: 'green',
    [ArchiveCategory.ACCOUNTING]: 'blue',
    [ArchiveCategory.COMPLIANCE]: 'purple',
    [ArchiveCategory.GOVERNANCE]: 'amber',
    [ArchiveCategory.SYSTEM]: 'gray',
    [ArchiveCategory.OPERATIONAL]: 'rose',
};

// Static class mappings for Tailwind (template literals don't work with Tailwind's purge)
const colorBgClasses: Record<string, string> = {
    green: 'bg-green-500/10',
    blue: 'bg-blue-500/10',
    purple: 'bg-purple-500/10',
    amber: 'bg-amber-500/10',
    gray: 'bg-gray-500/10',
    rose: 'bg-rose-500/10',
};

const colorTextClasses: Record<string, string> = {
    green: 'text-green-500',
    blue: 'text-blue-500',
    purple: 'text-purple-500',
    amber: 'text-amber-500',
    gray: 'text-gray-500',
    rose: 'text-rose-500',
};

// =============================================================================
// ARCHIVE PAGE COMPONENT
// =============================================================================

export default function ArchivePage() {
    const { t, language } = useThemeStore();
    const {
        records,
        filters,
        setFilters,
        clearFilters,
        fetchRecords,
        isInitialized,
        isLoading,
        statistics,
        fetchStatistics,
        restoreArchive,
        deleteArchive,
        cancelDeletion,
    } = useArchiveStore();
    const [isRestoring, setIsRestoring] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);

    useEffect(() => {
        if (!isInitialized) {
            fetchRecords();
            fetchStatistics();
        }
    }, [fetchRecords, fetchStatistics, isInitialized]);

    const [selectedCategory, setSelectedCategory] = useState<ArchiveCategory | null>(null);
    const [selectedItem, setSelectedItem] = useState<ArchiveRecord | null>(null);
    const [showYearFilter, setShowYearFilter] = useState(false);

    // Download attachment handler
    const handleDownloadAttachment = async (attachment: { id: string; name: string; url?: string; mimeType?: string }) => {
        try {
            // If we have a direct URL, use it
            if (attachment.url) {
                const link = document.createElement('a');
                link.href = attachment.url;
                link.download = attachment.name;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                return;
            }

            // Otherwise fetch from API
            const response = await fetch(`/api/archive/attachments/${attachment.id}/download`);
            if (!response.ok) {
                throw new Error('Failed to download attachment');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = attachment.name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download error:', error);
            // Show error toast if available
        }
    };

    // Get available years
    const availableYears = useMemo(() => {
        const years = Array.from(new Set(records.map((i) => i.fiscalYear).filter((y): y is number => y !== undefined))).sort((a, b) => b - a);
        return years;
    }, [records]);

    // Filter records based on current filters
    const filteredItems = useMemo(() => {
        let result = records;

        if (filters.category) {
            result = result.filter(r => r.category === filters.category);
        }
        if (filters.fiscalYear) {
            result = result.filter(r => r.fiscalYear === filters.fiscalYear);
        }
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            result = result.filter(r =>
                r.title.toLowerCase().includes(searchLower) ||
                r.description?.toLowerCase().includes(searchLower) ||
                r.counterpartyName?.toLowerCase().includes(searchLower)
            );
        }

        return result;
    }, [records, filters]);

    // Calculate stats from records
    const stats = useMemo(() => {
        const byCategory: Record<string, number> = {};
        let totalValue = 0;

        for (const cat of Object.values(ArchiveCategory)) {
            byCategory[cat] = records.filter(r => r.category === cat).length;
        }

        for (const record of records) {
            if (record.amount) {
                totalValue += record.amount;
            }
        }

        return {
            totalItems: records.length,
            byCategory,
            totalValue,
        };
    }, [records]);

    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat(language === 'de' ? 'de-DE' : language === 'fr' ? 'fr-FR' : language === 'es' ? 'es-ES' : 'en-US', {
            style: 'currency',
            currency,
        }).format(amount);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString(language === 'de' ? 'de-DE' : language === 'fr' ? 'fr-FR' : language === 'es' ? 'es-ES' : 'en-US');
    };

    const getCategoryBadgeColor = (category: ArchiveCategory | string): 'info' | 'success' | 'warning' | 'neutral' | 'danger' => {
        const map: Record<string, 'info' | 'success' | 'warning' | 'neutral' | 'danger'> = {
            [ArchiveCategory.FINANCIAL]: 'success',
            [ArchiveCategory.ACCOUNTING]: 'info',
            [ArchiveCategory.COMPLIANCE]: 'info',
            [ArchiveCategory.GOVERNANCE]: 'warning',
            [ArchiveCategory.SYSTEM]: 'neutral',
            [ArchiveCategory.OPERATIONAL]: 'danger',
        };
        return map[category] || 'neutral';
    };

    const handleCategoryClick = (category: ArchiveCategory) => {
        if (selectedCategory === category) {
            setSelectedCategory(null);
            setFilters({ ...filters, category: undefined });
        } else {
            setSelectedCategory(category);
            setFilters({ ...filters, category });
        }
    };

    const handleResetFilter = () => {
        setSelectedCategory(null);
        clearFilters();
    };

    const handleRestore = async (item: ArchiveRecord) => {
        if (!confirm(t('archive.confirmRestore') || 'Restore this item? It will be recreated in the active system.')) return;

        setIsRestoring(true);
        try {
            const result = await restoreArchive(item.id);
            if (result?.success) {
                toast.success(t('archive.restoreSuccess') || 'Item restored successfully');
                setSelectedItem(null);
                if (result.restoredTo) {
                    // Optional: navigate to restored item
                    // window.location.href = result.restoredTo;
                }
            } else {
                toast.error(t('archive.restoreFailed') || 'Failed to restore item');
            }
        } catch (e: unknown) {
            const errorMessage = e instanceof Error ? e.message : 'Failed to restore item';
            toast.error(errorMessage);
        } finally {
            setIsRestoring(false);
        }
    };

    const handleDelete = async (item: ArchiveRecord) => {
        if (item.legalHold) {
            toast.error(t('archive.cannotDeleteLegalHold') || 'Cannot delete item on legal hold');
            return;
        }

        if (!confirm(t('archive.confirmDelete') || 'Schedule this item for deletion? It will be permanently deleted after 30 days.')) return;

        setIsDeleting(true);
        try {
            const result = await deleteArchive(item.id, { warningPeriodDays: 30 });
            if (result?.success) {
                const deletionDate = result.permanentDeletionDate
                    ? new Date(result.permanentDeletionDate).toLocaleDateString()
                    : '30 days';
                toast.success(t('archive.deleteScheduled') || `Item scheduled for deletion on ${deletionDate}`);
                setSelectedItem(null);
            } else {
                toast.error(t('archive.deleteFailed') || 'Failed to schedule deletion');
            }
        } catch (e: unknown) {
            const errorMessage = e instanceof Error ? e.message : 'Failed to delete item';
            toast.error(errorMessage);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleCancelDeletion = async (item: ArchiveRecord) => {
        if (!confirm(t('archive.confirmCancelDelete') || 'Cancel the scheduled deletion for this item?')) return;

        setIsCancelling(true);
        try {
            const success = await cancelDeletion(item.id);
            if (success) {
                toast.success(t('archive.deletionCancelled') || 'Scheduled deletion cancelled');
                setSelectedItem(null);
            } else {
                toast.error(t('archive.cancelFailed') || 'Failed to cancel deletion');
            }
        } catch (e: unknown) {
            const errorMessage = e instanceof Error ? e.message : 'Failed to cancel deletion';
            toast.error(errorMessage);
        } finally {
            setIsCancelling(false);
        }
    };

    // Category Cards
    const categories: Array<{ key: ArchiveCategory; label: string }> = [
        { key: ArchiveCategory.FINANCIAL, label: t('archive.category.financial') || 'Financial' },
        { key: ArchiveCategory.ACCOUNTING, label: t('archive.category.accounting') || 'Accounting' },
        { key: ArchiveCategory.COMPLIANCE, label: t('archive.category.compliance') || 'Compliance' },
        { key: ArchiveCategory.GOVERNANCE, label: t('archive.category.governance') || 'Governance' },
        { key: ArchiveCategory.SYSTEM, label: t('archive.category.system') || 'System' },
        { key: ArchiveCategory.OPERATIONAL, label: t('archive.category.operational') || 'Operational' },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-surface-100 font-display">
                        {t('archive.title') || 'Archive'}
                    </h1>
                    <p className="text-gray-500 dark:text-surface-500 mt-1">{t('archive.subtitle') || 'Browse archived records'}</p>
                </div>
                <div className="flex gap-2">
                    <div className="relative">
                        <button
                            onClick={() => setShowYearFilter(!showYearFilter)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-surface-800/50 border border-gray-200 dark:border-surface-700 rounded-xl text-gray-700 dark:text-surface-300 hover:bg-gray-50 dark:hover:bg-surface-700/50"
                        >
                            <Calendar size={18} />
                            <span>{filters.fiscalYear || t('archive.allYears') || 'All Years'}</span>
                            <ChevronDown size={16} />
                        </button>
                        {showYearFilter && (
                            <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-surface-800 border border-gray-200 dark:border-surface-700 rounded-xl shadow-lg z-10">
                                <button
                                    onClick={() => { setFilters({ ...filters, fiscalYear: undefined }); setShowYearFilter(false); }}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-surface-700 rounded-t-xl"
                                >
                                    {t('archive.allYears') || 'All Years'}
                                </button>
                                {availableYears.map((year) => (
                                    <button
                                        key={year}
                                        onClick={() => { setFilters({ ...filters, fiscalYear: year }); setShowYearFilter(false); }}
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
                            <p className="text-sm text-gray-500 dark:text-surface-400">{t('archive.totalItems') || 'Total Items'}</p>
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
                            <p className="text-sm text-gray-500 dark:text-surface-400">{t('archive.category.financial') || 'Financial'}</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-surface-100">{stats.byCategory[ArchiveCategory.FINANCIAL] || 0}</p>
                        </div>
                    </div>
                </Card>
                <Card variant="glass" padding="md">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                            <Shield size={20} className="text-purple-500" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-surface-400">{t('archive.category.compliance') || 'Compliance'}</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-surface-100">{stats.byCategory[ArchiveCategory.COMPLIANCE] || 0}</p>
                        </div>
                    </div>
                </Card>
                <Card variant="glass" padding="md">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                            <Briefcase size={20} className="text-amber-500" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-surface-400">{t('archive.totalValue') || 'Total Value'}</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-surface-100">{formatCurrency(stats.totalValue, 'EUR')}</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Category Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {categories.map((cat) => {
                    const Icon = categoryIcons[cat.key] || FolderOpen;
                    const count = stats.byCategory[cat.key] || 0;
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
                            <p className="text-sm text-gray-500 dark:text-surface-400">{count} {t('archive.items') || 'items'}</p>
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
                        placeholder={t('archive.search') || 'Search archive...'}
                        value={filters.search || ''}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-surface-800/50 border border-gray-200 dark:border-surface-700 rounded-xl text-gray-900 dark:text-surface-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20 focus:border-[var(--accent-primary)]"
                    />
                </div>
                {(filters.category || filters.fiscalYear || filters.search) && (
                    <Button variant="secondary" onClick={handleResetFilter}>
                        <X size={18} className="mr-2" />
                        {t('archive.clearFilter') || 'Clear Filter'}
                    </Button>
                )}
            </div>

            {/* Items List */}
            <div className="space-y-3">
                {filteredItems.length === 0 ? (
                    <Card variant="glass" padding="lg" className="text-center">
                        <Archive size={48} className="mx-auto text-gray-300 dark:text-surface-600 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-surface-100">{t('archive.noItems') || 'No Items'}</h3>
                        <p className="text-gray-500 dark:text-surface-400 mt-1">{t('archive.noItemsDesc') || 'No archived items found'}</p>
                    </Card>
                ) : (
                    filteredItems.map((item, index) => {
                        const Icon = categoryIcons[item.category] || FolderOpen;
                        const color = categoryColors[item.category] || 'gray';
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
                                            <div className={`w-10 h-10 rounded-xl ${colorBgClasses[color] || 'bg-gray-500/10'} flex items-center justify-center flex-shrink-0`}>
                                                <Icon size={20} className={colorTextClasses[color] || 'text-gray-500'} />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-gray-900 dark:text-surface-100 truncate">
                                                        {item.title}
                                                    </span>
                                                    <Badge variant={getCategoryBadgeColor(item.category)} size="sm">
                                                        {item.category}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-gray-500 dark:text-surface-400 truncate">
                                                    {item.description || item.counterpartyName}
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
                                                    {formatDate(item.createdAt)}
                                                </p>
                                            </div>
                                            {item.fiscalYear && <Badge variant="neutral" size="sm">{item.fiscalYear}</Badge>}
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
                                        {React.createElement(categoryIcons[selectedItem.category] || FolderOpen, { size: 24, className: 'text-[var(--accent-primary)]' })}
                                        <div>
                                            <h2 className="text-lg font-semibold text-gray-900 dark:text-surface-100">{selectedItem.title}</h2>
                                            <p className="text-sm text-gray-500 dark:text-surface-400">{selectedItem.archiveRecordId}</p>
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
                                        <p className="text-sm text-gray-500 dark:text-surface-400">{t('common.description') || 'Description'}</p>
                                        <p className="text-gray-900 dark:text-surface-100">{selectedItem.description}</p>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    {selectedItem.amount && (
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-surface-400">{t('common.amount') || 'Amount'}</p>
                                            <p className="font-semibold text-gray-900 dark:text-surface-100">
                                                {formatCurrency(selectedItem.amount, selectedItem.currency || 'EUR')}
                                            </p>
                                        </div>
                                    )}
                                    {selectedItem.counterpartyName && (
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-surface-400">{t('archive.counterparty') || 'Counterparty'}</p>
                                            <p className="text-gray-900 dark:text-surface-100">{selectedItem.counterpartyName}</p>
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-surface-400">{t('common.date') || 'Date'}</p>
                                        <p className="text-gray-900 dark:text-surface-100">{formatDate(selectedItem.createdAt)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-surface-400">{t('archive.archivedAt') || 'Archived At'}</p>
                                        <p className="text-gray-900 dark:text-surface-100">{formatDate(selectedItem.archivedAt)}</p>
                                    </div>
                                </div>

                                {selectedItem.tags && selectedItem.tags.length > 0 && (
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-surface-400 mb-2">{t('archive.tags') || 'Tags'}</p>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedItem.tags.map((tag: string) => (
                                                <span key={tag} className="px-2 py-1 bg-gray-100 dark:bg-surface-700 rounded-lg text-sm text-gray-700 dark:text-surface-300">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {selectedItem.attachments && selectedItem.attachments.length > 0 && (
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-surface-400 mb-2">{t('archive.attachments') || 'Attachments'}</p>
                                        <div className="space-y-2">
                                            {selectedItem.attachments.map((att) => (
                                                <div key={att.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-surface-700/50 rounded-lg">
                                                    <div className="flex items-center gap-2">
                                                        <FileText size={16} className="text-gray-400" />
                                                        <span className="text-sm text-gray-900 dark:text-surface-100">{att.name}</span>
                                                    </div>
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        onClick={() => handleDownloadAttachment(att)}
                                                    >
                                                        <Download size={14} />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Pending Deletion Warning */}
                            {selectedItem.status === 'pending_deletion' && (
                                <div className="px-6 py-3 bg-amber-50 dark:bg-amber-900/20 border-t border-amber-200 dark:border-amber-800">
                                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                                        <Calendar size={16} />
                                        <span className="text-sm font-medium">
                                            {t('archive.scheduledForDeletion') || 'Scheduled for permanent deletion'}
                                            {(selectedItem as any).permanentDeletionDate && (
                                                <> on {formatDate((selectedItem as any).permanentDeletionDate)}</>
                                            )}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="p-6 border-t border-gray-200 dark:border-surface-700 flex gap-3">
                                <Button
                                    variant="primary"
                                    className="flex-1"
                                    onClick={() => handleRestore(selectedItem)}
                                    disabled={isRestoring || selectedItem.legalHold || selectedItem.status === 'restored'}
                                >
                                    {isRestoring ? (
                                        <Loader2 size={18} className="mr-2 animate-spin" />
                                    ) : (
                                        <RotateCcw size={18} className="mr-2" />
                                    )}
                                    {t('archive.restore') || 'Restore'}
                                </Button>
                                {selectedItem.status === 'pending_deletion' ? (
                                    <Button
                                        variant="secondary"
                                        className="flex-1 !bg-amber-500 !text-white hover:!bg-amber-600"
                                        onClick={() => handleCancelDeletion(selectedItem)}
                                        disabled={isCancelling}
                                    >
                                        {isCancelling ? (
                                            <Loader2 size={18} className="mr-2 animate-spin" />
                                        ) : (
                                            <RotateCcw size={18} className="mr-2" />
                                        )}
                                        {t('archive.cancelDeletion') || 'Cancel Deletion'}
                                    </Button>
                                ) : (
                                    <Button
                                        variant="danger"
                                        className="flex-1"
                                        onClick={() => handleDelete(selectedItem)}
                                        disabled={isDeleting || selectedItem.legalHold}
                                    >
                                        {isDeleting ? (
                                            <Loader2 size={18} className="mr-2 animate-spin" />
                                        ) : (
                                            <Trash2 size={18} className="mr-2" />
                                        )}
                                        {t('archive.scheduleDelete') || 'Schedule Delete'}
                                    </Button>
                                )}
                                <Button variant="secondary" onClick={() => setSelectedItem(null)}>
                                    <X size={18} className="mr-2" />
                                    {t('common.close') || 'Close'}
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}