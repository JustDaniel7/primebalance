'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    Search,
    Package,
    Box,
    Cpu,
    Clock,
    Wrench,
    Truck,
    ChevronRight,
    ChevronLeft,
    AlertTriangle,
    AlertCircle,
    TrendingUp,
    TrendingDown,
    MapPin,
    X,
    Check,
    ArrowRightLeft,
    BarChart3,
    Tag,
    Layers,
    Warehouse,
    ShoppingCart,
    Globe,
    HardDrive,
} from 'lucide-react';
import { Card, Button, Badge, Input } from '@/components/ui';
import { useThemeStore } from '@/store/theme-store';
import { useInventoryStore } from '@/store/inventory-store';
import type { InventoryItem, InventoryType, MovementType, StockMovement } from '@/types/inventory';

// =============================================================================
// TYPE ICONS & COLORS
// =============================================================================

const typeIcons: Record<InventoryType, React.ElementType> = {
    physical: Box,
    digital: Cpu,
    service: Clock,
    wip: Wrench,
    consignment: Truck,
};

const typeColors: Record<InventoryType, string> = {
    physical: 'blue',
    digital: 'purple',
    service: 'amber',
    wip: 'cyan',
    consignment: 'rose',
};

// =============================================================================
// INVENTORY LIST
// =============================================================================

