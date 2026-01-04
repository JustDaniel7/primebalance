import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notifyDunningSent } from '@/lib/notifications';

// Configure your email provider here
// Option 1: Resend
// import { Resend } from 'resend';
// const resend = new Resend(process.env.RESEND_API_KEY);

// Option 2: SendGrid
// import sgMail from '@sendgrid/mail';
// sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

// Option 3: Nodemailer with SMTP
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

interface SendEmailRequest {
    to: string;
    subject: string;
    body: string;
    dunningId: string;
    dunningNumber: string;
    level: number;
    customerName: string;
    invoiceId: string;
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const data: SendEmailRequest = await request.json();
        const { to, subject, body, dunningId, dunningNumber, level, customerName, invoiceId } = data;

        // Validate email
        if (!to || !to.includes('@')) {
            return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
        }

        // Get company info for "from" address
        const companyEmail = process.env.COMPANY_EMAIL || 'buchhaltung@primebalance.de';
        const companyName = process.env.COMPANY_NAME || 'PrimeBalance GmbH';

        // Send email via Nodemailer
        const info = await transporter.sendMail({
            from: `"${companyName}" <${companyEmail}>`,
            to: to,
            subject: subject,
            text: body,
            html: body.replace(/\n/g, '<br>'),
            headers: {
                'X-Dunning-ID': dunningId,
                'X-Dunning-Level': String(level),
            },
        });

        // Log to database
        const emailLog = await prisma.dunningCommunication.create({
            data: {
                communicationId: `COMM-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
                dunningId,
                level,
                communicationType: 'email',
                channel: 'email',
                recipientName: customerName,
                recipientEmail: to,
                templateId: 'manual-email',
                subject,
                bodyHtml: body.replace(/\n/g, '<br>'),
                bodyText: body,
                outstandingAmount: 0,
                totalDue: 0,
                currency: 'EUR',
                status: 'sent',
                externalMessageId: info.messageId,
                sentAt: new Date(),
                sentBy: session.user.id,
                organizationId: session.user.organizationId || 'default',
            },
        });

        // Update dunning record
        await prisma.dunning.update({
            where: { id: dunningId },
            data: {
                currentLevel: level,
                status: getLevelStatus(level),
                lastCommunicationAt: new Date(),
                updatedAt: new Date(),
            },
        });

        // Create audit event
        await prisma.dunningEvent.create({
            data: {
                eventId: `EVT-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
                dunningId,
                eventType: 'COMMUNICATION_SENT',
                actorId: session.user.id,
                actorName: session.user.name || session.user.email,
                actorType: 'user',
                payload: {
                    level,
                    recipient: to,
                    subject,
                    message_id: info.messageId,
                    invoice_id: invoiceId,
                },
            },
        });

        // Notify admins about the dunning email
        const dunning = await prisma.dunning.findUnique({
            where: { id: dunningId },
            select: { outstandingAmount: true, currency: true },
        });

        await notifyDunningSent({
            dunningId,
            dunningNumber,
            customerName,
            amount: Number(dunning?.outstandingAmount) || 0,
            currency: dunning?.currency || 'EUR',
            level,
            organizationId: session.user.organizationId || 'default',
            actorId: session.user.id,
            actorName: session.user.name || session.user.email || undefined,
        });

        return NextResponse.json({
            success: true,
            messageId: info.messageId,
            emailLogId: emailLog.id,
            sentTo: to,
            sentAt: emailLog.sentAt,
        });

    } catch (error) {
        console.error('Email send error:', error);

        // Log failed attempt
        try {
            const data = await request.clone().json();
            await prisma.dunningCommunication.create({
                data: {
                    communicationId: `COMM-FAIL-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
                    dunningId: data.dunningId,
                    level: data.level,
                    communicationType: 'email',
                    channel: 'email',
                    recipientName: data.customerName || 'Unknown',
                    recipientEmail: data.to,
                    templateId: 'manual-email',
                    subject: data.subject,
                    bodyText: data.body,
                    outstandingAmount: 0,
                    totalDue: 0,
                    currency: 'EUR',
                    status: 'failed',
                    failureReason: error instanceof Error ? error.message : 'Unknown error',
                    failedAt: new Date(),
                    organizationId: 'default',
                },
            });
        } catch (logError) {
            console.error('Failed to log email error:', logError);
        }

        return NextResponse.json(
            { error: 'Failed to send email', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

function getLevelStatus(level: number): string {
    switch (level) {
        case 1: return 'REMINDER_SENT';
        case 2: return 'DUNNING_LEVEL1_SENT';
        case 3: return 'DUNNING_LEVEL2_SENT';
        case 4: return 'DUNNING_LEVEL3_SENT';
        default: return 'OVERDUE';
    }
}