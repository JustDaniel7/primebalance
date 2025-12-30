// =============================================================================
// ARCHIVE API - Retention Policies (TS Section 7)
// src/app/api/archive/retention-policies/route.ts
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// =============================================================================
// GET - List Retention Policies
// =============================================================================

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const isActive = searchParams.get('isActive');

        const where: any = {
            organizationId: session.user.organizationId,
        };

        if (isActive !== null && isActive !== undefined) {
            where.isActive = isActive === 'true';
        }

        const policies = await (prisma as any).archiveRetentionPolicy.findMany({
            where,
            orderBy: [
                { priority: 'desc' },
                { name: 'asc' },
            ],
        });

        return NextResponse.json({ policies });
    } catch (error) {
        console.error('Error fetching retention policies:', error);
        return NextResponse.json(
            { error: 'Failed to fetch retention policies' },
            { status: 500 }
        );
    }
}

// =============================================================================
// POST - Create Retention Policy
// =============================================================================

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const {
            name,
            code,
            description,
            objectTypes,
            jurisdictions,
            categories,
            retentionYears,
            retentionMonths = 0,
            retentionStartTrigger = 'fiscal_year_end',
            legalBasis,
            legalReference,
            warningDaysBefore = 90,
            autoExtendOnAccess = false,
            autoExtendDays = 0,
            priority = 0,
        } = body;

        // Validate required fields
        if (!name || !code || !retentionYears) {
            return NextResponse.json(
                { error: 'name, code, and retentionYears are required' },
                { status: 400 }
            );
        }

        // Check for duplicate code
        const existing = await (prisma as any).archiveRetentionPolicy.findFirst({
            where: {
                organizationId: session.user.organizationId,
                code,
            },
        });

        if (existing) {
            return NextResponse.json(
                { error: 'A retention policy with this code already exists' },
                { status: 409 }
            );
        }

        const policy = await (prisma as any).archiveRetentionPolicy.create({
            data: {
                name,
                code,
                description,
                objectTypes: objectTypes || [],
                jurisdictions: jurisdictions || [],
                categories: categories || [],
                retentionYears,
                retentionMonths,
                retentionStartTrigger,
                legalBasis,
                legalReference,
                warningDaysBefore,
                autoExtendOnAccess,
                autoExtendDays,
                priority,
                isActive: true,
                organizationId: session.user.organizationId,
            },
        });

        return NextResponse.json({
            policy,
            message: 'Retention policy created successfully',
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating retention policy:', error);
        return NextResponse.json(
            { error: 'Failed to create retention policy' },
            { status: 500 }
        );
    }
}