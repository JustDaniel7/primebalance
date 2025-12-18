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
    DepreciationScheduleEntry,
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

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function calculateBookValue(book: AssetBook): number {
    return (
        book.acquisitionCost -
        book.accumulatedDepreciation -
        book.impairmentLosses +
        book.revaluationSurplus
    );
}

function calculateMonthlyDepreciation(
    method: DepreciationMethod,
    acquisitionCost: number,
    salvageValue: number,
    usefulLifeMonths: number,
    currentMonth: number,
    openingBookValue: number
): number {
    const depreciableBase = acquisitionCost - salvageValue;

    if (openingBookValue <= salvageValue) {
        return 0;
    }

    switch (method) {
        case DepreciationMethod.STRAIGHT_LINE:
            return depreciableBase / usefulLifeMonths;

        case DepreciationMethod.DECLINING_BALANCE:
            const dbRate = 1 / (usefulLifeMonths / 12);
            return openingBookValue * (dbRate / 12);

        case DepreciationMethod.DOUBLE_DECLINING_BALANCE:
            const ddbRate = (2 / (usefulLifeMonths / 12)) / 12;
            return openingBookValue * ddbRate;

        default:
            return depreciableBase / usefulLifeMonths;
    }
}

function mapApiToAsset(api: any): Asset {
    return {
        id: api.id,
        assetNumber: api.assetNumber || `AST-${api.id.slice(-5)}`,
        name: api.name,
        description: api.description,
        assetType: api.assetType || AssetType.TANGIBLE,
        category: api.category || AssetCategory.IT_EQUIPMENT,
        internalReference: api.internalReference,
        legalEntityId: api.legalEntityId || api.organizationId,
        costCenterId: api.costCenterId,
        projectId: api.projectId,
        location: api.location,
        responsibleParty: api.responsibleParty,
        currency: api.currency || 'EUR',
        acquisitionCost: Number(api.acquisitionCost) || Number(api.capitalizedCost) || 0,
        capitalizedCost: Number(api.capitalizedCost) || Number(api.acquisitionCost) || 0,
        salvageValue: Number(api.salvageValue) || Number(api.residualValue) || 0,
        usefulLifeMonths: Number(api.usefulLifeMonths) || 36,
        depreciationMethod: api.depreciationMethod || DepreciationMethod.STRAIGHT_LINE,
        depreciationStartDate: api.depreciationStartDate?.split('T')[0],
        totalUnits: api.totalUnits,
        unitsProduced: api.unitsProduced,
        customFormula: api.customFormula,
        status: api.status || AssetStatus.PLANNED,
        isActive: api.isActive ?? true,
        parentAssetId: api.parentAssetId,
        isComponent: api.isComponent || false,
        supplierId: api.supplierId,
        supplierInvoiceId: api.supplierInvoiceId,
        purchaseOrderId: api.purchaseOrderId,
        acquisitionDate: api.acquisitionDate?.split('T')[0],
        disposalDate: api.disposalDate?.split('T')[0],
        disposalReason: api.disposalReason,
        salePrice: api.salePrice,
        buyerReference: api.buyerReference,
        isLeaseAsset: api.isLeaseAsset || api.acquisitionType === 'lease',
        leaseId: api.leaseId,
        isCIP: api.isCIP || api.status === AssetStatus.PLANNED,
        cipStartDate: api.cipStartDate?.split('T')[0],
        cipCompletionDate: api.cipCompletionDate?.split('T')[0],
        tags: api.tags || [],
        notes: api.notes,
        attachments: api.attachments || [],
        createdAt: api.createdAt,
        updatedAt: api.updatedAt,
    };
}

// =============================================================================
// STORE INTERFACE
// =============================================================================

interface AssetStore {
    assets: Asset[];
    assetBooks: AssetBook[];
    events: AssetEvent[];
    schedules: DepreciationSchedule[];
    impairments: ImpairmentRecord[];
    revaluations: RevaluationRecord[];
    transfers: AssetTransfer[];
    disposals: AssetDisposal[];
    capExBudgets: CapExBudget[];
    capExItems: CapExItem[];
    notifications: AssetNotification[];
    dashboardState: AssetDashboardState;
    lastAssetNumber: number;
    isLoading: boolean;
    error: string | null;
    isInitialized: boolean;

