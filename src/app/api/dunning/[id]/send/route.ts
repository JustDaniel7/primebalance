// =============================================================================
// DUNNING API - Send Communication (TS Section 12)
// Human-in-the-loop: All sends require user action (TS Section 24.8)
// src/app/api/dunning/[id]/send/route.ts
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
    CommunicationChannel,
    CommunicationStatus,
    generateEventId,
} from '@/types/dunning';

// =============================================================================
// POST - Send Dunning Communication (TS Section 12)
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
            channel = CommunicationChannel.EMAIL,
            recipientEmail,
            recipientAddress,
            templateId,
            customSubject,
            customBody,
            scheduledAt,
            paymentDeadline,
            paymentInstructions,
        } = body;

        // Find dunning with proposal
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

        // Find approved proposal
        const proposal = await (prisma as any).dunningProposal.findFirst({
            where: {
                dunningId: dunning.id,
                status: ProposalStatus.APPROVED,
            },
            orderBy: { approvedAt: 'desc' },
        });

        if (!proposal) {
            return NextResponse.json(
                {
                    error: 'No approved proposal found. Approve a proposal before sending.',
                    code: 'NO_APPROVED_PROPOSAL',
                },
                { status: 400 }
            );
        }

        // For Level 3, verify multi-signature approval
        if (proposal.proposalLevel >= DunningLevel.LEVEL_3) {
            const approvers = dunning.dunningLevel3ApprovedBy || [];
            const approvalRule = await (prisma as any).dunningAutomationRule.findFirst({
                where: {
                    organizationId: session.user.organizationId,
                    dunningLevels: { has: DunningLevel.LEVEL_3 },
                    isActive: true,
                },
            });
            const requiredApprovals = approvalRule?.multiSignatureCount || 2;

            if (approvers.length < requiredApprovals) {
                return NextResponse.json(
                    {
                        error: `Level 3 requires ${requiredApprovals} approvals. Current: ${approvers.length}`,
                        code: 'INSUFFICIENT_APPROVALS',
                        required: requiredApprovals,
                        current: approvers.length,
                    },
                    { status: 400 }
                );
            }
        }

        // Validate channel-specific requirements
        if (channel === CommunicationChannel.EMAIL && !recipientEmail && !dunning.customerEmail) {
            return NextResponse.json(
                { error: 'Recipient email is required for email channel' },
                { status: 400 }
            );
        }

        if (channel === CommunicationChannel.POSTAL && !recipientAddress) {
            return NextResponse.json(
                { error: 'Recipient address is required for postal channel' },
                { status: 400 }
            );
        }

        const now = new Date();

        // Get template
        let template = null;
        if (templateId) {
            template = await (prisma as any).dunningTemplate.findFirst({
                where: {
                    organizationId: session.user.organizationId,
                    id: templateId,
                    isActive: true,
                },
            });
        } else if (proposal.templateId) {
            template = await (prisma as any).dunningTemplate.findFirst({
                where: { id: proposal.templateId },
            });
        } else {
            // Get default template
            template = await (prisma as any).dunningTemplate.findFirst({
                where: {
                    organizationId: session.user.organizationId,
                    dunningLevel: proposal.proposalLevel,
                    language: dunning.customerLanguage || 'en',
                    templateType: channel,
                    isActive: true,
                },
                orderBy: { version: 'desc' },
            });
        }

        // Generate content
        const content = generateCommunicationContent(
            template,
            dunning,
            proposal,
            customSubject,
            customBody
        );

        // Calculate amounts
        const outstandingAmount = Number(dunning.outstandingAmount);
        const interestAmount = Number(proposal.interestProposed);
        const feesAmount = Number(proposal.feesProposed);
        const totalDue = Number(proposal.totalProposed);

        // Create communication record
        const communicationId = `COM-${dunning.dunningId}-L${proposal.proposalLevel}-${now.getTime()}`;

        const communication = await (prisma as any).dunningCommunication.create({
            data: {
                communicationId,
                dunningId: dunning.id,
                proposalId: proposal.id,
                communicationType: getLevelName(proposal.proposalLevel),
                level: proposal.proposalLevel,
                channel,
                status: scheduledAt ? CommunicationStatus.PENDING : CommunicationStatus.SENT,
                recipientName: dunning.customerName,
                recipientEmail: recipientEmail || dunning.customerEmail,
                recipientAddress,
                recipientLanguage: dunning.customerLanguage || 'en',
                templateId: template?.id,
                templateVersion: template?.version?.toString(),
                subject: content.subject,
                bodyHtml: content.bodyHtml,
                bodyText: content.bodyText,
                outstandingAmount,
                interestAmount,
                feesAmount,
                totalDue,
                currency: dunning.currency,
                paymentDeadline: paymentDeadline ? new Date(paymentDeadline) : proposal.deadline,
                paymentInstructions,
                scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
                sentAt: scheduledAt ? null : now,
                sentBy: scheduledAt ? null : session.user.id,
                createdAt: now,
                createdBy: session.user.id,
                organizationId: session.user.organizationId,
            },
        });

        // Update proposal status
        await (prisma as any).dunningProposal.update({
            where: { id: proposal.id },
            data: {
                status: ProposalStatus.SENT,
                sentAt: now,
                sentBy: session.user.id,
            },
        });

        // Determine new status and event type
        let newStatus: DunningStatus;
        let eventType: DunningEventType;
        const updateData: any = {
            currentLevel: proposal.proposalLevel,
            hasActiveProposal: false,
            activeProposalId: null,
            activeProposalLevel: null,
            lastCommunicationAt: now,
            lastCommunicationType: channel,
            communicationCount: dunning.communicationCount + 1,
            eventCount: dunning.eventCount + 1,
        };

        switch (proposal.proposalLevel) {
            case DunningLevel.REMINDER:
                newStatus = DunningStatus.REMINDER_SENT;
                eventType = DunningEventType.REMINDER_SENT;
                updateData.reminderSentAt = now;
                break;
            case DunningLevel.LEVEL_1:
                newStatus = DunningStatus.DUNNING_LEVEL1_SENT;
                eventType = DunningEventType.DUNNING_LEVEL1_SENT;
                updateData.dunningLevel1SentAt = now;
                break;
            case DunningLevel.LEVEL_2:
                newStatus = DunningStatus.DUNNING_LEVEL2_SENT;
                eventType = DunningEventType.DUNNING_LEVEL2_SENT;
                updateData.dunningLevel2SentAt = now;
                break;
            case DunningLevel.LEVEL_3:
                newStatus = DunningStatus.DUNNING_LEVEL3_SENT;
                eventType = DunningEventType.DUNNING_LEVEL3_SENT;
                updateData.dunningLevel3SentAt = now;
                break;
            default:
                newStatus = DunningStatus.REMINDER_SENT;
                eventType = DunningEventType.REMINDER_SENT;
        }

        updateData.status = newStatus;
        updateData.previousStatus = dunning.status;
        updateData.statusChangedAt = now;

        // Update dunning
        await (prisma as any).dunning.update({
            where: { id: dunning.id },
            data: updateData,
        });

        // Create event
        const eventId = generateEventId(dunning.dunningId, eventType, now);

        await (prisma as any).dunningEvent.create({
            data: {
                eventId,
                dunningId: dunning.id,
                eventType,
                timestamp: now,
                actorId: session.user.id,
                actorName: session.user.name || session.user.email,
                actorType: 'user',
                payload: {
                    communicationId,
                    proposalId: proposal.proposalId,
                    level: proposal.proposalLevel,
                    channel,
                    recipientEmail: recipientEmail || dunning.customerEmail,
                    outstandingAmount,
                    interestAmount,
                    feesAmount,
                    totalDue,
                    currency: dunning.currency,
                },
                explanation: `${getLevelName(proposal.proposalLevel)} sent via ${channel} to ${dunning.customerName}. ` +
                    `Total due: ${dunning.currency} ${totalDue.toLocaleString()}`,
                previousEventId: dunning.lastEventId,
            },
        });

        // Update last event ID
        await (prisma as any).dunning.update({
            where: { id: dunning.id },
            data: { lastEventId: eventId },
        });

        // Simulate sending (in production, integrate with email/postal service)
        if (!scheduledAt) {
            await simulateSend(communication, channel);
        }

        return NextResponse.json({
            communication: {
                ...communication,
                outstandingAmount: Number(communication.outstandingAmount),
                interestAmount: Number(communication.interestAmount),
                feesAmount: Number(communication.feesAmount),
                totalDue: Number(communication.totalDue),
            },
            dunning: {
                dunningId: dunning.dunningId,
                dunningNumber: dunning.dunningNumber,
                newStatus,
                currentLevel: proposal.proposalLevel,
            },
            message: scheduledAt
                ? `Communication scheduled for ${new Date(scheduledAt).toLocaleString()}`
                : `${getLevelName(proposal.proposalLevel)} sent successfully via ${channel}`,
            eventId,
        });
    } catch (error) {
        console.error('Error sending dunning:', error);
        return NextResponse.json(
            { error: 'Failed to send dunning communication' },
            { status: 500 }
        );
    }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getLevelName(level: number): string {
    switch (level) {
        case DunningLevel.REMINDER: return 'Payment Reminder';
        case DunningLevel.LEVEL_1: return 'Dunning Level 1';
        case DunningLevel.LEVEL_2: return 'Dunning Level 2';
        case DunningLevel.LEVEL_3: return 'Dunning Level 3 (Final Notice)';
        default: return 'Dunning Notice';
    }
}

