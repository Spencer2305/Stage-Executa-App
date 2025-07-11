import { NextRequest, NextResponse } from 'next/server';
import { getStripe, STRIPE_PRICE_IDS } from '@/lib/stripe';
import { authenticateRequest } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { planType } = await request.json();

    if (!planType || planType === 'FREE') {
      return NextResponse.json({ error: 'Invalid plan type' }, { status: 400 });
    }

    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes('your-stripe-secret-key')) {
      console.log('⚠️ Stripe not configured - simulating plan upgrade');
      
      // Update user's plan in database directly (for development)
      const { db } = await import('@/lib/db');
      await db.account.update({
        where: { id: user.account.id },
        data: { plan: planType as any }
      });

      return NextResponse.json({ 
        success: true, 
        message: 'Plan upgraded successfully (development mode)',
        redirectUrl: '/dashboard?welcome=true'
      });
    }

    const priceId = STRIPE_PRICE_IDS[planType as keyof typeof STRIPE_PRICE_IDS];
    if (!priceId || priceId === '') {
      return NextResponse.json({ error: 'Plan not available or not configured' }, { status: 400 });
    }

    // Create Stripe checkout session
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer_email: user.email,
      metadata: {
        userId: user.id,
        accountId: user.account.id,
        planType,
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?welcome=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/select-plan?canceled=true`,
      allow_promotion_codes: true,
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
} 