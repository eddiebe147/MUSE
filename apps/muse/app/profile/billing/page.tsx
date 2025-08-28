import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { getUserById } from '@/lib/db/queries';
import { BillingPage } from '@/components/billing/billing-page';

export const metadata = {
  title: 'Billing & Subscription - MUSE',
  description: 'Manage your subscription and billing settings',
};

export default async function Billing({
  searchParams
}: {
  searchParams: Promise<{ upgrade?: string; return?: string }>;
}) {
  const params = await searchParams;
  const readonlyHeaders = await headers();
  const requestHeaders = new Headers(readonlyHeaders);
  const session = await auth.api.getSession({ headers: requestHeaders });
  
  if (!session?.user?.id) {
    // Redirect to signup with upgrade parameter if user is not authenticated
    const signupUrl = new URL('/auth/signup', process.env.NEXT_PUBLIC_APP_URL);
    if (params.upgrade) {
      signupUrl.searchParams.set('tier', params.upgrade);
    }
    if (params.return) {
      signupUrl.searchParams.set('return', params.return);
    } else {
      signupUrl.searchParams.set('return', '/profile/billing');
    }
    redirect(signupUrl.toString());
  }

  // Get user data
  const user = await getUserById({ userId: session.user.id });
  
  if (!user) {
    redirect('/auth/signin?message=user_not_found');
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <BillingPage 
        userId={session.user.id}
        initialUser={user}
        upgradeParam={params.upgrade}
        returnUrl={params.return}
      />
    </div>
  );
}