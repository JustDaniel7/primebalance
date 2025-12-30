// =============================================================================
// ARCHIVE API - Import & Migration (TS Section 10)
// src/app/api/archive/import/route.ts
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

// =============================================================================
// POST - Import Archive Records
// =============================================================================

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const {
            source = 'csv',
            mode = 'live',
            data,
            fieldMapping,
            dateFrom,
            dateTo,
            objectTypeFilter,
        } = body;

        // Validate
        if (!data || !Array.isArray(data) || data.length === 0) {
            return NextResponse.json(
                { error: 'Import data is required and must be a non-empty array' },
                { status: 400 }
            );
        }

        // Generate batch info
        const batchNumber = `IMP-ARC-${Date.now()}`;
        const sourceHash = crypto.createHash('md5').update(JSON.stringify(data)).digest('hex');

        // Check for duplicate import
        const existingBatch = await (prisma as any).archiveImportBatch.findFirst({
            where: { sourceHash },
        });

        if (existingBatch) {
            return NextResponse.json(
                {
                    error: 'This data has already been imported',
                    existingBatchId: existingBatch.id,
                    existingBatchNumber: existingBatch.batchNumber,
                    code: 'DUPLICATE_IMPORT',
                },
                { status: 409 }
            );
        }

        const results = {
            totalRecords: data.length,
            successCount: 0,
            errorCount: 0,
            warningCount: 0,
            skippedCount: 0,
            errors: [] as any[],
            warnings: [] as any[],
            createdRecordIds: [] as string[],
        };

        // Create import batch record
        const importBatch = await (prisma as any).archiveImportBatch.create({
            data: {
                batchNumber,
                source,
                sourceHash,
                totalRecords: data.length,
                status: 'processing',
                importMode: mode,
                dateFrom: dateFrom ? new Date(dateFrom) : null,
                dateTo: dateTo ? new Date(dateTo) : null,
                objectTypeFilter,
                fieldMapping,
                importedBy: session.user.id,
                importedByName: session.user.name || session.user.email,
                organizationId: session.user.organizationId,
            },
        });

        // Process each record
        for (let i = 0; i < data.length; i++) {
            const record = data[i];
            const rowNum = i + 1;

            try {
                // Apply field mapping
                const mapped = fieldMapping ? applyFieldMapping(record, fieldMapping) : record;

                // Validate required fields
                const requiredFields = ['originalObjectId', 'objectType', 'title', 'content', 'category'];
                const missingFields = requiredFields.filter(f => !mapped[f]);

                if (missingFields.length > 0) {
                    results.errors.push({
                        row: rowNum,
                        code: 'MISSING_FIELDS',
                        message: `Missing required fields: ${missingFields.join(', ')}`,
                    });
                    results.errorCount++;
                    continue;
                }

                // Apply date filter
                if (dateFrom && mapped.effectiveDate) {
                    if (new Date(mapped.effectiveDate) < new Date(dateFrom)) {
                        results.skippedCount++;
                        continue;
                    }
                }
                if (dateTo && mapped.effectiveDate) {
                    if (new Date(mapped.effectiveDate) > new Date(dateTo)) {
                        results.skippedCount++;
                        continue;
                    }
                }

                // Apply object type filter
                if (objectTypeFilter && mapped.objectType !== objectTypeFilter) {
                    results.skippedCount++;
                    continue;
                }

                // Dry run - only validate
                if (mode === 'dry_run') {
                    results.successCount++;
                    continue;
                }

                // Check for existing record
                const existingRecord = await (prisma as any).archiveRecord.findFirst({
                    where: {
                        organizationId: session.user.organizationId,
                        originalObjectId: mapped.originalObjectId,
                        objectType: mapped.objectType,
                        objectVersion: mapped.objectVersion || 1,
                    },
                });

                if (existingRecord) {
                    results.warnings.push({
                        row: rowNum,
                        code: 'DUPLICATE_RECORD',
                        message: `Record already exists: ${existingRecord.archiveRecordId}`,
                    });
                    results.warningCount++;
                    results.skippedCount++;
                    continue;
                }

                // Generate archive record ID
                const timestamp = new Date();
                const version = mapped.objectVersion || 1;
                const archiveRecordId = `arc_${session.user.organizationId.slice(-6)}_${mapped.objectType}_${mapped.originalObjectId}_v${version}_${timestamp.getTime()}`;

                // Generate content hash
                const contentString = JSON.stringify(mapped.content, Object.keys(mapped.content).sort());
                const contentHash = crypto.createHash('sha256').update(contentString).digest('hex');

                // Create archive record
                const archiveRecord = await (prisma as any).archiveRecord.create({
                    data: {
                        archiveRecordId,
                        originalObjectId: mapped.originalObjectId,
                        objectType: mapped.objectType,
                        objectVersion: version,
                        legalEntityId: mapped.legalEntityId,
                        partyId: mapped.partyId,

                        createdAt: mapped.createdAt ? new Date(mapped.createdAt) : timestamp,
                        archivedAt: timestamp,
                        effectiveDate: mapped.effectiveDate ? new Date(mapped.effectiveDate) : null,
                        accountingPeriod: mapped.accountingPeriod,
                        fiscalYear: mapped.fiscalYear,
                        fiscalPeriod: mapped.fiscalPeriod,
                        timezone: mapped.timezone || 'UTC',

                        contentHash,
                        signatureCount: 1,
                        integrityVerified: true,
                        lastVerifiedAt: timestamp,

                        triggerType: 'batch_job',
                        triggerReason: `Imported from ${source}`,
                        triggerExplanation: `Batch import ${batchNumber}`,
                        initiatingActor: session.user.id,
                        initiatingActorName: session.user.name || session.user.email,
                        actorType: 'user',
                        sourceModule: mapped.sourceModule,
                        linkedEntityIds: mapped.linkedEntityIds || [],

                        title: mapped.title,
                        description: mapped.description,
                        content: mapped.content,
                        contentType: 'json',
                        contentSize: contentString.length,

                        amount: mapped.amount,
                        currency: mapped.currency || 'EUR',
                        reportingCurrency: mapped.reportingCurrency,
                        fxRateAtArchive: mapped.fxRateAtArchive,

                        category: mapped.category,
                        subcategory: mapped.subcategory,
                        jurisdictionIds: mapped.jurisdictionIds || [],
                        tags: mapped.tags || [],
                        systemTags: ['imported'],
                        confidenceScore: 1.0,
                        validationMode: 'soft',

                        locale: mapped.locale,
                        language: mapped.language || 'en',

                        counterpartyId: mapped.counterpartyId,
                        counterpartyName: mapped.counterpartyName,
                        counterpartyType: mapped.counterpartyType,

                        versionNumber: version,
                        isCurrentVersion: true,

                        retentionStatus: 'active',
                        status: 'archived',

                        importBatchId: importBatch.id,
                        importSource: source,
                        importedAt: timestamp,

                        organizationId: session.user.organizationId,
                    },
                });

                results.createdRecordIds.push(archiveRecord.id);
                results.successCount++;

            } catch (error: any) {
                results.errors.push({
                    row: rowNum,
                    code: 'PROCESSING_ERROR',
                    message: error.message || 'Unknown error',
                });
                results.errorCount++;
            }
        }

        // Update import batch with results
        const finalStatus = results.errorCount === results.totalRecords ? 'failed' : 'completed';

        await (prisma as any).archiveImportBatch.update({
            where: { id: importBatch.id },
            data: {
                successCount: results.successCount,
                errorCount: results.errorCount,
                warningCount: results.warningCount,
                skippedCount: results.skippedCount,
                status: finalStatus,
                errors: results.errors,
                warnings: results.warnings,
                createdRecordIds: results.createdRecordIds,
                canRollback: mode === 'live' && results.successCount > 0,
                completedAt: new Date(),
            },
        });

        return NextResponse.json({
            batchNumber,
            batchId: importBatch.id,
            mode,
            results: {
                totalRecords: results.totalRecords,
                successCount: results.successCount,
                errorCount: results.errorCount,
                warningCount: results.warningCount,
                skippedCount: results.skippedCount,
            },
            errors: results.errors.slice(0, 50), // Limit errors returned
            warnings: results.warnings.slice(0, 50),
            canRollback: mode === 'live' && results.successCount > 0,
            message: mode === 'dry_run'
                ? `Dry run complete. ${results.successCount} records would be imported.`
                : `Import complete. ${results.successCount} records imported.`,
        }, { status: 201 });

    } catch (error) {
        console.error('Error importing archives:', error);
        return NextResponse.json(
            { error: 'Failed to import archives' },
            { status: 500 }
        );
    }
}

// =============================================================================
// GET - List Import Batches
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

        const batches = await (prisma as any).archiveImportBatch.findMany({
            where,
            orderBy: { startedAt: 'desc' },
            take: limit,
        });

        return NextResponse.json({ batches });
    } catch (error) {
        console.error('Error fetching import batches:', error);
        return NextResponse.json(
            { error: 'Failed to fetch import batches' },
            { status: 500 }
        );
    }
}

// Helper function
function applyFieldMapping(record: any, mapping: Record<string, string>): any {
    const result: any = { ...record };

    for (const [targetField, sourceField] of Object.entries(mapping)) {
        if (record[sourceField] !== undefined) {
            result[targetField] = record[sourceField];
        }
    }

    return result;
}