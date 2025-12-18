import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
    ArchiveItem,
    ArchiveCategory,
    ArchiveFilter,
    ArchiveStats,
    ArchiveAttachment,
    ArchiveItemStatus,
} from '@/types/archive';

// =============================================================================
// ARCHIVE STORE - API CONNECTED
// =============================================================================

interface ArchiveState {
    items: ArchiveItem[];
    filter: ArchiveFilter;
    isLoading: boolean;
    error: string | null;
    isInitialized: boolean;

    // API Actions
    fetchItems: () => Promise<void>;

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

function mapApiToArchiveItem(api: any): ArchiveItem {
    return {
        id: api.id,
        category: api.category,
        status: api.status || 'archived',
        originalId: api.originalId,
        originalType: api.originalType,
        title: api.title,
        description: api.description,
        amount: api.amount ? Number(api.amount) : undefined,
        currency: api.currency,
        counterparty: api.counterparty,
        itemDate: api.itemDate?.split('T')[0] || api.itemDate,
        archivedAt: api.archivedAt,
        restoredAt: api.restoredAt,
        periodStart: api.periodStart?.split('T')[0],
        periodEnd: api.periodEnd?.split('T')[0],
        attachments: api.attachments || [],
        tags: api.tags || [],
        notes: api.notes,
        archivedBy: api.archivedBy,
        fiscalYear: api.fiscalYear,
    };
}

export const useArchiveStore = create<ArchiveState>()(
    persist(
        (set, get) => ({
            items: [],
            filter: initialFilter,
            isLoading: false,
            error: null,
            isInitialized: false,

            fetchItems: async () => {
                set({ isLoading: true, error: null });
                try {
                    const response = await fetch('/api/archive');
                    if (!response.ok) throw new Error('Failed to fetch archive');
                    const data = await response.json();
                    const items = (data.items || data || []).map(mapApiToArchiveItem);
                    set({ items, isLoading: false, isInitialized: true });
                } catch (error) {
                    console.error('Failed to fetch archive:', error);
                    set({ error: (error as Error).message, isLoading: false, isInitialized: true });
                }
            },

            addToArchive: (itemData) => {
                const newItem: ArchiveItem = {
                    ...itemData,
                    id: `arc-${Date.now()}`,
                    archivedAt: new Date().toISOString(),
                    status: 'archived',
                };

                set((state) => ({ items: [...state.items, newItem] }));

                fetch('/api/archive', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(itemData),
                }).catch(console.error);

                return newItem;
            },

            restoreFromArchive: (id) => {
                set((state) => ({
                    items: state.items.map((item) =>
                        item.id === id
                            ? { ...item, status: 'restored' as ArchiveItemStatus, restoredAt: new Date().toISOString() }
                            : item
                    ),
                }));

                fetch(`/api/archive/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'restored', restoredAt: new Date().toISOString() }),
                }).catch(console.error);
            },

            permanentlyDelete: (id) => {
                set((state) => ({
                    items: state.items.filter((i) => i.id !== id),
                }));

                fetch(`/api/archive/${id}`, { method: 'DELETE' }).catch(console.error);
            },

            updateArchiveItem: (id, updates) => {
                set((state) => ({
                    items: state.items.map((item) =>
                        item.id === id ? { ...item, ...updates } : item
                    ),
                }));

                fetch(`/api/archive/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updates),
                }).catch(console.error);
            },

            setFilter: (filter) => set((state) => ({ filter: { ...state.filter, ...filter } })),

            resetFilter: () => set({ filter: initialFilter }),

            getFilteredItems: () => {
                const { items, filter } = get();
                return items.filter((item) => {
                    if (item.status !== 'archived') return false;
                    if (filter.category && item.category !== filter.category) return false;
                    if (filter.fiscalYear && item.fiscalYear !== filter.fiscalYear) return false;
                    if (filter.searchQuery) {
                        const query = filter.searchQuery.toLowerCase();
                        if (
                            !item.title.toLowerCase().includes(query) &&
                            !item.description?.toLowerCase().includes(query) &&
                            !item.counterparty?.toLowerCase().includes(query)
                        ) return false;
                    }
                    if (filter.tags && filter.tags.length > 0) {
                        if (!filter.tags.some((t) => item.tags?.includes(t))) return false;
                    }
                    return true;
                });
            },

            getStats: () => {
                const { items } = get();
                const archivedItems = items.filter((i) => i.status === 'archived');

                const byCategory = archivedItems.reduce((acc, item) => {
                    acc[item.category] = (acc[item.category] || 0) + 1;
                    return acc;
                }, {} as Record<ArchiveCategory, number>);

                const byYear = archivedItems.reduce((acc, item) => {
                    if (item.fiscalYear) acc[item.fiscalYear] = (acc[item.fiscalYear] || 0) + 1;
                    return acc;
                }, {} as Record<number, number>);

                const totalValue = archivedItems.reduce((sum, item) => sum + (item.amount || 0), 0);

                return {
                    totalItems: archivedItems.length,
                    byCategory,
                    byYear,
                    totalValue,
                };
            },

            getItemsByCategory: (category) => get().items.filter((i) => i.category === category && i.status === 'archived'),

            getItemsByYear: (year) => get().items.filter((i) => i.fiscalYear === year && i.status === 'archived'),

            archiveMultiple: (itemsData) => {
                itemsData.forEach((item) => get().addToArchive(item));
            },

            deleteByYear: (year) => {
                const itemsToDelete = get().items.filter((i) => i.fiscalYear === year);
                itemsToDelete.forEach((item) => get().permanentlyDelete(item.id));
            },
        }),
        {
            name: 'primebalance-archive',
            partialize: (state) => ({ items: state.items }),
        }
    )
);