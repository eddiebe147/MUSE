'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { UserProfile, SubscriptionTier, UsageLimits, FeatureAccess, TIER_FEATURES, TIER_LIMITS } from '@/types/profile';

interface ProfileContextType {
  profile: UserProfile | null;
  usage: UsageLimits | null;
  features: FeatureAccess | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  refreshProfile: () => Promise<void>;
  updateUsage: (updates: Partial<UsageLimits>) => void;
  checkFeatureAccess: (feature: keyof FeatureAccess) => boolean;
  canUseFeature: (feature: keyof FeatureAccess, showUpgrade?: boolean) => boolean;
  upgradeRequired: (tier: SubscriptionTier) => boolean;
  
  // Guest mode helpers
  isGuest: boolean;
  preserveGuestWork: () => void;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function useProfile(): ProfileContextType {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}

interface ProfileProviderProps {
  children: ReactNode;
  initialProfile?: UserProfile | null;
}

export function ProfileProvider({ children, initialProfile }: ProfileProviderProps) {
  const [profile, setProfile] = useState<UserProfile | null>(initialProfile || null);
  const [usage, setUsage] = useState<UsageLimits | null>(null);
  const [features, setFeatures] = useState<FeatureAccess | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const isGuest = !profile || profile.isGuest;

  // Initialize guest profile if no user session
  useEffect(() => {
    if (!profile) {
      const guestProfile: UserProfile = {
        id: 'guest-' + Date.now(),
        tier: 'guest',
        status: 'active',
        isGuest: true,
        createdAt: new Date(),
      };
      setProfile(guestProfile);
    }
  }, [profile]);

  // Update features and usage when profile changes
  useEffect(() => {
    if (profile) {
      setFeatures(TIER_FEATURES[profile.tier]);
      
      // Load usage from localStorage for guest/free users, API for paid users
      if (profile.isGuest) {
        const guestUsage = loadGuestUsage();
        setUsage(guestUsage);
      } else {
        loadUserUsage(profile.id);
      }
    }
    setLoading(false);
  }, [profile]);

  const loadGuestUsage = (): UsageLimits => {
    try {
      const saved = localStorage.getItem('muse_guest_usage');
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...TIER_LIMITS.guest, ...parsed };
      }
    } catch (error) {
      console.error('Failed to load guest usage:', error);
    }
    return { ...TIER_LIMITS.guest };
  };

  const saveGuestUsage = (newUsage: UsageLimits) => {
    try {
      localStorage.setItem('muse_guest_usage', JSON.stringify(newUsage));
    } catch (error) {
      console.error('Failed to save guest usage:', error);
    }
  };

  const loadUserUsage = async (userId: string) => {
    try {
      const response = await fetch(`/api/user/usage?userId=${userId}`);
      if (response.ok) {
        const userUsage = await response.json();
        setUsage(userUsage);
      } else {
        // Fallback to tier defaults
        setUsage({ ...TIER_LIMITS[profile?.tier || 'free'] });
      }
    } catch (error) {
      console.error('Failed to load user usage:', error);
      setUsage({ ...TIER_LIMITS[profile?.tier || 'free'] });
    }
  };

  const refreshProfile = async () => {
    if (isGuest) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/user/profile');
      if (response.ok) {
        const updatedProfile = await response.json();
        setProfile(updatedProfile);
      }
    } catch (error) {
      console.error('Failed to refresh profile:', error);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const updateUsage = (updates: Partial<UsageLimits>) => {
    if (!usage) return;

    const newUsage = { ...usage };
    
    // Merge updates
    Object.keys(updates).forEach(key => {
      const updateKey = key as keyof UsageLimits;
      if (updates[updateKey]) {
        newUsage[updateKey] = { ...newUsage[updateKey], ...updates[updateKey] };
      }
    });

    setUsage(newUsage);

    // Save usage
    if (isGuest) {
      saveGuestUsage(newUsage);
    } else if (profile) {
      // API call to save usage
      fetch('/api/user/usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: profile.id, usage: newUsage }),
      }).catch(error => console.error('Failed to save usage:', error));
    }
  };

  const checkFeatureAccess = (feature: keyof FeatureAccess): boolean => {
    return features?.[feature] ?? false;
  };

  const canUseFeature = (feature: keyof FeatureAccess, showUpgrade = true): boolean => {
    if (!features || !usage) return false;
    
    // Check if feature is enabled for tier
    if (!features[feature]) {
      if (showUpgrade) {
        // Could trigger upgrade modal here
        console.log(`Feature ${feature} requires upgrade`);
      }
      return false;
    }

    // Check usage limits for specific features
    switch (feature) {
      case 'arcGenerator':
        if (!usage.arcAnalyses.unlimited && usage.arcAnalyses.used >= usage.arcAnalyses.limit) {
          if (showUpgrade) {
            // Could trigger upgrade modal here
            console.log('ARC Generator limit reached');
          }
          return false;
        }
        break;
        
      case 'saveProjects':
        if (!usage.projects.unlimited && usage.projects.used >= usage.projects.limit) {
          return false;
        }
        break;
        
      case 'advancedExports':
        if (!usage.exports.unlimited && usage.exports.used >= usage.exports.limit) {
          if (showUpgrade) {
            console.log('Export limit reached');
          }
          return false;
        }
        break;
        
      case 'knowledgeBase':
        // Allow basic usage but may have storage limits
        break;
    }

    return true;
  };

  const upgradeRequired = (tier: SubscriptionTier): boolean => {
    if (!profile) return true;
    
    const tierOrder: Record<SubscriptionTier, number> = {
      guest: 0,
      free: 1,
      pro: 2,
      team: 3,
    };
    
    return tierOrder[profile.tier] < tierOrder[tier];
  };

  const preserveGuestWork = () => {
    // Store current guest work in localStorage to restore after signup
    const guestData = {
      projects: localStorage.getItem('muse_guest_projects'),
      knowledgeBase: localStorage.getItem('muse_global_knowledge_base'),
      usage: localStorage.getItem('muse_guest_usage'),
      timestamp: Date.now(),
    };
    
    localStorage.setItem('muse_guest_preservation', JSON.stringify(guestData));
  };

  const value: ProfileContextType = {
    profile,
    usage,
    features,
    loading,
    error,
    refreshProfile,
    updateUsage,
    checkFeatureAccess,
    canUseFeature,
    upgradeRequired,
    isGuest,
    preserveGuestWork,
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
}