import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Debug endpoint not available in production' },
      { status: 403 }
    );
  }

  try {
    const config = {
      AWS_REGION: process.env.AWS_REGION || 'Not set',
      AWS_SES_FROM_EMAIL: process.env.AWS_SES_FROM_EMAIL || 'Not set',
      NODE_ENV: process.env.NODE_ENV,
    };

    return NextResponse.json({
      message: 'AWS SES Configuration Check',
      config,
      recommendations: [
        process.env.AWS_REGION ? '✅ AWS_REGION is set' : '❌ Set AWS_REGION (e.g., us-east-1)',
        process.env.AWS_SES_FROM_EMAIL ? '✅ AWS_SES_FROM_EMAIL is set' : '❌ Set AWS_SES_FROM_EMAIL',
      ]
    });

  } catch (error) {
    console.error('Debug email config error:', error);
    return NextResponse.json(
      { error: 'Failed to check configuration' },
      { status: 500 }
    );
  }
} 