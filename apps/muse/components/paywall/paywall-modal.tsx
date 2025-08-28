'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Crown,
  Zap,
  Users,
  Star,
  Check,
  X,
  ArrowRight,
  Sparkles,
  Heart,
  Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PaywallTrigger, PRICING_PLANS, SubscriptionTier } from '@/types/profile';
import { useProfile } from '@/contexts/profile-context';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  trigger: PaywallTrigger;
  onUpgrade?: (tier: SubscriptionTier) => void;
  onSignUp?: () => void;
}

export function PaywallModal({ isOpen, onClose, trigger, onUpgrade, onSignUp }: PaywallModalProps) {
  const { profile, isGuest, preserveGuestWork } = useProfile();
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>(trigger.requiredTier);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleUpgrade = async (tier: SubscriptionTier) => {
    setIsProcessing(true);
    
    try {
      if (isGuest) {
        // Preserve guest work before signup
        preserveGuestWork();
        
        // Redirect to signup with tier preselected
        if (onSignUp) {
          onSignUp();
        } else {
          window.location.href = `/auth/signup?tier=${tier}&return=${window.location.pathname}`;
        }
      } else {
        // Existing user upgrading
        if (onUpgrade) {
          onUpgrade(tier);
        } else {
          window.location.href = `/profile/billing?upgrade=${tier}`;
        }
      }
    } catch (error) {
      console.error('Upgrade error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getTierIcon = (tier: SubscriptionTier) => {
    switch (tier) {
      case 'free': return <Heart className="size-5" />;
      case 'pro': return <Crown className="size-5" />;
      case 'team': return <Users className="size-5" />;
      default: return <Sparkles className="size-5" />;
    }
  };

  const getTierColor = (tier: SubscriptionTier) => {
    switch (tier) {
      case 'free': return 'text-green-600';
      case 'pro': return 'text-purple-600';
      case 'team': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const showTierComparison = trigger.requiredTier === 'pro' || trigger.requiredTier === 'team';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
            <Sparkles className="size-8 text-white" />
          </div>
          <DialogTitle className="text-2xl font-bold">{trigger.title}</DialogTitle>
          <p className="text-muted-foreground text-lg">{trigger.description}</p>
        </DialogHeader>

        {/* Guest User - Sign Up First */}
        {isGuest && trigger.requiredTier === 'free' && (
          <div className="space-y-6">
            <Card className="border-2 border-green-200 bg-green-50/50">
              <CardContent className="p-6 text-center space-y-4">
                <div className="flex items-center justify-center gap-2">
                  <Shield className="size-5 text-green-600" />
                  <h3 className="text-lg font-semibold">Your work is safe!</h3>
                </div>
                <p className="text-green-700">
                  We'll preserve everything you've created and restore it after you sign up. 
                  Nothing will be lost.
                </p>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                size="lg"
                className="h-14 bg-green-600 hover:bg-green-700"
                onClick={() => handleUpgrade('free')}
                disabled={isProcessing}
              >
                <Heart className="size-5 mr-2" />
                Get Started Free
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-14"
                onClick={onClose}
              >
                Maybe Later
              </Button>
            </div>
          </div>
        )}

        {/* Upgrade Required - Show Pricing */}
        {(!isGuest || trigger.requiredTier !== 'free') && showTierComparison && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {Object.entries(PRICING_PLANS).map(([tier, plan]) => {
                const tierKey = tier as SubscriptionTier;
                const isSelected = tierKey === selectedTier;
                const isRequired = tierKey === trigger.requiredTier;
                const canSelect = tierKey !== 'free' || isGuest;

                if (tierKey === 'free' && !isGuest) return null;

                return (
                  <Card 
                    key={tier}
                    className={cn(
                      "relative cursor-pointer transition-all duration-200",
                      isSelected && "ring-2 ring-purple-500 scale-105",
                      isRequired && "border-purple-500 shadow-lg",
                      !canSelect && "opacity-60"
                    )}
                    onClick={() => canSelect && setSelectedTier(tierKey)}
                  >
                    {plan.popular && (
                      <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-purple-600">
                        Most Popular
                      </Badge>
                    )}
                    {isRequired && (
                      <Badge className="absolute -top-2 right-4 bg-green-600">
                        Required
                      </Badge>
                    )}
                    
                    <CardContent className="p-6 space-y-4">
                      <div className="text-center">
                        <div className={cn("inline-flex items-center gap-2 mb-2", getTierColor(tierKey))}>
                          {getTierIcon(tierKey)}
                          <h3 className="text-xl font-bold">{plan.name}</h3>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="text-3xl font-bold">
                            ${plan.price}
                            <span className="text-sm text-muted-foreground">/{plan.interval}</span>
                          </div>
                        </div>
                      </div>

                      <ul className="space-y-2">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <Check className="size-4 text-green-500 mt-0.5 shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="flex gap-4 justify-center">
              <Button
                size="lg"
                className="px-8 h-12"
                onClick={() => handleUpgrade(selectedTier)}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  'Processing...'
                ) : (
                  <>
                    {trigger.ctaText}
                    <ArrowRight className="size-4 ml-2" />
                  </>
                )}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="px-8 h-12"
                onClick={onClose}
              >
                Maybe Later
              </Button>
            </div>
          </div>
        )}

        {/* Simple upgrade for specific features */}
        {!showTierComparison && !isGuest && (
          <div className="space-y-6 text-center">
            <div className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
              <Zap className="size-12 mx-auto mb-4 text-purple-600" />
              <h3 className="text-xl font-semibold mb-2">{trigger.upgradeMessage}</h3>
              <p className="text-muted-foreground">
                Upgrade to {PRICING_PLANS[trigger.requiredTier].name} for just 
                ${PRICING_PLANS[trigger.requiredTier].price}/{PRICING_PLANS[trigger.requiredTier].interval}
              </p>
            </div>

            <div className="flex gap-4 justify-center">
              <Button
                size="lg"
                className="px-8 h-12"
                onClick={() => handleUpgrade(trigger.requiredTier)}
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : trigger.ctaText}
                <Crown className="size-4 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="px-8 h-12"
                onClick={onClose}
              >
                Not Now
              </Button>
            </div>
          </div>
        )}

        {/* Trust indicators */}
        <div className="border-t pt-4 mt-6">
          <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Shield className="size-3" />
              <span>Secure payments</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="size-3" />
              <span>30-day money back</span>
            </div>
            <div className="flex items-center gap-1">
              <Zap className="size-3" />
              <span>Instant activation</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}