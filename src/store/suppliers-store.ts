import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
    Supplier,
    SupplierBalance,
    SupplierPayment,
    ReliabilityRecord,
    SpendRecord,
    DependencyRisk,
    SupplierContact,
    SupplierAnalytics,
    SupplierStatus,
    SupplierCategory,
    ReliabilityRating,
    DependencyLevel,
    PaymentMethod,
} from '@/types/suppliers';

// =============================================================================
// DEMO DATA
// =============================================================================

const generateDemoSuppliers = (): Supplier[] => {
    const now = new Date();
    return [
        {
            id: 'sup-1',
            supplierNumber: 'S-10001',
            name: 'Global Materials Inc',
            legalName: 'Global Materials Incorporated',
            status: 'preferred',
            category: 'raw_materials',
            email: 'orders@globalmaterials.com',
            phone: '+1 (555) 111-2222',
            website: 'https://globalmaterials.com',
            address: { street: '500 Industrial Way', city: 'Houston', state: 'TX', postalCode: '77001', country: 'USA' },
            taxId: '45-6789012',
            employeeCount: 1200,
            accountManagerName: 'Tom Wilson',
            tags: ['strategic', 'raw-materials', 'bulk'],
            supplierSince: '2018-06-15',
            lastOrderDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            lastPaymentDate: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000).toISOString(),
            contractExpiryDate: '2026-06-14',
            totalSpend: 4500000,
            totalOrders: 245,
            averageOrderValue: 18367.35,
            outstandingBalance: 125000,
            paymentTerms: 'Net 45',
            preferredPaymentMethod: 'wire',
            earlyPaymentDiscount: 2,
            reliabilityRating: 'excellent',
            reliabilityScore: 95,
            onTimeDeliveryRate: 98,
            qualityScore: 96,
            defectRate: 0.5,
            avgLeadTime: 14,
            dependencyLevel: 'high',
            dependencyScore: 72,
            spendPercentage: 28,
            alternativeSuppliers: 2,
            criticalItems: 8,
            createdAt: '2018-06-15T00:00:00Z',
            updatedAt: now.toISOString(),
        },
        {
            id: 'sup-2',
            supplierNumber: 'S-10002',
            name: 'TechParts Solutions',
            status: 'active',
            category: 'equipment',
            email: 'sales@techparts.com',
            phone: '+1 (555) 222-3333',
            address: { street: '200 Tech Park Dr', city: 'San Jose', state: 'CA', postalCode: '95110', country: 'USA' },
            employeeCount: 350,
            accountManagerName: 'Lisa Park',
            tags: ['technology', 'components'],
            supplierSince: '2020-02-10',
            lastOrderDate: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString(),
            lastPaymentDate: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString(),
            totalSpend: 1800000,
            totalOrders: 89,
            averageOrderValue: 20224.72,
            outstandingBalance: 68000,
            paymentTerms: 'Net 30',
            preferredPaymentMethod: 'ach',
            reliabilityRating: 'good',
            reliabilityScore: 82,
            onTimeDeliveryRate: 91,
            qualityScore: 88,
            defectRate: 1.8,
            avgLeadTime: 21,
            dependencyLevel: 'medium',
            dependencyScore: 45,
            spendPercentage: 12,
            alternativeSuppliers: 5,
            criticalItems: 3,
            createdAt: '2020-02-10T00:00:00Z',
            updatedAt: now.toISOString(),
        },
        {
            id: 'sup-3',
            supplierNumber: 'S-10003',
            name: 'Swift Logistics Co',
            status: 'active',
            category: 'logistics',
            email: 'dispatch@swiftlogistics.com',
            phone: '+1 (555) 333-4444',
            address: { street: '800 Freight Blvd', city: 'Memphis', state: 'TN', postalCode: '38118', country: 'USA' },
            employeeCount: 2500,
            supplierSince: '2019-09-01',
            lastOrderDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            lastPaymentDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            totalSpend: 980000,
            totalOrders: 156,
            averageOrderValue: 6282.05,
            outstandingBalance: 42000,
            paymentTerms: 'Net 30',
            preferredPaymentMethod: 'ach',
            reliabilityRating: 'fair',
            reliabilityScore: 68,
            onTimeDeliveryRate: 82,
            qualityScore: 75,
            defectRate: 4.2,
            avgLeadTime: 3,
            dependencyLevel: 'high',
            dependencyScore: 65,
            spendPercentage: 8,
            alternativeSuppliers: 3,
            criticalItems: 0,
            createdAt: '2019-09-01T00:00:00Z',
            updatedAt: now.toISOString(),
        },
        {
            id: 'sup-4',
            supplierNumber: 'S-10004',
            name: 'Premium Packaging Ltd',
            status: 'active',
            category: 'goods',
            email: 'orders@premiumpack.com',
            phone: '+1 (555) 444-5555',
            supplierSince: '2021-04-20',
            lastOrderDate: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(),
            totalSpend: 450000,
            totalOrders: 78,
            averageOrderValue: 5769.23,
            outstandingBalance: 18500,
            paymentTerms: 'Net 30',
            preferredPaymentMethod: 'check',
            reliabilityRating: 'good',
            reliabilityScore: 85,
            onTimeDeliveryRate: 94,
            qualityScore: 90,
            defectRate: 1.2,
            avgLeadTime: 7,
            dependencyLevel: 'low',
            dependencyScore: 22,
            spendPercentage: 3,
            alternativeSuppliers: 8,
            criticalItems: 0,
            createdAt: '2021-04-20T00:00:00Z',
            updatedAt: now.toISOString(),
        },
        {
            id: 'sup-5',
            supplierNumber: 'S-10005',
            name: 'Apex Consulting Group',
            status: 'active',
            category: 'professional',
            email: 'engagement@apexconsulting.com',
            phone: '+1 (555) 555-6666',
            website: 'https://apexconsulting.com',
            supplierSince: '2022-01-15',
            lastOrderDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            totalSpend: 320000,
            totalOrders: 12,
            averageOrderValue: 26666.67,
            outstandingBalance: 45000,
            paymentTerms: 'Net 30',
            preferredPaymentMethod: 'wire',
            reliabilityRating: 'excellent',
            reliabilityScore: 92,
            onTimeDeliveryRate: 100,
            qualityScore: 95,
            defectRate: 0,
            avgLeadTime: 5,
            dependencyLevel: 'low',
            dependencyScore: 15,
            spendPercentage: 2,
            alternativeSuppliers: 12,
            criticalItems: 0,
            createdAt: '2022-01-15T00:00:00Z',
            updatedAt: now.toISOString(),
        },
        {
            id: 'sup-6',
            supplierNumber: 'S-10006',
            name: 'SingleSource Components',
            status: 'active',
            category: 'raw_materials',
            email: 'sales@singlesource.com',
            supplierSince: '2017-03-01',
            lastOrderDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            totalSpend: 2100000,
            totalOrders: 134,
            averageOrderValue: 15671.64,
            outstandingBalance: 95000,
            paymentTerms: 'Net 60',
            preferredPaymentMethod: 'wire',
            reliabilityRating: 'poor',
            reliabilityScore: 52,
            onTimeDeliveryRate: 72,
            qualityScore: 65,
            defectRate: 5.8,
            avgLeadTime: 28,
            dependencyLevel: 'critical',
            dependencyScore: 92,
            spendPercentage: 15,
            alternativeSuppliers: 0,
            criticalItems: 12,
            createdAt: '2017-03-01T00:00:00Z',
            updatedAt: now.toISOString(),
        },
    ];
};

