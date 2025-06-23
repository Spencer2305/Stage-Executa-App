'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Star, ArrowRight, Bot, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const PLANS = {
  FREE: {
    name: 'Free',
    price: 0,
    features: [
      '1 AI Assistant',
      '100 conversations/month',
      '5MB storage',
      'Email support',
    ],
    description: 'Perfect for individuals getting started',
    popular: false,
  },
  PRO: {
    name: 'Professional',
    price: 29,
    features: [
      '10 AI Assistants',
      '10,000 conversations/month',
      '10 GB storage',
      'Priority support',
      'API access',
      'Custom branding',
    ],
    description: 'Perfect for growing businesses',
    popular: true,
  },
};

export default function SelectPlanPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('executa-auth-token');
    if (!token) {
      router.push('/login');
      return;
    }

    // Get user info
    fetch('/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
    .then(res => res.json())
    .then(data => {
      if (data.user) {
        setUser(data.user);
      } else {
        router.push('/login');
      }
    })
    .catch(() => {
      router.push('/login');
    });
  }, [router]);

  const handleSelectPlan = async (planType: 'FREE' | 'PRO') => {
    if (planType === 'FREE') {
      // For free plan, just redirect to dashboard
      router.push('/dashboard');
      return;
    }

    try {
      setIsLoading(planType);

      const token = localStorage.getItem('executa-auth-token');
      if (!token) {
        toast.error('Please log in to continue');
        router.push('/login');
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
      console.error('Plan selection error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to select plan');
    } finally {
      setIsLoading(null);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12 space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Bot className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-foreground leading-tight">
              Welcome to Executa, {user.name}! 
              <span className="inline-block ml-2">
                <Sparkles className="h-8 w-8 text-primary inline" />
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Choose your plan to get started with AI-powered assistance
            </p>
            <p className="text-muted-foreground">
              You can always upgrade or downgrade later
            </p>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {Object.entries(PLANS).map(([planKey, plan]) => (
            <Card 
              key={planKey}
              className={`relative transition-all duration-300 hover:shadow-lg ${
                plan.popular 
                  ? 'ring-2 ring-primary scale-105 shadow-lg' 
                  : 'hover:shadow-md'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                  <Badge className="bg-primary text-primary-foreground flex items-center px-3 py-1 shadow-sm">
                    <Star className="h-3 w-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-8 pt-8">
                <CardTitle className="text-2xl font-bold mb-4">{plan.name}</CardTitle>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-foreground">
                    {plan.price === 0 ? 'Free' : `$${plan.price}`}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-muted-foreground text-lg">/month</span>
                  )}
                </div>
                <CardDescription className="text-base text-muted-foreground">
                  {plan.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6 pb-8">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <Check className="h-4 w-4 text-primary mr-3 flex-shrink-0" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleSelectPlan(planKey as 'FREE' | 'PRO')}
                  disabled={isLoading === planKey}
                  className={`w-full py-3 text-base font-medium ${
                    plan.popular 
                      ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-md' 
                      : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground'
                  }`}
                  size="lg"
                >
                  {isLoading === planKey ? (
                    'Processing...'
                  ) : (
                    <>
                      {plan.price === 0 ? 'Start Free' : 'Start Pro Trial'}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>

                {plan.price > 0 && (
                  <p className="text-sm text-muted-foreground text-center">
                    Cancel anytime • No setup fees
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <p className="text-muted-foreground">
            Need help choosing?{' '}
            <a 
              href="mailto:support@executa.com" 
              className="text-primary hover:text-primary/80 font-medium underline underline-offset-4"
            >
              Contact our team
            </a>
          </p>
        </div>
      </div>
    </div>
  );
} 