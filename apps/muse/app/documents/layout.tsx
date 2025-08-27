import type { ReactNode } from 'react';
import { TranscriptDashboard } from '@/components/story-workspace/transcript-dashboard';
import { ResizablePanel } from '@/components/resizable-panel';
import { AppSidebar } from '@/components/sidebar/app-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { SuggestionOverlayProvider } from '@/components/suggestion-overlay-provider';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { getStoryIntelligenceCounts } from '@/lib/db/queries';

export const experimental_ppr = true;

export default async function DocumentsLayout({ children }: { children: ReactNode }) {
  const readonlyHeaders = await headers();
  const requestHeaders = new Headers(readonlyHeaders);
  const session = await auth.api.getSession({ headers: requestHeaders });
  const user = session?.user;
  const storyIntelligenceCounts = user?.id
    ? await getStoryIntelligenceCounts({ userId: user.id })
    : {
        documentCount: 0,
        characterCount: 0,
        transcriptCount: 0,
        workflowCount: 0,
        guidelineCount: 0,
      };
  const cookieHeader = readonlyHeaders.get('cookie') || '';
  const leftCookie = cookieHeader
    .split('; ')
    .find((row: string) => row.startsWith('sidebar_state_left='));
  const isLeftSidebarCollapsed = leftCookie
    ? leftCookie.split('=')[1] === 'false'
    : true;

  return (
      <SidebarProvider defaultOpenLeft={!isLeftSidebarCollapsed} defaultOpenRight={true}>
          <SuggestionOverlayProvider>
          <div className="flex flex-row h-dvh w-full bg-background">
          <AppSidebar user={user} storyIntelligenceCounts={storyIntelligenceCounts} />
          <main className="flex-1 flex flex-row min-w-0">
            <div className="flex-1 min-w-0 overflow-hidden border-r subtle-border">
              {children} 
            </div>
            <ResizablePanel 
              side="right"
              defaultSize={400} 
              minSize={320} 
              maxSize={600}
              className="border-l subtle-border transition-all duration-200"
            >
              <TranscriptDashboard />
            </ResizablePanel>
          </main>
        </div>
        </SuggestionOverlayProvider>
      </SidebarProvider>
  );
} 