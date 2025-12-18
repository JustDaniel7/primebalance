// =============================================================================
// PRIMEBALANCE - FIXED ASSETS STORE (EVENT-SOURCED)
// =============================================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
    Asset,
    AssetBook,
    AssetEvent,
    AssetEventType,
    AssetStatus,
    AssetType,
    AssetCategory,
    DepreciationMethod,
    DepreciationSchedule,
    BookType,
    ImpairmentRecord,
    RevaluationRecord,
    AssetTransfer,
    AssetDisposal,
    CapExBudget,
    CapExItem,
    AssetDashboardState,
    AssetNotification,
    AssetRegisterEntry,
} from '@/types/asset';
import {
    generateDepreciationSchedule,
    calculateBookValue,
    calculateDisposalGainLoss,
    calculateImpairmentLoss,
    calculateCatchUpDepreciation,
    canDepreciate,
    calculateRemainingLife,
} from '@/lib/depreciation-engine';

// =============================================================================
// STORE INTERFACE
// =============================================================================

interface AssetStore {
    // Core Data
    assets: Asset[];
    assetBooks: AssetBook[];
    events: AssetEvent[];
    schedules: DepreciationSchedule[];

    // Records
    impairments: ImpairmentRecord[];
    revaluations: RevaluationRecord[];
    transfers: AssetTransfer[];
    disposals: AssetDisposal[];

    // CapEx
    capExBudgets: CapExBudget[];
    capExItems: CapExItem[];

    // Notifications
    notifications: AssetNotification[];

    // UI State
    dashboardState: AssetDashboardState;

    // Counters
    lastAssetNumber: number;

    // Asset CRUD
    //createAsset: (asset: Omit<Asset, 'id' | 'assetNumber' | 'createdAt' | 'updatedAt' | 'status'>) => string;
    createAsset: (asset: Omit<Asset, 'id' | 'assetNumber' | 'createdAt' | 'updatedAt' | 'status' | 'isActive' | 'isComponent' | 'isLeaseAsset' | 'isCIP'> & { isLeaseAsset?: boolean; isCIP?: boolean; isComponent?: boolean; isActive?: boolean }) => string;
    updateAsset: (id: string, updates: Partial<Asset>, reason?: string) => void;
    getAsset: (id: string) => Asset | undefined;
    getAssetsByStatus: (status: AssetStatus) => Asset[];
    getAssetsByCategory: (category: AssetCategory) => Asset[];
    getAssetsByEntity: (entityId: string) => Asset[];
    getComponentAssets: (parentId: string) => Asset[];

    // Asset Lifecycle
    acquireAsset: (id: string, acquisitionDate: string, acquisitionCost: number, actor: string) => void;
    capitalizeAsset: (id: string, capitalizationDate: string, actor: string) => void;
    putInUse: (id: string, startDate: string, actor: string) => void;
    holdForSale: (id: string, reason: string, actor: string) => void;
    disposeAsset: (id: string, disposal: Omit<AssetDisposal, 'id' | 'eventId'>, actor: string) => void;
    writeOffAsset: (id: string, reason: string, actor: string) => void;

    // Multi-Book
    createAssetBook: (assetId: string, bookType: BookType, overrides?: Partial<AssetBook>) => string;
    updateAssetBook: (id: string, updates: Partial<AssetBook>) => void;
    getAssetBooks: (assetId: string) => AssetBook[];
    getAssetBook: (assetId: string, bookType: BookType) => AssetBook | undefined;

    // Depreciation
    generateSchedule: (assetId: string, bookType: BookType) => DepreciationSchedule;
    postDepreciation: (assetId: string, bookType: BookType, periodDate: string, actor: string) => void;
    postAllDueDepreciation: (periodDate: string, actor: string) => number;
    getSchedule: (assetId: string, bookType: BookType) => DepreciationSchedule | undefined;

    // Impairment & Revaluation
    recordImpairment: (assetId: string, bookType: BookType, recoverableAmount: number, reason: string, actor: string) => void;
    recordRevaluation: (assetId: string, bookType: BookType, fairValue: number, reason: string, actor: string) => void;

    // Transfers
    transferAsset: (transfer: Omit<AssetTransfer, 'id' | 'eventId'>, actor: string) => void;

    // CapEx
    createCapExBudget: (budget: Omit<CapExBudget, 'id' | 'createdAt' | 'updatedAt' | 'committedAmount' | 'spentAmount' | 'remainingAmount'>) => string;
    updateCapExBudget: (id: string, updates: Partial<CapExBudget>) => void;
    addCapExItem: (item: Omit<CapExItem, 'id'>) => string;
    updateCapExItem: (id: string, updates: Partial<CapExItem>) => void;

