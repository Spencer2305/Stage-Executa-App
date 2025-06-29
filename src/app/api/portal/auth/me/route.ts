import { NextRequest, NextResponse } from 'next/server';
import { authenticatePortalUser } from '@/lib/portalAuth';

export async function GET(request: NextRequest) {
  try {
    const user = await authenticatePortalUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        email: user.email,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Portal auth check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 