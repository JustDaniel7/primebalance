// =============================================================================
// ARCHIVE API - Export & Evidence Generation (TS Section 15)
// src/app/api/archive/export/route.ts
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

// =============================================================================
// POST - Create Export Request
// =============================================================================

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const {
            exportType = 'filtered',
            exportFormat = 'pdf',
            archiveRecordIds,
            filters,
            purpose,
            includeAttachments = false,
            includeLineage = false,
        } = body;

        // Validate export format
        const validFormats = ['pdf', 'xml', 'csv', 'json', 'legal_bundle'];
        if (!validFormats.includes(exportFormat)) {
            return NextResponse.json(
                { error: `Invalid export format. Must be one of: ${validFormats.join(', ')}` },
                { status: 400 }
            );
        }

        // Validate export type
        const validTypes = ['full', 'filtered', 'single', 'bundle'];
        if (!validTypes.includes(exportType)) {
            return NextResponse.json(
                { error: `Invalid export type. Must be one of: ${validTypes.join(', ')}` },
                { status: 400 }
            );
        }

        // For single export, archiveRecordIds must have exactly one ID
        if (exportType === 'single' && (!archiveRecordIds || archiveRecordIds.length !== 1)) {
            return NextResponse.json(
                { error: 'Single export requires exactly one archiveRecordId' },
                { status: 400 }
            );
        }

        // Generate export number
        const exportNumber = `EXP-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

        // Determine records to export
        let recordIds: string[] = [];
        let recordCount = 0;

        if (archiveRecordIds?.length) {
            // Verify all records exist and belong to organization
            const records = await (prisma as any).archiveRecord.findMany({
                where: {
                    id: { in: archiveRecordIds },
                    organizationId: session.user.organizationId,
                },
                select: { id: true },
            });
            recordIds = records.map((r: any) => r.id);
            recordCount = recordIds.length;

            if (recordCount !== archiveRecordIds.length) {
                return NextResponse.json(
                    { error: 'Some archive records not found or not accessible' },
                    { status: 404 }
                );
            }
        } else if (filters) {
            // Build where clause from filters
            const where: any = {
                organizationId: session.user.organizationId,
            };

            if (filters.objectType) where.objectType = filters.objectType;
            if (filters.category) where.category = filters.category;
            if (filters.fiscalYear) where.fiscalYear = filters.fiscalYear;
            if (filters.dateFrom || filters.dateTo) {
                where.effectiveDate = {};
                if (filters.dateFrom) where.effectiveDate.gte = new Date(filters.dateFrom);
                if (filters.dateTo) where.effectiveDate.lte = new Date(filters.dateTo);
            }

            // Limit export size
            const maxExportRecords = 10000;
            const records = await (prisma as any).archiveRecord.findMany({
                where,
                select: { id: true },
                take: maxExportRecords,
            });
            recordIds = records.map((r: any) => r.id);
            recordCount = recordIds.length;
        } else if (exportType === 'full') {
            // Full export - limit to prevent abuse
            const maxExportRecords = 10000;
            const records = await (prisma as any).archiveRecord.findMany({
                where: { organizationId: session.user.organizationId },
                select: { id: true },
                take: maxExportRecords,
            });
            recordIds = records.map((r: any) => r.id);
            recordCount = recordIds.length;
        }

        if (recordCount === 0) {
            return NextResponse.json(
                { error: 'No records match the export criteria' },
                { status: 400 }
            );
        }

        // Create export record
        const archiveExport = await (prisma as any).archiveExport.create({
            data: {
                exportNumber,
                exportType,
                exportFormat,
                archiveRecordIds: recordIds,
                recordCount,
                filterCriteria: filters,
                status: 'pending',
                requestedBy: session.user.id,
                requestedByName: session.user.name || session.user.email,
                requestPurpose: purpose,
                organizationId: session.user.organizationId,
                chainOfCustody: {
                    generatedAt: new Date().toISOString(),
                    generatedBy: session.user.id,
                    generatedByName: session.user.name || session.user.email,
                    purpose: purpose || 'Archive export',
                    recipients: [],
                    handoffs: [],
                },
            },
        });

        // Generate export content (in production, this would be async/queued)
        try {
            const records = await (prisma as any).archiveRecord.findMany({
                where: { id: { in: recordIds } },
                orderBy: { archivedAt: 'desc' },
            });

            // Build export content based on format
            let exportContent: any;
            let contentType: string;

            switch (exportFormat) {
                case 'json':
                    exportContent = {
                        exportNumber,
                        exportedAt: new Date().toISOString(),
                        exportedBy: session.user.name || session.user.email,
                        purpose,
                        recordCount,
                        records: records.map((r: any) => ({
                            ...r,
                            amount: r.amount ? Number(r.amount) : null,
                            confidenceScore: Number(r.confidenceScore),
                        })),
                    };
                    contentType = 'application/json';
                    break;

                case 'csv':
                    // Build CSV content
                    const headers = [
                        'archiveRecordId', 'originalObjectId', 'objectType', 'title',
                        'amount', 'currency', 'effectiveDate', 'archivedAt', 'category',
                        'counterpartyName', 'status', 'contentHash',
                    ];
                    const rows = records.map((r: any) => [
                        r.archiveRecordId,
                        r.originalObjectId,
                        r.objectType,
                        `"${(r.title || '').replace(/"/g, '""')}"`,
                        r.amount ? Number(r.amount) : '',
                        r.currency,
                        r.effectiveDate?.toISOString() || '',
                        r.archivedAt.toISOString(),
                        r.category,
                        `"${(r.counterpartyName || '').replace(/"/g, '""')}"`,
                        r.status,
                        r.contentHash,
                    ].join(','));
                    exportContent = [headers.join(','), ...rows].join('\n');
                    contentType = 'text/csv';
                    break;

                case 'legal_bundle':
                    // Legal bundle includes integrity proofs
                    const bundleRecords = await Promise.all(
                        records.map(async (r: any) => {
                            let lineage = null;
                            if (includeLineage) {
                                lineage = await getRecordLineage(r.id);
                            }
                            return {
                                record: {
                                    ...r,
                                    amount: r.amount ? Number(r.amount) : null,
                                },
                                integrityProof: {
                                    contentHash: r.contentHash,
                                    predecessorHash: r.predecessorHash,
                                    signatureCount: r.signatureCount,
                                    verified: r.integrityVerified,
                                    verifiedAt: r.lastVerifiedAt,
                                },
                                lineage,
                            };
                        })
                    );

                    exportContent = {
                        exportNumber,
                        exportedAt: new Date().toISOString(),
                        exportedBy: session.user.name || session.user.email,
                        purpose,
                        recordCount,
                        legalDisclaimer: 'This export constitutes an authentic copy of archived records. Integrity can be verified using the provided content hashes.',
                        records: bundleRecords,
                        exportIntegrityHash: crypto
                            .createHash('sha256')
                            .update(JSON.stringify(bundleRecords.map((r: any) => r.record.contentHash)))
                            .digest('hex'),
                    };
                    contentType = 'application/json';
                    break;

                default:
                    exportContent = { records };
                    contentType = 'application/json';
            }

            // Calculate file hash
            const contentString = typeof exportContent === 'string'
                ? exportContent
                : JSON.stringify(exportContent);
            const fileHash = crypto.createHash('sha256').update(contentString).digest('hex');
            const fileSize = Buffer.byteLength(contentString, 'utf8');

            // Generate integrity proof
            const integrityProof = crypto
                .createHash('sha256')
                .update(`${exportNumber}:${fileHash}:${session.user.id}:${new Date().toISOString()}`)
                .digest('hex');

            // Update export record
            await (prisma as any).archiveExport.update({
                where: { id: archiveExport.id },
                data: {
                    status: 'completed',
                    generatedAt: new Date(),
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
                    fileSize,
                    fileHash,
                    integrityProof,
                },
            });

            // Log export access for each record
            for (const recordId of recordIds.slice(0, 100)) { // Limit to avoid too many logs
                await (prisma as any).archiveAccessLog.create({
                    data: {
                        archiveRecordId: recordId,
                        accessType: 'export',
                        accessReason: `Export ${exportNumber}: ${purpose || 'Archive export'}`,
                        actorId: session.user.id,
                        actorName: session.user.name || session.user.email,
                        actorType: 'user',
                        accessGranted: true,
                    },
                }).catch(() => {}); // Don't fail if log fails
            }

            return NextResponse.json({
                export: {
                    id: archiveExport.id,
                    exportNumber,
                    exportType,
                    exportFormat,
                    recordCount,
                    status: 'completed',
                    fileSize,
                    fileHash,
                    integrityProof,
                    generatedAt: new Date().toISOString(),
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                },
                content: exportContent,
                contentType,
                chainOfCustody: archiveExport.chainOfCustody,
            }, { status: 201 });

        } catch (genError) {
            // Update export as failed
            await (prisma as any).archiveExport.update({
                where: { id: archiveExport.id },
                data: { status: 'failed' },
            });
            throw genError;
        }
    } catch (error) {
        console.error('Error creating export:', error);
        return NextResponse.json(
            { error: 'Failed to create export' },
            { status: 500 }
        );
    }
}

// =============================================================================
// GET - List Exports
// =============================================================================

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const limit = parseInt(searchParams.get('limit') || '50');

        const where: any = {
            organizationId: session.user.organizationId,
        };

        if (status) where.status = status;

        const exports = await (prisma as any).archiveExport.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: limit,
        });

        return NextResponse.json({ exports });
    } catch (error) {
        console.error('Error fetching exports:', error);
        return NextResponse.json(
            { error: 'Failed to fetch exports' },
            { status: 500 }
        );
    }
}

// Helper to get record lineage
async function getRecordLineage(recordId: string) {
    const links = await (prisma as any).archiveLink.findMany({
        where: {
            OR: [
                { sourceArchiveId: recordId },
                { targetArchiveId: recordId },
            ],
        },
    });

    return {
        inbound: links.filter((l: any) => l.targetArchiveId === recordId),
        outbound: links.filter((l: any) => l.sourceArchiveId === recordId),
    };
}