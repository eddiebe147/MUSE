'use client';

import React from 'react';
import { usePaywall, PaywallResult } from '@/hooks/use-paywall';
import { useProfile } from '@/contexts/profile-context';
import { FeatureAccess } from '@/types/profile';

interface FeatureGateProps {
  children: React.ReactNode;
  feature: keyof FeatureAccess;
  fallback?: React.ReactNode;
  onBlocked?: () => void;
  className?: string;
}

export function FeatureGate({ 
  children, 
  feature, 
  fallback,
  onBlocked,
  className 
}: FeatureGateProps) {
  const { checkFeatureAccess } = usePaywall();
  const { loading } = useProfile();
  
  // Don't render anything while profile is loading
  if (loading) {
    return (
      <div className={className}>
        <div className="animate-pulse bg-gray-200 rounded h-8 w-full" />
      </div>
    );
  }

  const result: PaywallResult = checkFeatureAccess(feature);
  
  if (!result.allowed) {
    // Call onBlocked callback if provided
    if (onBlocked) {
      onBlocked();
    }
    
    // Show fallback or default blocked message
    if (fallback) {
      return <div className={className}>{fallback}</div>;
    }
    
    return (
      <div className={className}>
        <div className="text-center p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
          <p className="text-gray-600">This feature requires an upgrade.</p>
          {result.showPaywall && (
            <button
              onClick={result.showPaywall}
              className="mt-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Upgrade Now
            </button>
          )}
        </div>
      </div>
    );
  }
  
  return <div className={className}>{children}</div>;
}

// Higher-order component version
export function withFeatureGate<P extends object>(
  Component: React.ComponentType<P>,
  feature: keyof FeatureAccess,
  fallback?: React.ReactNode
) {
  return function FeatureGatedComponent(props: P) {
    return (
      <FeatureGate feature={feature} fallback={fallback}>
        <Component {...props} />
      </FeatureGate>
    );
  };
}

// Hook version for more complex logic
export function useFeatureGate(feature: keyof FeatureAccess) {
  const { checkFeatureAccess } = usePaywall();
  const { loading } = useProfile();
  
  const result = checkFeatureAccess(feature);
  
  return {
    allowed: result.allowed,
    loading,
    showPaywall: result.showPaywall,
    trigger: result.trigger,
  };
}