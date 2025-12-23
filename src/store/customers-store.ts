import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
    Customer,
    PaymentRecord,
    CreditEvent,
    RevenueRecord,
    RiskIndicator,
    CustomerContact,
    CustomerAnalytics,
    CustomerStatus,
    CUSTOMER_TYPES,
    RiskLevel,
    PaymentBehavior,
    CreditStatus,
} from '@/types/customers';

// =============================================================================
// DEMO DATA
// =============================================================================

const generateDemoCustomers = (): Customer[] => {
    const now = new Date();
    return [
        {
            id: 'cust-1',
            customerNumber: 'C-10001',
            name: 'Acme Corporation',
            legalName: 'Acme Corporation Inc.',
            type: 'enterprise',
            status: 'active',
            email: 'accounts@acmecorp.com',
            phone: '+1 (555) 123-4567',
            website: 'https://acmecorp.com',
            address: { street: '123 Business Ave', city: 'San Francisco', state: 'CA', postalCode: '94102', country: 'USA' },
            industry: 'Technology',
            taxId: '12-3456789',
            employeeCount: 500,
            annualRevenue: 50000000,
            accountManagerName: 'Sarah Johnson',
            segment: 'Enterprise',
            tags: ['strategic', 'tech'],
            customerSince: '2020-03-15',
            lastActivityDate: now.toISOString(),
            lastPurchaseDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            totalRevenue: 1250000,
            totalOrders: 48,
            averageOrderValue: 26041.67,
            outstandingBalance: 45000,
            creditLimit: 200000,
            creditUsed: 45000,
            creditAvailable: 155000,
            creditStatus: 'approved',
            paymentTerms: 'Net 30',
            riskLevel: 'low',
            riskScore: 15,
            paymentBehavior: 'excellent',
            averageDaysToPayment: 22,
            latePaymentCount: 1,
            createdAt: '2020-03-15T00:00:00Z',
            updatedAt: now.toISOString(),
        },
        {
            id: 'cust-2',
            customerNumber: 'C-10002',
            name: 'Global Industries Ltd',
            type: 'enterprise',
            status: 'active',
            email: 'finance@globalind.com',
            phone: '+1 (555) 234-5678',
            address: { street: '456 Industrial Blvd', city: 'Chicago', state: 'IL', postalCode: '60601', country: 'USA' },
            industry: 'Manufacturing',
            employeeCount: 2000,
            annualRevenue: 200000000,
            accountManagerName: 'Mike Chen',
            segment: 'Enterprise',
            tags: ['manufacturing', 'high-volume'],
            customerSince: '2019-08-20',
            lastActivityDate: now.toISOString(),
            lastPurchaseDate: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(),
            totalRevenue: 3500000,
            totalOrders: 156,
            averageOrderValue: 22435.90,
            outstandingBalance: 180000,
            creditLimit: 500000,
            creditUsed: 180000,
            creditAvailable: 320000,
            creditStatus: 'approved',
            paymentTerms: 'Net 45',
            riskLevel: 'medium',
            riskScore: 42,
            paymentBehavior: 'good',
            averageDaysToPayment: 38,
            latePaymentCount: 8,
            createdAt: '2019-08-20T00:00:00Z',
            updatedAt: now.toISOString(),
        },
        {
            id: 'cust-3',
            customerNumber: 'C-10003',
            name: 'StartUp Innovations',
            type: 'business',
            status: 'active',
            email: 'billing@startupinno.io',
            phone: '+1 (555) 345-6789',
            industry: 'Technology',
            employeeCount: 25,
            annualRevenue: 2000000,
            segment: 'SMB',
            tags: ['startup', 'growth'],
            customerSince: '2023-06-01',
            lastActivityDate: now.toISOString(),
            lastPurchaseDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            totalRevenue: 85000,
            totalOrders: 12,
            averageOrderValue: 7083.33,
            outstandingBalance: 25000,
            creditLimit: 50000,
            creditUsed: 25000,
            creditAvailable: 25000,
            creditStatus: 'approved',
            paymentTerms: 'Net 30',
            riskLevel: 'high',
            riskScore: 68,
            paymentBehavior: 'fair',
            averageDaysToPayment: 45,
            latePaymentCount: 5,
            createdAt: '2023-06-01T00:00:00Z',
            updatedAt: now.toISOString(),
        },
        {
            id: 'cust-4',
            customerNumber: 'C-10004',
            name: 'Legacy Systems Co',
            type: 'business',
            status: 'churned',
            email: 'contact@legacysys.com',
            industry: 'Technology',
            employeeCount: 150,
            customerSince: '2018-01-10',
            lastActivityDate: new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000).toISOString(),
            totalRevenue: 450000,
            totalOrders: 28,
            averageOrderValue: 16071.43,
            outstandingBalance: 15000,
            creditLimit: 100000,
            creditUsed: 15000,
            creditAvailable: 85000,
            creditStatus: 'suspended',
            paymentTerms: 'Net 30',
            riskLevel: 'critical',
            riskScore: 85,
            paymentBehavior: 'poor',
            averageDaysToPayment: 72,
            latePaymentCount: 18,
            createdAt: '2018-01-10T00:00:00Z',
            updatedAt: now.toISOString(),
        },
        {
            id: 'cust-5',
            customerNumber: 'C-10005',
            name: 'Healthcare Partners',
            type: 'enterprise',
            status: 'active',
            email: 'ap@healthcarepartners.org',
            phone: '+1 (555) 456-7890',
            industry: 'Healthcare',
            employeeCount: 800,
            annualRevenue: 100000000,
            accountManagerName: 'Lisa Wong',
            segment: 'Enterprise',
            tags: ['healthcare', 'compliance'],
            customerSince: '2021-02-28',
            lastActivityDate: now.toISOString(),
            lastPurchaseDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            totalRevenue: 890000,
            totalOrders: 34,
            averageOrderValue: 26176.47,
            outstandingBalance: 65000,
            creditLimit: 300000,
            creditUsed: 65000,
            creditAvailable: 235000,
            creditStatus: 'approved',
            paymentTerms: 'Net 60',
            riskLevel: 'low',
            riskScore: 12,
            paymentBehavior: 'excellent',
            averageDaysToPayment: 28,
            latePaymentCount: 0,
            createdAt: '2021-02-28T00:00:00Z',
            updatedAt: now.toISOString(),
        },
    ];
};

