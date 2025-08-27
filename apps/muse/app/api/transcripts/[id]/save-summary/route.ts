import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, transcripts, story_projects } from '@muse/db';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const saveSummarySchema = z.object({
  summary: z.string().min(1, 'Summary is required'),
  version: z.string(),
  metadata: z.object({
    genre_focus: z.string().optional(),
    emotional_core: z.string().optional(),
    hook_strength: z.number().optional(),
    reasoning: z.string().optional(),
    is_custom: z.boolean().optional()
  }).optional()
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
    const validation = saveSummarySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Invalid request data',
        details: validation.error.issues
      }, { status: 400 });
    }

    const { summary, version, metadata } = validation.data;

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

    // Update transcript metadata with story summary
    const updatedMetadata = {
      ...transcript.metadata,
      story_summary: {
        summary,
        version,
        metadata: metadata || {},
        created_at: new Date().toISOString(),
        is_active: true
      }
    };

    await db.update(transcripts)
      .set({ 
        metadata: updatedMetadata,
        updated_at: new Date()
      })
      .where(eq(transcripts.id, transcriptId));

    return NextResponse.json({
      success: true,
      message: 'Story summary saved successfully',
      summary: {
        summary,
        version,
        metadata
      }
    });

  } catch (error) {
    console.error('Error saving story summary:', error);
    return NextResponse.json({ 
      error: 'Failed to save story summary' 
    }, { status: 500 });
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

    // Fetch transcript with summary
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

    const storySummary = transcript.metadata?.story_summary;

    return NextResponse.json({
      transcript_id: transcriptId,
      has_summary: !!storySummary,
      story_summary: storySummary || null
    });

  } catch (error) {
    console.error('Error retrieving story summary:', error);
    return NextResponse.json({ 
      error: 'Failed to retrieve story summary' 
    }, { status: 500 });
  }
}