    // API
    fetchAssets: () => Promise<void>;

    // Asset CRUD
    createAsset: (asset: Omit<Asset, 'id' | 'assetNumber' | 'createdAt' | 'updatedAt' | 'status' | 'isActive' | 'isComponent' | 'isLeaseAsset' | 'isCIP'> & {
        isLeaseAsset?: boolean;
        isCIP?: boolean;
        isComponent?: boolean;
        isActive?: boolean;
    }) => string;
    updateAsset: (id: string, updates: Partial<Asset>, reason?: string) => void;
    deleteAsset: (id: string) => void;
    getAsset: (id: string) => Asset | undefined;
    getAssetsByStatus: (status: AssetStatus) => Asset[];
    getAssetsByCategory: (category: AssetCategory) => Asset[];

    // Lifecycle
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
    runDepreciation: (assetId: string, bookType: BookType, periodDate: string, actor: string) => void;
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
    recordEvent: (event: Omit<AssetEvent, 'id' | 'timestamp'>) => AssetEvent;
    getAssetEvents: (assetId: string) => AssetEvent[];

    // UI State
    setDashboardState: (state: Partial<AssetDashboardState>) => void;
    addNotification: (notification: Omit<AssetNotification, 'id' | 'createdAt'>) => void;
    markNotificationRead: (id: string) => void;

    // Analytics
    getSummary: () => {
        totalAssets: number;
        totalValue: number;
        totalDepreciation: number;
        netBookValue: number;
        byStatus: Record<AssetStatus, number>;
        byCategory: Record<AssetCategory, number>;
    };
    getAssetRegister: () => AssetRegisterEntry[];
    calculateTotalNetBookValue: (bookType?: BookType) => number;
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
            isLoading: false,
            error: null,
            isInitialized: false,

            // =================================================================
            // API
            // =================================================================

            fetchAssets: async () => {
                set({ isLoading: true, error: null });
                try {
                    const response = await fetch('/api/assets');
                    if (!response.ok) throw new Error('Failed to fetch assets');
                    const data = await response.json();
                    const assets = (data.assets || data || []).map(mapApiToAsset);
                    set({ assets, isLoading: false, isInitialized: true });
                } catch (error) {
                    console.error('Failed to fetch assets:', error);
                    set({ error: (error as Error).message, isLoading: false, isInitialized: true });
                }
            },

            // =================================================================
            // ASSET CRUD
            // =================================================================

            createAsset: (assetData) => {
                const now = new Date().toISOString();
                const newNumber = get().lastAssetNumber + 1;
                const id = `ast-${Date.now()}`;

                const newAsset: Asset = {
                    ...assetData,
                    id,
                    assetNumber: `AST-${String(newNumber).padStart(5, '0')}`,
                    status: assetData.isCIP ? AssetStatus.PLANNED : AssetStatus.PLANNED,
                    isActive: assetData.isActive ?? true,
                    isComponent: assetData.isComponent ?? false,
                    isLeaseAsset: assetData.isLeaseAsset ?? false,
                    isCIP: assetData.isCIP ?? false,
                    createdAt: now,
                    updatedAt: now,
                };

                set((state) => ({
                    assets: [...state.assets, newAsset],
                    lastAssetNumber: newNumber,
                }));

                // Create statutory book automatically
                get().createAssetBook(id, BookType.STATUTORY);

                // Record event
                get().recordEvent({
                    assetId: id,
                    eventType: AssetEventType.ASSET_CREATED,
                    actor: 'user',
                    newStatus: AssetStatus.PLANNED,
                    newValue: assetData.acquisitionCost,
                });

                // Background API sync
                fetch('/api/assets', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(assetData),
                }).catch(console.error);

