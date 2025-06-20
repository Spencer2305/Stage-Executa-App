import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing avatar functionality');
    
    // Test authentication
    const user = await authenticateRequest(request);
    console.log('👤 Current user:', user ? { id: user.id, email: user.email } : 'None');
    
    if (!user) {
      return NextResponse.json({ 
        error: 'Not authenticated',
        debug: {
          hasUser: false,
          timestamp: new Date().toISOString()
        }
      }, { status: 401 });
    }

    // Test database connection and fetch current user data
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        createdAt: true
      }
    });

    console.log('💾 Database user:', dbUser ? { 
      id: dbUser.id, 
      email: dbUser.email, 
      avatar: dbUser.avatar ? `${dbUser.avatar.substring(0, 50)}...` : 'none' 
    } : 'Not found');

    // Test a simple update to see if database writes work
    const testUpdate = await db.user.update({
      where: { id: user.id },
      data: { updatedAt: new Date() },
      select: { id: true, updatedAt: true }
    });

    return NextResponse.json({
      success: true,
      debug: {
        authenticated: true,
        userId: user.id,
        userEmail: user.email,
        hasAvatar: !!dbUser?.avatar,
        avatarLength: dbUser?.avatar?.length || 0,
        canWriteToDb: !!testUpdate,
        timestamp: new Date().toISOString()
      },
      user: dbUser
    });

  } catch (error) {
    console.error('🚨 Test avatar error:', error);
    return NextResponse.json({ 
      error: 'Test failed',
      debug: {
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
} 