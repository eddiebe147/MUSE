/**
 * User Profile and Subscription Types for MUSE
 * Implements try-before-you-buy model with tier-based feature gating
 */

export type SubscriptionTier = 'guest' | 'free' | 'pro' | 'team';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';

export interface UserProfile {
  id: string;
  email?: string;
  name?: string;
  avatar?: string;
  createdAt: Date;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  isGuest: boolean;
}

export interface SubscriptionDetails {
  id?: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  currentPeriodEnd?: Date;
  currentPeriodStart?: Date;
  cancelAtPeriodEnd?: boolean;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  priceId?: string;
}

export interface UsageLimits {
  arcAnalyses: {
    used: number;
    limit: number;
    unlimited: boolean;
  };
  projects: {
    used: number;
    limit: number;
    unlimited: boolean;
  };
  exports: {
    used: number;
    limit: number;
    unlimited: boolean;
  };
  knowledgeFiles: {
    used: number;
    limit: number;
    unlimited: boolean;
  };
  storageSize: {
    used: number; // in bytes
    limit: number; // in bytes
    unlimited: boolean;
  };
}

export interface FeatureAccess {
  // Core Features
  basicWriting: boolean;
  arcGenerator: boolean;
  knowledgeBase: boolean;
  phaseWorkflow: boolean;
  canvasEditing: boolean;
  
  // Advanced Features
  unlimitedProjects: boolean;
  advancedExports: boolean;
  prioritySupport: boolean;
  betaFeatures: boolean;
  collaboration: boolean;
  customTraining: boolean;
  advancedAnalytics: boolean;
  
  // Save/Persistence Features
  saveProjects: boolean;
  cloudSync: boolean;
  versionHistory: boolean;
}

export interface PaywallTrigger {
  feature: keyof FeatureAccess;
  title: string;
  description: string;
  requiredTier: SubscriptionTier;
  upgradeMessage: string;
  ctaText: string;
}

// Tier Configuration
export const TIER_FEATURES: Record<SubscriptionTier, FeatureAccess> = {
  guest: {
    // Full writing experience without saving
    basicWriting: true,
    arcGenerator: true, // Limited usage
    knowledgeBase: true, // Limited storage
    phaseWorkflow: true,
    canvasEditing: true,
    
    unlimitedProjects: false,
    advancedExports: false,
    prioritySupport: false,
    betaFeatures: false,
    collaboration: false,
    customTraining: false,
    advancedAnalytics: false,
    
    saveProjects: false, // Key paywall trigger
    cloudSync: false,
    versionHistory: false,
  },
  
  free: {
    // Same as guest but can save
    basicWriting: true,
    arcGenerator: true, // 10/month limit
    knowledgeBase: true, // Limited storage
    phaseWorkflow: true,
    canvasEditing: true,
    
    unlimitedProjects: false, // Single project
    advancedExports: false, // 3 free exports
    prioritySupport: false,
    betaFeatures: false,
    collaboration: false,
    customTraining: false,
    advancedAnalytics: false,
    
    saveProjects: true,
    cloudSync: true,
    versionHistory: false,
  },
  
  pro: {
    // Full individual features
    basicWriting: true,
    arcGenerator: true,
    knowledgeBase: true,
    phaseWorkflow: true,
    canvasEditing: true,
    
    unlimitedProjects: true,
    advancedExports: true,
    prioritySupport: true,
    betaFeatures: true,
    collaboration: false, // Team feature
    customTraining: false, // Team feature
    advancedAnalytics: false, // Team feature
    
    saveProjects: true,
    cloudSync: true,
    versionHistory: true,
  },
  
  team: {
    // All features enabled
    basicWriting: true,
    arcGenerator: true,
    knowledgeBase: true,
    phaseWorkflow: true,
    canvasEditing: true,
    
    unlimitedProjects: true,
    advancedExports: true,
    prioritySupport: true,
    betaFeatures: true,
    collaboration: true,
    customTraining: true,
    advancedAnalytics: true,
    
    saveProjects: true,
    cloudSync: true,
    versionHistory: true,
  },
};

