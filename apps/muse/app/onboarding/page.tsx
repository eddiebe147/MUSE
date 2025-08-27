import { redirect } from 'next/navigation';
import { getSession } from '@/app/(auth)/auth';
import { OnboardingExperience } from '@/components/onboarding';

export const metadata = {
  title: 'Welcome to MUSE - AI Story Development',
  description: 'Get started with MUSE, your AI-powered story development partner.',
};

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // Get session but don't require it - support guest mode
  const session = await getSession();
  const isGuest = !session?.user?.id;
  const resolvedSearchParams = await searchParams;

  // If user is already authenticated, skip onboarding and go to writing interface
  if (!isGuest) {
    redirect('/write');
  }

  return (
    <div className="min-h-screen">
      <OnboardingExperience 
        isGuest={isGuest}
        userId={session?.user?.id}
      />
    </div>
  );
}