import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getUserById, updateUserProfile } from '@/lib/db/queries';
import { getActiveSubscriptionByUserId } from '@/lib/db/queries';
import { UserProfile, SubscriptionTier, SubscriptionStatus } from '@/types/profile';

export const dynamic = 'force-dynamic';

/**
 * GET /api/user/profile
 * Returns current user profile with subscription information
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    
    // Get user data
    const user = await getUserById({ userId });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get subscription data
    let tier: SubscriptionTier = 'free';
    let status: SubscriptionStatus = 'active';
    
    if (process.env.STRIPE_ENABLED === 'true') {
      const subscription = await getActiveSubscriptionByUserId({ userId });
      
      if (subscription) {
        // Map subscription to our tier system
        if (subscription.status === 'active' || subscription.status === 'trialing') {
          // Determine tier based on price ID or metadata
          // This would need to be customized based on your Stripe setup
          if (subscription.priceId === process.env.STRIPE_PRO_MONTHLY_PRICE_ID || 
              subscription.priceId === process.env.STRIPE_PRO_YEARLY_PRICE_ID) {
            tier = 'pro';
          } else {
            tier = 'team'; // Assuming any other paid plan is team
          }
        }
        status = subscription.status as SubscriptionStatus;
      }
    } else {
      // Development mode - assume pro tier
      tier = 'pro';
    }

    const profile: UserProfile = {
      id: user.id,
      email: user.email,
      name: user.name || undefined,
      avatar: user.image || undefined,
      createdAt: user.createdAt || new Date(),
      tier,
      status,
      isGuest: false,
    };

    return NextResponse.json(profile);
  } catch (error) {
    console.error('[API /user/profile] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/user/profile
 * Updates user profile information
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    
    // Validate input
    const updates: { name?: string; email?: string } = {};
    
    if (body.name && typeof body.name === 'string') {
      updates.name = body.name.trim().substring(0, 100);
    }
    
    if (body.email && typeof body.email === 'string') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(body.email)) {
        updates.email = body.email.trim().toLowerCase();
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid updates provided' }, { status: 400 });
    }

    // Update user profile
    const updatedUser = await updateUserProfile({ userId, ...updates });
    
    return NextResponse.json({ 
      success: true, 
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
      }
    });
  } catch (error) {
    console.error('[API /user/profile] Update error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}