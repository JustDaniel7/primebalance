import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
    InventoryItem,
    InventoryLocation,
    StockMovement,
    StockReservation,
    InventoryAlert,
    InventorySummary,
    InventoryWizardState,
    InventoryType,
    MovementType,
    BatchInfo,
} from '@/types/inventory';

// =============================================================================
// INVENTORY STORE - API CONNECTED
// =============================================================================

interface DeletedItem {
    item: InventoryItem;
    deletedAt: string;
    expiresAt: string; // 30 days after deletion
}

interface InventoryState {
    items: InventoryItem[];
    deletedItems: DeletedItem[];
    locations: InventoryLocation[];
    movements: StockMovement[];
    reservations: StockReservation[];
    batches: BatchInfo[];
    wizardState: InventoryWizardState;
    isLoading: boolean;
    error: string | null;
    isInitialized: boolean;

    // API Actions
    fetchItems: () => Promise<void>;

    // Items CRUD
    createItem: (item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt' | 'availableStock' | 'stockByLocation'>) => InventoryItem;
    updateItem: (id: string, updates: Partial<InventoryItem>) => void;
    deleteItem: (id: string) => void; // Soft delete

    // Soft delete & restore
    restoreItem: (id: string) => boolean;
    permanentlyDeleteItem: (id: string) => void;
    getDeletedItems: () => DeletedItem[];
    cleanupExpiredItems: () => void;

    // Locations
    createLocation: (location: Omit<InventoryLocation, 'id'>) => InventoryLocation;
    updateLocation: (id: string, updates: Partial<InventoryLocation>) => void;
    deleteLocation: (id: string) => void;

    // Movements (never edit, only create)
    recordMovement: (movement: Omit<StockMovement, 'id' | 'createdAt'>) => StockMovement;
    getMovementsByItem: (itemId: string) => StockMovement[];
    getMovementsByLocation: (locationId: string) => StockMovement[];

    // Reservations
    createReservation: (reservation: Omit<StockReservation, 'id' | 'reservedAt' | 'status'>) => StockReservation;
    fulfillReservation: (id: string) => void;
    cancelReservation: (id: string) => void;

    // Stock calculations
    recalculateStock: (itemId: string) => void;
    getAvailableStock: (itemId: string, locationId?: string) => number;
    checkAvailability: (itemId: string, quantity: number, locationId?: string) => { available: boolean; shortage: number };

    // Wizard
    setWizardStep: (step: number) => void;
    updateWizardState: (updates: Partial<InventoryWizardState>) => void;
    resetWizard: () => void;

    // Analytics
    getSummary: () => InventorySummary;
    getAlerts: () => InventoryAlert[];
    getLowStockItems: () => InventoryItem[];
    getExpiringBatches: (days: number) => BatchInfo[];

    // Transfer
    transferStock: (itemId: string, fromLocationId: string, toLocationId: string, quantity: number, reference?: string) => boolean;

    // Adjustments
    adjustStock: (itemId: string, locationId: string, newQuantity: number, reason: string) => void;
}

const initialWizardState: InventoryWizardState = {
    step: 1,
    type: null,
    name: '',
    sku: '',
    category: '',
    unit: 'piece',
    ownership: 'owned',
    locationId: '',
    initialQuantity: 0,
    trackSerialNumbers: false,
    trackBatches: false,
    trackExpiry: false,
    valuationMethod: 'none',
    unitCost: 0,
    currency: 'EUR',
    minStockLevel: 0,
    reorderPoint: 0,
    description: '',
};

function mapApiToInventoryItem(api: any): InventoryItem {
    return {
        id: api.id,
        name: api.name,
        sku: api.sku,
        category: api.category,
        type: api.itemType || api.type || 'physical',
        unit: api.unitOfMeasure || api.unit || 'piece',
        ownership: api.ownershipType || api.ownership || 'owned',
        defaultLocationId: api.warehouseId || api.defaultLocationId,
        totalStock: Number(api.quantityOnHand ?? api.totalStock) || 0,
        reservedStock: Number(api.quantityReserved ?? api.reservedStock) || 0,
        availableStock: Number(api.quantityAvailable ?? api.availableStock) || 0,
        incomingStock: Number(api.incomingStock) || 0,
        committedStock: Number(api.committedStock) || 0,
        stockByLocation: api.stockByLocation || {},
        minStockLevel: api.minimumStock ?? api.minStockLevel,
        reorderPoint: api.reorderPoint,
        maxStockLevel: api.maxStockLevel,
        trackSerialNumbers: api.isSerialTracked ?? api.trackSerialNumbers ?? false,
        trackBatches: api.isBatchTracked ?? api.trackBatches ?? false,
        trackExpiry: api.isExpiryTracked ?? api.trackExpiry ?? false,
        valuationMethod: api.costingMethod || api.valuationMethod || 'none',
        unitCost: api.unitCost ? Number(api.unitCost) : undefined,
        totalValue: api.totalValue ? Number(api.totalValue) : undefined,
        currency: api.currency || 'EUR',
        status: api.status || 'active',
        description: api.description,
        imageUrl: api.imageUrl,
        tags: api.tags || [],
        createdAt: api.createdAt,
        updatedAt: api.updatedAt,
    };
}

export const useInventoryStore = create<InventoryState>()(
    persist(
        (set, get) => ({
            items: [],
            deletedItems: [],
            locations: [],
            movements: [],
            reservations: [],
            batches: [],
            wizardState: initialWizardState,
            isLoading: false,
            error: null,
            isInitialized: false,

            fetchItems: async () => {
                set({ isLoading: true, error: null });
                try {
                    const response = await fetch('/api/inventory');
                    if (!response.ok) throw new Error('Failed to fetch inventory');
                    const data = await response.json();
                    const items = (data.items || data || []).map(mapApiToInventoryItem);
                    set({ items, isLoading: false, isInitialized: true });
                } catch (error) {
                    console.error('Failed to fetch inventory:', error);
                    set({ error: (error as Error).message, isLoading: false, isInitialized: true });
                }
            },

            createItem: (itemData) => {
                const now = new Date().toISOString();
                const newItem: InventoryItem = {
                    ...itemData,
                    id: `inv-${Date.now()}`,
                    availableStock: itemData.totalStock - itemData.reservedStock,
                    stockByLocation: itemData.defaultLocationId
                        ? { [itemData.defaultLocationId]: itemData.totalStock }
                        : {},
                    createdAt: now,
                    updatedAt: now,
                };

                // Async API call (fire and forget for now)
                fetch('/api/inventory', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: itemData.name,
                        sku: itemData.sku,
                        category: itemData.category,
                        itemType: itemData.type,
                        unitOfMeasure: itemData.unit,
                        ownershipType: itemData.ownership,
                        warehouseId: itemData.defaultLocationId,
                        quantityOnHand: itemData.totalStock,
                        quantityReserved: itemData.reservedStock,
                        minimumStock: itemData.minStockLevel,
                        reorderPoint: itemData.reorderPoint,
                        isSerialTracked: itemData.trackSerialNumbers,
                        isBatchTracked: itemData.trackBatches,
                        isExpiryTracked: itemData.trackExpiry,
                        costingMethod: itemData.valuationMethod,
                        unitCost: itemData.unitCost,
                        currency: itemData.currency,
                        description: itemData.description,
                    }),
                }).catch(console.error);

                set((state) => ({ items: [...state.items, newItem] }));
                return newItem;
            },

            updateItem: (id, updates) => {
                set((state) => ({
                    items: state.items.map((item) =>
                        item.id === id
                            ? {
                                ...item,
                                ...updates,
                                availableStock: (updates.totalStock ?? item.totalStock) - (updates.reservedStock ?? item.reservedStock),
                                updatedAt: new Date().toISOString()
                            }
                            : item
                    ),
                }));

                // Async API call
                fetch(`/api/inventory/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updates),
                }).catch(console.error);
            },

            deleteItem: (id) => {
                // Soft delete - move to deletedItems with 30 day expiry
                const item = get().items.find((i) => i.id === id);
                if (!item) return;

                const now = new Date();
                const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

                set((state) => ({
                    items: state.items.filter((i) => i.id !== id),
                    deletedItems: [
                        ...state.deletedItems,
                        {
                            item,
                            deletedAt: now.toISOString(),
                            expiresAt: expiresAt.toISOString(),
                        },
                    ],
                }));

                // API call to soft delete (mark as deleted, not permanent)
                fetch(`/api/inventory/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'deleted', deletedAt: now.toISOString() }),
                }).catch(console.error);
            },

            restoreItem: (id) => {
                const deletedEntry = get().deletedItems.find((d) => d.item.id === id);
                if (!deletedEntry) return false;

                // Check if not expired
                if (new Date(deletedEntry.expiresAt) < new Date()) {
                    return false;
                }

                set((state) => ({
                    items: [...state.items, { ...deletedEntry.item, status: 'active' }],
                    deletedItems: state.deletedItems.filter((d) => d.item.id !== id),
                }));

                // API call to restore
                fetch(`/api/inventory/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'active', deletedAt: null }),
                }).catch(console.error);

                return true;
            },

            permanentlyDeleteItem: (id) => {
                set((state) => ({
                    deletedItems: state.deletedItems.filter((d) => d.item.id !== id),
                    movements: state.movements.filter((m) => m.itemId !== id),
                    reservations: state.reservations.filter((r) => r.itemId !== id),
                }));

                fetch(`/api/inventory/${id}`, { method: 'DELETE' }).catch(console.error);
            },

            getDeletedItems: () => {
                // Clean up expired items first
                get().cleanupExpiredItems();
                return get().deletedItems;
            },

            cleanupExpiredItems: () => {
                const now = new Date();
                const expiredIds = get().deletedItems
                    .filter((d) => new Date(d.expiresAt) < now)
                    .map((d) => d.item.id);

                if (expiredIds.length > 0) {
                    set((state) => ({
                        deletedItems: state.deletedItems.filter((d) => new Date(d.expiresAt) >= now),
                    }));

                    // Permanently delete expired items from API
                    expiredIds.forEach((id) => {
                        fetch(`/api/inventory/${id}`, { method: 'DELETE' }).catch(console.error);
                    });
                }
            },

            createLocation: (locationData) => {
                const newLocation: InventoryLocation = { ...locationData, id: `loc-${Date.now()}` };
                set((state) => ({ locations: [...state.locations, newLocation] }));
                return newLocation;
            },

            updateLocation: (id, updates) => {
                set((state) => ({
                    locations: state.locations.map((loc) => (loc.id === id ? { ...loc, ...updates } : loc)),
                }));
            },

            deleteLocation: (id) => {
                set((state) => ({ locations: state.locations.filter((l) => l.id !== id) }));
            },

            recordMovement: (movementData) => {
                const newMovement: StockMovement = {
                    ...movementData,
                    id: `mov-${Date.now()}`,
                    createdAt: new Date().toISOString(),
                };

                set((state) => ({ movements: [...state.movements, newMovement] }));
                get().recalculateStock(movementData.itemId);

                // API call for movement
                fetch(`/api/inventory/${movementData.itemId}/movements`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(movementData),
                }).catch(console.error);

                return newMovement;
            },

            getMovementsByItem: (itemId) => {
                return get().movements.filter((m) => m.itemId === itemId).sort((a, b) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime()
                );
            },

            getMovementsByLocation: (locationId) => {
                return get().movements.filter((m) =>
                    m.fromLocationId === locationId || m.toLocationId === locationId
                );
            },

            createReservation: (reservationData) => {
                const newReservation: StockReservation = {
                    ...reservationData,
                    id: `res-${Date.now()}`,
                    reservedAt: new Date().toISOString(),
                    status: 'active',
                };

                set((state) => ({ reservations: [...state.reservations, newReservation] }));

                const item = get().items.find((i) => i.id === reservationData.itemId);
                if (item) {
                    get().updateItem(item.id, {
                        reservedStock: item.reservedStock + reservationData.quantity
                    });
                }

                return newReservation;
            },

            fulfillReservation: (id) => {
                const reservation = get().reservations.find((r) => r.id === id);
                if (!reservation || reservation.status !== 'active') return;

                set((state) => ({
                    reservations: state.reservations.map((r) =>
                        r.id === id ? { ...r, status: 'fulfilled' as const } : r
                    ),
                }));

                const item = get().items.find((i) => i.id === reservation.itemId);
                if (item) {
                    get().updateItem(item.id, {
                        totalStock: item.totalStock - reservation.quantity,
                        reservedStock: item.reservedStock - reservation.quantity,
                    });
                }
            },

            cancelReservation: (id) => {
                const reservation = get().reservations.find((r) => r.id === id);
                if (!reservation || reservation.status !== 'active') return;

                set((state) => ({
                    reservations: state.reservations.map((r) =>
                        r.id === id ? { ...r, status: 'cancelled' as const } : r
                    ),
                }));

                const item = get().items.find((i) => i.id === reservation.itemId);
                if (item) {
                    get().updateItem(item.id, {
                        reservedStock: item.reservedStock - reservation.quantity
                    });
                }
            },

            recalculateStock: (itemId) => {
                const movements = get().movements.filter((m) => m.itemId === itemId);
                const item = get().items.find((i) => i.id === itemId);
                if (!item) return;

                const stockByLocation: Record<string, number> = {};
                let totalStock = 0;

                movements.forEach((m) => {
                    const qty = m.quantity;
                    if (m.toLocationId) {
                        stockByLocation[m.toLocationId] = (stockByLocation[m.toLocationId] || 0) + qty;
                        totalStock += qty;
                    }
                    if (m.fromLocationId) {
                        stockByLocation[m.fromLocationId] = (stockByLocation[m.fromLocationId] || 0) - qty;
                        totalStock -= qty;
                    }
                });

                get().updateItem(itemId, { stockByLocation, totalStock });
            },

            getAvailableStock: (itemId, locationId) => {
                const item = get().items.find((i) => i.id === itemId);
                if (!item) return 0;
                if (locationId) {
                    return (item.stockByLocation[locationId] || 0) - item.reservedStock;
                }
                return item.availableStock;
            },

            checkAvailability: (itemId, quantity, locationId) => {
                const available = get().getAvailableStock(itemId, locationId);
                return {
                    available: available >= quantity,
                    shortage: Math.max(0, quantity - available),
                };
            },

            setWizardStep: (step) => set((state) => ({ wizardState: { ...state.wizardState, step } })),

            updateWizardState: (updates) => set((state) => ({ wizardState: { ...state.wizardState, ...updates } })),

            resetWizard: () => set({ wizardState: initialWizardState }),

            getSummary: () => {
                const { items, movements } = get();
                const activeItems = items.filter((i) => i.status === 'active');
                const lowStockItems = activeItems.filter((i) => i.minStockLevel && i.availableStock < i.minStockLevel);
                const recentMovements = movements.filter((m) => {
                    const moveDate = new Date(m.date);
                    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                    return moveDate > weekAgo;
                });

                const byType = activeItems.reduce((acc, item) => {
                    acc[item.type] = (acc[item.type] || 0) + 1;
                    return acc;
                }, {} as Record<InventoryType, number>);

                const byLocation = activeItems.reduce((acc, item) => {
                    Object.entries(item.stockByLocation).forEach(([locId, qty]) => {
                        acc[locId] = (acc[locId] || 0) + Number(qty || 0);
                    });
                    return acc;
                }, {} as Record<string, number>);

                return {
                    totalItems: activeItems.length,
                    totalValue: activeItems.reduce((sum, i) => sum + Number(i.totalValue || 0), 0),
                    lowStockItems: lowStockItems.length,
                    expiringItems: 0,
                    overstockItems: activeItems.filter((i) => i.maxStockLevel && i.totalStock > i.maxStockLevel).length,
                    byType,
                    byLocation,
                    recentMovements: recentMovements.length,
                };
            },

            getAlerts: () => {
                const { items, batches } = get();
                const alerts: InventoryAlert[] = [];

                items.forEach((item) => {
                    if (item.minStockLevel && item.availableStock < item.minStockLevel) {
                        alerts.push({
                            id: `alert-low-${item.id}`,
                            itemId: item.id,
                            type: 'low_stock',
                            severity: item.availableStock === 0 ? 'critical' : 'warning',
                            message: `${item.name} is below minimum stock level`,
                            threshold: item.minStockLevel,
                            currentValue: item.availableStock,
                            createdAt: new Date().toISOString(),
                            isRead: false,
                        });
                    }
                    if (item.availableStock < 0) {
                        alerts.push({
                            id: `alert-neg-${item.id}`,
                            itemId: item.id,
                            type: 'negative',
                            severity: 'critical',
                            message: `${item.name} has negative stock`,
                            currentValue: item.availableStock,
                            createdAt: new Date().toISOString(),
                            isRead: false,
                        });
                    }
                });

                return alerts;
            },

            getLowStockItems: () => {
                return get().items.filter((i) =>
                    i.status === 'active' && i.minStockLevel && i.availableStock < i.minStockLevel
                );
            },

            getExpiringBatches: (days) => {
                const cutoff = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
                return get().batches.filter((b) =>
                    b.status === 'available' && b.expiryDate && new Date(b.expiryDate) <= cutoff
                );
            },

            transferStock: (itemId, fromLocationId, toLocationId, quantity, reference) => {
                const item = get().items.find((i) => i.id === itemId);
                if (!item) return false;

                const fromStock = item.stockByLocation[fromLocationId] || 0;
                if (fromStock < quantity) return false;

                get().recordMovement({
                    itemId,
                    type: 'transfer',
                    date: new Date().toISOString().split('T')[0],
                    quantity,
                    fromLocationId,
                    toLocationId,
                    reference,
                    referenceType: 'other',
                });

                return true;
            },

            adjustStock: (itemId, locationId, newQuantity, reason) => {
                const item = get().items.find((i) => i.id === itemId);
                if (!item) return;

                const currentStock = item.stockByLocation[locationId] || 0;
                const adjustment = newQuantity - currentStock;

                get().recordMovement({
                    itemId,
                    type: 'adjustment',
                    date: new Date().toISOString().split('T')[0],
                    quantity: Math.abs(adjustment),
                    fromLocationId: adjustment < 0 ? locationId : undefined,
                    toLocationId: adjustment > 0 ? locationId : undefined,
                    notes: reason,
                    referenceType: 'adjustment',
                });
            },
        }),
        {
            name: 'primebalance-inventory',
            partialize: (state) => ({
                items: state.items,
                deletedItems: state.deletedItems,
                locations: state.locations,
                movements: state.movements,
                reservations: state.reservations,
                batches: state.batches,
            }),
        }
    )
);