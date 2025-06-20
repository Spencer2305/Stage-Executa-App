import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, validateEmail } from '@/lib/auth';
import { db } from '@/lib/db';

export async function PUT(request: NextRequest) {
  try {
    // Authenticate user
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, bio, company, website } = body;

    // Validation
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    if (!email?.trim()) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    if (!validateEmail(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Check if email is already taken by another user
    if (email.toLowerCase() !== user.email.toLowerCase()) {
      const existingUser = await db.user.findUnique({
        where: { email: email.toLowerCase() }
      });

      if (existingUser) {
        return NextResponse.json({ 
          error: 'Email is already taken by another user' 
        }, { status: 400 });
      }
    }

    // Update user profile
    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        bio: bio?.trim() || null,
        company: company?.trim() || null,
        website: website?.trim() || null,
      },
      include: {
        account: true
      }
    });

    // Return updated user data (excluding sensitive fields)
    const userData = {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      bio: updatedUser.bio,
      company: updatedUser.company,
      website: updatedUser.website,
      role: updatedUser.role,
      emailVerified: updatedUser.emailVerified,
      avatar: updatedUser.avatar,
      createdAt: updatedUser.createdAt,
      account: {
        id: updatedUser.account.id,
        accountId: updatedUser.account.accountId,
        name: updatedUser.account.name,
        plan: updatedUser.account.plan
      }
    };

    return NextResponse.json({
      success: true,
      user: userData,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ 
      error: 'Failed to update profile' 
    }, { status: 500 });
  }
} 