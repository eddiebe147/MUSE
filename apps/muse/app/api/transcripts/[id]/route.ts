import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, transcripts, story_projects } from '@muse/db';
import { eq } from 'drizzle-orm';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({ 
      headers: request.headers 
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const transcriptId = params.id;

    // Get transcript with project info to verify ownership
    const transcriptResult = await db.select({
      transcript: transcripts,
      project: story_projects
    })
    .from(transcripts)
    .innerJoin(story_projects, eq(transcripts.story_project_id, story_projects.id))
    .where(eq(transcripts.id, transcriptId))
    .limit(1);

    if (transcriptResult.length === 0 || transcriptResult[0].project.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Transcript not found or unauthorized' }, { status: 403 });
    }

    const { transcript } = transcriptResult[0];

    return NextResponse.json({
      id: transcript.id,
      title: transcript.title,
      content: transcript.content,
      source_type: transcript.source_type,
      word_count: transcript.word_count,
      duration_minutes: transcript.duration_minutes,
      created_at: transcript.created_at,
      updated_at: transcript.updated_at,
      analysis: (transcript.metadata as any)?.analysis || null,
      original_filename: (transcript.metadata as any)?.original_filename || null
    });

  } catch (error) {
    console.error('Get transcript error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transcript' }, 
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({ 
      headers: request.headers 
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const transcriptId = params.id;
    const body = await request.json();

    // Get transcript with project info to verify ownership
    const transcriptResult = await db.select({
      transcript: transcripts,
      project: story_projects
    })
    .from(transcripts)
    .innerJoin(story_projects, eq(transcripts.story_project_id, story_projects.id))
    .where(eq(transcripts.id, transcriptId))
    .limit(1);

    if (transcriptResult.length === 0 || transcriptResult[0].project.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Transcript not found or unauthorized' }, { status: 403 });
    }

    const { transcript } = transcriptResult[0];
    const existingMetadata = (transcript.metadata as any) || {};

    // Update the analysis with user modifications
    let updatedMetadata = { ...existingMetadata };

    if (body.analysis) {
      updatedMetadata.analysis = {
        ...existingMetadata.analysis,
        ...body.analysis,
        user_modified: true,
        last_modified_at: new Date().toISOString()
      };
    }

    if (body.title) {
      // Update title
      await db.update(transcripts)
        .set({ 
          title: body.title,
          metadata: updatedMetadata,
          updated_at: new Date()
        })
        .where(eq(transcripts.id, transcriptId));
    } else {
      // Update just metadata
      await db.update(transcripts)
        .set({ 
          metadata: updatedMetadata,
          updated_at: new Date()
        })
        .where(eq(transcripts.id, transcriptId));
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Update transcript error:', error);
    return NextResponse.json(
      { error: 'Failed to update transcript' }, 
      { status: 500 }
    );
  }
}