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
// INVENTORY STORE
// =============================================================================

interface InventoryState {
    items: InventoryItem[];
    locations: InventoryLocation[];
    movements: StockMovement[];
    reservations: StockReservation[];
    batches: BatchInfo[];
    wizardState: InventoryWizardState;

    // Items CRUD
    createItem: (item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt' | 'availableStock' | 'stockByLocation'>) => InventoryItem;
    updateItem: (id: string, updates: Partial<InventoryItem>) => void;
    deleteItem: (id: string) => void;

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

// Demo data
const generateDemoLocations = (): InventoryLocation[] => [
    { id: 'loc-001', name: 'Hauptlager München', type: 'warehouse', address: 'Industriestr. 15, 80339 München', isDefault: true, isActive: true },
    { id: 'loc-002', name: 'Filiale Berlin', type: 'store', address: 'Friedrichstr. 100, 10117 Berlin', isDefault: false, isActive: true },
    { id: 'loc-003', name: 'Amazon FBA', type: '3pl', isDefault: false, isActive: true },
    { id: 'loc-004', name: 'Digital Assets', type: 'virtual', isDefault: false, isActive: true },
];

const generateDemoItems = (): InventoryItem[] => [
    {
        id: 'inv-001',
        name: 'Premium Wireless Headphones',
        sku: 'AUDIO-WH-001',
        category: 'electronics',
        type: 'physical',
        unit: 'piece',
        ownership: 'owned',
        defaultLocationId: 'loc-001',
        totalStock: 250,
        reservedStock: 45,
        availableStock: 205,
        incomingStock: 100,
        committedStock: 30,
        stockByLocation: { 'loc-001': 180, 'loc-002': 50, 'loc-003': 20 },
        minStockLevel: 50,
        reorderPoint: 100,
        maxStockLevel: 500,
        trackSerialNumbers: true,
        trackBatches: false,
        trackExpiry: false,
        valuationMethod: 'weighted_average',
        unitCost: 45.00,
        totalValue: 11250,
        currency: 'EUR',
        status: 'active',
        tags: ['bestseller', 'electronics'],
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-12-10T14:00:00Z',
    },
    {
        id: 'inv-002',
        name: 'Organic Green Tea (1kg)',
        sku: 'FOOD-GT-1KG',
        category: 'food',
        type: 'physical',
        unit: 'kg',
        ownership: 'owned',
        defaultLocationId: 'loc-001',
        totalStock: 85,
        reservedStock: 10,
        availableStock: 75,
        incomingStock: 50,
        committedStock: 0,
        stockByLocation: { 'loc-001': 85 },
        minStockLevel: 20,
        reorderPoint: 40,
        trackSerialNumbers: false,
        trackBatches: true,
        trackExpiry: true,
        valuationMethod: 'fifo',
        unitCost: 28.50,
        totalValue: 2422.50,
        currency: 'EUR',
        status: 'active',
        tags: ['organic', 'food'],
        createdAt: '2024-03-01T09:00:00Z',
        updatedAt: '2024-12-08T11:00:00Z',
    },
    {
        id: 'inv-003',
        name: 'Software License Pro',
        sku: 'SOFT-LIC-PRO',
        category: 'software',
        type: 'digital',
        unit: 'license',
        ownership: 'owned',
        defaultLocationId: 'loc-004',
        totalStock: 500,
        reservedStock: 150,
        availableStock: 350,
        incomingStock: 0,
        committedStock: 0,
        stockByLocation: { 'loc-004': 500 },
        trackSerialNumbers: true,
        trackBatches: false,
        trackExpiry: true,
        valuationMethod: 'standard_cost',
        unitCost: 99.00,
        totalValue: 49500,
        currency: 'EUR',
        status: 'active',
        createdAt: '2024-02-01T10:00:00Z',
        updatedAt: '2024-12-01T10:00:00Z',
    },
    {
        id: 'inv-004',
        name: 'Consulting Hours',
        sku: 'SVC-CONSULT',
        category: 'services',
        type: 'service',
        unit: 'hour',
        ownership: 'owned',
        totalStock: 160,
        reservedStock: 80,
        availableStock: 80,
        incomingStock: 0,
        committedStock: 40,
        stockByLocation: {},
        trackSerialNumbers: false,
        trackBatches: false,
        trackExpiry: false,
        valuationMethod: 'standard_cost',
        unitCost: 150.00,
        totalValue: 24000,
        currency: 'EUR',
        status: 'active',
        description: 'Available consulting capacity per month',
        createdAt: '2024-01-01T10:00:00Z',
        updatedAt: '2024-12-01T10:00:00Z',
    },
    {
        id: 'inv-005',
        name: 'USB-C Cables (2m)',
        sku: 'ACC-USBC-2M',
        category: 'electronics',
        type: 'physical',
        unit: 'piece',
        ownership: 'owned',
        defaultLocationId: 'loc-001',
        totalStock: 15,
        reservedStock: 0,
        availableStock: 15,
        incomingStock: 200,
        committedStock: 0,
        stockByLocation: { 'loc-001': 10, 'loc-002': 5 },
        minStockLevel: 50,
        reorderPoint: 100,
        trackSerialNumbers: false,
        trackBatches: false,
        trackExpiry: false,
        valuationMethod: 'weighted_average',
        unitCost: 8.50,
        totalValue: 127.50,
        currency: 'EUR',
        status: 'active',
        createdAt: '2024-06-01T10:00:00Z',
        updatedAt: '2024-12-10T10:00:00Z',
    },
];

const generateDemoMovements = (): StockMovement[] => [
    {
        id: 'mov-001',
        itemId: 'inv-001',
        type: 'purchase',
        date: '2024-12-01',
        quantity: 100,
        toLocationId: 'loc-001',
        unitCost: 45.00,
        totalCost: 4500,
        reference: 'PO-2024-089',
        referenceType: 'order',
        createdAt: '2024-12-01T10:00:00Z',
    },
    {
        id: 'mov-002',
        itemId: 'inv-001',
        type: 'sale',
        date: '2024-12-05',
        quantity: -25,
        fromLocationId: 'loc-001',
        reference: 'SO-2024-156',
        referenceType: 'order',
        createdAt: '2024-12-05T14:00:00Z',
    },
    {
        id: 'mov-003',
        itemId: 'inv-001',
        type: 'transfer',
        date: '2024-12-08',
        quantity: 20,
        fromLocationId: 'loc-001',
        toLocationId: 'loc-002',
        notes: 'Stock replenishment Berlin',
        createdAt: '2024-12-08T09:00:00Z',
    },
    {
        id: 'mov-004',
        itemId: 'inv-002',
        type: 'purchase',
        date: '2024-12-10',
        quantity: 50,
        toLocationId: 'loc-001',
        batchNumber: 'GT-2024-12-A',
        expiryDate: '2025-12-10',
        unitCost: 28.50,
        totalCost: 1425,
        reference: 'PO-2024-092',
        referenceType: 'order',
        createdAt: '2024-12-10T08:00:00Z',
    },
];

const generateDemoReservations = (): StockReservation[] => [
    {
        id: 'res-001',
        itemId: 'inv-001',
        quantity: 45,
        reason: 'customer_order',
        reference: 'SO-2024-160',
        reservedAt: '2024-12-10T10:00:00Z',
        status: 'active',
    },
    {
        id: 'res-002',
        itemId: 'inv-003',
        quantity: 150,
        reason: 'customer_order',
        reference: 'Contract-Enterprise-2024',
        reservedAt: '2024-12-01T10:00:00Z',
        status: 'active',
    },
];

export const useInventoryStore = create<InventoryState>()(
    persist(
        (set, get) => ({
            items: generateDemoItems(),
            locations: generateDemoLocations(),
            movements: generateDemoMovements(),
            reservations: generateDemoReservations(),
            batches: [],
            wizardState: initialWizardState,

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
            },

            deleteItem: (id) => {
                set((state) => ({
                    items: state.items.filter((i) => i.id !== id),
                    movements: state.movements.filter((m) => m.itemId !== id),
                    reservations: state.reservations.filter((r) => r.itemId !== id),
                }));
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

                // Update item stock
                get().recalculateStock(movementData.itemId);

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

                // Update reserved stock
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

                // Reduce both reserved and total stock
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

                // Release reserved stock
                const item = get().items.find((i) => i.id === reservation.itemId);
                if (item) {
                    get().updateItem(item.id, {
                        reservedStock: item.reservedStock - reservation.quantity
                    });
                }
            },

            recalculateStock: (itemId) => {
                const movements = get().movements.filter((m) => m.itemId === itemId);
                const reservations = get().reservations.filter((r) => r.itemId === itemId && r.status === 'active');

                let totalStock = 0;
                const stockByLocation: Record<string, number> = {};

                movements.forEach((mov) => {
                    if (mov.type === 'sale' || mov.type === 'return_supplier') {
                        totalStock += mov.quantity; // quantity is negative for outgoing
                        if (mov.fromLocationId) {
                            stockByLocation[mov.fromLocationId] = (stockByLocation[mov.fromLocationId] || 0) + mov.quantity;
                        }
                    } else if (mov.type === 'transfer') {
                        if (mov.fromLocationId) {
                            stockByLocation[mov.fromLocationId] = (stockByLocation[mov.fromLocationId] || 0) - mov.quantity;
                        }
                        if (mov.toLocationId) {
                            stockByLocation[mov.toLocationId] = (stockByLocation[mov.toLocationId] || 0) + mov.quantity;
                        }
                    } else {
                        totalStock += mov.quantity;
                        if (mov.toLocationId) {
                            stockByLocation[mov.toLocationId] = (stockByLocation[mov.toLocationId] || 0) + mov.quantity;
                        }
                    }
                });

                const reservedStock = reservations.reduce((sum, r) => sum + r.quantity, 0);

                get().updateItem(itemId, {
                    totalStock,
                    reservedStock,
                    stockByLocation,
                });
            },

            getAvailableStock: (itemId, locationId) => {
                const item = get().items.find((i) => i.id === itemId);
                if (!item) return 0;

                if (locationId) {
                    const locationStock = item.stockByLocation[locationId] || 0;
                    // Proportional reservation for location (simplified)
                    const locationRatio = item.totalStock > 0 ? locationStock / item.totalStock : 0;
                    return locationStock - Math.ceil(item.reservedStock * locationRatio);
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

            setWizardStep: (step) => {
                set((state) => ({ wizardState: { ...state.wizardState, step } }));
            },

            updateWizardState: (updates) => {
                set((state) => ({ wizardState: { ...state.wizardState, ...updates } }));
            },

            resetWizard: () => set({ wizardState: initialWizardState }),

            getSummary: () => {
                const { items, movements, locations } = get();
                const activeItems = items.filter((i) => i.status === 'active');

                const lowStockItems = activeItems.filter((i) =>
                    i.minStockLevel && i.availableStock < i.minStockLevel
                ).length;

                const overstockItems = activeItems.filter((i) =>
                    i.maxStockLevel && i.totalStock > i.maxStockLevel
                ).length;

                const totalValue = activeItems.reduce((sum, i) => sum + (i.totalValue || 0), 0);

                const byType: Record<InventoryType, number> = {
                    physical: 0,
                    digital: 0,
                    service: 0,
                    wip: 0,
                    consignment: 0,
                };
                activeItems.forEach((i) => { byType[i.type]++; });

                const byLocation: Record<string, number> = {};
                activeItems.forEach((i) => {
                    Object.entries(i.stockByLocation).forEach(([locId, qty]) => {
                        byLocation[locId] = (byLocation[locId] || 0) + qty;
                    });
                });

                const now = Date.now();
                const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
                const recentMovements = movements.filter((m) =>
                    new Date(m.createdAt).getTime() > thirtyDaysAgo
                ).length;

                return {
                    totalItems: activeItems.length,
                    totalValue,
                    lowStockItems,
                    expiringItems: 0, // Would check batches
                    overstockItems,
                    byType,
                    byLocation,
                    recentMovements,
                };
            },

            getAlerts: () => {
                const { items } = get();
                const alerts: InventoryAlert[] = [];
                const now = new Date().toISOString();

                items.filter((i) => i.status === 'active').forEach((item) => {
                    // Low stock
                    if (item.minStockLevel && item.availableStock < item.minStockLevel) {
                        alerts.push({
                            id: `alert-low-${item.id}`,
                            itemId: item.id,
                            type: 'low_stock',
                            severity: item.availableStock === 0 ? 'critical' : 'warning',
                            message: `${item.name}: Only ${item.availableStock} ${item.unit} available`,
                            threshold: item.minStockLevel,
                            currentValue: item.availableStock,
                            createdAt: now,
                            isRead: false,
                        });
                    }

                    // Overstock
                    if (item.maxStockLevel && item.totalStock > item.maxStockLevel) {
                        alerts.push({
                            id: `alert-over-${item.id}`,
                            itemId: item.id,
                            type: 'overstock',
                            severity: 'info',
                            message: `${item.name}: Stock exceeds maximum (${item.totalStock}/${item.maxStockLevel})`,
                            threshold: item.maxStockLevel,
                            currentValue: item.totalStock,
                            createdAt: now,
                            isRead: false,
                        });
                    }

                    // Negative availability
                    if (item.availableStock < 0) {
                        alerts.push({
                            id: `alert-neg-${item.id}`,
                            itemId: item.id,
                            type: 'negative',
                            severity: 'critical',
                            message: `${item.name}: Negative availability detected (${item.availableStock})`,
                            currentValue: item.availableStock,
                            createdAt: now,
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
                    b.expiryDate && new Date(b.expiryDate) <= cutoff && b.status === 'available'
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
                });

                return true;
            },

            adjustStock: (itemId, locationId, newQuantity, reason) => {
                const item = get().items.find((i) => i.id === itemId);
                if (!item) return;

                const currentQty = item.stockByLocation[locationId] || 0;
                const difference = newQuantity - currentQty;

                get().recordMovement({
                    itemId,
                    type: 'adjustment',
                    date: new Date().toISOString().split('T')[0],
                    quantity: difference,
                    toLocationId: difference > 0 ? locationId : undefined,
                    fromLocationId: difference < 0 ? locationId : undefined,
                    notes: reason,
                });
            },
        }),
        { name: 'primebalance-inventory' }
    )
);