# MUSE Paywall System Integration Guide

## Overview

The MUSE Paywall System implements a "try-before-you-buy" model with guest-first user experience. Users can fully explore MUSE features without creating an account, and are prompted to sign up only when they want to save their work or use premium features.

## Key Components

### 1. Profile Context (`/contexts/profile-context.tsx`)
- Global state management for user profiles, usage limits, and feature access
- Handles guest mode initialization and work preservation
- Provides hooks for checking feature access and upgrade requirements

### 2. Paywall Hook (`/hooks/use-paywall.tsx`)
- Core paywall logic and feature access checking
- Specific checks for different features (save, export, ARC analysis, etc.)
- Smart triggering based on user behavior

### 3. Paywall Modal (`/components/paywall/paywall-modal.tsx`)
- Beautiful, conversion-optimized upgrade prompts
- Handles both guest signup and existing user upgrades
- Shows pricing comparison and feature benefits

### 4. Feature Gate (`/components/paywall/feature-gate.tsx`)
- Wrapper component for protecting premium features
- Can be used declaratively around any UI elements
- Provides fallback UI when access is blocked

## Integration Examples

### Basic Feature Protection

```tsx
import { FeatureGate } from '@/components/paywall/feature-gate';

// Wrap any component or UI that requires premium access
<FeatureGate feature="arcGenerator">
  <ARCGeneratorComponent />
</FeatureGate>
```

### Using the Paywall Hook

```tsx
import { usePaywall } from '@/hooks/use-paywall';

function SaveButton() {
  const { checkSaveProject } = usePaywall();
  
  const handleSave = () => {
    const result = checkSaveProject();
    
    if (result.allowed) {
      // Proceed with save logic
      saveProject();
    } else {
      // Paywall will be shown automatically
      if (result.showPaywall) {
        result.showPaywall();
      }
    }
  };
  
  return <Button onClick={handleSave}>Save Project</Button>;
}
```

### Using Feature Gate Hook

```tsx
import { useFeatureGate } from '@/components/paywall/feature-gate';

function ExportComponent() {
  const { allowed, showPaywall } = useFeatureGate('advancedExports');
  
  if (!allowed) {
    return (
      <div className="text-center p-4">
        <p>Advanced exports require a Pro subscription</p>
        <Button onClick={showPaywall}>Upgrade Now</Button>
      </div>
    );
  }
  
  return <ExportInterface />;
}
```

## Tier Configuration

Edit `/types/profile.ts` to modify tiers, features, and pricing:

```typescript
export const TIER_FEATURES: Record<SubscriptionTier, FeatureAccess> = {
  guest: {
    saveProjects: false,      // Triggers signup
    advancedExports: false,   // Pro feature
    arcGenerator: false,      // Pro feature
    knowledgeBase: true,      // Basic access
    teamCollaboration: false, // Team feature
  },
  // ... other tiers
};

export const PRICING_PLANS = {
  pro: {
    name: 'Story Master',
    price: 19,
    interval: 'month',
    features: [...],
    popular: true,
  },
  // ... other plans
};
```

## API Endpoints

### Profile Management
- `GET /api/user/profile` - Get user profile with subscription info
- `PUT /api/user/profile` - Update user profile

### Usage Tracking
- `GET /api/user/usage` - Get user usage statistics
- `POST /api/user/usage` - Update usage counters

### Stripe Integration
- `POST /api/stripe/create-checkout-session` - Create payment session

## Environment Variables

```env
# Stripe Configuration
STRIPE_ENABLED=true
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRO_MONTHLY_PRICE_ID=price_...
STRIPE_PRO_YEARLY_PRICE_ID=price_...
STRIPE_TEAM_MONTHLY_PRICE_ID=price_...
STRIPE_TEAM_YEARLY_PRICE_ID=price_...

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## User Journey Flow

1. **Guest Experience**: User starts as guest, can use basic features
2. **Smart Triggers**: Paywall appears when trying to save or use premium features
3. **Seamless Signup**: Work is preserved during account creation
4. **Instant Access**: Free tier unlocks immediately after signup
5. **Upgrade Path**: Clear upgrade prompts for premium features
6. **Payment Flow**: Stripe handles secure payment processing

## Testing

Visit `/profile/test` to test the complete user journey including:
- Guest mode functionality
- Feature access checking
- Paywall trigger testing
- Usage limit enforcement
- Smart upgrade prompts

## Advanced Usage

### Custom Paywall Triggers

```typescript
const { triggerSavePrompt, triggerUpgradeAfterExports } = usePaywall();

// Trigger save prompt after user has been working for a while
useEffect(() => {
  const timer = setTimeout(triggerSavePrompt, 5 * 60 * 1000); // 5 minutes
  return () => clearTimeout(timer);
}, []);

// Trigger upgrade prompt after hitting export limits
useEffect(() => {
  if (usage?.exports.used >= usage?.exports.limit) {
    triggerUpgradeAfterExports();
  }
}, [usage]);
```

### Work Preservation

```typescript
const { preserveGuestWork } = useProfile();

// Call before redirecting guest to signup
const handleSignup = () => {
  preserveGuestWork(); // Saves current work to localStorage
  window.location.href = '/auth/signup';
};
```

## Best Practices

1. **Guest-First**: Never block basic writing/creation features
2. **Clear Value**: Show specific benefits when requesting upgrade
3. **Smart Timing**: Trigger paywalls at high-engagement moments
4. **Preserve Work**: Always save user progress before authentication
5. **Progressive Disclosure**: Start with free features, upsell gradually

## Troubleshooting

### Common Issues

1. **Paywall not showing**: Check if `PaywallProvider` wraps your app
2. **Feature access incorrect**: Verify tier configuration in `/types/profile.ts`
3. **Usage not updating**: Check API endpoints and database queries
4. **Stripe errors**: Verify environment variables and price IDs

### Debug Mode

The system includes comprehensive logging. Check browser console for:
- Feature access decisions
- Usage limit calculations
- Paywall trigger events
- API request/response data