import { create } from 'zustand';
import type {
    Offer,
    OfferStatus,
    OfferLineItem,
    OfferTemplate,
    OfferVersion,
    OfferAuditLog,
    OfferStats,
    OfferCounterparty,
    MarginPreview,
    AcceptanceMethod,
} from '@/types/offers';
import { VALID_TRANSITIONS } from '@/types/offers';

// =============================================================================
// HELPERS
// =============================================================================

const generateOfferNumber = (): string => {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `QUO-${year}-${random}`;
};

const calculateLineItem = (item: Partial<OfferLineItem>): OfferLineItem => {
    const quantity = item.quantity || 0;
    const unitPrice = item.unitPrice || 0;
    const subtotal = quantity * unitPrice;

    let discountAmount = 0;
    if (item.discountType && item.discountValue) {
        if (item.discountType === 'percentage') {
            discountAmount = subtotal * (item.discountValue / 100);
        } else if (item.discountType === 'fixed') {
            discountAmount = item.discountValue;
        }
    }

    const netAmount = subtotal - discountAmount;
    const taxAmount = item.taxRate ? netAmount * (item.taxRate / 100) : 0;

    const costPrice = item.costPrice || 0;
    const totalCost = costPrice * quantity;
    const marginAmount = netAmount - totalCost;
    const marginPercent = netAmount > 0 ? (marginAmount / netAmount) * 100 : 0;

    return {
        id: item.id || `line-${Date.now()}`,
        lineNumber: item.lineNumber || 1,
        type: item.type || 'product',
        description: item.description || '',
        sku: item.sku,
        quantity,
        unit: item.unit || 'pcs',
        unitPrice,
        currency: item.currency || 'USD',
        discountType: item.discountType,
        discountValue: item.discountValue,
        discountReason: item.discountReason,
        subtotal,
        discountAmount,
        netAmount,
        costPrice,
        marginAmount,
        marginPercent,
        taxRate: item.taxRate,
        taxAmount,
        notes: item.notes,
    };
};

const calculateOfferTotals = (lineItems: OfferLineItem[]): { subtotal: number; totalDiscount: number; taxTotal: number; grandTotal: number; totalCost: number; grossMargin: number; grossMarginPercent: number } => {
    const subtotal = lineItems.reduce((sum, item) => sum + item.subtotal, 0);
    const totalDiscount = lineItems.reduce((sum, item) => sum + item.discountAmount, 0);
    const taxTotal = lineItems.reduce((sum, item) => sum + (item.taxAmount || 0), 0);
    const grandTotal = lineItems.reduce((sum, item) => sum + item.netAmount + (item.taxAmount || 0), 0);
    const totalCost = lineItems.reduce((sum, item) => sum + (item.costPrice || 0) * item.quantity, 0);
    const grossMargin = grandTotal - taxTotal - totalCost;
    const grossMarginPercent = (grandTotal - taxTotal) > 0 ? (grossMargin / (grandTotal - taxTotal)) * 100 : 0;

    return { subtotal, totalDiscount, taxTotal, grandTotal, totalCost, grossMargin, grossMarginPercent };
};

const addDays = (date: string, days: number): string => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
};

// =============================================================================
// DEMO DATA
// =============================================================================

const demoCounterparties: OfferCounterparty[] = [
    { id: 'cp-1', name: 'Acme Corporation', email: 'procurement@acme.com', company: 'Acme Corp', contactPerson: 'John Smith', country: 'US' },
    { id: 'cp-2', name: 'TechStart GmbH', email: 'info@techstart.de', company: 'TechStart GmbH', contactPerson: 'Anna Mueller', country: 'DE' },
    { id: 'cp-3', name: 'Global Industries Ltd', email: 'purchasing@global-ind.co.uk', company: 'Global Industries', contactPerson: 'James Wilson', country: 'UK' },
];

const defaultDisclaimer = 'This offer is non-binding and does not constitute a contract. It is provided for informational purposes only and is subject to change. Acceptance of this offer does not create a binding agreement until explicitly confirmed by both parties in writing. All prices exclude applicable taxes unless otherwise stated.';

