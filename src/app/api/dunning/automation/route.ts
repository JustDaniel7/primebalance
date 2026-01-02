// =============================================================================
// DUNNING API - Automation Rules (TS Section 9)
// src/app/api/dunning/automation/rules/route.ts
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DunningLevel } from '@/types/dunning';

// =============================================================================
// GET - List Automation Rules
// =============================================================================

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const isActive = searchParams.get('isActive');
        const triggerType = searchParams.get('triggerType');

        const where: any = { organizationId: session.user.organizationId };
        if (isActive !== null) where.isActive = isActive === 'true';
        if (triggerType) where.triggerType = triggerType;

        const rules = await (prisma as any).dunningAutomationRule.findMany({
            where,
            orderBy: [{ isActive: 'desc' }, { priority: 'asc' }],
        });

        // Format rules
        const formattedRules = rules.map((r: any) => ({
            ...r,
            confidenceThreshold: Number(r.confidenceThreshold),
            proposalThreshold: Number(r.proposalThreshold),
            invoiceAmountMin: r.invoiceAmountMin ? Number(r.invoiceAmountMin) : null,
            invoiceAmountMax: r.invoiceAmountMax ? Number(r.invoiceAmountMax) : null,
        }));

        return NextResponse.json({
            rules: formattedRules,
            total: rules.length,
            active: rules.filter((r: any) => r.isActive).length,
        });
    } catch (error) {
        console.error('Error fetching automation rules:', error);
        return NextResponse.json(
            { error: 'Failed to fetch automation rules' },
            { status: 500 }
        );
    }
}

// =============================================================================
// POST - Create Automation Rule
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
            triggerType,
            triggerConditions,
            schedule,
            dunningLevels = [],
            customerTypes = [],
            jurisdictions = [],
            invoiceAmountMin,
            invoiceAmountMax,
            reminderDaysAfterDue = 3,
            level1DaysAfterDue = 14,
            level2DaysAfterDue = 30,
            minimumIntervalDays = 7,
            actionType,
            actionConfig,
            confidenceThreshold = 0.95,
            proposalThreshold = 0.70,
            requiresApproval = true,
            approverRoles = [],
            multiSignatureRequired = false,
            multiSignatureCount = 2,
            fallbackRuleId,
            fallbackBehavior,
            explanationTemplate,
            isActive = true,
            priority = 100,
        } = body;

        // Validate required fields
        if (!name?.trim()) {
            return NextResponse.json({ error: 'Rule name is required' }, { status: 400 });
        }
        if (!code?.trim()) {
            return NextResponse.json({ error: 'Rule code is required' }, { status: 400 });
        }
        if (!triggerType) {
            return NextResponse.json({ error: 'Trigger type is required' }, { status: 400 });
        }
        if (!actionType) {
            return NextResponse.json({ error: 'Action type is required' }, { status: 400 });
        }

        // Check for duplicate code
        const existing = await (prisma as any).dunningAutomationRule.findFirst({
            where: {
                organizationId: session.user.organizationId,
                code,
            },
        });

        if (existing) {
            return NextResponse.json(
                { error: 'Rule with this code already exists' },
                { status: 400 }
            );
        }

        // Validate Level 3 rules must require approval and multi-signature
        if (dunningLevels.includes(DunningLevel.LEVEL_3)) {
            if (!requiresApproval || !multiSignatureRequired) {
                return NextResponse.json(
                    {
                        error: 'Level 3 rules must require approval and multi-signature (TS Section 8.4)',
                        code: 'LEVEL3_REQUIRES_MULTISIG',
                    },
                    { status: 400 }
                );
            }
        }

        const rule = await (prisma as any).dunningAutomationRule.create({
            data: {
                name,
                code,
                description,
                triggerType,
                triggerConditions,
                schedule,
                dunningLevels,
                customerTypes,
                jurisdictions,
                invoiceAmountMin,
                invoiceAmountMax,
                reminderDaysAfterDue,
                level1DaysAfterDue,
                level2DaysAfterDue,
                minimumIntervalDays,
                actionType,
                actionConfig,
                confidenceThreshold,
                proposalThreshold,
                requiresApproval,
                approverRoles,
                multiSignatureRequired,
                multiSignatureCount,
                fallbackRuleId,
                fallbackBehavior,
                explanationTemplate,
                isActive,
                priority,
                executionCount: 0,
                successCount: 0,
                failureCount: 0,
                createdBy: session.user.id,
                organizationId: session.user.organizationId,
            },
        });

        return NextResponse.json({
            rule: {
                ...rule,
                confidenceThreshold: Number(rule.confidenceThreshold),
                proposalThreshold: Number(rule.proposalThreshold),
            },
            message: `Automation rule '${name}' created`,
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating automation rule:', error);
        return NextResponse.json(
            { error: 'Failed to create automation rule' },
            { status: 500 }
        );
    }
}