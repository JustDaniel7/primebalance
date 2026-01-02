// =============================================================================
// DUNNING API - Retry Exception (TS Section 9.5)
// src/app/api/dunning/exceptions/[id]/retry/route.ts
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DunningExceptionStatus } from '@/types/dunning';

// =============================================================================
// POST - Retry Exception (Re-trigger proposal with corrections)
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
        const { corrections } = body;

        const exception = await (prisma as any).dunningException.findFirst({
            where: {
                organizationId: session.user.organizationId,
                id,
            },
            include: {
                dunning: true,
            },
        });

        if (!exception) {
            return NextResponse.json({ error: 'Exception not found' }, { status: 404 });
        }

        if (exception.status === DunningExceptionStatus.RESOLVED) {
            return NextResponse.json(
                { error: 'Cannot retry resolved exception' },
                { status: 400 }
            );
        }

        // Check retry limit
        if (exception.retryCount >= exception.maxRetries) {
            return NextResponse.json(
                {
                    error: `Maximum retries (${exception.maxRetries}) exceeded`,
                    code: 'MAX_RETRIES_EXCEEDED',
                },
                { status: 400 }
            );
        }

        const now = new Date();

        // Apply corrections to dunning if provided
        if (corrections && exception.dunning) {
            const allowedCorrections = [
                'customerName',
                'customerType',
                'customerJurisdiction',
                'customerLanguage',
                'customerDunningBlocked',
                'gracePeriodDays',
                'jurisdictionId',
            ];

            const updateData: any = {};
            for (const [key, value] of Object.entries(corrections)) {
                if (allowedCorrections.includes(key)) {
                    updateData[key] = value;
                }
            }

            if (Object.keys(updateData).length > 0) {
                await (prisma as any).dunning.update({
                    where: { id: exception.dunning.id },
                    data: updateData,
                });
            }
        }

        // Update exception
        const nextRetryAt = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes

        const updated = await (prisma as any).dunningException.update({
            where: { id },
            data: {
                retryCount: exception.retryCount + 1,
                lastRetryAt: now,
                nextRetryAt,
                status: DunningExceptionStatus.OPEN,
                exceptionDetails: {
                    ...exception.exceptionDetails,
                    lastRetryCorrections: corrections,
                    lastRetryBy: session.user.id,
                },
            },
        });

        return NextResponse.json({
            exception: {
                ...updated,
                confidenceScore: updated.confidenceScore ? Number(updated.confidenceScore) : null,
            },
            retryCount: updated.retryCount,
            maxRetries: updated.maxRetries,
            nextRetryAt,
            message: `Retry scheduled. Attempt ${updated.retryCount}/${updated.maxRetries}`,
        });
    } catch (error) {
        console.error('Error retrying exception:', error);
        return NextResponse.json(
            { error: 'Failed to retry exception' },
            { status: 500 }
        );
    }
}