import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Avatar upload started');
    
    // Authenticate user
    const user = await authenticateRequest(request);
    console.log('👤 Authenticated user:', user ? user.id : 'None');
    
    if (!user) {
      console.log('❌ Authentication failed');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('avatar') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.' 
      }, { status: 400 });
    }

    // Validate file size (2MB max)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 2MB.' 
      }, { status: 400 });
    }

    // Convert file to base64 data URL for storage
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;
    
    console.log('💾 Updating user avatar in database for user:', user.id);
    console.log('📏 Data URL length:', dataUrl.length);

    // Update user avatar in database
    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: { avatar: dataUrl },
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
      message: 'Avatar updated successfully'
    });

  } catch (error) {
    console.error('Avatar upload error:', error);
    return NextResponse.json({ 
      error: 'Failed to upload avatar' 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Authenticate user
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Remove avatar from database
    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: { avatar: null },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
      }
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: 'Avatar removed successfully'
    });

  } catch (error) {
    console.error('Avatar removal error:', error);
    return NextResponse.json({ 
      error: 'Failed to remove avatar' 
    }, { status: 500 });
  }
} 