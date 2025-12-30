// =============================================================================
// LIABILITIES API - Single Liability Operations (TS Sections 3, 4, 17)
// src/app/api/liabilities/[id]/route.ts
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import {
  LiabilityStatus,
  LiabilityEventType,
  isLiabilityEditable,
  calculateTotalOutstanding,
} from '@/types/liabilities';

// =============================================================================
// GET - Retrieve Single Liability (with Time-Travel support)
// =============================================================================

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);

    // Time-travel query (TS Section 4.2)
    const asOf = searchParams.get('as_of');

    // Include options
    const includeEvents = searchParams.get('includeEvents') === 'true';
    const includePayments = searchParams.get('includePayments') === 'true';
    const includeSettlements = searchParams.get('includeSettlements') === 'true';
    const includeAccruals = searchParams.get('includeAccruals') === 'true';
    const includeCovenantChecks = searchParams.get('includeCovenantChecks') === 'true';

    // Find liability by ID or liabilityId
    const liability = await (prisma as any).liability.findFirst({
      where: {
        organizationId: session.user.organizationId,
        OR: [
          { id },
          { liabilityId: id },
        ],
      },
    });

    if (!liability) {
      return NextResponse.json({ error: 'Liability not found' }, { status: 404 });
    }

    // Time-Travel Reconstruction (TS Section 4.2)
    if (asOf) {
      const asOfDate = new Date(asOf);
      if (isNaN(asOfDate.getTime())) {
        return NextResponse.json({ error: 'Invalid as_of date format' }, { status: 400 });
      }

      // Get all events up to the as_of date
      const events = await (prisma as any).liabilityEvent.findMany({
        where: {
          liabilityId: liability.id,
          timestamp: { lte: asOfDate },
        },
        orderBy: { timestamp: 'asc' },
      });

      if (events.length === 0) {
        return NextResponse.json(
            { error: 'No events found before the specified date' },
            { status: 404 }
        );
      }

      // Reconstruct state by replaying events
      let reconstructedState: any = {};

      for (const event of events) {
        if (event.eventType === LiabilityEventType.LIABILITY_CREATED) {
          reconstructedState = { ...event.payload };
        } else if (event.eventType === LiabilityEventType.LIABILITY_REVERSED) {
          // Reversal - restore previous state
          if (event.previousState) {
            reconstructedState = { ...event.previousState };
          }
        } else {
          // Apply delta
          reconstructedState = {
            ...reconstructedState,
            ...event.payload,
          };
        }
      }

      // Format decimals
      const formattedState = {
        ...reconstructedState,
        originalPrincipal: Number(reconstructedState.originalPrincipal || 0),
        outstandingPrincipal: Number(reconstructedState.outstandingPrincipal || 0),
        accruedInterest: Number(reconstructedState.accruedInterest || 0),
        feesPenalties: Number(reconstructedState.feesPenalties || 0),
        totalOutstanding: Number(reconstructedState.totalOutstanding || 0),
        totalSettled: Number(reconstructedState.totalSettled || 0),
      };

      return NextResponse.json({
        liability: formattedState,
        asOfDate: asOf,
        eventsApplied: events.length,
        reconstructedFrom: events.map((e: any) => e.eventId),
        currentState: {
          id: liability.id,
          liabilityId: liability.liabilityId,
          status: liability.status,
          version: liability.version,
        },
      });
    }

    // Fetch related data if requested
    let events = null;
    let payments = null;
    let settlements = null;
    let accruals = null;
    let covenantChecks = null;

    if (includeEvents) {
      events = await (prisma as any).liabilityEvent.findMany({
        where: { liabilityId: liability.id },
        orderBy: { timestamp: 'desc' },
        take: 100,
      });
    }

    if (includePayments) {
      payments = await (prisma as any).liabilityPayment.findMany({
        where: { liabilityId: liability.id },
        orderBy: { scheduledDate: 'desc' },
      });
    }

    if (includeSettlements) {
      settlements = await (prisma as any).liabilitySettlement.findMany({
        where: { liabilityId: liability.id },
        orderBy: { settlementDate: 'desc' },
      });
    }

    if (includeAccruals) {
      accruals = await (prisma as any).liabilityAccrual.findMany({
        where: { liabilityId: liability.id },
        orderBy: { periodEnd: 'desc' },
      });
    }

    if (includeCovenantChecks) {
      covenantChecks = await (prisma as any).liabilityCovenantCheck.findMany({
        where: { liabilityId: liability.id },
        orderBy: { checkDate: 'desc' },
      });
    }

    // Format liability
    const formattedLiability = {
      ...liability,
      originalPrincipal: Number(liability.originalPrincipal),
      outstandingPrincipal: Number(liability.outstandingPrincipal),
      accruedInterest: Number(liability.accruedInterest),
      feesPenalties: Number(liability.feesPenalties),
      totalOutstanding: Number(liability.totalOutstanding),
      totalSettled: Number(liability.totalSettled),
      interestRate: liability.interestRate ? Number(liability.interestRate) : null,
      confidenceScore: Number(liability.confidenceScore),
      creditLimit: liability.creditLimit ? Number(liability.creditLimit) : null,
      availableCredit: liability.availableCredit ? Number(liability.availableCredit) : null,
      utilizationRate: liability.utilizationRate ? Number(liability.utilizationRate) : null,
    };

    // Format payments
    const formattedPayments = payments?.map((p: any) => ({
      ...p,
      amount: Number(p.amount),
      principalAmount: Number(p.principalAmount),
      interestAmount: Number(p.interestAmount),
      feesAmount: Number(p.feesAmount),
      penaltyAmount: Number(p.penaltyAmount),
    }));

    // Format settlements
    const formattedSettlements = settlements?.map((s: any) => ({
      ...s,
      amount: Number(s.amount),
      principalSettled: Number(s.principalSettled),
      interestSettled: Number(s.interestSettled),
      feesSettled: Number(s.feesSettled),
      penaltiesWaived: Number(s.penaltiesWaived),
      outstandingBefore: Number(s.outstandingBefore),
      outstandingAfter: Number(s.outstandingAfter),
      fxGainLoss: Number(s.fxGainLoss),
    }));

    // Format accruals
    const formattedAccruals = accruals?.map((a: any) => ({
      ...a,
      principalBase: Number(a.principalBase),
      rate: a.rate ? Number(a.rate) : null,
      amount: Number(a.amount),
    }));

    return NextResponse.json({
      liability: formattedLiability,
      events,
      payments: formattedPayments,
      settlements: formattedSettlements,
      accruals: formattedAccruals,
      covenantChecks,
    });
  } catch (error) {
    console.error('Error fetching liability:', error);
    return NextResponse.json(
        { error: 'Failed to fetch liability' },
        { status: 500 }
    );
  }
}