const generateDemoPayments = (): PaymentRecord[] => {
    const now = new Date();
    return [
        { id: 'pay-1', customerId: 'cust-1', invoiceNumber: 'INV-2024-001', amount: 25000, currency: 'USD', invoiceDate: '2024-11-01', dueDate: '2024-12-01', paymentDate: '2024-11-25', status: 'paid', daysToPayment: 24, paymentMethod: 'Wire Transfer', createdAt: now.toISOString() },
        { id: 'pay-2', customerId: 'cust-1', invoiceNumber: 'INV-2024-002', amount: 20000, currency: 'USD', invoiceDate: '2024-12-01', dueDate: '2024-12-31', status: 'pending', createdAt: now.toISOString() },
        { id: 'pay-3', customerId: 'cust-2', invoiceNumber: 'INV-2024-003', amount: 75000, currency: 'USD', invoiceDate: '2024-10-15', dueDate: '2024-11-29', paymentDate: '2024-12-05', status: 'paid', daysToPayment: 51, daysOverdue: 6, paymentMethod: 'ACH', createdAt: now.toISOString() },
        { id: 'pay-4', customerId: 'cust-3', invoiceNumber: 'INV-2024-004', amount: 15000, currency: 'USD', invoiceDate: '2024-11-15', dueDate: '2024-12-15', status: 'pending', createdAt: now.toISOString() },
        { id: 'pay-5', customerId: 'cust-3', invoiceNumber: 'INV-2024-005', amount: 10000, currency: 'USD', invoiceDate: '2024-10-01', dueDate: '2024-10-31', status: 'overdue', daysOverdue: 50, createdAt: now.toISOString() },
        { id: 'pay-6', customerId: 'cust-4', invoiceNumber: 'INV-2024-006', amount: 15000, currency: 'USD', invoiceDate: '2024-06-01', dueDate: '2024-07-01', status: 'overdue', daysOverdue: 172, createdAt: now.toISOString() },
    ];
};

