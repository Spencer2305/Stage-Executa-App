import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Test avatar update started');
    
    // Authenticate user
    const user = await authenticateRequest(request);
    console.log('👤 Authenticated user:', user ? user.id : 'None');
    
    if (!user) {
      console.log('❌ Authentication failed');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Simple test avatar (small base64 image)
    const testAvatar = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    
    console.log('💾 Updating user avatar in database for user:', user.id);
    console.log('📏 Test avatar length:', testAvatar.length);

    // Update user avatar in database
    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: { avatar: testAvatar },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
      }
    });
    
    console.log('✅ Avatar updated successfully in database');
    console.log('🖼️ Updated user avatar length:', updatedUser.avatar?.length || 0);

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: 'Test avatar updated successfully'
    });

  } catch (error) {
    console.error('❌ Test avatar update error:', error);
    return NextResponse.json({ 
      error: 'Failed to update test avatar',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 