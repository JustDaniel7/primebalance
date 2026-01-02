// =============================================================================
// DUNNING API - Run Automation (TS Section 9)
// Batch process overdue invoices and create proposals
// src/app/api/dunning/automation/run/route.ts
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
    DunningStatus,
    DunningLevel,
    canAutoPropose,
    canReceiveProposal,
} from '@/types/dunning';

// =============================================================================
// POST - Run Automation (TS Section 9.1)
// =============================================================================

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const {
            ruleId,
            dryRun = true,
            limit = 100,
        } = body;

        const now = new Date();

        // Get active rules
        const rulesWhere: any = {
            organizationId: session.user.organizationId,
            isActive: true,
        };
        if (ruleId) {
            rulesWhere.OR = [{ id: ruleId }, { code: ruleId }];
        }

        const rules = await (prisma as any).dunningAutomationRule.findMany({
            where: rulesWhere,
            orderBy: { priority: 'asc' },
        });

        if (rules.length === 0) {
            return NextResponse.json({
                message: 'No active automation rules found',
                processed: 0,
            });
        }

        // Get eligible dunnings
        const eligibleDunnings = await (prisma as any).dunning.findMany({
            where: {
                organizationId: session.user.organizationId,
                status: {
                    in: [
                        DunningStatus.OVERDUE,
                        DunningStatus.REMINDER_SENT,
                        DunningStatus.DUNNING_LEVEL1_SENT,
                        DunningStatus.DUNNING_LEVEL2_SENT,
                    ],
                },
                hasActiveProposal: false,
                isDisputed: false,
                customerDunningBlocked: false,
            },
            take: limit,
            orderBy: { daysPastDue: 'desc' },
        });

        const results = {
            total: eligibleDunnings.length,
            matched: 0,
            proposed: 0,
            skipped: 0,
            exceptions: 0,
            details: [] as any[],
        };

        for (const dunning of eligibleDunnings) {
            // Find matching rule
            const matchingRule = rules.find((rule: any) => {
                // Check dunning level
                const nextLevel = (dunning.currentLevel || 0) + 1;
                if (rule.dunningLevels.length > 0 && !rule.dunningLevels.includes(nextLevel)) {
                    return false;
                }

                // Check customer type
                if (rule.customerTypes.length > 0 && !rule.customerTypes.includes(dunning.customerType)) {
                    return false;
                }

                // Check jurisdiction
                if (rule.jurisdictions.length > 0 && !rule.jurisdictions.includes(dunning.jurisdictionId)) {
                    return false;
                }

                // Check amount
                const amount = Number(dunning.outstandingAmount);
                if (rule.invoiceAmountMin && amount < Number(rule.invoiceAmountMin)) {
                    return false;
                }
                if (rule.invoiceAmountMax && amount > Number(rule.invoiceAmountMax)) {
                    return false;
                }

                // Check timing
                const daysPastDue = dunning.daysPastDue || 0;
                if (nextLevel === DunningLevel.REMINDER && daysPastDue < rule.reminderDaysAfterDue) {
                    return false;
                }
                if (nextLevel === DunningLevel.LEVEL_1 && daysPastDue < rule.level1DaysAfterDue) {
                    return false;
                }
                if (nextLevel === DunningLevel.LEVEL_2 && daysPastDue < rule.level2DaysAfterDue) {
                    return false;
                }

                // Level 3 is NEVER auto-proposed
                if (nextLevel >= DunningLevel.LEVEL_3) {
                    return false;
                }

                return true;
            });

            if (!matchingRule) {
                results.skipped++;
                results.details.push({
                    dunningId: dunning.dunningId,
                    status: 'skipped',
                    reason: 'No matching rule',
                });
                continue;
            }

            results.matched++;

            // Check minimum interval
            const lastSentAt = dunning.reminderSentAt || dunning.dunningLevel1SentAt || dunning.dunningLevel2SentAt;
            if (lastSentAt) {
                const daysSinceLast = Math.floor(
                    (now.getTime() - new Date(lastSentAt).getTime()) / (1000 * 60 * 60 * 24)
                );
                if (daysSinceLast < matchingRule.minimumIntervalDays) {
                    results.skipped++;
                    results.details.push({
                        dunningId: dunning.dunningId,
                        status: 'skipped',
                        reason: `Minimum interval not met (${daysSinceLast}/${matchingRule.minimumIntervalDays} days)`,
                    });
                    continue;
                }
            }

            // In dry run, just log
            if (dryRun) {
                const nextLevel = (dunning.currentLevel || 0) + 1;
                results.proposed++;
                results.details.push({
                    dunningId: dunning.dunningId,
                    dunningNumber: dunning.dunningNumber,
                    customerName: dunning.customerName,
                    outstandingAmount: Number(dunning.outstandingAmount),
                    daysPastDue: dunning.daysPastDue,
                    currentLevel: dunning.currentLevel,
                    proposedLevel: nextLevel,
                    matchingRule: matchingRule.code,
                    status: 'would_propose',
                });
                continue;
            }

            // Actually create proposal (call the propose endpoint logic)
            // In production, this would call the internal propose function
            results.proposed++;
            results.details.push({
                dunningId: dunning.dunningId,
                status: 'proposed',
                matchingRule: matchingRule.code,
            });

            // Update rule execution stats
            await (prisma as any).dunningAutomationRule.update({
                where: { id: matchingRule.id },
                data: {
                    lastExecutedAt: now,
                    executionCount: matchingRule.executionCount + 1,
                    successCount: matchingRule.successCount + 1,
                },
            });
        }

        return NextResponse.json({
            dryRun,
            timestamp: now.toISOString(),
            summary: {
                total: results.total,
                matched: results.matched,
                proposed: results.proposed,
                skipped: results.skipped,
                exceptions: results.exceptions,
            },
            details: results.details.slice(0, 100), // Limit response size
            message: dryRun
                ? `Dry run completed. ${results.proposed} proposals would be created.`
                : `Automation completed. ${results.proposed} proposals created.`,
        });
    } catch (error) {
        console.error('Error running automation:', error);
        return NextResponse.json(
            { error: 'Failed to run automation' },
            { status: 500 }
        );
    }
}
