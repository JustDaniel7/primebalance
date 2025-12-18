import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Order, OrderItem, OrderParty, FakturierungWizardState, InvoiceType } from '@/types/order';

// =============================================================================
// ORDER STORE - API CONNECTED
// =============================================================================

interface OrderState {
    orders: Order[];
    currentOrder: Order | null;
    wizardState: FakturierungWizardState;
    lastOrderNumber: number;
    isLoading: boolean;
    error: string | null;
    isInitialized: boolean;

    // API Actions
    fetchOrders: () => Promise<void>;

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

    // Utils
    generateOrderNumber: () => string;
}

const initialWizardState: FakturierungWizardState = {
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

function mapApiToOrder(api: any): Order {
    return {
        id: api.id,
        orderNumber: api.orderNumber,
        status: api.status,
        customer: api.customer || {
            name: api.customerName || '',
            company: api.customerCompany,
            address: api.customerAddress || '',
            city: api.customerCity || '',
            postalCode: api.customerPostalCode || '',
            country: api.customerCountry || '',
            email: api.customerEmail,
            vatId: api.customerVatId,
        },
        seller: api.seller || {},
        customerType: api.customerType || 'b2b',
        isCrossBorder: api.isCrossBorder || false,
        items: (api.items || []).map((item: any) => ({
            id: item.id,
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

            fetchOrders: async () => {
                set({ isLoading: true, error: null });
                try {
                    const response = await fetch('/api/orders');
                    if (!response.ok) throw new Error('Failed to fetch orders');
                    const data = await response.json();
                    const orders = (data.orders || data || []).map(mapApiToOrder);
                    const maxNumber = orders.reduce((max: number, ord: Order) => {
                        const num = parseInt(ord.orderNumber.replace(/\D/g, '')) || 0;
                        return num > max ? num : max;
                    }, 0);
                    set({ orders, lastOrderNumber: maxNumber, isLoading: false, isInitialized: true });
                } catch (error) {
                    console.error('Failed to fetch orders:', error);
                    set({ error: (error as Error).message, isLoading: false, isInitialized: true });
                }
            },

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
                        ord.id === id
                            ? { ...ord, ...updates, updatedAt: new Date().toISOString() }
                            : ord
                    ),
                }));

                fetch(`/api/orders/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updates),
                }).catch(console.error);
            },

            deleteOrder: (id) => {
                set((state) => ({
                    orders: state.orders.filter((ord) => ord.id !== id),
                }));

                fetch(`/api/orders/${id}`, { method: 'DELETE' }).catch(console.error);
            },

            setCurrentOrder: (order) => set({ currentOrder: order }),

            setWizardStep: (step) => set((state) => ({ wizardState: { ...state.wizardState, step } })),

            updateWizardState: (updates) => set((state) => ({ wizardState: { ...state.wizardState, ...updates } })),

            resetWizard: () => set({ wizardState: initialWizardState }),

            selectOrderForInvoicing: (orderId) => {
                const order = get().orders.find((o) => o.id === orderId);
                if (!order) return;
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
                    },
                }));
            },

            markItemsAsInvoiced: (orderId, items) => {
                set((state) => ({
                    orders: state.orders.map((order) => {
                        if (order.id !== orderId) return order;
                        const totalInvoiced = items.reduce((sum, i) => sum + i.amount, 0);
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
                    orders: state.orders.map((order) => {
                        if (order.id !== orderId) return order;
                        return {
                            ...order,
                            invoiceIds: [...order.invoiceIds, invoiceId],
                            updatedAt: new Date().toISOString(),
                        };
                    }),
                }));
            },

            getSuggestedInvoiceType: (orderId) => {
                const order = get().orders.find((o) => o.id === orderId);
                if (!order) return 'final';
                if (order.amountInvoiced === 0) return 'final';
                if (order.amountInvoiced < order.total) return 'partial';
                return 'final';
            },

            getInvoicingStatus: (orderId) => {
                const order = get().orders.find((o) => o.id === orderId);
                if (!order) return { invoiced: 0, remaining: 0, percentage: 0 };
                const percentage = order.total > 0 ? (order.amountInvoiced / order.total) * 100 : 0;
                return { invoiced: order.amountInvoiced, remaining: order.amountRemaining, percentage };
            },

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