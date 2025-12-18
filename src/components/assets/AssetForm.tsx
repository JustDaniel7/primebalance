'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    X,
    Save,
    Package,
    DollarSign,
    Calendar,
    MapPin,
    Building2,
    FileText,
    ChevronRight,
    ChevronLeft,
} from 'lucide-react';
import { Card, Button } from '@/components/ui';
import { useAssetStore } from '@/store/asset-store';
import { ASSET_CLASS_CONFIGS } from '@/data/asset-classes';
import {
    AssetType,
    AssetCategory,
    DepreciationMethod,
} from '@/types/asset';

// =============================================================================
// TYPES
// =============================================================================

interface AssetFormProps {
    onClose: () => void;
    onSuccess?: (assetId: string) => void;
}

interface FormData {
    name: string;
    description: string;
    assetType: AssetType;
    category: AssetCategory;
    currency: string;
    acquisitionCost: number;
    salvageValue: number;
    usefulLifeMonths: number;
    depreciationMethod: DepreciationMethod;
    legalEntityId: string;
    costCenterId: string;
    location: string;
    responsibleParty: string;
    acquisitionDate: string;
    isCIP: boolean;
}

// =============================================================================
// COMPONENT
// =============================================================================

export const AssetForm: React.FC<AssetFormProps> = ({ onClose, onSuccess }) => {
    const { createAsset, acquireAsset, capitalizeAsset, putInUse } = useAssetStore();
    const [step, setStep] = useState(1);
    const [autoCapitalize, setAutoCapitalize] = useState(true);

    const [formData, setFormData] = useState<FormData>({
        name: '',
        description: '',
        assetType: AssetType.TANGIBLE,
        category: AssetCategory.IT_EQUIPMENT,
        currency: 'EUR',
        acquisitionCost: 0,
        salvageValue: 0,
        usefulLifeMonths: 36,
        depreciationMethod: DepreciationMethod.STRAIGHT_LINE,
        legalEntityId: '',
        costCenterId: '',
        location: '',
        responsibleParty: '',
        acquisitionDate: new Date().toISOString().split('T')[0],
        isCIP: false,
    });

    const updateForm = (updates: Partial<FormData>) => {
        setFormData(prev => ({ ...prev, ...updates }));
    };

    // Apply defaults when category changes
    const handleCategoryChange = (category: AssetCategory) => {
        const config = ASSET_CLASS_CONFIGS[category];
        updateForm({
            category,
            depreciationMethod: config.defaultDepreciationMethod,
            usefulLifeMonths: config.defaultUsefulLifeMonths,
            salvageValue: formData.acquisitionCost * (config.defaultSalvageValuePercent / 100),
        });
    };

    const handleSubmit = () => {
        const assetId = createAsset({
            name: formData.name,
            description: formData.description,
            assetType: formData.assetType,
            category: formData.category,
            currency: formData.currency,
            acquisitionCost: formData.acquisitionCost,
            capitalizedCost: formData.acquisitionCost,
            salvageValue: formData.salvageValue,
            usefulLifeMonths: formData.usefulLifeMonths,
            depreciationMethod: formData.depreciationMethod,
            legalEntityId: formData.legalEntityId || undefined,
            costCenterId: formData.costCenterId || undefined,
            location: formData.location || undefined,
            responsibleParty: formData.responsibleParty || undefined,
            isCIP: formData.isCIP,
        });

        if (autoCapitalize && formData.acquisitionCost > 0 && !formData.isCIP) {
            acquireAsset(assetId, formData.acquisitionDate, formData.acquisitionCost, 'user');
            capitalizeAsset(assetId, formData.acquisitionDate, 'user');
            putInUse(assetId, formData.acquisitionDate, 'user');
        }

        onSuccess?.(assetId);
        onClose();
    };

    const steps = [
        { number: 1, title: 'Basic Info', icon: Package },
        { number: 2, title: 'Financials', icon: DollarSign },
        { number: 3, title: 'Assignment', icon: Building2 },
    ];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Add New Asset</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Step Indicator */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        {steps.map((s, idx) => {
                            const Icon = s.icon;
                            const isActive = step === s.number;
                            const isComplete = step > s.number;

                            return (
                                <React.Fragment key={s.number}>
                                    <div
                                        className={`flex items-center gap-2 cursor-pointer ${
                                            isActive ? 'text-blue-600' : isComplete ? 'text-green-600' : 'text-gray-400'
                                        }`}
                                        onClick={() => setStep(s.number)}
                                    >
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                            isActive ? 'bg-blue-100 dark:bg-blue-900/30' : isComplete ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-800'
                                        }`}>
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm font-medium hidden sm:inline">{s.title}</span>
                                    </div>
                                    {idx < steps.length - 1 && (
                                        <div className={`flex-1 h-0.5 mx-4 ${isComplete ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>

                {/* Form Content */}
                <div className="px-6 py-6 overflow-y-auto max-h-[50vh]">
                    {step === 1 && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Asset Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => updateForm({ name: e.target.value })}
                                    placeholder="e.g., MacBook Pro 16-inch"
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Description
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => updateForm({ description: e.target.value })}
                                    placeholder="Additional details about the asset..."
                                    rows={3}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Asset Type
                                    </label>
                                    <select
                                        value={formData.assetType}
                                        onChange={(e) => updateForm({ assetType: e.target.value as AssetType })}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                                    >
                                        <option value={AssetType.TANGIBLE}>Tangible</option>
                                        <option value={AssetType.INTANGIBLE}>Intangible</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Category
                                    </label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => handleCategoryChange(e.target.value as AssetCategory)}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                                    >
                                        {Object.values(AssetCategory).map(cat => (
                                            <option key={cat} value={cat}>{ASSET_CLASS_CONFIGS[cat].label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="isCIP"
                                    checked={formData.isCIP}
                                    onChange={(e) => updateForm({ isCIP: e.target.checked })}
                                    className="w-4 h-4 text-blue-500 rounded"
                                />
                                <label htmlFor="isCIP" className="text-sm text-gray-700 dark:text-gray-300">
                                    Construction in Progress (not ready for use)
                                </label>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Acquisition Cost *
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">€</span>
                                        <input
                                            type="number"
                                            value={formData.acquisitionCost || ''}
                                            onChange={(e) => {
                                                const cost = parseFloat(e.target.value) || 0;
                                                const config = ASSET_CLASS_CONFIGS[formData.category];
                                                updateForm({
                                                    acquisitionCost: cost,
                                                    salvageValue: cost * (config.defaultSalvageValuePercent / 100),
                                                });
                                            }}
                                            placeholder="0.00"
                                            className="w-full pl-8 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Salvage Value
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">€</span>
                                        <input
                                            type="number"
                                            value={formData.salvageValue || ''}
                                            onChange={(e) => updateForm({ salvageValue: parseFloat(e.target.value) || 0 })}
                                            placeholder="0.00"
                                            className="w-full pl-8 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Useful Life (months)
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.usefulLifeMonths}
                                        onChange={(e) => updateForm({ usefulLifeMonths: parseInt(e.target.value) || 12 })}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        {(formData.usefulLifeMonths / 12).toFixed(1)} years
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Depreciation Method
                                    </label>
                                    <select
                                        value={formData.depreciationMethod}
                                        onChange={(e) => updateForm({ depreciationMethod: e.target.value as DepreciationMethod })}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                                    >
                                        <option value={DepreciationMethod.STRAIGHT_LINE}>Straight Line</option>
                                        <option value={DepreciationMethod.DECLINING_BALANCE}>Declining Balance</option>
                                        <option value={DepreciationMethod.DOUBLE_DECLINING_BALANCE}>Double Declining Balance</option>
                                        <option value={DepreciationMethod.SUM_OF_YEARS_DIGITS}>Sum of Years' Digits</option>
                                        <option value={DepreciationMethod.UNITS_OF_PRODUCTION}>Units of Production</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Acquisition Date
                                </label>
                                <input
                                    type="date"
                                    value={formData.acquisitionDate}
                                    onChange={(e) => updateForm({ acquisitionDate: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>

                            {/* Calculated Values */}
                            <div className="p-4 bg-gray-50 dark:bg-slate-900 rounded-lg">
                                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Depreciation Preview</h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-500">Depreciable Base:</span>
                                        <span className="ml-2 font-medium text-gray-900 dark:text-white">
                      €{(formData.acquisitionCost - formData.salvageValue).toLocaleString('de-DE')}
                    </span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Monthly Depreciation:</span>
                                        <span className="ml-2 font-medium text-gray-900 dark:text-white">
                      €{((formData.acquisitionCost - formData.salvageValue) / formData.usefulLifeMonths).toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                    </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Legal Entity
                                </label>
                                <input
                                    type="text"
                                    value={formData.legalEntityId}
                                    onChange={(e) => updateForm({ legalEntityId: e.target.value })}
                                    placeholder="Select or enter entity..."
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Cost Center
                                </label>
                                <input
                                    type="text"
                                    value={formData.costCenterId}
                                    onChange={(e) => updateForm({ costCenterId: e.target.value })}
                                    placeholder="e.g., CC-100 Marketing"
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Location
                                </label>
                                <input
                                    type="text"
                                    value={formData.location}
                                    onChange={(e) => updateForm({ location: e.target.value })}
                                    placeholder="e.g., HQ Floor 3, Room 301"
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Responsible Party
                                </label>
                                <input
                                    type="text"
                                    value={formData.responsibleParty}
                                    onChange={(e) => updateForm({ responsibleParty: e.target.value })}
                                    placeholder="e.g., IT Manager"
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>

                            <div className="flex items-center gap-2 pt-4">
                                <input
                                    type="checkbox"
                                    id="autoCapitalize"
                                    checked={autoCapitalize}
                                    onChange={(e) => setAutoCapitalize(e.target.checked)}
                                    className="w-4 h-4 text-blue-500 rounded"
                                />
                                <label htmlFor="autoCapitalize" className="text-sm text-gray-700 dark:text-gray-300">
                                    Automatically capitalize and put in use
                                </label>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <button
                        onClick={() => step > 1 ? setStep(step - 1) : onClose()}
                        className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-2"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        {step > 1 ? 'Back' : 'Cancel'}
                    </button>

                    {step < 3 ? (
                        <button
                            onClick={() => setStep(step + 1)}
                            disabled={step === 1 && !formData.name}
                            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            Next
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={!formData.name || formData.acquisitionCost <= 0}
                            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <Save className="w-4 h-4" />
                            Create Asset
                        </button>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};