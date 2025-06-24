import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Database diagnostic started');
    console.log('1. Environment check:');
    console.log('   NODE_ENV:', process.env.NODE_ENV);
    console.log('   DATABASE_URL exists:', !!process.env.DATABASE_URL);
    console.log('   DATABASE_URL preview:', process.env.DATABASE_URL?.substring(0, 30) + '...');
    
    console.log('2. Creating Prisma client...');
    const prisma = new PrismaClient({
      log: ['error', 'warn', 'info'],
    });
    console.log('   Prisma client created successfully');
    
    console.log('3. Testing database connection...');
    console.log('   Available models:', Object.keys(prisma).filter(key => !key.startsWith('$') && !key.startsWith('_')));
    
    // Use the correct model name based on new schema
    const userCount = await prisma.user.count();
    console.log('👥 SUCCESS: Total users in database:', userCount);
    
    // Authenticate user if token provided
    const user = await authenticateRequest(request);
    if (user) {
      console.log('👤 Authenticated user:', user.id, user.email);
      
      // Try to fetch the user from database
      const dbUser = await prisma.user.findUnique({
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