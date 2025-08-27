'use client';

import { SidebarUserNav } from '@/components/sidebar/sidebar-user-nav';
import { StoryNavigation } from '@/components/story-workspace/story-navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  useSidebar,
} from '@/components/ui/sidebar';
import Link from 'next/link';
import { FeedbackWidget } from '@/components/sidebar/feedback-widget';
import type { User } from '@/lib/auth';
import { Crimson_Text } from 'next/font/google';
import { useProjectContext } from '@/hooks/use-project-context';
import { useRouter } from 'next/navigation';

const crimson = Crimson_Text({
  weight: ['400', '700'],
  subsets: ['latin'],
  display: 'swap',
})

export function AppSidebar({ 
  user, 
  storyIntelligenceCounts,
  onDataUpdate 
}: { 
  user: User | undefined; 
  storyIntelligenceCounts?: {
    documentCount: number;
    characterCount: number;
    transcriptCount: number;
    workflowCount: number;
    guidelineCount: number;
  };
  onDataUpdate?: () => void;
}) {
  const { setOpenMobile } = useSidebar();
  const { projectId } = useProjectContext();
  const router = useRouter();

  const handleDataUpdate = () => {
    // Refresh the page to reload server-side data
    router.refresh();
    if (onDataUpdate) {
      onDataUpdate();
    }
  };

  return (
    <Sidebar className="shadow-none">
      <SidebarHeader>
        <SidebarMenu>
          <div className="flex flex-row justify-between items-center px-2">
            <Link
              href="/"
              onClick={() => setOpenMobile(false)}
              className="flex items-center gap-2"
            >
              <span className={`text-2xl ${crimson.className} hover:bg-accent rounded-md px-2 py-1 transition-colors muse-text-gradient`}>
                <span className="hidden md:inline">MUSE</span>
                <span className="inline md:hidden">🎭</span>
              </span>
            </Link>
          </div>
        </SidebarMenu>
      </SidebarHeader>
      
      <SidebarContent>
        <div className="px-2 space-y-4">
          {/* Story Intelligence Navigation - Unified Document Management */}
          <div className="py-2">
            <StoryNavigation 
              documentCount={storyIntelligenceCounts?.documentCount || 0}
              characterCount={storyIntelligenceCounts?.characterCount || 0}
              transcriptCount={storyIntelligenceCounts?.transcriptCount || 0}
              workflowCount={storyIntelligenceCounts?.workflowCount || 0}
              guidelineCount={storyIntelligenceCounts?.guidelineCount || 0}
              projectId={projectId || undefined}
              onDataUpdate={handleDataUpdate}
              enableWorkflowTracking={true}
            />
          </div>
        </div>
      </SidebarContent>
      
      <SidebarFooter>
        <div className="px-2 pb-2 flex flex-col space-y-2">
          {user && (
            <>
              <FeedbackWidget/>
              <SidebarUserNav user={user} />
            </>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}