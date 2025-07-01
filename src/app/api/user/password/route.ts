import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, verifyPassword, hashPassword, validatePassword } from '@/lib/auth';
import { db } from '@/lib/db';
import { withRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/security';

async function handlePasswordChange(request: NextRequest): Promise<NextResponse> {
  try {
    // Authenticate user
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    // Validation
    if (!currentPassword) {
      return NextResponse.json({ error: 'Current password is required' }, { status: 400 });
    }

    if (!newPassword) {
      return NextResponse.json({ error: 'New password is required' }, { status: 400 });
    }

    // Validate new password strength
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return NextResponse.json({ 
        error: passwordValidation.errors.join(', ') 
      }, { status: 400 });
    }

    // Get user's current password hash
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { passwordHash: true }
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify current password
    const isCurrentPasswordValid = await verifyPassword(currentPassword, dbUser.passwordHash);
    if (!isCurrentPasswordValid) {
      return NextResponse.json({ 
        error: 'Current password is incorrect' 
      }, { status: 400 });
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password in database
    await db.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash }
    });

    // Optionally, invalidate all existing sessions for security
    await db.session.deleteMany({
      where: { userId: user.id }
    });

    return NextResponse.json({
      message: 'Password updated successfully'
    });

  } catch (error) {
    console.error('Password change error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Apply rate limiting to prevent password change abuse
export const PUT = withRateLimit(RATE_LIMIT_CONFIGS.PASSWORD_RESET, handlePasswordChange); 