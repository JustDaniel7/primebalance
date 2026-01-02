// =============================================================================
// DUNNING API - Get, Update (TS Sections 3, 4, 19)
// src/app/api/dunning/[id]/route.ts
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
    DunningStatus,
    DunningEventType,
    generateEventId,
    calculateDaysPastDue,
    calculateTotalDue,
} from '@/types/dunning';

// =============================================================================
// GET - Retrieve Single Dunning (+ Time-Travel) (TS Sections 4.2, 19.1)
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
        const { searchParams } = new URL(request.url);

        // Time-travel parameter (TS Section 4.2)
        const asOf = searchParams.get('as_of');

        // Include options
        const includeEvents = searchParams.get('includeEvents') === 'true';
        const includeProposals = searchParams.get('includeProposals') === 'true';
        const includeCommunications = searchParams.get('includeCommunications') === 'true';
        const includeInterest = searchParams.get('includeInterest') === 'true';
        const includeFees = searchParams.get('includeFees') === 'true';
        const includeDisputes = searchParams.get('includeDisputes') === 'true';

        // Find dunning
        const dunning = await (prisma as any).dunning.findFirst({
            where: {
                organizationId: session.user.organizationId,
                OR: [
                    { id },
                    { dunningId: id },
                    { dunningNumber: id },
                ],
            },
            include: {
                events: includeEvents ? { orderBy: { timestamp: 'desc' } } : false,
                proposals: includeProposals ? { orderBy: { proposedAt: 'desc' } } : false,
                communications: includeCommunications ? { orderBy: { createdAt: 'desc' } } : false,
                interestAccruals: includeInterest ? { orderBy: { periodEnd: 'desc' } } : false,
                fees: includeFees ? { orderBy: { createdAt: 'desc' } } : false,
                disputes: includeDisputes ? { orderBy: { openedAt: 'desc' } } : false,
            },
        });

        if (!dunning) {
            return NextResponse.json({ error: 'Dunning record not found' }, { status: 404 });
        }

        // Time-Travel Reconstruction (TS Section 4.2)
        if (asOf) {
            const asOfDate = new Date(asOf);

            // Get all events up to the as_of date
            const eventsUpToDate = await (prisma as any).dunningEvent.findMany({
                where: {
                    dunningId: dunning.id,
                    timestamp: { lte: asOfDate },
                },
                orderBy: { timestamp: 'asc' },
            });

            // Find the creation event to get initial state
            const creationEvent = eventsUpToDate.find(
                (e: any) => e.eventType === DunningEventType.DUNNING_CREATED
            );

            if (!creationEvent) {
                return NextResponse.json(
                    { error: 'Cannot reconstruct state - creation event not found' },
                    { status: 400 }
                );
            }

            // Start with creation state
            let reconstructedState = { ...creationEvent.payload };

            // Apply subsequent events
            for (const event of eventsUpToDate) {
                if (event.eventType === DunningEventType.DUNNING_CREATED) continue;

                // Skip reversed events
                if (event.isReversed) continue;

                // Apply event payload to state
                if (event.payload) {
                    reconstructedState = {
                        ...reconstructedState,
                        ...event.payload,
                    };
                }

                // Handle reversal events - restore previous state
                if (event.eventType === DunningEventType.DUNNING_REVERSED && event.previousState) {
                    reconstructedState = {
                        ...reconstructedState,
                        ...event.previousState,
                    };
                }
            }

            return NextResponse.json({
                dunning: reconstructedState,
                isTimeTravel: true,
                asOfDate: asOfDate.toISOString(),
                eventsApplied: eventsUpToDate.length,
                reconstructedFrom: eventsUpToDate.map((e: any) => e.eventId),
                currentState: formatDunning(dunning),
            });
        }

        // Format and return current state
        const response: any = {
            dunning: formatDunning(dunning),
        };

        if (includeEvents && dunning.events) {
            response.events = dunning.events;
        }
        if (includeProposals && dunning.proposals) {
            response.proposals = dunning.proposals.map(formatProposal);
        }
        if (includeCommunications && dunning.communications) {
            response.communications = dunning.communications.map(formatCommunication);
        }
        if (includeInterest && dunning.interestAccruals) {
            response.interestAccruals = dunning.interestAccruals.map(formatInterestAccrual);
        }
        if (includeFees && dunning.fees) {
            response.fees = dunning.fees.map(formatFee);
        }
        if (includeDisputes && dunning.disputes) {
            response.disputes = dunning.disputes;
        }

        return NextResponse.json(response);
    } catch (error) {
        console.error('Error fetching dunning record:', error);
        return NextResponse.json(
            { error: 'Failed to fetch dunning record' },
            { status: 500 }
        );
    }
}

