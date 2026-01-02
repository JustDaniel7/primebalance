// =============================================================================
// DUNNING API - List & Create (TS Sections 3, 4, 6, 19)
// src/app/api/dunning/route.ts
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
    DunningStatus,
    DunningEventType,
    DunningLevel,
    generateDunningId,
    generateDunningNumber,
    generateEventId,
    calculateDaysPastDue,
    calculateTotalDue,
} from '@/types/dunning';

// =============================================================================
// GET - List Dunning Records (TS Section 19.1)
// =============================================================================

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);

        // Pagination
        const page = parseInt(searchParams.get('page') || '1');
        const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
        const skip = (page - 1) * limit;

        // Sorting
        const sortBy = searchParams.get('sortBy') || 'daysPastDue';
        const sortOrder = searchParams.get('sortOrder') || 'desc';

        // Filters
        const status = searchParams.get('status');
        const statuses = searchParams.get('statuses')?.split(',').filter(Boolean);
        const currentLevel = searchParams.get('currentLevel');
        const levels = searchParams.get('levels')?.split(',').map(Number).filter(n => !isNaN(n));
        const customerId = searchParams.get('customerId');
        const customerName = searchParams.get('customerName');
        const invoiceId = searchParams.get('invoiceId');
        const partyId = searchParams.get('partyId');
        const legalEntityId = searchParams.get('legalEntityId');
        const jurisdictionId = searchParams.get('jurisdictionId');
        const currency = searchParams.get('currency');
        const customerType = searchParams.get('customerType');
        const isDisputed = searchParams.get('isDisputed');
        const hasActiveProposal = searchParams.get('hasActiveProposal');
        const daysPastDueMin = searchParams.get('daysPastDueMin');
        const daysPastDueMax = searchParams.get('daysPastDueMax');
        const amountMin = searchParams.get('amountMin');
        const amountMax = searchParams.get('amountMax');
        const dueDateFrom = searchParams.get('dueDateFrom');
        const dueDateTo = searchParams.get('dueDateTo');
        const createdFrom = searchParams.get('createdFrom');
        const createdTo = searchParams.get('createdTo');
        const tags = searchParams.get('tags')?.split(',').filter(Boolean);
        const search = searchParams.get('search');

        // Build where clause
        const where: any = {
            organizationId: session.user.organizationId,
        };

        if (status) where.status = status;
        if (statuses?.length) where.status = { in: statuses };
        if (currentLevel) where.currentLevel = parseInt(currentLevel);
        if (levels?.length) where.currentLevel = { in: levels };
        if (customerId) where.customerId = customerId;
        if (customerName) where.customerName = { contains: customerName, mode: 'insensitive' };
        if (invoiceId) where.invoiceId = invoiceId;
        if (partyId) where.partyId = partyId;
        if (legalEntityId) where.legalEntityId = legalEntityId;
        if (jurisdictionId) where.jurisdictionId = jurisdictionId;
        if (currency) where.currency = currency;
        if (customerType) where.customerType = customerType;
        if (isDisputed !== null && isDisputed !== undefined) {
            where.isDisputed = isDisputed === 'true';
        }
        if (hasActiveProposal !== null && hasActiveProposal !== undefined) {
            where.hasActiveProposal = hasActiveProposal === 'true';
        }
        if (daysPastDueMin || daysPastDueMax) {
            where.daysPastDue = {};
            if (daysPastDueMin) where.daysPastDue.gte = parseInt(daysPastDueMin);
            if (daysPastDueMax) where.daysPastDue.lte = parseInt(daysPastDueMax);
        }
        if (amountMin || amountMax) {
            where.outstandingAmount = {};
            if (amountMin) where.outstandingAmount.gte = parseFloat(amountMin);
            if (amountMax) where.outstandingAmount.lte = parseFloat(amountMax);
        }
        if (dueDateFrom || dueDateTo) {
            where.invoiceDueDate = {};
            if (dueDateFrom) where.invoiceDueDate.gte = new Date(dueDateFrom);
            if (dueDateTo) where.invoiceDueDate.lte = new Date(dueDateTo);
        }
        if (createdFrom || createdTo) {
            where.createdAt = {};
            if (createdFrom) where.createdAt.gte = new Date(createdFrom);
            if (createdTo) where.createdAt.lte = new Date(createdTo);
        }
        if (tags?.length) {
            where.tags = { hasSome: tags };
        }
        if (search) {
            where.OR = [
                { dunningId: { contains: search, mode: 'insensitive' } },
                { dunningNumber: { contains: search, mode: 'insensitive' } },
                { customerName: { contains: search, mode: 'insensitive' } },
                { invoiceId: { contains: search, mode: 'insensitive' } },
            ];
        }

        // Execute queries
        const [dunnings, total] = await Promise.all([
            (prisma as any).dunning.findMany({
                where,
                orderBy: { [sortBy]: sortOrder },
                take: limit,
                skip,
            }),
            (prisma as any).dunning.count({ where }),
        ]);

        // Get statistics
        const [
            totalStats,
            byStatus,
            byLevel,
            byCurrency,
            pendingProposals,
            activeDisputes,
        ] = await Promise.all([
            // Total aggregates
            (prisma as any).dunning.aggregate({
                where: { organizationId: session.user.organizationId },
                _sum: {
                    outstandingAmount: true,
                    interestAccrued: true,
                    feesAccrued: true,
                    totalDue: true,
                },
                _count: { id: true },
            }),
            // By status
            (prisma as any).dunning.groupBy({
                by: ['status'],
                where: { organizationId: session.user.organizationId },
                _count: { id: true },
                _sum: { outstandingAmount: true },
            }),
            // By level
            (prisma as any).dunning.groupBy({
                by: ['currentLevel'],
                where: { organizationId: session.user.organizationId },
                _count: { id: true },
                _sum: { outstandingAmount: true },
            }),
            // By currency
            (prisma as any).dunning.groupBy({
                by: ['currency'],
                where: { organizationId: session.user.organizationId },
                _count: { id: true },
                _sum: { outstandingAmount: true },
            }),
            // Pending proposals count
            (prisma as any).dunning.count({
                where: { organizationId: session.user.organizationId, hasActiveProposal: true },
            }),
            // Active disputes count
            (prisma as any).dunning.count({
                where: { organizationId: session.user.organizationId, isDisputed: true },
            }),
        ]);

        // Aging buckets (TS Section 15.1)
        const now = new Date();
        const [aging1to30, aging31to60, aging61to90, aging90plus] = await Promise.all([
            (prisma as any).dunning.aggregate({
                where: {
                    organizationId: session.user.organizationId,
                    daysPastDue: { gte: 1, lte: 30 },
                    status: { notIn: [DunningStatus.SETTLED, DunningStatus.WRITTEN_OFF] },
                },
                _count: { id: true },
                _sum: { outstandingAmount: true },
            }),
            (prisma as any).dunning.aggregate({
                where: {
                    organizationId: session.user.organizationId,
                    daysPastDue: { gte: 31, lte: 60 },
                    status: { notIn: [DunningStatus.SETTLED, DunningStatus.WRITTEN_OFF] },
                },
                _count: { id: true },
                _sum: { outstandingAmount: true },
            }),
            (prisma as any).dunning.aggregate({
                where: {
                    organizationId: session.user.organizationId,
                    daysPastDue: { gte: 61, lte: 90 },
                    status: { notIn: [DunningStatus.SETTLED, DunningStatus.WRITTEN_OFF] },
                },
                _count: { id: true },
                _sum: { outstandingAmount: true },
            }),
            (prisma as any).dunning.aggregate({
                where: {
                    organizationId: session.user.organizationId,
                    daysPastDue: { gt: 90 },
                    status: { notIn: [DunningStatus.SETTLED, DunningStatus.WRITTEN_OFF] },
                },
                _count: { id: true },
                _sum: { outstandingAmount: true },
            }),
        ]);

        // Format response
        const formattedDunnings = dunnings.map((d: any) => ({
            ...d,
            originalAmount: Number(d.originalAmount),
            outstandingAmount: Number(d.outstandingAmount),
            interestAccrued: Number(d.interestAccrued),
            feesAccrued: Number(d.feesAccrued),
            totalDue: Number(d.totalDue),
            confidenceScore: Number(d.confidenceScore),
        }));

        return NextResponse.json({
            dunnings: formattedDunnings,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasNext: page * limit < total,
                hasPrevious: page > 1,
            },
            statistics: {
                totalCount: totalStats._count.id,
                totalOutstanding: Number(totalStats._sum.outstandingAmount || 0),
                totalInterest: Number(totalStats._sum.interestAccrued || 0),
                totalFees: Number(totalStats._sum.feesAccrued || 0),
                totalDue: Number(totalStats._sum.totalDue || 0),
                byStatus: byStatus.reduce((acc: any, item: any) => {
                    acc[item.status] = {
                        count: item._count.id,
                        outstanding: Number(item._sum.outstandingAmount || 0),
                    };
                    return acc;
                }, {}),
                byLevel: byLevel.reduce((acc: any, item: any) => {
                    acc[item.currentLevel] = {
                        count: item._count.id,
                        outstanding: Number(item._sum.outstandingAmount || 0),
                    };
                    return acc;
                }, {}),
                byCurrency: byCurrency.reduce((acc: any, item: any) => {
                    acc[item.currency] = {
                        count: item._count.id,
                        outstanding: Number(item._sum.outstandingAmount || 0),
                    };
                    return acc;
                }, {}),
                overdueAging: {
                    days1to30: {
                        count: aging1to30._count.id,
                        amount: Number(aging1to30._sum.outstandingAmount || 0),
                    },
                    days31to60: {
                        count: aging31to60._count.id,
                        amount: Number(aging31to60._sum.outstandingAmount || 0),
                    },
                    days61to90: {
                        count: aging61to90._count.id,
                        amount: Number(aging61to90._sum.outstandingAmount || 0),
                    },
                    days90plus: {
                        count: aging90plus._count.id,
                        amount: Number(aging90plus._sum.outstandingAmount || 0),
                    },
                },
                pendingProposals,
                activeDisputes,
            },
        });
    } catch (error) {
        console.error('Error fetching dunning records:', error);
        return NextResponse.json(
            { error: 'Failed to fetch dunning records' },
            { status: 500 }
        );
    }
}

