import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, transcripts, story_projects } from '@muse/db';
import { eq } from 'drizzle-orm';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

const sceneBeatSchema = z.object({
  scene_breakdowns: z.array(z.object({
    scene_number: z.number().describe('Scene number from Phase 2'),
    scene_title: z.string().describe('Scene title from Phase 2'),
    total_beats: z.number().min(3).max(8).describe('Number of beats in this scene (3-8)'),
    beats: z.array(z.object({
      beat_number: z.number().describe('Beat number within the scene'),
      beat_title: z.string().describe('Short, descriptive title for this beat'),
      action_description: z.string().describe('Detailed description of what happens in this beat'),
      dialogue_notes: z.string().optional().describe('Key dialogue points or conversation topics'),
      character_focus: z.array(z.string()).describe('Characters central to this beat'),
      character_states: z.record(z.string()).describe('Emotional/physical state of each character'),
      tension_moment: z.string().describe('Specific moment of tension or conflict in this beat'),
      story_function: z.string().describe('What this beat accomplishes for the overall story'),
      production_notes: z.string().describe('Practical notes for filming/production'),
      duration_estimate: z.enum(['short', 'medium', 'long']).describe('Estimated time this beat should take'),
      transition_to_next: z.string().describe('How this beat connects to the next beat'),
      visual_elements: z.array(z.string()).describe('Key visual elements, settings, or props needed')
    }))
  })),
  character_tracking: z.object({
    main_characters: z.array(z.string()).describe('Primary characters across all scenes'),
    character_arcs: z.record(z.object({
      starting_state: z.string().describe('Character state at beginning'),
      progression: z.array(z.string()).describe('How character changes through scenes'),
      ending_state: z.string().describe('Character state at end'),
      key_moments: z.array(z.string()).describe('Critical character development moments')
    })).describe('Character development tracking'),
    consistency_notes: z.array(z.string()).describe('Notes to maintain character consistency')
  }),
  production_summary: z.object({
    total_beats: z.number().describe('Total number of beats across all scenes'),
    estimated_runtime: z.string().describe('Estimated total runtime'),
    key_locations: z.array(z.string()).describe('Primary filming locations needed'),
    production_complexity: z.enum(['low', 'medium', 'high']).describe('Overall production complexity'),
    budget_considerations: z.array(z.string()).describe('Key budget considerations'),
    scheduling_notes: z.array(z.string()).describe('Important scheduling considerations')
  })
});

function createMockSceneBeats(sceneStructure: any, storyDNA: string) {
  // Generate realistic beat breakdowns based on scene structure
  const sceneBreakdowns = sceneStructure.scenes.map((scene: any, index: number) => {
    const beatCount = Math.min(Math.max(3, Math.floor(scene.tension_level / 2) + 2), 8);
    const beats = [];

    for (let i = 1; i <= beatCount; i++) {
      const isOpening = i === 1;
      const isClosing = i === beatCount;
      const isMidpoint = i === Math.floor(beatCount / 2) + 1;

      beats.push({
        beat_number: i,
        beat_title: isOpening ? `${scene.title} Opening` : 
                   isClosing ? `${scene.title} Resolution` :
                   isMidpoint ? `${scene.title} Turning Point` :
                   `${scene.title} Development ${i}`,
        action_description: isOpening ? 
          `Scene opens with character in ${scene.character_arc.split(' ')[0]} state. The immediate situation presents itself through specific actions and environmental details that establish the scene's context.` :
          isClosing ? 
          `Scene concludes with character having ${scene.character_arc.split(' ').slice(-2).join(' ')}. The resolution directly sets up the next phase of the story journey.` :
          `Character engages with ${scene.conflict_type} conflict. Specific actions reveal deeper layers of the situation while building toward the scene's climactic moment.`,
        dialogue_notes: isOpening ? 'Establish character voice and immediate concerns' :
                       isClosing ? 'Dialogue that crystallizes the change or realization' :
                       'Dialogue that escalates tension and reveals character motivation',
        character_focus: ['protagonist', ...(scene.characters || [])],
        character_states: {
          protagonist: isOpening ? 'establishing' : 
                      isClosing ? 'transformed' : 'challenged'
        },
        tension_moment: isMidpoint ? 
          `Peak tension: ${scene.stakes}` :
          `Building tension: ${scene.emotional_beat}`,
        story_function: isOpening ? `Establish ${scene.purpose}` :
                       isClosing ? `Complete ${scene.forward_movement}` :
                       `Develop core conflict and character response`,
        production_notes: `${scene.pacing} pacing required. Focus on ${scene.emotional_beat}.`,
        duration_estimate: scene.pacing === 'fast' ? 'short' :
                          scene.pacing === 'slow' ? 'long' : 'medium' as const,
        transition_to_next: isClosing && index < sceneStructure.scenes.length - 1 ? 
          `Leads into Scene ${index + 2}: ${sceneStructure.scenes[index + 1]?.title || 'Next scene'}` :
          !isClosing ? 'Builds tension toward next beat' : 'Story conclusion',
        visual_elements: [
          scene.conflict_type === 'internal' ? 'Close-ups for internal struggle' :
          scene.conflict_type === 'interpersonal' ? 'Two-shot compositions' :
          'Wide shots to establish external conflict',
          `${scene.emotional_beat} lighting`,
          'Props supporting the scene purpose'
        ]
      });
    }

    return {
      scene_number: scene.scene_number,
      scene_title: scene.title,
      total_beats: beatCount,
      beats
    };
  });

  return {
    scene_breakdowns: sceneBreakdowns,
    character_tracking: {
      main_characters: ['protagonist', 'supporting character'],
      character_arcs: {
        protagonist: {
          starting_state: 'Comfortable but unfulfilled',
          progression: [
            'Scene 1: Encounters disruption',
            'Scene 2: Faces deeper challenge', 
            'Scene 3: Confronts core limitation',
            'Scene 4: Emerges transformed'
          ],
          ending_state: 'Transformed and empowered',
          key_moments: [
            'Initial resistance to change',
            'Moment of deepest vulnerability',
            'Breakthrough realization',
            'New equilibrium demonstration'
          ]
        }
      },
      consistency_notes: [
        'Maintain character voice and mannerisms throughout',
        'Track emotional state progression across scenes',
        'Ensure character reactions align with established personality'
      ]
    },
    production_summary: {
      total_beats: sceneBreakdowns.reduce((sum, scene) => sum + scene.total_beats, 0),
      estimated_runtime: '15-25 minutes',
      key_locations: ['Interior: Main character space', 'Exterior: Challenge environment'],
      production_complexity: 'medium' as const,
      budget_considerations: [
        'Character-focused scenes require strong performances',
        'Minimal special effects needed',
        'Standard equipment and crew requirements'
      ],
      scheduling_notes: [
        'Schedule emotional scenes when actors are fresh',
        'Group scenes by location for efficiency',
        'Allow time for character preparation between emotional beats'
      ]
    }
  };
}

