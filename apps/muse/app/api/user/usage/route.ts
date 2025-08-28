import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getUserUsage, updateUserUsage } from '@/lib/db/queries';
import { UsageLimits, TIER_LIMITS } from '@/types/profile';

export const dynamic = 'force-dynamic';

/**
 * GET /api/user/usage
 * Returns current user usage statistics
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    
    // Get usage data from database
    let usage = await getUserUsage({ userId });
    
    // If no usage record exists, create default based on user's tier
    if (!usage) {
      // Get user's current tier from profile
      const profileResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/user/profile`);
      let userTier = 'free';
      
      if (profileResponse.ok) {
        const profile = await profileResponse.json();
        userTier = profile.tier || 'free';
      }
      
      usage = { ...TIER_LIMITS[userTier as keyof typeof TIER_LIMITS] };
      
      // Save initial usage record
      await updateUserUsage({ userId, usage });
    }

    return NextResponse.json(usage);
  } catch (error) {
    console.error('[API /user/usage] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/user/usage
 * Updates user usage statistics
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    
    // Validate input
    if (!body.usage || typeof body.usage !== 'object') {
      return NextResponse.json({ error: 'Invalid usage data' }, { status: 400 });
    }

    const updates: Partial<UsageLimits> = {};
    
    // Validate and sanitize usage updates
    if (body.usage.arcAnalyses) {
      const arc = body.usage.arcAnalyses;
      if (typeof arc.used === 'number' && arc.used >= 0) {
        updates.arcAnalyses = {
          used: Math.max(0, arc.used),
          limit: arc.limit || 0,
          unlimited: Boolean(arc.unlimited)
        };
      }
    }
    
    if (body.usage.projects) {
      const projects = body.usage.projects;
      if (typeof projects.used === 'number' && projects.used >= 0) {
        updates.projects = {
          used: Math.max(0, projects.used),
          limit: projects.limit || 0,
          unlimited: Boolean(projects.unlimited)
        };
      }
    }
    
    if (body.usage.exports) {
      const exports = body.usage.exports;
      if (typeof exports.used === 'number' && exports.used >= 0) {
        updates.exports = {
          used: Math.max(0, exports.used),
          limit: exports.limit || 0,
          unlimited: Boolean(exports.unlimited)
        };
      }
    }
    
    if (body.usage.storageSize) {
      const storage = body.usage.storageSize;
      if (typeof storage.used === 'number' && storage.used >= 0) {
        updates.storageSize = {
          used: Math.max(0, storage.used),
          limit: storage.limit || 0,
          unlimited: Boolean(storage.unlimited)
        };
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid usage updates provided' }, { status: 400 });
    }

    // Get current usage to merge with updates
    let currentUsage = await getUserUsage({ userId });
    
    if (!currentUsage) {
      // Create default usage if none exists
      const profileResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/user/profile`);
      let userTier = 'free';
      
      if (profileResponse.ok) {
        const profile = await profileResponse.json();
        userTier = profile.tier || 'free';
      }
      
      currentUsage = { ...TIER_LIMITS[userTier as keyof typeof TIER_LIMITS] };
    }

    // Merge updates with current usage
    const newUsage: UsageLimits = {
      arcAnalyses: updates.arcAnalyses || currentUsage.arcAnalyses,
      projects: updates.projects || currentUsage.projects,
      exports: updates.exports || currentUsage.exports,
      storageSize: updates.storageSize || currentUsage.storageSize
    };

    // Update usage in database
    const updatedUsage = await updateUserUsage({ userId, usage: newUsage });
    
    return NextResponse.json({ 
      success: true, 
      usage: updatedUsage 
    });
  } catch (error) {
    console.error('[API /user/usage] Update error:', error);
    return NextResponse.json({ error: 'Failed to update usage' }, { status: 500 });
  }
}