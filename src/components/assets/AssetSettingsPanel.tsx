'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    X,
    Save,
    Settings,
    Calculator,
    Bell,
    DollarSign,
    Percent,
    Clock,
    Check,
    AlertCircle,
} from 'lucide-react';
import { Card, Button } from '@/components/ui';
import { useThemeStore } from '@/store/theme-store';
import { DepreciationMethod, AssetCategory } from '@/types/asset';
import toast from 'react-hot-toast';

// =============================================================================
// TYPES
// =============================================================================

interface AssetSettingsPanelProps {
    onClose: () => void;
}

interface AssetSettings {
    defaultDepreciationMethod: DepreciationMethod;
    defaultUsefulLifeByCategory: Record<AssetCategory, number>;
    lowValueAssetThreshold: number;
    autoPostDepreciation: boolean;
    depreciationPostingDay: number;
    notifyBeforeImpairmentTest: boolean;
    impairmentTestReminderDays: number;
    notifyOnDisposal: boolean;
    requireApprovalForDisposal: boolean;
    defaultCurrency: string;
    showTaxBooks: boolean;
    trackCarbonFootprint: boolean;
}

// =============================================================================
// DEFAULT SETTINGS
// =============================================================================

const DEFAULT_USEFUL_LIFE: Record<AssetCategory, number> = {
    [AssetCategory.BUILDINGS]: 480, // 40 years
    [AssetCategory.MACHINERY]: 120, // 10 years
    [AssetCategory.VEHICLES]: 60, // 5 years
    [AssetCategory.IT_EQUIPMENT]: 36, // 3 years
    [AssetCategory.FURNITURE]: 84, // 7 years
    [AssetCategory.INTANGIBLE_ASSETS]: 60, // 5 years
    [AssetCategory.CAPITALIZED_SOFTWARE]: 36, // 3 years
    [AssetCategory.LEASEHOLD_IMPROVEMENTS]: 60, // 5 years
    [AssetCategory.LAND]: 0, // Not depreciable
    [AssetCategory.CONSTRUCTION_IN_PROGRESS]: 0, // Not depreciable
    [AssetCategory.RIGHT_OF_USE]: 60, // Lease term
};

// =============================================================================
// COMPONENT
// =============================================================================

