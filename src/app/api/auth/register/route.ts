import { NextRequest, NextResponse } from 'next/server';
import { validateEmail, validatePassword, createAccountAndUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
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
      return NextResponse.json(
        { error: 'Password validation failed', details: passwordValidation.errors },
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
      message: 'Registration successful'
    });

  } catch (error) {
    console.error('Database error during registration:', error);
    return NextResponse.json(
      { error: 'Database error during registration' },
      { status: 500 }
    );
  }
} 