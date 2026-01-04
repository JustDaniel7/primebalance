// src/app/api/offers/[id]/send/route.ts
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

  const offer = await prisma.offer.findFirst({
    where: { id, organizationId: user.organizationId },
  });

  if (!offer) return notFound('Offer');

  // Only draft or revised offers can be sent
  if (offer.status !== 'draft' && offer.status !== 'revised') {
    return badRequest(`Cannot send offer in ${offer.status} status`);
  }

  // Validate counterparty email
  const counterparty = offer.counterparty as { email?: string; name?: string; company?: string } | null;
  if (!counterparty?.email) {
    return badRequest('Cannot send offer without counterparty email');
  }

  // Validate line items
  const lineItems = offer.lineItems as unknown[];
  if (!lineItems || lineItems.length === 0) {
    return badRequest('Cannot send offer without line items');
  }

  // Get company info
  const companyEmail = process.env.COMPANY_EMAIL || 'buchhaltung@primebalance.de';
  const companyName = process.env.COMPANY_NAME || 'PrimeBalance GmbH';

  // Format currency
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency }).format(amount);
  };

  // Build email content
  const emailSubject = `Offer ${offer.offerNumber} from ${companyName}`;
  const emailBody = `
Dear ${counterparty.name || counterparty.company || 'Customer'},

Please find attached our offer ${offer.offerNumber}.

Offer Details:
- Offer Number: ${offer.offerNumber}
- Date: ${new Date(offer.offerDate).toLocaleDateString('de-DE')}
- Valid Until: ${new Date(offer.expiryDate).toLocaleDateString('de-DE')}
- Total Amount: ${formatCurrency(Number(offer.grandTotal), offer.currency)}

${offer.customerNotes ? `Notes:\n${offer.customerNotes}\n` : ''}

To accept this offer, please reply to this email or contact us directly.

Best regards,
${user.name || companyName}
${companyName}

---
${offer.disclaimer || 'This offer is non-binding and subject to our standard terms and conditions.'}
  `.trim();

  try {
    // Send email
    const info = await transporter.sendMail({
      from: `"${companyName}" <${companyEmail}>`,
      to: counterparty.email,
      subject: emailSubject,
      text: emailBody,
      html: emailBody.replace(/\n/g, '<br>'),
      headers: {
        'X-Offer-ID': offer.id,
        'X-Offer-Number': offer.offerNumber,
      },
    });

    // Update offer status
    const updated = await prisma.offer.update({
      where: { id },
      data: {
        status: 'sent',
        sentAt: new Date(),
        sentBy: user.name || user.id,
      },
    });

    // Create audit log
    await prisma.offerAuditLog.create({
      data: {
        offerId: updated.id,
        offerNumber: updated.offerNumber,
        action: 'sent',
        details: `Offer ${updated.offerNumber} sent to ${counterparty.email}`,
        previousStatus: offer.status,
        newStatus: 'sent',
        userId: user.id,
        userName: user.name || 'Unknown',
        metadata: {
          recipientEmail: counterparty.email,
          messageId: info.messageId,
        },
      },
    });

    return NextResponse.json({
      ...updated,
      emailSent: true,
      messageId: info.messageId,
      sentTo: counterparty.email,
    });

  } catch (emailError) {
    console.error('Failed to send offer email:', emailError);

    // Log the failed attempt
    await prisma.offerAuditLog.create({
      data: {
        offerId: offer.id,
        offerNumber: offer.offerNumber,
        action: 'send_failed',
        details: `Failed to send offer ${offer.offerNumber} to ${counterparty.email}: ${emailError instanceof Error ? emailError.message : 'Unknown error'}`,
        previousStatus: offer.status,
        newStatus: offer.status,
        userId: user.id,
        userName: user.name || 'Unknown',
      },
    });

    return NextResponse.json(
      {
        error: 'Failed to send offer email',
        details: emailError instanceof Error ? emailError.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
