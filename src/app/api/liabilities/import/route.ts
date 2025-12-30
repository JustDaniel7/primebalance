// =============================================================================
// LIABILITIES API - Import (TS Section 12)
// src/app/api/liabilities/import/route.ts
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import {
    LiabilityStatus,
    LiabilityEventType,
    ImportMode,
    ImportSource,
    calculateTotalOutstanding,
} from '@/types/liabilities';

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

        const where: any = { organizationId: session.user.organizationId };
        if (status) where.status = status;

        const batches = await (prisma as any).liabilityImportBatch.findMany({
            where,
            orderBy: { startedAt: 'desc' },
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

// =============================================================================
// POST - Import Liabilities
// =============================================================================

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const {
            source = ImportSource.CSV,
            mode = ImportMode.LIVE,
            data,
            fieldMapping,
            dateFrom,
            dateTo,
            counterpartyFilter,
            typeFilter,
        } = body;

        // Validate
        if (!data || !Array.isArray(data) || data.length === 0) {
            return NextResponse.json(
                { error: 'Import data is required' },
                { status: 400 }
            );
        }

        const now = new Date();

        // Generate batch number
        const batchNumber = `IMP-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${now.getTime().toString().slice(-6)}`;

        // Calculate source hash for deduplication
        const sourceHash = crypto
            .createHash('md5')
            .update(JSON.stringify(data))
            .digest('hex');

        // Check for duplicate import
        const existingBatch = await (prisma as any).liabilityImportBatch.findFirst({
            where: {
                organizationId: session.user.organizationId,
                sourceHash,
                status: 'completed',
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
        const batch = await (prisma as any).liabilityImportBatch.create({
            data: {
                batchNumber,
                source,
                sourceHash,
                totalRecords: data.length,
                status: 'processing',
                importMode: mode,
                dateFrom: dateFrom ? new Date(dateFrom) : null,
                dateTo: dateTo ? new Date(dateTo) : null,
                counterpartyFilter,
                typeFilter,
                fieldMapping,
                importedBy: session.user.id,
                importedByName: session.user.name || session.user.email,
                organizationId: session.user.organizationId,
                createdLiabilityIds: [],
                errors: [],
                warnings: [],
            },
        });

        // Process records
        const results = {
            successCount: 0,
            errorCount: 0,
            warningCount: 0,
            skippedCount: 0,
            createdIds: [] as string[],
            errors: [] as any[],
            warnings: [] as any[],
        };

        // Get current sequence
        let sequence = await (prisma as any).liability.count({
            where: { organizationId: session.user.organizationId },
        });

        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const rowNum = i + 1;

            try {
                // Map fields if mapping provided
                const mapped = fieldMapping ? applyFieldMapping(row, fieldMapping) : row;

                // Validate required fields
                const validation = validateImportRow(mapped, rowNum);
                if (validation.errors.length > 0) {
                    results.errors.push(...validation.errors);
                    results.errorCount++;
                    continue;
                }
                if (validation.warnings.length > 0) {
                    results.warnings.push(...validation.warnings);
                    results.warningCount++;
                }

                // Apply filters
                if (dateFrom && new Date(mapped.inceptionDate) < new Date(dateFrom)) {
                    results.skippedCount++;
                    continue;
                }
                if (dateTo && new Date(mapped.inceptionDate) > new Date(dateTo)) {
                    results.skippedCount++;
                    continue;
                }
                if (counterpartyFilter && !mapped.counterpartyName?.toLowerCase().includes(counterpartyFilter.toLowerCase())) {
                    results.skippedCount++;
                    continue;
                }
                if (typeFilter && mapped.primaryClass !== typeFilter) {
                    results.skippedCount++;
                    continue;
                }

                // Skip for dry run
                if (mode === ImportMode.DRY_RUN) {
                    results.successCount++;
                    continue;
                }

                // Generate liability ID
                sequence++;
                const year = now.getFullYear();
                const seq = String(sequence).padStart(5, '0');
                const classPrefix = (mapped.primaryClass || 'OTH').toUpperCase().slice(0, 3);
                const liabilityId = `LIA-${year}-${classPrefix}-${seq}`;

                // Calculate amounts
                const originalPrincipal = parseFloat(mapped.originalPrincipal) || 0;
                const outstandingPrincipal = parseFloat(mapped.outstandingPrincipal) || originalPrincipal;
                const accruedInterest = parseFloat(mapped.accruedInterest) || 0;
                const feesPenalties = parseFloat(mapped.feesPenalties) || 0;
                const totalOutstanding = calculateTotalOutstanding(outstandingPrincipal, accruedInterest, feesPenalties);

                // Create liability
                const liability = await (prisma as any).liability.create({
                    data: {
                        liabilityId,
                        name: mapped.name || `Imported ${mapped.primaryClass || 'Liability'}`,
                        primaryClass: mapped.primaryClass || 'accounts_payable',
                        counterpartyName: mapped.counterpartyName,
                        counterpartyId: mapped.counterpartyId,
                        counterpartyType: mapped.counterpartyType,
                        partyId: mapped.partyId,
                        legalEntityId: mapped.legalEntityId,
                        jurisdictionIds: mapped.jurisdictionIds || [],
                        legalReference: mapped.legalReference,

                        status: mapped.status || LiabilityStatus.DRAFT,

                        originalPrincipal,
                        outstandingPrincipal,
                        accruedInterest,
                        feesPenalties,
                        totalOutstanding,
                        totalSettled: parseFloat(mapped.totalSettled) || 0,

                        currency: mapped.currency || 'EUR',

                        isInterestBearing: mapped.isInterestBearing === true || mapped.isInterestBearing === 'true',
                        interestRate: mapped.interestRate ? parseFloat(mapped.interestRate) : null,
                        interestType: mapped.interestType,

                        inceptionDate: new Date(mapped.inceptionDate),
                        maturityDate: mapped.maturityDate ? new Date(mapped.maturityDate) : null,

                        confidenceScore: 0.8, // Lower confidence for imported
                        validationMode: 'soft',

                        sourceType: 'import',
                        importBatchId: batch.id,

                        tags: mapped.tags || [],
                        systemTags: ['imported'],
                        notes: mapped.notes,
                        description: mapped.description,
                        reference: mapped.reference,

                        version: 1,
                        eventCount: 1,

                        organizationId: session.user.organizationId,
                    },
                });

                // Create event
                const eventId = `evt_${liabilityId}_imported_${now.getTime()}_${i}`;
                await (prisma as any).liabilityEvent.create({
                    data: {
                        eventId,
                        liabilityId: liability.id,
                        eventType: LiabilityEventType.LIABILITY_CREATED,
                        timestamp: now,
                        actorId: session.user.id,
                        actorName: session.user.name || session.user.email,
                        actorType: 'system',
                        payload: {
                            source: 'import',
                            batchNumber,
                            rowNumber: rowNum,
                            originalData: row,
                        },
                        explanation: `Imported from ${source} (batch ${batchNumber}, row ${rowNum})`,
                    },
                });

                await (prisma as any).liability.update({
                    where: { id: liability.id },
                    data: { lastEventId: eventId },
                });

                results.successCount++;
                results.createdIds.push(liabilityId);
            } catch (err: any) {
                results.errorCount++;
                results.errors.push({
                    row: rowNum,
                    code: 'PROCESSING_ERROR',
                    message: err.message,
                    data: row,
                });
            }
        }

        // Update batch
        await (prisma as any).liabilityImportBatch.update({
            where: { id: batch.id },
            data: {
                status: mode === ImportMode.DRY_RUN ? 'completed' :
                    results.errorCount === data.length ? 'failed' : 'completed',
                successCount: results.successCount,
                errorCount: results.errorCount,
                warningCount: results.warningCount,
                skippedCount: results.skippedCount,
                createdLiabilityIds: results.createdIds,
                errors: results.errors,
                warnings: results.warnings,
                completedAt: now,
                canRollback: mode === ImportMode.LIVE && results.createdIds.length > 0,
            },
        });

        return NextResponse.json({
            batchNumber,
            mode,
            results: {
                total: data.length,
                success: results.successCount,
                errors: results.errorCount,
                warnings: results.warningCount,
                skipped: results.skippedCount,
            },
            createdLiabilityIds: mode === ImportMode.DRY_RUN ? [] : results.createdIds,
            errors: results.errors.slice(0, 50), // Limit errors in response
            warnings: results.warnings.slice(0, 50),
            message: mode === ImportMode.DRY_RUN
                ? `Dry run complete: ${results.successCount} would be created, ${results.errorCount} errors`
                : `Import complete: ${results.successCount} created, ${results.errorCount} errors`,
        }, { status: 201 });
    } catch (error) {
        console.error('Error importing liabilities:', error);
        return NextResponse.json(
            { error: 'Failed to import liabilities' },
            { status: 500 }
        );
    }
}

// Helper: Apply field mapping
function applyFieldMapping(row: any, mapping: Record<string, string>): any {
    const mapped: any = {};
    for (const [targetField, sourceField] of Object.entries(mapping)) {
        if (sourceField && row[sourceField] !== undefined) {
            mapped[targetField] = row[sourceField];
        }
    }
    // Include unmapped fields
    for (const [key, value] of Object.entries(row)) {
        if (!Object.values(mapping).includes(key) && !mapped[key]) {
            mapped[key] = value;
        }
    }
    return mapped;
}

// Helper: Validate import row
function validateImportRow(row: any, rowNum: number): { errors: any[]; warnings: any[] } {
    const errors: any[] = [];
    const warnings: any[] = [];

    if (!row.counterpartyName?.trim()) {
        errors.push({ row: rowNum, field: 'counterpartyName', code: 'REQUIRED', message: 'Counterparty name is required' });
    }
    if (!row.originalPrincipal || parseFloat(row.originalPrincipal) <= 0) {
        errors.push({ row: rowNum, field: 'originalPrincipal', code: 'REQUIRED', message: 'Original principal must be > 0' });
    }
    if (!row.inceptionDate) {
        errors.push({ row: rowNum, field: 'inceptionDate', code: 'REQUIRED', message: 'Inception date is required' });
    } else if (isNaN(new Date(row.inceptionDate).getTime())) {
        errors.push({ row: rowNum, field: 'inceptionDate', code: 'INVALID_DATE', message: 'Invalid inception date format' });
    }

    // Warnings
    if (!row.primaryClass) {
        warnings.push({ row: rowNum, field: 'primaryClass', code: 'DEFAULTED', message: 'Primary class defaulted to accounts_payable' });
    }
    if (!row.currency) {
        warnings.push({ row: rowNum, field: 'currency', code: 'DEFAULTED', message: 'Currency defaulted to EUR' });
    }

    return { errors, warnings };
}