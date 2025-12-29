import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionWithOrg, unauthorized, notFound, badRequest } from '@/lib/api-utils'

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionWithOrg()
    if (!user?.organizationId) return unauthorized()

    const body = await request.json()
    const { invoiceId, recipientEmail, message } = body

    if (!invoiceId) return badRequest('Invoice ID is required')

    // Verify invoice belongs to organization
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        organizationId: user.organizationId,
      },
    })

    if (!invoice) return notFound('Invoice')

    // TODO: Integrate with email service (SendGrid, Resend, etc.)
    // For now, just update the invoice status to 'sent'
    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: 'sent',
        sentAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Invoice marked as sent',
      invoice: updatedInvoice,
      // Note: Email integration pending
      emailSent: false,
      recipientEmail: recipientEmail || null,
    })
  } catch (error) {
    console.error('Send invoice error:', error)
    return NextResponse.json(
      { error: 'Failed to send invoice' },
      { status: 500 }
    )
  }
}