const demoOffers: Offer[] = [
    {
        id: 'off-1',
        offerNumber: 'QUO-2024-0042',
        version: 1,
        status: 'sent',
        counterparty: demoCounterparties[0],
        offerDate: '2024-12-15',
        validityDays: 30,
        expiryDate: '2025-01-14',
        sentAt: '2024-12-15T10:30:00Z',
        currency: 'USD',
        paymentTerms: 'net_30',
        deliveryTerms: 'FOB Origin',
        lineItems: [
            calculateLineItem({ id: 'l1', lineNumber: 1, type: 'product', description: 'Enterprise Software License', quantity: 10, unit: 'licenses', unitPrice: 5000, currency: 'USD', costPrice: 2500, taxRate: 0 }),
            calculateLineItem({ id: 'l2', lineNumber: 2, type: 'service', description: 'Implementation Services', quantity: 40, unit: 'hours', unitPrice: 200, currency: 'USD', costPrice: 120, taxRate: 0 }),
            calculateLineItem({ id: 'l3', lineNumber: 3, type: 'subscription', description: 'Annual Support & Maintenance', quantity: 1, unit: 'year', unitPrice: 12000, currency: 'USD', costPrice: 4000, taxRate: 0 }),
        ],
        subtotal: 70000,
        totalDiscount: 0,
        taxTotal: 0,
        grandTotal: 70000,
        totalCost: 33800,
        grossMargin: 36200,
        grossMarginPercent: 51.7,
        customerNotes: 'Thank you for your interest. This quote includes our standard enterprise package.',
        disclaimer: defaultDisclaimer,
        createdBy: 'Sales Team',
        createdAt: '2024-12-15T09:00:00Z',
        sentBy: 'Sarah Johnson',
    },
    {
        id: 'off-2',
        offerNumber: 'QUO-2024-0041',
        version: 2,
        status: 'accepted',
        counterparty: demoCounterparties[1],
        offerDate: '2024-12-10',
        validityDays: 14,
        expiryDate: '2024-12-24',
        sentAt: '2024-12-10T14:00:00Z',
        acceptedAt: '2024-12-18T11:30:00Z',
        currency: 'EUR',
        paymentTerms: 'net_15',
        lineItems: [
            calculateLineItem({ id: 'l4', lineNumber: 1, type: 'product', description: 'Starter Package', quantity: 5, unit: 'licenses', unitPrice: 2000, currency: 'EUR', costPrice: 900, taxRate: 19 }),
            calculateLineItem({ id: 'l5', lineNumber: 2, type: 'service', description: 'Training Workshop', quantity: 2, unit: 'days', unitPrice: 1500, currency: 'EUR', costPrice: 800, taxRate: 19 }),
        ],
        subtotal: 13000,
        totalDiscount: 0,
        taxTotal: 2470,
        grandTotal: 15470,
        totalCost: 6100,
        grossMargin: 6900,
        grossMarginPercent: 53.1,
        disclaimer: defaultDisclaimer,
        acceptanceMethod: 'email',
        createdBy: 'Sales Team',
        createdAt: '2024-12-08T10:00:00Z',
    },
    {
        id: 'off-3',
        offerNumber: 'QUO-2024-0040',
        version: 1,
        status: 'draft',
        counterparty: demoCounterparties[2],
        offerDate: '2024-12-20',
        validityDays: 30,
        expiryDate: '2025-01-19',
        currency: 'GBP',
        paymentTerms: 'net_30',
        lineItems: [
            calculateLineItem({ id: 'l6', lineNumber: 1, type: 'product', description: 'Premium Suite', quantity: 20, unit: 'licenses', unitPrice: 3500, currency: 'GBP', costPrice: 1800, discountType: 'percentage', discountValue: 10, discountReason: 'Volume discount' }),
        ],
        subtotal: 70000,
        totalDiscount: 7000,
        taxTotal: 12600,
        grandTotal: 75600,
        totalCost: 36000,
        grossMargin: 27000,
        grossMarginPercent: 42.9,
        disclaimer: defaultDisclaimer,
        createdBy: 'Sales Team',
        createdAt: '2024-12-20T08:00:00Z',
    },
    {
        id: 'off-4',
        offerNumber: 'QUO-2024-0039',
        version: 1,
        status: 'rejected',
        counterparty: demoCounterparties[0],
        offerDate: '2024-12-01',
        validityDays: 14,
        expiryDate: '2024-12-15',
        sentAt: '2024-12-01T12:00:00Z',
        rejectedAt: '2024-12-12T09:00:00Z',
        currency: 'USD',
        paymentTerms: 'net_30',
        lineItems: [
            calculateLineItem({ id: 'l7', lineNumber: 1, type: 'service', description: 'Consulting Services', quantity: 100, unit: 'hours', unitPrice: 250, currency: 'USD', costPrice: 150 }),
        ],
        subtotal: 25000,
        totalDiscount: 0,
        taxTotal: 0,
        grandTotal: 25000,
        disclaimer: defaultDisclaimer,
        rejectionReason: 'Budget constraints - will revisit Q1 2025',
        createdBy: 'Sales Team',
        createdAt: '2024-12-01T10:00:00Z',
    },
    {
        id: 'off-5',
        offerNumber: 'QUO-2024-0038',
        version: 1,
        status: 'converted',
        counterparty: demoCounterparties[1],
        offerDate: '2024-11-15',
        validityDays: 30,
        expiryDate: '2024-12-15',
        sentAt: '2024-11-15T10:00:00Z',
        acceptedAt: '2024-11-20T14:00:00Z',
        convertedAt: '2024-11-21T09:00:00Z',
        currency: 'EUR',
        paymentTerms: 'net_30',
        lineItems: [
            calculateLineItem({ id: 'l8', lineNumber: 1, type: 'product', description: 'Basic Package', quantity: 3, unit: 'licenses', unitPrice: 1500, currency: 'EUR', costPrice: 700 }),
        ],
        subtotal: 4500,
        totalDiscount: 0,
        taxTotal: 855,
        grandTotal: 5355,
        disclaimer: defaultDisclaimer,
        acceptanceMethod: 'signature',
        convertedOrderId: 'ord-001',
        convertedOrderNumber: 'ORD-2024-0089',
        createdBy: 'Sales Team',
        createdAt: '2024-11-14T16:00:00Z',
    },
];

