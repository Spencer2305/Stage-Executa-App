import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, createSession, validateEmail, validatePassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    // Validation
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      );
    }

    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: 'Invalid password', details: passwordValidation.errors },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await db.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        name: name.trim(),
        plan: 'FREE'
      }
    });

    // Get user agent and IP
    const userAgent = request.headers.get('user-agent') || undefined;
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ipAddress = forwarded ? forwarded.split(',')[0] : realIp || undefined;

    // Create session
    const token = await createSession(user.id, userAgent, ipAddress);

    // Return user data (without password hash)
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      plan: user.plan,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt
    };

    return NextResponse.json({
      user: userData,
      token,
      message: 'User registered successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 