const generateDemoBalances = (): SupplierBalance[] => {
    return [
        { id: 'bal-1', supplierId: 'sup-1', totalOutstanding: 125000, currentDue: 85000, overdue30: 30000, overdue60: 10000, overdue90Plus: 0, availableCredits: 5000, pendingCredits: 0, lastPaymentAmount: 75000, lastPaymentDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(), nextPaymentDue: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), nextPaymentAmount: 85000, ytdPayments: 3200000, ytdPurchases: 3500000, updatedAt: new Date().toISOString() },
        { id: 'bal-2', supplierId: 'sup-2', totalOutstanding: 68000, currentDue: 68000, overdue30: 0, overdue60: 0, overdue90Plus: 0, availableCredits: 0, pendingCredits: 2500, lastPaymentAmount: 45000, lastPaymentDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(), nextPaymentDue: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), nextPaymentAmount: 68000, ytdPayments: 1400000, ytdPurchases: 1500000, updatedAt: new Date().toISOString() },
        { id: 'bal-3', supplierId: 'sup-6', totalOutstanding: 95000, currentDue: 35000, overdue30: 25000, overdue60: 20000, overdue90Plus: 15000, availableCredits: 0, pendingCredits: 0, ytdPayments: 1800000, ytdPurchases: 1950000, updatedAt: new Date().toISOString() },
    ];
};