// =============================================================================
// PATCH - Update Dunning Record (Limited fields, not status)
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

        // Find dunning
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

        // Cannot update settled or written-off
        if ([DunningStatus.SETTLED, DunningStatus.WRITTEN_OFF].includes(dunning.status)) {
            return NextResponse.json(
                {
                    error: `Cannot update dunning in status '${dunning.status}'`,
                    code: 'DUNNING_IMMUTABLE',
                },
                { status: 400 }
            );
        }

        const now = new Date();

        // Allowed update fields (status changes require specific endpoints)
        const {
            customerName,
            customerType,
            customerJurisdiction,
            customerLanguage,
            customerPaymentHistory,
            customerRiskScore,
            contractId,
            contractPaymentTerms,
            contractCustomDunningRules,
            gracePeriodDays,
            metadata,
            tags,
            validationMode,
            notes,
        } = body;

        // Build update data
        const updateData: any = {
            version: dunning.version + 1,
            eventCount: dunning.eventCount + 1,
        };

        const changes: any = {};

        if (customerName !== undefined) {
            updateData.customerName = customerName;
            changes.customerName = { from: dunning.customerName, to: customerName };
        }
        if (customerType !== undefined) {
            updateData.customerType = customerType;
            changes.customerType = { from: dunning.customerType, to: customerType };
        }
        if (customerJurisdiction !== undefined) {
            updateData.customerJurisdiction = customerJurisdiction;
            changes.customerJurisdiction = { from: dunning.customerJurisdiction, to: customerJurisdiction };
        }
        if (customerLanguage !== undefined) {
            updateData.customerLanguage = customerLanguage;
            changes.customerLanguage = { from: dunning.customerLanguage, to: customerLanguage };
        }
        if (customerPaymentHistory !== undefined) {
            updateData.customerPaymentHistory = customerPaymentHistory;
            changes.customerPaymentHistory = { from: dunning.customerPaymentHistory, to: customerPaymentHistory };
        }
        if (customerRiskScore !== undefined) {
            updateData.customerRiskScore = customerRiskScore;
            changes.customerRiskScore = { from: dunning.customerRiskScore, to: customerRiskScore };
        }
        if (contractId !== undefined) {
            updateData.contractId = contractId;
            changes.contractId = { from: dunning.contractId, to: contractId };
        }
        if (contractPaymentTerms !== undefined) {
            updateData.contractPaymentTerms = contractPaymentTerms;
            changes.contractPaymentTerms = { from: dunning.contractPaymentTerms, to: contractPaymentTerms };
        }
        if (contractCustomDunningRules !== undefined) {
            updateData.contractCustomDunningRules = contractCustomDunningRules;
            changes.contractCustomDunningRules = true;
        }
        if (gracePeriodDays !== undefined) {
            updateData.gracePeriodDays = gracePeriodDays;
            changes.gracePeriodDays = { from: dunning.gracePeriodDays, to: gracePeriodDays };

            // Recalculate effective due date and days past due
            const effectiveDueDate = new Date(dunning.invoiceDueDate);
            effectiveDueDate.setDate(effectiveDueDate.getDate() + gracePeriodDays);
            updateData.effectiveDueDate = effectiveDueDate;
            updateData.daysPastDue = calculateDaysPastDue(new Date(dunning.invoiceDueDate), now, gracePeriodDays);
        }
        if (metadata !== undefined) {
            updateData.metadata = metadata;
            changes.metadata = true;
        }
        if (tags !== undefined) {
            updateData.tags = tags;
            changes.tags = { from: dunning.tags, to: tags };
        }
        if (validationMode !== undefined) {
            updateData.validationMode = validationMode;
            changes.validationMode = { from: dunning.validationMode, to: validationMode };
        }

        // No changes
        if (Object.keys(changes).length === 0) {
            return NextResponse.json({
                dunning: formatDunning(dunning),
                message: 'No changes applied',
            });
        }

        // Update dunning
        const updated = await (prisma as any).dunning.update({
            where: { id: dunning.id },
            data: updateData,
        });

        // Create amendment event
        const eventId = generateEventId(dunning.dunningId, DunningEventType.DUNNING_AMENDED, now);

        await (prisma as any).dunningEvent.create({
            data: {
                eventId,
                dunningId: dunning.id,
                eventType: DunningEventType.DUNNING_AMENDED,
                timestamp: now,
                actorId: session.user.id,
                actorName: session.user.name || session.user.email,
                actorType: 'user',
                payload: changes,
                previousState: {
                    customerName: dunning.customerName,
                    customerType: dunning.customerType,
                    customerJurisdiction: dunning.customerJurisdiction,
                    customerLanguage: dunning.customerLanguage,
                    gracePeriodDays: dunning.gracePeriodDays,
                    tags: dunning.tags,
                },
                previousEventId: dunning.lastEventId,
                explanation: `Dunning record ${dunning.dunningNumber} amended. Changes: ${Object.keys(changes).join(', ')}`,
            },
        });

        // Update last event ID
        await (prisma as any).dunning.update({
            where: { id: dunning.id },
            data: { lastEventId: eventId },
        });

        return NextResponse.json({
            dunning: formatDunning(updated),
            message: `Dunning record ${dunning.dunningNumber} updated`,
            changes,
            eventId,
        });
    } catch (error) {
        console.error('Error updating dunning record:', error);
        return NextResponse.json(
            { error: 'Failed to update dunning record' },
            { status: 500 }
        );
    }
}