async function generateSceneBeats(
  sceneStructure: any,
  storyDNA: string,
  transcriptTitle: string,
  storyMoments?: any[]
) {
  // Check if OpenAI API key is available
  const hasOpenAI = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim() !== '';
  
  if (!hasOpenAI) {
    console.warn('OpenAI API key not configured, using mock scene beats for development');
    return createMockSceneBeats(sceneStructure, storyDNA);
  }

  // Prepare scene structure for analysis
  const scenesText = sceneStructure.scenes.map((scene: any) => 
    `Scene ${scene.scene_number}: ${scene.title}
    Summary: ${scene.summary}
    Stakes: ${scene.stakes}
    Character Arc: ${scene.character_arc}
    Tension Level: ${scene.tension_level}/10
    Pacing: ${scene.pacing}
    Purpose: ${scene.purpose}
    Forward Movement: ${scene.forward_movement}`
  ).join('\n\n');

  const prompt = `You are a story development expert specializing in production-ready scene breakdowns. 

Break down the Phase 2 scene structure into detailed, actionable beats for production planning.

STORY DNA: "${storyDNA}"
SOURCE: ${transcriptTitle}

SCENE STRUCTURE:
${scenesText}

REQUIREMENTS:
1. Break each scene into 3-8 specific beats (actionable moments)
2. Each beat must advance the story and maintain character consistency
3. Include practical production notes for filming/execution
4. Ensure beats serve the overall story arc
5. Maintain tension progression within and across scenes
6. Provide character state tracking across all beats
7. Include visual and dialogue guidance for production

BEAT BREAKDOWN PRINCIPLES:
- Each beat should be a specific, filmable moment
- Include what happens, character states, and story function
- Provide production-practical details (locations, props, duration)
- Ensure smooth transitions between beats
- Track character development through specific moments
- Balance dialogue and action for visual storytelling

Focus on creating beats that are immediately actionable for production while serving the established story structure and character arcs.`;

  try {
    const result = await generateObject({
      model: openai('gpt-4o'),
      prompt,
      schema: sceneBeatSchema,
    });

    return result.object;
  } catch (error) {
    console.error('AI beat generation failed:', error);
    console.warn('Falling back to mock scene beats due to AI error');
    return createMockSceneBeats(sceneStructure, storyDNA);
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth.api.getSession({ 
      headers: request.headers 
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const transcriptId = params.id;

    // Fetch transcript with scene structure and story DNA
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

    // Check for Story DNA (Phase 1 requirement)
    const storySummary = transcript.metadata?.story_summary;
    if (!storySummary || !storySummary.is_active) {
      return NextResponse.json({ 
        error: 'Story DNA required. Please complete Phase 1 first.',
        phase_required: 1
      }, { status: 400 });
    }

    // Check for Scene Structure (Phase 2 requirement)
    const sceneStructure = transcript.metadata?.scene_structure;
    if (!sceneStructure || !sceneStructure.is_active) {
      return NextResponse.json({ 
        error: 'Scene structure required. Please complete Phase 2 first.',
        phase_required: 2
      }, { status: 400 });
    }

    // Generate detailed scene beats
    const sceneBeats = await generateSceneBeats(
      sceneStructure,
      storySummary.summary,
      transcript.title,
      transcript.metadata?.analysis?.moments
    );

    return NextResponse.json({
      transcript_id: transcriptId,
      transcript_title: transcript.title,
      story_dna: storySummary.summary,
      scene_structure: sceneStructure,
      phase: 3,
      scene_beats: sceneBeats,
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generating scene beats:', error);
    return NextResponse.json({ 
      error: 'Failed to generate scene beats' 
    }, { status: 500 });
  }
}