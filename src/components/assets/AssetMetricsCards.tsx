'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    Package,
    TrendingDown,
    DollarSign,
    AlertTriangle,
    CheckCircle2,
} from 'lucide-react';
import { Card } from '@/components/ui';
import { useAssetStore } from '@/store/asset-store';
import { useThemeStore } from '@/store/theme-store';
import { AssetStatus, BookType } from '@/types/asset';

export const AssetMetricsCards: React.FC = () => {
    const { assets, assetBooks, calculateTotalNetBookValue } = useAssetStore();
    const { t } = useThemeStore();

    const metrics = useMemo(() => {
        const activeAssets = assets.filter(a => a.isActive);
        const totalNBV = calculateTotalNetBookValue(BookType.STATUTORY);
        const totalCost = assetBooks
            .filter(b => b.bookType === BookType.STATUTORY && b.isActive)
            .reduce((sum, b) => sum + b.acquisitionCost, 0);
        const totalDepreciation = assetBooks
            .filter(b => b.bookType === BookType.STATUTORY && b.isActive)
            .reduce((sum, b) => sum + b.accumulatedDepreciation, 0);

        const fullyDepreciated = assets.filter(a => a.status === AssetStatus.FULLY_DEPRECIATED).length;
        const inUse = assets.filter(a => a.status === AssetStatus.IN_USE).length;
        const impaired = assets.filter(a => a.status === AssetStatus.IMPAIRED).length;

        const monthlyDepreciation = assetBooks
            .filter(b => b.bookType === BookType.STATUTORY && b.isActive)
            .reduce((sum, b) => {
                const depreciableBase = b.acquisitionCost - b.salvageValue;
                return sum + (depreciableBase / b.usefulLifeMonths);
            }, 0);

        return {
            totalAssets: activeAssets.length,
            totalNBV,
            totalCost,
            totalDepreciation,
            fullyDepreciated,
            inUse,
            impaired,
            monthlyDepreciation,
            depreciationPercent: totalCost > 0 ? (totalDepreciation / totalCost) * 100 : 0,
        };
    }, [assets, assetBooks, calculateTotalNetBookValue]);

    const cards = [
        {
            title: t('assets.totalAssets'),
            value: metrics.totalAssets.toString(),
            subtitle: `${metrics.inUse} ${t('assets.inUse')}`,
            icon: Package,
            color: 'blue',
        },
        {
            title: t('assets.netBookValue'),
            value: `€${metrics.totalNBV.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
            subtitle: `${metrics.depreciationPercent.toFixed(1)}% ${t('assets.depreciated')}`,
            icon: DollarSign,
            color: 'green',
        },
        {
            title: t('assets.monthlyDepreciation'),
            value: `€${metrics.monthlyDepreciation.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
            subtitle: t('assets.currentRunRate'),
            icon: TrendingDown,
            color: 'purple',
        },
        {
            title: t('assets.attentionNeeded'),
            value: (metrics.fullyDepreciated + metrics.impaired).toString(),
            subtitle: `${metrics.fullyDepreciated} ${t('assets.fullyDepreciated')}, ${metrics.impaired} ${t('assets.impaired')}`,
            icon: metrics.impaired > 0 ? AlertTriangle : CheckCircle2,
            color: metrics.impaired > 0 ? 'amber' : 'slate',
        },
    ];

    const colorClasses: Record<string, { bg: string; icon: string; text: string }> = {
        blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', icon: 'text-blue-500', text: 'text-blue-600 dark:text-blue-400' },
        green: { bg: 'bg-green-50 dark:bg-green-900/20', icon: 'text-green-500', text: 'text-green-600 dark:text-green-400' },
        purple: { bg: 'bg-purple-50 dark:bg-purple-900/20', icon: 'text-purple-500', text: 'text-purple-600 dark:text-purple-400' },
        amber: { bg: 'bg-amber-50 dark:bg-amber-900/20', icon: 'text-amber-500', text: 'text-amber-600 dark:text-amber-400' },
        slate: { bg: 'bg-slate-50 dark:bg-slate-800/50', icon: 'text-slate-500', text: 'text-slate-600 dark:text-slate-400' },
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((card, index) => {
                const Icon = card.icon;
                const colors = colorClasses[card.color];

                return (
                    <motion.div
                        key={card.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <Card variant="glass" padding="md">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{card.title}</p>
                                    <p className={`text-2xl font-bold mt-1 ${colors.text}`}>{card.value}</p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{card.subtitle}</p>
                                </div>
                                <div className={`p-3 rounded-xl ${colors.bg}`}>
                                    <Icon className={`w-6 h-6 ${colors.icon}`} />
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                );
            })}
        </div>
    );
};