function InventoryList({
                           onCreateNew,
                           onSelectItem,
                       }: {
    onCreateNew: () => void;
    onSelectItem: (item: InventoryItem) => void;
}) {
    const { t, language } = useThemeStore();
    const { items, locations, getSummary, getAlerts, getLowStockItems } = useInventoryStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState<InventoryType | 'all'>('all');
    const [locationFilter, setLocationFilter] = useState<string | 'all'>('all');

    const summary = getSummary();
    const alerts = getAlerts();
    const lowStockItems = getLowStockItems();

    const filteredItems = useMemo(() => {
        return items.filter((item) => {
            if (item.status !== 'active') return false;
            const matchesSearch =
                item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.category?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesType = typeFilter === 'all' || item.type === typeFilter;
            const matchesLocation = locationFilter === 'all' ||
                (item.stockByLocation && item.stockByLocation[locationFilter] > 0);
            return matchesSearch && matchesType && matchesLocation;
        });
    }, [items, searchQuery, typeFilter, locationFilter]);

    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat(language === 'de' ? 'de-DE' : language === 'fr' ? 'fr-FR' : language === 'es' ? 'es-ES' : 'en-US', {
            style: 'currency',
            currency,
        }).format(amount);
    };

    const getStockStatus = (item: InventoryItem) => {
        if (item.availableStock <= 0) return { variant: 'danger' as const, label: t('inventory.outOfStock') };
        if (item.minStockLevel && item.availableStock < item.minStockLevel) return { variant: 'warning' as const, label: t('inventory.lowStock') };
        if (item.maxStockLevel && item.totalStock > item.maxStockLevel) return { variant: 'info' as const, label: t('inventory.overstock') };
        return { variant: 'success' as const, label: t('inventory.inStock') };
    };

    const inventoryTypes: Array<{ value: InventoryType | 'all'; label: string }> = [
        { value: 'all', label: t('common.all') },
        { value: 'physical', label: t('inventory.type.physical') },
        { value: 'digital', label: t('inventory.type.digital') },
        { value: 'service', label: t('inventory.type.service') },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-surface-100 font-display">
                        {t('inventory.title')}
                    </h1>
                    <p className="text-gray-500 dark:text-surface-500 mt-1">{t('inventory.subtitle')}</p>
                </div>
                <Button variant="primary" leftIcon={<Plus size={18} />} onClick={onCreateNew}>
                    {t('inventory.addItem')}
                </Button>
            </div>

            {/* Alerts Banner */}
            {alerts.filter((a) => a.severity === 'critical' || a.severity === 'warning').length > 0 && (
                <Card variant="glass" padding="md" className="border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-900/20">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="text-amber-500 flex-shrink-0" size={20} />
                        <div>
                            <p className="font-medium text-amber-700 dark:text-amber-300">
                                {alerts.length} {t('inventory.stockAlerts')}
                            </p>
                            <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                                {lowStockItems.length > 0 && `${lowStockItems.length} ${t('inventory.itemsLowStock')}`}
                            </p>
                        </div>
                    </div>
                </Card>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <Card variant="glass" padding="md">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[var(--accent-primary)]/10 flex items-center justify-center">
                            <Package size={20} className="text-[var(--accent-primary)]" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-surface-400">{t('inventory.totalItems')}</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-surface-100">{summary.totalItems}</p>
                        </div>
                    </div>
                </Card>

                <Card variant="glass" padding="md">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                            <TrendingUp size={20} className="text-green-500" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-surface-400">{t('inventory.totalValue')}</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-surface-100">
                                {formatCurrency(summary.totalValue, 'EUR')}
                            </p>
                        </div>
                    </div>
                </Card>

                <Card variant="glass" padding="md">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                            <AlertCircle size={20} className="text-amber-500" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-surface-400">{t('inventory.lowStock')}</p>
                            <p className="text-xl font-bold text-amber-600">{summary.lowStockItems}</p>
                        </div>
                    </div>
                </Card>

                <Card variant="glass" padding="md">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                            <ArrowRightLeft size={20} className="text-blue-500" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-surface-400">{t('inventory.movements30d')}</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-surface-100">{summary.recentMovements}</p>
                        </div>
                    </div>
                </Card>

                <Card variant="glass" padding="md">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                            <Warehouse size={20} className="text-purple-500" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-surface-400">{t('inventory.locations')}</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-surface-100">{locations.length}</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder={t('inventory.search')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-surface-800/50 border border-gray-200 dark:border-surface-700 rounded-xl text-gray-900 dark:text-surface-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20"
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto">
                    {inventoryTypes.map((type) => (
                        <button
                            key={type.value}
                            onClick={() => setTypeFilter(type.value)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                                typeFilter === type.value
                                    ? 'bg-[var(--accent-primary)] text-white'
                                    : 'bg-gray-100 dark:bg-surface-800/50 text-gray-600 dark:text-surface-400 hover:bg-gray-200'
                            }`}
                        >
                            {type.label}
                        </button>
                    ))}
                </div>
                <select
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    className="px-4 py-2.5 bg-white dark:bg-surface-800/50 border border-gray-200 dark:border-surface-700 rounded-xl text-sm"
                >
                    <option value="all">{t('inventory.allLocations')}</option>
                    {locations.map((loc) => (
                        <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                </select>
            </div>

            {/* Inventory List */}
            {filteredItems.length === 0 ? (
                <Card variant="glass" padding="lg" className="text-center">
                    <Package size={48} className="mx-auto text-gray-300 dark:text-surface-600 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-surface-100">{t('inventory.noItems')}</h3>
                    <p className="text-gray-500 dark:text-surface-400 mt-1">{t('inventory.noItemsDesc')}</p>
                    <Button variant="primary" className="mt-4" onClick={onCreateNew}>
                        {t('inventory.addItem')}
                    </Button>
                </Card>
            ) : (
                <div className="space-y-3">
                    {filteredItems.map((item, index) => {
                        const Icon = typeIcons[item.type];
                        const stockStatus = getStockStatus(item);
                        const hasAlerts = alerts.some((a) => a.itemId === item.id && !a.isRead);

                        return (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.03 }}
                            >
                                <Card
                                    variant="glass"
                                    padding="md"
                                    hover
                                    className={`cursor-pointer ${hasAlerts ? 'border-l-4 border-amber-500' : ''}`}
                                    onClick={() => onSelectItem(item)}
                                >
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-4 min-w-0">
                                            <div className={`w-12 h-12 rounded-xl bg-${typeColors[item.type]}-500/10 flex items-center justify-center flex-shrink-0`}>
                                                <Icon size={24} className={`text-${typeColors[item.type]}-500`} />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900 dark:text-surface-100 truncate">
                            {item.name}
                          </span>
                                                    {item.sku && (
                                                        <span className="text-xs text-gray-400 dark:text-surface-500 font-mono">
                              {item.sku}
                            </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge variant="neutral" size="sm">{t(`inventory.type.${item.type}`)}</Badge>
                                                    {item.category && (
                                                        <span className="text-xs text-gray-500 dark:text-surface-400">
                              {t(`inventory.category.${item.category}`)}
                            </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            {/* Stock levels */}
                                            <div className="hidden md:block text-center">
                                                <p className="text-xs text-gray-500 dark:text-surface-400">{t('inventory.total')}</p>
                                                <p className="font-semibold text-gray-900 dark:text-surface-100">{item.totalStock}</p>
                                            </div>
                                            <div className="hidden md:block text-center">
                                                <p className="text-xs text-gray-500 dark:text-surface-400">{t('inventory.reserved')}</p>
                                                <p className="font-semibold text-amber-600">{item.reservedStock}</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-xs text-gray-500 dark:text-surface-400">{t('inventory.available')}</p>
                                                <p className={`font-bold text-lg ${item.availableStock <= 0 ? 'text-red-500' : 'text-green-600'}`}>
                                                    {item.availableStock}
                                                </p>
                                            </div>

                                            <Badge variant={stockStatus.variant} size="sm">{stockStatus.label}</Badge>

                                            {item.totalValue && (
                                                <div className="hidden lg:block text-right min-w-[100px]">
                                                    <p className="font-semibold text-gray-900 dark:text-surface-100">
                                                        {formatCurrency(item.totalValue, item.currency)}
                                                    </p>
                                                </div>
                                            )}

                                            <ChevronRight size={16} className="text-gray-400" />
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Stock by Location */}
            <Card variant="glass" padding="md">
                <h3 className="font-medium text-gray-700 dark:text-surface-300 mb-4">{t('inventory.stockByLocation')}</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {locations.filter((l) => l.isActive).map((location) => {
                        const locationStock = summary.byLocation[location.id] || 0;
                        return (
                            <div key={location.id} className="p-3 bg-gray-50 dark:bg-surface-700/30 rounded-xl">
                                <div className="flex items-center gap-2 mb-2">
                                    <MapPin size={16} className="text-gray-400" />
                                    <span className="text-sm font-medium text-gray-700 dark:text-surface-300 truncate">{location.name}</span>
                                </div>
                                <p className="text-xl font-bold text-gray-900 dark:text-surface-100">{locationStock}</p>
                                <p className="text-xs text-gray-500 dark:text-surface-400">{t('inventory.units')}</p>
                            </div>
                        );
                    })}
                </div>
            </Card>
        </div>
    );
}

// =============================================================================
// INVENTORY WIZARD
// =============================================================================

function InventoryWizard({
                             onClose,
                             onComplete,
                         }: {
    onClose: () => void;
    onComplete: (item: InventoryItem) => void;
}) {
    const { t, language } = useThemeStore();
    const { wizardState, updateWizardState, setWizardStep, createItem, locations, recordMovement, resetWizard } = useInventoryStore();

    const steps = [
        { id: 1, label: t('inventory.wizard.type'), icon: Package },
        { id: 2, label: t('inventory.wizard.details'), icon: Tag },
        { id: 3, label: t('inventory.wizard.location'), icon: MapPin },
        { id: 4, label: t('inventory.wizard.quantity'), icon: Layers },
        { id: 5, label: t('inventory.wizard.tracking'), icon: BarChart3 },
        { id: 6, label: t('inventory.wizard.review'), icon: Check },
    ];

    const currentStep = wizardState.step;

    const goNext = () => currentStep < 6 && setWizardStep(currentStep + 1);
    const goBack = () => currentStep > 1 && setWizardStep(currentStep - 1);

    const inventoryTypeOptions: Array<{ value: InventoryType; label: string; description: string; icon: React.ElementType }> = [
        { value: 'physical', label: t('inventory.type.physical'), description: t('inventory.typeDesc.physical'), icon: Box },
        { value: 'digital', label: t('inventory.type.digital'), description: t('inventory.typeDesc.digital'), icon: Cpu },
        { value: 'service', label: t('inventory.type.service'), description: t('inventory.typeDesc.service'), icon: Clock },
        { value: 'wip', label: t('inventory.type.wip'), description: t('inventory.typeDesc.wip'), icon: Wrench },
        { value: 'consignment', label: t('inventory.type.consignment'), description: t('inventory.typeDesc.consignment'), icon: Truck },
    ];

    const handleCreate = () => {
        const item = createItem({
            name: wizardState.name,
            sku: wizardState.sku || undefined,
            category: wizardState.category || undefined,
            type: wizardState.type!,
            unit: wizardState.unit,
            ownership: wizardState.ownership,
            defaultLocationId: wizardState.locationId || undefined,
            totalStock: wizardState.initialQuantity,
            reservedStock: 0,
            incomingStock: 0,
            committedStock: 0,
            minStockLevel: wizardState.minStockLevel || undefined,
            reorderPoint: wizardState.reorderPoint || undefined,
            trackSerialNumbers: wizardState.trackSerialNumbers,
            trackBatches: wizardState.trackBatches,
            trackExpiry: wizardState.trackExpiry,
            valuationMethod: wizardState.valuationMethod,
            unitCost: wizardState.unitCost || undefined,
            totalValue: wizardState.unitCost ? wizardState.unitCost * wizardState.initialQuantity : undefined,
            currency: wizardState.currency,
            status: 'active',
            description: wizardState.description || undefined,
        });

        // Record initial stock movement
        if (wizardState.initialQuantity > 0) {
            recordMovement({
                itemId: item.id,
                type: 'adjustment',
                date: new Date().toISOString().split('T')[0],
                quantity: wizardState.initialQuantity,
                toLocationId: wizardState.locationId || undefined,
                notes: 'Initial stock entry',
            });
        }

        resetWizard();
        onComplete(item);
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 1: // Type
                return (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-surface-100">
                                {t('inventory.wizard.selectType')}
                            </h2>
                            <p className="text-gray-500 dark:text-surface-400 mt-1">{t('inventory.wizard.selectTypeDesc')}</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {inventoryTypeOptions.map((option) => {
                                const Icon = option.icon;
                                return (
                                    <button
                                        key={option.value}
                                        onClick={() => updateWizardState({ type: option.value })}
                                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                                            wizardState.type === option.value
                                                ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/5'
                                                : 'border-gray-200 dark:border-surface-700 hover:border-gray-300'
                                        }`}
                                    >
                                        <Icon size={24} className={wizardState.type === option.value ? 'text-[var(--accent-primary)]' : 'text-gray-400'} />
                                        <p className="font-semibold text-gray-900 dark:text-surface-100 mt-2">{option.label}</p>
                                        <p className="text-sm text-gray-500 dark:text-surface-400 mt-1">{option.description}</p>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                );

            case 2: // Details
                return (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-surface-100">
                                {t('inventory.wizard.itemDetails')}
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <Input
                                    label={t('inventory.itemName')}
                                    value={wizardState.name}
                                    onChange={(e) => updateWizardState({ name: e.target.value })}
                                    placeholder={t('inventory.itemNamePlaceholder')}
                                />
                            </div>
                            <Input
                                label={t('inventory.sku')}
                                value={wizardState.sku}
                                onChange={(e) => updateWizardState({ sku: e.target.value })}
                                placeholder="SKU-001"
                            />
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-surface-300 mb-1.5">
                                    {t('inventory.category')}
                                </label>
                                <select
                                    value={wizardState.category}
                                    onChange={(e) => updateWizardState({ category: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-white dark:bg-surface-800/50 border border-gray-200 dark:border-surface-700 rounded-xl"
                                >
                                    <option value="">{t('inventory.selectCategory')}</option>
                                    <option value="electronics">{t('inventory.category.electronics')}</option>
                                    <option value="clothing">{t('inventory.category.clothing')}</option>
                                    <option value="food">{t('inventory.category.food')}</option>
                                    <option value="raw_materials">{t('inventory.category.raw_materials')}</option>
                                    <option value="software">{t('inventory.category.software')}</option>
                                    <option value="services">{t('inventory.category.services')}</option>
                                    <option value="other">{t('inventory.category.other')}</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-surface-300 mb-1.5">
                                    {t('inventory.unit')}
                                </label>
                                <select
                                    value={wizardState.unit}
                                    onChange={(e) => updateWizardState({ unit: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-white dark:bg-surface-800/50 border border-gray-200 dark:border-surface-700 rounded-xl"
                                >
                                    <option value="piece">{t('inventory.unit.piece')}</option>
                                    <option value="kg">{t('inventory.unit.kg')}</option>
                                    <option value="liter">{t('inventory.unit.liter')}</option>
                                    <option value="meter">{t('inventory.unit.meter')}</option>
                                    <option value="hour">{t('inventory.unit.hour')}</option>
                                    <option value="license">{t('inventory.unit.license')}</option>
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-surface-300 mb-1.5">
                                    {t('inventory.description')}
                                </label>
                                <textarea
                                    value={wizardState.description}
                                    onChange={(e) => updateWizardState({ description: e.target.value })}
                                    rows={3}
                                    className="w-full px-4 py-2.5 bg-white dark:bg-surface-800/50 border border-gray-200 dark:border-surface-700 rounded-xl resize-none"
                                    placeholder={t('inventory.descriptionPlaceholder')}
                                />
                            </div>
                        </div>
                    </div>
                );

            case 3: // Location & Ownership
                return (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-surface-100">
                                {t('inventory.wizard.locationOwnership')}
                            </h2>
                            <p className="text-gray-500 dark:text-surface-400 mt-1">{t('inventory.wizard.locationOwnershipDesc')}</p>
                        </div>

                        {/* Ownership */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-surface-300 mb-2">
                                {t('inventory.ownership')}
                            </label>
                            <div className="flex gap-3">
                                {(['owned', 'consignment_supplier', 'consignment_customer'] as const).map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => updateWizardState({ ownership: type })}
                                        className={`flex-1 p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                                            wizardState.ownership === type
                                                ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/5 text-[var(--accent-primary)]'
                                                : 'border-gray-200 dark:border-surface-700 text-gray-600 dark:text-surface-400'
                                        }`}
                                    >
                                        {t(`inventory.ownership.${type}`)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Location */}
                        {wizardState.type !== 'service' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-surface-300 mb-2">
                                    {t('inventory.location')}
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    {locations.filter((l) => l.isActive).map((location) => (
                                        <button
                                            key={location.id}
                                            onClick={() => updateWizardState({ locationId: location.id })}
                                            className={`p-4 rounded-xl border-2 text-left transition-all ${
                                                wizardState.locationId === location.id
                                                    ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/5'
                                                    : 'border-gray-200 dark:border-surface-700'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <MapPin size={16} className={wizardState.locationId === location.id ? 'text-[var(--accent-primary)]' : 'text-gray-400'} />
                                                <span className="font-medium text-gray-900 dark:text-surface-100">{location.name}</span>
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-surface-400 mt-1">{t(`inventory.locationType.${location.type}`)}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                );

            case 4: // Quantity & Value
                return (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-surface-100">
                                {t('inventory.wizard.quantity')}
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label={t('inventory.initialQuantity')}
                                type="number"
                                value={wizardState.initialQuantity || ''}
                                onChange={(e) => updateWizardState({ initialQuantity: Number(e.target.value) })}
                                placeholder="0"
                            />
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-surface-300 mb-1.5">
                                    {t('inventory.valuationMethod')}
                                </label>
                                <select
                                    value={wizardState.valuationMethod}
                                    onChange={(e) => updateWizardState({ valuationMethod: e.target.value as any })}
                                    className="w-full px-4 py-2.5 bg-white dark:bg-surface-800/50 border border-gray-200 dark:border-surface-700 rounded-xl"
                                >
                                    <option value="none">{t('inventory.valuation.none')}</option>
                                    <option value="fifo">{t('inventory.valuation.fifo')}</option>
                                    <option value="weighted_average">{t('inventory.valuation.weighted_average')}</option>
                                    <option value="standard_cost">{t('inventory.valuation.standard_cost')}</option>
                                </select>
                            </div>
                            {wizardState.valuationMethod !== 'none' && (
                                <>
                                    <Input
                                        label={t('inventory.unitCost')}
                                        type="number"
                                        step="0.01"
                                        value={wizardState.unitCost || ''}
                                        onChange={(e) => updateWizardState({ unitCost: Number(e.target.value) })}
                                    />
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-surface-300 mb-1.5">
                                            {t('invoice.currency')}
                                        </label>
                                        <select
                                            value={wizardState.currency}
                                            onChange={(e) => updateWizardState({ currency: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-white dark:bg-surface-800/50 border border-gray-200 dark:border-surface-700 rounded-xl"
                                        >
                                            <option value="EUR">EUR</option>
                                            <option value="USD">USD</option>
                                            <option value="CHF">CHF</option>
                                            <option value="GBP">GBP</option>
                                        </select>
                                    </div>
                                </>
                            )}
                        </div>

                        {wizardState.valuationMethod !== 'none' && wizardState.initialQuantity > 0 && wizardState.unitCost > 0 && (
                            <Card variant="glass" padding="md" className="bg-green-50 dark:bg-green-900/20">
                                <div className="flex items-center justify-between">
                                    <span className="text-green-700 dark:text-green-300">{t('inventory.totalValue')}</span>
                                    <span className="text-xl font-bold text-green-600 dark:text-green-400">
                    {new Intl.NumberFormat(language === 'de' ? 'de-DE' : 'en-US', { style: 'currency', currency: wizardState.currency }).format(wizardState.initialQuantity * wizardState.unitCost)}
                  </span>
                                </div>
                            </Card>
                        )}
                    </div>
                );

            case 5: // Tracking & Thresholds
                return (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-surface-100">
                                {t('inventory.wizard.tracking')}
                            </h2>
                        </div>

                        {/* Tracking options */}
                        <div className="space-y-3">
                            <label className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-surface-800/30 rounded-xl cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={wizardState.trackSerialNumbers}
                                    onChange={(e) => updateWizardState({ trackSerialNumbers: e.target.checked })}
                                    className="w-5 h-5 rounded border-gray-300 text-[var(--accent-primary)]"
                                />
                                <div>
                                    <p className="font-medium text-gray-700 dark:text-surface-300">{t('inventory.trackSerial')}</p>
                                    <p className="text-sm text-gray-500 dark:text-surface-400">{t('inventory.trackSerialDesc')}</p>
                                </div>
                            </label>
                            <label className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-surface-800/30 rounded-xl cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={wizardState.trackBatches}
                                    onChange={(e) => updateWizardState({ trackBatches: e.target.checked })}
                                    className="w-5 h-5 rounded border-gray-300 text-[var(--accent-primary)]"
                                />
                                <div>
                                    <p className="font-medium text-gray-700 dark:text-surface-300">{t('inventory.trackBatch')}</p>
                                    <p className="text-sm text-gray-500 dark:text-surface-400">{t('inventory.trackBatchDesc')}</p>
                                </div>
                            </label>
                            <label className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-surface-800/30 rounded-xl cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={wizardState.trackExpiry}
                                    onChange={(e) => updateWizardState({ trackExpiry: e.target.checked })}
                                    className="w-5 h-5 rounded border-gray-300 text-[var(--accent-primary)]"
                                />
                                <div>
                                    <p className="font-medium text-gray-700 dark:text-surface-300">{t('inventory.trackExpiry')}</p>
                                    <p className="text-sm text-gray-500 dark:text-surface-400">{t('inventory.trackExpiryDesc')}</p>
                                </div>
                            </label>
                        </div>

                        {/* Thresholds */}
                        <div className="border-t border-gray-200 dark:border-surface-700 pt-6">
                            <h3 className="font-medium text-gray-700 dark:text-surface-300 mb-4">{t('inventory.thresholds')}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label={t('inventory.minStockLevel')}
                                    type="number"
                                    value={wizardState.minStockLevel || ''}
                                    onChange={(e) => updateWizardState({ minStockLevel: Number(e.target.value) })}
                                    placeholder="0"
                                />
                                <Input
                                    label={t('inventory.reorderPoint')}
                                    type="number"
                                    value={wizardState.reorderPoint || ''}
                                    onChange={(e) => updateWizardState({ reorderPoint: Number(e.target.value) })}
                                    placeholder="0"
                                />
                            </div>
                        </div>
                    </div>
                );

            case 6: // Review
                return (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-surface-100">
                                {t('inventory.wizard.review')}
                            </h2>
                            <p className="text-gray-500 dark:text-surface-400 mt-1">{t('inventory.wizard.reviewDesc')}</p>
                        </div>

                        <Card variant="glass" padding="lg">
                            <div className="space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-surface-400">{t('inventory.itemName')}</span>
                                    <span className="font-medium text-gray-900 dark:text-surface-100">{wizardState.name}</span>
                                </div>
                                {wizardState.sku && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500 dark:text-surface-400">{t('inventory.sku')}</span>
                                        <span className="font-mono text-gray-900 dark:text-surface-100">{wizardState.sku}</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-surface-400">{t('inventory.type.label')}</span>
                                    <Badge variant="info">{t(`inventory.type.${wizardState.type}`)}</Badge>
                                </div>

                                <div className="border-t border-gray-200 dark:border-surface-700 pt-4">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500 dark:text-surface-400">{t('inventory.initialQuantity')}</span>
                                        <span className="text-2xl font-bold text-[var(--accent-primary)]">
                      {wizardState.initialQuantity} {wizardState.unit}
                    </span>
                                    </div>
                                </div>

                                {wizardState.locationId && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500 dark:text-surface-400">{t('inventory.location')}</span>
                                        <span className="font-medium text-gray-900 dark:text-surface-100">
                      {locations.find((l) => l.id === wizardState.locationId)?.name}
                    </span>
                                    </div>
                                )}

                                {wizardState.minStockLevel > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500 dark:text-surface-400">{t('inventory.minStockLevel')}</span>
                                        <span className="text-gray-900 dark:text-surface-100">{wizardState.minStockLevel}</span>
                                    </div>
                                )}
                            </div>
                        </Card>

                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                💡 {t('inventory.wizard.tip')}
                            </p>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-surface-900">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white dark:bg-surface-800 border-b border-gray-200 dark:border-surface-700 px-4 py-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-surface-700">
                        <X size={20} className="text-gray-500" />
                    </button>
                    <h1 className="font-semibold text-gray-900 dark:text-surface-100">{t('inventory.wizard.title')}</h1>
                    <div className="w-10" />
                </div>
            </div>

            {/* Steps */}
            <div className="bg-white dark:bg-surface-800 border-b border-gray-200 dark:border-surface-700 px-4 py-3 overflow-x-auto">
                <div className="max-w-4xl mx-auto flex gap-2">
                    {steps.map((step) => {
                        const Icon = step.icon;
                        const isActive = step.id === currentStep;
                        const isCompleted = step.id < currentStep;
                        return (
                            <button
                                key={step.id}
                                onClick={() => step.id < currentStep && setWizardStep(step.id)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                                    isActive ? 'bg-[var(--accent-primary)] text-white' : isCompleted ? 'bg-green-100 dark:bg-green-900/20 text-green-700' : 'bg-gray-100 dark:bg-surface-700 text-gray-400'
                                }`}
                                disabled={step.id > currentStep}
                            >
                                {isCompleted ? <Check size={16} /> : <Icon size={16} />}
                                <span className="hidden sm:inline">{step.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 py-8">
                <AnimatePresence mode="wait">
                    <motion.div key={currentStep} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                        {renderStepContent()}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white dark:bg-surface-800 border-t border-gray-200 dark:border-surface-700 px-4 py-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <Button variant="secondary" leftIcon={<ChevronLeft size={18} />} onClick={goBack} disabled={currentStep === 1}>
                        {t('common.back')}
                    </Button>
                    <div className="flex gap-3">
                        {currentStep === 6 ? (
                            <Button variant="primary" leftIcon={<Check size={18} />} onClick={handleCreate} disabled={!wizardState.name}>
                                {t('inventory.save')}
                            </Button>
                        ) : (
                            <Button variant="primary" rightIcon={<ChevronRight size={18} />} onClick={goNext} disabled={currentStep === 1 && !wizardState.type}>
                                {t('common.next')}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// =============================================================================
// MAIN PAGE
// =============================================================================

export default function InventoryPage() {
    const [showWizard, setShowWizard] = useState(false);
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
    const { resetWizard } = useInventoryStore();

    const handleCreateNew = () => {
        resetWizard();
        setShowWizard(true);
    };

    if (showWizard) {
        return <InventoryWizard onClose={() => setShowWizard(false)} onComplete={() => setShowWizard(false)} />;
    }

    return (
        <InventoryList
            onCreateNew={handleCreateNew}
            onSelectItem={setSelectedItem}
        />
    );
}