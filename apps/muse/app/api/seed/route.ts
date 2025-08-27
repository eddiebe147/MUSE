import { NextResponse } from 'next/server';
import { db, story_templates } from '@muse/db';
import { eq } from 'drizzle-orm';

const BUILTIN_TEMPLATES = [
  {
    name: 'Reality Competition Series',
    category: 'Television',
    subcategory: 'Reality TV',
    description: 'Create compelling competition-based reality TV with strategic eliminations and character-driven drama',
    structureConfig: {
      episodeStructure: ['Opening Hook', 'Challenge Introduction', 'Competition Phase', 'Drama/Strategy', 'Elimination', 'Next Episode Tease'],
      characterTypes: ['The Hero', 'The Villain', 'The Strategist', 'The Underdog', 'The Wild Card'],
      narrativeArcs: ['Season-long competition', 'Individual character journeys', 'Alliance dynamics', 'Power shifts']
    },
    formattingRules: {
      episodeLength: '42-44 minutes',
      actStructure: '4-act structure with commercial breaks',
      confessionalStyle: 'Individual to-camera interviews'
    },
    qualityChecklist: [
      'Clear competition rules established',
      'Diverse and compelling cast',
      'Multiple story threads per episode',
      'Balance between competition and personal drama',
      'Satisfying elimination process'
    ],
    phaseTemplates: {
      development: ['Casting strategy', 'Competition design', 'Location scouting', 'Story producer hiring'],
      preProduction: ['Cast selection', 'Challenge testing', 'Set construction', 'Crew briefing'],
      production: ['Daily filming schedule', 'Confessional shooting', 'Challenge execution', 'Story tracking'],
      postProduction: ['Story editing', 'Music and sound', 'Graphics package', 'Network notes']
    },
    exampleProjects: ['Survivor', 'Big Brother', 'The Challenge', 'Love Island'],
    tags: ['Competition', 'Reality', 'Drama', 'Strategy', 'Elimination'],
    difficultyLevel: 'intermediate' as const,
    estimatedDuration: '6-8 weeks development',
    isBuiltin: true,
    isFeatured: true,
    usageCount: 0,
    ratingAverage: 0,
    ratingCount: 0
  },
  {
    name: 'Three-Act Feature Film',
    category: 'Film',
    subcategory: 'Feature Film',
    description: 'Classic three-act structure optimized for modern audiences and streaming platforms',
    structureConfig: {
      actStructure: [
        { act: 'Act I', pages: '1-25', purpose: 'Setup, inciting incident, plot point 1' },
        { act: 'Act II-A', pages: '25-50', purpose: 'Rising action, complications, midpoint' },
        { act: 'Act II-B', pages: '50-75', purpose: 'Escalating stakes, plot point 2' },
        { act: 'Act III', pages: '75-90', purpose: 'Climax, resolution, denouement' }
      ],
      keyBeats: ['Opening Image', 'Inciting Incident', 'Plot Point 1', 'Midpoint', 'Plot Point 2', 'Climax', 'Resolution'],
      characterArcs: ['Protagonist journey', 'Antagonist motivation', 'Supporting character functions']
    },
    formattingRules: {
      pageCount: '90-120 pages',
      fontFamily: 'Courier 12pt',
      margins: 'Standard screenplay format',
      sceneHeaders: 'INT./EXT. LOCATION - TIME'
    },
    qualityChecklist: [
      'Clear protagonist with defined goal',
      'Compelling antagonist with understandable motivation',
      'Strong inciting incident within first 15 pages',
      'Escalating obstacles and stakes',
      'Satisfying character resolution',
      'Visual storytelling throughout'
    ],
    phaseTemplates: {
      development: ['Concept development', 'Character creation', 'Outline/treatment', 'First draft'],
      revision: ['Script notes', 'Character refinement', 'Structure tightening', 'Dialogue polish'],
      production: ['Director collaboration', 'Actor input', 'Production rewrites', 'Set modifications'],
      postProduction: ['Editor feedback', 'Test screening notes', 'Final polish', 'Delivery prep']
    },
    exampleProjects: ['Parasite', 'Knives Out', 'Everything Everywhere All at Once', 'The Menu'],
    tags: ['Feature', 'Screenplay', 'Three-Act', 'Character-Driven', 'Commercial'],
    difficultyLevel: 'intermediate' as const,
    estimatedDuration: '8-12 weeks development',
    isBuiltin: true,
    isFeatured: true,
    usageCount: 0,
    ratingAverage: 0,
    ratingCount: 0
  },
  {
    name: 'Literary Fiction Novel',
    category: 'Written',
    subcategory: 'Novel/Fiction',
    description: 'Character-driven literary fiction with emphasis on prose style, theme, and emotional depth',
    structureConfig: {
      narrative: ['Character-driven plot', 'Internal conflict focus', 'Thematic development', 'Layered storytelling'],
      chapterStructure: ['Scene-sequel pattern', 'Multiple POVs (optional)', 'Time structure variations', 'Thematic chapters'],
      characterDevelopment: ['Flawed protagonist', 'Character relationships', 'Internal monologue', 'Symbolic elements']
    },
    formattingRules: {
      wordCount: '80,000-100,000 words',
      chapters: '15-25 chapters',
      perspective: 'First or third person',
      tense: 'Past or present tense'
    },
    qualityChecklist: [
      'Distinctive prose voice',
      'Complex, believable characters',
      'Meaningful themes explored',
      'Emotional resonance',
      'Strong opening and closing',
      'Consistent point of view'
    ],
    phaseTemplates: {
      planning: ['Character development', 'Theme exploration', 'Research phase', 'Outline creation'],
      drafting: ['First draft completion', 'Daily writing goals', 'Character consistency', 'Voice maintenance'],
      revision: ['Structural edits', 'Character arc refinement', 'Prose enhancement', 'Theme strengthening'],
      polish: ['Line editing', 'Copy editing', 'Proofreading', 'Final manuscript prep']
    },
    exampleProjects: ['The Goldfinch', 'A Little Life', 'Normal People', 'The Seven Husbands of Evelyn Hugo'],
    tags: ['Literary', 'Character-Driven', 'Prose', 'Theme', 'Emotional'],
    difficultyLevel: 'advanced' as const,
    estimatedDuration: '12-18 weeks development',
    isBuiltin: true,
    isFeatured: true,
    usageCount: 0,
    ratingAverage: 0,
    ratingCount: 0
  },
  {
    name: 'Workplace Comedy Series',
    category: 'Television',
    subcategory: 'Comedy Series',
    description: 'Ensemble workplace comedy with mockumentary style and character-driven humor',
    structureConfig: {
      episodeStructure: ['Cold Open', 'Act I Setup', 'Act II Complications', 'Act III Resolution', 'Tag/Epilogue'],
      ensembleDynamics: ['Boss/employee relationships', 'Workplace hierarchies', 'Romantic subplots', 'Friendship bonds'],
      humorTypes: ['Situational comedy', 'Character-based humor', 'Workplace absurdity', 'Relationship comedy']
    },
    formattingRules: {
      episodeLength: '22 minutes',
      style: 'Mockumentary or traditional sitcom',
      cameraWork: 'Single-camera or multi-camera',
      confessionals: 'Optional talking heads'
    },
    qualityChecklist: [
      'Distinct character voices and personalities',
      'Workplace setting feels authentic',
      'Multiple comedic storylines per episode',
      'Character growth over time',
      'Relatable workplace situations',
      'Balance between humor and heart'
    ],
    phaseTemplates: {
      development: ['Workplace research', 'Character creation', 'Pilot script', 'Series bible'],
      production: ['Writers room', 'Script development', 'Character consistency', 'Episode arcs'],
      filming: ['Performance direction', 'Improvisation capture', 'Multiple takes', 'Editing choices'],
      postProduction: ['Comedy timing', 'Music selection', 'Final cut', 'Network feedback']
    },
    exampleProjects: ['The Office', 'Parks and Recreation', 'Brooklyn Nine-Nine', 'Ted Lasso'],
    tags: ['Comedy', 'Workplace', 'Ensemble', 'Mockumentary', 'Character-Comedy'],
    difficultyLevel: 'intermediate' as const,
    estimatedDuration: '4-6 weeks for pilot',
    isBuiltin: true,
    isFeatured: true,
    usageCount: 0,
    ratingAverage: 0,
    ratingCount: 0
  }
];

export async function POST() {
  try {
    // Check if templates already exist
    const existingTemplates = await db
      .select()
      .from(story_templates)
      .where(eq(story_templates.isBuiltin, true));
    
    if (existingTemplates.length > 0) {
      return NextResponse.json({
        success: true,
        message: `Found ${existingTemplates.length} existing built-in templates, skipping seed.`,
        templates: existingTemplates
      });
    }

    // Insert built-in templates
    const insertedTemplates = await db
      .insert(story_templates)
      .values(BUILTIN_TEMPLATES)
      .returning();

    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${insertedTemplates.length} built-in templates`,
      templates: insertedTemplates
    });
    
  } catch (error) {
    console.error('Error seeding built-in templates:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to seed templates' },
      { status: 500 }
    );
  }
}