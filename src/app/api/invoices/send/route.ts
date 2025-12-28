import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { invoiceId, recipientEmail, message } = body

    if (!invoiceId) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 })
    }

    // Verify invoice belongs to organization
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        organizationId: session.user.organizationId,
      },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

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