function generateCommunicationContent(
    template: any,
    dunning: any,
    proposal: any,
    customSubject?: string,
    customBody?: string
): { subject: string; bodyHtml: string; bodyText: string } {
    // Use custom content if provided
    if (customSubject && customBody) {
        return {
            subject: customSubject,
            bodyHtml: customBody,
            bodyText: stripHtml(customBody),
        };
    }

    // Use generated content from proposal
    if (proposal.generatedContent) {
        return {
            subject: proposal.generatedContent.subject || `Payment Due: ${dunning.invoiceId}`,
            bodyHtml: proposal.generatedContent.bodyHtml || '',
            bodyText: proposal.generatedContent.bodyText || '',
        };
    }

    // Use template
    if (template) {
        let subject = template.subject || '';
        let bodyHtml = template.bodyHtml || '';
        let bodyText = template.bodyText || '';

        // Replace variables
        const replacements = getTemplateReplacements(dunning, proposal);
        for (const [key, value] of Object.entries(replacements)) {
            const regex = new RegExp(key.replace(/[{}]/g, '\\$&'), 'g');
            subject = subject.replace(regex, value as string);
            bodyHtml = bodyHtml.replace(regex, value as string);
            bodyText = bodyText.replace(regex, value as string);
        }

        return { subject, bodyHtml, bodyText };
    }

    // Default content
    return {
        subject: `Payment Reminder: Invoice ${dunning.invoiceId}`,
        bodyHtml: generateDefaultHtml(dunning, proposal),
        bodyText: generateDefaultText(dunning, proposal),
    };
}

