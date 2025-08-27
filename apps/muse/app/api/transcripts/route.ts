import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, transcripts, story_projects } from '@muse/db';
import { eq, and, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ 
      headers: request.headers 
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Verify project ownership
    const project = await db.select()
      .from(story_projects)
      .where(eq(story_projects.id, projectId))
      .limit(1);

    if (project.length === 0 || project[0].user_id !== session.user.id) {
      return NextResponse.json({ error: 'Project not found or unauthorized' }, { status: 403 });
    }

    // Fetch transcripts for this project
    const projectTranscripts = await db.select()
      .from(transcripts)
      .where(eq(transcripts.story_project_id, projectId))
      .orderBy(desc(transcripts.created_at));

    return NextResponse.json({
      transcripts: projectTranscripts.map(transcript => ({
        id: transcript.id,
        title: transcript.title,
        source_type: transcript.source_type,
        word_count: transcript.word_count,
        duration_minutes: transcript.duration_minutes,
        created_at: transcript.created_at,
        updated_at: transcript.updated_at,
        has_analysis: !!(transcript.metadata as any)?.analysis,
        story_moments_count: ((transcript.metadata as any)?.analysis?.moments?.length || 0),
        story_potential: ((transcript.metadata as any)?.analysis?.summary?.story_potential || 0)
      }))
    });

  } catch (error) {
    console.error('Fetch transcripts error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transcripts' }, 
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ 
      headers: request.headers 
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const transcriptId = searchParams.get('id');

    if (!transcriptId) {
      return NextResponse.json({ error: 'Transcript ID is required' }, { status: 400 });
    }

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

    // Delete the transcript
    await db.delete(transcripts).where(eq(transcripts.id, transcriptId));

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Delete transcript error:', error);
    return NextResponse.json(
      { error: 'Failed to delete transcript' }, 
      { status: 500 }
    );
  }
}