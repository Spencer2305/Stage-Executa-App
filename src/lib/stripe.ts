import Stripe from 'stripe';

// Server-side Stripe instance (only used in API routes)
let stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripe) {
    }
    
      apiVersion: '2025-06-30.basil',
      typescript: true,
    });
  }
  
  return stripe;
}

// Price IDs for your plans (you'll get these from Stripe Dashboard)
export const STRIPE_PRICE_IDS = {
  PRO: process.env.STRIPE_PRICE_ID_PRO || '',
  ENTERPRISE: process.env.STRIPE_PRICE_ID_ENTERPRISE || null,
} as const;

// Plan configuration matching your database schema
// This can be safely imported on client-side as it doesn't use server env vars
export const SUBSCRIPTION_PLANS = {
  PRO: {
    name: 'Professional',
    price: 39.99,
    priceId: STRIPE_PRICE_IDS.PRO,
    features: [
      '10 AI Assistants',
      '10,000 conversations/month',
      '10 GB storage',
      'Priority support',
      'API access',
      'Custom branding',
    ],
  },
  ENTERPRISE: {
    name: 'Enterprise',
    price: null, // Price on Apply
    priceId: STRIPE_PRICE_IDS.ENTERPRISE,
    features: [
      'Unlimited AI Assistants',
      'Unlimited conversations',
      '100 GB storage',
      '24/7 dedicated support',
      'Advanced API access',
      'White-label solution',
      'SSO integration',
      'Custom integrations',
    ],
  },
} as const;

export type PlanType = keyof typeof SUBSCRIPTION_PLANS; 