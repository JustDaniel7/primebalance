// =============================================================================
// LIABILITIES API - List & Create (TS Sections 3, 4, 17)
// src/app/api/liabilities/route.ts
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { Prisma } from '@/generated/prisma/client';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import {
  LiabilityStatus,
  LiabilityEventType,
  ValidationMode,
  calculateTotalOutstanding,
} from '@/types/liabilities';

// =============================================================================
// GET - List Liabilities with Filters & Statistics
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
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build where clause
    const where: Prisma.LiabilityWhereInput = {
      organizationId: session.user.organizationId,
    };

    // Filters
    const primaryClass = searchParams.get('primaryClass');
    const primaryClasses = searchParams.get('primaryClasses');
    const status = searchParams.get('status');
    const statuses = searchParams.get('statuses');
    const counterpartyId = searchParams.get('counterpartyId');
    const counterpartyName = searchParams.get('counterpartyName');
    const counterpartyType = searchParams.get('counterpartyType');
    const partyId = searchParams.get('partyId');
    const legalEntityId = searchParams.get('legalEntityId');
    const currency = searchParams.get('currency');
    const riskLevel = searchParams.get('riskLevel');
    const riskLevels = searchParams.get('riskLevels');
    const isInDefault = searchParams.get('isInDefault');
    const isDisputed = searchParams.get('isDisputed');
    const isHedged = searchParams.get('isHedged');
    const isInterestBearing = searchParams.get('isInterestBearing');
    const isSecured = searchParams.get('isSecured');
    const maturityFrom = searchParams.get('maturityFrom');
    const maturityTo = searchParams.get('maturityTo');
    const inceptionFrom = searchParams.get('inceptionFrom');
    const inceptionTo = searchParams.get('inceptionTo');
    const amountMin = searchParams.get('amountMin');
    const amountMax = searchParams.get('amountMax');
    const tags = searchParams.get('tags');
    const sourceType = searchParams.get('sourceType');
    const search = searchParams.get('search');

    // Apply filters
    if (primaryClass) where.primaryClass = primaryClass;
    if (primaryClasses) where.primaryClass = { in: primaryClasses.split(',') };
    if (status) where.status = status;
    if (statuses) where.status = { in: statuses.split(',') };
    if (counterpartyId) where.counterpartyId = counterpartyId;
    if (counterpartyType) where.counterpartyType = counterpartyType;
    if (partyId) where.partyId = partyId;
    if (legalEntityId) where.legalEntityId = legalEntityId;
    if (currency) where.currency = currency;
    if (riskLevel) where.riskLevel = riskLevel;
    if (riskLevels) where.riskLevel = { in: riskLevels.split(',') };
    if (sourceType) where.sourceType = sourceType;

    // Boolean filters
    if (isInDefault !== null && isInDefault !== undefined) {
      where.isInDefault = isInDefault === 'true';
    }
    if (isDisputed !== null && isDisputed !== undefined) {
      where.isDisputed = isDisputed === 'true';
    }
    if (isHedged !== null && isHedged !== undefined) {
      where.isHedged = isHedged === 'true';
    }
    if (isInterestBearing !== null && isInterestBearing !== undefined) {
      where.isInterestBearing = isInterestBearing === 'true';
    }
    if (isSecured !== null && isSecured !== undefined) {
      where.isSecured = isSecured === 'true';
    }

    // Counterparty name search
    if (counterpartyName) {
      where.counterpartyName = { contains: counterpartyName, mode: 'insensitive' };
    }

    // Date range filters
    if (maturityFrom || maturityTo) {
      where.maturityDate = {};
      if (maturityFrom) where.maturityDate.gte = new Date(maturityFrom);
      if (maturityTo) where.maturityDate.lte = new Date(maturityTo);
    }

    if (inceptionFrom || inceptionTo) {
      where.inceptionDate = {};
      if (inceptionFrom) where.inceptionDate.gte = new Date(inceptionFrom);
      if (inceptionTo) where.inceptionDate.lte = new Date(inceptionTo);
    }

    // Amount range filters
    if (amountMin !== null || amountMax !== null) {
      where.totalOutstanding = {};
      if (amountMin) where.totalOutstanding.gte = parseFloat(amountMin);
      if (amountMax) where.totalOutstanding.lte = parseFloat(amountMax);
    }

    // Tags filter
    if (tags) where.tags = { hasSome: tags.split(',') };

    // Text search
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { liabilityId: { contains: search, mode: 'insensitive' } },
        { counterpartyName: { contains: search, mode: 'insensitive' } },
        { reference: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Build orderBy
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    // Execute queries
    const [liabilities, total] = await Promise.all([
      (prisma as any).liability.findMany({
        where,
        orderBy,
        take: limit,
        skip,
      }),
      (prisma as any).liability.count({ where }),
    ]);

    // Get statistics
    const statsWhere = { organizationId: session.user.organizationId };

    const [
      totalStats,
      byPrimaryClass,
      byStatus,
      byCurrency,
      byRiskLevel,
      defaultCount,
      disputeCount,
    ] = await Promise.all([
      (prisma as any).liability.aggregate({
        where: statsWhere,
        _sum: {
          totalOutstanding: true,
          originalPrincipal: true,
          accruedInterest: true,
          feesPenalties: true,
        },
        _count: { id: true },
      }),
      (prisma as any).liability.groupBy({
        by: ['primaryClass'],
        where: statsWhere,
        _count: { id: true },
        _sum: { totalOutstanding: true },
      }),
      (prisma as any).liability.groupBy({
        by: ['status'],
        where: statsWhere,
        _count: { id: true },
        _sum: { totalOutstanding: true },
      }),
      (prisma as any).liability.groupBy({
        by: ['currency'],
        where: statsWhere,
        _count: { id: true },
        _sum: { totalOutstanding: true },
      }),
      (prisma as any).liability.groupBy({
        by: ['riskLevel'],
        where: statsWhere,
        _count: { id: true },
        _sum: { totalOutstanding: true },
      }),
      (prisma as any).liability.count({ where: { ...statsWhere, isInDefault: true } }),
      (prisma as any).liability.count({ where: { ...statsWhere, isDisputed: true } }),
    ]);

    // Maturity profile
    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const in90Days = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    const in1Year = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

    const [within30, within90, within1Year, over1Year, noMaturity] = await Promise.all([
      (prisma as any).liability.aggregate({
        where: { ...statsWhere, maturityDate: { lte: in30Days, gte: now } },
        _count: { id: true },
        _sum: { totalOutstanding: true },
      }),
      (prisma as any).liability.aggregate({
        where: { ...statsWhere, maturityDate: { lte: in90Days, gt: in30Days } },
        _count: { id: true },
        _sum: { totalOutstanding: true },
      }),
      (prisma as any).liability.aggregate({
        where: { ...statsWhere, maturityDate: { lte: in1Year, gt: in90Days } },
        _count: { id: true },
        _sum: { totalOutstanding: true },
      }),
      (prisma as any).liability.aggregate({
        where: { ...statsWhere, maturityDate: { gt: in1Year } },
        _count: { id: true },
        _sum: { totalOutstanding: true },
      }),
      (prisma as any).liability.aggregate({
        where: { ...statsWhere, maturityDate: null },
        _count: { id: true },
        _sum: { totalOutstanding: true },
      }),
    ]);

    // Format liabilities
    const formattedLiabilities = liabilities.map((lia: any) => ({
      ...lia,
      originalPrincipal: Number(lia.originalPrincipal),
      outstandingPrincipal: Number(lia.outstandingPrincipal),
      accruedInterest: Number(lia.accruedInterest),
      feesPenalties: Number(lia.feesPenalties),
      totalOutstanding: Number(lia.totalOutstanding),
      totalSettled: Number(lia.totalSettled),
      interestRate: lia.interestRate ? Number(lia.interestRate) : null,
      confidenceScore: Number(lia.confidenceScore),
      creditLimit: lia.creditLimit ? Number(lia.creditLimit) : null,
      availableCredit: lia.availableCredit ? Number(lia.availableCredit) : null,
      utilizationRate: lia.utilizationRate ? Number(lia.utilizationRate) : null,
    }));

    // Build statistics
    const statistics = {
      totalCount: totalStats._count.id,
      totalOutstanding: Number(totalStats._sum.totalOutstanding || 0),
      totalOriginalPrincipal: Number(totalStats._sum.originalPrincipal || 0),
      totalAccruedInterest: Number(totalStats._sum.accruedInterest || 0),
      totalFeesPenalties: Number(totalStats._sum.feesPenalties || 0),

      byPrimaryClass: byPrimaryClass.reduce((acc: any, item: any) => {
        acc[item.primaryClass] = {
          count: item._count.id,
          outstanding: Number(item._sum.totalOutstanding || 0),
        };
        return acc;
      }, {}),

      byStatus: byStatus.reduce((acc: any, item: any) => {
        acc[item.status] = {
          count: item._count.id,
          outstanding: Number(item._sum.totalOutstanding || 0),
        };
        return acc;
      }, {}),

      byCurrency: byCurrency.reduce((acc: any, item: any) => {
        acc[item.currency] = {
          count: item._count.id,
          outstanding: Number(item._sum.totalOutstanding || 0),
        };
        return acc;
      }, {}),

      byRiskLevel: byRiskLevel.reduce((acc: any, item: any) => {
        acc[item.riskLevel] = {
          count: item._count.id,
          outstanding: Number(item._sum.totalOutstanding || 0),
        };
        return acc;
      }, {}),

      maturityProfile: {
        within30Days: { count: within30._count.id, amount: Number(within30._sum.totalOutstanding || 0) },
        within90Days: { count: within90._count.id, amount: Number(within90._sum.totalOutstanding || 0) },
        within1Year: { count: within1Year._count.id, amount: Number(within1Year._sum.totalOutstanding || 0) },
        over1Year: { count: over1Year._count.id, amount: Number(over1Year._sum.totalOutstanding || 0) },
        noMaturity: { count: noMaturity._count.id, amount: Number(noMaturity._sum.totalOutstanding || 0) },
      },

      riskSummary: {
        inDefault: defaultCount,
        inDispute: disputeCount,
        covenantBreaches: 0, // Would need separate query
        overdue: 0, // Would need separate query
      },
    };

    return NextResponse.json({
      liabilities: formattedLiabilities,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrevious: page > 1,
      },
      statistics,
    });
  } catch (error) {
    console.error('Error fetching liabilities:', error);
    return NextResponse.json(
        { error: 'Failed to fetch liabilities' },
        { status: 500 }
    );
  }
}

