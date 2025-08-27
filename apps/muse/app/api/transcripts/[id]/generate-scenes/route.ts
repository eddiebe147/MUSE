import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, transcripts, story_projects } from '@muse/db';
import { eq } from 'drizzle-orm';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

const sceneStructureSchema = z.object({
  scenes: z.array(z.object({
    scene_number: z.number().describe('Scene number (1-4)'),
    title: z.string().describe('Brief scene title'),
    summary: z.string().describe('2-3 sentence scene summary'),
    purpose: z.string().describe('What this scene accomplishes in the story'),
    stakes: z.string().describe('What is at risk or what matters in this scene'),
    character_arc: z.string().describe('How the character changes or is challenged'),
    conflict_type: z.enum(['internal', 'interpersonal', 'external', 'societal']).describe('Primary type of conflict'),
    emotional_beat: z.string().describe('The dominant emotion or feeling of the scene'),
    forward_movement: z.string().describe('How this scene advances the story toward resolution'),
    key_moments: z.array(z.string()).describe('2-3 specific moments or beats within the scene'),
    tension_level: z.number().min(1).max(10).describe('Intensity of dramatic tension (1-10)'),
    pacing: z.enum(['slow', 'medium', 'fast']).describe('Scene pacing and rhythm')
  })).length(4).describe('Exactly 4 scenes that create a complete arc'),
  arc_analysis: z.object({
    overall_progression: z.string().describe('How the scenes work together to create a complete journey'),
    escalation_pattern: z.string().describe('How tension and stakes build across scenes'),
    resolution_approach: z.string().describe('How the final scene provides resolution or transformation'),
    cohesion_strength: z.number().min(1).max(10).describe('How well scenes flow together (1-10)'),
    structural_notes: z.array(z.string()).describe('Key structural insights about the scene progression')
  })
});

interface StoryMoment {
  type: string;
  text: string;
  context: string;
  intensity: number;
  characters: string[];
  tags: string[];
}

function createMockScenes(storyDNA: string, moments: StoryMoment[]) {
  // Extract themes and conflicts for scene generation
  const highIntensityMoments = moments.filter(m => m.intensity >= 7);
  const conflicts = moments.filter(m => m.type === 'conflict');
  const revelations = moments.filter(m => m.type === 'revelation');
  
  return {
    scenes: [
      {
        scene_number: 1,
        title: 'The Catalyst',
        summary: 'The inciting incident that launches the journey. A moment of disruption that challenges the status quo and forces action.',
        purpose: 'Establish the central conflict and introduce the journey that will unfold',
        stakes: 'The old way of being versus the need for change',
        character_arc: 'Character is comfortable but about to be challenged',
        conflict_type: 'internal' as const,
        emotional_beat: 'Uncertainty mixed with curiosity',
        forward_movement: 'Sets up the central question that drives the entire narrative',
        key_moments: [
          'The moment of initial disruption',
          'Character\'s first reaction to change',
          'Decision to engage with the challenge'
        ],
        tension_level: 6,
        pacing: 'medium' as const
      },
      {
        scene_number: 2,
        title: 'The Descent',
        summary: 'Character dives deeper into the challenge. Complications arise and the easy answers disappear.',
        purpose: 'Deepen the conflict and show the true scope of the challenge',
        stakes: 'Surface-level solutions versus confronting deeper truths',
        character_arc: 'Character realizes the challenge is bigger than expected',
        conflict_type: 'interpersonal' as const,
        emotional_beat: 'Growing tension and resistance',
        forward_movement: 'Eliminates simple solutions and forces deeper engagement',
        key_moments: [
          'First attempt at resolution fails',
          'Deeper complexity revealed',
          'Character commits to harder path'
        ],
        tension_level: 7,
        pacing: 'medium' as const
      },
      {
        scene_number: 3,
        title: 'The Crisis',
        summary: 'The moment of greatest challenge. Everything seems lost and the character faces their deepest fears or resistance.',
        purpose: 'Force the character to confront their core limitations and make the hardest choice',
        stakes: 'Everything the character values is on the line',
        character_arc: 'Character faces their ultimate test and must transform',
        conflict_type: 'internal' as const,
        emotional_beat: 'Intense pressure and potential despair',
        forward_movement: 'Creates the conditions for breakthrough or breakdown',
        key_moments: [
          'The moment of greatest resistance',
          'Character faces their deepest fear',
          'The critical choice point'
        ],
        tension_level: 9,
        pacing: 'fast' as const
      },
      {
        scene_number: 4,
        title: 'The Resolution',
        summary: 'Character emerges transformed. The new understanding or way of being is integrated and demonstrated.',
        purpose: 'Show the transformation and establish the new equilibrium',
        stakes: 'Whether the growth will be sustainable and meaningful',
        character_arc: 'Character has integrated the change and grown',
        conflict_type: 'internal' as const,
        emotional_beat: 'Resolution mixed with new wisdom',
        forward_movement: 'Completes the arc and establishes new possibilities',
        key_moments: [
          'Demonstration of new capability or understanding',
          'Integration of the lesson learned',
          'Opening to new possibilities'
        ],
        tension_level: 4,
        pacing: 'slow' as const
      }
    ],
    arc_analysis: {
      overall_progression: 'Classic transformation arc: setup → complication → crisis → resolution, with each scene building naturally on the previous one',
      escalation_pattern: 'Tension builds from comfortable (6) through challenge (7) to crisis (9) before resolving (4)',
      resolution_approach: 'Character integration - showing growth through action rather than explanation',
      cohesion_strength: 8,
      structural_notes: [
        'Each scene serves both plot and character development',
        'Conflict types vary to maintain interest while staying thematically coherent',
        'Pacing changes support the emotional journey',
        'Stakes escalate logically from personal discomfort to fundamental transformation'
      ]
    }
  };
}

