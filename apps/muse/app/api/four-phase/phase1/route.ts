import { generateText } from 'ai';
import { myProvider } from '@/lib/ai/providers';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function POST(request: Request) {
  try {
    const readonlyHeaders = await headers();
    const requestHeaders = new Headers(readonlyHeaders);
    const session = await auth.api.getSession({ headers: requestHeaders });
    const isDevelopment = process.env.NODE_ENV === 'development';

    // Allow access in development mode for testing, but require auth in production
    if (!session?.user && !isDevelopment) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { userSummary, action = 'improve' } = await request.json();

    if (!userSummary?.trim()) {
      return NextResponse.json({ error: 'Story summary is required' }, { status: 400 });
    }

    const prompts = {
      improve: `You are a professional story development assistant. Take this story concept and improve it into a compelling, powerful one-line summary that captures the complete narrative arc.

Original concept: "${userSummary}"

Provide 3 different improved versions of this one-line summary. Each should be:
- A single, powerful sentence
- Complete story arc from beginning to end
- Clear protagonist, conflict, and stakes
- Emotionally compelling
- Professional story pitch quality

Format your response as:
1. [First improved version]
2. [Second improved version] 
3. [Third improved version]`,

      expand: `You are a professional story development assistant. Take this one-line story summary and expand it slightly while keeping it concise and powerful.

Current summary: "${userSummary}"

Create 2 expanded versions that:
- Remain concise (1-2 sentences max)
- Add more specific detail or emotional depth
- Maintain the core story concept
- Make the stakes and conflict clearer

Format your response as:
1. [First expanded version]
2. [Second expanded version]`,

      alternatives: `You are a professional story development assistant. Take this story concept and provide alternative approaches while maintaining the core premise.

Original concept: "${userSummary}"

Provide 3 alternative one-line summaries that:
- Keep the same basic premise/genre
- Explore different angles or perspectives
- Vary the emotional tone or approach
- Remain compelling single sentences

Format your response as:
1. [First alternative]
2. [Second alternative]
3. [Third alternative]`
    };

    const selectedPrompt = prompts[action as keyof typeof prompts] || prompts.improve;

    const { text } = await generateText({
      model: myProvider.languageModel('claude-sonnet'),
      prompt: selectedPrompt,
      maxTokens: 300,
    });

    // Parse the response to extract numbered suggestions
    const suggestions = text
      .split('\n')
      .filter(line => line.match(/^\d+\./))
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
      .filter(suggestion => suggestion.length > 0);

    return NextResponse.json({
      success: true,
      action,
      userSummary,
      suggestions,
      fullResponse: text,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Phase 1 AI generation error:', error);
    return NextResponse.json({
      error: 'Failed to generate suggestions',
      details: error.message
    }, { status: 500 });
  }
}