import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { db } from '@/lib/db';
import { validateFileSecurely, generateSecureChecksum } from '@/lib/fileUploadSecurity';

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

    // Comprehensive security validation
    console.log('🔒 Running security validation for avatar upload');
    const securityResult = await validateFileSecurely(file, file.name, file.type, 'PRO');
    
    if (!securityResult.isValid) {
      console.warn('🚫 Avatar upload rejected:', securityResult.errors);
      return NextResponse.json({ 
        error: 'File security validation failed',
        details: securityResult.errors
      }, { status: 400 });
    }

    // Log security warnings if any
    if (securityResult.warnings.length > 0) {
      console.warn('⚠️ Avatar upload warnings:', securityResult.warnings);
    }

    // Use sanitized filename if provided
    const safeFileName = securityResult.sanitizedFileName || file.name;

    // Convert file to base64 data URL for storage
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;
    
    console.log('💾 Updating user avatar in database for user:', user.id);
    console.log('📏 Data URL length:', dataUrl.length);
    console.log('📁 File details:', { 
      name: file.name, 
      type: file.type, 
      size: file.size,
      base64Length: base64.length 
    });

    // First check if user exists
    const existingUser = await db.user.findUnique({
      where: { id: user.id },
      select: { id: true, email: true, avatar: true }
    });
    
    console.log('👤 Existing user found:', !!existingUser);
    console.log('📸 Current avatar length:', existingUser?.avatar?.length || 0);

    // Update user avatar in database with better error handling
    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: { 
        avatar: dataUrl,
        updatedAt: new Date() // Explicitly update timestamp
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        updatedAt: true
      }
    });
    
    console.log('✅ Avatar updated successfully in database');
    console.log('🖼️ Updated user avatar length:', updatedUser.avatar?.length || 0);
    console.log('⏰ Update timestamp:', updatedUser.updatedAt);

    // Verify the update by fetching the user again
    const verifyUser = await db.user.findUnique({
      where: { id: user.id },
      select: { avatar: true }
    });
    
    console.log('🔍 Verification - avatar saved:', !!verifyUser?.avatar);
    console.log('🔍 Verification - avatar length:', verifyUser?.avatar?.length || 0);

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