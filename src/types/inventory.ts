// =============================================================================
// INVENTORY MANAGEMENT TYPES
// =============================================================================

export type InventoryType = 'physical' | 'digital' | 'service' | 'wip' | 'consignment';
export type OwnershipType = 'owned' | 'consignment_supplier' | 'consignment_customer';
export type LocationType = 'warehouse' | 'store' | '3pl' | 'transit' | 'virtual';
export type MovementType = 'purchase' | 'production' | 'sale' | 'transfer' | 'adjustment' | 'return_customer' | 'return_supplier';
export type ValuationMethod = 'fifo' | 'weighted_average' | 'standard_cost' | 'none';

export interface InventoryLocation {
    id: string;
    name: string;
    type: LocationType;
    address?: string;
    isDefault: boolean;
    isActive: boolean;
}

export interface InventoryItem {
    id: string;
    name: string;
    sku?: string;
    category?: string;
    type: InventoryType;
    unit: string; // pieces, kg, hours, licenses, etc.

    // Ownership & Location
    ownership: OwnershipType;
    defaultLocationId?: string;

    // Stock levels (aggregated)
    totalStock: number;
    reservedStock: number;
    availableStock: number; // calculated: totalStock - reservedStock
    incomingStock: number;
    committedStock: number;

    // Stock by location
    stockByLocation: Record<string, number>;

    // Thresholds
    minStockLevel?: number;
    reorderPoint?: number;
    maxStockLevel?: number;

    // Tracking
    trackSerialNumbers: boolean;
    trackBatches: boolean;
    trackExpiry: boolean;

    // Valuation
    valuationMethod: ValuationMethod;
    unitCost?: number;
    totalValue?: number;
    currency: string;

    // Status
    status: 'active' | 'inactive' | 'discontinued';

    // Meta
    description?: string;
    imageUrl?: string;
    tags?: string[];
    createdAt: string;
    updatedAt: string;
}

export interface StockMovement {
    id: string;
    itemId: string;
    type: MovementType;
    date: string;
    quantity: number;

    // Location
    fromLocationId?: string;
    toLocationId?: string;

    // Batch/Serial tracking
    batchNumber?: string;
    serialNumbers?: string[];
    expiryDate?: string;

    // Value
    unitCost?: number;
    totalCost?: number;

    // Reference
    reference?: string;
    referenceType?: 'order' | 'invoice' | 'production' | 'adjustment' | 'other';

    // Notes
    notes?: string;
    createdBy?: string;
    createdAt: string;
}

export interface StockReservation {
    id: string;
    itemId: string;
    quantity: number;
    reason: 'customer_order' | 'project' | 'internal' | 'future_delivery' | 'other';
    reference?: string;
    reservedAt: string;
    expiresAt?: string;
    status: 'active' | 'fulfilled' | 'cancelled';
}

export interface BatchInfo {
    id: string;
    itemId: string;
    batchNumber: string;
    quantity: number;
    locationId: string;
    manufactureDate?: string;
    expiryDate?: string;
    status: 'available' | 'quarantine' | 'expired' | 'consumed';
}

export interface InventoryAlert {
    id: string;
    itemId: string;
    type: 'low_stock' | 'overstock' | 'expiring' | 'negative' | 'oversold';
    severity: 'info' | 'warning' | 'critical';
    message: string;
    threshold?: number;
    currentValue?: number;
    createdAt: string;
    isRead: boolean;
}

export interface InventorySummary {
    totalItems: number;
    totalValue: number;
    lowStockItems: number;
    expiringItems: number;
    overstockItems: number;
    byType: Record<InventoryType, number>;
    byLocation: Record<string, number>;
    recentMovements: number;
}

export interface InventoryWizardState {
    step: number;
    type: InventoryType | null;
    name: string;
    sku: string;
    category: string;
    unit: string;
    ownership: OwnershipType;
    locationId: string;
    initialQuantity: number;
    trackSerialNumbers: boolean;
    trackBatches: boolean;
    trackExpiry: boolean;
    valuationMethod: ValuationMethod;
    unitCost: number;
    currency: string;
    minStockLevel: number;
    reorderPoint: number;
    description: string;
}

// =============================================================================
// STANDING ORDERS - Automatic Reorder Configuration
// =============================================================================

export type StandingOrderFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'on_reorder_point';
export type StandingOrderStatus = 'active' | 'paused' | 'completed' | 'cancelled';

export interface StandingOrder {
    id: string;
    itemId: string;
    itemName: string;
    itemSku?: string;

    // Order configuration
    quantity: number;
    frequency: StandingOrderFrequency;

    // Trigger conditions
    triggerOnReorderPoint: boolean; // Auto-order when stock <= reorderPoint
    reorderPointOverride?: number; // Override item's reorder point
    reorderQuantityOverride?: number; // Override item's reorder quantity

    // Supplier
    supplierId?: string;
    supplierName?: string;

    // Scheduling
    nextOrderDate?: string;
    lastOrderDate?: string;

    // Limits
    maxOrdersPerMonth?: number;
    ordersThisMonth: number;
    totalOrdersCreated: number;

    // Financial
    estimatedUnitCost?: number;
    estimatedTotalCost?: number;
    currency: string;

    // Status
    status: StandingOrderStatus;

    // Meta
    notes?: string;
    createdBy?: string;
    createdAt: string;
    updatedAt: string;
}

export interface StandingOrderTriggerResult {
    standingOrderId: string;
    itemId: string;
    itemName: string;
    currentStock: number;
    reorderPoint: number;
    orderQuantity: number;
    orderId?: string;
    success: boolean;
    message: string;
    triggeredAt: string;
}

// Unit options
export const INVENTORY_UNITS = [
    { value: 'piece', labels: { en: 'Pieces', de: 'Stück', es: 'Piezas', fr: 'Pièces' } },
    { value: 'kg', labels: { en: 'Kilograms', de: 'Kilogramm', es: 'Kilogramos', fr: 'Kilogrammes' } },
    { value: 'liter', labels: { en: 'Liters', de: 'Liter', es: 'Litros', fr: 'Litres' } },
    { value: 'meter', labels: { en: 'Meters', de: 'Meter', es: 'Metros', fr: 'Mètres' } },
    { value: 'hour', labels: { en: 'Hours', de: 'Stunden', es: 'Horas', fr: 'Heures' } },
    { value: 'license', labels: { en: 'Licenses', de: 'Lizenzen', es: 'Licencias', fr: 'Licences' } },
    { value: 'unit', labels: { en: 'Units', de: 'Einheiten', es: 'Unidades', fr: 'Unités' } },
];

// Categories
export const INVENTORY_CATEGORIES = [
    'electronics', 'clothing', 'food', 'raw_materials', 'packaging',
    'office_supplies', 'software', 'services', 'spare_parts', 'other'
];