const demoTemplates: OfferTemplate[] = [
    {
        id: 'tpl-1',
        name: 'Standard Software License',
        description: 'Standard template for software license offers',
        category: 'Software',
        defaultCurrency: 'USD',
        defaultValidityDays: 30,
        defaultPaymentTerms: 'net_30',
        defaultTermsAndConditions: 'Standard software license terms apply.',
        defaultDisclaimer: defaultDisclaimer,
        defaultLineItems: [
            { type: 'product', description: 'Software License', unit: 'licenses', unitPrice: 5000 },
            { type: 'service', description: 'Implementation', unit: 'hours', unitPrice: 200 },
        ],
        usageCount: 24,
        lastUsedAt: '2024-12-15T10:00:00Z',
        createdBy: 'Admin',
        createdAt: '2024-01-15T00:00:00Z',
        isActive: true,
    },
    {
        id: 'tpl-2',
        name: 'Professional Services',
        description: 'Template for consulting and professional services',
        category: 'Services',
        defaultCurrency: 'USD',
        defaultValidityDays: 14,
        defaultPaymentTerms: 'milestone',
        defaultDisclaimer: defaultDisclaimer,
        defaultLineItems: [
            { type: 'service', description: 'Consulting Services', unit: 'hours', unitPrice: 250 },
        ],
        usageCount: 18,
        createdBy: 'Admin',
        createdAt: '2024-02-01T00:00:00Z',
        isActive: true,
    },
    {
        id: 'tpl-3',
        name: 'Enterprise Package',
        description: 'Complete enterprise solution package',
        category: 'Enterprise',
        defaultCurrency: 'USD',
        defaultValidityDays: 45,
        defaultPaymentTerms: 'net_45',
        defaultDisclaimer: defaultDisclaimer,
        defaultLineItems: [
            { type: 'product', description: 'Enterprise License', unit: 'licenses', unitPrice: 10000 },
            { type: 'service', description: 'Implementation & Training', unit: 'days', unitPrice: 2000 },
            { type: 'subscription', description: 'Premium Support', unit: 'year', unitPrice: 24000 },
        ],
        usageCount: 8,
        createdBy: 'Admin',
        createdAt: '2024-03-01T00:00:00Z',
        isActive: true,
    },
];

// =============================================================================
// STORE
// =============================================================================

interface OffersState {
    offers: Offer[];
    templates: OfferTemplate[];
    versions: OfferVersion[];
    auditLogs: OfferAuditLog[];
    selectedOffer: Offer | null;
    isLoading: boolean;
    filterStatus: OfferStatus | 'all';

