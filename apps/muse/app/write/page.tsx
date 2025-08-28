import { redirect } from 'next/navigation';
import { getUser } from '@/app/(auth)/auth';
import { shouldShowOnboarding } from '@/lib/onboarding-helpers';

export const dynamic = 'auto';

export default async function WritePage() {
  try {
    const user = await getUser();
    
    // If user is authenticated, check onboarding status
    if (user) {
      const needsOnboarding = await shouldShowOnboarding(user.id);
      if (needsOnboarding) {
        redirect('/onboarding');
      }
      // Redirect to their most recent project or create a new one
      redirect('/documents');
    }
    
    // For guest users, redirect to a new guest writing session
    // Generate a temporary project ID for guest session
    const guestProjectId = `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    redirect(`/write/${guestProjectId}`);
    
  } catch (error) {
    console.error('[WritePage] Error handling write page:', error);
    // Fallback to guest session on error
    const guestProjectId = `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    redirect(`/write/${guestProjectId}`);
  }
}