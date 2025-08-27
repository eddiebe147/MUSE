import { db, user_onboarding, story_projects } from '@muse/db';
import { eq } from 'drizzle-orm';

export interface OnboardingData {
  hasCompletedOnboarding: boolean;
  preferredFormats?: string[];
  lastProjectFormat?: string;
  onboardingStep?: number;
}

/**
 * Check if user has completed onboarding and get their preferences
 */
export async function getUserOnboardingStatus(userId: string): Promise<OnboardingData> {
  try {
    const result = await db
      .select()
      .from(user_onboarding)
      .where(eq(user_onboarding.user_id, userId))
      .limit(1);

    if (result.length === 0) {
      return {
        hasCompletedOnboarding: false,
        onboardingStep: 1
      };
    }

    const onboarding = result[0];
    return {
      hasCompletedOnboarding: onboarding.completed_first_onboarding,
      preferredFormats: onboarding.preferred_formats as string[] || [],
      lastProjectFormat: onboarding.last_project_format || undefined,
      onboardingStep: onboarding.onboarding_step || 1
    };
  } catch (error) {
    console.error('Error getting user onboarding status:', error);
    return {
      hasCompletedOnboarding: false,
      onboardingStep: 1
    };
  }
}

/**
 * Get the appropriate redirect URL based on user's state
 */
export async function getRedirectAfterAuth(userId: string): Promise<string> {
  const onboardingStatus = await getUserOnboardingStatus(userId);
  
  if (!onboardingStatus.hasCompletedOnboarding) {
    return '/onboarding';
  }

  // Check if user has any existing projects
  const projects = await db
    .select()
    .from(story_projects)
    .where(eq(story_projects.userId, userId))
    .limit(1);

  if (projects.length === 0) {
    // No projects yet, send to onboarding to create first project
    return '/onboarding';
  }

  // User has completed onboarding and has projects, go to documents
  return '/documents';
}

/**
 * Mark user as having completed onboarding
 */
export async function markOnboardingComplete(
  userId: string, 
  projectData: any
): Promise<void> {
  try {
    const existing = await db
      .select()
      .from(user_onboarding)
      .where(eq(user_onboarding.user_id, userId))
      .limit(1);

    const updateData = {
      completed_first_onboarding: true,
      preferred_formats: projectData.subcategory ? [projectData.subcategory.name] : [],
      workflow_preferences: projectData.workflow?.customizations || null,
      last_project_format: projectData.subcategory?.name || null,
      completion_data: projectData,
      updated_at: new Date()
    };

    if (existing.length > 0) {
      await db
        .update(user_onboarding)
        .set(updateData)
        .where(eq(user_onboarding.user_id, userId));
    } else {
      await db.insert(user_onboarding).values({
        user_id: userId,
        ...updateData
      });
    }
  } catch (error) {
    console.error('Error marking onboarding complete:', error);
    throw error;
  }
}

/**
 * Create a story project from onboarding data
 */
export async function createProjectFromOnboarding(
  userId: string,
  projectData: any
): Promise<any> {
  try {
    const projectTitle = projectData.projectTitle || 
      `${projectData.subcategory?.name || 'New'} Project`;
    
    const projectDescription = projectData.description || 
      `A new ${projectData.projectType?.name?.toLowerCase() || 'story'} project`;

    const newProject = await db
      .insert(story_projects)
      .values({
        user_id: userId,
        title: projectTitle,
        description: projectDescription,
        status: 'active',
        metadata: {
          onboardingData: projectData,
          template: projectData.template,
          workflow: projectData.workflow,
          materialAnalysis: projectData.materialAnalysis,
          projectTypeSelection: {
            projectType: projectData.projectType,
            subcategory: projectData.subcategory
          },
          createdViaOnboarding: true,
          createdAt: new Date().toISOString()
        }
      })
      .returning();

    return newProject[0];
  } catch (error) {
    console.error('Error creating project from onboarding:', error);
    throw error;
  }
}

/**
 * Check if user should see onboarding (used in middleware/pages)
 */
export async function shouldShowOnboarding(userId: string): Promise<boolean> {
  const status = await getUserOnboardingStatus(userId);
  return !status.hasCompletedOnboarding;
}

/**
 * Track onboarding step progress
 */
export async function updateOnboardingStep(
  userId: string, 
  step: number, 
  stepData?: any
): Promise<void> {
  try {
    const existing = await db
      .select()
      .from(user_onboarding)
      .where(eq(user_onboarding.user_id, userId))
      .limit(1);

    const updateData = {
      onboarding_step: step,
      completion_data: stepData || null,
      updated_at: new Date()
    };

    if (existing.length > 0) {
      await db
        .update(user_onboarding)
        .set(updateData)
        .where(eq(user_onboarding.user_id, userId));
    } else {
      await db.insert(user_onboarding).values({
        user_id: userId,
        ...updateData
      });
    }
  } catch (error) {
    console.error('Error updating onboarding step:', error);
    // Don't throw - this is non-critical tracking
  }
}