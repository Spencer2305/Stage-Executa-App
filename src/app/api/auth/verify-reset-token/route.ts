import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    // Find the password reset token
    const passwordReset = await db.passwordReset.findUnique({
      where: { token },
      include: { user: true }
    });

    if (!passwordReset) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 404 }
      );
    }

    // Check if token has expired
    if (passwordReset.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Token has expired' },
        { status: 400 }
      );
    }

    // Check if token has already been used
    if (passwordReset.used) {
      return NextResponse.json(
        { error: 'Token has already been used' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      message: 'Token is valid'
    });

  } catch (error) {
    console.error('🚫 Token verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify token' },
      { status: 500 }
    );
  }
} 