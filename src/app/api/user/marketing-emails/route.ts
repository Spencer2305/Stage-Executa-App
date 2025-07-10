import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { db } from '@/lib/db';

const MAILCHIMP_API_KEY = process.env.MAILCHIMP_API_KEY;
const MAILCHIMP_AUDIENCE_ID = process.env.MAILCHIMP_AUDIENCE_ID;
const MAILCHIMP_SERVER_PREFIX = process.env.MAILCHIMP_SERVER_PREFIX; // e.g. 'us22'

async function updateMailchimpSubscription(email: string, enabled: boolean) {
  if (!MAILCHIMP_API_KEY || !MAILCHIMP_AUDIENCE_ID || !MAILCHIMP_SERVER_PREFIX) {
    throw new Error('Mailchimp environment variables not set');
  }
  const data = {
    email_address: email,
    status: enabled ? 'subscribed' : 'unsubscribed',
  };
  const subscriberHash = require('crypto').createHash('md5').update(email.toLowerCase()).digest('hex');
  const url = `https://${MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0/lists/${MAILCHIMP_AUDIENCE_ID}/members/${subscriberHash}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `apikey ${MAILCHIMP_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || 'Failed to update Mailchimp subscription');
  }
  return await res.json();
}

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const { enabled } = body;
    if (typeof enabled !== 'boolean') {
      return NextResponse.json({ error: 'Missing enabled boolean' }, { status: 400 });
    }
    // Update Mailchimp subscription
    await updateMailchimpSubscription(user.email, enabled);
    // Also update notification preferences in DB
    await db.notificationPreferences.update({
      where: { userId: user.id },
      data: { marketingEmails: enabled },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Mailchimp marketing email error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to update marketing email subscription' }, { status: 500 });
  }
} 