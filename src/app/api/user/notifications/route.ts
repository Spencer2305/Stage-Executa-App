import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { db } from '@/lib/db';

// GET: Fetch current user's notification preferences
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let preferences = await db.notificationPreferences.findUnique({
      where: { userId: user.id }
    });

    // If not set, create default preferences
    if (!preferences) {
      preferences = await db.notificationPreferences.create({
        data: { userId: user.id }
      });
    }

    return NextResponse.json({ success: true, preferences });
  } catch (error) {
    console.error('Fetch notification preferences error:', error);
    return NextResponse.json({ error: 'Failed to fetch notification preferences' }, { status: 500 });
  }
}

// PUT: Update current user's notification preferences
export async function PUT(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const allowedFields = [
      'emailUpdates',
      'securityAlerts',
      'marketingEmails',
      'weeklyReports',
      'handoffRequests',
      'assistantAlerts',
      'systemMaintenance'
    ];
    const updateData: Record<string, boolean> = {};
    for (const key of allowedFields) {
      if (typeof body[key] === 'boolean') {
        updateData[key] = body[key];
      }
    }

    let preferences = await db.notificationPreferences.findUnique({
      where: { userId: user.id }
    });

    if (!preferences) {
      preferences = await db.notificationPreferences.create({
        data: { userId: user.id, ...updateData }
      });
    } else {
      preferences = await db.notificationPreferences.update({
        where: { userId: user.id },
        data: updateData
      });
    }

    return NextResponse.json({ success: true, preferences });
  } catch (error) {
    console.error('Update notification preferences error:', error);
    return NextResponse.json({ error: 'Failed to update notification preferences' }, { status: 500 });
  }
} 