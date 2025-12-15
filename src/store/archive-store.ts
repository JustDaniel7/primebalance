import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ArchiveItem, ArchiveCategory, ArchiveFilter, ArchiveStats } from '@/types/archive';

// =============================================================================
// ARCHIVE STORE
// =============================================================================

interface ArchiveState {
    items: ArchiveItem[];
    filter: ArchiveFilter;

    // CRUD
    addToArchive: (item: Omit<ArchiveItem, 'id' | 'archivedAt' | 'status'>) => ArchiveItem;
    restoreFromArchive: (id: string) => void;
    permanentlyDelete: (id: string) => void;
    updateArchiveItem: (id: string, updates: Partial<ArchiveItem>) => void;

    // Filtering
    setFilter: (filter: Partial<ArchiveFilter>) => void;
    resetFilter: () => void;
    getFilteredItems: () => ArchiveItem[];

    // Stats
    getStats: () => ArchiveStats;
    getItemsByCategory: (category: ArchiveCategory) => ArchiveItem[];
    getItemsByYear: (year: number) => ArchiveItem[];

    // Bulk
    archiveMultiple: (items: Array<Omit<ArchiveItem, 'id' | 'archivedAt' | 'status'>>) => void;
    deleteByYear: (year: number) => void;
}

const initialFilter: ArchiveFilter = {
    category: undefined,
    fiscalYear: undefined,
    searchQuery: '',
    dateFrom: undefined,
    dateTo: undefined,
    tags: [],
};

// Demo archive items
const generateDemoArchive = (): ArchiveItem[] => [
    // Bookings
    {
        id: 'arch-001',
        category: 'bookings',
        status: 'archived',
        originalId: 'txn-2024-001',
        originalType: 'transaction',
        title: 'Jahresabschluss Buchung Q4',
        description: 'Abschlussbuchungen Geschäftsjahr 2024',
        amount: 125000,
        currency: 'EUR',
        itemDate: '2024-12-31',
        archivedAt: '2025-01-15T10:00:00Z',
        fiscalYear: 2024,
        tags: ['jahresabschluss', 'q4'],
    },
    {
        id: 'arch-002',
        category: 'bookings',
        status: 'archived',
        originalId: 'txn-2024-002',
        originalType: 'transaction',
        title: 'Abschreibungen 2024',
        description: 'Planmäßige Abschreibungen Anlagevermögen',
        amount: 45000,
        currency: 'EUR',
        itemDate: '2024-12-31',
        archivedAt: '2025-01-15T10:00:00Z',
        fiscalYear: 2024,
        tags: ['abschreibung', 'anlagen'],
    },
    // Invoices
    {
        id: 'arch-003',
        category: 'invoices',
        status: 'archived',
        originalId: 'inv-2024-089',
        originalType: 'invoice',
        title: 'Rechnung Schmidt & Partner',
        description: 'Beratungsleistungen November 2024',
        amount: 8500,
        currency: 'EUR',
        counterparty: 'Schmidt & Partner GmbH',
        itemDate: '2024-11-30',
        archivedAt: '2025-01-10T09:00:00Z',
        fiscalYear: 2024,
        tags: ['beratung', 'bezahlt'],
    },
    {
        id: 'arch-004',
        category: 'invoices',
        status: 'archived',
        originalId: 'inv-2024-090',
        originalType: 'invoice',
        title: 'Rechnung Tech Solutions AG',
        description: 'IT Support Dezember 2024',
        amount: 3200,
        currency: 'CHF',
        counterparty: 'Tech Solutions AG',
        itemDate: '2024-12-15',
        archivedAt: '2025-01-10T09:00:00Z',
        fiscalYear: 2024,
        tags: ['it', 'support', 'bezahlt'],
    },
    // Bank
    {
        id: 'arch-005',
        category: 'bank',
        status: 'archived',
        originalId: 'bank-2024-12',
        originalType: 'bank_statement',
        title: 'Kontoauszug Dezember 2024',
        description: 'Deutsche Bank Geschäftskonto',
        amount: 87500,
        currency: 'EUR',
        counterparty: 'Deutsche Bank',
        itemDate: '2024-12-31',
        archivedAt: '2025-01-05T08:00:00Z',
        fiscalYear: 2024,
        attachments: [
            { id: 'att-001', fileName: 'Kontoauszug_2024_12.pdf', fileType: 'application/pdf', fileSize: 245000, fileUrl: '/files/bank/2024-12.pdf', uploadedAt: '2025-01-05T08:00:00Z' },
        ],
    },
    // Services
    {
        id: 'arch-006',
        category: 'services',
        status: 'archived',
        originalId: 'svc-2024-015',
        originalType: 'service',
        title: 'Webentwicklung Projekt Alpha',
        description: 'Komplette Neuentwicklung Kundenportal',
        amount: 45000,
        currency: 'EUR',
        counterparty: 'Kunde ABC GmbH',
        itemDate: '2024-10-31',
        periodStart: '2024-06-01',
        periodEnd: '2024-10-31',
        archivedAt: '2024-11-15T14:00:00Z',
        fiscalYear: 2024,
        tags: ['projekt', 'webentwicklung', 'abgeschlossen'],
    },
    // Documents
    {
        id: 'arch-007',
        category: 'documents',
        status: 'archived',
        originalId: 'doc-2024-001',
        originalType: 'document',
        title: 'Steuererklärung 2023',
        description: 'Körperschaftsteuererklärung inkl. Anlagen',
        itemDate: '2024-07-31',
        archivedAt: '2024-08-15T10:00:00Z',
        fiscalYear: 2024,
        attachments: [
            { id: 'att-002', fileName: 'KSt_2023.pdf', fileType: 'application/pdf', fileSize: 1250000, fileUrl: '/files/tax/kst-2023.pdf', uploadedAt: '2024-08-15T10:00:00Z' },
        ],
        tags: ['steuer', 'finanzamt'],
    },
    {
        id: 'arch-008',
        category: 'documents',
        status: 'archived',
        originalId: 'doc-2024-002',
        originalType: 'document',
        title: 'Jahresabschluss 2023',
        description: 'Bilanz und GuV 2023',
        itemDate: '2024-06-30',
        archivedAt: '2024-07-01T09:00:00Z',
        fiscalYear: 2024,
        tags: ['bilanz', 'guv', 'jahresabschluss'],
    },
    // Contracts
    {
        id: 'arch-009',
        category: 'contracts',
        status: 'archived',
        originalId: 'ctr-2023-005',
        originalType: 'contract',
        title: 'Mietvertrag Büro München',
        description: 'Gewerbemietvertrag - gekündigt zum 31.12.2024',
        amount: 36000,
        currency: 'EUR',
        counterparty: 'Immobilien Müller GmbH',
        itemDate: '2021-01-01',
        periodStart: '2021-01-01',
        periodEnd: '2024-12-31',
        archivedAt: '2025-01-02T10:00:00Z',
        fiscalYear: 2024,
        tags: ['miete', 'gekündigt'],
    },
    {
        id: 'arch-010',
        category: 'contracts',
        status: 'archived',
        originalId: 'ctr-2022-012',
        originalType: 'contract',
        title: 'Wartungsvertrag Server',
        description: 'IT-Wartungsvertrag - abgelaufen',
        amount: 4800,
        currency: 'EUR',
        counterparty: 'IT Service Pro',
        itemDate: '2022-03-01',
        periodStart: '2022-03-01',
        periodEnd: '2024-02-28',
        archivedAt: '2024-03-01T08:00:00Z',
        fiscalYear: 2024,
        tags: ['it', 'wartung', 'abgelaufen'],
    },
];

