/* import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Order, OrderItem, OrderParty, FakturierungWizardState, InvoiceType } from '@/types/order';

// =============================================================================
// ORDER STORE
// =============================================================================

interface OrderState {
    orders: Order[];
    currentOrder: Order | null;
    wizardState: FakturierungWizardState;
    lastOrderNumber: number;

    // Order CRUD
    createOrder: (order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) => Order;
    updateOrder: (id: string, updates: Partial<Order>) => void;
    deleteOrder: (id: string) => void;
    setCurrentOrder: (order: Order | null) => void;

    // Wizard
    setWizardStep: (step: number) => void;
    updateWizardState: (updates: Partial<FakturierungWizardState>) => void;
    resetWizard: () => void;
    selectOrderForInvoicing: (orderId: string) => void;

    // Invoicing
    markItemsAsInvoiced: (orderId: string, items: Array<{ itemId: string; quantity: number; amount: number }>) => void;
    linkInvoiceToOrder: (orderId: string, invoiceId: string, amount: number) => void;
    getSuggestedInvoiceType: (orderId: string) => InvoiceType;
    getInvoicingStatus: (orderId: string) => { invoiced: number; remaining: number; percentage: number };

    // Validation
    checkDoubleInvoicing: (orderId: string, amount: number) => { valid: boolean; warning?: string };

    // Helpers
    generateOrderNumber: () => string;
    calculateOrderTotals: (items: OrderItem[], taxRate: number) => { subtotal: number; taxAmount: number; total: number };
}

const initialWizardState: FakturierungWizardState = {
    step: 1,
    selectedOrderId: null,
    invoiceType: 'final',
    scope: {},
    applyTax: true,
    taxRate: 19,
    invoiceDate: new Date().toISOString().split('T')[0],
    paymentDays: 14,
    notes: '',
};

// Demo orders
const generateDemoOrders = (): Order[] => [
    {
        id: 'ord-001',
        orderNumber: 'ORD-2025-001',
        status: 'completed',
        customer: {
            name: 'Hans Schmidt',
            company: 'Schmidt & Partner GmbH',
            address: 'Hauptstraße 45',
            city: 'Berlin',
            postalCode: '10115',
            country: 'DE',
            email: 'hans@schmidt-partner.de',
            vatId: 'DE987654321',
        },
        seller: {
            name: 'Max Mustermann',
            company: 'Mustermann GmbH',
            address: 'Musterstraße 123',
            city: 'München',
            postalCode: '80331',
            country: 'DE',
            vatId: 'DE123456789',
        },
        customerType: 'b2b',
        isCrossBorder: false,
        items: [
            { id: 'i1', description: 'Webdesign Firmenhomepage', quantity: 1, unitPrice: 2500, unit: 'flat', taxRate: 19, total: 2500, quantityInvoiced: 0, quantityRemaining: 1, amountInvoiced: 0, amountRemaining: 2500 },
            { id: 'i2', description: 'SEO Optimierung', quantity: 10, unitPrice: 150, unit: 'hour', taxRate: 19, total: 1500, quantityInvoiced: 0, quantityRemaining: 10, amountInvoiced: 0, amountRemaining: 1500 },
        ],
        currency: 'EUR',
        subtotal: 4000,
        taxAmount: 760,
        total: 4760,
        amountInvoiced: 0,
        amountRemaining: 4760,
        invoiceIds: [],
        orderDate: '2025-11-01',
        deliveryDate: '2025-12-15',
        isRecurring: false,
        createdAt: '2025-11-01T10:00:00Z',
        updatedAt: '2025-11-01T10:00:00Z',
    },
    {
        id: 'ord-002',
        orderNumber: 'ORD-2025-002',
        status: 'in_progress',
        customer: {
            name: 'Marie Dupont',
            company: 'Dupont SARL',
            address: '15 Rue de la Paix',
            city: 'Paris',
            postalCode: '75001',
            country: 'FR',
            email: 'marie@dupont.fr',
            vatId: 'FR12345678901',
        },
        seller: {
            name: 'Max Mustermann',
            company: 'Mustermann GmbH',
            address: 'Musterstraße 123',
            city: 'München',
            postalCode: '80331',
            country: 'DE',
            vatId: 'DE123456789',
        },
        customerType: 'b2b',
        isCrossBorder: true,
        items: [
            { id: 'i1', description: 'Software Development', quantity: 80, unitPrice: 120, unit: 'hour', taxRate: 0, total: 9600, quantityInvoiced: 40, quantityRemaining: 40, amountInvoiced: 4800, amountRemaining: 4800 },
        ],
        currency: 'EUR',
        subtotal: 9600,
        taxAmount: 0,
        total: 9600,
        amountInvoiced: 4800,
        amountRemaining: 4800,
        invoiceIds: ['inv-partial-001'],
        orderDate: '2025-10-15',
        servicePeriodStart: '2025-10-15',
        servicePeriodEnd: '2025-12-31',
        isRecurring: false,
        createdAt: '2025-10-15T09:00:00Z',
        updatedAt: '2025-12-01T14:00:00Z',
    },
    {
        id: 'ord-003',
        orderNumber: 'ORD-2025-003',
        status: 'confirmed',
        customer: {
            name: 'Tech Solutions AG',
            company: 'Tech Solutions AG',
            address: 'Bahnhofstrasse 10',
            city: 'Zürich',
            postalCode: '8001',
            country: 'CH',
            email: 'info@techsolutions.ch',
        },
        seller: {
            name: 'Max Mustermann',
            company: 'Mustermann GmbH',
            address: 'Musterstraße 123',
            city: 'München',
            postalCode: '80331',
            country: 'DE',
            vatId: 'DE123456789',
        },
        customerType: 'b2b',
        isCrossBorder: true,
        items: [
            { id: 'i1', description: 'Monthly IT Support', quantity: 12, unitPrice: 500, unit: 'month', taxRate: 0, total: 6000, quantityInvoiced: 0, quantityRemaining: 12, amountInvoiced: 0, amountRemaining: 6000 },
        ],
        currency: 'CHF',
        subtotal: 6000,
        taxAmount: 0,
        total: 6000,
        amountInvoiced: 0,
        amountRemaining: 6000,
        invoiceIds: [],
        orderDate: '2025-12-01',
        servicePeriodStart: '2025-01-01',
        servicePeriodEnd: '2025-12-31',
        isRecurring: true,
        recurringInterval: 'monthly',
        createdAt: '2025-12-01T08:00:00Z',
        updatedAt: '2025-12-01T08:00:00Z',
    },
];

export const useOrderStore = create<OrderState>()(
    persist(
        (set, get) => ({
            orders: generateDemoOrders(),
            currentOrder: null,
            wizardState: initialWizardState,
            lastOrderNumber: 3,

            createOrder: (orderData) => {
                const now = new Date().toISOString();
                const newOrder: Order = {
                    ...orderData,
                    id: `ord-${Date.now()}`,
                    createdAt: now,
                    updatedAt: now,
                };
                set((state) => ({
                    orders: [...state.orders, newOrder],
                    lastOrderNumber: state.lastOrderNumber + 1,
                }));
                return newOrder;
            },

            updateOrder: (id, updates) => {
                set((state) => ({
                    orders: state.orders.map((ord) =>
                        ord.id === id ? { ...ord, ...updates, updatedAt: new Date().toISOString() } : ord
                    ),
                }));
            },

            deleteOrder: (id) => {
                set((state) => ({ orders: state.orders.filter((o) => o.id !== id) }));
            },

            setCurrentOrder: (order) => set({ currentOrder: order }),

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
                        invoiceType,
                        applyTax: order.taxAmount > 0,
                        taxRate: order.items[0]?.taxRate || 19,
                    },
                }));
            },

            markItemsAsInvoiced: (orderId, items) => {
                set((state) => ({
                    orders: state.orders.map((order) => {
                        if (order.id !== orderId) return order;

                        const updatedItems = order.items.map((item) => {
                            const invoicedItem = items.find((i) => i.itemId === item.id);
                            if (!invoicedItem) return item;

                            return {
                                ...item,
                                quantityInvoiced: item.quantityInvoiced + invoicedItem.quantity,
                                quantityRemaining: item.quantityRemaining - invoicedItem.quantity,
                                amountInvoiced: item.amountInvoiced + invoicedItem.amount,
                                amountRemaining: item.amountRemaining - invoicedItem.amount,
                            };
                        });

                        const totalInvoiced = items.reduce((sum, i) => sum + i.amount, 0);

                        return {
                            ...order,
                            items: updatedItems,
                            amountInvoiced: order.amountInvoiced + totalInvoiced,
                            amountRemaining: order.amountRemaining - totalInvoiced,
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
                                status: order.amountRemaining - amount <= 0 ? 'completed' : order.status,
                                updatedAt: new Date().toISOString(),
                            }
                            : order
                    ),
                }));
            },

            getSuggestedInvoiceType: (orderId) => {
                const order = get().orders.find((o) => o.id === orderId);
                if (!order) return 'final';

                if (order.isRecurring) return 'periodic';
                if (order.status === 'completed' && order.amountInvoiced === 0) return 'final';
                if (order.status === 'completed' && order.amountInvoiced > 0) return 'final'; // Schlussrechnung
                if (order.status === 'in_progress' || order.status === 'partially_completed') return 'partial';
                if (order.status === 'confirmed' && order.amountInvoiced === 0) return 'advance';

                return 'final';
            },

            getInvoicingStatus: (orderId) => {
                const order = get().orders.find((o) => o.id === orderId);
                if (!order) return { invoiced: 0, remaining: 0, percentage: 0 };

                return {
                    invoiced: order.amountInvoiced,
                    remaining: order.amountRemaining,
                    percentage: order.total > 0 ? (order.amountInvoiced / order.total) * 100 : 0,
                };
            },

            checkDoubleInvoicing: (orderId, amount) => {
                const order = get().orders.find((o) => o.id === orderId);
                if (!order) return { valid: false, warning: 'Order not found' };

                if (amount > order.amountRemaining) {
                    return {
                        valid: false,
                        warning: `Amount exceeds remaining balance. Maximum: ${order.amountRemaining.toFixed(2)} ${order.currency}`,
                    };
                }

                if (order.amountInvoiced > 0 && amount === order.total) {
                    return {
                        valid: false,
                        warning: 'This order has already been partially invoiced. Create a final invoice for the remaining amount instead.',
                    };
                }

                return { valid: true };
            },

            generateOrderNumber: () => {
                const year = new Date().getFullYear();
                const nextNum = get().lastOrderNumber + 1;
                return `ORD-${year}-${String(nextNum).padStart(3, '0')}`;
            },

            calculateOrderTotals: (items, taxRate) => {
                const subtotal = items.reduce((sum, item) => sum + item.total, 0);
                const taxAmount = subtotal * (taxRate / 100);
                return { subtotal, taxAmount, total: subtotal + taxAmount };
            },
        }),
        { name: 'primebalance-orders' }
    )
); */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// =============================================================================
// SIMPLIFIED ORDER TYPES FOR STORE (Compatible with Enhanced Types)
// =============================================================================
// These are the working types used by the store and UI components.
// The enhanced types in types/order.ts are for future API/database use.
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
// ORDER STORE
// =============================================================================

