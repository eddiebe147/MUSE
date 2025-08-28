'use client';

import { useState, useCallback } from 'react';
import { useProfile } from '@/contexts/profile-context';
import { PaywallTrigger, PAYWALL_TRIGGERS, FeatureAccess } from '@/types/profile';

export interface PaywallResult {
  allowed: boolean;
  showPaywall?: () => void;
  trigger?: PaywallTrigger;
}

export function usePaywall() {
  const { profile, usage, canUseFeature, updateUsage, isGuest } = useProfile();
  const [currentTrigger, setCurrentTrigger] = useState<PaywallTrigger | null>(null);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);

  const checkFeatureAccess = useCallback((feature: keyof FeatureAccess): PaywallResult => {
    // Always allow access during development if not configured
    if (process.env.NODE_ENV === 'development' && !profile) {
      return { allowed: true };
    }

    const allowed = canUseFeature(feature, false);
    
    if (!allowed) {
      // Find appropriate trigger for this feature
      const triggerKey = Object.keys(PAYWALL_TRIGGERS).find(key => 
        PAYWALL_TRIGGERS[key].feature === feature
      );
      
      const trigger = triggerKey ? PAYWALL_TRIGGERS[triggerKey] : null;
      
      return {
        allowed: false,
        trigger,
        showPaywall: () => {
          if (trigger) {
            setCurrentTrigger(trigger);
            setIsPaywallOpen(true);
          }
        }
      };
    }

    return { allowed: true };
  }, [canUseFeature, profile]);

  // Specific feature checks with usage tracking
  const checkSaveProject = useCallback((): PaywallResult => {
    if (isGuest) {
      return {
        allowed: false,
        trigger: PAYWALL_TRIGGERS.saveProject,
        showPaywall: () => {
          setCurrentTrigger(PAYWALL_TRIGGERS.saveProject);
          setIsPaywallOpen(true);
        }
      };
    }

    return checkFeatureAccess('saveProjects');
  }, [isGuest, checkFeatureAccess]);

  const checkARCAnalysis = useCallback((): PaywallResult => {
    const result = checkFeatureAccess('arcGenerator');
    
    if (result.allowed && usage) {
      // Track usage if allowed
      updateUsage({
        arcAnalyses: {
          ...usage.arcAnalyses,
          used: usage.arcAnalyses.used + 1
        }
      });
    }

    return result;
  }, [checkFeatureAccess, usage, updateUsage]);

  const checkExport = useCallback((): PaywallResult => {
    const result = checkFeatureAccess('advancedExports');
    
    if (result.allowed && usage) {
      // Track export usage
      updateUsage({
        exports: {
          ...usage.exports,
          used: usage.exports.used + 1
        }
      });
    }

    return result;
  }, [checkFeatureAccess, usage, updateUsage]);

  const checkKnowledgeBaseUpload = useCallback((fileSize: number = 0): PaywallResult => {
    if (!usage) return { allowed: false };

    // Check file count limit
    const fileResult = checkFeatureAccess('knowledgeBase');
    if (!fileResult.allowed) return fileResult;

    // Check storage size limit
    if (!usage.storageSize.unlimited) {
      const wouldExceed = (usage.storageSize.used + fileSize) > usage.storageSize.limit;
      if (wouldExceed) {
        return {
          allowed: false,
          trigger: PAYWALL_TRIGGERS.knowledgeBaseLimit,
          showPaywall: () => {
            setCurrentTrigger(PAYWALL_TRIGGERS.knowledgeBaseLimit);
            setIsPaywallOpen(true);
          }
        };
      }
    }

    return { allowed: true };
  }, [checkFeatureAccess, usage]);

  const checkMultipleProjects = useCallback((): PaywallResult => {
    if (!usage || usage.projects.unlimited) {
      return { allowed: true };
    }

    if (usage.projects.used >= usage.projects.limit) {
      return {
        allowed: false,
        trigger: PAYWALL_TRIGGERS.multipleProjects,
        showPaywall: () => {
          setCurrentTrigger(PAYWALL_TRIGGERS.multipleProjects);
          setIsPaywallOpen(true);
        }
      };
    }

    return { allowed: true };
  }, [usage]);

  // Smart paywall triggers based on user behavior
  const triggerSavePrompt = useCallback(() => {
    // Show save prompt when user has been working for a while
    if (isGuest) {
      setCurrentTrigger(PAYWALL_TRIGGERS.saveProject);
      setIsPaywallOpen(true);
    }
  }, [isGuest]);

  const triggerUpgradeAfterExports = useCallback(() => {
    // Show upgrade prompt after user has used free exports
    if (usage?.exports.used === usage?.exports.limit && usage?.exports.limit > 0) {
      setCurrentTrigger(PAYWALL_TRIGGERS.advancedExport);
      setIsPaywallOpen(true);
    }
  }, [usage]);

  // Close paywall
  const closePaywall = useCallback(() => {
    setIsPaywallOpen(false);
    setCurrentTrigger(null);
  }, []);

  // Handle upgrade completion
  const handleUpgradeSuccess = useCallback(() => {
    closePaywall();
    // Could show success message or redirect
    window.location.reload(); // Refresh to get new user status
  }, [closePaywall]);

  return {
    // Feature checks
    checkFeatureAccess,
    checkSaveProject,
    checkARCAnalysis,
    checkExport,
    checkKnowledgeBaseUpload,
    checkMultipleProjects,
    
    // Smart triggers
    triggerSavePrompt,
    triggerUpgradeAfterExports,
    
    // Paywall state
    isPaywallOpen,
    currentTrigger,
    closePaywall,
    handleUpgradeSuccess,
  };
}