// =============================================================================
// DELETE - Not Allowed (Immutability - TS Section 24)
// =============================================================================

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    return NextResponse.json(
        {
            error: 'Deletion not allowed. Dunning records are immutable. Use settlement or write-off operations.',
            code: 'DUNNING_DELETION_NOT_ALLOWED',
        },
        { status: 405 }
    );
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function formatDunning(d: any) {
    return {
        ...d,
        originalAmount: Number(d.originalAmount),
        outstandingAmount: Number(d.outstandingAmount),
        interestAccrued: Number(d.interestAccrued),
        feesAccrued: Number(d.feesAccrued),
        totalDue: Number(d.totalDue),
        fxRateAtCreation: d.fxRateAtCreation ? Number(d.fxRateAtCreation) : null,
        amountInReporting: d.amountInReporting ? Number(d.amountInReporting) : null,
        interestRateApplied: d.interestRateApplied ? Number(d.interestRateApplied) : null,
        flatFeeApplied: d.flatFeeApplied ? Number(d.flatFeeApplied) : null,
        customFeesApplied: d.customFeesApplied ? Number(d.customFeesApplied) : null,
        confidenceScore: Number(d.confidenceScore),
        customerRiskScore: d.customerRiskScore ? Number(d.customerRiskScore) : null,
        settledAmount: d.settledAmount ? Number(d.settledAmount) : null,
        writtenOffAmount: d.writtenOffAmount ? Number(d.writtenOffAmount) : null,
        disputeAmount: d.disputeAmount ? Number(d.disputeAmount) : null,
    };
}

function formatProposal(p: any) {
    return {
        ...p,
        outstandingAmount: Number(p.outstandingAmount),
        interestProposed: Number(p.interestProposed),
        feesProposed: Number(p.feesProposed),
        totalProposed: Number(p.totalProposed),
        confidenceScore: Number(p.confidenceScore),
    };
}

function formatCommunication(c: any) {
    return {
        ...c,
        outstandingAmount: Number(c.outstandingAmount),
        interestAmount: Number(c.interestAmount),
        feesAmount: Number(c.feesAmount),
        totalDue: Number(c.totalDue),
    };
}

function formatInterestAccrual(i: any) {
    return {
        ...i,
        principalBase: Number(i.principalBase),
        interestRate: Number(i.interestRate),
        amount: Number(i.amount),
        amountInReporting: i.amountInReporting ? Number(i.amountInReporting) : null,
        fxRate: i.fxRate ? Number(i.fxRate) : null,
        statutoryRate: i.statutoryRate ? Number(i.statutoryRate) : null,
    };
}

function formatFee(f: any) {
    return {
        ...f,
        amount: Number(f.amount),
        amountInReporting: f.amountInReporting ? Number(f.amountInReporting) : null,
        fxRate: f.fxRate ? Number(f.fxRate) : null,
        baseAmount: f.baseAmount ? Number(f.baseAmount) : null,
        percentage: f.percentage ? Number(f.percentage) : null,
        jurisdictionLimit: f.jurisdictionLimit ? Number(f.jurisdictionLimit) : null,
    };
}