const generateDemoRiskIndicators = (): RiskIndicator[] => {
    const now = new Date();
    return [
        { id: 'risk-1', customerId: 'cust-3', category: 'payment', indicator: 'Late Payments', description: '5 late payments in the last 12 months', severity: 'high', score: 25, status: 'active', detectedAt: now.toISOString(), recommendedAction: 'Review payment terms and consider requiring deposits', createdAt: now.toISOString(), updatedAt: now.toISOString() },
        { id: 'risk-2', customerId: 'cust-3', category: 'credit', indicator: 'High Credit Utilization', description: 'Credit utilization at 50% of limit', severity: 'medium', score: 15, status: 'monitoring', detectedAt: now.toISOString(), createdAt: now.toISOString(), updatedAt: now.toISOString() },
        { id: 'risk-3', customerId: 'cust-4', category: 'activity', indicator: 'No Recent Activity', description: 'No orders in the last 180 days', severity: 'high', score: 20, status: 'active', detectedAt: now.toISOString(), recommendedAction: 'Reach out to customer for re-engagement', createdAt: now.toISOString(), updatedAt: now.toISOString() },
        { id: 'risk-4', customerId: 'cust-4', category: 'payment', indicator: 'Outstanding Balance', description: 'Invoice overdue by 172 days', severity: 'critical', score: 40, status: 'active', detectedAt: now.toISOString(), recommendedAction: 'Escalate to collections', createdAt: now.toISOString(), updatedAt: now.toISOString() },
        { id: 'risk-5', customerId: 'cust-2', category: 'payment', indicator: 'Payment Pattern Degradation', description: 'Average payment time increased from 35 to 45 days', severity: 'medium', score: 15, status: 'monitoring', detectedAt: now.toISOString(), createdAt: now.toISOString(), updatedAt: now.toISOString() },
    ];
};

const generateDemoRevenue = (): RevenueRecord[] => {
    return [
        { id: 'rev-1', customerId: 'cust-1', period: '2024-Q3', periodType: 'quarterly', revenue: 320000, cost: 180000, profit: 140000, margin: 43.75, orderCount: 12, averageOrderValue: 26666.67, createdAt: new Date().toISOString() },
        { id: 'rev-2', customerId: 'cust-1', period: '2024-Q4', periodType: 'quarterly', revenue: 280000, cost: 160000, profit: 120000, margin: 42.86, orderCount: 10, averageOrderValue: 28000, createdAt: new Date().toISOString() },
        { id: 'rev-3', customerId: 'cust-2', period: '2024-Q3', periodType: 'quarterly', revenue: 850000, cost: 520000, profit: 330000, margin: 38.82, orderCount: 38, averageOrderValue: 22368.42, createdAt: new Date().toISOString() },
        { id: 'rev-4', customerId: 'cust-2', period: '2024-Q4', periodType: 'quarterly', revenue: 920000, cost: 550000, profit: 370000, margin: 40.22, orderCount: 42, averageOrderValue: 21904.76, createdAt: new Date().toISOString() },
    ];
};

