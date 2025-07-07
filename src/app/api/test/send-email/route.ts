import { NextRequest, NextResponse } from 'next/server';
import { sendTestEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Test endpoint not available in production' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    console.log(`🧪 Sending test email to: ${email}`);
    
    const result = await sendTestEmail(email);
    
    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
      messageId: result.messageId,
    });

  } catch (error) {
    console.error('❌ Test email error:', error);
    return NextResponse.json(
      { error: 'Failed to send test email. Check AWS SES configuration.' },
      { status: 500 }
    );
  }
} 