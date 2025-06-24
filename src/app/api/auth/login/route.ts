import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyPassword, createSession, validateEmail } from '@/lib/auth';

const db = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 Login attempt started');
    
    const body = await request.json();
    const { email, password } = body;
    console.log('📧 Email received:', email);

    // Validation
    if (!email || !password) {
      console.log('❌ Missing email or password');
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (!validateEmail(email)) {
      console.log('❌ Invalid email format:', email);
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    console.log('🔍 Looking up user with email:', email.toLowerCase());
    
    // Find user with account
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { account: true }
    });

    if (!user) {
      console.log('❌ User not found for email:', email.toLowerCase());
      // Let's also check what users exist
      const allUsers = await db.user.findMany({ select: { email: true } });
      console.log('👥 Available users:', allUsers.map(u => u.email));
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    console.log('✅ User found:', { id: user.id, email: user.email, hasAccount: !!user.account });

    // Verify password
    console.log('🔑 Verifying password...');
    const isValidPassword = await verifyPassword(password, user.passwordHash);
    
    if (!isValidPassword) {
      console.log('❌ Invalid password for user:', user.email);
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    console.log('✅ Password verified successfully');

    // Get user agent and IP
    const userAgent = request.headers.get('user-agent') || undefined;
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ipAddress = forwarded ? forwarded.split(',')[0] : realIp || undefined;

    console.log('🎫 Creating session for user:', user.id);
    
    // Create session
    const token = await createSession(user.id, userAgent, ipAddress);
    
    console.log('✅ Session created successfully, token length:', token.length);

    // Return user data (without password hash)
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

    console.log('🎉 Login successful for user:', user.email);

    return NextResponse.json({
      user: userData,
      token,
      message: 'Login successful'
    });

  } catch (error) {
    console.error('💥 Login error details:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorName = error instanceof Error ? error.name : 'Unknown';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('Error name:', errorName);
    console.error('Error message:', errorMessage);
    console.error('Error stack:', errorStack);
    
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
} 