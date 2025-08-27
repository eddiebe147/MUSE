import { redirect } from 'next/navigation';
import { getSession, getUser } from '@/app/(auth)/auth';
import { shouldShowOnboarding } from '@/lib/onboarding-helpers';
import { ProjectDashboard } from '@/components/writing-workflow/project-dashboard';

export default async function Page() {
  const session = await getSession();

  if (!session?.user?.id) { 
    // Redirect unauthenticated users to onboarding instead of login
    redirect('/onboarding'); 
  }

  const user = await getUser();
  if (!user) {
    redirect('/onboarding');
  }

  // Check if user should complete onboarding first
  const needsOnboarding = await shouldShowOnboarding(user.id);
  if (needsOnboarding) {
    redirect('/onboarding');
  }

  return (
    <ProjectDashboard 
      user={user}
    />
  );
} 