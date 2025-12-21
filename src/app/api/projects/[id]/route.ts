// src/app/api/projects/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSessionWithOrg, unauthorized, notFound, badRequest } from '@/lib/api-utils';
import { prisma } from '@/lib/prisma';

// GET /api/projects/[id] - Get a single project
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const user = await getSessionWithOrg();
        if (!user?.organizationId) return unauthorized();

        const project = await prisma.Project.findFirst({
            where: {
                id: params.id,
                organizationId: user.organizationId,
            },
            include: {
                costCenter: {
                    select: { id: true, code: true, name: true },
                },
                timeEntries: {
                    orderBy: { date: 'desc' },
                    take: 10,
                },
                milestones: {
                    orderBy: { plannedDate: 'asc' },
                },
                budgetLines: true,
                resourceAllocations: true,
            },
        });

        if (!project) return notFound('Project');

        // Calculate derived fields
        const projectWithCalculations = {
            ...project,
            budgetRemaining: Number(project.budgetAmount) - Number(project.budgetSpent),
            budgetVariance: Number(project.budgetAmount) - Number(project.budgetSpent),
            budgetUtilization: Number(project.budgetAmount) > 0
                ? (Number(project.budgetSpent) / Number(project.budgetAmount)) * 100
                : 0,
            remainingHours: Number(project.allocatedHours) - Number(project.actualHours),
            grossProfit: Number(project.totalRevenue) - Number(project.totalCosts),
            grossMargin: Number(project.totalRevenue) > 0
                ? ((Number(project.totalRevenue) - Number(project.totalCosts)) / Number(project.totalRevenue)) * 100
                : 0,
            netProfit: Number(project.totalRevenue) - Number(project.totalCosts),
            netMargin: Number(project.totalRevenue) > 0
                ? ((Number(project.totalRevenue) - Number(project.totalCosts)) / Number(project.totalRevenue)) * 100
                : 0,
            unbilledAmount: Number(project.contractValue || 0) - Number(project.billedAmount || 0),
        };

        return NextResponse.json(projectWithCalculations);
    } catch (error) {
        console.error('GET /api/projects/[id] error:', error);
        return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 });
    }
}

// PATCH /api/projects/[id] - Update a project
export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const user = await getSessionWithOrg();
        if (!user?.organizationId) return unauthorized();

        const body = await req.json();

        // Verify project exists and belongs to organization
        const existing = await prisma.Project.findFirst({
            where: {
                id: params.id,
                organizationId: user.organizationId,
            },
        });

        if (!existing) return notFound('Project');

        // Prepare update data
        const updateData: any = {};

        // Basic fields
        if (body.name !== undefined) updateData.name = body.name;
        if (body.description !== undefined) updateData.description = body.description;
        if (body.type !== undefined) updateData.type = body.type;
        if (body.status !== undefined) {
            updateData.status = body.status;
            // Set actual dates based on status
            if (body.status === 'active' && !existing.actualStartDate) {
                updateData.actualStartDate = new Date();
            }
            if (body.status === 'completed' && !existing.actualEndDate) {
                updateData.actualEndDate = new Date();
                updateData.percentComplete = 100;
            }
        }
        if (body.priority !== undefined) updateData.priority = body.priority;

        // Ownership
        if (body.ownerId !== undefined) updateData.ownerId = body.ownerId;
        if (body.ownerName !== undefined) updateData.ownerName = body.ownerName;
        if (body.costCenterId !== undefined) updateData.costCenterId = body.costCenterId;
        if (body.departmentId !== undefined) updateData.departmentId = body.departmentId;
        if (body.clientId !== undefined) updateData.clientId = body.clientId;
        if (body.clientName !== undefined) updateData.clientName = body.clientName;

        // Timeline
        if (body.plannedStartDate !== undefined) updateData.plannedStartDate = new Date(body.plannedStartDate);
        if (body.plannedEndDate !== undefined) updateData.plannedEndDate = new Date(body.plannedEndDate);
        if (body.actualStartDate !== undefined) updateData.actualStartDate = new Date(body.actualStartDate);
        if (body.actualEndDate !== undefined) updateData.actualEndDate = new Date(body.actualEndDate);

        // Budget
        if (body.budgetType !== undefined) updateData.budgetType = body.budgetType;
        if (body.budgetAmount !== undefined) updateData.budgetAmount = body.budgetAmount;
        if (body.budgetSpent !== undefined) updateData.budgetSpent = body.budgetSpent;
        if (body.currency !== undefined) updateData.currency = body.currency;

        // Revenue
        if (body.contractValue !== undefined) updateData.contractValue = body.contractValue;
        if (body.billedAmount !== undefined) updateData.billedAmount = body.billedAmount;
        if (body.collectedAmount !== undefined) updateData.collectedAmount = body.collectedAmount;
        if (body.totalRevenue !== undefined) updateData.totalRevenue = body.totalRevenue;
        if (body.totalCosts !== undefined) updateData.totalCosts = body.totalCosts;

        // Resources
        if (body.allocatedHours !== undefined) updateData.allocatedHours = body.allocatedHours;
        if (body.actualHours !== undefined) updateData.actualHours = body.actualHours;
        if (body.hourlyRate !== undefined) updateData.hourlyRate = body.hourlyRate;

        // Progress
        if (body.percentComplete !== undefined) updateData.percentComplete = body.percentComplete;

        // Billing
        if (body.isBillable !== undefined) updateData.isBillable = body.isBillable;
        if (body.billingRate !== undefined) updateData.billingRate = body.billingRate;
        if (body.billingMethod !== undefined) updateData.billingMethod = body.billingMethod;

        // Meta
        if (body.tags !== undefined) updateData.tags = body.tags;

        const project = await prisma.Project.update({
            where: { id: params.id },
            data: updateData,
            include: {
                costCenter: {
                    select: { id: true, code: true, name: true },
                },
            },
        });

        return NextResponse.json(project);
    } catch (error) {
        console.error('PATCH /api/projects/[id] error:', error);
        return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
    }
}

// DELETE /api/projects/[id] - Delete a project
export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const user = await getSessionWithOrg();
        if (!user?.organizationId) return unauthorized();

        // Verify project exists and belongs to organization
        const existing = await prisma.Project.findFirst({
            where: {
                id: params.id,
                organizationId: user.organizationId,
            },
        });

        if (!existing) return notFound('Project');

        // Delete project (cascades to related records)
        await prisma.Project.delete({
            where: { id: params.id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('DELETE /api/projects/[id] error:', error);
        return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
    }
}