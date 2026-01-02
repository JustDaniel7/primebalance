// =============================================================================
// DUNNING API - Automation Rule Detail & Update
// src/app/api/dunning/automation/rules/[id]/route.ts
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DunningLevel } from '@/types/dunning';

// =============================================================================
// GET - Get Rule Detail
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

        const rule = await (prisma as any).dunningAutomationRule.findFirst({
            where: {
                organizationId: session.user.organizationId,
                OR: [{ id }, { code: id }],
            },
        });

        if (!rule) {
            return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
        }

        return NextResponse.json({
            rule: {
                ...rule,
                confidenceThreshold: Number(rule.confidenceThreshold),
                proposalThreshold: Number(rule.proposalThreshold),
                invoiceAmountMin: rule.invoiceAmountMin ? Number(rule.invoiceAmountMin) : null,
                invoiceAmountMax: rule.invoiceAmountMax ? Number(rule.invoiceAmountMax) : null,
            },
        });
    } catch (error) {
        console.error('Error fetching rule:', error);
        return NextResponse.json(
            { error: 'Failed to fetch rule' },
            { status: 500 }
        );
    }
}

// =============================================================================
// PATCH - Update Rule
// =============================================================================

export async function PATCH(
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

        const rule = await (prisma as any).dunningAutomationRule.findFirst({
            where: {
                organizationId: session.user.organizationId,
                OR: [{ id }, { code: id }],
            },
        });

        if (!rule) {
            return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
        }

        // Build update data
        const allowedFields = [
            'name', 'description', 'triggerType', 'triggerConditions', 'schedule',
            'dunningLevels', 'customerTypes', 'jurisdictions',
            'invoiceAmountMin', 'invoiceAmountMax',
            'reminderDaysAfterDue', 'level1DaysAfterDue', 'level2DaysAfterDue', 'minimumIntervalDays',
            'actionType', 'actionConfig',
            'confidenceThreshold', 'proposalThreshold',
            'requiresApproval', 'approverRoles', 'multiSignatureRequired', 'multiSignatureCount',
            'fallbackRuleId', 'fallbackBehavior', 'explanationTemplate',
            'isActive', 'priority',
        ];

        const updateData: any = {};
        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                updateData[field] = body[field];
            }
        }

        // Validate Level 3 constraints
        const dunningLevels = updateData.dunningLevels || rule.dunningLevels;
        if (dunningLevels.includes(DunningLevel.LEVEL_3)) {
            const requiresApproval = updateData.requiresApproval !== undefined ? updateData.requiresApproval : rule.requiresApproval;
            const multiSignatureRequired = updateData.multiSignatureRequired !== undefined ? updateData.multiSignatureRequired : rule.multiSignatureRequired;

            if (!requiresApproval || !multiSignatureRequired) {
                return NextResponse.json(
                    {
                        error: 'Level 3 rules must require approval and multi-signature',
                        code: 'LEVEL3_REQUIRES_MULTISIG',
                    },
                    { status: 400 }
                );
            }
        }

        const updated = await (prisma as any).dunningAutomationRule.update({
            where: { id: rule.id },
            data: updateData,
        });

        return NextResponse.json({
            rule: {
                ...updated,
                confidenceThreshold: Number(updated.confidenceThreshold),
                proposalThreshold: Number(updated.proposalThreshold),
            },
            message: `Rule '${updated.name}' updated`,
        });
    } catch (error) {
        console.error('Error updating rule:', error);
        return NextResponse.json(
            { error: 'Failed to update rule' },
            { status: 500 }
        );
    }
}

// =============================================================================
// DELETE - Deactivate Rule (Soft Delete)
// =============================================================================

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        const rule = await (prisma as any).dunningAutomationRule.findFirst({
            where: {
                organizationId: session.user.organizationId,
                OR: [{ id }, { code: id }],
            },
        });

        if (!rule) {
            return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
        }

        // Soft delete by deactivating
        await (prisma as any).dunningAutomationRule.update({
            where: { id: rule.id },
            data: { isActive: false },
        });

        return NextResponse.json({
            message: `Rule '${rule.name}' deactivated`,
        });
    } catch (error) {
        console.error('Error deleting rule:', error);
        return NextResponse.json(
            { error: 'Failed to delete rule' },
            { status: 500 }
        );
    }
}