export const useArchiveStore = create<ArchiveState>()(
    persist(
        (set, get) => ({
            items: generateDemoArchive(),
            filter: initialFilter,

            addToArchive: (itemData) => {
                const newItem: ArchiveItem = {
                    ...itemData,
                    id: `arch-${Date.now()}`,
                    status: 'archived',
                    archivedAt: new Date().toISOString(),
                };
                set((state) => ({ items: [...state.items, newItem] }));
                return newItem;
            },

            restoreFromArchive: (id) => {
                set((state) => ({
                    items: state.items.map((item) =>
                        item.id === id
                            ? { ...item, status: 'restored' as const, restoredAt: new Date().toISOString() }
                            : item
                    ),
                }));
            },

            permanentlyDelete: (id) => {
                set((state) => ({ items: state.items.filter((item) => item.id !== id) }));
            },

            updateArchiveItem: (id, updates) => {
                set((state) => ({
                    items: state.items.map((item) => (item.id === id ? { ...item, ...updates } : item)),
                }));
            },

            setFilter: (filter) => {
                set((state) => ({ filter: { ...state.filter, ...filter } }));
            },

            resetFilter: () => set({ filter: initialFilter }),

            getFilteredItems: () => {
                const { items, filter } = get();
                return items.filter((item) => {
                    if (item.status !== 'archived') return false;
                    if (filter.category && item.category !== filter.category) return false;
                    if (filter.fiscalYear && item.fiscalYear !== filter.fiscalYear) return false;
                    if (filter.searchQuery) {
                        const query = filter.searchQuery.toLowerCase();
                        const matches =
                            item.title.toLowerCase().includes(query) ||
                            item.description?.toLowerCase().includes(query) ||
                            item.counterparty?.toLowerCase().includes(query) ||
                            item.tags?.some((tag) => tag.toLowerCase().includes(query));
                        if (!matches) return false;
                    }
                    if (filter.dateFrom && item.itemDate < filter.dateFrom) return false;
                    if (filter.dateTo && item.itemDate > filter.dateTo) return false;
                    return true;
                });
            },

            getStats: () => {
                const items = get().items.filter((i) => i.status === 'archived');
                const byCategory: Record<ArchiveCategory, number> = {
                    bookings: 0,
                    invoices: 0,
                    bank: 0,
                    services: 0,
                    documents: 0,
                    contracts: 0,
                };
                const byYear: Record<number, number> = {};
                let totalValue = 0;

                items.forEach((item) => {
                    byCategory[item.category]++;
                    byYear[item.fiscalYear] = (byYear[item.fiscalYear] || 0) + 1;
                    if (item.amount) totalValue += item.amount;
                });

                return { totalItems: items.length, byCategory, byYear, totalValue };
            },

            getItemsByCategory: (category) => {
                return get().items.filter((i) => i.status === 'archived' && i.category === category);
            },

            getItemsByYear: (year) => {
                return get().items.filter((i) => i.status === 'archived' && i.fiscalYear === year);
            },

            archiveMultiple: (itemsData) => {
                const newItems = itemsData.map((data) => ({
                    ...data,
                    id: `arch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    status: 'archived' as const,
                    archivedAt: new Date().toISOString(),
                }));
                set((state) => ({ items: [...state.items, ...newItems] }));
            },

            deleteByYear: (year) => {
                set((state) => ({ items: state.items.filter((i) => i.fiscalYear !== year) }));
            },
        }),
        { name: 'primebalance-archive' }
    )
);