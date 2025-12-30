// =============================================================================
// ARCHIVE API - Resolve Exception
// src/app/api/archive/exceptions/[id]/resolve/route.ts
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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
        const { resolution, resolutionAction, archiveRecordId } = body;

        if (!resolution?.trim()) {
            return NextResponse.json(
                { error: 'Resolution description is required' },
                { status: 400 }
            );
        }

        const validActions = ['archived', 'skipped', 'corrected', 'manual_override'];
        if (resolutionAction && !validActions.includes(resolutionAction)) {
            return NextResponse.json(
                { error: `Invalid resolution action. Must be one of: ${validActions.join(', ')}` },
                { status: 400 }
            );
        }

        // Find exception
        const exception = await (prisma as any).archiveException.findFirst({
            where: {
                id,
                organizationId: session.user.organizationId,
            },
        });

        if (!exception) {
            return NextResponse.json({ error: 'Exception not found' }, { status: 404 });
        }

        if (exception.status === 'resolved') {
            return NextResponse.json(
                { error: 'Exception is already resolved' },
                { status: 400 }
            );
        }

        // Update exception
        const updated = await (prisma as any).archiveException.update({
            where: { id },
            data: {
                status: 'resolved',
                resolvedAt: new Date(),
                resolvedBy: session.user.id,
                resolution,
                resolutionAction: resolutionAction || 'manual_override',
                archiveRecordId,
            },
        });

        return NextResponse.json({
            exception: updated,
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