                return id;
            },

            updateAsset: (id, updates, reason) => {
                const asset = get().assets.find((a) => a.id === id);
                if (!asset) return;

                set((state) => ({
                    assets: state.assets.map((a) =>
                        a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a
                    ),
                }));

                get().recordEvent({
                    assetId: id,
                    eventType: AssetEventType.ASSET_CREATED, // Using ASSET_CREATED as generic modification
                    actor: 'user',
                    reason,
                    previousStatus: asset.status,
                    newStatus: updates.status || asset.status,
                });

                fetch(`/api/assets/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updates),
                }).catch(console.error);
            },

            deleteAsset: (id) => {
                set((state) => ({
                    assets: state.assets.filter((a) => a.id !== id),
                    assetBooks: state.assetBooks.filter((b) => b.assetId !== id),
                    events: state.events.filter((e) => e.assetId !== id),
                }));

                fetch(`/api/assets/${id}`, { method: 'DELETE' }).catch(console.error);
            },

            getAsset: (id) => get().assets.find((a) => a.id === id),

            getAssetsByStatus: (status) => get().assets.filter((a) => a.status === status),

            getAssetsByCategory: (category) => get().assets.filter((a) => a.category === category),

            // =================================================================
            // LIFECYCLE
            // =================================================================

            acquireAsset: (id, acquisitionDate, acquisitionCost, actor) => {
                const asset = get().assets.find((a) => a.id === id);
                if (!asset) return;

                get().updateAsset(id, {
                    status: AssetStatus.ACQUIRED,
                    acquisitionDate,
                    acquisitionCost,
                    capitalizedCost: acquisitionCost,
                });

                get().recordEvent({
                    assetId: id,
                    eventType: AssetEventType.ASSET_ACQUIRED,
                    actor,
                    previousStatus: asset.status,
                    newStatus: AssetStatus.ACQUIRED,
                    newValue: acquisitionCost,
                });

                // Update statutory book
                const book = get().getAssetBook(id, BookType.STATUTORY);
                if (book) {
                    get().updateAssetBook(book.id, {
                        acquisitionCost,
                        netBookValue: acquisitionCost,
                    });
                }
            },

            capitalizeAsset: (id, capitalizationDate, actor) => {
                const asset = get().assets.find((a) => a.id === id);
                if (!asset) return;

                get().updateAsset(id, {
                    status: AssetStatus.CAPITALIZED,
                    depreciationStartDate: capitalizationDate,
                    isCIP: false,
                    cipCompletionDate: capitalizationDate,
                });

                get().recordEvent({
                    assetId: id,
                    eventType: AssetEventType.ASSET_CAPITALIZED,
                    actor,
                    previousStatus: asset.status,
                    newStatus: AssetStatus.CAPITALIZED,
                });
            },

            putInUse: (id, startDate, actor) => {
                const asset = get().assets.find((a) => a.id === id);
                if (!asset) return;

                get().updateAsset(id, {
                    status: AssetStatus.IN_USE,
                    depreciationStartDate: asset.depreciationStartDate || startDate,
                });

                get().recordEvent({
                    assetId: id,
                    eventType: AssetEventType.ASSET_CAPITALIZED,
                    actor,
                    previousStatus: asset.status,
                    newStatus: AssetStatus.IN_USE,
                });
            },

            holdForSale: (id, reason, actor) => {
                const asset = get().assets.find((a) => a.id === id);
                if (!asset) return;

                get().updateAsset(id, {
                    status: AssetStatus.HELD_FOR_SALE,
                });

                get().recordEvent({
                    assetId: id,
                    eventType: AssetEventType.ASSET_HELD_FOR_SALE,
                    actor,
                    reason,
                    previousStatus: asset.status,
                    newStatus: AssetStatus.HELD_FOR_SALE,
                });
            },

            disposeAsset: (id, disposal, actor) => {
                const asset = get().assets.find((a) => a.id === id);
                if (!asset) return;

                const book = get().getAssetBook(id, BookType.STATUTORY);
                const carryingAmount = book ? calculateBookValue(book) : asset.capitalizedCost;
                const gainOrLoss = (disposal.salePrice || 0) - carryingAmount;

                const eventId = `evt-${Date.now()}`;
                const disposalRecord: AssetDisposal = {
                    ...disposal,
                    id: `disp-${Date.now()}`,
                    assetId: id,
                    carryingAmount,
                    accumulatedDepreciation: book?.accumulatedDepreciation || 0,
                    gainOrLoss,
                    isGain: gainOrLoss >= 0,
                    eventId,
                };

                set((state) => ({
                    disposals: [...state.disposals, disposalRecord],
                }));

                get().updateAsset(id, {
                    status: disposal.disposalType === 'SALE' ? AssetStatus.SOLD : AssetStatus.DISPOSED,
                    isActive: false,
                    disposalDate: disposal.disposalDate,
                    disposalReason: disposal.reason,
                    salePrice: disposal.salePrice,
                    buyerReference: disposal.buyerReference,
                });

                get().recordEvent({
                    assetId: id,
                    eventType: disposal.disposalType === 'SALE' ? AssetEventType.ASSET_SOLD : AssetEventType.ASSET_DISPOSED,
                    actor,
                    reason: disposal.reason,
                    previousStatus: asset.status,
                    newStatus: disposal.disposalType === 'SALE' ? AssetStatus.SOLD : AssetStatus.DISPOSED,
                    previousValue: carryingAmount,
                    newValue: 0,
                    amount: gainOrLoss,
                });
            },

            writeOffAsset: (id, reason, actor) => {
                const asset = get().assets.find((a) => a.id === id);
                if (!asset) return;

                const book = get().getAssetBook(id, BookType.STATUTORY);
                const carryingAmount = book ? calculateBookValue(book) : asset.capitalizedCost;

                get().updateAsset(id, {
                    status: AssetStatus.WRITTEN_OFF,
                    isActive: false,
                    disposalDate: new Date().toISOString().split('T')[0],
                    disposalReason: reason,
                });

                if (book) {
                    get().updateAssetBook(book.id, {
                        isActive: false,
                        netBookValue: 0,
                    });
                }

                get().recordEvent({
                    assetId: id,
                    eventType: AssetEventType.ASSET_WRITTEN_OFF,
                    actor,
                    reason,
                    previousStatus: asset.status,
                    newStatus: AssetStatus.WRITTEN_OFF,
                    previousValue: carryingAmount,
                    newValue: 0,
                    amount: carryingAmount,
                });
            },

            // =================================================================
            // MULTI-BOOK
            // =================================================================

            createAssetBook: (assetId, bookType, overrides) => {
                const asset = get().assets.find((a) => a.id === assetId);
                if (!asset) return '';

                // Check if book exists
                const existing = get().assetBooks.find(
                    (b) => b.assetId === assetId && b.bookType === bookType
                );
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
                    assetBooks: state.assetBooks.map((b) => {
                        if (b.id !== id) return b;
                        const updated = { ...b, ...updates };
                        updated.netBookValue = calculateBookValue(updated);
                        return updated;
                    }),
                }));
            },

            getAssetBooks: (assetId) => get().assetBooks.filter((b) => b.assetId === assetId),

            getAssetBook: (assetId, bookType) =>
                get().assetBooks.find((b) => b.assetId === assetId && b.bookType === bookType),

            // =================================================================
            // DEPRECIATION
            // =================================================================

            generateSchedule: (assetId, bookType) => {
                const asset = get().assets.find((a) => a.id === assetId);
                const book = get().getAssetBook(assetId, bookType);

                if (!asset || !book) {
                    return {
                        assetId,
                        bookType,
                        entries: [],
                        totalDepreciation: 0,
                        totalPeriods: 0,
                        generatedAt: new Date().toISOString(),
                    };
                }

                const entries: DepreciationScheduleEntry[] = [];
                let openingValue = book.acquisitionCost;
                let accumulatedDep = 0;

                for (let i = 1; i <= book.usefulLifeMonths; i++) {
                    const depAmount = calculateMonthlyDepreciation(
                        book.depreciationMethod,
                        book.acquisitionCost,
                        book.salvageValue,
                        book.usefulLifeMonths,
                        i,
                        openingValue
                    );

                    accumulatedDep += depAmount;
                    const closingValue = Math.max(book.salvageValue, openingValue - depAmount);

                    const startDate = new Date(asset.depreciationStartDate || asset.createdAt);
                    startDate.setMonth(startDate.getMonth() + i - 1);
                    const endDate = new Date(startDate);
                    endDate.setMonth(endDate.getMonth() + 1);
                    endDate.setDate(endDate.getDate() - 1);

                    entries.push({
                        id: `sched-${assetId}-${bookType}-${i}`,
                        assetId,
                        bookType,
                        periodNumber: i,
                        periodStartDate: startDate.toISOString().split('T')[0],
                        periodEndDate: endDate.toISOString().split('T')[0],
                        openingBookValue: openingValue,
                        depreciationAmount: depAmount,
                        accumulatedDepreciation: accumulatedDep,
                        closingBookValue: closingValue,
                        isPosted: false,
                    });

                    openingValue = closingValue;
                    if (openingValue <= book.salvageValue) break;
                }

                const schedule: DepreciationSchedule = {
                    assetId,
                    bookType,
                    entries,
                    totalDepreciation: accumulatedDep,
                    totalPeriods: entries.length,
                    generatedAt: new Date().toISOString(),
                };

                // Store schedule
                set((state) => ({
                    schedules: [
                        ...state.schedules.filter(
                            (s) => !(s.assetId === assetId && s.bookType === bookType)
                        ),
                        schedule,
                    ],
                }));

                return schedule;
            },

            postDepreciation: (assetId, bookType, periodDate, actor) => {
                get().runDepreciation(assetId, bookType, periodDate, actor);
            },

            runDepreciation: (assetId, bookType, periodDate, actor) => {
                const book = get().getAssetBook(assetId, bookType);
                if (!book) return;

                const depAmount = calculateMonthlyDepreciation(
                    book.depreciationMethod,
                    book.acquisitionCost,
                    book.salvageValue,
                    book.usefulLifeMonths,
                    1, // Current period
                    book.netBookValue
                );

                const newAccumulated = book.accumulatedDepreciation + depAmount;
                const newNetBookValue = calculateBookValue({
                    ...book,
                    accumulatedDepreciation: newAccumulated,
                });

                get().updateAssetBook(book.id, {
                    accumulatedDepreciation: newAccumulated,
                    netBookValue: newNetBookValue,
                    lastDepreciationDate: periodDate,
                });

                get().recordEvent({
                    assetId,
                    eventType: AssetEventType.DEPRECIATION_POSTED,
                    actor,
                    amount: depAmount,
                    previousValue: book.netBookValue,
                    newValue: newNetBookValue,
                });

                // Check if fully depreciated
                if (newNetBookValue <= book.salvageValue) {
                    const asset = get().assets.find((a) => a.id === assetId);
                    if (asset && asset.status === AssetStatus.IN_USE) {
                        get().updateAsset(assetId, { status: AssetStatus.FULLY_DEPRECIATED });
                    }
                }
            },

            getSchedule: (assetId, bookType) =>
                get().schedules.find((s) => s.assetId === assetId && s.bookType === bookType),

            // =================================================================
            // IMPAIRMENT & REVALUATION
            // =================================================================

            recordImpairment: (assetId, bookType, recoverableAmount, reason, actor) => {
                const book = get().getAssetBook(assetId, bookType);
                if (!book) return;

                const carryingAmount = calculateBookValue(book);
                if (recoverableAmount >= carryingAmount) return; // No impairment needed

                const impairmentLoss = carryingAmount - recoverableAmount;
                const eventId = `evt-${Date.now()}`;

                const record: ImpairmentRecord = {
                    id: `imp-${Date.now()}`,
                    assetId,
                    bookType,
                    impairmentDate: new Date().toISOString().split('T')[0],
                    previousCarryingAmount: carryingAmount,
                    recoverableAmount,
                    impairmentLoss,
                    reason,
                    eventId,
                };

                set((state) => ({
                    impairments: [...state.impairments, record],
                }));

                get().updateAssetBook(book.id, {
                    impairmentLosses: book.impairmentLosses + impairmentLoss,
                });

                get().recordEvent({
                    assetId,
                    eventType: AssetEventType.IMPAIRMENT_RECORDED,
                    actor,
                    reason,
                    previousValue: carryingAmount,
                    newValue: recoverableAmount,
                    amount: impairmentLoss,
                });

                get().updateAsset(assetId, { status: AssetStatus.IMPAIRED });
            },

            recordRevaluation: (assetId, bookType, fairValue, reason, actor) => {
                const book = get().getAssetBook(assetId, bookType);
                if (!book) return;

                const carryingAmount = calculateBookValue(book);
                const revaluationAmount = fairValue - carryingAmount;
                const eventId = `evt-${Date.now()}`;

                const record: RevaluationRecord = {
                    id: `reval-${Date.now()}`,
                    assetId,
                    bookType,
                    revaluationDate: new Date().toISOString().split('T')[0],
                    previousCarryingAmount: carryingAmount,
                    fairValue,
                    revaluationAmount: Math.abs(revaluationAmount),
                    isIncrease: revaluationAmount > 0,
                    reason,
                    eventId,
                };

                set((state) => ({
                    revaluations: [...state.revaluations, record],
                }));

                if (revaluationAmount > 0) {
                    get().updateAssetBook(book.id, {
                        revaluationSurplus: book.revaluationSurplus + revaluationAmount,
                    });
                } else {
                    // Decrease - reduce surplus first, then impairment
                    const decrease = Math.abs(revaluationAmount);
                    if (book.revaluationSurplus >= decrease) {
                        get().updateAssetBook(book.id, {
                            revaluationSurplus: book.revaluationSurplus - decrease,
                        });
                    } else {
                        const remainingDecrease = decrease - book.revaluationSurplus;
                        get().updateAssetBook(book.id, {
                            revaluationSurplus: 0,
                            impairmentLosses: book.impairmentLosses + remainingDecrease,
                        });
                    }
                }

                get().recordEvent({
                    assetId,
                    eventType: AssetEventType.REVALUATION_RECORDED,
                    actor,
                    reason,
                    previousValue: carryingAmount,
                    newValue: fairValue,
                    amount: revaluationAmount,
                });
            },

            // =================================================================
            // TRANSFERS
            // =================================================================

            transferAsset: (transfer, actor) => {
                const eventId = `evt-${Date.now()}`;

                const transferRecord: AssetTransfer = {
                    ...transfer,
                    id: `xfer-${Date.now()}`,
                    eventId,
                };

                set((state) => ({
                    transfers: [...state.transfers, transferRecord],
                }));

                const updates: Partial<Asset> = {};
                if (transfer.toEntityId) updates.legalEntityId = transfer.toEntityId;
                if (transfer.toCostCenterId) updates.costCenterId = transfer.toCostCenterId;
                if (transfer.toLocation) updates.location = transfer.toLocation;
                if (transfer.toResponsibleParty) updates.responsibleParty = transfer.toResponsibleParty;

                get().updateAsset(transfer.assetId, updates);

                get().recordEvent({
                    assetId: transfer.assetId,
                    eventType: AssetEventType.ASSET_TRANSFERRED,
                    actor,
                    reason: transfer.reason,
                    fromEntityId: transfer.fromEntityId,
                    toEntityId: transfer.toEntityId,
                    fromCostCenterId: transfer.fromCostCenterId,
                    toCostCenterId: transfer.toCostCenterId,
                    fromLocation: transfer.fromLocation,
                    toLocation: transfer.toLocation,
                });
            },

            // =================================================================
            // CAPEX
            // =================================================================

            createCapExBudget: (budgetData) => {
                const now = new Date().toISOString();
                const id = `capex-${Date.now()}`;

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
                    capExBudgets: state.capExBudgets.map((b) => {
                        if (b.id !== id) return b;
                        const updated = { ...b, ...updates, updatedAt: new Date().toISOString() };
                        updated.remainingAmount = updated.budgetAmount - updated.committedAmount - updated.spentAmount;
                        return updated;
                    }),
                }));
            },

            addCapExItem: (itemData) => {
                const id = `capex-item-${Date.now()}`;

                const item: CapExItem = {
                    ...itemData,
                    id,
                };

                set((state) => ({
                    capExItems: [...state.capExItems, item],
                }));

                // Update budget committed amount
                if (itemData.status === 'COMMITTED' || itemData.status === 'APPROVED') {
                    const budget = get().capExBudgets.find((b) => b.id === itemData.budgetId);
                    if (budget) {
                        get().updateCapExBudget(budget.id, {
                            committedAmount: budget.committedAmount + itemData.estimatedAmount,
                        });
                    }
                }

                return id;
            },

            updateCapExItem: (id, updates) => {
                set((state) => ({
                    capExItems: state.capExItems.map((i) => (i.id === id ? { ...i, ...updates } : i)),
                }));
            },

            // =================================================================
            // EVENTS
            // =================================================================

            recordEvent: (eventData) => {
                const newEvent: AssetEvent = {
                    ...eventData,
                    id: `evt-${Date.now()}`,
                    timestamp: new Date().toISOString(),
                };
                set((state) => ({
                    events: [...state.events, newEvent],
                }));
                return newEvent;
            },

            getAssetEvents: (assetId) => {
                return get()
                    .events.filter((e) => e.assetId === assetId)
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            },

            // =================================================================
            // UI STATE
            // =================================================================

            setDashboardState: (state) => {
                set((current) => ({
                    dashboardState: { ...current.dashboardState, ...state },
                }));
            },

            addNotification: (notificationData) => {
                const notification: AssetNotification = {
                    ...notificationData,
                    id: `notif-${Date.now()}`,
                    createdAt: new Date().toISOString(),
                };
                set((state) => ({
                    notifications: [...state.notifications, notification],
                }));
            },

            markNotificationRead: (id) => {
                set((state) => ({
                    notifications: state.notifications.map((n) =>
                        n.id === id ? { ...n, readAt: new Date().toISOString() } : n
                    ),
                }));
            },

            // =================================================================
            // ANALYTICS
            // =================================================================

            getSummary: () => {
                const { assets, assetBooks } = get();
                const activeAssets = assets.filter((a) => a.isActive);

                const totalValue = activeAssets.reduce((sum, a) => sum + a.acquisitionCost, 0);
                const totalDepreciation = assetBooks
                    .filter((b) => b.bookType === BookType.STATUTORY && b.isActive)
                    .reduce((sum, b) => sum + b.accumulatedDepreciation, 0);

                const byStatus = {} as Record<AssetStatus, number>;
                const byCategory = {} as Record<AssetCategory, number>;

                activeAssets.forEach((a) => {
                    byStatus[a.status] = (byStatus[a.status] || 0) + 1;
                    byCategory[a.category] = (byCategory[a.category] || 0) + 1;
                });

                return {
                    totalAssets: activeAssets.length,
                    totalValue,
                    totalDepreciation,
                    netBookValue: totalValue - totalDepreciation,
                    byStatus,
                    byCategory,
                };
            },

            getAssetRegister: () => {
                const { assets, assetBooks } = get();

                return assets
                    .filter((a) => a.isActive)
                    .map((asset) => {
                        const book = assetBooks.find(
                            (b) => b.assetId === asset.id && b.bookType === BookType.STATUTORY
                        );

                        const acquisitionCost = book?.acquisitionCost || asset.acquisitionCost;
                        const accumulatedDepreciation = book?.accumulatedDepreciation || 0;
                        const impairmentLosses = book?.impairmentLosses || 0;
                        const netBookValue = book ? calculateBookValue(book) : asset.capitalizedCost;

                        const depreciableBase = acquisitionCost - (book?.salvageValue || asset.salvageValue);
                        const monthlyDep = depreciableBase / (book?.usefulLifeMonths || asset.usefulLifeMonths);

                        const remainingLife = Math.max(
                            0,
                            (book?.usefulLifeMonths || asset.usefulLifeMonths) -
                                Math.ceil(accumulatedDepreciation / monthlyDep)
                        );

                        return {
                            asset,
                            acquisitionCost,
                            accumulatedDepreciation,
                            impairmentLosses,
                            netBookValue,
                            monthlyDepreciation: monthlyDep,
                            remainingLifeMonths: remainingLife,
                            percentDepreciated:
                                depreciableBase > 0 ? (accumulatedDepreciation / depreciableBase) * 100 : 0,
                        };
                    });
            },

            calculateTotalNetBookValue: (bookType = BookType.STATUTORY) => {
                const { assetBooks } = get();
                return assetBooks
                    .filter((b) => b.bookType === bookType && b.isActive)
                    .reduce((sum, b) => sum + calculateBookValue(b), 0);
            },
        }),
        {
            name: 'primebalance-assets',
            partialize: (state) => ({
                assets: state.assets,
                assetBooks: state.assetBooks,
                events: state.events,
                schedules: state.schedules,
                impairments: state.impairments,
                revaluations: state.revaluations,
                transfers: state.transfers,
                disposals: state.disposals,
                capExBudgets: state.capExBudgets,
                capExItems: state.capExItems,
                lastAssetNumber: state.lastAssetNumber,
            }),
        }
    )
);