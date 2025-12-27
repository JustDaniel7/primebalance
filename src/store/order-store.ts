import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// =============================================================================
// SIMPLIFIED ORDER TYPES FOR STORE (Compatible with Enhanced Types)
// =============================================================================

export type SimpleOrderStatus = 'draft' | 'confirmed' | 'in_progress' | 'partially_completed' | 'completed' | 'cancelled';
export type SimpleInvoiceType = 'final' | 'partial' | 'advance' | 'periodic' | 'consolidated';
export type SimpleCustomerType = 'b2b' | 'b2c';

export interface SimpleOrderParty {
    name: string;
    company?: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
    email?: string;
    vatId?: string;
}

export interface SimpleOrderItem {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    unit: string;
    taxRate: number;
    total: number;
    quantityInvoiced: number;
    quantityRemaining: number;
    amountInvoiced: number;
    amountRemaining: number;
}

export interface SimpleOrder {
    id: string;
    orderNumber: string;
    status: SimpleOrderStatus;
    customer: SimpleOrderParty;
    seller: SimpleOrderParty;
    customerType: SimpleCustomerType;
    isCrossBorder: boolean;
    items: SimpleOrderItem[];
    currency: string;
    subtotal: number;
    taxAmount: number;
    total: number;
    amountInvoiced: number;
    amountRemaining: number;
    invoiceIds: string[];
    orderDate: string;
    deliveryDate?: string;
    servicePeriodStart?: string;
    servicePeriodEnd?: string;
    isRecurring: boolean;
    recurringInterval?: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    reference?: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface SimpleFakturierungWizardState {
    step: number;
    selectedOrderId: string | null;
    invoiceType: SimpleInvoiceType;
    scope: {
        percentage?: number;
        items?: Array<{ itemId: string; quantity: number }>;
        periodStart?: string;
        periodEnd?: string;
    };
    applyTax: boolean;
    taxRate: number;
    taxExemptReason?: string;
    invoiceDate: string;
    paymentDays: number;
    notes: string;
}

// =============================================================================
// ORDER STORE INTERFACE
// =============================================================================

interface OrderState {
    orders: SimpleOrder[];
    currentOrder: SimpleOrder | null;
    wizardState: SimpleFakturierungWizardState;
    lastOrderNumber: number;
    isLoading: boolean;
    error: string | null;
    isInitialized: boolean;

    // API Actions
    fetchOrders: () => Promise<void>;

    // Order CRUD
    createOrder: (order: Omit<SimpleOrder, 'id' | 'createdAt' | 'updatedAt'>) => SimpleOrder;
    updateOrder: (id: string, updates: Partial<SimpleOrder>) => void;
    deleteOrder: (id: string) => void;
    setCurrentOrder: (order: SimpleOrder | null) => void;

    // Wizard
    setWizardStep: (step: number) => void;
    updateWizardState: (updates: Partial<SimpleFakturierungWizardState>) => void;
    resetWizard: () => void;
    selectOrderForInvoicing: (orderId: string) => void;

    // Invoicing
    markItemsAsInvoiced: (orderId: string, items: Array<{ itemId: string; quantity: number; amount: number }>) => void;
    linkInvoiceToOrder: (orderId: string, invoiceId: string, amount: number) => void;
    getSuggestedInvoiceType: (orderId: string) => SimpleInvoiceType;
    getInvoicingStatus: (orderId: string) => { invoiced: number; remaining: number; percentage: number };

    // Validation
    checkDoubleInvoicing: (orderId: string, amount: number) => { valid: boolean; warning?: string };