    // Actions
    setFilterStatus: (status: OfferStatus | 'all') => void;
    selectOffer: (id: string | null) => void;
    getOfferById: (id: string) => Offer | undefined;
    getStats: () => OfferStats;

    // CRUD
    createOffer: (offer: Partial<Offer>) => Offer;
    updateOffer: (id: string, updates: Partial<Offer>) => void;
    deleteOffer: (id: string) => boolean;
    duplicateOffer: (id: string) => Offer;

    // Line Items
    addLineItem: (offerId: string, item: Partial<OfferLineItem>) => void;
    updateLineItem: (offerId: string, lineId: string, updates: Partial<OfferLineItem>) => void;
    removeLineItem: (offerId: string, lineId: string) => void;

    // Status Transitions
    sendOffer: (id: string) => boolean;
    reviseOffer: (id: string, revisionNotes?: string) => Offer | null;
    acceptOffer: (id: string, method: AcceptanceMethod) => boolean;
    rejectOffer: (id: string, reason?: string) => boolean;
    markExpired: (id: string) => boolean;
    convertToOrder: (id: string) => string | null;

    // Templates
    createFromTemplate: (templateId: string, counterparty: OfferCounterparty) => Offer | null;

    // Margin Preview
    getMarginPreview: (id: string) => MarginPreview | null;

    // Audit
    logAction: (offerId: string, action: OfferAuditLog['action'], details: string, extra?: Partial<OfferAuditLog>) => void;
}

