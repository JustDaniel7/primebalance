'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
    Plus,
    ShoppingCart,
    CheckCircle,
    Play,
    TrendingDown,
    AlertTriangle,
    ArrowRight,
    Tag,
    Trash2,
    DollarSign,
    RefreshCw,
} from 'lucide-react';
import { AssetEvent, AssetEventType, Asset } from '@/types/asset';

interface AssetLifecycleTimelineProps {
    events: AssetEvent[];
    asset: Asset;
}

const eventConfig: Record<AssetEventType, { icon: React.ElementType; color: string; label: string }> = {
    [AssetEventType.ASSET_CREATED]: { icon: Plus, color: 'bg-blue-500', label: 'Created' },
    [AssetEventType.ASSET_ACQUIRED]: { icon: ShoppingCart, color: 'bg-cyan-500', label: 'Acquired' },
    [AssetEventType.ASSET_CAPITALIZED]: { icon: CheckCircle, color: 'bg-green-500', label: 'Capitalized' },
    [AssetEventType.DEPRECIATION_POSTED]: { icon: TrendingDown, color: 'bg-purple-500', label: 'Depreciation Posted' },
    [AssetEventType.IMPAIRMENT_RECORDED]: { icon: AlertTriangle, color: 'bg-amber-500', label: 'Impairment Recorded' },
    [AssetEventType.REVALUATION_RECORDED]: { icon: RefreshCw, color: 'bg-indigo-500', label: 'Revaluation Recorded' },
    [AssetEventType.ASSET_TRANSFERRED]: { icon: ArrowRight, color: 'bg-slate-500', label: 'Transferred' },
    [AssetEventType.ASSET_HELD_FOR_SALE]: { icon: Tag, color: 'bg-orange-500', label: 'Held for Sale' },
    [AssetEventType.ASSET_DISPOSED]: { icon: Trash2, color: 'bg-red-500', label: 'Disposed' },
    [AssetEventType.ASSET_SOLD]: { icon: DollarSign, color: 'bg-emerald-500', label: 'Sold' },
    [AssetEventType.ASSET_WRITTEN_OFF]: { icon: Trash2, color: 'bg-red-600', label: 'Written Off' },
    [AssetEventType.COMPONENT_ADDED]: { icon: Plus, color: 'bg-teal-500', label: 'Component Added' },
    [AssetEventType.COMPONENT_REMOVED]: { icon: Trash2, color: 'bg-rose-500', label: 'Component Removed' },
    [AssetEventType.USEFUL_LIFE_CHANGED]: { icon: RefreshCw, color: 'bg-violet-500', label: 'Useful Life Changed' },
    [AssetEventType.METHOD_CHANGED]: { icon: RefreshCw, color: 'bg-fuchsia-500', label: 'Method Changed' },
};

export const AssetLifecycleTimeline: React.FC<AssetLifecycleTimelineProps> = ({ events, asset }) => {
    if (events.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                No events recorded for this asset yet.
            </div>
        );
    }

    return (
        <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />

            {/* Events */}
            <div className="space-y-6">
                {events.map((event, idx) => {
                    const config = eventConfig[event.eventType];
                    const Icon = config.icon;

                    return (
                        <motion.div
                            key={event.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="relative pl-12"
                        >
                            {/* Icon */}
                            <div className={`absolute left-0 w-8 h-8 rounded-full ${config.color} flex items-center justify-center shadow-lg`}>
                                <Icon className="w-4 h-4 text-white" />
                            </div>

                            {/* Content */}
                            <div className="bg-gray-50 dark:bg-slate-900 rounded-lg p-4">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h4 className="font-medium text-gray-900 dark:text-white">{config.label}</h4>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                            {new Date(event.timestamp).toLocaleString('de-DE', {
                                                dateStyle: 'medium',
                                                timeStyle: 'short',
                                            })}
                                        </p>
                                    </div>
                                    <span className="text-xs text-gray-400">by {event.actor}</span>
                                </div>

                                {/* Event details */}
                                {event.reason && (
                                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                                        {event.reason}
                                    </p>
                                )}

                                {event.amount !== undefined && (
                                    <p className="mt-2 text-sm">
                                        <span className="text-gray-500">Amount:</span>{' '}
                                        <span className="font-medium text-gray-900 dark:text-white">
                      €{event.amount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                    </span>
                                    </p>
                                )}

                                {event.previousValue !== undefined && event.newValue !== undefined && (
                                    <p className="mt-2 text-sm">
                                        <span className="text-gray-500">Value:</span>{' '}
                                        <span className="text-gray-400">€{event.previousValue.toLocaleString('de-DE')}</span>
                                        {' → '}
                                        <span className="font-medium text-gray-900 dark:text-white">€{event.newValue.toLocaleString('de-DE')}</span>
                                    </p>
                                )}

                                {event.previousStatus && event.newStatus && (
                                    <p className="mt-2 text-sm">
                                        <span className="text-gray-500">Status:</span>{' '}
                                        <span className="text-gray-400">{event.previousStatus.replace(/_/g, ' ')}</span>
                                        {' → '}
                                        <span className="font-medium text-gray-900 dark:text-white">{event.newStatus.replace(/_/g, ' ')}</span>
                                    </p>
                                )}

                                {event.toLocation && (
                                    <p className="mt-2 text-sm">
                                        <span className="text-gray-500">Location:</span>{' '}
                                        <span className="text-gray-400">{event.fromLocation || '—'}</span>
                                        {' → '}
                                        <span className="font-medium text-gray-900 dark:text-white">{event.toLocation}</span>
                                    </p>
                                )}
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};