    // Events
    getAssetEvents: (assetId: string) => AssetEvent[];
    getEventsByType: (eventType: AssetEventType) => AssetEvent[];

    // Reporting
    getAssetRegister: (filters?: Partial<AssetDashboardState['filters']>) => AssetRegisterEntry[];
    calculateTotalNetBookValue: (bookType?: BookType) => number;

    // Notifications
    addNotification: (notification: Omit<AssetNotification, 'id' | 'createdAt'>) => void;
    markNotificationRead: (id: string) => void;
    clearNotifications: () => void;

    // UI State
    setDashboardState: (updates: Partial<AssetDashboardState>) => void;
    setFilters: (filters: Partial<AssetDashboardState['filters']>) => void;
    selectAsset: (id: string | null) => void;

    // Utilities
    generateAssetNumber: () => string;
}

// =============================================================================
// INITIAL STATE
// =============================================================================

const initialDashboardState: AssetDashboardState = {
    activeTab: 'register',
    selectedAssetId: null,
    filters: {
        status: 'ALL',
        category: 'ALL',
        entityId: null,
        costCenterId: null,
        searchQuery: '',
    },
    dateRange: {
        start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0],
    },
    bookType: BookType.STATUTORY,
};

// =============================================================================
// STORE IMPLEMENTATION
// =============================================================================

