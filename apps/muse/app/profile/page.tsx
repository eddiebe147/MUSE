import { ProfileDashboard } from '@/components/profile/profile-dashboard';
import Link from 'next/link';
import { Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Profile - MUSE',
  description: 'Manage your profile, subscription, and account settings',
};

export default async function Profile() {
  // Allow both guest and authenticated users
  // Guest users will see signup prompts, authenticated users see full profile
  // Session handling is done in the ProfileContext
  
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        {/* Navigation */}
        <div className="mb-6">
          <Link href="/">
            <Button variant="outline" size="sm">
              <Home className="size-4 mr-2" />
              Back to MUSE Home
            </Button>
          </Link>
        </div>

        <ProfileDashboard />
      </div>
    </div>
  );
}