import { notFound, redirect } from 'next/navigation';
import { getUser } from '@/app/(auth)/auth';
import { shouldShowOnboarding } from '@/lib/onboarding-helpers';

export const dynamic = 'auto';

export default async function WritePage() {
  try {
    const user = await getUser();
    if (!user) {
      redirect('/onboarding');
    }

    // Check if user should complete onboarding first
    const needsOnboarding = await shouldShowOnboarding(user.id);
    if (needsOnboarding) {
      redirect('/onboarding');
    }

    // Default project ID - in a real app, this would be user's default or most recent project
    const defaultProjectId = '550e8400-e29b-41d4-a716-446655440001';
    
    // Redirect to the canvas-first writing interface
    redirect(`/write/${defaultProjectId}`);
    
  } catch (error) {
    console.error(`[WritePage] Page error:`, error);
    return notFound();
  }
}