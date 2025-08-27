import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, transcripts, story_projects } from '@muse/db';
import { eq } from 'drizzle-orm';
import { livingStoryManager, StoryChange } from '@/lib/living-story/change-manager';
import { z } from 'zod';

const updateRequestSchema = z.object({
  action: z.enum(['detect_changes', 'generate_updates', 'accept_change', 'reject_change', 'undo_change', 'get_pending', 'get_history']),
  phase: z.number().min(1).max(4).optional(),
  oldData: z.any().optional(),
  newData: z.any().optional(),
  changeId: z.string().optional()
});

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth.api.getSession({ 
      headers: request.headers 
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const transcriptId = params.id;
    const body = await request.json();
    
    // Validate request body
    const validation = updateRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Invalid request data',
        details: validation.error.issues
      }, { status: 400 });
    }

    const { action, phase, oldData, newData, changeId } = validation.data;

    // Fetch transcript to verify ownership
    const [transcript] = await db.select()
      .from(transcripts)
      .where(eq(transcripts.id, transcriptId))
      .limit(1);

    if (!transcript) {
      return NextResponse.json({ error: 'Transcript not found' }, { status: 404 });
    }

    // Verify ownership through project
    const [project] = await db.select()
      .from(story_projects)
      .where(eq(story_projects.id, transcript.story_project_id))
      .limit(1);

    if (!project || project.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized access to transcript' }, { status: 403 });
    }

    // Handle different actions
    switch (action) {
      case 'detect_changes': {
        if (!phase || !oldData || !newData) {
          return NextResponse.json({ error: 'Missing required data for change detection' }, { status: 400 });
        }

        const changes = await livingStoryManager.detectChanges(
          transcriptId,
          session.user.id,
          phase,
          oldData,
          newData
        );

        return NextResponse.json({
          success: true,
          changes,
          message: `Detected ${changes.length} changes in Phase ${phase}`
        });
      }

      case 'generate_updates': {
        if (!changeId) {
          return NextResponse.json({ error: 'Change ID required for generating updates' }, { status: 400 });
        }

        // Get the source change from history
        const sourceChange = livingStoryManager.getChangeHistory(transcriptId)
          .find(c => c.id === changeId);

        if (!sourceChange) {
          return NextResponse.json({ error: 'Source change not found' }, { status: 404 });
        }

        // Get current story data from transcript
        const currentStoryData = {
          phase1: transcript.metadata?.story_summary,
          phase2: transcript.metadata?.scene_structure,
          phase3: transcript.metadata?.scene_beats,
          phase4: null // Phase 4 is generated, not stored
        };

        const autoUpdates = await livingStoryManager.generateAutoUpdates(
          transcriptId,
          session.user.id,
          sourceChange,
          currentStoryData
        );

        return NextResponse.json({
          success: true,
          autoUpdates,
          message: `Generated ${autoUpdates.length} auto-updates`
        });
      }

      case 'accept_change': {
        if (!changeId) {
          return NextResponse.json({ error: 'Change ID required' }, { status: 400 });
        }

        const success = await livingStoryManager.acceptChange(changeId);
        if (!success) {
          return NextResponse.json({ error: 'Change not found or already processed' }, { status: 404 });
        }

        // Get the accepted change to apply it to the database
        const change = livingStoryManager.getChangeHistory(transcriptId)
          .find(c => c.id === changeId && c.status === 'accepted');

        if (change) {
          await applyChangeToDatabase(transcriptId, change);
        }

        return NextResponse.json({
          success: true,
          message: 'Change accepted and applied'
        });
      }

      case 'reject_change': {
        if (!changeId) {
          return NextResponse.json({ error: 'Change ID required' }, { status: 400 });
        }

        const success = await livingStoryManager.rejectChange(changeId);
        if (!success) {
          return NextResponse.json({ error: 'Change not found or already processed' }, { status: 404 });
        }

        return NextResponse.json({
          success: true,
          message: 'Change rejected'
        });
      }

      case 'undo_change': {
        if (!changeId) {
          return NextResponse.json({ error: 'Change ID required' }, { status: 400 });
        }

        const oldValue = await livingStoryManager.undoChange(changeId);
        if (oldValue === null) {
          return NextResponse.json({ error: 'Change not found or cannot be undone' }, { status: 404 });
        }

        // Apply the undo to the database
        const undoChange = livingStoryManager.getChangeHistory(transcriptId)
          .find(c => c.reason.includes(`Undo: `));

        if (undoChange) {
          await applyChangeToDatabase(transcriptId, undoChange);
        }

        return NextResponse.json({
          success: true,
          oldValue,
          message: 'Change undone successfully'
        });
      }

      case 'get_pending': {
        const pendingChanges = livingStoryManager.getPendingChanges(transcriptId);
        
        // Generate previews for all pending changes
        const changesWithPreviews = await Promise.all(
          pendingChanges.map(async (change) => {
            const preview = await livingStoryManager.generateChangePreview(change.id);
            return { change, preview };
          })
        );

        return NextResponse.json({
          success: true,
          pendingChanges: changesWithPreviews
        });
      }

      case 'get_history': {
        const history = livingStoryManager.getChangeHistory(transcriptId);
        return NextResponse.json({
          success: true,
          history
        });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error in living story API:', error);
    return NextResponse.json({ 
      error: 'Failed to process living story request' 
    }, { status: 500 });
  }
}

// Helper function to apply changes to the database
async function applyChangeToDatabase(transcriptId: string, change: StoryChange): Promise<void> {
  try {
    // Get current transcript
    const [transcript] = await db.select()
      .from(transcripts)
      .where(eq(transcripts.id, transcriptId))
      .limit(1);

    if (!transcript) return;

    // Update the appropriate phase in metadata
    const updatedMetadata = { ...transcript.metadata };

    switch (change.phase) {
      case 1:
        updatedMetadata.story_summary = change.newValue;
        break;
      case 2:
        updatedMetadata.scene_structure = change.newValue;
        break;
      case 3:
        updatedMetadata.scene_beats = change.newValue;
        break;
      case 4:
        // Phase 4 is generated, not stored permanently
        break;
    }

    // Update the transcript in database
    await db.update(transcripts)
      .set({ 
        metadata: updatedMetadata,
        updated_at: new Date()
      })
      .where(eq(transcripts.id, transcriptId));

  } catch (error) {
    console.error('Error applying change to database:', error);
    throw error;
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth.api.getSession({ 
      headers: request.headers 
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const transcriptId = params.id;
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    // Fetch transcript to verify ownership
    const [transcript] = await db.select()
      .from(transcripts)
      .where(eq(transcripts.id, transcriptId))
      .limit(1);

    if (!transcript) {
      return NextResponse.json({ error: 'Transcript not found' }, { status: 404 });
    }

    // Verify ownership through project
    const [project] = await db.select()
      .from(story_projects)
      .where(eq(story_projects.id, transcript.story_project_id))
      .limit(1);

    if (!project || project.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized access to transcript' }, { status: 403 });
    }

    if (action === 'status') {
      const pendingChanges = livingStoryManager.getPendingChanges(transcriptId);
      const recentHistory = livingStoryManager.getChangeHistory(transcriptId).slice(0, 10);

      return NextResponse.json({
        transcript_id: transcriptId,
        pending_changes_count: pendingChanges.length,
        recent_changes_count: recentHistory.length,
        last_change: recentHistory[0]?.timestamp || null,
        living_story_active: true
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Error getting living story status:', error);
    return NextResponse.json({ 
      error: 'Failed to get living story status' 
    }, { status: 500 });
  }
}