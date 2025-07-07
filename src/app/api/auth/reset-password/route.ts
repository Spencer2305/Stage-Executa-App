import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, validatePassword } from '@/lib/auth';
import { withRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/security';

async function handleResetPassword(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { token, password } = body;

    // Validation
    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.errors.join(', ') },
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
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    // Check if token has expired
    if (passwordReset.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Reset token has expired' },
        { status: 400 }
      );
    }

    // Check if token has already been used
    if (passwordReset.used) {
      return NextResponse.json(
        { error: 'Reset token has already been used' },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await hashPassword(password);

    // Update user password and mark token as used
    await db.$transaction([
      db.user.update({
        where: { id: passwordReset.userId },
        data: { passwordHash: hashedPassword }
      }),
      db.passwordReset.update({
        where: { id: passwordReset.id },
        data: { used: true }
      })
    ]);

    console.log(`✅ Password reset successful for user: ${passwordReset.user.email.substring(0, 3)}***`);

    return NextResponse.json({
      message: 'Password has been reset successfully'
    });

  } catch (error) {
    console.error('🚫 Reset password error:', error);
    return NextResponse.json(
      { error: 'Failed to reset password. Please try again.' },
      { status: 500 }
    );
  }
}

// Apply rate limiting to prevent abuse
export const POST = withRateLimit(RATE_LIMIT_CONFIGS.AUTH, handleResetPassword); 