function getTemplateReplacements(dunning: any, proposal: any): Record<string, string> {
    return {
        '{{customer_name}}': dunning.customerName || '',
        '{{invoice_number}}': dunning.invoiceId || '',
        '{{invoice_due_date}}': formatDate(dunning.invoiceDueDate),
        '{{original_amount}}': formatCurrency(dunning.originalAmount, dunning.currency),
        '{{outstanding_amount}}': formatCurrency(dunning.outstandingAmount, dunning.currency),
        '{{interest_amount}}': formatCurrency(proposal.interestProposed, dunning.currency),
        '{{fees_amount}}': formatCurrency(proposal.feesProposed, dunning.currency),
        '{{total_due}}': formatCurrency(proposal.totalProposed, dunning.currency),
        '{{currency}}': dunning.currency,
        '{{dunning_number}}': dunning.dunningNumber,
        '{{dunning_level}}': getLevelName(proposal.proposalLevel),
        '{{days_past_due}}': String(dunning.daysPastDue),
        '{{current_date}}': formatDate(new Date()),
        '{{payment_deadline}}': formatDate(proposal.deadline),
    };
}

function generateDefaultHtml(dunning: any, proposal: any): string {
    return `
    <html>
    <body>
      <h2>${getLevelName(proposal.proposalLevel)}</h2>
      <p>Dear ${dunning.customerName},</p>
      <p>This is a reminder that the following payment is overdue:</p>
      <table>
        <tr><td>Invoice:</td><td>${dunning.invoiceId}</td></tr>
        <tr><td>Due Date:</td><td>${formatDate(dunning.invoiceDueDate)}</td></tr>
        <tr><td>Outstanding:</td><td>${formatCurrency(dunning.outstandingAmount, dunning.currency)}</td></tr>
        <tr><td>Interest:</td><td>${formatCurrency(proposal.interestProposed, dunning.currency)}</td></tr>
        <tr><td>Fees:</td><td>${formatCurrency(proposal.feesProposed, dunning.currency)}</td></tr>
        <tr><td><strong>Total Due:</strong></td><td><strong>${formatCurrency(proposal.totalProposed, dunning.currency)}</strong></td></tr>
      </table>
      <p>Please arrange payment by ${formatDate(proposal.deadline)}.</p>
    </body>
    </html>
  `;
}

function generateDefaultText(dunning: any, proposal: any): string {
    return `
${getLevelName(proposal.proposalLevel)}

Dear ${dunning.customerName},

This is a reminder that the following payment is overdue:

Invoice: ${dunning.invoiceId}
Due Date: ${formatDate(dunning.invoiceDueDate)}
Outstanding: ${formatCurrency(dunning.outstandingAmount, dunning.currency)}
Interest: ${formatCurrency(proposal.interestProposed, dunning.currency)}
Fees: ${formatCurrency(proposal.feesProposed, dunning.currency)}
Total Due: ${formatCurrency(proposal.totalProposed, dunning.currency)}

Please arrange payment by ${formatDate(proposal.deadline)}.
  `.trim();
}

function formatDate(date: Date | string | null): string {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('de-DE');
}

function formatCurrency(amount: number | any, currency: string): string {
    const num = typeof amount === 'object' ? Number(amount) : Number(amount);
    return `${currency} ${num.toLocaleString('de-DE', { minimumFractionDigits: 2 })}`;
}

function stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

async function simulateSend(communication: any, channel: string): Promise<void> {
    // In production, integrate with:
    // - Email: SendGrid, AWS SES, etc.
    // - PDF: Generate and store
    // - Postal: Letter service API

    // Update communication status
    await (prisma as any).dunningCommunication.update({
        where: { id: communication.id },
        data: {
            status: CommunicationStatus.DELIVERED,
            deliveredAt: new Date(),
            externalMessageId: `sim_${Date.now()}`,
        },
    });
}