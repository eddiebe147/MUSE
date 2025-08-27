import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/app/(auth)/auth';
import { db, user_onboarding, story_projects, story_templates } from '@muse/db';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get user onboarding data
    const onboardingData = await db
      .select()
      .from(user_onboarding)
      .where(eq(user_onboarding.userId, userId))
      .limit(1);

    // Get available templates
    const templates = await db
      .select()
      .from(story_templates)
      .where(eq(story_templates.isBuiltin, true));

    return NextResponse.json({
      onboarding: onboardingData[0] || null,
      templates
    });
  } catch (error) {
    console.error('Error fetching onboarding data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'complete_onboarding':
        return await completeOnboarding(userId, data);
      
      case 'update_onboarding_step':
        return await updateOnboardingStep(userId, data);
      
      case 'save_template_selection':
        return await saveTemplateSelection(userId, data);
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error processing onboarding action:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function completeOnboarding(userId: string, projectData: any) {
  try {
    // Import helper functions
    const { createProjectFromOnboarding, markOnboardingComplete } = await import('@/lib/onboarding-helpers');
    
    // Create the story project
    const newProject = await createProjectFromOnboarding(userId, projectData);

    // Mark onboarding as complete
    await markOnboardingComplete(userId, projectData);

    return NextResponse.json({
      success: true,
      project: newProject
    });
  } catch (error) {
    console.error('Error completing onboarding:', error);
    throw error;
  }
}

async function updateOnboardingStep(userId: string, data: any) {
  try {
    const { step, stepData } = data;
    
    const existing = await db
      .select()
      .from(user_onboarding)
      .where(eq(user_onboarding.userId, userId))
      .limit(1);

    const updateData = {
      onboardingStep: step,
      completionData: stepData,
      updatedAt: new Date()
    };

    if (existing.length > 0) {
      await db
        .update(user_onboarding)
        .set(updateData)
        .where(eq(user_onboarding.userId, userId));
    } else {
      await db.insert(user_onboarding).values({
        userId,
        ...updateData
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating onboarding step:', error);
    throw error;
  }
}

async function saveTemplateSelection(userId: string, templateData: any) {
  try {
    // This could be used to track template selections for analytics
    const existing = await db
      .select()
      .from(user_onboarding)
      .where(eq(user_onboarding.userId, userId))
      .limit(1);

    const currentData = existing[0]?.completionData || {};
    const updatedData = {
      ...currentData,
      templateSelection: templateData,
      lastUpdatedStep: 'template_selection'
    };

    if (existing.length > 0) {
      await db
        .update(user_onboarding)
        .set({
          completionData: updatedData,
          updatedAt: new Date()
        })
        .where(eq(user_onboarding.userId, userId));
    } else {
      await db.insert(user_onboarding).values({
        userId,
        completionData: updatedData
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving template selection:', error);
    throw error;
  }
}