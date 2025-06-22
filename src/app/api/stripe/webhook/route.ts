import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { db } from '@/lib/db';
import Stripe from 'stripe';

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session);
        break;
      }
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentSucceeded(invoice);
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const { userId, accountId, planType } = session.metadata || {};
  
  if (!userId || !accountId || !planType) {
    console.error('Missing metadata in checkout session:', session.id);
    return;
  }

  // Get the subscription
  const stripe = getStripe();
  const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
  
  // Get billing period from first subscription item
  const firstItem = subscription.items.data[0];
  const currentPeriodStart = firstItem?.current_period_start ? new Date(firstItem.current_period_start * 1000) : null;
  const currentPeriodEnd = firstItem?.current_period_end ? new Date(firstItem.current_period_end * 1000) : null;
  
  // Update account with subscription details
  await db.account.update({
    where: { id: accountId },
    data: {
      plan: planType as 'FREE' | 'PRO' | 'ENTERPRISE',
      stripeCustomerId: session.customer as string,
      stripeSubscriptionId: subscription.id,
      subscriptionStatus: subscription.status,
      currentPeriodStart,
      currentPeriodEnd,
    },
  });

  console.log(`Subscription activated for account ${accountId}: ${planType}`);
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  
  // Update account subscription status
  const account = await db.account.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (account && (invoice as any).subscription) {
    const stripe = getStripe();
    const subscription = await stripe.subscriptions.retrieve((invoice as any).subscription as string);
    
    // Get billing period from first subscription item
    const firstItem = subscription.items.data[0];
    const currentPeriodStart = firstItem?.current_period_start ? new Date(firstItem.current_period_start * 1000) : null;
    const currentPeriodEnd = firstItem?.current_period_end ? new Date(firstItem.current_period_end * 1000) : null;
    
    await db.account.update({
      where: { id: account.id },
      data: {
        subscriptionStatus: subscription.status,
        currentPeriodStart,
        currentPeriodEnd,
      },
    });
  }

  console.log(`Payment succeeded for customer ${customerId}`);
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  
  // Update account subscription status
  const account = await db.account.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (account) {
    await db.account.update({
      where: { id: account.id },
      data: {
        subscriptionStatus: 'past_due',
      },
    });
  }

  console.log(`Payment failed for customer ${customerId}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  
  // Downgrade account to free plan
  const account = await db.account.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (account) {
    await db.account.update({
      where: { id: account.id },
      data: {
        plan: 'FREE',
        subscriptionStatus: 'canceled',
        stripeSubscriptionId: null,
        currentPeriodStart: null,
        currentPeriodEnd: null,
      },
    });
  }

  console.log(`Subscription canceled for customer ${customerId}`);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  
  // Update account subscription details
  const account = await db.account.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (account) {
    // Get billing period from first subscription item
    const firstItem = subscription.items.data[0];
    const currentPeriodStart = firstItem?.current_period_start ? new Date(firstItem.current_period_start * 1000) : null;
    const currentPeriodEnd = firstItem?.current_period_end ? new Date(firstItem.current_period_end * 1000) : null;
    
    await db.account.update({
      where: { id: account.id },
      data: {
        subscriptionStatus: subscription.status,
        currentPeriodStart,
        currentPeriodEnd,
      },
    });
  }

  console.log(`Subscription updated for customer ${customerId}`);
} 