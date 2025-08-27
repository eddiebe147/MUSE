import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/app/(auth)/auth';
import { db, user_onboarding, story_projects } from '@muse/db';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { guestData } = body;

    if (!guestData) {
      return NextResponse.json({ error: 'No guest data provided' }, { status: 400 });
    }

    // Create project from guest data
    let createdProject = null;
    if (guestData.projectData) {
      const projectData = guestData.projectData;
      
      createdProject = await db
        .insert(story_projects)
        .values({
          userId,
          title: `${projectData.subcategory?.name || 'New'} Project`,
          description: `A new ${projectData.projectType?.name?.toLowerCase() || 'story'} project`,
          projectType: projectData.subcategory?.name || 'General',
          status: 'active',
          metadata: {
            onboardingData: projectData,
            template: projectData.template,
            workflow: projectData.workflow,
            materialAnalysis: projectData.materialAnalysis,
            convertedFromGuest: true,
            guestSessionId: guestData.id,
            conversionDate: new Date().toISOString()
          }
        })
        .returning();
    }

    // Save onboarding completion
    if (guestData.onboardingData || guestData.projectData) {
      const completionData = guestData.projectData || guestData.onboardingData;
      
      const existing = await db
        .select()
        .from(user_onboarding)
        .where(eq(user_onboarding.userId, userId))
        .limit(1);

      const onboardingUpdate = {
        completedFirstOnboarding: !!guestData.projectData,
        preferredFormats: completionData.subcategory ? [completionData.subcategory.name] : [],
        workflowPreferences: completionData.workflow?.customizations || null,
        lastProjectFormat: completionData.subcategory?.name || null,
        completionData: completionData,
        updatedAt: new Date()
      };

      if (existing.length > 0) {
        await db
          .update(user_onboarding)
          .set(onboardingUpdate)
          .where(eq(user_onboarding.userId, userId));
      } else {
        await db.insert(user_onboarding).values({
          userId,
          ...onboardingUpdate
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Guest data converted successfully',
      project: createdProject?.[0] || null
    });

  } catch (error) {
    console.error('Error converting guest data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to convert guest data' },
      { status: 500 }
    );
  }
}