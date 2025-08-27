import { NextRequest, NextResponse } from 'next/server';
import { streamText } from 'ai';
import { myProvider } from '@/lib/ai/providers';

export async function POST(request: NextRequest) {
  try {
    // Skip auth check in development mode for now
    console.log('Brainstorm API called');

    const { 
      message, 
      conversationHistory, 
      transcriptData, 
      knowledgeBase, 
      importedFiles = [],
      explorationMethod,
      activeExploration 
    } = await request.json();

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Build context for Claude about the brainstorming session
    let systemPrompt = `You are Claude, a creative writing assistant helping with advanced story brainstorming and exploration. The user wants to systematically explore narrative potential in their material before creating a one-line story summary.

Your role is to:
1. Help identify compelling story elements, conflicts, and themes
2. Explore character dynamics and relationships using sophisticated analysis
3. Suggest different narrative angles or approaches
4. Discuss story structure possibilities
5. Apply specific exploration methodologies when requested
6. Use tree-of-thought reasoning to explore story branches
7. Ask insightful questions that reveal deeper story potential

EXPLORATION METHODS AVAILABLE:
- Tree-of-Thought: Systematic exploration of story branches and decision trees
- Character Analysis: Deep dive into motivations, arcs, and relationships
- Conflict Mapping: Layer conflicts (internal, interpersonal, societal) for maximum drama
- Theme Discovery: Uncover universal themes and meaningful subtexts
- Structure Analysis: Examine pacing, acts, and narrative architecture
- Genre Exploration: Consider different genre approaches and conventions

Be conversational, insightful, and encouraging. When using specific exploration methods, be systematic and thorough. Focus on helping the user discover what excites them most about their material.`;

    // Add transcript context if available
    if (transcriptData) {
      systemPrompt += `\n\nTRANSCRIPT CONTEXT:
You have access to transcript data that contains the raw material for this story. Use this context to provide specific, relevant suggestions about characters, conflicts, themes, and narrative possibilities that emerge from the actual content.

Transcript Summary: ${JSON.stringify(transcriptData)}`;
    }

    // Add knowledge base context if available
    if (knowledgeBase) {
      systemPrompt += `\n\nKNOWLEDGE BASE CONTEXT:
You also have access to additional research and reference material that provides background context for the story.

Knowledge Base: ${JSON.stringify(knowledgeBase)}`;
    }

    // Add imported files context
    if (importedFiles.length > 0) {
      systemPrompt += `\n\nIMPORTED FILES:
The user has imported ${importedFiles.length} file(s) for analysis:
${importedFiles.map((file: any) => `- ${file.name} (${file.size} characters)\n  Content: ${file.content.substring(0, 500)}${file.content.length > 500 ? '...' : ''}`).join('\n')}`;
    }

    // Add exploration method context
    if (explorationMethod) {
      systemPrompt += `\n\nACTIVE EXPLORATION METHOD: ${explorationMethod}
Please apply this specific exploration methodology in your response. Be systematic and thorough in your analysis using this approach.`;
    }

    // Build conversation messages
    const messages = [];

    // Add conversation history
    if (conversationHistory && Array.isArray(conversationHistory)) {
      for (const historyMessage of conversationHistory) {
        messages.push({
          role: historyMessage.role === 'user' ? 'user' as const : 'assistant' as const,
          content: historyMessage.content
        });
      }
    }

    // Create streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Use streamText with Claude Sonnet model
          const result = await streamText({
            model: myProvider.languageModel('claude-sonnet'),
            system: systemPrompt,
            messages: [
              ...messages,
              {
                role: 'user' as const,
                content: message.trim()
              }
            ],
            temperature: 0.8, // More creative for brainstorming
            maxTokens: 1000,
          });

          // Stream the response
          for await (const chunk of result.textStream) {
            if (chunk) {
              const data = JSON.stringify({
                type: 'content-delta',
                content: chunk
              });
              
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
          }

          // Send completion signal
          controller.enqueue(encoder.encode(`data: {"type": "done"}\n\n`));
        } catch (error) {
          console.error('Brainstorm streaming error:', error);
          const errorData = JSON.stringify({
            type: 'error',
            content: 'I apologize, but I encountered an error while processing your request. Please try again.'
          });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Brainstorm API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
