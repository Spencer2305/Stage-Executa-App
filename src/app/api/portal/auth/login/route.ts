import { NextRequest, NextResponse } from 'next/server';
import { loginPortalUser, createDefaultAdmin } from '@/lib/portalAuth';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Ensure default admin exists (for initial setup)
    await createDefaultAdmin();

    // Attempt login
    const result = await loginPortalUser(username, password);
    
    if (!result) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Create response with token in cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: result.user._id,
        username: result.user.username,
        role: result.user.role,
        lastLogin: result.user.lastLogin
      }
    });

    // Set HTTP-only cookie for security
    response.cookies.set('portal-auth-token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });

    return response;
  } catch (error) {
    console.error('Portal login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 