// =============================================================================
// PATCH - Update Liability (Draft only - TS Section 17)
// =============================================================================

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Find liability
    const liability = await (prisma as any).liability.findFirst({
      where: {
        organizationId: session.user.organizationId,
        OR: [
          { id },
          { liabilityId: id },
        ],
      },
    });

    if (!liability) {
      return NextResponse.json({ error: 'Liability not found' }, { status: 404 });
    }

    // Check if editable (TS Section 17 - only draft can be updated via PATCH)
    if (!isLiabilityEditable(liability.status)) {
      return NextResponse.json(
          {
            error: 'Liability can only be updated in draft status. Use state transition endpoints for recognized liabilities.',
            code: 'LIABILITY_NOT_EDITABLE',
            currentStatus: liability.status,
          },
          { status: 400 }
      );
    }

    // Extract updatable fields
    const {
      name,
      description,
      counterpartyId,
      counterpartyName,
      counterpartyType,
      partyId,
      legalEntityId,
      jurisdictionIds,
      legalReference,

      primaryClass,
      isInterestBearing,
      isSecured,
      isFixed,
      isGuaranteed,
      guarantorId,
      guarantorName,

      originalPrincipal,
      outstandingPrincipal,
      currency,
      reportingCurrency,
      creditLimit,
      amortizationMethod,
      confidenceScore,

      inceptionDate,
      maturityDate,
      gracePeriodDays,
      earlyRepaymentAllowed,
      earlyRepaymentPenalty,

      interestType,
      interestRate,
      interestIndex,
      interestSpread,
      interestCompounding,
      interestDayCount,

      originationFee,
      commitmentFee,

      paymentFrequency,
      regularPaymentAmount,
      paymentSchedule,

      collateralDescription,
      collateralValue,
      collateralCurrency,
      collateralType,

      riskLevel,
      covenants,

      isHedged,
      hedgeId,
      hedgePercentage,

      reference,
      internalReference,
      tags,
      metadata,
      notes,
      internalNotes,

      validationMode,

      requiresApproval,
      approvalThreshold,
    } = body;

    // Build update data
    const updateData: any = {};

    // Only include fields that were provided
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (counterpartyId !== undefined) updateData.counterpartyId = counterpartyId;
    if (counterpartyName !== undefined) updateData.counterpartyName = counterpartyName;
    if (counterpartyType !== undefined) updateData.counterpartyType = counterpartyType;
    if (partyId !== undefined) updateData.partyId = partyId;
    if (legalEntityId !== undefined) updateData.legalEntityId = legalEntityId;
    if (jurisdictionIds !== undefined) updateData.jurisdictionIds = jurisdictionIds;
    if (legalReference !== undefined) updateData.legalReference = legalReference;

    if (primaryClass !== undefined) updateData.primaryClass = primaryClass;
    if (isInterestBearing !== undefined) updateData.isInterestBearing = isInterestBearing;
    if (isSecured !== undefined) updateData.isSecured = isSecured;
    if (isFixed !== undefined) updateData.isFixed = isFixed;
    if (isGuaranteed !== undefined) updateData.isGuaranteed = isGuaranteed;
    if (guarantorId !== undefined) updateData.guarantorId = guarantorId;
    if (guarantorName !== undefined) updateData.guarantorName = guarantorName;

    if (originalPrincipal !== undefined) updateData.originalPrincipal = originalPrincipal;
    if (outstandingPrincipal !== undefined) updateData.outstandingPrincipal = outstandingPrincipal;
    if (currency !== undefined) updateData.currency = currency;
    if (reportingCurrency !== undefined) updateData.reportingCurrency = reportingCurrency;
    if (creditLimit !== undefined) updateData.creditLimit = creditLimit;
    if (amortizationMethod !== undefined) updateData.amortizationMethod = amortizationMethod;
    if (confidenceScore !== undefined) updateData.confidenceScore = confidenceScore;

    if (inceptionDate !== undefined) updateData.inceptionDate = new Date(inceptionDate);
    if (maturityDate !== undefined) updateData.maturityDate = maturityDate ? new Date(maturityDate) : null;
    if (gracePeriodDays !== undefined) updateData.gracePeriodDays = gracePeriodDays;
    if (earlyRepaymentAllowed !== undefined) updateData.earlyRepaymentAllowed = earlyRepaymentAllowed;
    if (earlyRepaymentPenalty !== undefined) updateData.earlyRepaymentPenalty = earlyRepaymentPenalty;

    if (interestType !== undefined) updateData.interestType = interestType;
    if (interestRate !== undefined) updateData.interestRate = interestRate;
    if (interestIndex !== undefined) updateData.interestIndex = interestIndex;
    if (interestSpread !== undefined) updateData.interestSpread = interestSpread;
    if (interestCompounding !== undefined) updateData.interestCompounding = interestCompounding;
    if (interestDayCount !== undefined) updateData.interestDayCount = interestDayCount;

    if (originationFee !== undefined) updateData.originationFee = originationFee;
    if (commitmentFee !== undefined) updateData.commitmentFee = commitmentFee;

    if (paymentFrequency !== undefined) updateData.paymentFrequency = paymentFrequency;
    if (regularPaymentAmount !== undefined) updateData.regularPaymentAmount = regularPaymentAmount;
    if (paymentSchedule !== undefined) {
      updateData.paymentSchedule = paymentSchedule;
      updateData.totalPaymentsExpected = paymentSchedule?.length || 0;
    }

    if (collateralDescription !== undefined) updateData.collateralDescription = collateralDescription;
    if (collateralValue !== undefined) updateData.collateralValue = collateralValue;
    if (collateralCurrency !== undefined) updateData.collateralCurrency = collateralCurrency;
    if (collateralType !== undefined) updateData.collateralType = collateralType;

    if (riskLevel !== undefined) updateData.riskLevel = riskLevel;
    if (covenants !== undefined) updateData.covenants = covenants;

    if (isHedged !== undefined) updateData.isHedged = isHedged;
    if (hedgeId !== undefined) updateData.hedgeId = hedgeId;
    if (hedgePercentage !== undefined) updateData.hedgePercentage = hedgePercentage;

    if (reference !== undefined) updateData.reference = reference;
    if (internalReference !== undefined) updateData.internalReference = internalReference;
    if (tags !== undefined) updateData.tags = tags;
    if (metadata !== undefined) updateData.metadata = metadata;
    if (notes !== undefined) updateData.notes = notes;
    if (internalNotes !== undefined) updateData.internalNotes = internalNotes;

    if (validationMode !== undefined) updateData.validationMode = validationMode;

    if (requiresApproval !== undefined) updateData.requiresApproval = requiresApproval;
    if (approvalThreshold !== undefined) updateData.approvalThreshold = approvalThreshold;

    // Recalculate totals if amounts changed
    if (updateData.outstandingPrincipal !== undefined || updateData.originalPrincipal !== undefined) {
      const newOutstanding = updateData.outstandingPrincipal ?? liability.outstandingPrincipal;
      updateData.totalOutstanding = calculateTotalOutstanding(
          Number(newOutstanding),
          Number(liability.accruedInterest),
          Number(liability.feesPenalties)
      );
      updateData.expectedCashImpact = updateData.totalOutstanding;

      // Recalculate credit line values
      if (updateData.creditLimit || liability.creditLimit) {
        const limit = updateData.creditLimit ?? Number(liability.creditLimit);
        if (limit > 0) {
          updateData.availableCredit = limit - Number(newOutstanding);
          updateData.utilizationRate = (Number(newOutstanding) / limit) * 100;
        }
      }
    }

    // Increment version
    updateData.version = liability.version + 1;
    updateData.eventCount = liability.eventCount + 1;

    // Update liability
    const updated = await (prisma as any).liability.update({
      where: { id: liability.id },
      data: updateData,
    });

    // Create LiabilityAmended event
    const now = new Date();
    const eventId = `evt_${liability.liabilityId}_amended_${now.getTime()}`;

    await (prisma as any).liabilityEvent.create({
      data: {
        eventId,
        liabilityId: liability.id,
        eventType: LiabilityEventType.LIABILITY_AMENDED,
        timestamp: now,
        actorId: session.user.id,
        actorName: session.user.name || session.user.email,
        actorType: 'user',
        payload: updateData,
        previousState: {
          name: liability.name,
          originalPrincipal: Number(liability.originalPrincipal),
          outstandingPrincipal: Number(liability.outstandingPrincipal),
          currency: liability.currency,
          version: liability.version,
        },
        previousEventId: liability.lastEventId,
        explanation: `Liability ${liability.liabilityId} amended (version ${updated.version})`,
      },
    });

    // Update last event ID
    await (prisma as any).liability.update({
      where: { id: liability.id },
      data: { lastEventId: eventId },
    });

    // Format response
    const formattedLiability = {
      ...updated,
      originalPrincipal: Number(updated.originalPrincipal),
      outstandingPrincipal: Number(updated.outstandingPrincipal),
      accruedInterest: Number(updated.accruedInterest),
      feesPenalties: Number(updated.feesPenalties),
      totalOutstanding: Number(updated.totalOutstanding),
      totalSettled: Number(updated.totalSettled),
      confidenceScore: Number(updated.confidenceScore),
    };

    return NextResponse.json({
      liability: formattedLiability,
      message: `Liability ${liability.liabilityId} updated successfully`,
    });
  } catch (error) {
    console.error('Error updating liability:', error);
    return NextResponse.json(
        { error: 'Failed to update liability' },
        { status: 500 }
    );
  }
}

// =============================================================================
// DELETE - Not Allowed (TS Section 19)
// =============================================================================

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
  return NextResponse.json(
      {
        error: 'Liabilities cannot be deleted. Use reversal or write-off operations.',
        code: 'LIABILITY_DELETION_NOT_ALLOWED',
      },
      { status: 405 }
  );
}