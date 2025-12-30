// =============================================================================
// LIABILITIES API - Payment Management (TS Section 15)
// src/app/api/liabilities/[id]/payments/route.ts
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  LiabilityEventType,
  PaymentStatus,
} from '@/types/liabilities';

// =============================================================================
// GET - List Payments for Liability
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

    const status = searchParams.get('status');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    // Find liability
    const liability = await (prisma as any).liability.findFirst({
      where: {
        organizationId: session.user.organizationId,
        OR: [
          { id },
          { liabilityId: id },
        ],
      },
      select: { id: true, liabilityId: true },
    });

    if (!liability) {
      return NextResponse.json({ error: 'Liability not found' }, { status: 404 });
    }

    // Build where clause
    const where: any = { liabilityId: liability.id };
    if (status) where.status = status;
    if (fromDate || toDate) {
      where.scheduledDate = {};
      if (fromDate) where.scheduledDate.gte = new Date(fromDate);
      if (toDate) where.scheduledDate.lte = new Date(toDate);
    }

    // Get payments
    const payments = await (prisma as any).liabilityPayment.findMany({
      where,
      orderBy: { scheduledDate: 'asc' },
    });

    // Get summary
    const summary = await (prisma as any).liabilityPayment.groupBy({
      by: ['status'],
      where: { liabilityId: liability.id },
      _count: { id: true },
      _sum: { amount: true },
    });

    // Format payments
    const formattedPayments = payments.map((p: any) => ({
      ...p,
      amount: Number(p.amount),
      principalAmount: Number(p.principalAmount),
      interestAmount: Number(p.interestAmount),
      feesAmount: Number(p.feesAmount),
      penaltyAmount: Number(p.penaltyAmount),
    }));

    return NextResponse.json({
      liabilityId: liability.liabilityId,
      payments: formattedPayments,
      summary: {
        totalPayments: payments.length,
        byStatus: summary.reduce((acc: any, item: any) => {
          acc[item.status] = {
            count: item._count.id,
            totalAmount: Number(item._sum.amount || 0),
          };
          return acc;
        }, {}),
      },
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
        { error: 'Failed to fetch payments' },
        { status: 500 }
    );
  }
}

// =============================================================================
// POST - Schedule Payment
// =============================================================================

export async function POST(
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
    const {
      scheduledDate,
      amount,
      principalAmount,
      interestAmount = 0,
      feesAmount = 0,
      reference,
      notes,
      requiresApproval = false,
      approvalThreshold,
    } = body;

    // Validate
    if (!scheduledDate) {
      return NextResponse.json(
          { error: 'Scheduled date is required' },
          { status: 400 }
      );
    }
    if (!amount || amount <= 0) {
      return NextResponse.json(
          { error: 'Payment amount must be greater than 0' },
          { status: 400 }
      );
    }

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

    const now = new Date();
    const schedDate = new Date(scheduledDate);

    // Generate payment ID
    const paymentId = `PMT-${liability.liabilityId}-${now.getTime()}`;

    // Calculate principal if not provided
    const actualPrincipalAmount = principalAmount ?? (amount - interestAmount - feesAmount);

    // Determine if approval is required
    const needsApproval = requiresApproval ||
        (approvalThreshold && amount >= approvalThreshold) ||
        (liability.requiresApproval && liability.approvalThreshold && amount >= Number(liability.approvalThreshold));

    // Create payment
    const payment = await (prisma as any).liabilityPayment.create({
      data: {
        liabilityId: liability.id,
        paymentId,
        amount,
        principalAmount: actualPrincipalAmount,
        interestAmount,
        feesAmount,
        penaltyAmount: 0,
        currency: liability.currency,
        scheduledDate: schedDate,
        dueDate: schedDate,
        status: needsApproval ? PaymentStatus.PENDING_APPROVAL : PaymentStatus.SCHEDULED,
        requiresApproval: needsApproval,
        approvalThreshold,
        reference,
        notes,
      },
    });

    // Update liability next payment date if this is earlier
    if (!liability.nextPaymentDate || schedDate < new Date(liability.nextPaymentDate)) {
      await (prisma as any).liability.update({
        where: { id: liability.id },
        data: {
          nextPaymentDate: schedDate,
          nextCashOutflow: schedDate,
        },
      });
    }

    // Create event
    const eventId = `evt_${liability.liabilityId}_payment_scheduled_${now.getTime()}`;

    await (prisma as any).liabilityEvent.create({
      data: {
        eventId,
        liabilityId: liability.id,
        eventType: LiabilityEventType.PAYMENT_SCHEDULED,
        timestamp: now,
        actorId: session.user.id,
        actorName: session.user.name || session.user.email,
        actorType: 'user',
        payload: {
          paymentId,
          scheduledDate: schedDate.toISOString(),
          amount,
          principalAmount: actualPrincipalAmount,
          interestAmount,
          feesAmount,
          requiresApproval: needsApproval,
        },
        previousEventId: liability.lastEventId,
        explanation: `Payment of ${liability.currency} ${amount.toLocaleString()} scheduled for ${schedDate.toISOString().split('T')[0]}`,
      },
    });

    // Update liability
    await (prisma as any).liability.update({
      where: { id: liability.id },
      data: {
        lastEventId: eventId,
        eventCount: liability.eventCount + 1,
      },
    });

    return NextResponse.json({
      payment: {
        ...payment,
        amount: Number(payment.amount),
        principalAmount: Number(payment.principalAmount),
        interestAmount: Number(payment.interestAmount),
        feesAmount: Number(payment.feesAmount),
      },
      message: `Payment scheduled for ${schedDate.toISOString().split('T')[0]}`,
      eventId,
    }, { status: 201 });
  } catch (error) {
    console.error('Error scheduling payment:', error);
    return NextResponse.json(
        { error: 'Failed to schedule payment' },
        { status: 500 }
    );
  }
}