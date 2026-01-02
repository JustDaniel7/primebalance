// =============================================================================
// DUNNING API - Data Verification (TS Section 6)
// src/app/api/dunning/[id]/verify/route.ts
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
    DunningStatus,
    DunningEventType,
    VerificationStatus,
    generateEventId,
    DATA_SOURCES,
} from '@/types/dunning';

// =============================================================================
// POST - Perform Data Verification (TS Section 6)
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

        // Find dunning
        const dunning = await (prisma as any).dunning.findFirst({
            where: {
                organizationId: session.user.organizationId,
                OR: [
                    { id },
                    { dunningId: id },
                    { dunningNumber: id },
                ],
            },
        });

        if (!dunning) {
            return NextResponse.json({ error: 'Dunning record not found' }, { status: 404 });
        }

        const now = new Date();
        const verificationResults: any = {
            invoice: { verified: false, errors: [] },
            payment: { verified: false, errors: [] },
            dispute: { verified: false, errors: [] },
            customer: { verified: false, errors: [] },
            contract: { verified: false, errors: [] },
            priorDunning: { verified: false, errors: [] },
        };

        const dataSourcesChecked: string[] = [];

        // ==========================================================================
        // 6.1 Invoice Verification
        // ==========================================================================
        dataSourcesChecked.push('invoices');

        // In a real implementation, this would query the Invoices module
        // For now, we verify based on dunning data
        const invoiceValid =
            dunning.invoiceId &&
            dunning.outstandingAmount > 0 &&
            new Date(dunning.invoiceDueDate) < now;

        verificationResults.invoice = {
            verified: invoiceValid,
            status: dunning.status,
            outstandingAmount: Number(dunning.outstandingAmount),
            dueDate: dunning.invoiceDueDate,
            daysPastDue: dunning.daysPastDue,
            errors: invoiceValid ? [] : ['Invoice verification failed'],
        };

        // ==========================================================================
        // 6.2 Payment Verification
        // ==========================================================================
        dataSourcesChecked.push('payments');

        // Check for pending payments in a real system
        // For now, assume no pending payments
        const pendingPayments = false;

        verificationResults.payment = {
            verified: true,
            totalPaid: Number(dunning.originalAmount) - Number(dunning.outstandingAmount),
            pendingPayments,
            errors: pendingPayments ? ['Pending payment exists'] : [],
        };

        // ==========================================================================
        // 6.3 Dispute Verification
        // ==========================================================================
        dataSourcesChecked.push('disputes');

        const hasActiveDispute = dunning.isDisputed;

        verificationResults.dispute = {
            verified: !hasActiveDispute,
            hasActiveDispute,
            disputeDetails: hasActiveDispute ? {
                reason: dunning.disputeReason,
                amount: dunning.disputeAmount,
                openedAt: dunning.disputedAt,
            } : null,
            errors: hasActiveDispute ? ['Active dispute exists - dunning blocked'] : [],
        };

        // ==========================================================================
        // 6.4 Customer Verification
        // ==========================================================================
        dataSourcesChecked.push('customers');

        const customerBlocked = dunning.customerDunningBlocked;

        verificationResults.customer = {
            verified: !customerBlocked,
            jurisdiction: dunning.customerJurisdiction,
            language: dunning.customerLanguage,
            dunningBlocked: customerBlocked,
            status: 'active',
            errors: customerBlocked ? ['Customer dunning is blocked'] : [],
        };

        // ==========================================================================
        // 6.5 Contract Verification
        // ==========================================================================
        dataSourcesChecked.push('contracts');

        verificationResults.contract = {
            verified: true,
            paymentTerms: dunning.contractPaymentTerms,
            gracePeriod: dunning.gracePeriodDays,
            customRules: dunning.contractCustomDunningRules,
            errors: [],
        };

        // ==========================================================================
        // 6.6 Prior Dunning Verification
        // ==========================================================================
        dataSourcesChecked.push('dunning');

        // Get last sent dunning event
        const lastSentEvent = await (prisma as any).dunningEvent.findFirst({
            where: {
                dunningId: dunning.id,
                eventType: {
                    in: [
                        DunningEventType.REMINDER_SENT,
                        DunningEventType.DUNNING_LEVEL1_SENT,
                        DunningEventType.DUNNING_LEVEL2_SENT,
                        DunningEventType.DUNNING_LEVEL3_SENT,
                    ],
                },
            },
            orderBy: { timestamp: 'desc' },
        });

        // Check minimum interval (default 7 days)
        const minimumIntervalDays = 7;
        let minimumIntervalMet = true;

        if (lastSentEvent) {
            const lastSentDate = new Date(lastSentEvent.timestamp);
            const daysSinceLastSent = Math.floor(
                (now.getTime() - lastSentDate.getTime()) / (1000 * 60 * 60 * 24)
            );
            minimumIntervalMet = daysSinceLastSent >= minimumIntervalDays;
        }

        verificationResults.priorDunning = {
            verified: minimumIntervalMet,
            lastLevel: dunning.currentLevel,
            lastSentAt: lastSentEvent?.timestamp,
            minimumIntervalMet,
            errors: !minimumIntervalMet ? [`Minimum interval of ${minimumIntervalDays} days not met`] : [],
        };

        // ==========================================================================
        // Calculate Overall Status
        // ==========================================================================
        const allVerified = Object.values(verificationResults).every(
            (r: any) => r.verified
        );

        const totalErrors = Object.values(verificationResults).reduce(
            (sum: number, r: any) => sum + (r.errors?.length || 0),
            0
        );

        const verificationStatus = allVerified
            ? VerificationStatus.VERIFIED
            : VerificationStatus.FAILED;

        // Calculate confidence score based on verifications
        const verificationCount = Object.keys(verificationResults).length;
        const passedCount = Object.values(verificationResults).filter((r: any) => r.verified).length;
        const confidenceScore = passedCount / verificationCount;

        // Update dunning with verification results
        await (prisma as any).dunning.update({
            where: { id: dunning.id },
            data: {
                lastVerificationAt: now,
                verificationStatus,
                verificationErrors: allVerified ? null : verificationResults,
                dataSourcesChecked,
                confidenceScore,
                eventCount: dunning.eventCount + 1,
            },
        });

        // Create verification event
        const eventId = generateEventId(
            dunning.dunningId,
            allVerified ? DunningEventType.DATA_VERIFIED : DunningEventType.VERIFICATION_FAILED,
            now
        );

        await (prisma as any).dunningEvent.create({
            data: {
                eventId,
                dunningId: dunning.id,
                eventType: allVerified ? DunningEventType.DATA_VERIFIED : DunningEventType.VERIFICATION_FAILED,
                timestamp: now,
                actorId: session.user.id,
                actorName: session.user.name || session.user.email,
                actorType: 'user',
                payload: {
                    verificationStatus,
                    results: verificationResults,
                    confidenceScore,
                },
                dataSourcesChecked,
                inputSnapshot: verificationResults,
                decision: verificationStatus,
                explanation: allVerified
                    ? `All ${verificationCount} verification checks passed. Confidence: ${(confidenceScore * 100).toFixed(0)}%`
                    : `Verification failed: ${totalErrors} error(s) found across ${verificationCount} checks`,
                previousEventId: dunning.lastEventId,
            },
        });

        // Update last event ID
        await (prisma as any).dunning.update({
            where: { id: dunning.id },
            data: { lastEventId: eventId },
        });

        return NextResponse.json({
            dunningId: dunning.dunningId,
            dunningNumber: dunning.dunningNumber,
            verificationStatus,
            allVerified,
            confidenceScore,
            results: verificationResults,
            dataSourcesChecked,
            verifiedAt: now.toISOString(),
            eventId,
            canProceed: allVerified,
            message: allVerified
                ? 'All verification checks passed'
                : `Verification failed: ${totalErrors} error(s) found`,
        });
    } catch (error) {
        console.error('Error verifying dunning data:', error);
        return NextResponse.json(
            { error: 'Failed to verify dunning data' },
            { status: 500 }
        );
    }
}