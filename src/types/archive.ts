// =============================================================================
// ARCHIVE TYPES
// =============================================================================

export type ArchiveCategory = 'bookings' | 'invoices' | 'bank' | 'services' | 'documents' | 'contracts';
export type ArchiveItemStatus = 'archived' | 'restored';

export interface ArchiveItem {
    id: string;
    category: ArchiveCategory;
    status: ArchiveItemStatus;

    // Original item reference
    originalId: string;
    originalType: string;

    // Display info
    title: string;
    description?: string;
    amount?: number;
    currency?: string;

    // Parties
    counterparty?: string;

    // Dates
    itemDate: string;
    archivedAt: string;
    restoredAt?: string;

    // Period (for contracts, services)
    periodStart?: string;
    periodEnd?: string;

    // Files
    attachments?: ArchiveAttachment[];

    // Meta
    tags?: string[];
    notes?: string;
    archivedBy?: string;
    fiscalYear: number;
}

export interface ArchiveAttachment {
    id: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    fileUrl: string;
    uploadedAt: string;
}

export interface ArchiveFilter {
    category?: ArchiveCategory;
    fiscalYear?: number;
    searchQuery?: string;
    dateFrom?: string;
    dateTo?: string;
    tags?: string[];
}

export interface ArchiveStats {
    totalItems: number;
    byCategory: Record<ArchiveCategory, number>;
    byYear: Record<number, number>;
    totalValue: number;
}

// Category config with icons and colors
export const ARCHIVE_CATEGORIES: Array<{
    value: ArchiveCategory;
    icon: string;
    color: string;
}> = [
    { value: 'bookings', icon: 'BookOpen', color: 'blue' },
    { value: 'invoices', icon: 'FileText', color: 'green' },
    { value: 'bank', icon: 'Building2', color: 'purple' },
    { value: 'services', icon: 'Briefcase', color: 'amber' },
    { value: 'documents', icon: 'FolderOpen', color: 'gray' },
    { value: 'contracts', icon: 'FileSignature', color: 'rose' },
];