export const AssetSettingsPanel: React.FC<AssetSettingsPanelProps> = ({ onClose }) => {
    const { t } = useThemeStore();
    const [activeSection, setActiveSection] = useState<'depreciation' | 'notifications' | 'general'>('depreciation');
    const [isSaving, setIsSaving] = useState(false);

    const [settings, setSettings] = useState<AssetSettings>({
        defaultDepreciationMethod: DepreciationMethod.STRAIGHT_LINE,
        defaultUsefulLifeByCategory: DEFAULT_USEFUL_LIFE,
        lowValueAssetThreshold: 800,
        autoPostDepreciation: false,
        depreciationPostingDay: 1,
        notifyBeforeImpairmentTest: true,
        impairmentTestReminderDays: 30,
        notifyOnDisposal: true,
        requireApprovalForDisposal: true,
        defaultCurrency: 'EUR',
        showTaxBooks: true,
        trackCarbonFootprint: false,
    });

    const updateSettings = (updates: Partial<AssetSettings>) => {
        setSettings(prev => ({ ...prev, ...updates }));
    };

    const updateUsefulLife = (category: AssetCategory, months: number) => {
        setSettings(prev => ({
            ...prev,
            defaultUsefulLifeByCategory: {
                ...prev.defaultUsefulLifeByCategory,
                [category]: months,
            },
        }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // In a real implementation, this would save to the API
            await new Promise(resolve => setTimeout(resolve, 500));
            toast.success(t('assets.settings.saved') || 'Settings saved successfully');
            onClose();
        } catch (error) {
            toast.error(t('assets.settings.saveFailed') || 'Failed to save settings');
        } finally {
            setIsSaving(false);
        }
    };

    const categoryLabels: Record<AssetCategory, string> = {
        [AssetCategory.BUILDINGS]: t('assets.category.buildings') || 'Buildings',
        [AssetCategory.MACHINERY]: t('assets.category.machinery') || 'Machinery',
        [AssetCategory.VEHICLES]: t('assets.category.vehicles') || 'Vehicles',
        [AssetCategory.IT_EQUIPMENT]: t('assets.category.itEquipment') || 'IT Equipment',
        [AssetCategory.FURNITURE]: t('assets.category.furniture') || 'Furniture',
        [AssetCategory.INTANGIBLE_ASSETS]: t('assets.category.intangibleAssets') || 'Intangible Assets',
        [AssetCategory.CAPITALIZED_SOFTWARE]: t('assets.category.capitalizedSoftware') || 'Capitalized Software',
        [AssetCategory.LEASEHOLD_IMPROVEMENTS]: t('assets.category.leaseholdImprovements') || 'Leasehold Improvements',
        [AssetCategory.LAND]: t('assets.category.land') || 'Land',
        [AssetCategory.CONSTRUCTION_IN_PROGRESS]: t('assets.category.constructionInProgress') || 'Construction in Progress',
        [AssetCategory.RIGHT_OF_USE]: t('assets.category.rightOfUse') || 'Right of Use',
    };

    const sections = [
        { id: 'depreciation' as const, label: t('assets.settings.depreciation') || 'Depreciation', icon: Calculator },
        { id: 'notifications' as const, label: t('assets.settings.notifications') || 'Notifications', icon: Bell },
        { id: 'general' as const, label: t('assets.settings.general') || 'General', icon: Settings },
    ];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white dark:bg-surface-900 rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="p-6 border-b border-gray-200 dark:border-surface-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-purple-500/10">
                            <Settings size={24} className="text-purple-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                {t('assets.settings.title') || 'Asset Settings'}
                            </h2>
                            <p className="text-sm text-gray-500">
                                {t('assets.settings.subtitle') || 'Configure asset management preferences'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-surface-800 rounded-lg transition-colors"
                    >
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar */}
                    <div className="w-48 border-r border-gray-200 dark:border-surface-700 p-4 space-y-1">
                        {sections.map(section => {
                            const Icon = section.icon;
                            const isActive = activeSection === section.id;
                            return (
                                <button
                                    key={section.id}
                                    onClick={() => setActiveSection(section.id)}
                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        isActive
                                            ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-surface-800'
                                    }`}
                                >
                                    <Icon size={18} />
                                    {section.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 p-6 overflow-y-auto">
                        {activeSection === 'depreciation' && (
                            <div className="space-y-6">
                                {/* Default Method */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        {t('assets.settings.defaultMethod') || 'Default Depreciation Method'}
                                    </label>
                                    <select
                                        value={settings.defaultDepreciationMethod}
                                        onChange={e => updateSettings({ defaultDepreciationMethod: e.target.value as DepreciationMethod })}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    >
                                        <option value={DepreciationMethod.STRAIGHT_LINE}>Straight Line</option>
                                        <option value={DepreciationMethod.DECLINING_BALANCE}>Declining Balance</option>
                                        <option value={DepreciationMethod.DOUBLE_DECLINING_BALANCE}>Double Declining Balance</option>
                                        <option value={DepreciationMethod.SUM_OF_YEARS_DIGITS}>Sum of Years Digits</option>
                                        <option value={DepreciationMethod.UNITS_OF_PRODUCTION}>Units of Production</option>
                                    </select>
                                </div>

                                {/* Low Value Threshold */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        {t('assets.settings.lowValueThreshold') || 'Low Value Asset Threshold'}
                                    </label>
                                    <div className="relative">
                                        <DollarSign size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="number"
                                            value={settings.lowValueAssetThreshold}
                                            onChange={e => updateSettings({ lowValueAssetThreshold: Number(e.target.value) })}
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        />
                                    </div>
                                    <p className="mt-1 text-xs text-gray-500">
                                        {t('assets.settings.lowValueDescription') || 'Assets below this value can be expensed immediately'}
                                    </p>
                                </div>

                                {/* Auto Post */}
                                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-surface-800 rounded-lg">
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            {t('assets.settings.autoPost') || 'Auto-post Depreciation'}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {t('assets.settings.autoPostDescription') || 'Automatically post depreciation entries'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => updateSettings({ autoPostDepreciation: !settings.autoPostDepreciation })}
                                        className={`relative w-12 h-6 rounded-full transition-colors ${
                                            settings.autoPostDepreciation ? 'bg-purple-500' : 'bg-gray-300 dark:bg-surface-600'
                                        }`}
                                    >
                                        <span
                                            className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                                                settings.autoPostDepreciation ? 'translate-x-6' : 'translate-x-0'
                                            }`}
                                        />
                                    </button>
                                </div>

                                {settings.autoPostDepreciation && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            {t('assets.settings.postingDay') || 'Posting Day of Month'}
                                        </label>
                                        <select
                                            value={settings.depreciationPostingDay}
                                            onChange={e => updateSettings({ depreciationPostingDay: Number(e.target.value) })}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        >
                                            {Array.from({ length: 28 }, (_, i) => (
                                                <option key={i + 1} value={i + 1}>
                                                    {i + 1}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* Useful Life by Category */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                        {t('assets.settings.usefulLifeByCategory') || 'Default Useful Life by Category'}
                                    </label>
                                    <div className="space-y-2 max-h-60 overflow-y-auto">
                                        {Object.entries(categoryLabels).map(([category, label]) => (
                                            <div key={category} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-surface-800 rounded-lg">
                                                <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="number"
                                                        value={settings.defaultUsefulLifeByCategory[category as AssetCategory]}
                                                        onChange={e => updateUsefulLife(category as AssetCategory, Number(e.target.value))}
                                                        className="w-20 px-2 py-1 text-sm border border-gray-300 dark:border-surface-600 rounded bg-white dark:bg-surface-700 text-gray-900 dark:text-white text-right"
                                                    />
                                                    <span className="text-xs text-gray-500 w-14">
                                                        {t('common.months') || 'months'}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeSection === 'notifications' && (
                            <div className="space-y-4">
                                {/* Impairment Test Reminder */}
                                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-surface-800 rounded-lg">
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            {t('assets.settings.impairmentReminder') || 'Impairment Test Reminder'}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {t('assets.settings.impairmentReminderDescription') || 'Get notified before impairment tests are due'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => updateSettings({ notifyBeforeImpairmentTest: !settings.notifyBeforeImpairmentTest })}
                                        className={`relative w-12 h-6 rounded-full transition-colors ${
                                            settings.notifyBeforeImpairmentTest ? 'bg-purple-500' : 'bg-gray-300 dark:bg-surface-600'
                                        }`}
                                    >
                                        <span
                                            className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                                                settings.notifyBeforeImpairmentTest ? 'translate-x-6' : 'translate-x-0'
                                            }`}
                                        />
                                    </button>
                                </div>

                                {settings.notifyBeforeImpairmentTest && (
                                    <div className="ml-4">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            {t('assets.settings.reminderDays') || 'Days before reminder'}
                                        </label>
                                        <input
                                            type="number"
                                            value={settings.impairmentTestReminderDays}
                                            onChange={e => updateSettings({ impairmentTestReminderDays: Number(e.target.value) })}
                                            className="w-32 px-4 py-2 border border-gray-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        />
                                    </div>
                                )}

                                {/* Disposal Notifications */}
                                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-surface-800 rounded-lg">
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            {t('assets.settings.disposalNotification') || 'Disposal Notifications'}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {t('assets.settings.disposalNotificationDescription') || 'Get notified when assets are disposed'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => updateSettings({ notifyOnDisposal: !settings.notifyOnDisposal })}
                                        className={`relative w-12 h-6 rounded-full transition-colors ${
                                            settings.notifyOnDisposal ? 'bg-purple-500' : 'bg-gray-300 dark:bg-surface-600'
                                        }`}
                                    >
                                        <span
                                            className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                                                settings.notifyOnDisposal ? 'translate-x-6' : 'translate-x-0'
                                            }`}
                                        />
                                    </button>
                                </div>

                                {/* Require Approval */}
                                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-surface-800 rounded-lg">
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            {t('assets.settings.requireApproval') || 'Require Disposal Approval'}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {t('assets.settings.requireApprovalDescription') || 'Asset disposals require manager approval'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => updateSettings({ requireApprovalForDisposal: !settings.requireApprovalForDisposal })}
                                        className={`relative w-12 h-6 rounded-full transition-colors ${
                                            settings.requireApprovalForDisposal ? 'bg-purple-500' : 'bg-gray-300 dark:bg-surface-600'
                                        }`}
                                    >
                                        <span
                                            className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                                                settings.requireApprovalForDisposal ? 'translate-x-6' : 'translate-x-0'
                                            }`}
                                        />
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeSection === 'general' && (
                            <div className="space-y-6">
                                {/* Default Currency */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        {t('assets.settings.defaultCurrency') || 'Default Currency'}
                                    </label>
                                    <select
                                        value={settings.defaultCurrency}
                                        onChange={e => updateSettings({ defaultCurrency: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    >
                                        <option value="EUR">EUR - Euro</option>
                                        <option value="USD">USD - US Dollar</option>
                                        <option value="GBP">GBP - British Pound</option>
                                        <option value="CHF">CHF - Swiss Franc</option>
                                        <option value="JPY">JPY - Japanese Yen</option>
                                    </select>
                                </div>

                                {/* Show Tax Books */}
                                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-surface-800 rounded-lg">
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            {t('assets.settings.showTaxBooks') || 'Show Tax Books'}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {t('assets.settings.showTaxBooksDescription') || 'Display tax depreciation alongside IFRS/GAAP'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => updateSettings({ showTaxBooks: !settings.showTaxBooks })}
                                        className={`relative w-12 h-6 rounded-full transition-colors ${
                                            settings.showTaxBooks ? 'bg-purple-500' : 'bg-gray-300 dark:bg-surface-600'
                                        }`}
                                    >
                                        <span
                                            className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                                                settings.showTaxBooks ? 'translate-x-6' : 'translate-x-0'
                                            }`}
                                        />
                                    </button>
                                </div>

                                {/* Carbon Footprint */}
                                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-surface-800 rounded-lg">
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            {t('assets.settings.carbonTracking') || 'Carbon Footprint Tracking'}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {t('assets.settings.carbonTrackingDescription') || 'Track CO2 emissions for ESG reporting'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => updateSettings({ trackCarbonFootprint: !settings.trackCarbonFootprint })}
                                        className={`relative w-12 h-6 rounded-full transition-colors ${
                                            settings.trackCarbonFootprint ? 'bg-purple-500' : 'bg-gray-300 dark:bg-surface-600'
                                        }`}
                                    >
                                        <span
                                            className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                                                settings.trackCarbonFootprint ? 'translate-x-6' : 'translate-x-0'
                                            }`}
                                        />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 dark:border-surface-700 flex justify-end gap-3">
                    <Button variant="secondary" onClick={onClose}>
                        {t('common.cancel') || 'Cancel'}
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSave}
                        disabled={isSaving}
                        leftIcon={isSaving ? undefined : <Save size={16} />}
                    >
                        {isSaving ? t('common.saving') || 'Saving...' : t('common.save') || 'Save'}
                    </Button>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default AssetSettingsPanel;