export const TIER_LIMITS: Record<SubscriptionTier, UsageLimits> = {
  guest: {
    arcAnalyses: { used: 0, limit: 5, unlimited: false },
    projects: { used: 0, limit: 0, unlimited: false }, // Can't save
    exports: { used: 0, limit: 0, unlimited: false },
    knowledgeFiles: { used: 0, limit: 3, unlimited: false },
    storageSize: { used: 0, limit: 10 * 1024 * 1024, unlimited: false }, // 10MB
  },
  
  free: {
    arcAnalyses: { used: 0, limit: 10, unlimited: false },
    projects: { used: 0, limit: 1, unlimited: false },
    exports: { used: 0, limit: 3, unlimited: false },
    knowledgeFiles: { used: 0, limit: 10, unlimited: false },
    storageSize: { used: 0, limit: 50 * 1024 * 1024, unlimited: false }, // 50MB
  },
  
  pro: {
    arcAnalyses: { used: 0, limit: 0, unlimited: true },
    projects: { used: 0, limit: 0, unlimited: true },
    exports: { used: 0, limit: 0, unlimited: true },
    knowledgeFiles: { used: 0, limit: 0, unlimited: true },
    storageSize: { used: 0, limit: 0, unlimited: true },
  },
  
  team: {
    arcAnalyses: { used: 0, limit: 0, unlimited: true },
    projects: { used: 0, limit: 0, unlimited: true },
    exports: { used: 0, limit: 0, unlimited: true },
    knowledgeFiles: { used: 0, limit: 0, unlimited: true },
    storageSize: { used: 0, limit: 0, unlimited: true },
  },
};

// Pricing Configuration
export const PRICING_PLANS = {
  free: {
    name: 'Story Starter',
    price: 0,
    currency: 'USD',
    interval: 'month',
    features: [
      'Basic Snow Leopard writing features',
      'Limited ARC Generator (10/month)',
      'Single project support', 
      'Community support',
      'Up to 10 knowledge files',
    ],
    cta: 'Get Started Free',
    popular: false,
  },
  
  pro: {
    name: 'Story Master',
    price: 19,
    currency: 'USD',
    interval: 'month',
    features: [
      'Full ARC Generator intelligence',
      'Unlimited projects and analyses',
      'Advanced export options',
      'Priority support',
      'Beta feature access',
      'Unlimited knowledge base',
    ],
    cta: 'Upgrade to Pro',
    popular: true,
  },
  
  team: {
    name: 'Story Studio',
    price: 39,
    currency: 'USD', 
    interval: 'month',
    features: [
      'Multi-user collaboration',
      'Shared story universes',
      'Advanced analytics',
      'Custom training options',
      'Dedicated support',
      'All Pro features',
    ],
    cta: 'Upgrade to Team',
    popular: false,
  },
};

// Paywall Trigger Configurations
export const PAYWALL_TRIGGERS: Record<string, PaywallTrigger> = {
  saveProject: {
    feature: 'saveProjects',
    title: 'Love what you created?',
    description: 'Sign up to save your project and continue working on it anytime.',
    requiredTier: 'free',
    upgradeMessage: 'Create a free account to save your work and access it from anywhere.',
    ctaText: 'Sign up to save',
  },
  
  multipleProjects: {
    feature: 'unlimitedProjects',
    title: 'Ready for your next story?',
    description: 'Upgrade to Pro to create unlimited projects and manage multiple stories.',
    requiredTier: 'pro',
    upgradeMessage: 'Pro users can create and manage unlimited projects.',
    ctaText: 'Upgrade to Pro',
  },
  
  advancedExport: {
    feature: 'advancedExports',
    title: 'Export your masterpiece',
    description: 'Export to professional formats like Final Draft, PDF, and more.',
    requiredTier: 'pro',
    upgradeMessage: 'Get unlimited exports and professional format options with Pro.',
    ctaText: 'Upgrade for exports',
  },
  
  arcAnalysisLimit: {
    feature: 'arcGenerator',
    title: 'ARC analysis limit reached',
    description: "You've used all your free ARC Generator analyses this month.",
    requiredTier: 'pro',
    upgradeMessage: 'Get unlimited ARC Generator analyses with Pro.',
    ctaText: 'Upgrade for unlimited',
  },
  
  knowledgeBaseLimit: {
    feature: 'knowledgeBase',
    title: 'Knowledge base full',
    description: "You've reached your file storage limit.",
    requiredTier: 'pro',
    upgradeMessage: 'Pro users get unlimited knowledge base storage.',
    ctaText: 'Upgrade for more storage',
  },
};