const generateDemoRisks = (): DependencyRisk[] => {
    const now = new Date();
    return [
        { id: 'risk-1', supplierId: 'sup-6', riskType: 'single_source', title: 'Single Source Dependency', description: 'No alternative suppliers available for 12 critical components', severity: 'critical', impactScore: 9, probabilityScore: 7, overallRiskScore: 63, mitigationPlan: 'Qualify 2 alternative suppliers by Q2', mitigationStatus: 'in_progress', status: 'mitigating', identifiedAt: '2024-01-15', createdAt: now.toISOString(), updatedAt: now.toISOString() },
        { id: 'risk-2', supplierId: 'sup-6', riskType: 'operational', title: 'Poor Delivery Performance', description: 'On-time delivery rate dropped to 72%', severity: 'high', impactScore: 7, probabilityScore: 8, overallRiskScore: 56, mitigationPlan: 'Weekly performance reviews with supplier', mitigationStatus: 'in_progress', status: 'assessed', identifiedAt: '2024-06-01', createdAt: now.toISOString(), updatedAt: now.toISOString() },
        {
            id: 'risk-3',
            supplierId: 'sup-1',
            riskType: 'high_spend',
            title: 'High Spend Concentration',
            description: '28% of total procurement spend with single supplier',
            severity: 'medium',
            impactScore: 6,
            probabilityScore: 4,
            overallRiskScore: 24,
            status: 'identified',
            identifiedAt: '2024-03-01',
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
            mitigationStatus: "in_progress"
        },
        { id: 'risk-4', supplierId: 'sup-3', riskType: 'operational', title: 'Declining Quality Scores', description: 'Quality score dropped from 85 to 75 over 6 months', severity: 'medium', impactScore: 5, probabilityScore: 6, overallRiskScore: 30, mitigationStatus: 'not_started', status: 'identified', identifiedAt: '2024-09-01', createdAt: now.toISOString(), updatedAt: now.toISOString() },
    ];
};

const generateDemoSpend = (): SpendRecord[] => {
    return [
        { id: 'spend-1', supplierId: 'sup-1', period: '2024-Q3', periodType: 'quarterly', totalSpend: 1100000, directSpend: 950000, indirectSpend: 150000, orderCount: 62, averageOrderValue: 17741.94, previousPeriodSpend: 1050000, changePercentage: 4.76, createdAt: new Date().toISOString() },
        { id: 'spend-2', supplierId: 'sup-1', period: '2024-Q4', periodType: 'quarterly', totalSpend: 1200000, directSpend: 1020000, indirectSpend: 180000, orderCount: 68, averageOrderValue: 17647.06, previousPeriodSpend: 1100000, changePercentage: 9.09, createdAt: new Date().toISOString() },
        { id: 'spend-3', supplierId: 'sup-2', period: '2024-Q3', periodType: 'quarterly', totalSpend: 420000, directSpend: 420000, indirectSpend: 0, orderCount: 22, averageOrderValue: 19090.91, createdAt: new Date().toISOString() },
        { id: 'spend-4', supplierId: 'sup-2', period: '2024-Q4', periodType: 'quarterly', totalSpend: 480000, directSpend: 480000, indirectSpend: 0, orderCount: 25, averageOrderValue: 19200, previousPeriodSpend: 420000, changePercentage: 14.29, createdAt: new Date().toISOString() },
    ];
};

const generateDemoReliability = (): ReliabilityRecord[] => {
    return [
        { id: 'rel-1', supplierId: 'sup-1', orderId: 'ord-101', orderNumber: 'PO-2024-0456', orderDate: '2024-11-15', expectedDeliveryDate: '2024-11-29', actualDeliveryDate: '2024-11-28', daysVariance: -1, itemsOrdered: 500, itemsReceived: 500, itemsDefective: 2, qualityScore: 99.6, hasIssues: false, issueResolved: true, createdAt: new Date().toISOString() },
        { id: 'rel-2', supplierId: 'sup-6', orderId: 'ord-102', orderNumber: 'PO-2024-0489', orderDate: '2024-11-01', expectedDeliveryDate: '2024-11-29', actualDeliveryDate: '2024-12-08', daysVariance: 9, itemsOrdered: 200, itemsReceived: 185, itemsDefective: 12, qualityScore: 85.1, hasIssues: true, issueType: 'late_delivery', issueDescription: 'Delivery delayed by 9 days due to production issues', issueResolved: false, createdAt: new Date().toISOString() },
        { id: 'rel-3', supplierId: 'sup-3', orderId: 'ord-103', orderNumber: 'PO-2024-0501', orderDate: '2024-12-01', expectedDeliveryDate: '2024-12-04', actualDeliveryDate: '2024-12-06', daysVariance: 2, itemsOrdered: 50, itemsReceived: 50, itemsDefective: 0, qualityScore: 100, hasIssues: true, issueType: 'late_delivery', issueDescription: 'Shipment delayed by carrier', issueResolved: true, createdAt: new Date().toISOString() },
    ];
};

