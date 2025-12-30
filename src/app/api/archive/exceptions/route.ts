// =============================================================================
// ARCHIVE API - Exception Queue (TS Section 9.4)
// src/app/api/archive/exceptions/route.ts
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// =============================================================================
// GET - List Exceptions
// =============================================================================

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const exceptionType = searchParams.get('exceptionType');
        const assignedTo = searchParams.get('assignedTo');
        const isOverdue = searchParams.get('isOverdue');
        const limit = parseInt(searchParams.get('limit') || '50');
        const page = parseInt(searchParams.get('page') || '1');
        const skip = (page - 1) * limit;

        const where: any = {
            organizationId: session.user.organizationId,
        };

        if (status) where.status = status;
        if (exceptionType) where.exceptionType = exceptionType;
        if (assignedTo) where.assignedTo = assignedTo;
        if (isOverdue === 'true') where.isOverdue = true;

        const [exceptions, total] = await Promise.all([
            (prisma as any).archiveException.findMany({
                where,
                orderBy: [
                    { isOverdue: 'desc' },
                    { slaDeadline: 'asc' },
                    { createdAt: 'desc' },
                ],
                take: limit,
                skip,
            }),
            (prisma as any).archiveException.count({ where }),
        ]);

        // Get summary stats
        const stats = await (prisma as any).archiveException.groupBy({
            by: ['status'],
            where: { organizationId: session.user.organizationId },
            _count: { id: true },
        });

        return NextResponse.json({
            exceptions,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
            statistics: {
                byStatus: stats.reduce((acc: any, s: any) => {
                    acc[s.status] = s._count.id;
                    return acc;
                }, {}),
            },
        });
    } catch (error) {
        console.error('Error fetching exceptions:', error);
        return NextResponse.json(
            { error: 'Failed to fetch exceptions' },
            { status: 500 }
        );
    }
}

// =============================================================================
// POST - Create Exception (usually system-generated)
// =============================================================================

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const {
            sourceObjectId,
            sourceObjectType,
            sourceModule,
            exceptionType,
            exceptionCode,
            exceptionMessage,
            exceptionDetails,
            validationMode,
            validationErrors,
            confidenceScore,
            assignedTo,
            slaHours = 24,
        } = body;

        // Validate required fields
        if (!sourceObjectId || !sourceObjectType || !exceptionType || !exceptionMessage) {
            return NextResponse.json(
                { error: 'sourceObjectId, sourceObjectType, exceptionType, and exceptionMessage are required' },
                { status: 400 }
            );
        }

        // Calculate SLA deadline
        const slaDeadline = new Date(Date.now() + slaHours * 60 * 60 * 1000);

        const exception = await (prisma as any).archiveException.create({
            data: {
                sourceObjectId,
                sourceObjectType,
                sourceModule,
                exceptionType,
                exceptionCode,
                exceptionMessage,
                exceptionDetails,
                validationMode,
                validationErrors,
                confidenceScore,
                assignedTo,
                assignedAt: assignedTo ? new Date() : null,
                slaDeadline,
                status: 'open',
                organizationId: session.user.organizationId,
            },
        });

        return NextResponse.json({
            exception,
            message: 'Exception created successfully',
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating exception:', error);
        return NextResponse.json(
            { error: 'Failed to create exception' },
            { status: 500 }
        );
    }
}