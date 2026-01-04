// src/app/api/receivables/[id]/send-reminder/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, notFound, badRequest } from '@/lib/api-utils';
import nodemailer from 'nodemailer';

type Params = { params: Promise<{ id: string }> };

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function POST(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { id } = await params;

  // Fetch receivable with debtor info
  const receivable = await prisma.receivable.findFirst({
    where: { id, organizationId: user.organizationId },
  });

  if (!receivable) return notFound('Receivable');

  // Check if receivable has debtor email
  const debtorEmail = receivable.debtorEmail as string | null;
  const debtorName = receivable.debtorName as string | null;

  if (!debtorEmail) {
    return badRequest('Cannot send reminder: debtor email is not set');
  }

  // Get company info
  const companyEmail = process.env.COMPANY_EMAIL || 'buchhaltung@primebalance.de';
  const companyName = process.env.COMPANY_NAME || 'PrimeBalance GmbH';

  // Format currency
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency }).format(amount);
  };

  // Calculate days overdue
  const dueDate = new Date(receivable.dueDate);
  const today = new Date();
  const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

  // Build email content
  const reference = receivable.originReferenceId || receivable.id;
  const emailSubject = `Payment Reminder: ${reference}`;
  const emailBody = `
Dear ${debtorName || 'Customer'},

This is a friendly reminder regarding the following outstanding payment:

Invoice/Reference: ${reference}
Original Amount: ${formatCurrency(Number(receivable.originalAmount), receivable.currency)}
Outstanding Amount: ${formatCurrency(Number(receivable.outstandingAmount), receivable.currency)}
Due Date: ${dueDate.toLocaleDateString('de-DE')}
${daysOverdue > 0 ? `Days Overdue: ${daysOverdue}` : ''}

Please arrange payment at your earliest convenience. If you have already made this payment, please disregard this reminder.

If you have any questions or concerns regarding this invoice, please don't hesitate to contact us.

Best regards,
${user.name || companyName}
${companyName}

---
This is an automated payment reminder. Please do not reply directly to this email.
  `.trim();

  try {
    // Send email
    const info = await transporter.sendMail({
      from: `"${companyName}" <${companyEmail}>`,
      to: debtorEmail,
      subject: emailSubject,
      text: emailBody,
      html: emailBody.replace(/\n/g, '<br>'),
      headers: {
        'X-Receivable-ID': receivable.id,
        'X-Reference': reference,
      },
    });

    // Update receivable last activity
    await prisma.receivable.update({
      where: { id },
      data: {
        lastActivityDate: new Date(),
        reminderCount: { increment: 1 },
      },
    });

    // Create event record
    await prisma.receivableEvent.create({
      data: {
        type: 'reminder_sent',
        description: `Payment reminder sent to ${debtorEmail}`,
        performedBy: user.id,
        receivableId: id,
        metadata: {
          recipientEmail: debtorEmail,
          messageId: info.messageId,
          outstandingAmount: Number(receivable.outstandingAmount),
        },
      },
    });

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
      sentTo: debtorEmail,
      sentAt: new Date().toISOString(),
    });

  } catch (emailError) {
    console.error('Failed to send payment reminder:', emailError);

    // Log the failed attempt
    await prisma.receivableEvent.create({
      data: {
        type: 'reminder_failed',
        description: `Failed to send reminder to ${debtorEmail}: ${emailError instanceof Error ? emailError.message : 'Unknown error'}`,
        performedBy: user.id,
        receivableId: id,
      },
    });

    return NextResponse.json(
      {
        error: 'Failed to send reminder email',
        details: emailError instanceof Error ? emailError.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