export const useAssetStore = create<AssetStore>()(
    persist(
        (set, get) => ({
            // Initial State
            assets: [],
            assetBooks: [],
            events: [],
            schedules: [],
            impairments: [],
            revaluations: [],
            transfers: [],
            disposals: [],
            capExBudgets: [],
            capExItems: [],
            notifications: [],
            dashboardState: initialDashboardState,
            lastAssetNumber: 0,

            // =========================================================================
            // ASSET CRUD
            // =========================================================================

            createAsset: (assetData) => {
                const id = `asset-${Date.now()}`;
                const assetNumber = get().generateAssetNumber();
                const now = new Date().toISOString();

                const asset: Asset = {
                    ...assetData,
                    id,
                    assetNumber,
                    status: AssetStatus.PLANNED,
                    isActive: true,
                    isComponent: assetData.parentAssetId ? true : false,
                    isLeaseAsset: assetData.isLeaseAsset ?? false,
                    isCIP: assetData.isCIP ?? false,
                    createdAt: now,
                    updatedAt: now,
                };

                // Create event
                const event: AssetEvent = {
                    id: `event-${Date.now()}`,
                    assetId: id,
                    eventType: AssetEventType.ASSET_CREATED,
                    timestamp: now,
                    actor: 'system',
                    newStatus: AssetStatus.PLANNED,
                    metadata: { assetNumber },
                };

                set((state) => ({
                    assets: [...state.assets, asset],
                    events: [...state.events, event],
                    lastAssetNumber: state.lastAssetNumber + 1,
                }));

                // Auto-create statutory book
                get().createAssetBook(id, BookType.STATUTORY);

                return id;
            },

            updateAsset: (id, updates, reason) => {
                const now = new Date().toISOString();
                const asset = get().assets.find(a => a.id === id);
                if (!asset) return;

                set((state) => ({
                    assets: state.assets.map(a =>
                        a.id === id ? { ...a, ...updates, updatedAt: now } : a
                    ),
                }));

                // Record event for status changes
                if (updates.status && updates.status !== asset.status) {
                    const event: AssetEvent = {
                        id: `event-${Date.now()}`,
                        assetId: id,
                        eventType: AssetEventType.ASSET_TRANSFERRED, // Generic update
                        timestamp: now,
                        actor: 'user',
                        reason,
                        previousStatus: asset.status,
                        newStatus: updates.status,
                    };

                    set((state) => ({
                        events: [...state.events, event],
                    }));
                }
            },

            getAsset: (id) => get().assets.find(a => a.id === id),

            getAssetsByStatus: (status) => get().assets.filter(a => a.status === status),

            getAssetsByCategory: (category) => get().assets.filter(a => a.category === category),

            getAssetsByEntity: (entityId) => get().assets.filter(a => a.legalEntityId === entityId),

            getComponentAssets: (parentId) => get().assets.filter(a => a.parentAssetId === parentId),

            // =========================================================================
            // ASSET LIFECYCLE
            // =========================================================================

            acquireAsset: (id, acquisitionDate, acquisitionCost, actor) => {
                const now = new Date().toISOString();
                const asset = get().assets.find(a => a.id === id);
                if (!asset || asset.status !== AssetStatus.PLANNED) return;

                set((state) => ({
                    assets: state.assets.map(a =>
                        a.id === id ? {
                            ...a,
                            status: AssetStatus.ACQUIRED,
                            acquisitionDate,
                            acquisitionCost,
                            capitalizedCost: acquisitionCost,
                            updatedAt: now,
                        } : a
                    ),
                }));

                // Update books
                get().assetBooks.filter(b => b.assetId === id).forEach(book => {
                    get().updateAssetBook(book.id, { acquisitionCost });
                });

                const event: AssetEvent = {
                    id: `event-${Date.now()}`,
                    assetId: id,
                    eventType: AssetEventType.ASSET_ACQUIRED,
                    timestamp: now,
                    actor,
                    previousStatus: AssetStatus.PLANNED,
                    newStatus: AssetStatus.ACQUIRED,
                    newValue: acquisitionCost,
                };

                set((state) => ({ events: [...state.events, event] }));
            },

            capitalizeAsset: (id, capitalizationDate, actor) => {
                const now = new Date().toISOString();
                const asset = get().assets.find(a => a.id === id);
                if (!asset || asset.status !== AssetStatus.ACQUIRED) return;

                set((state) => ({
                    assets: state.assets.map(a =>
                        a.id === id ? {
                            ...a,
                            status: AssetStatus.CAPITALIZED,
                            depreciationStartDate: capitalizationDate,
                            updatedAt: now,
                        } : a
                    ),
                }));

                const event: AssetEvent = {
                    id: `event-${Date.now()}`,
                    assetId: id,
                    eventType: AssetEventType.ASSET_CAPITALIZED,
                    timestamp: now,
                    actor,
                    previousStatus: AssetStatus.ACQUIRED,
                    newStatus: AssetStatus.CAPITALIZED,
                };

                set((state) => ({ events: [...state.events, event] }));

                // Generate depreciation schedules
                get().assetBooks.filter(b => b.assetId === id).forEach(book => {
                    get().generateSchedule(id, book.bookType);
                });
            },

            putInUse: (id, startDate, actor) => {
                const now = new Date().toISOString();
                const asset = get().assets.find(a => a.id === id);
                if (!asset || asset.status !== AssetStatus.CAPITALIZED) return;

                set((state) => ({
                    assets: state.assets.map(a =>
                        a.id === id ? {
                            ...a,
                            status: AssetStatus.IN_USE,
                            depreciationStartDate: a.depreciationStartDate || startDate,
                            updatedAt: now,
                        } : a
                    ),
                }));

                const event: AssetEvent = {
                    id: `event-${Date.now()}`,
                    assetId: id,
                    eventType: AssetEventType.ASSET_CAPITALIZED,
                    timestamp: now,
                    actor,
                    previousStatus: AssetStatus.CAPITALIZED,
                    newStatus: AssetStatus.IN_USE,
                };

                set((state) => ({ events: [...state.events, event] }));
            },

            holdForSale: (id, reason, actor) => {
                const now = new Date().toISOString();
                const asset = get().assets.find(a => a.id === id);
                if (!asset) return;

                set((state) => ({
                    assets: state.assets.map(a =>
                        a.id === id ? {
                            ...a,
                            status: AssetStatus.HELD_FOR_SALE,
                            updatedAt: now,
                        } : a
                    ),
                }));

                const event: AssetEvent = {
                    id: `event-${Date.now()}`,
                    assetId: id,
                    eventType: AssetEventType.ASSET_HELD_FOR_SALE,
                    timestamp: now,
                    actor,
                    reason,
                    previousStatus: asset.status,
                    newStatus: AssetStatus.HELD_FOR_SALE,
                };

                set((state) => ({ events: [...state.events, event] }));
            },

            disposeAsset: (id, disposalData, actor) => {
                const now = new Date().toISOString();
                const asset = get().assets.find(a => a.id === id);
                if (!asset) return;

                const book = get().getAssetBook(id, BookType.STATUTORY);
                const carryingAmount = book ? calculateBookValue(book) : 0;

                const gainLoss = calculateDisposalGainLoss(
                    carryingAmount,
                    disposalData.salePrice || 0
                );

                const eventId = `event-${Date.now()}`;
                const disposal: AssetDisposal = {
                    id: `disposal-${Date.now()}`,
                    ...disposalData,
                    assetId: id,
                    carryingAmount,
                    accumulatedDepreciation: book?.accumulatedDepreciation || 0,
                    gainOrLoss: gainLoss.amount,
                    isGain: gainLoss.isGain,
                    eventId,
                };

                const newStatus = disposalData.disposalType === 'SALE' ? AssetStatus.SOLD : AssetStatus.DISPOSED;

                set((state) => ({
                    assets: state.assets.map(a =>
                        a.id === id ? {
                            ...a,
                            status: newStatus,
                            isActive: false,
                            disposalDate: disposalData.disposalDate,
                            disposalReason: disposalData.reason,
                            salePrice: disposalData.salePrice,
                            buyerReference: disposalData.buyerReference,
                            updatedAt: now,
                        } : a
                    ),
                    disposals: [...state.disposals, disposal],
                }));

                const event: AssetEvent = {
                    id: eventId,
                    assetId: id,
                    eventType: disposalData.disposalType === 'SALE' ? AssetEventType.ASSET_SOLD : AssetEventType.ASSET_DISPOSED,
                    timestamp: now,
                    actor,
                    reason: disposalData.reason,
                    previousStatus: asset.status,
                    newStatus,
                    previousValue: carryingAmount,
                    newValue: 0,
                    amount: gainLoss.amount,
                    metadata: { isGain: gainLoss.isGain },
                };

                set((state) => ({ events: [...state.events, event] }));

                // Deactivate books
                get().assetBooks.filter(b => b.assetId === id).forEach(book => {
                    get().updateAssetBook(book.id, { isActive: false });
                });
            },

            writeOffAsset: (id, reason, actor) => {
                const now = new Date().toISOString();
                const asset = get().assets.find(a => a.id === id);
                if (!asset) return;

                const book = get().getAssetBook(id, BookType.STATUTORY);
                const carryingAmount = book ? calculateBookValue(book) : 0;

                set((state) => ({
                    assets: state.assets.map(a =>
                        a.id === id ? {
                            ...a,
                            status: AssetStatus.WRITTEN_OFF,
                            isActive: false,
                            disposalDate: now.split('T')[0],
                            disposalReason: reason,
                            updatedAt: now,
                        } : a
                    ),
                }));

                const event: AssetEvent = {
                    id: `event-${Date.now()}`,
                    assetId: id,
                    eventType: AssetEventType.ASSET_WRITTEN_OFF,
                    timestamp: now,
                    actor,
                    reason,
                    previousStatus: asset.status,
                    newStatus: AssetStatus.WRITTEN_OFF,
                    previousValue: carryingAmount,
                    newValue: 0,
                    amount: carryingAmount,
                };

                set((state) => ({ events: [...state.events, event] }));

                // Deactivate books
                get().assetBooks.filter(b => b.assetId === id).forEach(book => {
                    get().updateAssetBook(book.id, { isActive: false, netBookValue: 0 });
                });
            },

            // =========================================================================
            // MULTI-BOOK
            // =========================================================================

            createAssetBook: (assetId, bookType, overrides) => {
                const asset = get().assets.find(a => a.id === assetId);
                if (!asset) return '';

                // Check if book already exists
                const existing = get().assetBooks.find(b => b.assetId === assetId && b.bookType === bookType);
                if (existing) return existing.id;

                const id = `book-${Date.now()}-${bookType}`;
                const book: AssetBook = {
                    id,
                    assetId,
                    bookType,
                    depreciationMethod: overrides?.depreciationMethod || asset.depreciationMethod,
                    usefulLifeMonths: overrides?.usefulLifeMonths || asset.usefulLifeMonths,
                    salvageValue: overrides?.salvageValue || asset.salvageValue,
                    acquisitionCost: overrides?.acquisitionCost || asset.acquisitionCost,
                    accumulatedDepreciation: 0,
                    impairmentLosses: 0,
                    revaluationSurplus: 0,
                    netBookValue: overrides?.acquisitionCost || asset.acquisitionCost,
                    isActive: true,
                    ...overrides,
                };

                set((state) => ({
                    assetBooks: [...state.assetBooks, book],
                }));

                return id;
            },

            updateAssetBook: (id, updates) => {
                set((state) => ({
                    assetBooks: state.assetBooks.map(b =>
                        b.id === id ? { ...b, ...updates, netBookValue: calculateBookValue({ ...b, ...updates }) } : b
                    ),
                }));
            },

            getAssetBooks: (assetId) => get().assetBooks.filter(b => b.assetId === assetId),

            getAssetBook: (assetId, bookType) =>
                get().assetBooks.find(b => b.assetId === assetId && b.bookType === bookType),

            // =========================================================================
            // DEPRECIATION
            // =========================================================================

            generateSchedule: (assetId, bookType) => {
                const asset = get().assets.find(a => a.id === assetId);
                const book = get().getAssetBook(assetId, bookType);

                if (!asset || !book) {
                    return { assetId, bookType, entries: [], totalDepreciation: 0, totalPeriods: 0, generatedAt: new Date().toISOString() };
                }

                const schedule = generateDepreciationSchedule(asset, book);

                // Remove existing schedule and add new one
                set((state) => ({
                    schedules: [
                        ...state.schedules.filter(s => !(s.assetId === assetId && s.bookType === bookType)),
                        schedule,
                    ],
                }));

                return schedule;
            },

            postDepreciation: (assetId, bookType, periodDate, actor) => {
                const schedule = get().getSchedule(assetId, bookType);
                const book = get().getAssetBook(assetId, bookType);
                const asset = get().assets.find(a => a.id === assetId);

                if (!schedule || !book || !asset || !canDepreciate(asset)) return;

                const now = new Date().toISOString();
                const entry = schedule.entries.find(e =>
                    !e.isPosted && new Date(e.periodEndDate) <= new Date(periodDate)
                );

                if (!entry) return;

                // Update schedule entry
                const updatedSchedule: DepreciationSchedule = {
                    ...schedule,
                    entries: schedule.entries.map(e =>
                        e.id === entry.id ? { ...e, isPosted: true, postedAt: now } : e
                    ),
                };

                set((state) => ({
                    schedules: state.schedules.map(s =>
                        s.assetId === assetId && s.bookType === bookType ? updatedSchedule : s
                    ),
                }));

                // Update book
                const newAccumulated = book.accumulatedDepreciation + entry.depreciationAmount;
                get().updateAssetBook(book.id, {
                    accumulatedDepreciation: newAccumulated,
                    lastDepreciationDate: periodDate,
                });

                // Check if fully depreciated
                if (entry.closingBookValue <= book.salvageValue) {
                    get().updateAsset(assetId, { status: AssetStatus.FULLY_DEPRECIATED });
                }

                // Record event
                const event: AssetEvent = {
                    id: `event-${Date.now()}`,
                    assetId,
                    eventType: AssetEventType.DEPRECIATION_POSTED,
                    timestamp: now,
                    actor,
                    amount: entry.depreciationAmount,
                    metadata: { periodNumber: entry.periodNumber, bookType },
                };

                set((state) => ({ events: [...state.events, event] }));
            },

            postAllDueDepreciation: (periodDate, actor) => {
                let count = 0;
                const assets = get().assets.filter(a => canDepreciate(a));

                assets.forEach(asset => {
                    get().assetBooks.filter(b => b.assetId === asset.id && b.isActive).forEach(book => {
                        const schedule = get().getSchedule(asset.id, book.bookType);
                        if (!schedule) return;

                        const dueEntries = schedule.entries.filter(e =>
                            !e.isPosted && new Date(e.periodEndDate) <= new Date(periodDate)
                        );

                        dueEntries.forEach(() => {
                            get().postDepreciation(asset.id, book.bookType, periodDate, actor);
                            count++;
                        });
                    });
                });

                return count;
            },

            getSchedule: (assetId, bookType) =>
                get().schedules.find(s => s.assetId === assetId && s.bookType === bookType),

            // =========================================================================
            // IMPAIRMENT & REVALUATION
            // =========================================================================

            recordImpairment: (assetId, bookType, recoverableAmount, reason, actor) => {
                const book = get().getAssetBook(assetId, bookType);
                const asset = get().assets.find(a => a.id === assetId);
                if (!book || !asset) return;

                const now = new Date().toISOString();
                const carryingAmount = calculateBookValue(book);
                const impairmentLoss = calculateImpairmentLoss(carryingAmount, recoverableAmount);

                if (impairmentLoss === 0) return;

                const eventId = `event-${Date.now()}`;
                const record: ImpairmentRecord = {
                    id: `impairment-${Date.now()}`,
                    assetId,
                    bookType,
                    impairmentDate: now.split('T')[0],
                    previousCarryingAmount: carryingAmount,
                    recoverableAmount,
                    impairmentLoss,
                    reason,
                    eventId,
                };

                set((state) => ({
                    impairments: [...state.impairments, record],
                }));

                // Update book
                get().updateAssetBook(book.id, {
                    impairmentLosses: book.impairmentLosses + impairmentLoss,
                });

                // Update asset status
                get().updateAsset(assetId, { status: AssetStatus.IMPAIRED });

                // Record event
                const event: AssetEvent = {
                    id: eventId,
                    assetId,
                    eventType: AssetEventType.IMPAIRMENT_RECORDED,
                    timestamp: now,
                    actor,
                    reason,
                    previousValue: carryingAmount,
                    newValue: recoverableAmount,
                    amount: impairmentLoss,
                };

                set((state) => ({ events: [...state.events, event] }));

                // Regenerate schedule with new values
                get().generateSchedule(assetId, bookType);
            },

            recordRevaluation: (assetId, bookType, fairValue, reason, actor) => {
                const book = get().getAssetBook(assetId, bookType);
                const asset = get().assets.find(a => a.id === assetId);
                if (!book || !asset) return;

                const now = new Date().toISOString();
                const carryingAmount = calculateBookValue(book);
                const revaluationAmount = fairValue - carryingAmount;
                const isIncrease = revaluationAmount > 0;

                const eventId = `event-${Date.now()}`;
                const record: RevaluationRecord = {
                    id: `revaluation-${Date.now()}`,
                    assetId,
                    bookType,
                    revaluationDate: now.split('T')[0],
                    previousCarryingAmount: carryingAmount,
                    fairValue,
                    revaluationAmount: Math.abs(revaluationAmount),
                    isIncrease,
                    reason,
                    eventId,
                };

                set((state) => ({
                    revaluations: [...state.revaluations, record],
                }));

                // Update book
                if (isIncrease) {
                    get().updateAssetBook(book.id, {
                        revaluationSurplus: book.revaluationSurplus + revaluationAmount,
                    });
                } else {
                    // Decrease goes against existing surplus first, then P&L
                    const surplusReduction = Math.min(book.revaluationSurplus, Math.abs(revaluationAmount));
                    get().updateAssetBook(book.id, {
                        revaluationSurplus: book.revaluationSurplus - surplusReduction,
                        impairmentLosses: book.impairmentLosses + (Math.abs(revaluationAmount) - surplusReduction),
                    });
                }

                // Record event
                const event: AssetEvent = {
                    id: eventId,
                    assetId,
                    eventType: AssetEventType.REVALUATION_RECORDED,
                    timestamp: now,
                    actor,
                    reason,
                    previousValue: carryingAmount,
                    newValue: fairValue,
                    amount: Math.abs(revaluationAmount),
                    metadata: { isIncrease },
                };

                set((state) => ({ events: [...state.events, event] }));
            },

            // =========================================================================
            // TRANSFERS
            // =========================================================================

            transferAsset: (transferData, actor) => {
                const asset = get().assets.find(a => a.id === transferData.assetId);
                if (!asset) return;

                const now = new Date().toISOString();
                const eventId = `event-${Date.now()}`;

                const transfer: AssetTransfer = {
                    id: `transfer-${Date.now()}`,
                    ...transferData,
                    eventId,
                };

                // Update asset with new assignments
                const updates: Partial<Asset> = { updatedAt: now };
                if (transferData.toEntityId) updates.legalEntityId = transferData.toEntityId;
                if (transferData.toCostCenterId) updates.costCenterId = transferData.toCostCenterId;
                if (transferData.toLocation) updates.location = transferData.toLocation;
                if (transferData.toResponsibleParty) updates.responsibleParty = transferData.toResponsibleParty;

                set((state) => ({
                    assets: state.assets.map(a => a.id === transferData.assetId ? { ...a, ...updates } : a),
                    transfers: [...state.transfers, transfer],
                }));

                // Record event
                const event: AssetEvent = {
                    id: eventId,
                    assetId: transferData.assetId,
                    eventType: AssetEventType.ASSET_TRANSFERRED,
                    timestamp: now,
                    actor,
                    reason: transferData.reason,
                    fromEntityId: transferData.fromEntityId,
                    toEntityId: transferData.toEntityId,
                    fromCostCenterId: transferData.fromCostCenterId,
                    toCostCenterId: transferData.toCostCenterId,
                    fromLocation: transferData.fromLocation,
                    toLocation: transferData.toLocation,
                };

                set((state) => ({ events: [...state.events, event] }));
            },

            // =========================================================================
            // CAPEX
            // =========================================================================

            createCapExBudget: (budgetData) => {
                const id = `capex-budget-${Date.now()}`;
                const now = new Date().toISOString();

                const budget: CapExBudget = {
                    ...budgetData,
                    id,
                    committedAmount: 0,
                    spentAmount: 0,
                    remainingAmount: budgetData.budgetAmount,
                    createdAt: now,
                    updatedAt: now,
                };

                set((state) => ({
                    capExBudgets: [...state.capExBudgets, budget],
                }));

                return id;
            },

            updateCapExBudget: (id, updates) => {
                set((state) => ({
                    capExBudgets: state.capExBudgets.map(b => {
                        if (b.id !== id) return b;
                        const updated = { ...b, ...updates, updatedAt: new Date().toISOString() };
                        updated.remainingAmount = updated.budgetAmount - updated.committedAmount - updated.spentAmount;
                        return updated;
                    }),
                }));
            },

            addCapExItem: (itemData) => {
                const id = `capex-item-${Date.now()}`;
                const item: CapExItem = { ...itemData, id };

                set((state) => ({
                    capExItems: [...state.capExItems, item],
                }));

                // Update budget if committed or spent
                if (itemData.status === 'COMMITTED' || itemData.status === 'SPENT') {
                    const budget = get().capExBudgets.find(b => b.id === itemData.budgetId);
                    if (budget) {
                        const amount = itemData.actualAmount || itemData.estimatedAmount;
                        get().updateCapExBudget(budget.id, {
                            committedAmount: itemData.status === 'COMMITTED' ? budget.committedAmount + amount : budget.committedAmount,
                            spentAmount: itemData.status === 'SPENT' ? budget.spentAmount + amount : budget.spentAmount,
                        });
                    }
                }

                return id;
            },

            updateCapExItem: (id, updates) => {
                set((state) => ({
                    capExItems: state.capExItems.map(i => i.id === id ? { ...i, ...updates } : i),
                }));
            },

            // =========================================================================
            // EVENTS
            // =========================================================================

            getAssetEvents: (assetId) =>
                get().events.filter(e => e.assetId === assetId).sort((a, b) =>
                    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                ),

            getEventsByType: (eventType) => get().events.filter(e => e.eventType === eventType),

            // =========================================================================
            // REPORTING
            // =========================================================================

            getAssetRegister: (filters) => {
                const { assets, assetBooks, dashboardState } = get();
                const activeFilters = filters || dashboardState.filters;
                const bookType = dashboardState.bookType;

                return assets
                    .filter(asset => {
                        if (activeFilters.status !== 'ALL' && asset.status !== activeFilters.status) return false;
                        if (activeFilters.category !== 'ALL' && asset.category !== activeFilters.category) return false;
                        if (activeFilters.entityId && asset.legalEntityId !== activeFilters.entityId) return false;
                        if (activeFilters.costCenterId && asset.costCenterId !== activeFilters.costCenterId) return false;
                        if (activeFilters.searchQuery) {
                            const query = activeFilters.searchQuery.toLowerCase();
                            return (
                                asset.name.toLowerCase().includes(query) ||
                                asset.assetNumber.toLowerCase().includes(query) ||
                                asset.description?.toLowerCase().includes(query)
                            );
                        }
                        return true;
                    })
                    .map(asset => {
                        const book = assetBooks.find(b => b.assetId === asset.id && b.bookType === bookType);
                        const netBookValue = book ? calculateBookValue(book) : asset.capitalizedCost;
                        const depreciableBase = (book?.acquisitionCost || asset.acquisitionCost) - (book?.salvageValue || asset.salvageValue);
                        const percentDepreciated = depreciableBase > 0 ? ((book?.accumulatedDepreciation || 0) / depreciableBase) * 100 : 0;

                        return {
                            asset,
                            acquisitionCost: book?.acquisitionCost || asset.acquisitionCost,
                            accumulatedDepreciation: book?.accumulatedDepreciation || 0,
                            impairmentLosses: book?.impairmentLosses || 0,
                            netBookValue,
                            monthlyDepreciation: depreciableBase / (book?.usefulLifeMonths || asset.usefulLifeMonths),
                            remainingLifeMonths: calculateRemainingLife(
                                book?.usefulLifeMonths || asset.usefulLifeMonths,
                                book?.accumulatedDepreciation || 0,
                                depreciableBase
                            ),
                            percentDepreciated,
                        };
                    });
            },

            calculateTotalNetBookValue: (bookType = BookType.STATUTORY) => {
                return get().assetBooks
                    .filter(b => b.bookType === bookType && b.isActive)
                    .reduce((sum, book) => sum + calculateBookValue(book), 0);
            },

            // =========================================================================
            // NOTIFICATIONS
            // =========================================================================

            addNotification: (notificationData) => {
                const notification: AssetNotification = {
                    ...notificationData,
                    id: `notification-${Date.now()}`,
                    createdAt: new Date().toISOString(),
                };

                set((state) => ({
                    notifications: [...state.notifications, notification],
                }));
            },

            markNotificationRead: (id) => {
                set((state) => ({
                    notifications: state.notifications.map(n =>
                        n.id === id ? { ...n, readAt: new Date().toISOString() } : n
                    ),
                }));
            },

            clearNotifications: () => {
                set({ notifications: [] });
            },

            // =========================================================================
            // UI STATE
            // =========================================================================

            setDashboardState: (updates) => {
                set((state) => ({
                    dashboardState: { ...state.dashboardState, ...updates },
                }));
            },

            setFilters: (filters) => {
                set((state) => ({
                    dashboardState: {
                        ...state.dashboardState,
                        filters: { ...state.dashboardState.filters, ...filters },
                    },
                }));
            },

            selectAsset: (id) => {
                set((state) => ({
                    dashboardState: { ...state.dashboardState, selectedAssetId: id },
                }));
            },

            // =========================================================================
            // UTILITIES
            // =========================================================================

            generateAssetNumber: () => {
                const year = new Date().getFullYear();
                const nextNum = get().lastAssetNumber + 1;
                return `FA-${year}-${String(nextNum).padStart(5, '0')}`;
            },
        }),
        {
            name: 'primebalance-assets',
        }
    )
);

