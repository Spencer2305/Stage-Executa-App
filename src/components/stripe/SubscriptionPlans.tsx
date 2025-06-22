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
  currentPlan?: 'FREE' | 'PRO' | 'ENTERPRISE';
  onPlanSelect?: (plan: string) => void;
}

export function SubscriptionPlans({ currentPlan = 'FREE', onPlanSelect }: SubscriptionPlansProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleSubscribe = async (planType: 'PRO' | 'ENTERPRISE') => {
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
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">Choose Your Plan</h2>
        <p className="text-gray-600">
          Flexible pricing options designed to scale with your business needs.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {planEntries.map(([planKey, plan]) => {
          const isCurrentPlan = currentPlan === planKey;
          const isPaidPlan = planKey !== 'FREE';
          const canUpgrade = currentPlan === 'FREE' && isPaidPlan;
          const isPopular = planKey === 'PRO';

          return (
            <Card 
              key={planKey}
              className={`relative ${isCurrentPlan ? 'ring-2 ring-blue-500' : ''} ${isPopular ? 'scale-105' : ''}`}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-500 text-white flex items-center">
                    <Star className="h-3 w-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl mb-4">{plan.name}</CardTitle>
                <div className="mb-4">
                  <span className="text-4xl font-bold">
                    {plan.price === 0 ? 'Free' : `$${plan.price}`}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-gray-500">/month</span>
                  )}
                </div>
                <CardDescription>
                  Perfect for {planKey === 'FREE' ? 'individuals getting started' : planKey === 'PRO' ? 'growing businesses' : 'large organizations'}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="pt-4">
                  {isCurrentPlan ? (
                    <div className="space-y-2">
                      <Button disabled className="w-full">
                        Current Plan
                      </Button>
                      {isPaidPlan && (
                        <Button
                          variant="outline"
                          onClick={handleManageSubscription}
                          disabled={isLoading === 'manage'}
                          className="w-full"
                        >
                          <CreditCard className="h-4 w-4 mr-2" />
                          {isLoading === 'manage' ? 'Loading...' : 'Manage Subscription'}
                        </Button>
                      )}
                    </div>
                  ) : canUpgrade ? (
                    <Button
                      onClick={() => handleSubscribe(planKey as 'PRO' | 'ENTERPRISE')}
                      disabled={isLoading === planKey}
                      className="w-full"
                    >
                      {isLoading === planKey ? 'Loading...' : `Upgrade to ${plan.name}`}
                    </Button>
                  ) : planKey === 'FREE' ? (
                    <Button variant="outline" className="w-full" disabled>
                      Downgrade Available
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleSubscribe(planKey as 'PRO' | 'ENTERPRISE')}
                      disabled={isLoading === planKey}
                      className="w-full"
                    >
                      {isLoading === planKey ? 'Loading...' : `Switch to ${plan.name}`}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
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