async function generateSceneStructure(
  storyDNA: string, 
  moments: StoryMoment[], 
  transcriptTitle: string,
  genreFocus?: string,
  emotionalCore?: string
) {
  // Check if OpenAI API key is available
  const hasOpenAI = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim() !== '';
  
  if (!hasOpenAI) {
    console.warn('OpenAI API key not configured, using mock scene structure for development');
    return createMockScenes(storyDNA, moments);
  }

  // Prepare story moments for analysis
  const momentsText = moments.map(m => 
    `${m.type.toUpperCase()}: "${m.text}" (Intensity: ${m.intensity}/10) - ${m.context}`
  ).join('\n\n');

  const prompt = `You are a story structure expert. Using the established Story DNA and analyzed story moments, generate a 4-scene structure that creates a complete narrative arc.

STORY DNA (Foundation): "${storyDNA}"
Genre Focus: ${genreFocus || 'Drama'}
Emotional Core: ${emotionalCore || 'Character transformation'}
Source: ${transcriptTitle}

STORY MOMENTS:
${momentsText}

REQUIREMENTS:
1. Create exactly 4 scenes that form a complete arc
2. Each scene must have clear stakes and forward movement
3. Build tension logically across scenes (escalation pattern)
4. Ensure cohesive flow between scenes
5. Ground scenes in the actual story moments provided
6. Make each scene serve both plot and character development

SCENE STRUCTURE PRINCIPLES:
- Scene 1: Catalyst/Setup - Introduce conflict, establish stakes
- Scene 2: Complication - Deepen challenge, eliminate easy answers  
- Scene 3: Crisis - Peak tension, character faces core limitation
- Scene 4: Resolution - Transformation demonstrated, new equilibrium

Each scene should have:
- Clear dramatic purpose
- Specific stakes (what matters/what's at risk)
- Character development moment
- Forward story movement
- Emotional resonance

Focus on creating scenes that work together as a cohesive whole, building toward a satisfying resolution that honors the Story DNA.`;

  try {
    const result = await generateObject({
      model: openai('gpt-4o'),
      prompt,
      schema: sceneStructureSchema,
    });

    return result.object;
  } catch (error) {
    console.error('AI scene generation failed:', error);
    console.warn('Falling back to mock scene structure due to AI error');
    return createMockScenes(storyDNA, moments);
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

    // Fetch transcript with analysis and story summary
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

    // Extract story moments from transcript metadata
    const analysis = transcript.metadata?.analysis;
    if (!analysis || !analysis.moments || analysis.moments.length === 0) {
      return NextResponse.json({ 
        error: 'No story moments found. Please process the transcript first.' 
      }, { status: 400 });
    }

    // Generate scene structure
    const sceneStructure = await generateSceneStructure(
      storySummary.summary,
      analysis.moments,
      transcript.title,
      storySummary.metadata?.genre_focus,
      storySummary.metadata?.emotional_core
    );

    return NextResponse.json({
      transcript_id: transcriptId,
      transcript_title: transcript.title,
      story_dna: storySummary.summary,
      phase: 2,
      scene_structure: sceneStructure,
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generating scene structure:', error);
    return NextResponse.json({ 
      error: 'Failed to generate scene structure' 
    }, { status: 500 });
  }
}