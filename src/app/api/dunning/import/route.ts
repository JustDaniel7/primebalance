// =============================================================================
// DUNNING API - Import (TS Section 13)
// Supports dry-run, live, and rollback capabilities
// src/app/api/dunning/import/route.ts
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
    DunningStatus,
    DunningEventType,
    DunningImportSource,
    DunningImportMode,
    DunningLevel,
    generateDunningId,
    generateDunningNumber,
    generateEventId,
    calculateDaysPastDue,
    calculateTotalDue,
} from '@/types/dunning';
import crypto from 'crypto';

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
        const page = parseInt(searchParams.get('page') || '1');
        const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
        const skip = (page - 1) * limit;
        const status = searchParams.get('status');

        const where: any = { organizationId: session.user.organizationId };
        if (status) where.status = status;

        const [batches, total] = await Promise.all([
            (prisma as any).dunningImportBatch.findMany({
                where,
                orderBy: { startedAt: 'desc' },
                take: limit,
                skip,
            }),
            (prisma as any).dunningImportBatch.count({ where }),
        ]);

        return NextResponse.json({
            batches,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasNext: page * limit < total,
                hasPrevious: page > 1,
            },
        });
    } catch (error) {
        console.error('Error fetching import batches:', error);
        return NextResponse.json(
            { error: 'Failed to fetch import batches' },
            { status: 500 }
        );
    }
}

