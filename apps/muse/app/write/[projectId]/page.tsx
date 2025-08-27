import { notFound, redirect } from 'next/navigation';
import { getUser } from '@/app/(auth)/auth';
import { CanvasInterface } from '@/components/writing-canvas/canvas-interface';
import { shouldShowOnboarding } from '@/lib/onboarding-helpers';

export const dynamic = 'auto';
export const dynamicParams = true;

export default async function WritePage(props: { params: Promise<{ projectId: string }> }) {
  const params = await props.params;
  
  try {
    const { projectId } = params;

    // Validate projectId format (should be UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(projectId)) {
      console.warn(`[WritePage] Invalid project ID format: ${projectId}`);
      return notFound(); 
    }

    const user = await getUser();
    if (!user) {
      console.warn(`[WritePage] User not found. Redirecting to onboarding.`);
      redirect('/onboarding');
    }

    // Check if user should complete onboarding first
    const needsOnboarding = await shouldShowOnboarding(user.id);
    if (needsOnboarding) {
      redirect('/onboarding');
    }

    // TODO: Load project data from database
    // For now, we'll pass mock initial data
    const initialData = {
      transcript: '',
      phase1: '',
      phase2: [],
      phase3: [],
      phase4: null
    };
    
    return (
      <div className="min-h-screen bg-background">
        <CanvasInterface 
          projectId={projectId}
          initialData={initialData}
        />
      </div>
    );
  } catch (error) {
    console.error(`[WritePage] Page error for project ${params.projectId}:`, error);
    return notFound();
  }
}