interface OrderState {
    orders: SimpleOrder[];
    currentOrder: SimpleOrder | null;
    wizardState: SimpleFakturierungWizardState;
    lastOrderNumber: number;

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

    // Helpers
    generateOrderNumber: () => string;
    calculateOrderTotals: (items: SimpleOrderItem[], taxRate: number) => { subtotal: number; taxAmount: number; total: number };
}

const initialWizardState: SimpleFakturierungWizardState = {
    step: 1,
    selectedOrderId: null,
    invoiceType: 'final',
    scope: {},
    applyTax: true,
    taxRate: 19,
    invoiceDate: new Date().toISOString().split('T')[0],
    paymentDays: 14,
    notes: '',
};

// Demo orders
const generateDemoOrders = (): SimpleOrder[] => [
    {
        id: 'ord-001',
        orderNumber: 'ORD-2025-001',
        status: 'completed',
        customer: {
            name: 'Hans Schmidt',
            company: 'Schmidt & Partner GmbH',
            address: 'Hauptstraße 45',
            city: 'Berlin',
            postalCode: '10115',
            country: 'DE',
            email: 'hans@schmidt-partner.de',
            vatId: 'DE987654321',
        },
        seller: {
            name: 'Max Mustermann',
            company: 'Mustermann GmbH',
            address: 'Musterstraße 123',
            city: 'München',
            postalCode: '80331',
            country: 'DE',
            vatId: 'DE123456789',
        },
        customerType: 'b2b',
        isCrossBorder: false,
        items: [
            { id: 'i1', description: 'Webdesign Firmenhomepage', quantity: 1, unitPrice: 2500, unit: 'flat', taxRate: 19, total: 2500, quantityInvoiced: 0, quantityRemaining: 1, amountInvoiced: 0, amountRemaining: 2500 },
            { id: 'i2', description: 'SEO Optimierung', quantity: 10, unitPrice: 150, unit: 'hour', taxRate: 19, total: 1500, quantityInvoiced: 0, quantityRemaining: 10, amountInvoiced: 0, amountRemaining: 1500 },
        ],
        currency: 'EUR',
        subtotal: 4000,
        taxAmount: 760,
        total: 4760,
        amountInvoiced: 0,
        amountRemaining: 4760,
        invoiceIds: [],
        orderDate: '2025-11-01',
        deliveryDate: '2025-11-15',
        isRecurring: false,
        createdAt: '2025-11-01T10:00:00Z',
        updatedAt: '2025-11-01T10:00:00Z',
    },
    {
        id: 'ord-002',
        orderNumber: 'ORD-2025-002',
        status: 'in_progress',
        customer: {
            name: 'Maria Weber',
            company: 'Weber Consulting',
            address: 'Lindenstraße 12',
            city: 'Hamburg',
            postalCode: '20095',
            country: 'DE',
            email: 'maria@weber-consulting.de',
            vatId: 'DE111222333',
        },
        seller: {
            name: 'Max Mustermann',
            company: 'Mustermann GmbH',
            address: 'Musterstraße 123',
            city: 'München',
            postalCode: '80331',
            country: 'DE',
            vatId: 'DE123456789',
        },
        customerType: 'b2b',
        isCrossBorder: false,
        items: [
            { id: 'i1', description: 'Mobile App Development', quantity: 1, unitPrice: 15000, unit: 'flat', taxRate: 19, total: 15000, quantityInvoiced: 0, quantityRemaining: 1, amountInvoiced: 0, amountRemaining: 15000 },
        ],
        currency: 'EUR',
        subtotal: 15000,
        taxAmount: 2850,
        total: 17850,
        amountInvoiced: 0,
        amountRemaining: 17850,
        invoiceIds: [],
        orderDate: '2025-12-01',
        servicePeriodStart: '2025-12-01',
        servicePeriodEnd: '2026-03-31',
        isRecurring: false,
        createdAt: '2025-12-01T09:00:00Z',
        updatedAt: '2025-12-01T09:00:00Z',
    },
    {
        id: 'ord-003',
        orderNumber: 'ORD-2025-003',
        status: 'confirmed',
        customer: {
            name: 'Pierre Dubois',
            company: 'Tech Solutions SA',
            address: 'Rue de Lausanne 45',
            city: 'Geneva',
            postalCode: '1201',
            country: 'CH',
            vatId: 'CHE-123.456.789',
        },
        seller: {
            name: 'Max Mustermann',
            company: 'Mustermann GmbH',
            address: 'Musterstraße 123',
            city: 'München',
            postalCode: '80331',
            country: 'DE',
            vatId: 'DE123456789',
        },
        customerType: 'b2b',
        isCrossBorder: true,
        items: [
            { id: 'i1', description: 'Monthly IT Support', quantity: 12, unitPrice: 500, unit: 'month', taxRate: 0, total: 6000, quantityInvoiced: 0, quantityRemaining: 12, amountInvoiced: 0, amountRemaining: 6000 },
        ],
        currency: 'CHF',
        subtotal: 6000,
        taxAmount: 0,
        total: 6000,
        amountInvoiced: 0,
        amountRemaining: 6000,
        invoiceIds: [],
        orderDate: '2025-12-01',
        servicePeriodStart: '2025-01-01',
        servicePeriodEnd: '2025-12-31',
        isRecurring: true,
        recurringInterval: 'monthly',
        createdAt: '2025-12-01T08:00:00Z',
        updatedAt: '2025-12-01T08:00:00Z',
    },
];

