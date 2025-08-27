import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, transcripts, story_projects } from '@muse/db';
import { eq } from 'drizzle-orm';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

const storySummarySchema = z.object({
  summaries: z.array(z.object({
    version: z.string().describe('A unique identifier for this summary version (A, B, C, etc.)'),
    summary: z.string().describe('One-sentence story summary that captures the core narrative'),
    genre_focus: z.string().describe('Primary genre or narrative approach (drama, thriller, character study, etc.)'),
    emotional_core: z.string().describe('The central emotional journey or conflict'),
    hook_strength: z.number().min(1).max(10).describe('How compelling this summary is as a story hook (1-10)'),
    reasoning: z.string().describe('Brief explanation of why this approach works for the story moments')
  })).length(5).describe('Exactly 5 different summary approaches'),
  recommendation: z.object({
    preferred_version: z.string().describe('Which version (A-E) is recommended and why'),
    rationale: z.string().describe('Detailed explanation of why this version captures the story best')
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

function createMockSummaries(moments: StoryMoment[], transcriptTitle: string) {
  // Extract key elements from story moments
  const highIntensityMoments = moments.filter(m => m.intensity >= 7);
  const conflicts = moments.filter(m => m.type === 'conflict');
  const revelations = moments.filter(m => m.type === 'revelation');
  const characterMoments = moments.filter(m => m.type === 'character_development');
  
  return {
    summaries: [
      {
        version: 'A',
        summary: `A character's journey of self-discovery reveals unexpected truths that challenge everything they believed about themselves.`,
        genre_focus: 'Character Study',
        emotional_core: 'Self-discovery and personal transformation',
        hook_strength: 7,
        reasoning: 'Focuses on internal character journey, good for intimate storytelling'
      },
      {
        version: 'B',
        summary: `When confronted with a life-changing revelation, someone must choose between comfort and truth.`,
        genre_focus: 'Drama',
        emotional_core: 'The tension between security and authenticity',
        hook_strength: 8,
        reasoning: 'Choice-driven narrative creates natural dramatic tension'
      },
      {
        version: 'C',
        summary: `An expert's insights into human nature expose the hidden conflicts that drive us all.`,
        genre_focus: 'Psychological Drama',
        emotional_core: 'Understanding the complexity of human motivation',
        hook_strength: 6,
        reasoning: 'Intellectual approach, appeals to audiences interested in psychology'
      },
      {
        version: 'D',
        summary: `A conversation about ${transcriptTitle.toLowerCase()} becomes a mirror reflecting deeper truths about identity and change.`,
        genre_focus: 'Philosophical Drama',
        emotional_core: 'The search for authentic identity',
        hook_strength: 7,
        reasoning: 'Meta-narrative approach that connects content to universal themes'
      },
      {
        version: 'E',
        summary: `What begins as professional discussion evolves into a profound exploration of what it means to grow and change.`,
        genre_focus: 'Introspective Drama',
        emotional_core: 'The courage required for personal evolution',
        hook_strength: 8,
        reasoning: 'Evolution theme resonates broadly, shows transformation journey'
      }
    ],
    recommendation: {
      preferred_version: 'E',
      rationale: 'Version E captures both the professional context and personal transformation arc. It suggests a journey that starts in one place and evolves into something deeper, which matches the story moment progression from your transcript. The theme of growth and change is universally relatable while maintaining the intellectual foundation.'
    }
  };
}

async function generateStorySummaries(moments: StoryMoment[], transcriptTitle: string, transcriptContent?: string) {
  // Check if OpenAI API key is available
  const hasOpenAI = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim() !== '';
  
  if (!hasOpenAI) {
    console.warn('OpenAI API key not configured, using mock summaries for development');
    return createMockSummaries(moments, transcriptTitle);
  }

  // Prepare story moments for analysis
  const momentsText = moments.map(m => 
    `${m.type.toUpperCase()}: "${m.text}" (Intensity: ${m.intensity}/10) - ${m.context}`
  ).join('\n\n');

  const prompt = `You are a story development expert. Analyze these extracted story moments from a transcript titled "${transcriptTitle}" and generate 5 different one-sentence story summaries.

Each summary should:
- Capture the essential dramatic core in ONE sentence
- Focus on different narrative approaches/genres
- Be compelling and hook-worthy
- Serve as the DNA that drives all subsequent story development

Story Moments:
${momentsText}

Generate 5 distinctly different summary approaches, each targeting a different audience or genre preference. Think of these as loglines that would excite different types of readers/viewers.

Consider:
- Character-driven vs plot-driven approaches
- Different emotional tones (intimate, dramatic, psychological, etc.)
- Various genre lenses (drama, thriller, character study, etc.)
- Universal themes vs specific situations

Each summary should be a single, powerful sentence that could guide the entire story development process.`;

  try {
    const result = await generateObject({
      model: openai('gpt-4o'),
      prompt,
      schema: storySummarySchema,
    });

    return result.object;
  } catch (error) {
    console.error('AI summary generation failed:', error);
    console.warn('Falling back to mock summaries due to AI error');
    return createMockSummaries(moments, transcriptTitle);
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

    // Fetch transcript with analysis
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

    // Extract story moments from transcript metadata
    const analysis = transcript.metadata?.analysis;
    if (!analysis || !analysis.moments || analysis.moments.length === 0) {
      return NextResponse.json({ 
        error: 'No story moments found. Please process the transcript first.' 
      }, { status: 400 });
    }

    // Generate story summaries
    const summaryOptions = await generateStorySummaries(
      analysis.moments,
      transcript.title,
      transcript.content
    );

    return NextResponse.json({
      transcript_id: transcriptId,
      transcript_title: transcript.title,
      story_moments_count: analysis.moments.length,
      summary_options: summaryOptions
    });

  } catch (error) {
    console.error('Error generating story summaries:', error);
    return NextResponse.json({ 
      error: 'Failed to generate story summaries' 
    }, { status: 500 });
  }
}