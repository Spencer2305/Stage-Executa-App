import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyPassword, createSession, validateEmail } from '@/lib/auth';
import { withRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/security';

const db = new PrismaClient();

async function handleLogin(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Find user with account
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { account: true }
    });

    if (!user) {
      // Security: Log attempt but don't reveal user existence
      console.warn(`🚫 Login attempt for non-existent user: ${email.substring(0, 3)}***`);
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.passwordHash);
    
    if (!isValidPassword) {
      // Security: Log failed attempt but don't reveal details
      console.warn(`🚫 Failed login attempt for user: ${user.email.substring(0, 3)}***`);
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Get user agent and IP for session tracking
    const userAgent = request.headers.get('user-agent') || undefined;
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ipAddress = forwarded ? forwarded.split(',')[0] : realIp || undefined;

    // Create session
    const token = await createSession(user.id, userAgent, ipAddress);

    // Return user data (without sensitive information)
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      account: {
        id: user.account.id,
        accountId: user.account.accountId,
        name: user.account.name,
        plan: user.account.plan
      }
    };

    // Security: Log successful login without sensitive details
    console.log(`✅ Successful login for user: ${user.email.substring(0, 3)}***`);

    return NextResponse.json({
      user: userData,
      token,
      message: 'Login successful'
    });

  } catch (error) {
    // Security: Log error details for debugging but don't expose to client
    console.error('🚫 Login error occurred:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.stack : undefined : undefined
    });
    
    // Security: Never expose internal error details to client
    return NextResponse.json(
      { error: 'Authentication failed. Please try again.' },
      { status: 500 }
    );
  }
}

// Apply strict rate limiting to prevent brute force attacks
export const POST = withRateLimit(RATE_LIMIT_CONFIGS.AUTH, handleLogin); 