// =============================================================================
// DEMO DATA INITIALIZER
// =============================================================================

export function initializeDemoAssetData() {
    const store = useAssetStore.getState();

    // Only initialize if empty
    if (store.assets.length > 0) return;

    // Create demo assets
    const officeEquipmentId = store.createAsset({
        name: 'Office Furniture Set',
        description: 'Executive desk, chairs, and filing cabinets for main office',
        assetType: AssetType.TANGIBLE,
        category: AssetCategory.FURNITURE,
        currency: 'EUR',
        acquisitionCost: 15000,
        capitalizedCost: 15000,
        salvageValue: 1500,
        usefulLifeMonths: 60,
        depreciationMethod: DepreciationMethod.STRAIGHT_LINE,
        legalEntityId: 'entity-1',
        location: 'HQ Floor 3',
        responsibleParty: 'Office Manager',
    });

    store.acquireAsset(officeEquipmentId, '2024-01-15', 15000, 'admin');
    store.capitalizeAsset(officeEquipmentId, '2024-02-01', 'admin');
    store.putInUse(officeEquipmentId, '2024-02-01', 'admin');

    const vehicleId = store.createAsset({
        name: 'Company Vehicle - BMW 320d',
        description: 'Company car for sales team',
        assetType: AssetType.TANGIBLE,
        category: AssetCategory.VEHICLES,
        currency: 'EUR',
        acquisitionCost: 45000,
        capitalizedCost: 45000,
        salvageValue: 12000,
        usefulLifeMonths: 48,
        depreciationMethod: DepreciationMethod.DECLINING_BALANCE,
        legalEntityId: 'entity-1',
        location: 'HQ Parking',
        responsibleParty: 'Fleet Manager',
    });

    store.acquireAsset(vehicleId, '2024-03-01', 45000, 'admin');
    store.capitalizeAsset(vehicleId, '2024-03-15', 'admin');
    store.putInUse(vehicleId, '2024-03-15', 'admin');

    const softwareId = store.createAsset({
        name: 'ERP System License',
        description: 'Enterprise resource planning software - 5 year license',
        assetType: AssetType.INTANGIBLE,
        category: AssetCategory.CAPITALIZED_SOFTWARE,
        currency: 'EUR',
        acquisitionCost: 120000,
        capitalizedCost: 120000,
        salvageValue: 0,
        usefulLifeMonths: 60,
        depreciationMethod: DepreciationMethod.STRAIGHT_LINE,
        legalEntityId: 'entity-1',
    });

    store.acquireAsset(softwareId, '2024-01-01', 120000, 'admin');
    store.capitalizeAsset(softwareId, '2024-01-01', 'admin');
    store.putInUse(softwareId, '2024-01-01', 'admin');

    // Create a CIP asset
    store.createAsset({
        name: 'New Production Line',
        description: 'Automated manufacturing equipment - under construction',
        assetType: AssetType.TANGIBLE,
        category: AssetCategory.CONSTRUCTION_IN_PROGRESS,
        currency: 'EUR',
        acquisitionCost: 0,
        capitalizedCost: 0,
        salvageValue: 50000,
        usefulLifeMonths: 120,
        depreciationMethod: DepreciationMethod.STRAIGHT_LINE,
        isCIP: true,
        cipStartDate: '2024-06-01',
        legalEntityId: 'entity-1',
    });

    // Create CapEx budget
    store.createCapExBudget({
        name: 'FY2025 Capital Expenditure',
        fiscalYear: '2025',
        budgetAmount: 500000,
        currency: 'EUR',
    });

    // Add notification
    store.addNotification({
        type: 'WARNING',
        category: 'DEPRECIATION',
        title: 'Depreciation Due',
        message: '3 assets have depreciation entries pending for December 2024',
        actionRequired: true,
        dueDate: '2024-12-31',
    });
}