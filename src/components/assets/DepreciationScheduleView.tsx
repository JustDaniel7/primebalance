'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Check, Clock, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { DepreciationSchedule, Asset } from '@/types/asset';

interface DepreciationScheduleViewProps {
    schedule: DepreciationSchedule;
    asset: Asset;
}

export const DepreciationScheduleView: React.FC<DepreciationScheduleViewProps> = ({ schedule, asset }) => {
    const [expanded, setExpanded] = useState(false);
    const displayEntries = expanded ? schedule.entries : schedule.entries.slice(0, 12);

    const postedCount = schedule.entries.filter(e => e.isPosted).length;
    const remainingCount = schedule.entries.length - postedCount;

    return (
        <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-gray-50 dark:bg-slate-900 rounded-lg">
                    <p className="text-xs text-gray-500">Total Periods</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{schedule.totalPeriods}</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-slate-900 rounded-lg">
                    <p className="text-xs text-gray-500">Posted</p>
                    <p className="text-lg font-bold text-green-600">{postedCount}</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-slate-900 rounded-lg">
                    <p className="text-xs text-gray-500">Remaining</p>
                    <p className="text-lg font-bold text-blue-600">{remainingCount}</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-slate-900 rounded-lg">
                    <p className="text-xs text-gray-500">Total Depreciation</p>
                    <p className="text-lg font-bold text-purple-600">€{schedule.totalDepreciation.toLocaleString('de-DE')}</p>
                </div>
            </div>

            {/* Schedule Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3 px-2 text-gray-500 font-medium">#</th>
                        <th className="text-left py-3 px-2 text-gray-500 font-medium">Period</th>
                        <th className="text-right py-3 px-2 text-gray-500 font-medium">Opening Value</th>
                        <th className="text-right py-3 px-2 text-gray-500 font-medium">Depreciation</th>
                        <th className="text-right py-3 px-2 text-gray-500 font-medium">Accumulated</th>
                        <th className="text-right py-3 px-2 text-gray-500 font-medium">Closing Value</th>
                        <th className="text-center py-3 px-2 text-gray-500 font-medium">Status</th>
                    </tr>
                    </thead>
                    <tbody>
                    {displayEntries.map((entry, idx) => (
                        <motion.tr
                            key={entry.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: idx * 0.02 }}
                            className={`border-b border-gray-100 dark:border-gray-800 ${
                                entry.isPosted ? 'bg-green-50/50 dark:bg-green-900/10' : ''
                            }`}
                        >
                            <td className="py-2 px-2 text-gray-600 dark:text-gray-400">{entry.periodNumber}</td>
                            <td className="py-2 px-2">
                  <span className="text-gray-900 dark:text-white">
                    {new Date(entry.periodStartDate).toLocaleDateString('de-DE', { month: 'short', year: 'numeric' })}
                  </span>
                            </td>
                            <td className="py-2 px-2 text-right text-gray-900 dark:text-white">
                                €{entry.openingBookValue.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-2 px-2 text-right font-medium text-purple-600">
                                €{entry.depreciationAmount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-2 px-2 text-right text-gray-600 dark:text-gray-400">
                                €{entry.accumulatedDepreciation.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-2 px-2 text-right font-medium text-gray-900 dark:text-white">
                                €{entry.closingBookValue.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-2 px-2 text-center">
                                {entry.isPosted ? (
                                    <span className="inline-flex items-center gap-1 text-xs text-green-600">
                      <Check className="w-3 h-3" /> Posted
                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                      <Clock className="w-3 h-3" /> Pending
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
                <div className="text-center">
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="px-4 py-2 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-2 mx-auto"
                    >
                        {expanded ? (
                            <>
                                <ChevronUp className="w-4 h-4" /> Show Less
                            </>
                        ) : (
                            <>
                                <ChevronDown className="w-4 h-4" /> Show All {schedule.entries.length} Periods
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* Export */}
            <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                <button className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-2">
                    <Download className="w-4 h-4" /> Export Schedule
                </button>
            </div>
        </div>
    );
};