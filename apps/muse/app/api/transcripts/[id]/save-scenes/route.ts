import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, transcripts, story_projects } from '@muse/db';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const saveSceneStructureSchema = z.object({
  scenes: z.array(z.object({
    scene_number: z.number(),
    title: z.string(),
    summary: z.string(),
    purpose: z.string(),
    stakes: z.string(),
    character_arc: z.string(),
    conflict_type: z.enum(['internal', 'interpersonal', 'external', 'societal']),
    emotional_beat: z.string(),
    forward_movement: z.string(),
    key_moments: z.array(z.string()),
    tension_level: z.number().min(1).max(10),
    pacing: z.enum(['slow', 'medium', 'fast'])
  })),
  arc_analysis: z.object({
    overall_progression: z.string(),
    escalation_pattern: z.string(),
    resolution_approach: z.string(),
    cohesion_strength: z.number().min(1).max(10),
    structural_notes: z.array(z.string())
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
    const validation = saveSceneStructureSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Invalid scene structure data',
        details: validation.error.issues
      }, { status: 400 });
    }

    const { scenes, arc_analysis, user_notes } = validation.data;

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

    // Validate scene structure coherence
    const validationResults = validateSceneCoherence(scenes, arc_analysis);

    // Update transcript metadata with scene structure
    const updatedMetadata = {
      ...transcript.metadata,
      scene_structure: {
        scenes,
        arc_analysis,
        user_notes,
        validation_results: validationResults,
        created_at: new Date().toISOString(),
        is_active: true,
        phase: 2
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
      message: 'Scene structure saved successfully',
      scene_structure: {
        scenes,
        arc_analysis,
        user_notes,
        validation_results: validationResults
      }
    });

  } catch (error) {
    console.error('Error saving scene structure:', error);
    return NextResponse.json({ 
      error: 'Failed to save scene structure' 
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

    // Fetch transcript with scene structure
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

    const sceneStructure = transcript.metadata?.scene_structure;

    return NextResponse.json({
      transcript_id: transcriptId,
      has_scenes: !!sceneStructure,
      scene_structure: sceneStructure || null,
      story_dna: transcript.metadata?.story_summary?.summary || null
    });

  } catch (error) {
    console.error('Error retrieving scene structure:', error);
    return NextResponse.json({ 
      error: 'Failed to retrieve scene structure' 
    }, { status: 500 });
  }
}

// Validation function for scene coherence
function validateSceneCoherence(scenes: any[], arcAnalysis: any) {
  const issues: string[] = [];
  const warnings: string[] = [];
  const strengths: string[] = [];

  // Check scene count
  if (scenes.length !== 4) {
    issues.push(`Expected 4 scenes, found ${scenes.length}`);
  }

  // Check tension escalation
  const tensionLevels = scenes.map(s => s.tension_level);
  const peakTension = Math.max(...tensionLevels);
  const peakIndex = tensionLevels.indexOf(peakTension);
  
  if (peakIndex < 2) {
    warnings.push('Peak tension occurs early - consider building more tension toward scene 3');
  }
  if (peakTension < 7) {
    warnings.push('Peak tension seems low - ensure crisis scene has sufficient intensity');
  }

  // Check for clear stakes in each scene
  scenes.forEach((scene, index) => {
    if (!scene.stakes || scene.stakes.length < 10) {
      issues.push(`Scene ${index + 1} lacks clear stakes`);
    }
    if (!scene.forward_movement || scene.forward_movement.length < 10) {
      issues.push(`Scene ${index + 1} lacks clear forward movement`);
    }
  });

  // Check pacing variation
  const pacingTypes = [...new Set(scenes.map(s => s.pacing))];
  if (pacingTypes.length === 1) {
    warnings.push('All scenes have same pacing - consider varying rhythm for engagement');
  } else {
    strengths.push('Good pacing variation across scenes');
  }

  // Check conflict type distribution
  const conflictTypes = scenes.map(s => s.conflict_type);
  const uniqueConflicts = [...new Set(conflictTypes)];
  if (uniqueConflicts.length > 2) {
    strengths.push('Good variety in conflict types');
  }

  // Check cohesion strength
  if (arcAnalysis.cohesion_strength >= 8) {
    strengths.push('Strong structural cohesion');
  } else if (arcAnalysis.cohesion_strength < 6) {
    warnings.push('Scene cohesion may need strengthening');
  }

  // Check for character arc progression
  const hasCharacterProgression = scenes.every(scene => 
    scene.character_arc && scene.character_arc.length > 10
  );
  if (hasCharacterProgression) {
    strengths.push('Clear character development in each scene');
  } else {
    warnings.push('Some scenes lack clear character development');
  }

  return {
    overall_score: Math.max(0, 10 - issues.length * 2 - warnings.length * 0.5),
    issues,
    warnings,
    strengths,
    is_structurally_sound: issues.length === 0,
    needs_revision: issues.length > 0 || warnings.length > 2
  };
}