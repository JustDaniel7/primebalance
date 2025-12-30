// =============================================================================
// LIABILITIES API - Resolve Exception (TS Section 11.5)
// src/app/api/liabilities/exceptions/[id]/resolve/route.ts
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ExceptionStatus } from '@/types/liabilities';

// =============================================================================
// POST - Resolve Exception
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
            resolution,
            resolutionAction,
            createdLiabilityId,
        } = body;

        // Validate
        if (!resolution?.trim()) {
            return NextResponse.json({ error: 'Resolution is required' }, { status: 400 });
        }

        const validActions = ['processed', 'skipped', 'corrected', 'manual_override'];
        if (resolutionAction && !validActions.includes(resolutionAction)) {
            return NextResponse.json(
                { error: `Invalid resolution action. Must be one of: ${validActions.join(', ')}` },
                { status: 400 }
            );
        }

        // Find exception
        const exception = await (prisma as any).liabilityException.findFirst({
            where: {
                id,
                organizationId: session.user.organizationId,
            },
        });

        if (!exception) {
            return NextResponse.json({ error: 'Exception not found' }, { status: 404 });
        }

        if (exception.status === ExceptionStatus.RESOLVED) {
            return NextResponse.json(
                { error: 'Exception is already resolved', code: 'ALREADY_RESOLVED' },
                { status: 400 }
            );
        }

        const now = new Date();

        // Update exception
        const updated = await (prisma as any).liabilityException.update({
            where: { id },
            data: {
                status: ExceptionStatus.RESOLVED,
                resolvedAt: now,
                resolvedBy: session.user.id,
                resolution,
                resolutionAction: resolutionAction || 'processed',
            },
        });

        return NextResponse.json({
            exception: updated,
            createdLiabilityId,
            message: 'Exception resolved successfully',
        });
    } catch (error) {
        console.error('Error resolving exception:', error);
        return NextResponse.json(
            { error: 'Failed to resolve exception' },
            { status: 500 }
        );
    }
}