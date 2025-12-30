// =============================================================================
// LIABILITIES API - Exception Queue (TS Section 11.5)
// src/app/api/liabilities/exceptions/route.ts
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ExceptionStatus, ExceptionType } from '@/types/liabilities';

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
        const exceptionType = searchParams.get('type');
        const assignedTo = searchParams.get('assignedTo');
        const isOverdue = searchParams.get('isOverdue');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
        const skip = (page - 1) * limit;

        // Build where clause
        const where: any = { organizationId: session.user.organizationId };
        if (status) where.status = status;
        if (exceptionType) where.exceptionType = exceptionType;
        if (assignedTo) where.assignedTo = assignedTo;
        if (isOverdue === 'true') where.isOverdue = true;

        // Get exceptions
        const [exceptions, total] = await Promise.all([
            (prisma as any).liabilityException.findMany({
                where,
                orderBy: [
                    { isOverdue: 'desc' },
                    { slaDeadline: 'asc' },
                    { createdAt: 'desc' },
                ],
                take: limit,
                skip,
            }),
            (prisma as any).liabilityException.count({ where }),
        ]);

        // Get statistics
        const stats = await (prisma as any).liabilityException.groupBy({
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
            statistics: stats.reduce((acc: any, item: any) => {
                acc[item.status] = item._count.id;
                return acc;
            }, {}),
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
// POST - Create Exception
// =============================================================================

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const {
            liabilityId,
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

        // Validate
        if (!exceptionType) {
            return NextResponse.json({ error: 'Exception type is required' }, { status: 400 });
        }
        if (!exceptionMessage?.trim()) {
            return NextResponse.json({ error: 'Exception message is required' }, { status: 400 });
        }

        const now = new Date();
        const slaDeadline = new Date(now.getTime() + slaHours * 60 * 60 * 1000);

        // Create exception
        const exception = await (prisma as any).liabilityException.create({
            data: {
                liabilityId,
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
                assignedAt: assignedTo ? now : null,
                slaDeadline,
                status: ExceptionStatus.OPEN,
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