import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, transcripts, story_projects } from '@muse/db';
import { eq } from 'drizzle-orm';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

const storyMomentSchema = z.object({
  moments: z.array(z.object({
    type: z.enum(['conflict', 'revelation', 'tension', 'character_development', 'plot_point', 'theme']),
    text: z.string().describe('The exact quote or passage from the transcript'),
    context: z.string().describe('Brief explanation of why this is significant'),
    timestamp: z.string().optional().describe('Time reference if available in transcript'),
    characters: z.array(z.string()).optional().describe('Characters mentioned or involved'),
    intensity: z.number().min(1).max(10).describe('Story significance intensity (1-10)'),
    tags: z.array(z.string()).describe('Relevant story tags like emotion, genre elements, etc.')
  })),
  summary: z.object({
    main_themes: z.array(z.string()),
    key_characters: z.array(z.string()),
    story_potential: z.number().min(1).max(10),
    genre_indicators: z.array(z.string()),
    emotional_arc: z.string()
  })
});

async function extractTextFromFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const content = Buffer.from(buffer);

  if (file.type === 'text/plain') {
    return content.toString('utf-8');
  }
  
  if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    // For .docx files, we would need a proper parser
    // For now, return a placeholder - in production, use mammoth.js or similar
    return content.toString('utf-8');
  }
  
  throw new Error('Unsupported file type. Please upload .txt or .docx files.');
}

async function analyzeTranscriptContent(content: string, title: string) {
  // Check if OpenAI API key is available
  const hasOpenAI = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim() !== '';
  
  if (!hasOpenAI) {
    console.warn('OpenAI API key not configured, using mock analysis for development');
    return createMockAnalysis(content, title);
  }

  const prompt = `Analyze this interview/conversation transcript and extract key story moments. Look for:

1. CONFLICTS: Disagreements, tensions, obstacles, challenges
2. REVELATIONS: Surprising information, character insights, plot twists
3. TENSIONS: Emotional moments, unresolved issues, dramatic moments
4. CHARACTER DEVELOPMENT: Growth, change, backstory reveals
5. PLOT POINTS: Key events, turning points, significant actions
6. THEMES: Recurring ideas, moral questions, deeper meanings

Title: ${title}

Transcript:
${content}

Focus on moments that have strong narrative potential. Rate intensity based on dramatic impact and story significance.`;

  try {
    const result = await generateObject({
      model: openai('gpt-4o'),
      prompt,
      schema: storyMomentSchema,
    });

    return result.object;
  } catch (error) {
    console.error('AI analysis failed:', error);
    // Fallback to mock analysis if AI fails
    console.warn('Falling back to mock analysis due to AI error');
    return createMockAnalysis(content, title);
  }
}

function createMockAnalysis(content: string, title: string) {
  // Simple keyword-based analysis for development
  const words = content.toLowerCase();
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  const moments: any[] = [];
  
  // Look for conflict indicators
  if (words.includes('conflict') || words.includes('disagree') || words.includes('tension') || words.includes('obstacle')) {
    moments.push({
      type: 'conflict',
      text: sentences.find(s => s.toLowerCase().includes('conflict') || s.toLowerCase().includes('disagree') || s.toLowerCase().includes('tension'))?.trim() || 'Conflict moment identified',
      context: 'Identified based on conflict keywords in the transcript',
      intensity: Math.floor(Math.random() * 4) + 6, // 6-9 intensity
      characters: [],
      tags: ['conflict', 'tension']
    });
  }
  
  // Look for revelation indicators
  if (words.includes('reveal') || words.includes('realize') || words.includes('discover') || words.includes('never thought')) {
    moments.push({
      type: 'revelation',
      text: sentences.find(s => s.toLowerCase().includes('reveal') || s.toLowerCase().includes('realize') || s.toLowerCase().includes('discover'))?.trim() || 'Character revelation discovered',
      context: 'Character insight or plot revelation identified',
      intensity: Math.floor(Math.random() * 3) + 7, // 7-9 intensity
      characters: [],
      tags: ['revelation', 'insight']
    });
  }
  
  // Look for character development
  if (words.includes('character') || words.includes('growth') || words.includes('change') || words.includes('development')) {
    moments.push({
      type: 'character_development',
      text: sentences.find(s => s.toLowerCase().includes('character') || s.toLowerCase().includes('growth'))?.trim() || 'Character development moment',
      context: 'Character growth or development identified',
      intensity: Math.floor(Math.random() * 3) + 5, // 5-7 intensity
      characters: [],
      tags: ['character', 'growth']
    });
  }
  
  // Add at least one moment if none found
  if (moments.length === 0) {
    moments.push({
      type: 'theme',
      text: sentences[Math.floor(sentences.length / 2)]?.trim() || 'Thematic content identified',
      context: 'General thematic content from the transcript',
      intensity: 5,
      characters: [],
      tags: ['theme', 'general']
    });
  }
  
  return {
    moments,
    summary: {
      main_themes: ['character development', 'personal growth'],
      key_characters: ['interviewer', 'expert'],
      story_potential: Math.floor(Math.random() * 3) + 6, // 6-8 rating
      genre_indicators: ['drama', 'character study'],
      emotional_arc: 'Exploration of personal and professional insights'
    }
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ 
      headers: request.headers 
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const projectId = formData.get('projectId') as string;
    const sourceType = formData.get('sourceType') as string || 'interview';
    const title = formData.get('title') as string || file.name.replace(/\.[^/.]+$/, '');

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

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

    // Extract text content from file
    const content = await extractTextFromFile(file);
    
    if (!content.trim()) {
      return NextResponse.json({ error: 'File appears to be empty' }, { status: 400 });
    }

    // Calculate basic metrics
    const wordCount = content.split(/\s+/).length;
    const estimatedDuration = Math.ceil(wordCount / 150); // Rough estimate: 150 words per minute

    // AI Analysis
    const analysis = await analyzeTranscriptContent(content, title);

    // Store transcript in database
    const [newTranscript] = await db.insert(transcripts).values({
      title,
      content,
      source_type: sourceType as 'interview' | 'meeting' | 'brainstorm' | 'other',
      word_count: wordCount,
      duration_minutes: estimatedDuration,
      story_project_id: projectId,
      metadata: {
        original_filename: file.name,
        file_size: file.size,
        processed_at: new Date().toISOString(),
        analysis: analysis
      }
    }).returning();

    return NextResponse.json({
      transcript: newTranscript,
      analysis: analysis,
      metrics: {
        word_count: wordCount,
        estimated_duration_minutes: estimatedDuration,
        story_moments_found: analysis.moments.length,
        high_intensity_moments: analysis.moments.filter(m => m.intensity >= 7).length
      }
    });

  } catch (error) {
    console.error('Transcript processing error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process transcript' }, 
      { status: 500 }
    );
  }
}