// =============================================================================
// POST - Import Dunning Records (TS Section 13)
// =============================================================================

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const {
            source = DunningImportSource.CSV,
            mode = DunningImportMode.DRY_RUN,
            data,
            fieldMapping,
            dateFrom,
            dateTo,
            customerFilter,
        } = body;

        if (!data || !Array.isArray(data) || data.length === 0) {
            return NextResponse.json(
                { error: 'Data array is required and must not be empty' },
                { status: 400 }
            );
        }

        if (data.length > 1000) {
            return NextResponse.json(
                { error: 'Maximum 1000 records per import batch' },
                { status: 400 }
            );
        }

        const now = new Date();

        // Generate batch number
        const batchCount = await (prisma as any).dunningImportBatch.count({
            where: { organizationId: session.user.organizationId },
        });
        const batchNumber = `IMP-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${String(batchCount + 1).padStart(5, '0')}`;

        // Calculate source hash for deduplication
        const sourceHash = crypto
            .createHash('sha256')
            .update(JSON.stringify(data))
            .digest('hex')
            .substring(0, 16);

        // Check for duplicate import
        const existingBatch = await (prisma as any).dunningImportBatch.findFirst({
            where: {
                organizationId: session.user.organizationId,
                sourceHash,
                status: { in: ['completed', 'processing'] },
            },
        });

        if (existingBatch) {
            return NextResponse.json(
                {
                    error: 'Duplicate import detected',
                    code: 'DUPLICATE_IMPORT',
                    existingBatchNumber: existingBatch.batchNumber,
                },
                { status: 400 }
            );
        }

        // Create batch record
        const batch = await (prisma as any).dunningImportBatch.create({
            data: {
                batchNumber,
                source,
                sourceHash,
                totalRecords: data.length,
                successCount: 0,
                errorCount: 0,
                warningCount: 0,
                skippedCount: 0,
                status: 'processing',
                importMode: mode,
                dateFrom: dateFrom ? new Date(dateFrom) : null,
                dateTo: dateTo ? new Date(dateTo) : null,
                customerFilter,
                fieldMapping,
                errors: [],
                warnings: [],
                createdDunningIds: [],
                canRollback: mode === DunningImportMode.LIVE,
                importedBy: session.user.id,
                importedByName: session.user.name || session.user.email,
                startedAt: now,
                organizationId: session.user.organizationId,
            },
        });

        // Process records
        const results = {
            success: [] as any[],
            errors: [] as any[],
            warnings: [] as any[],
            skipped: [] as any[],
        };

        const createdDunningIds: string[] = [];

        for (let i = 0; i < data.length; i++) {
            const record = data[i];
            const rowNum = i + 1;

            try {
                // Map fields
                const mapped = mapRecord(record, fieldMapping);

                // Validate required fields
                const validation = validateRecord(mapped, rowNum);
                if (validation.errors.length > 0) {
                    results.errors.push({
                        row: rowNum,
                        errors: validation.errors,
                        record: mapped,
                    });
                    continue;
                }

                if (validation.warnings.length > 0) {
                    results.warnings.push({
                        row: rowNum,
                        warnings: validation.warnings,
                    });
                }

                // Check for existing dunning
                const existing = await (prisma as any).dunning.findFirst({
                    where: {
                        organizationId: session.user.organizationId,
                        invoiceId: mapped.invoiceId,
                        status: { notIn: [DunningStatus.SETTLED, DunningStatus.WRITTEN_OFF] },
                    },
                });

                if (existing) {
                    results.skipped.push({
                        row: rowNum,
                        reason: 'Active dunning exists for invoice',
                        invoiceId: mapped.invoiceId,
                        existingDunningId: existing.dunningId,
                    });
                    continue;
                }

                // In dry-run mode, just validate
                if (mode === DunningImportMode.DRY_RUN) {
                    results.success.push({
                        row: rowNum,
                        invoiceId: mapped.invoiceId,
                        customerName: mapped.customerName,
                        amount: mapped.outstandingAmount,
                        wouldCreate: true,
                    });
                    continue;
                }

                // Create dunning record
                const dueDate = new Date(mapped.invoiceDueDate);
                const daysPastDue = calculateDaysPastDue(dueDate, now, mapped.gracePeriodDays || 0);

                let status = DunningStatus.ISSUED;
                if (daysPastDue > 0) status = DunningStatus.OVERDUE;
                else if (dueDate <= now) status = DunningStatus.DUE;

                const dunningId = generateDunningId(session.user.organizationId, mapped.invoiceId, now);
                const sequence = await (prisma as any).dunning.count({
                    where: { organizationId: session.user.organizationId },
                }) + 1;
                const dunningNumber = generateDunningNumber(
                    mapped.jurisdictionId || 'XX',
                    sequence,
                    now.getFullYear()
                );

                const dunning = await (prisma as any).dunning.create({
                    data: {
                        dunningId,
                        dunningNumber,
                        invoiceId: mapped.invoiceId,
                        customerId: mapped.customerId,
                        customerName: mapped.customerName,
                        partyId: mapped.partyId,
                        legalEntityId: mapped.legalEntityId,
                        jurisdictionId: mapped.jurisdictionId,
                        currency: mapped.currency || 'EUR',
                        reportingCurrency: mapped.reportingCurrency || 'EUR',
                        status,
                        currentLevel: mapped.currentLevel || DunningLevel.NONE,
                        originalAmount: mapped.originalAmount || mapped.outstandingAmount,
                        outstandingAmount: mapped.outstandingAmount,
                        interestAccrued: mapped.interestAccrued || 0,
                        feesAccrued: mapped.feesAccrued || 0,
                        totalDue: calculateTotalDue(
                            mapped.outstandingAmount,
                            mapped.interestAccrued || 0,
                            mapped.feesAccrued || 0
                        ),
                        invoiceDueDate: dueDate,
                        invoiceIssuedDate: mapped.invoiceIssuedDate ? new Date(mapped.invoiceIssuedDate) : null,
                        daysPastDue,
                        gracePeriodDays: mapped.gracePeriodDays || 0,
                        customerType: mapped.customerType,
                        customerJurisdiction: mapped.customerJurisdiction || mapped.jurisdictionId,
                        customerLanguage: mapped.customerLanguage || 'en',
                        customerDunningBlocked: false,
                        contractId: mapped.contractId,
                        tags: mapped.tags || [],
                        systemTags: ['imported', `batch:${batchNumber}`],
                        confidenceScore: 1.0,
                        validationMode: 'hard',
                        locale: mapped.locale || 'de-DE',
                        language: mapped.language || 'de',
                        dataSourcesChecked: ['import'],
                        metadata: {
                            importBatch: batchNumber,
                            importRow: rowNum,
                            importSource: source,
                            originalRecord: record,
                        },
                        version: 1,
                        eventCount: 1,
                        createdBy: session.user.id,
                        organizationId: session.user.organizationId,
                    },
                });

                // Create import event
                const eventId = generateEventId(dunningId, DunningEventType.DUNNING_CREATED, now);

                await (prisma as any).dunningEvent.create({
                    data: {
                        eventId,
                        dunningId: dunning.id,
                        eventType: DunningEventType.DUNNING_CREATED,
                        timestamp: now,
                        actorId: session.user.id,
                        actorName: session.user.name || session.user.email,
                        actorType: 'user',
                        payload: {
                            importBatch: batchNumber,
                            importRow: rowNum,
                            invoiceId: mapped.invoiceId,
                            customerName: mapped.customerName,
                            outstandingAmount: mapped.outstandingAmount,
                        },
                        dataSourcesChecked: ['import'],
                        explanation: `Imported from ${source} batch ${batchNumber}, row ${rowNum}`,
                    },
                });

                await (prisma as any).dunning.update({
                    where: { id: dunning.id },
                    data: { lastEventId: eventId },
                });

                createdDunningIds.push(dunning.id);

                results.success.push({
                    row: rowNum,
                    dunningId: dunning.dunningId,
                    dunningNumber: dunning.dunningNumber,
                    invoiceId: mapped.invoiceId,
                    customerName: mapped.customerName,
                    amount: mapped.outstandingAmount,
                    status,
                });
            } catch (err: any) {
                results.errors.push({
                    row: rowNum,
                    errors: [err.message],
                    record,
                });
            }
        }

        // Update batch with results
        await (prisma as any).dunningImportBatch.update({
            where: { id: batch.id },
            data: {
                status: 'completed',
                successCount: results.success.length,
                errorCount: results.errors.length,
                warningCount: results.warnings.length,
                skippedCount: results.skipped.length,
                errors: results.errors,
                warnings: results.warnings,
                createdDunningIds,
                completedAt: new Date(),
            },
        });

        return NextResponse.json({
            batchNumber,
            mode,
            source,
            summary: {
                total: data.length,
                success: results.success.length,
                errors: results.errors.length,
                warnings: results.warnings.length,
                skipped: results.skipped.length,
            },
            results: {
                success: results.success.slice(0, 100), // Limit response size
                errors: results.errors,
                warnings: results.warnings,
                skipped: results.skipped,
            },
            canRollback: mode === DunningImportMode.LIVE && createdDunningIds.length > 0,
            message: mode === DunningImportMode.DRY_RUN
                ? `Dry run completed. ${results.success.length} records would be created.`
                : `Import completed. ${results.success.length} dunning records created.`,
        }, { status: 201 });
    } catch (error) {
        console.error('Error importing dunning records:', error);
        return NextResponse.json(
            { error: 'Failed to import dunning records' },
            { status: 500 }
        );
    }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function mapRecord(record: any, fieldMapping?: Record<string, string>): any {
    if (!fieldMapping) return record;

    const mapped: any = {};
    for (const [targetField, sourceField] of Object.entries(fieldMapping)) {
        if (record[sourceField] !== undefined) {
            mapped[targetField] = record[sourceField];
        }
    }

    // Include unmapped fields
    for (const [key, value] of Object.entries(record)) {
        if (!Object.values(fieldMapping).includes(key) && mapped[key] === undefined) {
            mapped[key] = value;
        }
    }

    return mapped;
}

function validateRecord(record: any, rowNum: number): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!record.invoiceId?.toString().trim()) {
        errors.push('Missing invoiceId');
    }
    if (!record.customerId?.toString().trim()) {
        errors.push('Missing customerId');
    }
    if (!record.customerName?.toString().trim()) {
        errors.push('Missing customerName');
    }
    if (!record.outstandingAmount || parseFloat(record.outstandingAmount) <= 0) {
        errors.push('outstandingAmount must be greater than 0');
    }
    if (!record.invoiceDueDate) {
        errors.push('Missing invoiceDueDate');
    } else {
        const dueDate = new Date(record.invoiceDueDate);
        if (isNaN(dueDate.getTime())) {
            errors.push('Invalid invoiceDueDate format');
        }
    }

    // Warnings
    if (!record.currency) {
        warnings.push('Missing currency, defaulting to EUR');
    }
    if (!record.jurisdictionId) {
        warnings.push('Missing jurisdictionId, jurisdiction-specific rules may not apply');
    }

    return { errors, warnings };
}