const generateDemoContacts = (): CustomerContact[] => {
    return [
        { id: 'contact-1', customerId: 'cust-1', name: 'John Smith', title: 'CFO', email: 'jsmith@acmecorp.com', phone: '+1 (555) 123-4568', isPrimary: true, role: 'billing', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'contact-2', customerId: 'cust-1', name: 'Emily Davis', title: 'Procurement Manager', email: 'edavis@acmecorp.com', phone: '+1 (555) 123-4569', isPrimary: false, role: 'purchasing', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'contact-3', customerId: 'cust-2', name: 'Robert Wilson', title: 'VP Finance', email: 'rwilson@globalind.com', isPrimary: true, role: 'executive', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ];
};

// =============================================================================
// STORE
// =============================================================================

interface CustomersState {
    customers: Customer[];
    payments: PaymentRecord[];
    creditEvents: CreditEvent[];
    revenue: RevenueRecord[];
    riskIndicators: RiskIndicator[];
    contacts: CustomerContact[];

    selectedCustomerId: string | null;

    // Customers
    createCustomer: (customer: Omit<Customer, 'id' | 'customerNumber' | 'createdAt' | 'updatedAt'>) => Customer;
    updateCustomer: (id: string, updates: Partial<Customer>) => void;
    deleteCustomer: (id: string) => void;

    // Credit
    updateCreditLimit: (customerId: string, newLimit: number, reason: string) => void;
    updateCreditStatus: (customerId: string, status: CreditStatus, reason: string) => void;

    // Risk
    addRiskIndicator: (indicator: Omit<RiskIndicator, 'id' | 'createdAt' | 'updatedAt'>) => RiskIndicator;
    resolveRiskIndicator: (id: string, actionTaken: string) => void;

    // Contacts
    addContact: (contact: Omit<CustomerContact, 'id' | 'createdAt' | 'updatedAt'>) => CustomerContact;
    updateContact: (id: string, updates: Partial<CustomerContact>) => void;
    deleteContact: (id: string) => void;

    // Analytics
    getAnalytics: () => CustomerAnalytics;
    getCustomerPayments: (customerId: string) => PaymentRecord[];
    getCustomerRevenue: (customerId: string) => RevenueRecord[];
    getCustomerRiskIndicators: (customerId: string) => RiskIndicator[];
    getCustomerContacts: (customerId: string) => CustomerContact[];

    // Selection
    selectCustomer: (id: string | null) => void;
}

export const useCustomersStore = create<CustomersState>()(
    persist(
        (set, get) => ({
            customers: generateDemoCustomers(),
            payments: generateDemoPayments(),
            creditEvents: [],
            revenue: generateDemoRevenue(),
            riskIndicators: generateDemoRiskIndicators(),
            contacts: generateDemoContacts(),
            selectedCustomerId: null,

            // =========================================================================
            // CUSTOMERS
            // =========================================================================

            createCustomer: (data) => {
                const now = new Date().toISOString();
                const count = get().customers.length + 1;
                const customer: Customer = {
                    ...data,
                    id: `cust-${Date.now()}`,
                    customerNumber: `C-${10000 + count}`,
                    createdAt: now,
                    updatedAt: now,
                };
                set((state) => ({ customers: [...state.customers, customer] }));
                return customer;
            },

            updateCustomer: (id, updates) => {
                set((state) => ({
                    customers: state.customers.map((c) => c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c),
                }));
            },

            deleteCustomer: (id) => {
                set((state) => ({ customers: state.customers.filter((c) => c.id !== id) }));
            },

            // =========================================================================
            // CREDIT
            // =========================================================================

            updateCreditLimit: (customerId, newLimit, reason) => {
                const customer = get().customers.find((c) => c.id === customerId);
                if (!customer) return;

                const event: CreditEvent = {
                    id: `credit-${Date.now()}`,
                    customerId,
                    type: newLimit > customer.creditLimit ? 'limit_increase' : 'limit_decrease',
                    previousValue: customer.creditLimit.toString(),
                    newValue: newLimit.toString(),
                    reason,
                    changedByName: 'Current User',
                    createdAt: new Date().toISOString(),
                };

                set((state) => ({
                    customers: state.customers.map((c) => c.id === customerId ? {
                        ...c,
                        creditLimit: newLimit,
                        creditAvailable: newLimit - c.creditUsed,
                        updatedAt: new Date().toISOString(),
                    } : c),
                    creditEvents: [event, ...state.creditEvents],
                }));
            },

            updateCreditStatus: (customerId, status, reason) => {
                const customer = get().customers.find((c) => c.id === customerId);
                if (!customer) return;

                const event: CreditEvent = {
                    id: `credit-${Date.now()}`,
                    customerId,
                    type: 'status_change',
                    previousValue: customer.creditStatus,
                    newValue: status,
                    reason,
                    changedByName: 'Current User',
                    createdAt: new Date().toISOString(),
                };

                set((state) => ({
                    customers: state.customers.map((c) => c.id === customerId ? { ...c, creditStatus: status, updatedAt: new Date().toISOString() } : c),
                    creditEvents: [event, ...state.creditEvents],
                }));
            },

            // =========================================================================
            // RISK
            // =========================================================================

            addRiskIndicator: (data) => {
                const now = new Date().toISOString();
                const indicator: RiskIndicator = { ...data, id: `risk-${Date.now()}`, createdAt: now, updatedAt: now };
                set((state) => ({ riskIndicators: [...state.riskIndicators, indicator] }));

                // Update customer risk score
                const customerIndicators = [...get().riskIndicators.filter((r) => r.customerId === data.customerId && r.status === 'active'), indicator];
                const newScore = Math.min(100, customerIndicators.reduce((sum, r) => sum + r.score, 0));
                const newLevel: RiskLevel = newScore >= 70 ? 'critical' : newScore >= 50 ? 'high' : newScore >= 25 ? 'medium' : 'low';
                get().updateCustomer(data.customerId, { riskScore: newScore, riskLevel: newLevel });

                return indicator;
            },

            resolveRiskIndicator: (id, actionTaken) => {
                const indicator = get().riskIndicators.find((r) => r.id === id);
                if (!indicator) return;

                set((state) => ({
                    riskIndicators: state.riskIndicators.map((r) => r.id === id ? { ...r, status: 'resolved', actionTaken, resolvedAt: new Date().toISOString(), updatedAt: new Date().toISOString() } : r),
                }));

                // Recalculate customer risk
                const activeIndicators = get().riskIndicators.filter((r) => r.customerId === indicator.customerId && r.status === 'active' && r.id !== id);
                const newScore = Math.min(100, activeIndicators.reduce((sum, r) => sum + r.score, 0));
                const newLevel: RiskLevel = newScore >= 70 ? 'critical' : newScore >= 50 ? 'high' : newScore >= 25 ? 'medium' : 'low';
                get().updateCustomer(indicator.customerId, { riskScore: newScore, riskLevel: newLevel });
            },

            // =========================================================================
            // CONTACTS
            // =========================================================================

            addContact: (data) => {
                const now = new Date().toISOString();
                const contact: CustomerContact = { ...data, id: `contact-${Date.now()}`, createdAt: now, updatedAt: now };
                set((state) => ({ contacts: [...state.contacts, contact] }));
                return contact;
            },

            updateContact: (id, updates) => {
                set((state) => ({
                    contacts: state.contacts.map((c) => c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c),
                }));
            },

            deleteContact: (id) => {
                set((state) => ({ contacts: state.contacts.filter((c) => c.id !== id) }));
            },

            // =========================================================================
            // ANALYTICS
            // =========================================================================

            getAnalytics: () => {
                const { customers, riskIndicators } = get();
                const activeCustomers = customers.filter((c) => c.status === 'active');

                return {
                    totalCustomers: customers.length,
                    activeCustomers: activeCustomers.length,
                    newCustomersThisMonth: customers.filter((c) => new Date(c.customerSince) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length,
                    churnedThisMonth: customers.filter((c) => c.status === 'churned').length,
                    totalRevenue: customers.reduce((sum, c) => sum + c.totalRevenue, 0),
                    averageCustomerValue: customers.length > 0 ? customers.reduce((sum, c) => sum + c.totalRevenue, 0) / customers.length : 0,
                    totalOutstanding: customers.reduce((sum, c) => sum + c.outstandingBalance, 0),
                    riskBreakdown: {
                        low: customers.filter((c) => c.riskLevel === 'low').length,
                        medium: customers.filter((c) => c.riskLevel === 'medium').length,
                        high: customers.filter((c) => c.riskLevel === 'high').length,
                        critical: customers.filter((c) => c.riskLevel === 'critical').length,
                    },
                    paymentBehaviorBreakdown: {
                        excellent: customers.filter((c) => c.paymentBehavior === 'excellent').length,
                        good: customers.filter((c) => c.paymentBehavior === 'good').length,
                        fair: customers.filter((c) => c.paymentBehavior === 'fair').length,
                        poor: customers.filter((c) => c.paymentBehavior === 'poor').length,
                        delinquent: customers.filter((c) => c.paymentBehavior === 'delinquent').length,
                    },
                    topCustomersByRevenue: [...customers].sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 5).map((c) => ({ id: c.id, name: c.name, revenue: c.totalRevenue })),
                    atRiskCustomers: customers.filter((c) => c.riskLevel === 'high' || c.riskLevel === 'critical').map((c) => ({ id: c.id, name: c.name, riskLevel: c.riskLevel, indicators: riskIndicators.filter((r) => r.customerId === c.id && r.status === 'active').length })),
                };
            },

            getCustomerPayments: (customerId) => get().payments.filter((p) => p.customerId === customerId),
            getCustomerRevenue: (customerId) => get().revenue.filter((r) => r.customerId === customerId),
            getCustomerRiskIndicators: (customerId) => get().riskIndicators.filter((r) => r.customerId === customerId),
            getCustomerContacts: (customerId) => get().contacts.filter((c) => c.customerId === customerId),

            selectCustomer: (id) => set({ selectedCustomerId: id }),
        }),
        {
            name: 'primebalance-customers',
            partialize: (state) => ({
                customers: state.customers,
                payments: state.payments,
                creditEvents: state.creditEvents,
                revenue: state.revenue,
                riskIndicators: state.riskIndicators,
                contacts: state.contacts,
            }),
        }
    )
);