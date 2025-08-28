'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Crown, 
  Users, 
  CreditCard, 
  Check, 
  ArrowLeft,
  Loader2,
  AlertCircle,
  Star,
  Shield,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PRICING_PLANS, SubscriptionTier } from '@/types/profile';
import Link from 'next/link';

interface BillingPageProps {
  userId: string;
  initialUser: any;
  upgradeParam?: string;
  returnUrl?: string;
}

export function BillingPage({ userId, initialUser, upgradeParam, returnUrl }: BillingPageProps) {
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>(
    (upgradeParam as SubscriptionTier) || 'pro'
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubscription = async (tier: SubscriptionTier) => {
    if (tier === 'free') return;

    setIsProcessing(true);
    setError(null);

    try {
      // Create Stripe checkout session
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: tier === 'pro' 
            ? process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID 
            : process.env.NEXT_PUBLIC_STRIPE_TEAM_MONTHLY_PRICE_ID,
          userId,
          returnUrl: returnUrl || window.location.origin + '/profile',
          tier
        }),
      });

      const { url, error: checkoutError } = await response.json();

      if (checkoutError) {
        setError(checkoutError);
        return;
      }

      if (url) {
        // Redirect to Stripe Checkout
        window.location.href = url;
      }
    } catch (error) {
      console.error('Subscription error:', error);
      setError('Failed to start checkout process. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getTierIcon = (tier: SubscriptionTier) => {
    switch (tier) {
      case 'pro': return <Crown className="size-5" />;
      case 'team': return <Users className="size-5" />;
      default: return <Star className="size-5" />;
    }
  };

  const getTierColor = (tier: SubscriptionTier) => {
    switch (tier) {
      case 'pro': return 'text-purple-600 border-purple-200';
      case 'team': return 'text-blue-600 border-blue-200';
      default: return 'text-gray-600 border-gray-200';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/profile">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="size-4 mr-1" />
                Back to Profile
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold">Billing & Subscription</h1>
          <p className="text-muted-foreground">
            {upgradeParam ? 'Choose your plan to unlock all features' : 'Manage your subscription and billing'}
          </p>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <Alert className="border-green-200 bg-green-50">
          <Check className="size-4" />
          <AlertDescription>
            Subscription updated successfully! Your new features are now active.
          </AlertDescription>
        </Alert>
      )}

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Pricing Plans */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {Object.entries(PRICING_PLANS).map(([tierKey, plan]) => {
          const tier = tierKey as SubscriptionTier;
          const isSelected = tier === selectedTier;
          const isCurrentUpgrade = tier === upgradeParam;

          // Skip free plan in billing page unless they're downgrading
          if (tier === 'free' && upgradeParam !== 'free') return null;

          return (
            <Card 
              key={tier}
              className={cn(
                "relative transition-all duration-200 cursor-pointer",
                isSelected && "ring-2 ring-purple-500 scale-105",
                isCurrentUpgrade && "border-purple-500 shadow-lg",
                getTierColor(tier)
              )}
              onClick={() => setSelectedTier(tier)}
            >
              {plan.popular && (
                <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-purple-600">
                  Most Popular
                </Badge>
              )}
              {isCurrentUpgrade && (
                <Badge className="absolute -top-2 right-4 bg-green-600">
                  Recommended
                </Badge>
              )}
              
              <CardHeader className="text-center pb-2">
                <div className={cn("inline-flex items-center gap-2 mb-2", getTierColor(tier))}>
                  {getTierIcon(tier)}
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                </div>
                
                <div className="space-y-1">
                  <div className="text-3xl font-bold">
                    ${plan.price}
                    <span className="text-sm text-muted-foreground font-normal">
                      /{plan.interval}
                    </span>
                  </div>
                  {tier !== 'free' && (
                    <p className="text-xs text-muted-foreground">
                      {plan.yearlyDiscount && 'Save 20% with yearly billing'}
                    </p>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <Check className="size-4 text-green-500 mt-0.5 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {tier !== 'free' && (
                  <Button
                    size="lg"
                    className="w-full"
                    onClick={() => handleSubscription(tier)}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="size-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        {tier === 'pro' && <Crown className="size-4 mr-2" />}
                        {tier === 'team' && <Users className="size-4 mr-2" />}
                        Choose {plan.name}
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Trust Indicators */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <h3 className="font-semibold text-lg">Why Choose MUSE?</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col items-center space-y-2">
                <Shield className="size-8 text-blue-600" />
                <h4 className="font-medium">Secure & Private</h4>
                <p className="text-sm text-muted-foreground text-center">
                  Your stories are encrypted and never used to train AI models
                </p>
              </div>
              
              <div className="flex flex-col items-center space-y-2">
                <Zap className="size-8 text-purple-600" />
                <h4 className="font-medium">Instant Access</h4>
                <p className="text-sm text-muted-foreground text-center">
                  Get immediate access to all features upon subscription
                </p>
              </div>
              
              <div className="flex flex-col items-center space-y-2">
                <Star className="size-8 text-yellow-600" />
                <h4 className="font-medium">30-Day Guarantee</h4>
                <p className="text-sm text-muted-foreground text-center">
                  Full refund within 30 days, no questions asked
                </p>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                Secure payments processed by Stripe • Cancel anytime • No long-term contracts
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}