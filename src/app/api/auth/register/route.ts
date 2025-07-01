import { NextRequest, NextResponse } from 'next/server';
import { validateEmail, validatePassword, createAccountAndUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { withRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/security';

async function handleRegistration(request: NextRequest): Promise<NextResponse> {
  try {
    const { email, password, name, organizationName } = await request.json();

    // Validate required fields
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      );
    }

    // Validate email format
    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      // Security: Log detailed errors but only return generic message
      console.warn('🚫 Password validation failed:', passwordValidation.errors);
      return NextResponse.json(
        { error: 'Password does not meet security requirements. Must be 8+ characters with uppercase, lowercase, and numbers.' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    // Create account and user using the utility function
    const { user, token } = await createAccountAndUser(
      email,
      password,
      name,
      organizationName
    );

    return NextResponse.json({
      success: true,
      user,
      token,
      message: 'Registration successful',
      redirectTo: '/select-plan'
    });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Apply rate limiting to prevent automated account creation
export const POST = withRateLimit(RATE_LIMIT_CONFIGS.AUTH, handleRegistration); 