// =============================================================================
// DUNNING API - Auto-Propose (TS Sections 8, 9)
// IMPORTANT: Level 3 is NEVER auto-proposed (TS Section 8.4)
// src/app/api/dunning/[id]/propose/route.ts
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
    DunningStatus,
    DunningEventType,
    DunningLevel,
    ProposalStatus,
    ProposalType,
    ProposalPriority,
    generateEventId,
    generateProposalId,
    calculateInterest,
    calculateTotalDue,
    determineProposalPriority,
    shouldRouteToExceptionQueue,
    canAutoPropose,
    canReceiveProposal,
    DayCountBasis,
    DEFAULT_REMINDER_DAYS,
    DEFAULT_LEVEL1_DAYS,
    DEFAULT_LEVEL2_DAYS,
    DEFAULT_MINIMUM_INTERVAL_DAYS,
} from '@/types/dunning';

// =============================================================================
// POST - Auto-Propose Dunning Action (TS Section 8, 9)
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
            forceLevel, // Optional: force a specific level
            includeInterest = true,
            includeFees = true,
            templateId,
            deadline,
        } = body;

        // Find dunning with full context
        const dunning = await (prisma as any).dunning.findFirst({
            where: {
                organizationId: session.user.organizationId,
                OR: [
                    { id },
                    { dunningId: id },
                    { dunningNumber: id },
                ],
            },
        });

        if (!dunning) {
            return NextResponse.json({ error: 'Dunning record not found' }, { status: 404 });
        }

        // Check if can receive proposals
        if (!canReceiveProposal(dunning.status)) {
            return NextResponse.json(
                {
                    error: `Cannot propose for dunning in status '${dunning.status}'`,
                    code: 'INVALID_STATUS_FOR_PROPOSAL',
                },
                { status: 400 }
            );
        }

        // Check if already has active proposal
        if (dunning.hasActiveProposal) {
            return NextResponse.json(
                {
                    error: 'Dunning already has an active proposal pending approval',
                    code: 'ACTIVE_PROPOSAL_EXISTS',
                    activeProposalId: dunning.activeProposalId,
                },
                { status: 400 }
            );
        }

        // Check if disputed
        if (dunning.isDisputed) {
            return NextResponse.json(
                {
                    error: 'Cannot propose for disputed dunning',
                    code: 'DUNNING_DISPUTED',
                },
                { status: 400 }
            );
        }

        // Check if customer is blocked
        if (dunning.customerDunningBlocked) {
            return NextResponse.json(
                {
                    error: 'Customer dunning is blocked',
                    code: 'CUSTOMER_DUNNING_BLOCKED',
                },
                { status: 400 }
            );
        }

        const now = new Date();

        // ==========================================================================
        // DETERMINE NEXT LEVEL (TS Section 8.5)
        // ==========================================================================

        let nextLevel: number;
        let proposalType: ProposalType;

        if (forceLevel !== undefined) {
            nextLevel = forceLevel;
        } else {
            // Determine next level based on current state and days past due
            nextLevel = determineNextLevel(dunning);
        }

        // CRITICAL: Level 3 is NEVER auto-proposed (TS Section 8.4)
        if (nextLevel >= DunningLevel.LEVEL_3) {
            return NextResponse.json(
                {
                    error: 'Level 3 cannot be auto-proposed. Use /initiate-level3 endpoint for manual initiation.',
                    code: 'LEVEL3_MANUAL_ONLY',
                    hint: 'Level 3 dunning requires explicit manual initiation as per TS Section 8.4',
                },
                { status: 400 }
            );
        }

        // Validate level can be auto-proposed
        if (!canAutoPropose(nextLevel)) {
            return NextResponse.json(
                {
                    error: `Level ${nextLevel} cannot be auto-proposed`,
                    code: 'LEVEL_NOT_AUTO_PROPOSABLE',
                },
                { status: 400 }
            );
        }

        // Map level to proposal type
        switch (nextLevel) {
            case DunningLevel.REMINDER:
                proposalType = ProposalType.REMINDER;
                break;
            case DunningLevel.LEVEL_1:
                proposalType = ProposalType.LEVEL_1;
                break;
            case DunningLevel.LEVEL_2:
                proposalType = ProposalType.LEVEL_2;
                break;
            default:
                return NextResponse.json(
                    { error: 'Invalid proposal level', code: 'INVALID_LEVEL' },
                    { status: 400 }
                );
        }

        // ==========================================================================
        // DATA VERIFICATION (TS Section 6)
        // ==========================================================================

        const verificationChecks = await performVerificationChecks(dunning, nextLevel, now);
        const allVerified = Object.values(verificationChecks).every((c: any) => c.verified);

        // Calculate confidence score
        const verificationCount = Object.keys(verificationChecks).length;
        const passedCount = Object.values(verificationChecks).filter((c: any) => c.verified).length;
        let confidenceScore = passedCount / verificationCount;

        // Adjust confidence based on data quality
        if (dunning.customerPaymentHistory === 'poor') confidenceScore *= 0.9;
        if (dunning.daysPastDue > 90) confidenceScore *= 0.95;
        if (dunning.customerRiskScore && Number(dunning.customerRiskScore) > 70) confidenceScore *= 0.9;

        // ==========================================================================
        // ROUTE TO EXCEPTION QUEUE IF LOW CONFIDENCE (TS Section 9.4)
        // ==========================================================================

        if (shouldRouteToExceptionQueue(confidenceScore) || !allVerified) {
            // Create exception
            await (prisma as any).dunningException.create({
                data: {
                    dunningId: dunning.id,
                    exceptionType: !allVerified ? 'validation_failed' : 'confidence_low',
                    exceptionCode: !allVerified ? 'VERIFICATION_FAILED' : 'LOW_CONFIDENCE',
                    exceptionMessage: !allVerified
                        ? 'Data verification failed - manual review required'
                        : `Confidence score ${(confidenceScore * 100).toFixed(0)}% below threshold`,
                    exceptionDetails: {
                        verificationChecks,
                        confidenceScore,
                        proposedLevel: nextLevel,
                    },
                    validationMode: dunning.validationMode,
                    validationErrors: !allVerified ? verificationChecks : null,
                    confidenceScore,
                    dataSourcesChecked: Object.keys(verificationChecks),
                    slaDeadline: new Date(now.getTime() + 24 * 60 * 60 * 1000), // 24 hours
                    status: 'open',
                    organizationId: session.user.organizationId,
                },
            });

            return NextResponse.json({
                dunningId: dunning.dunningId,
                success: false,
                routedToExceptionQueue: true,
                reason: !allVerified ? 'verification_failed' : 'low_confidence',
                confidenceScore,
                verificationChecks,
                message: 'Proposal routed to exception queue for manual review',
            });
        }

        // ==========================================================================
        // CALCULATE INTEREST & FEES (TS Section 11)
        // ==========================================================================

        let interestProposed = 0;
        let feesProposed = 0;

        // Get jurisdiction config
        const jurisdictionConfig = await (prisma as any).dunningJurisdictionConfig.findFirst({
            where: {
                organizationId: session.user.organizationId,
                jurisdictionId: dunning.jurisdictionId || 'DE',
                isActive: true,
            },
        });

        // Calculate interest (Level 1 and above)
        if (includeInterest && nextLevel >= DunningLevel.LEVEL_1) {
            const interestRate = dunning.interestRateApplied
                ? Number(dunning.interestRateApplied)
                : getStatutoryInterestRate(jurisdictionConfig, dunning.customerType);

            if (interestRate > 0) {
                interestProposed = calculateInterest(
                    Number(dunning.outstandingAmount),
                    interestRate,
                    dunning.daysPastDue,
                    DayCountBasis.ACTUAL_365
                );
            }
        }

        // Calculate fees (Level 2 and above)
        if (includeFees && nextLevel >= DunningLevel.LEVEL_2) {
            feesProposed = getFlatFee(jurisdictionConfig, dunning.customerType);
        }

        const totalProposed = calculateTotalDue(
            Number(dunning.outstandingAmount),
            interestProposed,
            feesProposed
        );

        // ==========================================================================
        // DETERMINE PRIORITY (TS Section 9.4)
        // ==========================================================================

        const priority = determineProposalPriority(confidenceScore);

        // ==========================================================================
        // GET TEMPLATE
        // ==========================================================================

        const template = await getTemplate(
            session.user.organizationId,
            nextLevel,
            dunning.jurisdictionId,
            dunning.customerLanguage,
            dunning.customerType,
            templateId
        );

        // ==========================================================================
        // CREATE PROPOSAL
        // ==========================================================================

        const proposalId = generateProposalId(dunning.dunningId, nextLevel, now);

        // Calculate deadline
        const proposalDeadline = deadline
            ? new Date(deadline)
            : new Date(now.getTime() + getDeadlineDays(nextLevel) * 24 * 60 * 60 * 1000);

        // Proposal expires after 7 days if not acted upon
        const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        const proposal = await (prisma as any).dunningProposal.create({
            data: {
                proposalId,
                dunningId: dunning.id,
                proposalType,
                proposalLevel: nextLevel,
                status: ProposalStatus.PENDING,
                priority,
                outstandingAmount: dunning.outstandingAmount,
                interestProposed,
                feesProposed,
                totalProposed,
                currency: dunning.currency,
                verificationStatus: 'passed',
                verificationChecks,
                invoiceVerified: verificationChecks.invoice?.verified || false,
                paymentVerified: verificationChecks.payment?.verified || false,
                disputeVerified: verificationChecks.dispute?.verified || false,
                customerVerified: verificationChecks.customer?.verified || false,
                contractVerified: verificationChecks.contract?.verified || false,
                priorDunningVerified: verificationChecks.priorDunning?.verified || false,
                confidenceScore,
                confidenceFactors: {
                    verificationScore: passedCount / verificationCount,
                    paymentHistoryFactor: dunning.customerPaymentHistory === 'poor' ? 0.9 : 1.0,
                    agingFactor: dunning.daysPastDue > 90 ? 0.95 : 1.0,
                },
                ruleId: 'auto_propose_rule',
                ruleVersion: '1.0',
                dataSourcesChecked: Object.keys(verificationChecks),
                inputSnapshot: {
                    dunning: {
                        status: dunning.status,
                        currentLevel: dunning.currentLevel,
                        daysPastDue: dunning.daysPastDue,
                        outstandingAmount: Number(dunning.outstandingAmount),
                        customerType: dunning.customerType,
                    },
                    verificationChecks,
                },
                explanation: generateExplanation(dunning, nextLevel, confidenceScore),
                templateId: template?.id,
                templateVersion: template?.version?.toString(),
                generatedContent: template ? generateContent(template, dunning, interestProposed, feesProposed, totalProposed) : null,
                deadline: proposalDeadline,
                expiresAt,
                proposedAt: now,
                proposedBy: 'SYSTEM',
                organizationId: session.user.organizationId,
            },
        });

        // Update dunning with active proposal
        await (prisma as any).dunning.update({
            where: { id: dunning.id },
            data: {
                hasActiveProposal: true,
                activeProposalId: proposal.id,
                activeProposalLevel: proposalType,
                confidenceScore,
                lastVerificationAt: now,
                verificationStatus: 'verified',
                dataSourcesChecked: Object.keys(verificationChecks),
                eventCount: dunning.eventCount + 1,
            },
        });

        // Create event
        const eventType = nextLevel === DunningLevel.REMINDER
            ? DunningEventType.REMINDER_AUTO_PROPOSED
            : nextLevel === DunningLevel.LEVEL_1
                ? DunningEventType.DUNNING_LEVEL1_AUTO_PROPOSED
                : DunningEventType.DUNNING_LEVEL2_AUTO_PROPOSED;

        const eventId = generateEventId(dunning.dunningId, eventType, now);

        await (prisma as any).dunningEvent.create({
            data: {
                eventId,
                dunningId: dunning.id,
                eventType,
                timestamp: now,
                actorId: 'SYSTEM',
                actorName: 'Automation',
                actorType: 'automation',
                payload: {
                    proposalId: proposal.proposalId,
                    proposalLevel: nextLevel,
                    outstandingAmount: Number(dunning.outstandingAmount),
                    interestProposed,
                    feesProposed,
                    totalProposed,
                    confidenceScore,
                    priority,
                },
                dataSourcesChecked: Object.keys(verificationChecks),
                inputSnapshot: verificationChecks,
                decision: 'proposal_created',
                explanation: generateExplanation(dunning, nextLevel, confidenceScore),
                previousEventId: dunning.lastEventId,
            },
        });

        // Update dunning status
        let newStatus = dunning.status;
        if (nextLevel === DunningLevel.REMINDER) {
            newStatus = DunningStatus.REMINDER_AUTO_PROPOSED;
        } else if (nextLevel === DunningLevel.LEVEL_1) {
            newStatus = DunningStatus.DUNNING_LEVEL1_AUTO_PROPOSED;
        } else if (nextLevel === DunningLevel.LEVEL_2) {
            newStatus = DunningStatus.DUNNING_LEVEL2_AUTO_PROPOSED;
        }

        await (prisma as any).dunning.update({
            where: { id: dunning.id },
            data: {
                status: newStatus,
                previousStatus: dunning.status,
                statusChangedAt: now,
                lastEventId: eventId,
            },
        });

        return NextResponse.json({
            proposal: {
                ...proposal,
                outstandingAmount: Number(proposal.outstandingAmount),
                interestProposed: Number(proposal.interestProposed),
                feesProposed: Number(proposal.feesProposed),
                totalProposed: Number(proposal.totalProposed),
                confidenceScore: Number(proposal.confidenceScore),
            },
            dunning: {
                dunningId: dunning.dunningId,
                dunningNumber: dunning.dunningNumber,
                newStatus,
            },
            verificationChecks,
            message: `${proposalType} proposal created with ${priority} priority. Confidence: ${(confidenceScore * 100).toFixed(0)}%`,
            eventId,
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating proposal:', error);
        return NextResponse.json(
            { error: 'Failed to create proposal' },
            { status: 500 }
        );
    }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function determineNextLevel(dunning: any): number {
    const currentLevel = dunning.currentLevel || 0;
    const daysPastDue = dunning.daysPastDue || 0;

    // If no level yet, determine based on days past due
    if (currentLevel === DunningLevel.NONE) {
        if (daysPastDue >= DEFAULT_LEVEL2_DAYS) return DunningLevel.LEVEL_2;
        if (daysPastDue >= DEFAULT_LEVEL1_DAYS) return DunningLevel.LEVEL_1;
        if (daysPastDue >= DEFAULT_REMINDER_DAYS) return DunningLevel.REMINDER;
        return DunningLevel.REMINDER;
    }

    // Progress to next level
    return currentLevel + 1;
}

async function performVerificationChecks(dunning: any, level: number, now: Date): Promise<any> {
    const checks: any = {
        invoice: { verified: false, errors: [] },
        payment: { verified: false, errors: [] },
        dispute: { verified: false, errors: [] },
        customer: { verified: false, errors: [] },
        contract: { verified: false, errors: [] },
        priorDunning: { verified: false, errors: [] },
    };

    // Invoice verification (TS Section 6.1)
    checks.invoice.verified =
        dunning.invoiceId &&
        Number(dunning.outstandingAmount) > 0 &&
        new Date(dunning.invoiceDueDate) < now;
    checks.invoice.status = dunning.status;
    checks.invoice.outstandingAmount = Number(dunning.outstandingAmount);
    checks.invoice.dueDate = dunning.invoiceDueDate;
    checks.invoice.daysPastDue = dunning.daysPastDue;
    if (!checks.invoice.verified) {
        if (!dunning.invoiceId) checks.invoice.errors.push('Missing invoice ID');
        if (Number(dunning.outstandingAmount) <= 0) checks.invoice.errors.push('No outstanding amount');
        if (new Date(dunning.invoiceDueDate) >= now) checks.invoice.errors.push('Invoice not yet overdue');
    }

    // Payment verification (TS Section 6.2)
    checks.payment.verified = true; // Assume no pending payment unless we find one
    checks.payment.pendingPayments = false;

    // Dispute verification (TS Section 6.3)
    checks.dispute.verified = !dunning.isDisputed;
    checks.dispute.hasActiveDispute = dunning.isDisputed;
    if (dunning.isDisputed) {
        checks.dispute.errors.push('Active dispute exists');
    }

    // Customer verification (TS Section 6.4)
    checks.customer.verified = !dunning.customerDunningBlocked;
    checks.customer.jurisdiction = dunning.customerJurisdiction;
    checks.customer.language = dunning.customerLanguage;
    checks.customer.dunningBlocked = dunning.customerDunningBlocked;
    if (dunning.customerDunningBlocked) {
        checks.customer.errors.push('Customer dunning blocked');
    }

    // Contract verification (TS Section 6.5)
    checks.contract.verified = true;
    checks.contract.paymentTerms = dunning.contractPaymentTerms;
    checks.contract.gracePeriod = dunning.gracePeriodDays;

    // Prior dunning verification (TS Section 6.6)
    const lastSentEvent = await (prisma as any).dunningEvent.findFirst({
        where: {
            dunningId: dunning.id,
            eventType: {
                in: [
                    DunningEventType.REMINDER_SENT,
                    DunningEventType.DUNNING_LEVEL1_SENT,
                    DunningEventType.DUNNING_LEVEL2_SENT,
                ],
            },
        },
        orderBy: { timestamp: 'desc' },
    });

    if (lastSentEvent) {
        const daysSinceLast = Math.floor(
            (now.getTime() - new Date(lastSentEvent.timestamp).getTime()) / (1000 * 60 * 60 * 24)
        );
        checks.priorDunning.verified = daysSinceLast >= DEFAULT_MINIMUM_INTERVAL_DAYS;
        checks.priorDunning.lastLevel = dunning.currentLevel;
        checks.priorDunning.lastSentAt = lastSentEvent.timestamp;
        checks.priorDunning.daysSinceLast = daysSinceLast;
        checks.priorDunning.minimumIntervalMet = checks.priorDunning.verified;
        if (!checks.priorDunning.verified) {
            checks.priorDunning.errors.push(`Minimum interval not met (${daysSinceLast}/${DEFAULT_MINIMUM_INTERVAL_DAYS} days)`);
        }
    } else {
        // No prior dunning sent
        checks.priorDunning.verified = true;
        checks.priorDunning.lastLevel = 0;
        checks.priorDunning.minimumIntervalMet = true;
    }

    // Additional check for level progression
    if (level > DunningLevel.REMINDER && dunning.currentLevel < level - 1) {
        // Can't skip levels
        checks.priorDunning.verified = false;
        checks.priorDunning.errors.push(`Cannot skip to level ${level} from level ${dunning.currentLevel}`);
    }

    return checks;
}

function getStatutoryInterestRate(config: any, customerType: string): number {
    if (!config) return 0.09; // Default 9% (EU B2B)

    if (customerType === 'consumer') {
        return config.statutoryInterestRateB2C ? Number(config.statutoryInterestRateB2C) : 0.05;
    }
    return config.statutoryInterestRateB2B ? Number(config.statutoryInterestRateB2B) : 0.09;
}

function getFlatFee(config: any, customerType: string): number {
    if (!config) return 40; // Default €40 (EU B2B)

    if (customerType === 'consumer') {
        return config.flatFeeAllowedB2C && config.flatFeeAmountB2C
            ? Number(config.flatFeeAmountB2C)
            : 0;
    }
    return config.flatFeeAllowedB2B && config.flatFeeAmountB2B
        ? Number(config.flatFeeAmountB2B)
        : 40;
}

function getDeadlineDays(level: number): number {
    switch (level) {
        case DunningLevel.REMINDER: return 7;
        case DunningLevel.LEVEL_1: return 14;
        case DunningLevel.LEVEL_2: return 14;
        default: return 14;
    }
}

async function getTemplate(
    orgId: string,
    level: number,
    jurisdictionId: string | null,
    language: string,
    customerType: string | null,
    templateId?: string
): Promise<any> {
    const where: any = {
        organizationId: orgId,
        dunningLevel: level,
        isActive: true,
    };

    if (templateId) {
        where.id = templateId;
    } else {
        // Try to find most specific template
        where.language = language;
        if (jurisdictionId) where.jurisdictionId = jurisdictionId;
        if (customerType) where.customerType = customerType;
    }

    let template = await (prisma as any).dunningTemplate.findFirst({
        where,
        orderBy: { version: 'desc' },
    });

    // Fallback to less specific
    if (!template && jurisdictionId) {
        delete where.jurisdictionId;
        template = await (prisma as any).dunningTemplate.findFirst({
            where,
            orderBy: { version: 'desc' },
        });
    }

    if (!template && customerType) {
        delete where.customerType;
        template = await (prisma as any).dunningTemplate.findFirst({
            where,
            orderBy: { version: 'desc' },
        });
    }

    return template;
}

function generateContent(template: any, dunning: any, interest: number, fees: number, total: number): any {
    // Replace template variables
    let subject = template.subject || '';
    let bodyHtml = template.bodyHtml || '';
    let bodyText = template.bodyText || '';

    const replacements: Record<string, string> = {
        '{{customer_name}}': dunning.customerName || '',
        '{{invoice_number}}': dunning.invoiceId || '',
        '{{invoice_due_date}}': formatDate(dunning.invoiceDueDate),
        '{{original_amount}}': formatCurrency(dunning.originalAmount, dunning.currency),
        '{{outstanding_amount}}': formatCurrency(dunning.outstandingAmount, dunning.currency),
        '{{interest_amount}}': formatCurrency(interest, dunning.currency),
        '{{fees_amount}}': formatCurrency(fees, dunning.currency),
        '{{total_due}}': formatCurrency(total, dunning.currency),
        '{{currency}}': dunning.currency,
        '{{dunning_number}}': dunning.dunningNumber,
        '{{days_past_due}}': String(dunning.daysPastDue),
        '{{current_date}}': formatDate(new Date()),
    };

    for (const [key, value] of Object.entries(replacements)) {
        subject = subject.replace(new RegExp(key, 'g'), value);
        bodyHtml = bodyHtml.replace(new RegExp(key, 'g'), value);
        bodyText = bodyText.replace(new RegExp(key, 'g'), value);
    }

    return { subject, bodyHtml, bodyText };
}

function generateExplanation(dunning: any, level: number, confidence: number): string {
    const levelNames = ['none', 'reminder', 'level 1 dunning', 'level 2 dunning', 'level 3 dunning'];
    return `Auto-proposed ${levelNames[level]} for ${dunning.dunningNumber}. ` +
        `Customer: ${dunning.customerName}. ` +
        `Outstanding: ${dunning.currency} ${Number(dunning.outstandingAmount).toLocaleString()}. ` +
        `Days past due: ${dunning.daysPastDue}. ` +
        `Confidence: ${(confidence * 100).toFixed(0)}%.`;
}

function formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('de-DE');
}

function formatCurrency(amount: number | any, currency: string): string {
    const num = typeof amount === 'object' ? Number(amount) : amount;
    return `${currency} ${num.toLocaleString('de-DE', { minimumFractionDigits: 2 })}`;
}