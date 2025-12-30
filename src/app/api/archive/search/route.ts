// =============================================================================
// ARCHIVE API - Advanced Search (TS Section 12)
// src/app/api/archive/search/route.ts
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// =============================================================================
// POST - Advanced Search with Complex Filters
// =============================================================================

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const {
            query,
            filters = {},
            page = 1,
            limit = 50,
            sortBy = 'archivedAt',
            sortOrder = 'desc',
            includeLinks = false,
            groupBy,
            aggregations = [],
        } = body;

        const skip = (page - 1) * Math.min(limit, 100);

        // Build where clause
        const where: any = {
            organizationId: session.user.organizationId,
        };

        // Text search across multiple fields
        if (query) {
            where.OR = [
                { title: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } },
                { archiveRecordId: { contains: query, mode: 'insensitive' } },
                { originalObjectId: { contains: query, mode: 'insensitive' } },
                { counterpartyName: { contains: query, mode: 'insensitive' } },
                { triggerReason: { contains: query, mode: 'insensitive' } },
            ];
        }

        // Apply filters
        if (filters.objectType) where.objectType = filters.objectType;
        if (filters.objectTypes?.length) where.objectType = { in: filters.objectTypes };
        if (filters.category) where.category = filters.category;
        if (filters.categories?.length) where.category = { in: filters.categories };
        if (filters.status) where.status = filters.status;
        if (filters.fiscalYear) where.fiscalYear = filters.fiscalYear;
        if (filters.fiscalPeriod) where.fiscalPeriod = filters.fiscalPeriod;
        if (filters.accountingPeriod) where.accountingPeriod = filters.accountingPeriod;
        if (filters.legalEntityId) where.legalEntityId = filters.legalEntityId;
        if (filters.partyId) where.partyId = filters.partyId;
        if (filters.counterpartyId) where.counterpartyId = filters.counterpartyId;
        if (filters.retentionStatus) where.retentionStatus = filters.retentionStatus;
        if (filters.triggerType) where.triggerType = filters.triggerType;
        if (filters.sourceModule) where.sourceModule = filters.sourceModule;
        if (filters.currency) where.currency = filters.currency;

        // Boolean filters
        if (filters.legalHold !== undefined) where.legalHold = filters.legalHold;
        if (!filters.includeSuperseded) where.isCurrentVersion = true;

        // Date range filters
        if (filters.dateFrom || filters.dateTo) {
            where.effectiveDate = {};
            if (filters.dateFrom) where.effectiveDate.gte = new Date(filters.dateFrom);
            if (filters.dateTo) where.effectiveDate.lte = new Date(filters.dateTo);
        }

        if (filters.archivedFrom || filters.archivedTo) {
            where.archivedAt = {};
            if (filters.archivedFrom) where.archivedAt.gte = new Date(filters.archivedFrom);
            if (filters.archivedTo) where.archivedAt.lte = new Date(filters.archivedTo);
        }

        // Amount range filters
        if (filters.amountMin !== undefined || filters.amountMax !== undefined) {
            where.amount = {};
            if (filters.amountMin !== undefined) where.amount.gte = filters.amountMin;
            if (filters.amountMax !== undefined) where.amount.lte = filters.amountMax;
        }

        // Array filters
        if (filters.tags?.length) where.tags = { hasSome: filters.tags };
        if (filters.systemTags?.length) where.systemTags = { hasSome: filters.systemTags };
        if (filters.jurisdictionId) where.jurisdictionIds = { has: filters.jurisdictionId };

        // Counterparty name search
        if (filters.counterpartyName) {
            where.counterpartyName = { contains: filters.counterpartyName, mode: 'insensitive' };
        }

        // Build orderBy
        const orderBy: any = {};
        orderBy[sortBy] = sortOrder;

        // Execute main query
        const [records, total] = await Promise.all([
            (prisma as any).archiveRecord.findMany({
                where,
                orderBy,
                take: Math.min(limit, 100),
                skip,
            }),
            (prisma as any).archiveRecord.count({ where }),
        ]);

        // Fetch links if requested
        let recordsWithLinks = records;
        if (includeLinks) {
            const recordIds = records.map((r: any) => r.id);
            const links = await (prisma as any).archiveLink.findMany({
                where: {
                    OR: [
                        { sourceArchiveId: { in: recordIds } },
                        { targetArchiveId: { in: recordIds } },
                    ],
                },
            });

            recordsWithLinks = records.map((record: any) => ({
                ...record,
                outboundLinks: links.filter((l: any) => l.sourceArchiveId === record.id),
                inboundLinks: links.filter((l: any) => l.targetArchiveId === record.id),
            }));
        }

        // Build aggregations if requested
        const aggregationResults: Record<string, any> = {};

        if (aggregations.includes('byObjectType')) {
            aggregationResults.byObjectType = await (prisma as any).archiveRecord.groupBy({
                by: ['objectType'],
                where,
                _count: { id: true },
                _sum: { amount: true },
            });
        }

        if (aggregations.includes('byCategory')) {
            aggregationResults.byCategory = await (prisma as any).archiveRecord.groupBy({
                by: ['category'],
                where,
                _count: { id: true },
            });
        }

        if (aggregations.includes('byFiscalYear')) {
            aggregationResults.byFiscalYear = await (prisma as any).archiveRecord.groupBy({
                by: ['fiscalYear'],
                where,
                _count: { id: true },
                _sum: { amount: true },
            });
        }

        if (aggregations.includes('byCurrency')) {
            aggregationResults.byCurrency = await (prisma as any).archiveRecord.groupBy({
                by: ['currency'],
                where,
                _count: { id: true },
                _sum: { amount: true },
            });
        }

        if (aggregations.includes('byTriggerType')) {
            aggregationResults.byTriggerType = await (prisma as any).archiveRecord.groupBy({
                by: ['triggerType'],
                where,
                _count: { id: true },
            });
        }

        // Build grouped results if requested
        let groupedResults: Record<string, any[]> | null = null;
        if (groupBy && ['objectType', 'category', 'fiscalYear', 'status'].includes(groupBy)) {
            groupedResults = {};
            for (const record of recordsWithLinks) {
                const key = String(record[groupBy] || 'unknown');
                if (!groupedResults[key]) groupedResults[key] = [];
                groupedResults[key].push(record);
            }
        }

        // Format records
        const formattedRecords = recordsWithLinks.map((record: any) => ({
            ...record,
            amount: record.amount ? Number(record.amount) : null,
            fxRateAtArchive: record.fxRateAtArchive ? Number(record.fxRateAtArchive) : null,
            amountInReporting: record.amountInReporting ? Number(record.amountInReporting) : null,
            confidenceScore: Number(record.confidenceScore),
        }));

        // Log search access
        await (prisma as any).archiveAccessLog.create({
            data: {
                archiveRecordId: records[0]?.id || 'search',
                accessType: 'search',
                accessReason: `Search: ${query || 'filtered'}`,
                accessScope: 'multiple',
                actorId: session.user.id,
                actorName: session.user.name || session.user.email,
                actorType: 'user',
                accessGranted: true,
            },
        }).catch(() => {}); // Don't fail if log fails

        return NextResponse.json({
            records: groupedResults ? undefined : formattedRecords,
            groupedResults,
            pagination: {
                page,
                limit: Math.min(limit, 100),
                total,
                totalPages: Math.ceil(total / Math.min(limit, 100)),
                hasNext: page * Math.min(limit, 100) < total,
                hasPrevious: page > 1,
            },
            aggregations: Object.keys(aggregationResults).length > 0 ? aggregationResults : undefined,
            query: {
                searchQuery: query,
                filters,
                sortBy,
                sortOrder,
            },
        });
    } catch (error) {
        console.error('Error searching archive:', error);
        return NextResponse.json(
            { error: 'Failed to search archive' },
            { status: 500 }
        );
    }
}