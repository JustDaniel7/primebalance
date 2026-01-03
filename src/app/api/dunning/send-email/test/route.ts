import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import nodemailer from 'nodemailer';

// Test endpoint to verify email configuration
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { testEmail } = await request.json();

        if (!testEmail || !testEmail.includes('@')) {
            return NextResponse.json({ error: 'Invalid test email' }, { status: 400 });
        }

        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        // Verify connection
        await transporter.verify();

        // Send test email
        const info = await transporter.sendMail({
            from: `"PrimeBalance Test" <${process.env.SMTP_USER}>`,
            to: testEmail,
            subject: 'PrimeBalance Dunning - Test Email',
            text: 'This is a test email from PrimeBalance Dunning system. If you received this, your email configuration is working correctly.',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">✅ Email Configuration Test</h2>
          <p>This is a test email from <strong>PrimeBalance Dunning</strong> system.</p>
          <p>If you received this, your email configuration is working correctly.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 12px;">Sent at: ${new Date().toISOString()}</p>
        </div>
      `,
        });

        return NextResponse.json({
            success: true,
            messageId: info.messageId,
            message: `Test email sent to ${testEmail}`,
        });

    } catch (error) {
        console.error('Test email error:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Email configuration failed',
                details: error instanceof Error ? error.message : 'Unknown error',
                hint: 'Check your SMTP_HOST, SMTP_USER, and SMTP_PASS environment variables',
            },
            { status: 500 }
        );
    }
}