export const useOrderStore = create<OrderState>()(
    persist(
        (set, get) => ({
            orders: generateDemoOrders(),
            currentOrder: null,
            wizardState: initialWizardState,
            lastOrderNumber: 3,

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
                return newOrder;
            },

            updateOrder: (id, updates) => {
                set((state) => ({
                    orders: state.orders.map((ord) =>
                        ord.id === id ? { ...ord, ...updates, updatedAt: new Date().toISOString() } : ord
                    ),
                }));
            },

            deleteOrder: (id) => {
                set((state) => ({ orders: state.orders.filter((o) => o.id !== id) }));
            },

            setCurrentOrder: (order) => set({ currentOrder: order }),

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
                        invoiceType,
                        applyTax: order.taxAmount > 0,
                        taxRate: order.items[0]?.taxRate || 19,
                    },
                }));
            },

            markItemsAsInvoiced: (orderId, items) => {
                set((state) => ({
                    orders: state.orders.map((order) => {
                        if (order.id !== orderId) return order;

                        const updatedItems = order.items.map((item) => {
                            const invoicedItem = items.find((i) => i.itemId === item.id);
                            if (!invoicedItem) return item;

                            return {
                                ...item,
                                quantityInvoiced: item.quantityInvoiced + invoicedItem.quantity,
                                quantityRemaining: item.quantityRemaining - invoicedItem.quantity,
                                amountInvoiced: item.amountInvoiced + invoicedItem.amount,
                                amountRemaining: item.amountRemaining - invoicedItem.amount,
                            };
                        });

                        const totalInvoiced = items.reduce((sum, i) => sum + i.amount, 0);

                        return {
                            ...order,
                            items: updatedItems,
                            amountInvoiced: order.amountInvoiced + totalInvoiced,
                            amountRemaining: order.amountRemaining - totalInvoiced,
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
                                status: order.amountRemaining - amount <= 0 ? 'completed' : order.status,
                                updatedAt: new Date().toISOString(),
                            }
                            : order
                    ),
                }));
            },

            getSuggestedInvoiceType: (orderId) => {
                const order = get().orders.find((o) => o.id === orderId);
                if (!order) return 'final';

                if (order.isRecurring) return 'periodic';
                if (order.status === 'completed' && order.amountInvoiced === 0) return 'final';
                if (order.status === 'completed' && order.amountInvoiced > 0) return 'final';
                if (order.status === 'in_progress' || order.status === 'partially_completed') return 'partial';
                if (order.status === 'confirmed' && order.amountInvoiced === 0) return 'advance';

                return 'final';
            },

            getInvoicingStatus: (orderId) => {
                const order = get().orders.find((o) => o.id === orderId);
                if (!order) return { invoiced: 0, remaining: 0, percentage: 0 };

                return {
                    invoiced: order.amountInvoiced,
                    remaining: order.amountRemaining,
                    percentage: order.total > 0 ? (order.amountInvoiced / order.total) * 100 : 0,
                };
            },

            checkDoubleInvoicing: (orderId, amount) => {
                const order = get().orders.find((o) => o.id === orderId);
                if (!order) return { valid: false, warning: 'Order not found' };

                if (amount > order.amountRemaining) {
                    return {
                        valid: false,
                        warning: `Amount exceeds remaining balance. Maximum: ${order.amountRemaining.toFixed(2)} ${order.currency}`,
                    };
                }

                if (order.amountInvoiced > 0 && amount === order.total) {
                    return {
                        valid: false,
                        warning: 'This order has already been partially invoiced. Create a final invoice for the remaining amount instead.',
                    };
                }

                return { valid: true };
            },

            generateOrderNumber: () => {
                const year = new Date().getFullYear();
                const num = get().lastOrderNumber + 1;
                return `ORD-${year}-${String(num).padStart(3, '0')}`;
            },

            calculateOrderTotals: (items, taxRate) => {
                const subtotal = items.reduce((sum, item) => sum + item.total, 0);
                const taxAmount = subtotal * (taxRate / 100);
                return {
                    subtotal,
                    taxAmount,
                    total: subtotal + taxAmount,
                };
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

// Re-export types for use in components
export type { SimpleOrder as Order, SimpleOrderItem as OrderItem, SimpleOrderParty as OrderParty, SimpleOrderStatus as OrderStatus, SimpleCustomerType as CustomerType, SimpleInvoiceType as InvoiceType, SimpleFakturierungWizardState as FakturierungWizardState };