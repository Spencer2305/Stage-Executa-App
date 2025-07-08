'use client';

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Star, CreditCard } from 'lucide-react';
import { SUBSCRIPTION_PLANS } from '@/lib/stripe';
import { toast } from 'sonner';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface SubscriptionPlansProps {
  currentPlan?: 'PRO' | 'ENTERPRISE';
  onPlanSelect?: (plan: string) => void;
}

export function SubscriptionPlans({ currentPlan = 'PRO', onPlanSelect }: SubscriptionPlansProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleSubscribe = async (planType: 'PRO' | 'ENTERPRISE') => {
    // For ENTERPRISE plan, redirect to contact sales
    if (planType === 'ENTERPRISE') {
      // You can customize this to open a contact form or redirect to a contact page
      window.open('mailto:sales@executa.app?subject=Enterprise Plan Inquiry', '_blank');
      return;
    }

    try {
      setIsLoading(planType);

      const token = localStorage.getItem('executa-auth-token');
      if (!token) {
        toast.error('Please log in to subscribe');
        return;
      }

      // Create checkout session
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ planType }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      const stripe = await stripePromise;
      if (stripe && data.sessionId) {
        const { error } = await stripe.redirectToCheckout({
          sessionId: data.sessionId,
        });

        if (error) {
          throw new Error(error.message);
        }
      } else {
        // Fallback to direct URL redirect
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Subscription error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to start subscription');
    } finally {
      setIsLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    try {
      setIsLoading('manage');

      const token = localStorage.getItem('executa-auth-token');
      if (!token) {
        toast.error('Please log in to manage subscription');
        return;
      }

      // Create customer portal session
      const response = await fetch('/api/stripe/customer-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to access billing portal');
      }

      // Redirect to Stripe Customer Portal
      window.location.href = data.url;
    } catch (error) {
      console.error('Customer portal error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to access billing portal');
    } finally {
      setIsLoading(null);
    }
  };

  const planEntries = Object.entries(SUBSCRIPTION_PLANS) as Array<[keyof typeof SUBSCRIPTION_PLANS, typeof SUBSCRIPTION_PLANS[keyof typeof SUBSCRIPTION_PLANS]]>;

  return (
    <div className="py-16 px-4">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-bold text-gray-900 font-kanit tracking-wide mb-6 uppercase">OUR PRICING IS SIMPLE WITH NO HIDDEN FEES</h2>
        <p className="text-gray-500 text-lg mb-8">
          7 Days free trial. No credit card required.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
        {planEntries.map(([planKey, plan]) => {
          const isCurrentPlan = currentPlan === planKey;
          const isPaidPlan = true; // All plans are now paid
          const canUpgrade = currentPlan === 'PRO' && planKey === 'ENTERPRISE';
          const canDowngrade = currentPlan === 'ENTERPRISE' && planKey === 'PRO';
          const isPopular = planKey === 'PRO';

          return (
            <div 
              key={planKey}
              className={`relative rounded-3xl p-8 transition-all duration-300 hover:shadow-xl bg-white border border-gray-200 text-gray-900 ${
                isPopular ? 'transform scale-105 z-10' : ''
              }`}
            >
              {isPopular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="px-4 py-2 rounded-full text-sm font-semibold shadow-lg text-white" style={{backgroundColor: '#6400fe'}}>
                    Most Popular
                  </div>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-4 text-gray-900">
                  {plan.name}
                </h3>
                <div className="mb-6">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className={`font-bold ${plan.price === null ? 'text-2xl' : 'text-3xl'}`} style={{color: '#6400fe'}}>
                      {plan.price === null ? 'Price on Apply' : `$${plan.price}`}
                    </span>
                    {plan.price !== null && (
                      <span className="text-base text-gray-500">/month</span>
                    )}
                  </div>
                </div>
                <p className="text-gray-500">
                  Perfect for {planKey === 'PRO' ? 'growing businesses' : 'large organizations'}
                </p>
              </div>

              <div className="space-y-6 mb-8">
                <ul className="space-y-4">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center mr-3 flex-shrink-0" style={{backgroundColor: '#6400fe20'}}>
                        <Check className="h-3 w-3" style={{color: '#6400fe'}} />
                      </div>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                  {isCurrentPlan ? (
                    <div className="space-y-3">
                      <button disabled className="w-full py-4 px-6 rounded-2xl bg-gray-100 text-gray-500 cursor-not-allowed font-semibold">
                        Current Plan
                      </button>
                      {isPaidPlan && (
                        <button
                          onClick={handleManageSubscription}
                          disabled={isLoading === 'manage'}
                          className="w-full py-4 px-6 rounded-2xl border-2 font-semibold transition-colors hover:text-white"
                          style={{borderColor: '#6400fe', color: '#6400fe'}}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#6400fe'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <CreditCard className="h-4 w-4 mr-2" />
                          {isLoading === 'manage' ? 'Loading...' : 'Manage Subscription'}
                        </button>
                      )}
                    </div>
                  ) : canUpgrade || canDowngrade ? (
                    <button
                      onClick={() => handleSubscribe(planKey as 'PRO' | 'ENTERPRISE')}
                      disabled={isLoading === planKey}
                      className="w-full py-4 px-6 rounded-2xl text-white font-semibold transition-colors"
                      style={{backgroundColor: '#6400fe'}}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5500d9'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#6400fe'}
                    >
                      {isLoading === planKey ? 'Loading...' : planKey === 'ENTERPRISE' ? 'Contact Sales' : canUpgrade ? `Upgrade to ${plan.name}` : `Switch to ${plan.name}`}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSubscribe(planKey as 'PRO' | 'ENTERPRISE')}
                      disabled={isLoading === planKey}
                      className="w-full py-4 px-6 rounded-2xl text-white font-semibold transition-colors"
                      style={{backgroundColor: '#6400fe'}}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5500d9'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#6400fe'}
                    >
                      {isLoading === planKey ? 'Loading...' : planKey === 'ENTERPRISE' ? 'Contact Sales' : `Get ${plan.name}`}
                    </button>
                  )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-center text-sm text-gray-600 space-y-1">
        <p>• All plans include a 14-day free trial</p>
        <p>• Cancel anytime, no long-term contracts</p>
        <p>• Secure payments powered by Stripe</p>
      </div>
    </div>
  );
} 