const generateDemoContacts = (): SupplierContact[] => {
    return [
        { id: 'contact-1', supplierId: 'sup-1', name: 'Michael Roberts', title: 'Account Director', email: 'mroberts@globalmaterials.com', phone: '+1 (555) 111-2223', isPrimary: true, role: 'account', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'contact-2', supplierId: 'sup-1', name: 'Sarah Chen', title: 'Sales Representative', email: 'schen@globalmaterials.com', phone: '+1 (555) 111-2224', isPrimary: false, role: 'sales', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'contact-3', supplierId: 'sup-2', name: 'David Kim', title: 'Regional Manager', email: 'dkim@techparts.com', isPrimary: true, role: 'account', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ];
};

// =============================================================================
// STORE
// =============================================================================

interface SuppliersState {
    suppliers: Supplier[];
    balances: SupplierBalance[];
    payments: SupplierPayment[];
    reliability: ReliabilityRecord[];
    spend: SpendRecord[];
    risks: DependencyRisk[];
    contacts: SupplierContact[];

    selectedSupplierId: string | null;

    // Suppliers
    createSupplier: (supplier: Omit<Supplier, 'id' | 'supplierNumber' | 'createdAt' | 'updatedAt'>) => Supplier;
    updateSupplier: (id: string, updates: Partial<Supplier>) => void;
    deleteSupplier: (id: string) => void;

    // Risks
    addRisk: (risk: Omit<DependencyRisk, 'id' | 'createdAt' | 'updatedAt'>) => DependencyRisk;
    updateRisk: (id: string, updates: Partial<DependencyRisk>) => void;
    resolveRisk: (id: string) => void;

    // Contacts
    addContact: (contact: Omit<SupplierContact, 'id' | 'createdAt' | 'updatedAt'>) => SupplierContact;
    updateContact: (id: string, updates: Partial<SupplierContact>) => void;
    deleteContact: (id: string) => void;

    // Analytics
    getAnalytics: () => SupplierAnalytics;
    getSupplierBalance: (supplierId: string) => SupplierBalance | undefined;
    getSupplierPayments: (supplierId: string) => SupplierPayment[];
    getSupplierReliability: (supplierId: string) => ReliabilityRecord[];
    getSupplierSpend: (supplierId: string) => SpendRecord[];
    getSupplierRisks: (supplierId: string) => DependencyRisk[];
    getSupplierContacts: (supplierId: string) => SupplierContact[];

    // Selection
    selectSupplier: (id: string | null) => void;
}

export const useSuppliersStore = create<SuppliersState>()(
    persist(
        (set, get) => ({
            suppliers: generateDemoSuppliers(),
            balances: generateDemoBalances(),
            payments: [],
            reliability: generateDemoReliability(),
            spend: generateDemoSpend(),
            risks: generateDemoRisks(),
            contacts: generateDemoContacts(),
            selectedSupplierId: null,

            createSupplier: (data) => {
                const now = new Date().toISOString();
                const count = get().suppliers.length + 1;
                const supplier: Supplier = { ...data, id: `sup-${Date.now()}`, supplierNumber: `S-${10000 + count}`, createdAt: now, updatedAt: now };
                set((state) => ({ suppliers: [...state.suppliers, supplier] }));
                return supplier;
            },

            updateSupplier: (id, updates) => {
                set((state) => ({
                    suppliers: state.suppliers.map((s) => s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s),
                }));
            },

            deleteSupplier: (id) => {
                set((state) => ({ suppliers: state.suppliers.filter((s) => s.id !== id) }));
            },

            addRisk: (data) => {
                const now = new Date().toISOString();
                const risk: DependencyRisk = { ...data, id: `risk-${Date.now()}`, createdAt: now, updatedAt: now };
                set((state) => ({ risks: [...state.risks, risk] }));
                return risk;
            },

            updateRisk: (id, updates) => {
                set((state) => ({
                    risks: state.risks.map((r) => r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r),
                }));
            },

            resolveRisk: (id) => {
                set((state) => ({
                    risks: state.risks.map((r) => r.id === id ? { ...r, status: 'resolved', resolvedAt: new Date().toISOString(), updatedAt: new Date().toISOString() } : r),
                }));
            },

            addContact: (data) => {
                const now = new Date().toISOString();
                const contact: SupplierContact = { ...data, id: `contact-${Date.now()}`, createdAt: now, updatedAt: now };
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

            getAnalytics: () => {
                const { suppliers, risks } = get();
                const activeSuppliers = suppliers.filter((s) => s.status === 'active' || s.status === 'preferred');
                const totalSpend = suppliers.reduce((sum, s) => sum + s.totalSpend, 0);

                const categorySpend = suppliers.reduce((acc, s) => {
                    const existing = acc.find((c) => c.category === s.category);
                    if (existing) existing.spend += s.totalSpend;
                    else acc.push({ category: s.category, spend: s.totalSpend, percentage: 0 });
                    return acc;
                }, [] as { category: SupplierCategory; spend: number; percentage: number }[]);
                categorySpend.forEach((c) => { c.percentage = totalSpend > 0 ? (c.spend / totalSpend) * 100 : 0; });

                return {
                    totalSuppliers: suppliers.length,
                    activeSuppliers: activeSuppliers.length,
                    preferredSuppliers: suppliers.filter((s) => s.status === 'preferred').length,
                    newSuppliersThisMonth: suppliers.filter((s) => new Date(s.supplierSince) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length,
                    totalSpendYTD: totalSpend,
                    totalOutstanding: suppliers.reduce((sum, s) => sum + s.outstandingBalance, 0),
                    avgPaymentDays: Math.round(suppliers.reduce((sum, s) => sum + (parseInt(s.paymentTerms.match(/\d+/)?.[0] || '30')), 0) / suppliers.length),
                    reliabilityBreakdown: {
                        excellent: suppliers.filter((s) => s.reliabilityRating === 'excellent').length,
                        good: suppliers.filter((s) => s.reliabilityRating === 'good').length,
                        fair: suppliers.filter((s) => s.reliabilityRating === 'fair').length,
                        poor: suppliers.filter((s) => s.reliabilityRating === 'poor').length,
                        critical: suppliers.filter((s) => s.reliabilityRating === 'critical').length,
                    },
                    dependencyBreakdown: {
                        low: suppliers.filter((s) => s.dependencyLevel === 'low').length,
                        medium: suppliers.filter((s) => s.dependencyLevel === 'medium').length,
                        high: suppliers.filter((s) => s.dependencyLevel === 'high').length,
                        critical: suppliers.filter((s) => s.dependencyLevel === 'critical').length,
                    },
                    topSuppliersBySpend: [...suppliers].sort((a, b) => b.totalSpend - a.totalSpend).slice(0, 5).map((s) => ({ id: s.id, name: s.name, spend: s.totalSpend })),
                    highRiskSuppliers: suppliers.filter((s) => s.dependencyLevel === 'high' || s.dependencyLevel === 'critical').map((s) => ({ id: s.id, name: s.name, riskCount: risks.filter((r) => r.supplierId === s.id && r.status !== 'resolved').length, dependencyLevel: s.dependencyLevel })),
                    categorySpend,
                };
            },

            getSupplierBalance: (supplierId) => get().balances.find((b) => b.supplierId === supplierId),
            getSupplierPayments: (supplierId) => get().payments.filter((p) => p.supplierId === supplierId),
            getSupplierReliability: (supplierId) => get().reliability.filter((r) => r.supplierId === supplierId),
            getSupplierSpend: (supplierId) => get().spend.filter((s) => s.supplierId === supplierId),
            getSupplierRisks: (supplierId) => get().risks.filter((r) => r.supplierId === supplierId),
            getSupplierContacts: (supplierId) => get().contacts.filter((c) => c.supplierId === supplierId),

            selectSupplier: (id) => set({ selectedSupplierId: id }),
        }),
        {
            name: 'primebalance-suppliers',
            partialize: (state) => ({
                suppliers: state.suppliers,
                balances: state.balances,
                payments: state.payments,
                reliability: state.reliability,
                spend: state.spend,
                risks: state.risks,
                contacts: state.contacts,
            }),
        }
    )
);