// src/app/api/projects/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSessionWithOrg, unauthorized, badRequest } from '@/lib/api-utils';
import { prisma } from '@/lib/prisma';

// GET /api/projects - List all projects
export async function GET(req: NextRequest) {
    try {
        const user = await getSessionWithOrg();
        if (!user?.organizationId) return unauthorized();
        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');
        const type = searchParams.get('type');
        const costCenterId = searchParams.get('costCenterId');

        const where: any = {
            organizationId: user.organizationId,
        };

        if (status) where.status = status;
        if (type) where.type = type;
        if (costCenterId) where.costCenterId = costCenterId;

        const projects = await prisma.project.findMany({
            where,
            include: {
                costCenter: {
                    select: { id: true, code: true, name: true },
                },
                _count: {
                    select: {
                        timeEntries: true,
                        milestones: true,
                    },
                },
            },
            orderBy: { updatedAt: 'desc' },
        });

        // Calculate derived fields
        const projectsWithCalculations = projects.map((p: any) => ({
            ...p,
            budgetRemaining: Number(p.budgetAmount) - Number(p.budgetSpent),
            budgetVariance: Number(p.budgetAmount) - Number(p.budgetSpent),
            budgetUtilization: Number(p.budgetAmount) > 0
                ? (Number(p.budgetSpent) / Number(p.budgetAmount)) * 100
                : 0,
            remainingHours: Number(p.allocatedHours) - Number(p.actualHours),
            grossProfit: Number(p.totalRevenue) - Number(p.totalCosts),
            grossMargin: Number(p.totalRevenue) > 0
                ? ((Number(p.totalRevenue) - Number(p.totalCosts)) / Number(p.totalRevenue)) * 100
                : 0,
            unbilledAmount: Number(p.contractValue || 0) - Number(p.billedAmount || 0),
        }));

        return NextResponse.json({ projects: projectsWithCalculations });
    } catch (error) {
        console.error('GET /api/projects error:', error);
        return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
    }
}

// POST /api/projects - Create a new project
export async function POST(req: NextRequest) {
    try {
        const user = await getSessionWithOrg();
        if (!user?.organizationId) return unauthorized();

        const body = await req.json();

        // Validation
        if (!body.name) return badRequest('Project name is required');
        if (!body.type) return badRequest('Project type is required');
        if (!body.budgetType) return badRequest('Budget type is required');
        if (!body.plannedStartDate) return badRequest('Planned start date is required');
        if (!body.plannedEndDate) return badRequest('Planned end date is required');

        // Generate code if not provided
        const code = body.code || `PRJ-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;

        const project = await prisma.project.create({
            data: {
                code,
                name: body.name,
                description: body.description,
                type: body.type,
                status: body.status || 'planning',
                priority: body.priority || 'medium',
                ownerId: body.ownerId || user.id,
                ownerName: body.ownerName || user.name,
                costCenterId: body.costCenterId,
                departmentId: body.departmentId,
                clientId: body.clientId,
                clientName: body.clientName,
                plannedStartDate: new Date(body.plannedStartDate),
                plannedEndDate: new Date(body.plannedEndDate),
                budgetType: body.budgetType,
                budgetAmount: body.budgetAmount || 0,
                budgetSpent: 0,
                currency: body.currency || 'USD',
                contractValue: body.contractValue,
                totalRevenue: 0,
                totalCosts: 0,
                allocatedHours: body.allocatedHours || 0,
                actualHours: 0,
                hourlyRate: body.hourlyRate,
                percentComplete: 0,
                milestoneCount: 0,
                milestonesCompleted: 0,
                isBillable: body.isBillable || false,
                billingRate: body.billingRate,
                billingMethod: body.billingMethod,
                tags: body.tags || [],
                organizationId: user.organizationId,
            },
            include: {
                costCenter: {
                    select: { id: true, code: true, name: true },
                },
            },
        });

        return NextResponse.json(project, { status: 201 });
    } catch (error) {
        console.error('POST /api/projects error:', error);
        return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
    }
}