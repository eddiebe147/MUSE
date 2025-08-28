import { TestDashboard } from '@/components/profile/test-dashboard';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import Link from 'next/link';
import { ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Profile System Test - MUSE',
  description: 'Test the complete try-before-you-buy user journey',
};

export default async function ProfileTest() {
  const readonlyHeaders = await headers();
  const requestHeaders = new Headers(readonlyHeaders);
  const session = await auth.api.getSession({ headers: requestHeaders });

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* Navigation */}
      <div className="mb-6 flex items-center gap-4">
        <Link href="/">
          <Button variant="outline" size="sm">
            <Home className="size-4 mr-2" />
            Back to MUSE Home
          </Button>
        </Link>
        <Link href="/profile">
          <Button variant="outline" size="sm">
            <ArrowLeft className="size-4 mr-2" />
            Main Profile
          </Button>
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Profile System Test</h1>
        <p className="text-muted-foreground">
          Test the complete try-before-you-buy user journey including guest mode, 
          paywall triggers, and subscription management.
        </p>
      </div>
      
      <TestDashboard initialSession={session} />
    </div>
  );
}