import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Database test started');
    
    // Test basic database connection
    const userCount = await db.user.count();
    console.log('👥 Total users in database:', userCount);
    
    // Authenticate user if token provided
    const user = await authenticateRequest(request);
    if (user) {
      console.log('👤 Authenticated user:', user.id, user.email);
      
      // Try to fetch the user from database
      const dbUser = await db.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
        }
      });
      
      console.log('💾 User from database:', dbUser ? 'found' : 'not found');
      console.log('🖼️ Current avatar in DB:', dbUser?.avatar ? `${dbUser.avatar.substring(0, 50)}...` : 'none');
      
      return NextResponse.json({
        success: true,
        userCount,
        authenticatedUser: user,
        dbUser,
        message: 'Database connection working'
      });
    } else {
      return NextResponse.json({
        success: true,
        userCount,
        message: 'Database connection working (no auth)'
      });
    }
    
  } catch (error) {
    console.error('❌ Database test error:', error);
    return NextResponse.json({ 
      error: 'Database connection failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 