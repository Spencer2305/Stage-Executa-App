import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validateEmail, validatePassword, hashPassword } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';

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
        { error: 'User already exists with this email' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Generate account ID and slug
    const accountId = `acc_${uuidv4().replace(/-/g, '').substring(0, 16)}`;
    const slug = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');

    try {
      // Create account first
      const account = await db.account.create({
        data: {
          name: organizationName || `${name}'s Organization`,
          slug: slug,
          accountId: accountId,
          plan: 'FREE',
          billingEmail: email
        }
      });

      // Create user linked to the account
      const user = await db.user.create({
        data: {
          accountId: account.id,
          email,
          passwordHash,
          name,
          role: 'OWNER',
          emailVerified: false
        }
      });

      // Create session token
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          accountId: account.accountId
        },
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await db.session.create({
        data: {
          userId: user.id,
          token,
          expiresAt
        }
      });

      // Return user data and token
      return NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          emailVerified: user.emailVerified,
          createdAt: user.createdAt,
          account: {
            id: account.id,
            accountId: account.accountId,
            name: account.name,
            plan: account.plan
          }
        },
        token
      });

    } catch (dbError) {
      console.error('Database error during registration:', dbError);
      return NextResponse.json(
        { error: 'Failed to create account', details: String(dbError) },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed', details: String(error) },
      { status: 500 }
    );
  }
} 