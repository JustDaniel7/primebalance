'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
    Plus,
    ShoppingCart,
    CheckCircle,
    TrendingDown,
    AlertTriangle,
    RefreshCw,
    ArrowRight,
    Tag,
    Trash2,
    DollarSign,
    XCircle,
    Wrench,
    Minus,
    Clock,
    Settings,
} from 'lucide-react';
import { useAssetStore } from '@/store/asset-store';
import { useThemeStore } from '@/store/theme-store';
import { AssetEventType } from '@/types/asset';

interface AssetLifecycleTimelineProps {
    assetId: string;
}

export const AssetLifecycleTimeline: React.FC<AssetLifecycleTimelineProps> = ({ assetId }) => {
    const { getAssetEvents } = useAssetStore();
    const { t } = useThemeStore();
    const events = getAssetEvents(assetId);

    const eventConfig: Record<AssetEventType, { icon: React.ElementType; color: string; label: string }> = {
        [AssetEventType.ASSET_CREATED]: { icon: Plus, color: 'bg-blue-500', label: t('assets.event.created') },
        [AssetEventType.ASSET_ACQUIRED]: { icon: ShoppingCart, color: 'bg-green-500', label: t('assets.event.acquired') },
        [AssetEventType.ASSET_CAPITALIZED]: { icon: CheckCircle, color: 'bg-emerald-500', label: t('assets.event.capitalized') },
        [AssetEventType.DEPRECIATION_POSTED]: { icon: TrendingDown, color: 'bg-purple-500', label: t('assets.event.depreciationPosted') },
        [AssetEventType.IMPAIRMENT_RECORDED]: { icon: AlertTriangle, color: 'bg-amber-500', label: t('assets.event.impairmentRecorded') },
        [AssetEventType.REVALUATION_RECORDED]: { icon: RefreshCw, color: 'bg-cyan-500', label: t('assets.event.revaluationRecorded') },
        [AssetEventType.ASSET_TRANSFERRED]: { icon: ArrowRight, color: 'bg-indigo-500', label: t('assets.event.transferred') },
        [AssetEventType.ASSET_HELD_FOR_SALE]: { icon: Tag, color: 'bg-orange-500', label: t('assets.event.heldForSale') },
        [AssetEventType.ASSET_DISPOSED]: { icon: Trash2, color: 'bg-red-500', label: t('assets.event.disposed') },
        [AssetEventType.ASSET_SOLD]: { icon: DollarSign, color: 'bg-green-500', label: t('assets.event.sold') },
        [AssetEventType.ASSET_WRITTEN_OFF]: { icon: XCircle, color: 'bg-red-600', label: t('assets.event.writtenOff') },
        [AssetEventType.COMPONENT_ADDED]: { icon: Wrench, color: 'bg-blue-400', label: t('assets.event.componentAdded') },
        [AssetEventType.COMPONENT_REMOVED]: { icon: Minus, color: 'bg-gray-500', label: t('assets.event.componentRemoved') },
        [AssetEventType.USEFUL_LIFE_CHANGED]: { icon: Clock, color: 'bg-yellow-500', label: t('assets.event.usefulLifeChanged') },
        [AssetEventType.METHOD_CHANGED]: { icon: Settings, color: 'bg-fuchsia-500', label: t('assets.event.methodChanged') },
    };

    if (events.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                {t('assets.timeline.noEvents')}
            </div>
        );
    }

    return (
        <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />

            <div className="space-y-4">
                {events.map((event, index) => {
                    const config = eventConfig[event.eventType];
                    const Icon = config.icon;

                    return (
                        <motion.div
                            key={event.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="relative pl-10"
                        >
                            {/* Icon */}
                            <div className={`absolute left-0 w-8 h-8 rounded-full ${config.color} flex items-center justify-center`}>
                                <Icon className="w-4 h-4 text-white" />
                            </div>

                            {/* Content */}
                            <div className="bg-gray-50 dark:bg-slate-900 rounded-lg p-4">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h4 className="font-medium text-gray-900 dark:text-white">{config.label}</h4>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            {new Date(event.timestamp).toLocaleString('de-DE')} {t('assets.event.by')} {event.actor}
                                        </p>
                                    </div>
                                </div>

                                {/* Event Details */}
                                <div className="mt-2 text-sm text-gray-600 dark:text-gray-300 space-y-1">
                                    {event.reason && (
                                        <p><span className="text-gray-500">{t('assets.event.reason')}:</span> {event.reason}</p>
                                    )}
                                    {event.amount !== undefined && (
                                        <p><span className="text-gray-500">{t('assets.event.amount')}:</span> €{event.amount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}</p>
                                    )}
                                    {event.previousValue !== undefined && event.newValue !== undefined && (
                                        <p>
                                            <span className="text-gray-500">{t('assets.event.value')}:</span>{' '}
                                            €{event.previousValue.toLocaleString('de-DE')} → €{event.newValue.toLocaleString('de-DE')}
                                        </p>
                                    )}
                                    {event.previousStatus && event.newStatus && (
                                        <p>
                                            <span className="text-gray-500">{t('assets.table.status')}:</span>{' '}
                                            {event.previousStatus} → {event.newStatus}
                                        </p>
                                    )}
                                    {(event.fromLocation || event.toLocation) && (
                                        <p>
                                            <span className="text-gray-500">{t('assets.detail.location')}:</span>{' '}
                                            {event.fromLocation || '-'} → {event.toLocation || '-'}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};