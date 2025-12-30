// =============================================================================
// LIABILITIES API - Covenant Management (TS Section 10)
// src/app/api/liabilities/[id]/covenants/route.ts
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
    LiabilityEventType,
    CovenantStatus,
} from '@/types/liabilities';

// =============================================================================
// GET - List Covenant Checks
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

        // Find liability
        const liability = await (prisma as any).liability.findFirst({
            where: {
                organizationId: session.user.organizationId,
                OR: [
                    { id },
                    { liabilityId: id },
                ],
            },
            select: { id: true, liabilityId: true, covenants: true },
        });

        if (!liability) {
            return NextResponse.json({ error: 'Liability not found' }, { status: 404 });
        }

        // Get covenant checks
        const checks = await (prisma as any).liabilityCovenantCheck.findMany({
            where: { liabilityId: liability.id },
            orderBy: { checkDate: 'desc' },
        });

        // Get summary
        const breachCount = checks.filter((c: any) => c.isBreached).length;
        const waivedCount = checks.filter((c: any) => c.isWaived).length;

        return NextResponse.json({
            liabilityId: liability.liabilityId,
            covenantDefinitions: liability.covenants || [],
            checks: checks.map((c: any) => ({
                ...c,
                threshold: Number(c.threshold),
                actualValue: Number(c.actualValue),
                variance: c.variance ? Number(c.variance) : null,
                variancePercent: c.variancePercent ? Number(c.variancePercent) : null,
            })),
            summary: {
                totalChecks: checks.length,
                breaches: breachCount,
                waived: waivedCount,
                compliant: checks.length - breachCount,
            },
        });
    } catch (error) {
        console.error('Error fetching covenant checks:', error);
        return NextResponse.json(
            { error: 'Failed to fetch covenant checks' },
            { status: 500 }
        );
    }
}

// =============================================================================
// POST - Record Covenant Check
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
            covenantName,
            covenantType,
            actualValue,
            periodEnd,
            calculationDetails,
            notes,
        } = body;

        // Validate
        if (!covenantName?.trim()) {
            return NextResponse.json({ error: 'Covenant name is required' }, { status: 400 });
        }
        if (actualValue === undefined || actualValue === null) {
            return NextResponse.json({ error: 'Actual value is required' }, { status: 400 });
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

        // Find covenant definition
        const covenants = liability.covenants || [];
        const covenantDef = covenants.find((c: any) =>
            c.name.toLowerCase() === covenantName.toLowerCase()
        );

        if (!covenantDef) {
            return NextResponse.json(
                {
                    error: `Covenant '${covenantName}' not found in liability definition`,
                    availableCovenants: covenants.map((c: any) => c.name),
                },
                { status: 404 }
            );
        }

        const now = new Date();
        const threshold = covenantDef.threshold;
        const thresholdType = covenantDef.thresholdType || 'minimum';

        // Determine status
        let status: CovenantStatus;
        let isBreached = false;

        if (thresholdType === 'minimum') {
            isBreached = actualValue < threshold;
        } else if (thresholdType === 'maximum') {
            isBreached = actualValue > threshold;
        } else if (thresholdType === 'range') {
            isBreached = actualValue < (covenantDef.thresholdMin || 0) ||
                actualValue > (covenantDef.thresholdMax || Infinity);
        }

        // Calculate variance
        const variance = actualValue - threshold;
        const variancePercent = threshold !== 0 ? (variance / threshold) * 100 : 0;

        // Check for warning (within 10% of threshold)
        const warningBuffer = Math.abs(threshold * 0.1);
        const isWarning = !isBreached && Math.abs(variance) <= warningBuffer;

        status = isBreached ? CovenantStatus.BREACHED
            : isWarning ? CovenantStatus.WARNING
                : CovenantStatus.COMPLIANT;

        // Create covenant check
        const check = await (prisma as any).liabilityCovenantCheck.create({
            data: {
                liabilityId: liability.id,
                covenantName,
                covenantType: covenantType || covenantDef.type,
                checkDate: now,
                periodEnd: periodEnd ? new Date(periodEnd) : now,
                threshold,
                thresholdType,
                thresholdMin: covenantDef.thresholdMin,
                thresholdMax: covenantDef.thresholdMax,
                actualValue,
                status,
                variance,
                variancePercent,
                isBreached,
                breachSeverity: isBreached
                    ? (Math.abs(variancePercent) > 20 ? 'critical' : Math.abs(variancePercent) > 10 ? 'material' : 'minor')
                    : null,
                calculationDetails,
                checkedBy: session.user.id,
            },
        });

        // Update liability
        const updateData: any = {
            lastCovenantCheck: now,
            version: liability.version + 1,
            eventCount: liability.eventCount + 1,
        };

        if (isBreached) {
            updateData.covenantBreaches = liability.covenantBreaches + 1;

            // Update covenant status in definition
            const updatedCovenants = covenants.map((c: any) =>
                c.name === covenantName
                    ? { ...c, status: CovenantStatus.BREACHED, currentValue: actualValue, lastChecked: now.toISOString() }
                    : c
            );
            updateData.covenants = updatedCovenants;

            // Add system tag
            if (!liability.systemTags?.includes('covenant_breach')) {
                updateData.systemTags = [...(liability.systemTags || []), 'covenant_breach'];
            }
        } else {
            // Update covenant status
            const updatedCovenants = covenants.map((c: any) =>
                c.name === covenantName
                    ? { ...c, status, currentValue: actualValue, lastChecked: now.toISOString() }
                    : c
            );
            updateData.covenants = updatedCovenants;
        }

        await (prisma as any).liability.update({
            where: { id: liability.id },
            data: updateData,
        });

        // Create event
        const eventType = isBreached
            ? LiabilityEventType.COVENANT_BREACHED
            : LiabilityEventType.COVENANT_CHECKED;

        const eventId = `evt_${liability.liabilityId}_covenant_${now.getTime()}`;

        await (prisma as any).liabilityEvent.create({
            data: {
                eventId,
                liabilityId: liability.id,
                eventType,
                timestamp: now,
                actorId: session.user.id,
                actorName: session.user.name || session.user.email,
                actorType: 'user',
                payload: {
                    covenantName,
                    covenantType: covenantType || covenantDef.type,
                    threshold,
                    thresholdType,
                    actualValue,
                    status,
                    variance,
                    variancePercent,
                    isBreached,
                    notes,
                },
                previousEventId: liability.lastEventId,
                explanation: isBreached
                    ? `Covenant breach: ${covenantName}. Threshold: ${threshold}, Actual: ${actualValue}, Variance: ${variancePercent.toFixed(1)}%`
                    : `Covenant check: ${covenantName} is ${status}. Actual: ${actualValue} (threshold: ${threshold})`,
            },
        });

        // Update last event ID
        await (prisma as any).liability.update({
            where: { id: liability.id },
            data: { lastEventId: eventId },
        });

        return NextResponse.json({
            check: {
                ...check,
                threshold: Number(check.threshold),
                actualValue: Number(check.actualValue),
                variance: Number(check.variance),
                variancePercent: Number(check.variancePercent),
            },
            status,
            isBreached,
            message: isBreached
                ? `COVENANT BREACH: ${covenantName} - actual value ${actualValue} ${thresholdType === 'minimum' ? 'below' : 'exceeds'} threshold ${threshold}`
                : `Covenant ${covenantName} is ${status}`,
            eventId,
        }, { status: 201 });
    } catch (error) {
        console.error('Error checking covenant:', error);
        return NextResponse.json(
            { error: 'Failed to check covenant' },
            { status: 500 }
        );
    }
}