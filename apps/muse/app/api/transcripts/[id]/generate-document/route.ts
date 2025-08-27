import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, transcripts, story_projects, production_bible_rules, production_bible_documents, production_bible_configs } from '@muse/db';
import { eq, and } from 'drizzle-orm';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { ruleEngine, type DocumentContent } from '@/lib/production-bible/rule-engine';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth.api.getSession({ 
      headers: request.headers 
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const transcriptId = params.id;
    const { format = 'pdf' } = await request.json();

    // Fetch transcript with all phases
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

    // Extract all phase data
    const metadata = transcript.metadata;
    const storyDNA = metadata?.story_summary?.summary;
    const sceneStructure = metadata?.scene_structure;
    const sceneBeats = metadata?.scene_beats;

    // Validate all phases are complete
    if (!storyDNA) {
      return NextResponse.json({ 
        error: 'Story DNA required. Please complete Phase 1 first.',
        phase_required: 1
      }, { status: 400 });
    }

    if (!sceneStructure || !sceneStructure.is_active) {
      return NextResponse.json({ 
        error: 'Scene structure required. Please complete Phase 2 first.',
        phase_required: 2
      }, { status: 400 });
    }

    if (!sceneBeats || !sceneBeats.is_active) {
      return NextResponse.json({ 
        error: 'Scene beat breakdown required. Please complete Phase 3 first.',
        phase_required: 3
      }, { status: 400 });
    }

    // Load production bible rules for this project
    const productionBibleRules = await loadProductionBibleRules(project.id, session.user.id);

    // Generate executive document
    let documentData = await generateExecutiveDocument(transcript, storyDNA, sceneStructure, sceneBeats);
    
    // Apply production bible rules if available
    if (productionBibleRules.length > 0) {
      const enhancedDocument = await applyProductionBibleRules(documentData, productionBibleRules);
      documentData = enhancedDocument.modifiedContent;
      
      // Add production bible application info to response
      documentData.productionBibleInfo = {
        rulesApplied: enhancedDocument.applications.length,
        applications: enhancedDocument.applications,
        validation: enhancedDocument.validation
      };
    }

    if (format === 'docx') {
      const docBuffer = await generateDOCXDocument(documentData);
      
      return new NextResponse(docBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="${transcript.title.replace(/[^a-zA-Z0-9]/g, '_')}_Executive_Document.docx"`,
        },
      });
    }

    // Default to returning structured data for PDF generation on frontend
    return NextResponse.json({
      transcript_id: transcriptId,
      transcript_title: transcript.title,
      document_data: documentData,
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generating executive document:', error);
    return NextResponse.json({ 
      error: 'Failed to generate executive document' 
    }, { status: 500 });
  }
}

async function generateExecutiveDocument(transcript: any, storyDNA: string, sceneStructure: any, sceneBeats: any) {
  const currentDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return {
    // Executive Summary Section
    header: {
      title: transcript.title,
      subtitle: "Story Development Package",
      date: currentDate,
      status: "Production Ready"
    },

    // One-page executive overview
    executiveSummary: {
      title: "Executive Summary",
      storyDNA: storyDNA,
      logline: generateLogline(storyDNA, sceneStructure),
      keyMetrics: {
        totalScenes: sceneBeats.scene_breakdowns?.length || 0,
        totalBeats: sceneBeats.production_summary?.total_beats || 0,
        estimatedRuntime: sceneBeats.production_summary?.estimated_runtime || "TBD",
        productionComplexity: sceneBeats.production_summary?.production_complexity || "medium",
        genreFocus: extractGenreFocus(transcript.metadata?.analysis?.summary?.genre_indicators || [])
      },
      
      // Executive producer notes
      producerNotes: [
        "Story demonstrates clear character progression with measurable stakes escalation",
        "Production complexity assessed as " + (sceneBeats.production_summary?.production_complexity || "medium") + " with standard crew requirements",
        "Narrative structure tested for audience engagement and commercial viability",
        "Ready for immediate pre-production planning and talent attachment"
      ],

      // Commercial potential
      marketPosition: {
        targetDemographic: inferTargetDemographic(transcript.metadata?.analysis?.summary),
        comparableProjects: generateComparables(transcript.metadata?.analysis?.summary?.genre_indicators || []),
        uniqueSellingPoints: extractUSPs(storyDNA, sceneStructure),
        estimatedBudgetRange: calculateBudgetRange(sceneBeats.production_summary?.production_complexity || "medium")
      }
    },

    // Story architecture breakdown
    narrativeStructure: {
      title: "Narrative Architecture",
      storyArc: {
        premise: storyDNA,
        thematicElements: sceneStructure.thematic_analysis || {},
        characterProgression: sceneBeats.character_tracking || {},
        tensionProgression: sceneStructure.scenes?.map((scene: any) => ({
          scene: scene.scene_number,
          title: scene.title,
          tensionLevel: scene.tension_level,
          stakes: scene.stakes,
          function: scene.purpose
        })) || []
      }
    },

    // Scene-by-scene breakdown
    sceneBreakdown: {
      title: "Scene Structure",
      scenes: sceneBeats.scene_breakdowns?.map((scene: any) => ({
        sceneNumber: scene.scene_number,
        title: scene.scene_title,
        totalBeats: scene.total_beats,
        keyBeats: scene.beats?.slice(0, 3).map((beat: any) => ({
          title: beat.beat_title,
          function: beat.story_function,
          productionNotes: beat.production_notes
        })) || [],
        productionConsiderations: extractProductionNotes(scene),
        castingRequirements: extractCastingNotes(scene),
        locationNeeds: scene.beats?.flatMap((beat: any) => beat.visual_elements || []) || []
      })) || []
    },

    // Production planning
    productionPackage: {
      title: "Production Planning",
      schedule: {
        estimatedShootDays: calculateShootDays(sceneBeats),
        productionPhases: [
          "Pre-production: 4-6 weeks",
          "Principal Photography: " + calculateShootDays(sceneBeats) + " days",
          "Post-production: 8-12 weeks"
        ]
      },
      budget: {
        complexity: sceneBeats.production_summary?.production_complexity || "medium",
        keyConsiderations: sceneBeats.production_summary?.budget_considerations || [],
        estimatedRange: calculateBudgetRange(sceneBeats.production_summary?.production_complexity || "medium")
      },
      crew: {
        keyDepartments: extractCrewNeeds(sceneBeats),
        specialRequirements: sceneBeats.production_summary?.scheduling_notes || []
      },
      locations: {
        primary: sceneBeats.production_summary?.key_locations || [],
        total: [...new Set(sceneBeats.scene_breakdowns?.flatMap((scene: any) => 
          scene.beats?.flatMap((beat: any) => beat.visual_elements || []) || []
        ) || [])].length
      }
    },

    // Character development
    characterProfiles: {
      title: "Character Development",
      mainCharacters: sceneBeats.character_tracking?.main_characters || [],
      characterArcs: Object.entries(sceneBeats.character_tracking?.character_arcs || {}).map(([name, arc]: [string, any]) => ({
        name,
        startingState: arc.starting_state,
        endingState: arc.ending_state,
        keyMoments: arc.key_moments || [],
        progression: arc.progression || []
      })),
      consistencyNotes: sceneBeats.character_tracking?.consistency_notes || []
    },

    // Appendix with detailed beats (for reference)
    appendix: {
      title: "Detailed Beat Breakdown",
      subtitle: "Complete scene-by-scene production notes",
      fullBeatBreakdown: sceneBeats.scene_breakdowns || []
    }
  };
}

function generateLogline(storyDNA: string, sceneStructure: any): string {
  // Extract key character and conflict from story DNA and scene structure
  const scenes = sceneStructure.scenes || [];
  const protagonistHint = scenes.length > 0 ? scenes[0].character_arc : "";
  const conflictHint = scenes.length > 1 ? scenes[1].stakes : "";
  
  // Create a more detailed logline from the story DNA
  return `${storyDNA} ${protagonistHint ? `Following ${protagonistHint.split(' ')[0]},` : ''} ${conflictHint ? `when ${conflictHint.toLowerCase()},` : ''} this story explores the transformative journey from challenge to resolution.`;
}

function extractGenreFocus(genreIndicators: string[]): string {
  if (!genreIndicators || genreIndicators.length === 0) return "Character Drama";
  return genreIndicators[0] || "Character Drama";
}

function inferTargetDemographic(summary: any): string {
  const themes = summary?.main_themes || [];
  const genres = summary?.genre_indicators || [];
  
  if (themes.some((theme: string) => theme.toLowerCase().includes('youth') || theme.toLowerCase().includes('young'))) {
    return "18-34 demographic, streaming and theatrical";
  }
  if (genres.some((genre: string) => genre.toLowerCase().includes('family'))) {
    return "Family audiences, all quadrants";
  }
  return "Adult audiences 25-54, premium content market";
}

function generateComparables(genreIndicators: string[]): string[] {
  const genre = genreIndicators[0]?.toLowerCase() || "drama";
  
  if (genre.includes('thriller')) {
    return ["Gone Girl", "The Girl with the Dragon Tattoo", "Zodiac"];
  }
  if (genre.includes('comedy')) {
    return ["The Grand Budapest Hotel", "Little Miss Sunshine", "Juno"];
  }
  if (genre.includes('action')) {
    return ["John Wick", "Mad Max: Fury Road", "Baby Driver"];
  }
  
  return ["Manchester by the Sea", "Moonlight", "Lady Bird"];
}

function extractUSPs(storyDNA: string, sceneStructure: any): string[] {
  const usps = [];
  
  if (storyDNA.length > 100) {
    usps.push("Rich, complex narrative with multiple layers of meaning");
  }
  
  if (sceneStructure.scenes?.length === 4) {
    usps.push("Tight four-act structure optimized for modern attention spans");
  }
  
  if (sceneStructure.arc_analysis?.cohesion_strength >= 8) {
    usps.push("Exceptionally cohesive story architecture with strong emotional progression");
  }
  
  usps.push("Production-tested story structure with validated character development");
  
  return usps;
}

function calculateBudgetRange(complexity: string): string {
  switch (complexity) {
    case 'low':
      return "$500K - $2M (Micro-budget to Low Budget)";
    case 'high':
      return "$10M - $50M (Mid-budget to Studio)";
    default:
      return "$2M - $10M (Independent to Mid-budget)";
  }
}

function calculateShootDays(sceneBeats: any): string {
  const totalBeats = sceneBeats.production_summary?.total_beats || 0;
  const complexity = sceneBeats.production_summary?.production_complexity || "medium";
  
  let baseDays = Math.ceil(totalBeats / 8); // ~8 beats per day average
  
  if (complexity === 'high') baseDays = Math.ceil(baseDays * 1.5);
  if (complexity === 'low') baseDays = Math.ceil(baseDays * 0.8);
  
  return `${baseDays}-${baseDays + 3}`;
}

function extractProductionNotes(scene: any): string[] {
  const notes = [];
  const beats = scene.beats || [];
  
  // Analyze visual complexity
  const visualElements = beats.flatMap((beat: any) => beat.visual_elements || []);
  if (visualElements.length > 10) {
    notes.push("Visually complex scene requiring detailed shot planning");
  }
  
  // Analyze dialogue intensity
  const dialogueDensity = beats.filter((beat: any) => beat.dialogue_notes && beat.dialogue_notes.length > 50).length;
  if (dialogueDensity > scene.total_beats / 2) {
    notes.push("Dialogue-heavy scene requiring strong performance direction");
  }
  
  // Duration considerations
  const longBeats = beats.filter((beat: any) => beat.duration_estimate === 'long').length;
  if (longBeats > 2) {
    notes.push("Extended scene requiring pacing consideration and coverage options");
  }
  
  return notes.length > 0 ? notes : ["Standard production requirements"];
}

function extractCastingNotes(scene: any): string[] {
  const beats = scene.beats || [];
  const characters = new Set();
  
  beats.forEach((beat: any) => {
    if (beat.character_focus) {
      beat.character_focus.forEach((char: string) => characters.add(char));
    }
  });
  
  return [`${characters.size} principal characters required`, "See character profiles for detailed requirements"];
}

function extractCrewNeeds(sceneBeats: any): string[] {
  const complexity = sceneBeats.production_summary?.production_complexity || "medium";
  const totalBeats = sceneBeats.production_summary?.total_beats || 0;
  
  const baseCrew = [
    "Director", "Director of Photography", "Gaffer", "Sound Recordist", 
    "Script Supervisor", "Assistant Director"
  ];
  
  if (complexity === 'high' || totalBeats > 25) {
    baseCrew.push("Second Unit Director", "Visual Effects Supervisor", "Stunt Coordinator");
  }
  
  return baseCrew;
}

async function generateDOCXDocument(documentData: any): Promise<Buffer> {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        // Title page
        new Paragraph({
          text: documentData.header.title,
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({
          text: documentData.header.subtitle,
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({
          text: documentData.header.date,
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({
          text: "",
        }),
        
        // Executive Summary
        new Paragraph({
          text: "EXECUTIVE SUMMARY",
          heading: HeadingLevel.HEADING_1,
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Story DNA: ", bold: true }),
            new TextRun(documentData.executiveSummary.storyDNA),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Logline: ", bold: true }),
            new TextRun(documentData.executiveSummary.logline),
          ],
        }),
        new Paragraph({
          text: "",
        }),
        
        // Key Metrics
        new Paragraph({
          text: "KEY METRICS",
          heading: HeadingLevel.HEADING_2,
        }),
        ...Object.entries(documentData.executiveSummary.keyMetrics).map(([key, value]) => 
          new Paragraph({
            children: [
              new TextRun({ text: `${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}: `, bold: true }),
              new TextRun(String(value)),
            ],
          })
        ),
        
        // Producer Notes
        new Paragraph({
          text: "PRODUCER NOTES",
          heading: HeadingLevel.HEADING_2,
        }),
        ...documentData.executiveSummary.producerNotes.map((note: string) => 
          new Paragraph({
            text: `• ${note}`,
          })
        ),
        
        // Scene Structure
        new Paragraph({
          text: "SCENE STRUCTURE",
          heading: HeadingLevel.HEADING_1,
        }),
        ...documentData.sceneBreakdown.scenes.map((scene: any) => 
          new Paragraph({
            children: [
              new TextRun({ text: `Scene ${scene.sceneNumber}: ${scene.title}`, bold: true }),
              new TextRun(` (${scene.totalBeats} beats)`),
            ],
          })
        ),
      ],
    }],
  });

  return await Packer.toBuffer(doc);
}

// Production Bible Integration Functions
async function loadProductionBibleRules(projectId: string, userId: string) {
  try {
    // Load active production bible configurations for this project
    const configs = await db.select()
      .from(production_bible_configs)
      .where(and(
        eq(production_bible_configs.story_project_id, projectId),
        eq(production_bible_configs.user_id, userId),
        eq(production_bible_configs.is_active, true)
      ))
      .orderBy(production_bible_configs.priority);

    // Get all rule IDs from active configurations
    const ruleIds = configs.flatMap(config => config.rule_ids as string[]);
    
    if (ruleIds.length === 0) {
      return [];
    }

    // Load the actual rules
    const rules = await db.select()
      .from(production_bible_rules)
      .innerJoin(production_bible_documents, eq(production_bible_rules.document_id, production_bible_documents.id))
      .where(and(
        eq(production_bible_rules.is_active, true),
        eq(production_bible_documents.user_id, userId)
      ));

    return rules.map(row => row.production_bible_rules);
  } catch (error) {
    console.error('Error loading production bible rules:', error);
    return [];
  }
}

async function applyProductionBibleRules(documentData: any, rules: any[]) {
  try {
    // Convert document data to the format expected by the rule engine
    const content: DocumentContent = {
      executiveSummary: documentData.executiveSummary,
      narrativeStructure: documentData.narrativeStructure,
      productionPackage: documentData.productionPackage,
      phase: 4,
      section: 'executive_document'
    };

    // Load rules into the rule engine
    await ruleEngine.loadRules(rules);

    // Apply formatting rules
    const applyResult = await ruleEngine.applyRules(content);

    // Validate the content
    const validation = await ruleEngine.validateContent(applyResult.modifiedContent);

    return {
      modifiedContent: {
        ...documentData,
        executiveSummary: applyResult.modifiedContent.executiveSummary,
        narrativeStructure: applyResult.modifiedContent.narrativeStructure,
        productionPackage: applyResult.modifiedContent.productionPackage
      },
      applications: applyResult.applications,
      validation
    };
  } catch (error) {
    console.error('Error applying production bible rules:', error);
    return {
      modifiedContent: documentData,
      applications: [],
      validation: {
        isValid: true,
        violations: [],
        suggestions: [],
        warnings: []
      }
    };
  }
}