export const useOffersStore = create<OffersState>((set, get) => ({
    offers: demoOffers,
    templates: demoTemplates,
    versions: [],
    auditLogs: [],
    selectedOffer: null,
    isLoading: false,
    filterStatus: 'all',

    setFilterStatus: (status) => set({ filterStatus: status }),

    selectOffer: (id) => {
        const offer = id ? get().offers.find((o) => o.id === id) || null : null;
        set({ selectedOffer: offer });
        if (offer) {
            get().logAction(offer.id, 'viewed', `Offer ${offer.offerNumber} viewed`);
        }
    },

    getOfferById: (id) => get().offers.find((o) => o.id === id),

    getStats: () => {
        const { offers } = get();
        const byStatus: Record<OfferStatus, number> = {
            draft: 0, sent: 0, revised: 0, accepted: 0, rejected: 0, expired: 0, converted: 0,
        };

        let totalValue = 0;
        let acceptedValue = 0;
        let totalValidityDays = 0;
        const now = new Date();
        const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        let expiringIn7Days = 0;

        const thisMonth = {
            created: 0, sent: 0, accepted: 0, rejected: 0,
        };
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        offers.forEach((offer) => {
            byStatus[offer.status]++;
            totalValue += offer.grandTotal;
            totalValidityDays += offer.validityDays;

            if (offer.status === 'accepted' || offer.status === 'converted') {
                acceptedValue += offer.grandTotal;
            }

            if ((offer.status === 'sent' || offer.status === 'revised') && new Date(offer.expiryDate) <= in7Days) {
                expiringIn7Days++;
            }

            const createdDate = new Date(offer.createdAt);
            if (createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear) {
                thisMonth.created++;
            }

            if (offer.sentAt) {
                const sentDate = new Date(offer.sentAt);
                if (sentDate.getMonth() === currentMonth && sentDate.getFullYear() === currentYear) {
                    thisMonth.sent++;
                }
            }

            if (offer.acceptedAt) {
                const acceptedDate = new Date(offer.acceptedAt);
                if (acceptedDate.getMonth() === currentMonth && acceptedDate.getFullYear() === currentYear) {
                    thisMonth.accepted++;
                }
            }

            if (offer.rejectedAt) {
                const rejectedDate = new Date(offer.rejectedAt);
                if (rejectedDate.getMonth() === currentMonth && rejectedDate.getFullYear() === currentYear) {
                    thisMonth.rejected++;
                }
            }
        });

        const sentCount = byStatus.sent + byStatus.revised + byStatus.accepted + byStatus.rejected + byStatus.expired + byStatus.converted;
        const acceptedCount = byStatus.accepted + byStatus.converted;

        return {
            totalOffers: offers.length,
            byStatus,
            totalValue,
            acceptedValue,
            conversionRate: sentCount > 0 ? (acceptedCount / sentCount) * 100 : 0,
            averageValue: offers.length > 0 ? totalValue / offers.length : 0,
            averageValidityDays: offers.length > 0 ? totalValidityDays / offers.length : 30,
            expiringIn7Days,
            thisMonth,
        };
    },

    createOffer: (offerData) => {
        const now = new Date().toISOString();
        const offerDate = offerData.offerDate || now.split('T')[0];
        const validityDays = offerData.validityDays || 30;

        const lineItems = (offerData.lineItems || []).map((item, index) =>
            calculateLineItem({ ...item, lineNumber: index + 1 })
        );

        const totals = calculateOfferTotals(lineItems);

        const offer: Offer = {
            id: `off-${Date.now()}`,
            offerNumber: generateOfferNumber(),
            version: 1,
            status: 'draft',
            counterparty: offerData.counterparty || { id: '', name: '', email: '' },
            offerDate,
            validityDays,
            expiryDate: addDays(offerDate, validityDays),
            currency: offerData.currency || 'USD',
            paymentTerms: offerData.paymentTerms || 'net_30',
            deliveryTerms: offerData.deliveryTerms,
            lineItems,
            ...totals,
            internalNotes: offerData.internalNotes,
            customerNotes: offerData.customerNotes,
            termsAndConditions: offerData.termsAndConditions,
            disclaimer: offerData.disclaimer || defaultDisclaimer,
            templateId: offerData.templateId,
            templateName: offerData.templateName,
            createdBy: offerData.createdBy || 'Current User',
            createdAt: now,
        };

        set((state) => ({ offers: [offer, ...state.offers] }));
        get().logAction(offer.id, 'created', `Offer ${offer.offerNumber} created`);

        return offer;
    },

    updateOffer: (id, updates) => {
        set((state) => ({
            offers: state.offers.map((o) => {
                if (o.id !== id) return o;
                if (o.status !== 'draft' && o.status !== 'revised') return o; // Only draft/revised can be edited

                const lineItems = updates.lineItems
                    ? updates.lineItems.map((item, index) => calculateLineItem({ ...item, lineNumber: index + 1 }))
                    : o.lineItems;

                const totals = calculateOfferTotals(lineItems);

                const expiryDate = updates.validityDays
                    ? addDays(updates.offerDate || o.offerDate, updates.validityDays)
                    : updates.offerDate
                        ? addDays(updates.offerDate, o.validityDays)
                        : o.expiryDate;

                return {
                    ...o,
                    ...updates,
                    lineItems,
                    ...totals,
                    expiryDate,
                    updatedAt: new Date().toISOString(),
                    updatedBy: 'Current User',
                };
            }),
        }));
        get().logAction(id, 'edited', 'Offer updated');
    },

    deleteOffer: (id) => {
        const offer = get().offers.find((o) => o.id === id);
        if (!offer || offer.status !== 'draft') return false;

        set((state) => ({
            offers: state.offers.filter((o) => o.id !== id),
        }));
        return true;
    },

    duplicateOffer: (id) => {
        const original = get().offers.find((o) => o.id === id);
        if (!original) throw new Error('Offer not found');

        const now = new Date().toISOString();
        const duplicate: Offer = {
            ...original,
            id: `off-${Date.now()}`,
            offerNumber: generateOfferNumber(),
            version: 1,
            status: 'draft',
            offerDate: now.split('T')[0],
            expiryDate: addDays(now.split('T')[0], original.validityDays),
            sentAt: undefined,
            acceptedAt: undefined,
            rejectedAt: undefined,
            convertedAt: undefined,
            acceptanceMethod: undefined,
            rejectionReason: undefined,
            convertedOrderId: undefined,
            convertedOrderNumber: undefined,
            previousVersionId: undefined,
            createdAt: now,
            createdBy: 'Current User',
            updatedAt: undefined,
            updatedBy: undefined,
        };

        set((state) => ({ offers: [duplicate, ...state.offers] }));
        get().logAction(duplicate.id, 'created', `Offer duplicated from ${original.offerNumber}`);

        return duplicate;
    },

    addLineItem: (offerId, item) => {
        set((state) => ({
            offers: state.offers.map((o) => {
                if (o.id !== offerId) return o;

                const newItem = calculateLineItem({
                    ...item,
                    id: `line-${Date.now()}`,
                    lineNumber: o.lineItems.length + 1,
                    currency: o.currency,
                });

                const lineItems = [...o.lineItems, newItem];
                const totals = calculateOfferTotals(lineItems);

                return { ...o, lineItems, ...totals, updatedAt: new Date().toISOString() };
            }),
        }));
    },

    updateLineItem: (offerId, lineId, updates) => {
        set((state) => ({
            offers: state.offers.map((o) => {
                if (o.id !== offerId) return o;

                const lineItems = o.lineItems.map((item) =>
                    item.id === lineId ? calculateLineItem({ ...item, ...updates }) : item
                );

                const totals = calculateOfferTotals(lineItems);

                return { ...o, lineItems, ...totals, updatedAt: new Date().toISOString() };
            }),
        }));
    },

    removeLineItem: (offerId, lineId) => {
        set((state) => ({
            offers: state.offers.map((o) => {
                if (o.id !== offerId) return o;

                const lineItems = o.lineItems
                    .filter((item) => item.id !== lineId)
                    .map((item, index) => ({ ...item, lineNumber: index + 1 }));

                const totals = calculateOfferTotals(lineItems);

                return { ...o, lineItems, ...totals, updatedAt: new Date().toISOString() };
            }),
        }));
    },

    sendOffer: (id) => {
        const offer = get().offers.find((o) => o.id === id);
        if (!offer) return false;
        if (!VALID_TRANSITIONS[offer.status].includes('sent')) return false;
        if (offer.lineItems.length === 0) return false;
        if (!offer.counterparty.email) return false;

        set((state) => ({
            offers: state.offers.map((o) =>
                o.id === id
                    ? {
                        ...o,
                        status: 'sent' as OfferStatus,
                        sentAt: new Date().toISOString(),
                        sentBy: 'Current User',
                    }
                    : o
            ),
        }));

        get().logAction(id, 'sent', `Offer sent to ${offer.counterparty.email}`, {
            previousStatus: offer.status,
            newStatus: 'sent',
        });

        return true;
    },

    reviseOffer: (id, revisionNotes) => {
        const original = get().offers.find((o) => o.id === id);
        if (!original) return null;
        if (!VALID_TRANSITIONS[original.status].includes('revised')) return null;

        // Create version snapshot
        const version: OfferVersion = {
            id: `ver-${Date.now()}`,
            offerId: original.id,
            version: original.version,
            changes: [],
            revisionNotes,
            snapshotData: { ...original },
            createdBy: 'Current User',
            createdAt: new Date().toISOString(),
        };

        set((state) => ({
            versions: [version, ...state.versions],
            offers: state.offers.map((o) =>
                o.id === id
                    ? {
                        ...o,
                        version: o.version + 1,
                        status: 'revised' as OfferStatus,
                        previousVersionId: version.id,
                        updatedAt: new Date().toISOString(),
                    }
                    : o
            ),
        }));

        get().logAction(id, 'revised', `Offer revised to version ${original.version + 1}`, {
            previousStatus: original.status,
            newStatus: 'revised',
        });

        return get().offers.find((o) => o.id === id) || null;
    },

    acceptOffer: (id, method) => {
        const offer = get().offers.find((o) => o.id === id);
        if (!offer) return false;
        if (!VALID_TRANSITIONS[offer.status].includes('accepted')) return false;

        set((state) => ({
            offers: state.offers.map((o) =>
                o.id === id
                    ? {
                        ...o,
                        status: 'accepted' as OfferStatus,
                        acceptedAt: new Date().toISOString(),
                        acceptanceMethod: method,
                    }
                    : o
            ),
        }));

        get().logAction(id, 'accepted', `Offer accepted via ${method}`, {
            previousStatus: offer.status,
            newStatus: 'accepted',
        });

        return true;
    },

    rejectOffer: (id, reason) => {
        const offer = get().offers.find((o) => o.id === id);
        if (!offer) return false;
        if (!VALID_TRANSITIONS[offer.status].includes('rejected')) return false;

        set((state) => ({
            offers: state.offers.map((o) =>
                o.id === id
                    ? {
                        ...o,
                        status: 'rejected' as OfferStatus,
                        rejectedAt: new Date().toISOString(),
                        rejectionReason: reason,
                    }
                    : o
            ),
        }));

        get().logAction(id, 'rejected', `Offer rejected${reason ? `: ${reason}` : ''}`, {
            previousStatus: offer.status,
            newStatus: 'rejected',
        });

        return true;
    },

    markExpired: (id) => {
        const offer = get().offers.find((o) => o.id === id);
        if (!offer) return false;
        if (!VALID_TRANSITIONS[offer.status].includes('expired')) return false;

        set((state) => ({
            offers: state.offers.map((o) =>
                o.id === id ? { ...o, status: 'expired' as OfferStatus } : o
            ),
        }));

        get().logAction(id, 'expired', 'Offer marked as expired', {
            previousStatus: offer.status,
            newStatus: 'expired',
        });

        return true;
    },

    convertToOrder: (id) => {
        const offer = get().offers.find((o) => o.id === id);
        if (!offer) return null;
        if (offer.status !== 'accepted') return null;

        const orderNumber = `ORD-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
        const orderId = `ord-${Date.now()}`;

        set((state) => ({
            offers: state.offers.map((o) =>
                o.id === id
                    ? {
                        ...o,
                        status: 'converted' as OfferStatus,
                        convertedAt: new Date().toISOString(),
                        convertedOrderId: orderId,
                        convertedOrderNumber: orderNumber,
                    }
                    : o
            ),
        }));

        get().logAction(id, 'converted', `Offer converted to Order ${orderNumber}`, {
            previousStatus: 'accepted',
            newStatus: 'converted',
            metadata: { orderId, orderNumber },
        });

        return orderNumber;
    },

    createFromTemplate: (templateId, counterparty) => {
        const template = get().templates.find((t) => t.id === templateId);
        if (!template) return null;

        const offer = get().createOffer({
            counterparty,
            currency: template.defaultCurrency,
            validityDays: template.defaultValidityDays,
            paymentTerms: template.defaultPaymentTerms,
            deliveryTerms: template.defaultDeliveryTerms,
            termsAndConditions: template.defaultTermsAndConditions,
            disclaimer: template.defaultDisclaimer,
            lineItems: template.defaultLineItems.map((item) => ({
                ...item,
                quantity: 1,
                currency: template.defaultCurrency,
            })) as OfferLineItem[],
            templateId: template.id,
            templateName: template.name,
        });

        // Update template usage
        set((state) => ({
            templates: state.templates.map((t) =>
                t.id === templateId
                    ? { ...t, usageCount: t.usageCount + 1, lastUsedAt: new Date().toISOString() }
                    : t
            ),
        }));

        return offer;
    },

    getMarginPreview: (id) => {
        const offer = get().offers.find((o) => o.id === id);
        if (!offer) return null;

        const lineItems = offer.lineItems.map((item) => ({
            lineId: item.id,
            description: item.description,
            revenue: item.netAmount,
            cost: (item.costPrice || 0) * item.quantity,
            margin: item.marginAmount || 0,
            marginPercent: item.marginPercent || 0,
        }));

        const totalRevenue = lineItems.reduce((sum, item) => sum + item.revenue, 0);
        const totalCost = lineItems.reduce((sum, item) => sum + item.cost, 0);
        const grossMargin = totalRevenue - totalCost;
        const grossMarginPercent = totalRevenue > 0 ? (grossMargin / totalRevenue) * 100 : 0;
        const discountImpact = offer.totalDiscount;
        const netMargin = grossMargin;
        const netMarginPercent = grossMarginPercent;

        const warnings: string[] = [];
        if (grossMarginPercent < 30) warnings.push('Gross margin below 30% threshold');
        if (lineItems.some((item) => item.marginPercent < 20)) warnings.push('One or more line items have margin below 20%');
        if (discountImpact > totalRevenue * 0.15) warnings.push('Total discount exceeds 15% of revenue');

        return {
            lineItems,
            totals: {
                totalRevenue,
                totalCost,
                grossMargin,
                grossMarginPercent,
                discountImpact,
                netMargin,
                netMarginPercent,
            },
            assumptions: [
                'Cost prices based on standard cost data',
                'Margin calculations exclude taxes',
                'No volume rebates or promotional adjustments applied',
            ],
            warnings,
        };
    },

    logAction: (offerId, action, details, extra = {}) => {
        const offer = get().offers.find((o) => o.id === offerId);
        const log: OfferAuditLog = {
            id: `log-${Date.now()}`,
            offerId,
            offerNumber: offer?.offerNumber || 'Unknown',
            action,
            details,
            userId: 'current-user',
            userName: 'Current User',
            userRole: 'Sales',
            timestamp: new Date().toISOString(),
            ...extra,
        };

        set((state) => ({
            auditLogs: [log, ...state.auditLogs].slice(0, 500),
        }));
    },
}));