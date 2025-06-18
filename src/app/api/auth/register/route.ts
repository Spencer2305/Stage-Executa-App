import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validateEmail, validatePassword, hashPassword } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

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

    // Generate unique account ID for new organizations
    const accountId = `acc_${crypto.randomBytes(8).toString('hex')}`;

    // Create account first
    const account = await db.account.create({
      data: {
        name: organizationName,
        slug: organizationName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        accountId,
        plan: 'FREE',
        billingEmail: email
      }
    });

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await db.user.create({
      data: {
        email,
        name,
        passwordHash,
        accountId: account.id,
        role: 'OWNER'
      }
    });

    // Generate JWT token with proper syntax
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        accountId: user.accountId
      },
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Store session
    await db.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          accountId: user.accountId
        },
        token,
        account: {
          id: account.id,
          name: account.name,
          accountId: account.accountId,
          plan: account.plan
        }
      }
    });

  } catch (dbError) {
    console.error('Database error during registration:', dbError);
    return NextResponse.json(
      { error: 'Database error during registration' },
      { status: 500 }
    );
  }
} 