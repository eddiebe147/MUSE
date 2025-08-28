'use client';

import React, { useState, useEffect } from 'react';
import { PaywallModal } from './paywall-modal';
import { usePaywall } from '@/hooks/use-paywall';
import { useProfile } from '@/contexts/profile-context';
import { SubscriptionTier } from '@/types/profile';

interface PaywallProviderProps {
  children: React.ReactNode;
}

export function PaywallProvider({ children }: PaywallProviderProps) {
  const { 
    isPaywallOpen, 
    currentTrigger, 
    closePaywall, 
    handleUpgradeSuccess 
  } = usePaywall();
  
  const { refreshProfile } = useProfile();
  
  const handleUpgrade = async (tier: SubscriptionTier) => {
    try {
      // Redirect to billing page with selected tier
      window.location.href = `/profile/billing?upgrade=${tier}`;
    } catch (error) {
      console.error('Upgrade redirect failed:', error);
    }
  };

  const handleSignUp = async () => {
    try {
      // Redirect to signup page
      window.location.href = `/auth/signup?return=${encodeURIComponent(window.location.pathname)}`;
    } catch (error) {
      console.error('Signup redirect failed:', error);
    }
  };

  return (
    <>
      {children}
      {currentTrigger && (
        <PaywallModal
          isOpen={isPaywallOpen}
          onClose={closePaywall}
          trigger={currentTrigger}
          onUpgrade={handleUpgrade}
          onSignUp={handleSignUp}
        />
      )}
    </>
  );
}