    // Utils
    generateOrderNumber: () => string;
}

const initialWizardState: SimpleFakturierungWizardState = {
    step: 1,
    selectedOrderId: null,
    invoiceType: 'final',
    scope: {},
    applyTax: true,
    taxRate: 19,
    taxExemptReason: undefined,
    invoiceDate: new Date().toISOString().split('T')[0],
    paymentDays: 14,
    notes: '',
};

// =============================================================================
// API MAPPER
// =============================================================================

function mapApiToOrder(api: any): SimpleOrder {
    return {
        id: api.id,
        orderNumber: api.orderNumber,
        status: api.status || 'draft',
        customer: api.customer || {
            name: api.customerName || '',
            company: api.customerCompany,
            address: api.customerAddress || '',
            city: api.customerCity || '',
            postalCode: api.customerPostalCode || '',
            country: api.customerCountry || 'DE',
            email: api.customerEmail,
            vatId: api.customerVatId,
        },
        seller: api.seller || {},
        customerType: api.customerType || 'b2b',
        isCrossBorder: api.isCrossBorder || false,
        items: (api.items || []).map((item: any) => ({
            id: item.id || `item-${Date.now()}`,
            description: item.description,
            quantity: Number(item.quantity) || 0,
            unitPrice: Number(item.unitPrice) || 0,
            unit: item.unit || 'piece',
            taxRate: Number(item.taxRate) || 19,
            total: Number(item.total) || 0,
            quantityInvoiced: Number(item.quantityInvoiced) || 0,
            quantityRemaining: Number(item.quantityRemaining) || Number(item.quantity) || 0,
            amountInvoiced: Number(item.amountInvoiced) || 0,
            amountRemaining: Number(item.amountRemaining) || Number(item.total) || 0,
        })),
        currency: api.currency || 'EUR',
        subtotal: Number(api.subtotal) || 0,
        taxAmount: Number(api.taxAmount) || 0,
        total: Number(api.total) || 0,
        amountInvoiced: Number(api.amountInvoiced) || 0,
        amountRemaining: Number(api.amountRemaining) || Number(api.total) || 0,
        invoiceIds: api.invoiceIds || [],
        orderDate: api.orderDate?.split('T')[0] || api.orderDate,
        deliveryDate: api.deliveryDate?.split('T')[0],
        servicePeriodStart: api.servicePeriodStart?.split('T')[0],
        servicePeriodEnd: api.servicePeriodEnd?.split('T')[0],
        isRecurring: api.isRecurring || false,
        recurringInterval: api.recurringInterval,
        reference: api.reference,
        notes: api.notes,
        createdAt: api.createdAt,
        updatedAt: api.updatedAt,
    };
}

// =============================================================================
// STORE IMPLEMENTATION
// =============================================================================

export const useOrderStore = create<OrderState>()(
    persist(
        (set, get) => ({
            orders: [],
            currentOrder: null,
            wizardState: initialWizardState,
            lastOrderNumber: 0,
            isLoading: false,
            error: null,
            isInitialized: false,

            // =================================================================
            // API
            // =================================================================

            fetchOrders: async () => {
                set({ isLoading: true, error: null });
                try {
                    const response = await fetch('/api/orders');
                    if (!response.ok) throw new Error('Failed to fetch orders');
                    const data = await response.json();
                    const orders = (data.orders || data || []).map(mapApiToOrder);
                    const maxNumber = orders.reduce((max: number, ord: SimpleOrder) => {
                        const num = parseInt(ord.orderNumber.replace(/\D/g, '')) || 0;
                        return num > max ? num : max;
                    }, 0);
                    set({ orders, lastOrderNumber: maxNumber, isLoading: false, isInitialized: true });
                } catch (error) {
                    console.error('Failed to fetch orders:', error);
                    set({ error: (error as Error).message, isLoading: false, isInitialized: true });
                }
            },

            // =================================================================
            // CRUD
            // =================================================================

            createOrder: (orderData) => {
                const now = new Date().toISOString();
                const newOrder: SimpleOrder = {
                    ...orderData,
                    id: `ord-${Date.now()}`,
                    createdAt: now,
                    updatedAt: now,
                };

                set((state) => ({
                    orders: [...state.orders, newOrder],
                    lastOrderNumber: state.lastOrderNumber + 1,
                }));

                // Background API sync
                fetch('/api/orders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(orderData),
                }).catch(console.error);

                return newOrder;
            },

            updateOrder: (id, updates) => {
                set((state) => ({
                    orders: state.orders.map((ord) =>
                        ord.id === id ? { ...ord, ...updates, updatedAt: new Date().toISOString() } : ord
                    ),
                }));

                fetch(`/api/orders/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updates),
                }).catch(console.error);
            },

            deleteOrder: (id) => {
                set((state) => ({ orders: state.orders.filter((o) => o.id !== id) }));
                fetch(`/api/orders/${id}`, { method: 'DELETE' }).catch(console.error);
            },

            setCurrentOrder: (order) => set({ currentOrder: order }),

            // =================================================================
            // WIZARD
            // =================================================================

            setWizardStep: (step) => {
                set((state) => ({ wizardState: { ...state.wizardState, step } }));
            },

            updateWizardState: (updates) => {
                set((state) => ({ wizardState: { ...state.wizardState, ...updates } }));
            },

            resetWizard: () => set({ wizardState: initialWizardState }),

            selectOrderForInvoicing: (orderId) => {
                const order = get().orders.find((o) => o.id === orderId);
                if (!order) return;

                const invoiceType = get().getSuggestedInvoiceType(orderId);
                set((state) => ({
                    wizardState: {
                        ...state.wizardState,
                        selectedOrderId: orderId,
                        scope: {
                            items: order.items.map((item) => ({
                                itemId: item.id,
                                quantity: item.quantityRemaining,
                            })),
                        },
                        invoiceType,
                    },
                }));
            },

            // =================================================================
            // INVOICING
            // =================================================================

            markItemsAsInvoiced: (orderId, items) => {
                set((state) => ({
                    orders: state.orders.map((order) => {
                        if (order.id !== orderId) return order;

                        const updatedItems = order.items.map((orderItem) => {
                            const invoicedItem = items.find((i) => i.itemId === orderItem.id);
                            if (!invoicedItem) return orderItem;

                            return {
                                ...orderItem,
                                quantityInvoiced: orderItem.quantityInvoiced + invoicedItem.quantity,
                                quantityRemaining: orderItem.quantityRemaining - invoicedItem.quantity,
                                amountInvoiced: orderItem.amountInvoiced + invoicedItem.amount,
                                amountRemaining: orderItem.amountRemaining - invoicedItem.amount,
                            };
                        });

                        const totalInvoiced = updatedItems.reduce((sum, i) => sum + i.amountInvoiced, 0);
                        const totalRemaining = updatedItems.reduce((sum, i) => sum + i.amountRemaining, 0);

                        let newStatus = order.status;
                        if (totalRemaining <= 0) {
                            newStatus = 'completed';
                        } else if (totalInvoiced > 0) {
                            newStatus = 'partially_completed';
                        }

                        return {
                            ...order,
                            items: updatedItems,
                            amountInvoiced: totalInvoiced,
                            amountRemaining: totalRemaining,
                            status: newStatus,
                            updatedAt: new Date().toISOString(),
                        };
                    }),
                }));
            },

            linkInvoiceToOrder: (orderId, invoiceId, amount) => {
                set((state) => ({
                    orders: state.orders.map((order) =>
                        order.id === orderId
                            ? {
                                ...order,
                                invoiceIds: [...order.invoiceIds, invoiceId],
                                amountInvoiced: order.amountInvoiced + amount,
                                amountRemaining: order.amountRemaining - amount,
                                updatedAt: new Date().toISOString(),
                            }
                            : order
                    ),
                }));
            },

            getSuggestedInvoiceType: (orderId) => {
                const order = get().orders.find((o) => o.id === orderId);
                if (!order) return 'final';

                if (order.amountInvoiced === 0 && order.amountRemaining === order.total) {
                    return 'final';
                }
                if (order.isRecurring) {
                    return 'periodic';
                }
                return 'partial';
            },

            getInvoicingStatus: (orderId) => {
                const order = get().orders.find((o) => o.id === orderId);
                if (!order) return { invoiced: 0, remaining: 0, percentage: 0 };

                const percentage = order.total > 0 ? (order.amountInvoiced / order.total) * 100 : 0;
                return { invoiced: order.amountInvoiced, remaining: order.amountRemaining, percentage };
            },

            // =================================================================
            // VALIDATION
            // =================================================================

            checkDoubleInvoicing: (orderId, amount) => {
                const order = get().orders.find((o) => o.id === orderId);
                if (!order) return { valid: false, warning: 'Order not found' };
                if (amount > order.amountRemaining) {
                    return { valid: false, warning: `Amount exceeds remaining balance of ${order.amountRemaining.toFixed(2)}` };
                }
                return { valid: true };
            },

            generateOrderNumber: () => {
                const year = new Date().getFullYear();
                const nextNum = get().lastOrderNumber + 1;
                return `ORD-${year}-${nextNum.toString().padStart(3, '0')}`;
            },
        }),
        {
            name: 'primebalance-orders',
            partialize: (state) => ({
                orders: state.orders,
                lastOrderNumber: state.lastOrderNumber,
            }),
        }
    )
);