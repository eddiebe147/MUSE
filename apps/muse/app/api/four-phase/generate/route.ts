import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { myProvider } from '@/lib/ai/providers';
import { getSessionCookie } from 'better-auth/cookies';

interface GenerationRequest {
  phase: 1 | 2 | 3 | 4;
  previousPhaseContent?: any;
  brainstormContext?: string;
  knowledgeBase?: any;
  transcriptData?: any;
  regenerate?: boolean;
  specificRequirements?: string;
  sceneCount?: number; // For Phase 2 scene count control
}

export async function POST(request: NextRequest) {
  try {
    // Skip auth check in development mode for now
    console.log('Four-phase generation API called');

    const {
      phase,
      previousPhaseContent,
      brainstormContext,
      knowledgeBase,
      transcriptData,
      regenerate,
      specificRequirements,
      sceneCount
    }: GenerationRequest = await request.json();

    // Build phase-specific prompts
    let systemPrompt = `You are an expert story developer and screenwriter. Your task is to generate complete, high-quality content for the user's story development workflow. 

IMPORTANT: Generate COMPLETE content, not suggestions. The user will edit your output, but you should provide fully-formed, production-ready content.

${brainstormContext ? `\nBRAINSTORM CONTEXT:\n${brainstormContext}\n` : ''}
${transcriptData ? `\nTRANSCRIPT DATA:\n${JSON.stringify(transcriptData)}\n` : ''}
${knowledgeBase?.guidelines ? `\nSTYLE GUIDELINES & REQUIREMENTS:\n${knowledgeBase.guidelines}\n` : ''}${knowledgeBase?.files && knowledgeBase.files.length > 0 ? `\nKNOWLEDGE BASE CONTEXT:\n${knowledgeBase.files.map((file: any) => `${file.name} (${file.type}): ${file.content?.substring(0, 500)}${file.content?.length > 500 ? '...' : ''}`).join('\n')}\n` : ''}
${specificRequirements ? `\nSPECIFIC REQUIREMENTS:\n${specificRequirements}\n` : ''}`;

    let userPrompt = '';
    
    switch (phase) {
      case 1:
        systemPrompt += `
PHASE 1: ONE LINE GENERATION
Generate 3 powerful one-line story summaries that capture the entire narrative arc.

Requirements:
- Each line should be complete and compelling
- Include protagonist, conflict, and stakes
- Maximum 50 words per line
- Make each option distinctly different in approach
- Consider genre, tone, and themes from the brainstorming session`;
        
        userPrompt = `Based on our brainstorming discussion${previousPhaseContent ? ' and the transcript analysis' : ''}, generate 3 compelling one-line story summaries. Each should be a complete, standalone story foundation that captures the full narrative arc.

Format your response as:
OPTION 1: [Complete one-line summary]
OPTION 2: [Complete one-line summary]  
OPTION 3: [Complete one-line summary]

BEST RECOMMENDATION: [Explain which option you recommend and why]`;
        break;

      case 2:
        const targetSceneCount = sceneCount || 3;
        systemPrompt += `
PHASE 2: DETAILED SCENE SUMMARY GENERATION
Generate ${targetSceneCount} compelling one-line scene summaries that break down the story into essential narrative beats.

CRITICAL REQUIREMENTS:
- Each scene MUST be a complete one-line summary (30-50 words)
- Include WHO (characters), WHAT (action/conflict), WHY (motivation), and OUTCOME
- Capture key story beats: character motivations, conflicts, revelations, and emotional turns
- Build dramatic tension progressively across scenes
- Each summary must contain enough detail for Phase 3 to generate rich scene beats
- Include turning points, revelations, and character development moments

EXAMPLE FORMAT:
"Sarah confronts Mike in the kitchen about his secret phone calls, leading to explosive revelation about his gambling debts and her discovery of the missing mortgage money."

NOT THIS: "Kitchen Confrontation" (too vague)
NOT THIS: "Sarah and Mike argue about money issues and relationship problems while dealing with family stress." (too generic)

Each scene summary should be complete enough that a writer could generate 5-8 detailed beats from it.`;
        
        const sceneLabels = Array.from({length: targetSceneCount}, (_, i) => `SCENE ${i + 1}`).join('\n');
        userPrompt = `Based on this one-line story: "${previousPhaseContent?.oneLine || previousPhaseContent}"

Generate ${targetSceneCount} detailed one-line scene summaries that break this story into its essential dramatic beats.

Each scene summary must include:
- Specific character actions and motivations
- Clear conflict or dramatic tension
- Emotional stakes and consequences  
- Story progression and revelation

Format your response exactly as:
SCENE 1: [Complete one-line summary with character actions, conflict, and emotional stakes]
SCENE 2: [Complete one-line summary with character actions, conflict, and emotional stakes]
SCENE 3: [Complete one-line summary with character actions, conflict, and emotional stakes]
${targetSceneCount > 3 ? Array.from({length: targetSceneCount - 3}, (_, i) => `SCENE ${i + 4}: [Complete one-line summary with character actions, conflict, and emotional stakes]`).join('\n') : ''}

STRUCTURE NOTES: [Brief explanation of the dramatic arc, pacing, and how these scenes build toward the story's climax]`;
        break;

      case 3:
        systemPrompt += `
PHASE 3: DETAILED SCENE BEATS GENERATION
Expand each scene into detailed bullet-point beats with specific actions, dialogue hints, and emotional moments.

Requirements:
- 5-8 beats per scene
- Include character actions and reactions
- Note key dialogue moments (not full dialogue)
- Track emotional shifts
- Include visual/cinematic moments
- Build tension within each scene`;
        
        const scenes = previousPhaseContent?.scenes || [];
        userPrompt = `Expand these scenes into detailed beat-by-beat breakdowns:

${scenes.map((scene: any, index: number) => `SCENE ${index + 1}: ${scene}`).join('\n')}

For each scene, generate:
- Opening beat (how it starts)
- Character actions and key moments
- Conflict escalation
- Emotional turns
- Key dialogue beats (intentions, not full lines)
- Visual/cinematic elements
- Scene climax/resolution
- Transition to next scene

Format as bullet points for each scene.`;
        break;

      case 4:
        const customTemplate = previousPhaseContent?.customTemplate;
        const baseFormat = previousPhaseContent?.format || 'screenplay';
        
        systemPrompt += `
PHASE 4: FINAL SCRIPT FORMATTING
Generate the complete, professionally formatted script based on all previous phases.

CRITICAL: Generate the ENTIRE script from beginning to end. DO NOT stop mid-script or ask for permission to continue. The script must be complete and ready for production use.

Requirements:
- Follow ${baseFormat} format standards
- Include scene headings, action lines, and dialogue
- Maintain consistent character voices
- Apply any specific formatting guidelines from knowledge base
- Create natural, compelling dialogue
- Include necessary production notes
- COMPLETE ALL SCENES - do not stop or ask for continuation
- Generate full dialogue and action for every scene
- End with a proper script conclusion`;

        // Add custom template requirements if present
        if (customTemplate) {
          systemPrompt += `

CUSTOM FORMAT TEMPLATE: "${customTemplate.name}"
Apply these specific customizations:

${customTemplate.customRules?.tone ? `TONE & VOICE: ${customTemplate.customRules.tone}\n` : ''}
${customTemplate.customRules?.structure ? `STRUCTURE REQUIREMENTS: ${customTemplate.customRules.structure}\n` : ''}
${customTemplate.customRules?.formatting ? `FORMATTING STYLE: ${customTemplate.customRules.formatting}\n` : ''}
${customTemplate.customRules?.voice ? `VOICE GUIDELINES: ${customTemplate.customRules.voice}\n` : ''}
${customTemplate.customRules?.specificRequirements ? `SPECIFIC REQUIREMENTS: ${customTemplate.customRules.specificRequirements}\n` : ''}

${customTemplate.templateContent ? `REFERENCE TEMPLATE EXAMPLE:\n${customTemplate.templateContent.substring(0, 1000)}${customTemplate.templateContent.length > 1000 ? '...' : ''}\n` : ''}
${customTemplate.styleGuide ? `STYLE GUIDE REFERENCE:\n${customTemplate.styleGuide.substring(0, 500)}${customTemplate.styleGuide.length > 500 ? '...' : ''}\n` : ''}

CRITICAL: The output must strictly adhere to the custom template specifications while maintaining professional quality.`;
        }
        
        userPrompt = `Generate the complete, formatted script based on all the development work:

ONE LINE: ${previousPhaseContent?.oneLine}
SCENES: ${JSON.stringify(previousPhaseContent?.scenes)}
BEATS: ${JSON.stringify(previousPhaseContent?.beats)}

Create a professional ${baseFormat}${customTemplate ? ` following the "${customTemplate.name}" custom template` : ''} with:
- Proper formatting${customTemplate ? ' as specified in the custom template' : ''}
- Natural dialogue${customTemplate?.customRules?.tone ? ` matching the specified tone: ${customTemplate.customRules.tone}` : ''}
- Clear action lines
- Character development
- Visual storytelling
- Emotional progression

${customTemplate ? `Remember to strictly follow all custom template requirements for "${customTemplate.name}" while ensuring professional industry standards.` : 'The script should be production-ready and follow industry standards.'}

CRITICAL INSTRUCTION: Write the complete script from beginning to end. Include all scenes, all dialogue, all action lines. Do not stop mid-script or ask for permission to continue. Generate a complete, finished script that is ready for production use.`;
        break;
    }

    // Generate content using AI (Claude Sonnet)
    const { text: generatedContent } = await generateText({
      model: myProvider.languageModel('claude-sonnet'),
      system: systemPrompt,
      prompt: userPrompt,
      temperature: phase === 4 ? 0.7 : 0.8, // Slightly lower temperature for final script
      maxTokens: phase === 4 ? 8000 : 1500, // Increased for complete script generation
    });

    // Parse and structure the response based on phase
    let structuredResponse;
    
    switch (phase) {
      case 1:
        const options = generatedContent.match(/OPTION \d: (.+)/g) || [];
        const recommendation = generatedContent.match(/BEST RECOMMENDATION: (.+)/s)?.[1] || '';
        structuredResponse = {
          options: options.map(opt => opt.replace(/OPTION \d: /, '')),
          recommendation,
          fullContent: generatedContent
        };
        break;
        
      case 2:
        const sceneMatches = generatedContent.match(/SCENE \d: (.+)/g) || [];
        const structureNotes = generatedContent.match(/STRUCTURE NOTES: (.+)/s)?.[1] || '';
        
        // Parse and validate scene summaries
        const sceneSummaries = sceneMatches.map(scene => scene.replace(/SCENE \d: /, '').trim());
        
        // Log scene quality for debugging
        console.log(`[Phase 2] Generated ${sceneSummaries.length} scene summaries:`);
        sceneSummaries.forEach((summary, i) => {
          console.log(`  Scene ${i + 1}: ${summary.length} chars - ${summary.substring(0, 100)}...`);
          if (summary.length < 30) {
            console.warn(`  WARNING: Scene ${i + 1} may be too brief for rich Phase 3 generation`);
          }
        });
        
        structuredResponse = {
          scenes: sceneSummaries,
          structureNotes: structureNotes.trim(),
          fullContent: generatedContent,
          sceneCount: sceneSummaries.length,
          quality: {
            averageLength: sceneSummaries.reduce((sum, s) => sum + s.length, 0) / sceneSummaries.length,
            allScenesDetailed: sceneSummaries.every(s => s.length >= 30)
          }
        };
        break;
        
      case 3:
        // Parse detailed beats - this will be more complex
        structuredResponse = {
          beats: generatedContent,
          fullContent: generatedContent
        };
        break;
        
      case 4:
        structuredResponse = {
          script: generatedContent,
          format: previousPhaseContent?.format || 'screenplay',
          metadata: {
            pageCount: Math.ceil(generatedContent.length / 3000), // Rough estimate
            wordCount: generatedContent.split(' ').length,
            estimatedDuration: `${Math.ceil(generatedContent.length / 3000)} minutes`
          }
        };
        break;
    }

    return NextResponse.json({
      success: true,
      phase,
      generated: structuredResponse,
      regenerate: regenerate || false
    });

  } catch (error) {
    console.error('Generation API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    );
  }
}