// =============================================================================
// POST - Create Dunning Record (TS Sections 3, 4)
// =============================================================================

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const {
            // Required
            invoiceId,
            customerId,
            customerName,
            originalAmount,
            outstandingAmount,
            currency,
            invoiceDueDate,
            // Optional Identity
            partyId,
            legalEntityId,
            jurisdictionId,
            reportingCurrency = 'EUR',
            // Optional Financial
            fxRateAtCreation,
            // Optional Customer Context
            customerType,
            customerJurisdiction,
            customerLanguage = 'en',
            customerPaymentHistory,
            customerRiskScore,
            // Optional Contract Context
            contractId,
            contractPaymentTerms,
            contractCustomDunningRules,
            gracePeriodDays = 0,
            // Optional Metadata
            metadata,
            tags = [],
            validationMode = 'hard',
            locale = 'de-DE',
            language = 'de',
        } = body;

        // Validate required fields
        if (!invoiceId?.trim()) {
            return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 });
        }
        if (!customerId?.trim()) {
            return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 });
        }
        if (!customerName?.trim()) {
            return NextResponse.json({ error: 'Customer name is required' }, { status: 400 });
        }
        if (originalAmount === undefined || originalAmount <= 0) {
            return NextResponse.json({ error: 'Original amount must be greater than 0' }, { status: 400 });
        }
        if (outstandingAmount === undefined || outstandingAmount < 0) {
            return NextResponse.json({ error: 'Outstanding amount must be >= 0' }, { status: 400 });
        }
        if (!currency?.trim()) {
            return NextResponse.json({ error: 'Currency is required' }, { status: 400 });
        }
        if (!invoiceDueDate) {
            return NextResponse.json({ error: 'Invoice due date is required' }, { status: 400 });
        }

        // Check for duplicate (same invoice)
        const existingDunning = await (prisma as any).dunning.findFirst({
            where: {
                organizationId: session.user.organizationId,
                invoiceId,
                status: { notIn: [DunningStatus.SETTLED, DunningStatus.WRITTEN_OFF] },
            },
        });

        if (existingDunning) {
            return NextResponse.json(
                {
                    error: 'Active dunning record already exists for this invoice',
                    code: 'DUPLICATE_DUNNING',
                    existingDunningId: existingDunning.dunningId,
                },
                { status: 400 }
            );
        }

        const now = new Date();
        const dueDate = new Date(invoiceDueDate);

        // Calculate days past due
        const daysPastDue = calculateDaysPastDue(dueDate, now, gracePeriodDays);

        // Determine initial status
        let status = DunningStatus.ISSUED;
        if (daysPastDue > 0) {
            status = DunningStatus.OVERDUE;
        } else if (dueDate <= now) {
            status = DunningStatus.DUE;
        }

        // Calculate effective due date
        const effectiveDueDate = new Date(dueDate);
        effectiveDueDate.setDate(effectiveDueDate.getDate() + gracePeriodDays);

        // Calculate totals
        const totalDue = calculateTotalDue(outstandingAmount, 0, 0);

        // Calculate amount in reporting currency
        let amountInReporting = outstandingAmount;
        if (fxRateAtCreation && currency !== reportingCurrency) {
            amountInReporting = outstandingAmount * fxRateAtCreation;
        }

        // Generate IDs
        const dunningId = generateDunningId(session.user.organizationId, invoiceId, now);

        // Get sequence for dunning number
        const sequence = await (prisma as any).dunning.count({
            where: { organizationId: session.user.organizationId },
        }) + 1;

        const dunningNumber = generateDunningNumber(
            jurisdictionId || 'XX',
            sequence,
            now.getFullYear()
        );

        // Determine system tags
        const systemTags: string[] = [];
        if (outstandingAmount >= 10000) systemTags.push('high_value');
        if (customerType === 'consumer') systemTags.push('consumer');
        if (customerType === 'b2b') systemTags.push('b2b');
        if (daysPastDue > 90) systemTags.push('severely_overdue');

        // Create dunning record
        const dunning = await (prisma as any).dunning.create({
            data: {
                dunningId,
                dunningNumber,
                invoiceId,
                customerId,
                customerName,
                partyId,
                legalEntityId,
                jurisdictionId,
                currency,
                reportingCurrency,

                status,
                currentLevel: DunningLevel.NONE,

                originalAmount,
                outstandingAmount,
                interestAccrued: 0,
                feesAccrued: 0,
                totalDue,
                fxRateAtCreation,
                amountInReporting,

                invoiceDueDate: dueDate,
                daysPastDue,
                gracePeriodDays,
                effectiveDueDate,

                customerType,
                customerJurisdiction: customerJurisdiction || jurisdictionId,
                customerLanguage,
                customerPaymentHistory,
                customerRiskScore,
                customerDunningBlocked: false,

                contractId,
                contractPaymentTerms,
                contractCustomDunningRules,

                metadata,
                tags,
                systemTags,
                confidenceScore: 1.0,
                validationMode,
                locale,
                language,

                dataSourcesChecked: ['invoices'],

                version: 1,
                eventCount: 1,

                createdBy: session.user.id,
                organizationId: session.user.organizationId,
            },
        });

        // Create initial event
        const eventId = generateEventId(dunningId, DunningEventType.DUNNING_CREATED, now);

        await (prisma as any).dunningEvent.create({
            data: {
                eventId,
                dunningId: dunning.id,
                eventType: DunningEventType.DUNNING_CREATED,
                timestamp: now,
                effectiveDate: now,
                actorId: session.user.id,
                actorName: session.user.name || session.user.email,
                actorType: 'user',
                payload: {
                    dunningId,
                    dunningNumber,
                    invoiceId,
                    customerId,
                    customerName,
                    originalAmount,
                    outstandingAmount,
                    currency,
                    invoiceDueDate: dueDate.toISOString(),
                    daysPastDue,
                    status,
                },
                dataSourcesChecked: ['invoices'],
                explanation: `Dunning record ${dunningNumber} created for invoice ${invoiceId}. Customer: ${customerName}. Outstanding: ${currency} ${outstandingAmount.toLocaleString()}. Days past due: ${daysPastDue}.`,
            },
        });

        // Update dunning with last event ID
        await (prisma as any).dunning.update({
            where: { id: dunning.id },
            data: { lastEventId: eventId },
        });

        return NextResponse.json({
            dunning: {
                ...dunning,
                originalAmount: Number(dunning.originalAmount),
                outstandingAmount: Number(dunning.outstandingAmount),
                interestAccrued: Number(dunning.interestAccrued),
                feesAccrued: Number(dunning.feesAccrued),
                totalDue: Number(dunning.totalDue),
                confidenceScore: Number(dunning.confidenceScore),
            },
            message: `Dunning record ${dunningNumber} created successfully`,
            eventId,
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating dunning record:', error);
        return NextResponse.json(
            { error: 'Failed to create dunning record' },
            { status: 500 }
        );
    }
}