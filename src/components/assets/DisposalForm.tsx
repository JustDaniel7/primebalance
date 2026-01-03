'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { useAssetStore } from '@/store/asset-store';
import { useThemeStore } from '@/store/theme-store';
import toast from 'react-hot-toast';
import { Asset, BookType } from '@/types/asset';
import { calculateBookValue, calculateDisposalGainLoss } from '@/lib/depreciation-engine';

interface DisposalFormProps {
    asset: Asset;
    onClose: () => void;
}

export const DisposalForm: React.FC<DisposalFormProps> = ({ asset, onClose }) => {
    const { assetBooks, disposeAsset } = useAssetStore();
    const { t } = useThemeStore();
    const statutoryBook = assetBooks.find(b => b.assetId === asset.id && b.bookType === BookType.STATUTORY);
    const carryingAmount = statutoryBook ? calculateBookValue(statutoryBook) : 0;

    const [formData, setFormData] = useState({
        disposalDate: new Date().toISOString().split('T')[0],
        disposalType: 'SALE' as 'SALE' | 'SCRAP' | 'DONATION' | 'THEFT' | 'DESTRUCTION' | 'OTHER',
        salePrice: 0,
        buyerName: '',
        buyerReference: '',
        reason: '',
    });

    const gainLoss = calculateDisposalGainLoss(carryingAmount, formData.salePrice);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        disposeAsset(
            asset.id,
            {
                assetId: asset.id,
                disposalDate: formData.disposalDate,
                disposalType: formData.disposalType,
                salePrice: formData.salePrice || undefined,
                buyerName: formData.buyerName || undefined,
                buyerReference: formData.buyerReference || undefined,
                reason: formData.reason,
                carryingAmount,
                accumulatedDepreciation: statutoryBook?.accumulatedDepreciation || 0,
                gainOrLoss: gainLoss.amount,
                isGain: gainLoss.isGain,
            },
            'user'
        );

        const disposalTypeLabel = formData.disposalType === 'SALE' ? t('assets.disposal.sold') || 'sold' : t('assets.disposal.disposed') || 'disposed';
        toast.success(`${asset.name} ${disposalTypeLabel} ${t('assets.disposal.successfully') || 'successfully'}`);
        onClose();
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-lg w-full"
            >
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('assets.disposal.title')}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Asset Summary */}
                    <div className="p-4 bg-gray-50 dark:bg-slate-900 rounded-lg">
                        <p className="text-sm text-gray-500">{t('assets.disposal.disposing')}</p>
                        <p className="font-medium text-gray-900 dark:text-white">{asset.name}</p>
                        <p className="text-sm text-gray-500 mt-2">
                            {t('assets.disposal.carryingAmount')}: <span className="font-medium text-gray-900 dark:text-white">€{carryingAmount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}</span>
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                {t('assets.disposal.disposalDate')}
                            </label>
                            <input
                                type="date"
                                value={formData.disposalDate}
                                onChange={(e) => setFormData({ ...formData, disposalDate: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                {t('assets.disposal.disposalType')}
                            </label>
                            <select
                                value={formData.disposalType}
                                onChange={(e) => setFormData({ ...formData, disposalType: e.target.value as typeof formData.disposalType })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                            >
                                <option value="SALE">{t('assets.disposal.sale')}</option>
                                <option value="SCRAP">{t('assets.disposal.scrap')}</option>
                                <option value="DONATION">{t('assets.disposal.donation')}</option>
                                <option value="THEFT">{t('assets.disposal.theft')}</option>
                                <option value="DESTRUCTION">{t('assets.disposal.destruction')}</option>
                                <option value="OTHER">{t('assets.disposal.other')}</option>
                            </select>
                        </div>
                    </div>

                    {formData.disposalType === 'SALE' && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {t('assets.disposal.salePrice')}
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">€</span>
                                    <input
                                        type="number"
                                        value={formData.salePrice || ''}
                                        onChange={(e) => setFormData({ ...formData, salePrice: parseFloat(e.target.value) || 0 })}
                                        placeholder="0.00"
                                        className="w-full pl-8 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        {t('assets.disposal.buyerName')}
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.buyerName}
                                        onChange={(e) => setFormData({ ...formData, buyerName: e.target.value })}
                                        placeholder={t('assets.disposal.buyerNamePlaceholder')}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        {t('assets.disposal.reference')}
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.buyerReference}
                                        onChange={(e) => setFormData({ ...formData, buyerReference: e.target.value })}
                                        placeholder={t('assets.disposal.referencePlaceholder')}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                                    />
                                </div>
                            </div>

                            {/* Gain/Loss Preview */}
                            <div className={`p-4 rounded-lg ${gainLoss.isGain ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                                <div className="flex items-center gap-2">
                                    {gainLoss.isGain ? (
                                        <TrendingUp className="w-5 h-5 text-green-600" />
                                    ) : (
                                        <TrendingDown className="w-5 h-5 text-red-600" />
                                    )}
                                    <span className={`font-medium ${gainLoss.isGain ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                    {gainLoss.isGain ? t('assets.disposal.gainOnDisposal') : t('assets.disposal.lossOnDisposal')}: €{gainLoss.amount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                  </span>
                                </div>
                            </div>
                        </>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t('assets.disposal.reason')}
                        </label>
                        <textarea
                            value={formData.reason}
                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                            placeholder={t('assets.disposal.reasonPlaceholder')}
                            rows={3}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white resize-none"
                            required
                        />
                    </div>

                    {/* Warning */}
                    <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-amber-700 dark:text-amber-400">
                            {t('assets.disposal.warning')}
                        </p>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900"
                        >
                            {t('assets.disposal.cancel')}
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                        >
                            {t('assets.disposal.confirmDisposal')}
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
};