import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, transcripts, story_projects } from '@muse/db';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const saveBeatBreakdownSchema = z.object({
  scene_breakdowns: z.array(z.object({
    scene_number: z.number(),
    scene_title: z.string(),
    total_beats: z.number(),
    beats: z.array(z.object({
      beat_number: z.number(),
      beat_title: z.string(),
      action_description: z.string(),
      dialogue_notes: z.string().optional(),
      character_focus: z.array(z.string()),
      character_states: z.record(z.string()),
      tension_moment: z.string(),
      story_function: z.string(),
      production_notes: z.string(),
      duration_estimate: z.enum(['short', 'medium', 'long']),
      transition_to_next: z.string(),
      visual_elements: z.array(z.string())
    }))
  })),
  character_tracking: z.object({
    main_characters: z.array(z.string()),
    character_arcs: z.record(z.object({
      starting_state: z.string(),
      progression: z.array(z.string()),
      ending_state: z.string(),
      key_moments: z.array(z.string())
    })),
    consistency_notes: z.array(z.string())
  }),
  production_summary: z.object({
    total_beats: z.number(),
    estimated_runtime: z.string(),
    key_locations: z.array(z.string()),
    production_complexity: z.enum(['low', 'medium', 'high']),
    budget_considerations: z.array(z.string()),
    scheduling_notes: z.array(z.string())
  }),
  user_notes: z.string().optional()
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
    const validation = saveBeatBreakdownSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Invalid beat breakdown data',
        details: validation.error.issues
      }, { status: 400 });
    }

    const { scene_breakdowns, character_tracking, production_summary, user_notes } = validation.data;

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

    // Validate beat breakdown consistency
    const validationResults = validateBeatBreakdown(scene_breakdowns, character_tracking);

    // Update transcript metadata with beat breakdown
    const updatedMetadata = {
      ...transcript.metadata,
      scene_beats: {
        scene_breakdowns,
        character_tracking,
        production_summary,
        user_notes,
        validation_results: validationResults,
        created_at: new Date().toISOString(),
        is_active: true,
        phase: 3
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
      message: 'Scene beat breakdown saved successfully',
      scene_beats: {
        scene_breakdowns,
        character_tracking,
        production_summary,
        user_notes,
        validation_results: validationResults
      }
    });

  } catch (error) {
    console.error('Error saving scene beat breakdown:', error);
    return NextResponse.json({ 
      error: 'Failed to save scene beat breakdown' 
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

    // Fetch transcript with beat breakdown
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

    const sceneBeats = transcript.metadata?.scene_beats;

    return NextResponse.json({
      transcript_id: transcriptId,
      has_beats: !!sceneBeats,
      scene_beats: sceneBeats || null,
      story_dna: transcript.metadata?.story_summary?.summary || null,
      scene_structure: transcript.metadata?.scene_structure || null
    });

  } catch (error) {
    console.error('Error retrieving scene beat breakdown:', error);
    return NextResponse.json({ 
      error: 'Failed to retrieve scene beat breakdown' 
    }, { status: 500 });
  }
}

// Validation function for beat breakdown consistency
function validateBeatBreakdown(sceneBreakdowns: any[], characterTracking: any) {
  const issues: string[] = [];
  const warnings: string[] = [];
  const strengths: string[] = [];

  // Check total beat count
  const totalBeats = sceneBreakdowns.reduce((sum, scene) => sum + scene.total_beats, 0);
  
  if (totalBeats < 12) {
    warnings.push('Low beat count - consider adding more detail for production');
  } else if (totalBeats > 32) {
    warnings.push('High beat count - may be too detailed for efficient production');
  } else {
    strengths.push('Good beat count for production planning');
  }

  // Check character consistency
  sceneBreakdowns.forEach((scene, sceneIndex) => {
    scene.beats.forEach((beat: any, beatIndex: number) => {
      // Check if character focus is maintained
      if (!beat.character_focus || beat.character_focus.length === 0) {
        issues.push(`Scene ${scene.scene_number}, Beat ${beat.beat_number}: Missing character focus`);
      }

      // Check if story function is clear
      if (!beat.story_function || beat.story_function.length < 10) {
        issues.push(`Scene ${scene.scene_number}, Beat ${beat.beat_number}: Unclear story function`);
      }

      // Check production notes
      if (!beat.production_notes || beat.production_notes.length < 10) {
        warnings.push(`Scene ${scene.scene_number}, Beat ${beat.beat_number}: Limited production notes`);
      }

      // Check transitions
      if (beatIndex < scene.beats.length - 1 && (!beat.transition_to_next || beat.transition_to_next.length < 5)) {
        warnings.push(`Scene ${scene.scene_number}, Beat ${beat.beat_number}: Weak transition to next beat`);
      }
    });
  });

  // Check character arc tracking
  const trackedCharacters = Object.keys(characterTracking.character_arcs);
  if (trackedCharacters.length === 0) {
    issues.push('No character arcs are being tracked');
  } else {
    strengths.push(`Tracking ${trackedCharacters.length} character arc(s)`);
  }

  // Check for tension progression within scenes
  sceneBreakdowns.forEach(scene => {
    const tensionMoments = scene.beats.map((beat: any) => beat.tension_moment);
    if (tensionMoments.every((moment: string) => moment.length < 10)) {
      warnings.push(`Scene ${scene.scene_number}: Tension moments may need more detail`);
    }
  });

  // Check visual elements
  const hasVisualElements = sceneBreakdowns.every(scene => 
    scene.beats.every((beat: any) => beat.visual_elements && beat.visual_elements.length > 0)
  );
  
  if (hasVisualElements) {
    strengths.push('All beats include visual elements for production');
  } else {
    warnings.push('Some beats are missing visual elements');
  }

  return {
    overall_score: Math.max(0, 10 - issues.length * 2 - warnings.length * 0.5),
    issues,
    warnings,
    strengths,
    is_production_ready: issues.length === 0 && warnings.length < 3,
    needs_revision: issues.length > 0 || warnings.length > 5,
    beat_count: totalBeats,
    character_consistency: issues.filter(issue => issue.includes('character')).length === 0
  };
}