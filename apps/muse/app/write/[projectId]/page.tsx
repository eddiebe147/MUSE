import { notFound, redirect } from 'next/navigation';
import { getUser } from '@/app/(auth)/auth';
import { CanvasInterface } from '@/components/writing-canvas/canvas-interface';
import { shouldShowOnboarding } from '@/lib/onboarding-helpers';
import { ProfileProvider } from '@/contexts/profile-context';

export const dynamic = 'auto';
export const dynamicParams = true;

export default async function WritePage(props: { params: Promise<{ projectId: string }> }) {
  const params = await props.params;
  
  try {
    const { projectId } = params;

    // Check if this is a guest session (guest-prefixed) or authenticated session
    const isGuestSession = projectId.startsWith('guest-');
    let user = null;
    let userProfile = null;

    // Validate projectId format
    if (isGuestSession) {
      // Guest sessions have format: guest-timestamp-randomstring
      const guestRegex = /^guest-\d+-[a-z0-9]+$/;
      if (!guestRegex.test(projectId)) {
        console.warn(`[WritePage] Invalid guest project ID format: ${projectId}`);
        return notFound(); 
      }
    } else {
      // Regular projects should be UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(projectId)) {
        console.warn(`[WritePage] Invalid project ID format: ${projectId}`);
        return notFound(); 
      }

      // For authenticated projects, verify user access
      user = await getUser();
      if (!user) {
        console.warn(`[WritePage] Unauthenticated access to private project. Redirecting to onboarding.`);
        redirect('/onboarding');
      }

      // Check if user should complete onboarding first
      const needsOnboarding = await shouldShowOnboarding(user.id);
      if (needsOnboarding) {
        redirect('/onboarding');
      }

      // TODO: Get user profile for authenticated users
      // userProfile = await getUserProfile(user.id);
    }

    // TODO: Load project data from database based on projectId and user access
    // For now, we'll pass mock initial data
    const initialData = {
      transcript: '',
      phase1: '',
      phase2: [],
      phase3: [],
      phase4: null
    };
    
    return (
      <ProfileProvider initialProfile={userProfile}>
        <div className="min-h-screen bg-background">
          <CanvasInterface 
            projectId={projectId}
            initialData={initialData}
            isGuestSession={isGuestSession}
          />
        </div>
      </ProfileProvider>
    );
  } catch (error) {
    console.error(`[WritePage] Page error for project ${params.projectId}:`, error);
    return notFound();
  }
}