// =============================================================================
// POST - Create Liability (TS Sections 3, 4, 5)
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
      name,
      primaryClass,
      counterpartyName,
      originalPrincipal,
      currency = 'EUR',
      inceptionDate,

      // Optional identity
      legalReference,
      counterpartyId,
      counterpartyType,
      partyId,
      legalEntityId,
      jurisdictionIds = [],

      // Classification
      isInterestBearing = false,
      isSecured = false,
      isFixed = true,
      isGuaranteed = false,
      guarantorId,
      guarantorName,

      // Financial
      outstandingPrincipal,
      reportingCurrency,
      creditLimit,
      amortizationMethod,
      confidenceScore = 1.0,

      // Temporal
      maturityDate,
      gracePeriodDays = 0,
      earlyRepaymentAllowed = true,
      earlyRepaymentPenalty,

      // Interest
      interestType,
      interestRate,
      interestIndex,
      interestSpread,
      interestCompounding,
      interestDayCount,

      // Fees
      originationFee,
      originationFeeRate,
      commitmentFee,
      commitmentFeeRate,

      // Payment
      paymentFrequency,
      regularPaymentAmount,
      paymentSchedule,

      // Collateral
      collateralDescription,
      collateralValue,
      collateralCurrency,
      collateralType,

      // Risk & Covenants
      riskLevel = 'low',
      covenants,

      // FX Hedging
      isHedged = false,
      hedgeId,
      hedgePercentage,

      // Metadata
      description,
      reference,
      internalReference,
      tags = [],
      metadata,
      notes,

      // Validation
      validationMode = 'hard',

      // Approval
      requiresApproval = false,
      approvalThreshold,

      // Source
      sourceType = 'manual',
      sourceId,
    } = body;

    // Validate required fields
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    if (!primaryClass) {
      return NextResponse.json({ error: 'Primary class is required' }, { status: 400 });
    }
    if (!counterpartyName?.trim()) {
      return NextResponse.json({ error: 'Counterparty name is required' }, { status: 400 });
    }
    if (originalPrincipal === undefined || originalPrincipal === null || originalPrincipal <= 0) {
      return NextResponse.json({ error: 'Original principal must be greater than 0' }, { status: 400 });
    }
    if (!inceptionDate) {
      return NextResponse.json({ error: 'Inception date is required' }, { status: 400 });
    }

    // Get sequence number for liability ID
    const count = await (prisma as any).liability.count({
      where: { organizationId: session.user.organizationId },
    });

    // Generate deterministic liability ID
    const now = new Date();
    const year = now.getFullYear();
    const seq = String(count + 1).padStart(5, '0');
    const classPrefix = primaryClass.toUpperCase().slice(0, 3);
    const liabilityId = `LIA-${year}-${classPrefix}-${seq}`;

    // Calculate outstanding principal (default to original if not provided)
    const actualOutstanding = outstandingPrincipal ?? originalPrincipal;

    // Calculate total outstanding
    const totalOutstanding = calculateTotalOutstanding(actualOutstanding, 0, 0);

    // Calculate available credit for credit lines
    let availableCredit = null;
    let utilizationRate = null;
    if (creditLimit && creditLimit > 0) {
      availableCredit = creditLimit - actualOutstanding;
      utilizationRate = (actualOutstanding / creditLimit) * 100;
    }

    // Generate system tags
    const systemTags: string[] = [];
    if (originalPrincipal >= 100000) systemTags.push('high_value');
    if (primaryClass === 'intercompany') systemTags.push('intercompany');
    if (currency !== 'EUR' && currency !== (reportingCurrency || 'EUR')) {
      systemTags.push('cross_border');
    }
    if (requiresApproval) systemTags.push('requires_approval');

    // Create liability
    const liability = await (prisma as any).liability.create({
      data: {
        liabilityId,
        legalReference,
        counterpartyId,
        counterpartyName,
        counterpartyType,
        partyId,
        legalEntityId,
        jurisdictionIds,

        primaryClass,
        isInterestBearing,
        isSecured,
        isFixed,
        isGuaranteed,
        guarantorId,
        guarantorName,

        status: LiabilityStatus.DRAFT,

        originalPrincipal,
        outstandingPrincipal: actualOutstanding,
        accruedInterest: 0,
        feesPenalties: 0,
        totalOutstanding,
        totalSettled: 0,

        currency,
        reportingCurrency,
        unrealizedFxGainLoss: 0,

        creditLimit,
        availableCredit,
        utilizationRate,

        amortizationMethod,
        confidenceScore,

        inceptionDate: new Date(inceptionDate),
        maturityDate: maturityDate ? new Date(maturityDate) : null,
        gracePeriodDays,
        earlyRepaymentAllowed,
        earlyRepaymentPenalty,

        interestType,
        interestRate,
        interestIndex,
        interestSpread,
        interestCompounding,
        interestDayCount,
        interestAccrualStart: isInterestBearing ? new Date(inceptionDate) : null,

        originationFee,
        originationFeeRate,
        commitmentFee,
        commitmentFeeRate,
        penaltiesAccrued: 0,
        legalFeesAccrued: 0,
        otherFeesAccrued: 0,

        paymentFrequency,
        regularPaymentAmount,
        paymentSchedule,
        totalPaymentsExpected: paymentSchedule?.length || 0,
        paymentsCompleted: 0,
        paymentsMissed: 0,

        expectedCashImpact: totalOutstanding,
        cashflowProbability: confidenceScore,

        collateralDescription,
        collateralValue,
        collateralCurrency,
        collateralType,

        riskLevel,
        covenants,
        covenantBreaches: 0,

        isInDefault: false,
        daysOverdue: 0,

        isDisputed: false,

        isRestructured: false,

        isWrittenOff: false,

        requiresApproval,
        approvalThreshold,

        isHedged,
        hedgeId,
        hedgePercentage,

        name,
        description,
        reference,
        internalReference,
        tags,
        systemTags,
        metadata,
        notes,

        validationMode,
        language: 'en',

        sourceType,
        sourceId,

        version: 1,
        eventCount: 1,

        organizationId: session.user.organizationId,
      },
    });

    // Generate event ID
    const eventId = `evt_${liabilityId}_created_${now.getTime()}`;
    const contentHash = crypto
        .createHash('sha256')
        .update(JSON.stringify({ liabilityId, originalPrincipal, counterpartyName, inceptionDate }))
        .digest('hex');

    // Create LiabilityCreated event (TS Section 4)
    await (prisma as any).liabilityEvent.create({
      data: {
        eventId,
        liabilityId: liability.id,
        eventType: LiabilityEventType.LIABILITY_CREATED,
        timestamp: now,
        effectiveDate: new Date(inceptionDate),
        actorId: session.user.id,
        actorName: session.user.name || session.user.email,
        actorType: 'user',
        payload: {
          liabilityId,
          name,
          primaryClass,
          counterpartyName,
          originalPrincipal,
          currency,
          inceptionDate,
          status: LiabilityStatus.DRAFT,
        },
        contentHash,
        explanation: `Liability ${liabilityId} created with principal ${currency} ${originalPrincipal.toLocaleString()} for ${counterpartyName}`,
      },
    });

    // Update liability with last event ID
    await (prisma as any).liability.update({
      where: { id: liability.id },
      data: { lastEventId: eventId },
    });

    // Format response
    const formattedLiability = {
      ...liability,
      originalPrincipal: Number(liability.originalPrincipal),
      outstandingPrincipal: Number(liability.outstandingPrincipal),
      accruedInterest: Number(liability.accruedInterest),
      feesPenalties: Number(liability.feesPenalties),
      totalOutstanding: Number(liability.totalOutstanding),
      totalSettled: Number(liability.totalSettled),
      confidenceScore: Number(liability.confidenceScore),
    };

    return NextResponse.json({
      liability: formattedLiability,
      message: `Liability ${liabilityId} created successfully`,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating liability:', error);
    return NextResponse.json(
        { error: 'Failed to create liability' },
        { status: 500 }
    );
  }
}