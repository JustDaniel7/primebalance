'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, ChevronDown, ChevronUp, Check, Clock } from 'lucide-react';
import { Card } from '@/components/ui';
import { useAssetStore } from '@/store/asset-store';
import { useThemeStore } from '@/store/theme-store';
import { BookType } from '@/types/asset';

interface DepreciationScheduleViewProps {
    assetId: string;
    bookType?: BookType;
}

export const DepreciationScheduleView: React.FC<DepreciationScheduleViewProps> = ({
                                                                                      assetId,
                                                                                      bookType = BookType.STATUTORY,
                                                                                  }) => {
    const { getSchedule } = useAssetStore();
    const { t } = useThemeStore();
    const schedule = getSchedule(assetId, bookType);
    const [expanded, setExpanded] = useState(false);

    if (!schedule || schedule.entries.length === 0) {
        return (
            <Card variant="glass" padding="md">
                <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                    {t('assets.timeline.noEvents')}
                </p>
            </Card>
        );
    }

    const postedCount = schedule.entries.filter(e => e.isPosted).length;
    const remainingCount = schedule.entries.length - postedCount;
    const displayEntries = expanded ? schedule.entries : schedule.entries.slice(0, 12);

    return (
        <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card variant="glass" padding="sm">
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('assets.schedule.totalPeriods')}</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{schedule.totalPeriods}</p>
                </Card>
                <Card variant="glass" padding="sm">
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('assets.schedule.posted')}</p>
                    <p className="text-lg font-bold text-green-600">{postedCount}</p>
                </Card>
                <Card variant="glass" padding="sm">
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('assets.schedule.remaining')}</p>
                    <p className="text-lg font-bold text-blue-600">{remainingCount}</p>
                </Card>
                <Card variant="glass" padding="sm">
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('assets.schedule.totalDepreciation')}</p>
                    <p className="text-lg font-bold text-purple-600">€{schedule.totalDepreciation.toLocaleString('de-DE')}</p>
                </Card>
            </div>

            {/* Schedule Table */}
            <Card variant="glass" padding="none">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <h3 className="font-medium text-gray-900 dark:text-white">{t('assets.schedule.title')}</h3>
                    <button className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 flex items-center gap-2">
                        <Download className="w-4 h-4" />
                        {t('assets.export')}
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900">
                            <th className="text-left px-4 py-2 text-gray-500 dark:text-gray-400 font-medium">{t('assets.schedule.periodNumber')}</th>
                            <th className="text-left px-4 py-2 text-gray-500 dark:text-gray-400 font-medium">{t('assets.schedule.date')}</th>
                            <th className="text-right px-4 py-2 text-gray-500 dark:text-gray-400 font-medium">{t('assets.schedule.openingValue')}</th>
                            <th className="text-right px-4 py-2 text-gray-500 dark:text-gray-400 font-medium">{t('assets.schedule.depreciationAmount')}</th>
                            <th className="text-right px-4 py-2 text-gray-500 dark:text-gray-400 font-medium">{t('assets.schedule.accumulated')}</th>
                            <th className="text-right px-4 py-2 text-gray-500 dark:text-gray-400 font-medium">{t('assets.schedule.closingValue')}</th>
                            <th className="text-center px-4 py-2 text-gray-500 dark:text-gray-400 font-medium">{t('assets.schedule.status')}</th>
                        </tr>
                        </thead>
                        <tbody>
                        {displayEntries.map((entry, index) => (
                            <motion.tr
                                key={entry.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: index * 0.02 }}
                                className={`border-b border-gray-100 dark:border-gray-800 ${
                                    entry.isPosted ? 'bg-green-50/50 dark:bg-green-900/10' : ''
                                }`}
                            >
                                <td className="px-4 py-2 text-gray-900 dark:text-white">{entry.periodNumber}</td>
                                <td className="px-4 py-2 text-gray-600 dark:text-gray-300">
                                    {new Date(entry.periodStartDate).toLocaleDateString('de-DE', { month: 'short', year: 'numeric' })}
                                </td>
                                <td className="px-4 py-2 text-right text-gray-900 dark:text-white">
                                    €{entry.openingBookValue.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="px-4 py-2 text-right text-purple-600 font-medium">
                                    €{entry.depreciationAmount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="px-4 py-2 text-right text-gray-600 dark:text-gray-300">
                                    €{entry.accumulatedDepreciation.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="px-4 py-2 text-right text-gray-900 dark:text-white font-medium">
                                    €{entry.closingBookValue.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="px-4 py-2 text-center">
                                    {entry.isPosted ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                                                <Check className="w-3 h-3" />
                                            {t('assets.schedule.posted')}
                                            </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                                                <Clock className="w-3 h-3" />
                                            {t('assets.schedule.pending')}
                                            </span>
                                    )}
                                </td>
                            </motion.tr>
                        ))}
                        </tbody>
                    </table>
                </div>

                {/* Expand/Collapse */}
                {schedule.entries.length > 12 && (
                    <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
                        <button
                            onClick={() => setExpanded(!expanded)}
                            className="w-full text-center text-sm text-blue-600 hover:text-blue-700 flex items-center justify-center gap-1"
                        >
                            {expanded ? (
                                <>
                                    <ChevronUp className="w-4 h-4" />
                                    {t('assets.schedule.showLess')}
                                </>
                            ) : (
                                <>
                                    <ChevronDown className="w-4 h-4" />
                                    {t('assets.schedule.showAll')} {schedule.entries.length} {t('assets.schedule.periods')}
                                </>
                            )}
                        </button>
                    </div>
                )}
            </Card>
        </div>
    );
};