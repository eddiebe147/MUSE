/**
 * ARC Generator - Advanced Narrative Intelligence System
 * Provides phase-specific AI assistance for professional story creation
 */

export interface StoryAnalysis {
  genre: string;
  tone: string;
  mainConflict: string;
  protagonist: {
    name: string;
    motivation: string;
    flaw: string;
    arc: string;
  };
  antagonist?: {
    name: string;
    motivation: string;
    opposition: string;
  };
  thematicElements: string[];
  emotionalBeats: Array<{
    beat: string;
    intensity: number;
    purpose: string;
  }>;
  storyPotential: {
    score: number;
    strengths: string[];
    improvements: string[];
  };
}

export interface SceneStructure {
  id: string;
  title: string;
  purpose: 'setup' | 'inciting_incident' | 'rising_action' | 'climax' | 'resolution';
  emotionalBeat: string;
  conflict: string;
  characterGoals: Array<{
    character: string;
    goal: string;
    obstacle: string;
  }>;
  pacing: 'slow' | 'medium' | 'fast';
  productionNotes: string[];
}

export interface SceneBreakdown {
  sceneId: string;
  beats: Array<{
    id: string;
    type: 'action' | 'dialogue' | 'internal' | 'description';
    content: string;
    character?: string;
    emotion: string;
    subtext?: string;
    productionNote?: string;
  }>;
  characterConsistency: Array<{
    character: string;
    traits: string[];
    arcProgress: string;
    warnings: string[];
  }>;
  tensionLevel: number;
  pacingNotes: string[];
}

export interface ExportFormat {
  type: 'beat_sheet' | 'screenplay' | 'treatment' | 'outline';
  content: string;
  metadata: {
    title: string;
    author: string;
    genre: string;
    pageCount: number;
    wordCount: number;
    estimatedDuration: string;
  };
  productionNotes: string[];
  industryStandards: {
    formatting: string[];
    requirements: string[];
    recommendations: string[];
  };
}

export class ARCGenerator {
  private genreRules: Map<string, any> = new Map();
  private characterDatabase: Map<string, any> = new Map();
  private structureTemplates: Map<string, any> = new Map();

  constructor() {
    this.initializeGenreRules();
    this.initializeStructureTemplates();
  }

  /**
   * PHASE 1: Analyze transcript and generate story foundations
   */
  async analyzeTranscriptForStory(transcript: string): Promise<StoryAnalysis> {
    // Simulate AI analysis of transcript content
    const words = transcript.toLowerCase().split(' ');
    const sentiment = this.analyzeSentiment(transcript);
    const characters = this.extractCharacters(transcript);
    const conflicts = this.identifyConflicts(transcript);

    // Mock analysis - in production, this would use actual AI
    const analysis: StoryAnalysis = {
      genre: this.determineGenre(words, sentiment),
      tone: sentiment.overall > 0.5 ? 'optimistic' : sentiment.overall < -0.3 ? 'dark' : 'neutral',
      mainConflict: conflicts[0] || "Internal struggle between security and taking risks",
      protagonist: {
        name: characters[0] || "Protagonist",
        motivation: "To overcome fear and pursue their dreams",
        flaw: "Self-doubt and fear of failure",
        arc: "From fearful to courageous"
      },
      antagonist: characters.length > 1 ? {
        name: characters[1] || "Antagonistic Force",
        motivation: "Maintain status quo",
        opposition: "Represents safety and conventional choices"
      } : undefined,
      thematicElements: this.extractThemes(transcript),
      emotionalBeats: this.identifyEmotionalBeats(transcript),
      storyPotential: this.assessStoryPotential(transcript, characters, conflicts)
    };

    return analysis;
  }

  async generateSummaryOptions(analysis: StoryAnalysis, userInput?: string): Promise<string[]> {
    const options = [
      `${analysis.protagonist.name} must overcome ${analysis.protagonist.flaw} to achieve ${analysis.protagonist.motivation}, confronting ${analysis.mainConflict} in this ${analysis.genre} story.`,
      `When ${analysis.mainConflict} threatens everything they hold dear, ${analysis.protagonist.name} discovers that ${analysis.protagonist.arc} is the only path to ${analysis.protagonist.motivation}.`,
      `A ${analysis.tone} ${analysis.genre} about ${analysis.protagonist.name} who learns that ${analysis.thematicElements[0]} requires confronting ${analysis.mainConflict}.`
    ];

    // Add user-influenced option if provided
    if (userInput) {
      options.unshift(this.refineUserSummary(userInput, analysis));
    }

    return options;
  }

  /**
   * PHASE 2: Generate scene structure with proper story arc
   */
  async generateSceneStructure(summary: string, analysis: StoryAnalysis): Promise<SceneStructure[]> {
    const genre = analysis.genre;
    const template = this.structureTemplates.get(genre) || this.structureTemplates.get('default');
    
    // Generate 3-4 core scenes based on story analysis
    const scenes: SceneStructure[] = [
      {
        id: 'scene_1',
        title: 'Setup & Inciting Incident',
        purpose: 'setup',
        emotionalBeat: 'Introduction and disruption',
        conflict: 'Establish normal world and introduce conflict',
        characterGoals: [{
          character: analysis.protagonist.name,
          goal: 'Maintain current situation',
          obstacle: 'Emerging conflict/opportunity'
        }],
        pacing: 'medium',
        productionNotes: ['Establish world and character clearly', 'Make inciting incident compelling']
      },
      {
        id: 'scene_2', 
        title: 'Rising Action & Commitment',
        purpose: 'rising_action',
        emotionalBeat: 'Commitment and complication',
        conflict: 'Protagonist commits to path, faces obstacles',
        characterGoals: [{
          character: analysis.protagonist.name,
          goal: 'Navigate new challenges',
          obstacle: 'External resistance and internal doubt'
        }],
        pacing: 'fast',
        productionNotes: ['Raise stakes', 'Develop character relationships']
      },
      {
        id: 'scene_3',
        title: 'Crisis & Dark Moment',
        purpose: 'climax',
        emotionalBeat: 'Crisis and transformation',
        conflict: 'Major crisis tests protagonist fully',
        characterGoals: [{
          character: analysis.protagonist.name,
          goal: 'Overcome ultimate challenge',
          obstacle: 'Maximum resistance and self-doubt'
        }],
        pacing: 'fast',
        productionNotes: ['Peak emotional intensity', 'Character transformation moment']
      },
      {
        id: 'scene_4',
        title: 'Resolution & New Equilibrium', 
        purpose: 'resolution',
        emotionalBeat: 'Resolution and growth',
        conflict: 'Consequences play out, new balance',
        characterGoals: [{
          character: analysis.protagonist.name,
          goal: 'Integrate lessons learned',
          obstacle: 'Accepting change and growth'
        }],
        pacing: 'medium',
        productionNotes: ['Show character growth', 'Satisfying conclusion']
      }
    ];

    return scenes;
  }

  async validateStoryStructure(scenes: SceneStructure[]): Promise<{
    isComplete: boolean;
    issues: string[];
    suggestions: string[];
  }> {
    const issues: string[] = [];
    const suggestions: string[] = [];

    // Check for essential story elements
    const purposes = scenes.map(s => s.purpose);
    if (!purposes.includes('setup')) {
      issues.push('Missing setup scene');
      suggestions.push('Add opening scene to establish character and world');
    }
    if (!purposes.includes('climax')) {
      issues.push('Missing climactic scene');
      suggestions.push('Add scene where protagonist faces ultimate challenge');
    }
    if (!purposes.includes('resolution')) {
      issues.push('Missing resolution scene');
      suggestions.push('Add concluding scene showing outcome and character growth');
    }

    // Check pacing variety
    const pacings = scenes.map(s => s.pacing);
    if (pacings.every(p => p === pacings[0])) {
      suggestions.push('Consider varying scene pacing for better rhythm');
    }

    return {
      isComplete: issues.length === 0,
      issues,
      suggestions
    };
  }

  /**
   * PHASE 3: Expand scenes with character consistency and pacing
   */
  async expandSceneWithBeats(sceneStructure: SceneStructure, previousScenes: SceneBreakdown[]): Promise<SceneBreakdown> {
    // Track character states from previous scenes
    const characterStates = this.trackCharacterDevelopment(previousScenes);
    
    const beats = await this.generateSceneBeats(sceneStructure, characterStates);
    const consistency = this.checkCharacterConsistency(beats, characterStates);
    const tensionLevel = this.calculateTensionLevel(sceneStructure, previousScenes);
    const pacingNotes = this.generatePacingNotes(sceneStructure, beats);

    return {
      sceneId: sceneStructure.id,
      beats,
      characterConsistency: consistency,
      tensionLevel,
      pacingNotes
    };
  }

  async maintainTensionAcrossScenes(scenes: SceneBreakdown[]): Promise<{
    tensionCurve: number[];
    recommendations: string[];
  }> {
    const tensionCurve = scenes.map(s => s.tensionLevel);
    const recommendations: string[] = [];

    // Analyze tension progression
    for (let i = 1; i < tensionCurve.length; i++) {
      const current = tensionCurve[i];
      const previous = tensionCurve[i - 1];
      
      if (current <= previous && i < tensionCurve.length - 1) {
        recommendations.push(`Scene ${i + 1}: Consider increasing tension from previous scene`);
      }
    }

    // Check for climactic peak
    const maxTension = Math.max(...tensionCurve);
    const maxIndex = tensionCurve.indexOf(maxTension);
    if (maxIndex < tensionCurve.length - 2) {
      recommendations.push('Consider moving highest tension closer to the end');
    }

    return { tensionCurve, recommendations };
  }

  /**
   * PHASE 4: Format for professional export
   */
  async formatForExport(
    scenes: SceneBreakdown[], 
    format: 'beat_sheet' | 'screenplay' | 'treatment' | 'outline',
    metadata: any
  ): Promise<ExportFormat> {
    let content = '';
    const productionNotes: string[] = [];
    const industryStandards = this.getIndustryStandards(format);

    switch (format) {
      case 'beat_sheet':
        content = this.formatBeatSheet(scenes);
        productionNotes.push('Each beat represents 2-3 minutes of screen time');
        break;
      case 'screenplay':
        content = this.formatScreenplay(scenes);
        productionNotes.push('Standard screenplay format: 1 page = 1 minute');
        break;
      case 'treatment':
        content = this.formatTreatment(scenes);
        productionNotes.push('Treatment should read like a short story');
        break;
      case 'outline':
        content = this.formatOutline(scenes);
        productionNotes.push('Detailed scene-by-scene breakdown');
        break;
    }

    return {
      type: format,
      content,
      metadata: {
        ...metadata,
        pageCount: this.estimatePageCount(content, format),
        wordCount: content.split(' ').length,
        estimatedDuration: this.estimateScreenTime(scenes)
      },
      productionNotes,
      industryStandards
    };
  }

  // Private helper methods
  private initializeGenreRules(): void {
    this.genreRules.set('drama', {
      themes: ['family', 'relationships', 'personal growth'],
      pacing: 'medium',
      structure: 'three-act'
    });
    this.genreRules.set('comedy', {
      themes: ['misunderstanding', 'social situations', 'timing'],
      pacing: 'fast',
      structure: 'episodic'
    });
    this.genreRules.set('thriller', {
      themes: ['danger', 'secrets', 'time pressure'],
      pacing: 'fast',
      structure: 'rising-tension'
    });
  }

  private initializeStructureTemplates(): void {
    this.structureTemplates.set('default', {
      acts: 3,
      scenes: 4,
      structure: ['setup', 'rising_action', 'climax', 'resolution']
    });
  }

  private analyzeSentiment(text: string): { overall: number; emotions: string[] } {
    // Mock sentiment analysis
    const positiveWords = ['happy', 'good', 'great', 'love', 'amazing'];
    const negativeWords = ['sad', 'bad', 'terrible', 'hate', 'awful'];
    
    const words = text.toLowerCase().split(' ');
    let score = 0;
    
    words.forEach(word => {
      if (positiveWords.includes(word)) score += 1;
      if (negativeWords.includes(word)) score -= 1;
    });
    
    return {
      overall: score / words.length,
      emotions: score > 0 ? ['hopeful', 'positive'] : ['conflicted', 'tense']
    };
  }

  private extractCharacters(text: string): string[] {
    // Mock character extraction
    const names = text.match(/\b[A-Z][a-z]+\b/g) || [];
    return [...new Set(names)].slice(0, 3);
  }

  private identifyConflicts(text: string): string[] {
    // Mock conflict identification
    return [
      "Internal struggle between security and taking risks",
      "Relationship tension and communication barriers",
      "Career versus personal fulfillment"
    ];
  }

  private determineGenre(words: string[], sentiment: any): string {
    if (words.includes('family') || words.includes('relationship')) return 'drama';
    if (words.includes('funny') || sentiment.overall > 0.7) return 'comedy';
    if (words.includes('danger') || words.includes('secret')) return 'thriller';
    return 'drama';
  }

  private extractThemes(text: string): string[] {
    return ['Self-discovery', 'Courage vs Fear', 'Following dreams'];
  }

  private identifyEmotionalBeats(text: string): Array<{beat: string; intensity: number; purpose: string}> {
    return [
      { beat: 'Initial comfort zone', intensity: 3, purpose: 'Establish baseline' },
      { beat: 'Disruption/opportunity', intensity: 7, purpose: 'Create catalyst' },
      { beat: 'Crisis of confidence', intensity: 9, purpose: 'Test character' },
      { beat: 'Resolution/growth', intensity: 6, purpose: 'Show transformation' }
    ];
  }

  private assessStoryPotential(text: string, characters: string[], conflicts: string[]): {
    score: number;
    strengths: string[];
    improvements: string[];
  } {
    return {
      score: 8.5,
      strengths: [
        'Clear character motivations',
        'Relatable universal themes', 
        'Strong emotional resonance'
      ],
      improvements: [
        'Develop antagonistic forces',
        'Add specific stakes',
        'Clarify genre elements'
      ]
    };
  }

  private refineUserSummary(userInput: string, analysis: StoryAnalysis): string {
    // Enhance user's summary with ARC intelligence
    return `${userInput} - A ${analysis.genre} exploring ${analysis.thematicElements[0]} through ${analysis.protagonist.name}'s journey from ${analysis.protagonist.flaw} to ${analysis.protagonist.arc}.`;
  }

  private trackCharacterDevelopment(previousScenes: SceneBreakdown[]): Map<string, any> {
    // Track how characters have evolved through previous scenes
    const characterStates = new Map();
    // Implementation would analyze character progression
    return characterStates;
  }

  private async generateSceneBeats(structure: SceneStructure, characterStates: Map<string, any>): Promise<Array<{
    id: string;
    type: 'action' | 'dialogue' | 'internal' | 'description';
    content: string;
    character?: string;
    emotion: string;
    subtext?: string;
    productionNote?: string;
  }>> {
    // Generate detailed scene beats based on structure
    return [
      {
        id: 'beat_1',
        type: 'description',
        content: 'Opening establishes the scene and character state',
        emotion: 'neutral',
        productionNote: 'Focus on visual storytelling'
      }
    ];
  }

  private checkCharacterConsistency(beats: any[], characterStates: Map<string, any>): Array<{
    character: string;
    traits: string[];
    arcProgress: string;
    warnings: string[];
  }> {
    return [
      {
        character: 'Protagonist',
        traits: ['determined', 'conflicted'],
        arcProgress: 'Beginning transformation',
        warnings: []
      }
    ];
  }

  private calculateTensionLevel(structure: SceneStructure, previousScenes: SceneBreakdown[]): number {
    // Calculate tension based on scene purpose and progression
    const purposeTensionMap = {
      'setup': 3,
      'inciting_incident': 5,
      'rising_action': 7,
      'climax': 9,
      'resolution': 4
    };
    return purposeTensionMap[structure.purpose] || 5;
  }

  private generatePacingNotes(structure: SceneStructure, beats: any[]): string[] {
    return [
      `Scene pacing: ${structure.pacing}`,
      `Beat count: ${beats.length} beats`,
      'Consider varying beat lengths for rhythm'
    ];
  }

  private getIndustryStandards(format: string): {
    formatting: string[];
    requirements: string[];
    recommendations: string[];
  } {
    const standards = {
      'beat_sheet': {
        formatting: ['12-point Courier font', 'Single-spaced', '1-inch margins'],
        requirements: ['Clear scene numbers', 'Concise beat descriptions'],
        recommendations: ['Include emotional stakes', 'Note production requirements']
      },
      'screenplay': {
        formatting: ['12-point Courier font', 'Proper screenplay format', 'Standard margins'],
        requirements: ['Scene headings (FADE IN, etc.)', 'Character names in caps'],
        recommendations: ['Action lines under 4 lines', 'White space for readability']
      },
      'treatment': {
        formatting: ['12-point standard font', 'Double-spaced', 'Narrative style'],
        requirements: ['Present tense', 'Character names in caps on introduction'],
        recommendations: ['2-5 pages typical', 'Include logline at top']
      },
      'outline': {
        formatting: ['Standard document format', 'Clear hierarchical structure'],
        requirements: ['Scene-by-scene breakdown', 'Character motivations'],
        recommendations: ['Include production notes', 'Note budget considerations']
      }
    };

    return standards[format] || standards['outline'];
  }

  private formatBeatSheet(scenes: SceneBreakdown[]): string {
    let content = "BEAT SHEET\n\n";
    scenes.forEach((scene, index) => {
      content += `SCENE ${index + 1}\n`;
      scene.beats.forEach((beat, beatIndex) => {
        content += `${beatIndex + 1}. ${beat.content}\n`;
      });
      content += "\n";
    });
    return content;
  }

  private formatScreenplay(scenes: SceneBreakdown[]): string {
    let content = "FADE IN:\n\n";
    // Basic screenplay formatting implementation
    scenes.forEach((scene, index) => {
      content += `INT. SCENE ${index + 1} - DAY\n\n`;
      scene.beats.forEach(beat => {
        if (beat.type === 'dialogue' && beat.character) {
          content += `${beat.character.toUpperCase()}\n${beat.content}\n\n`;
        } else {
          content += `${beat.content}\n\n`;
        }
      });
    });
    content += "FADE OUT.";
    return content;
  }

  private formatTreatment(scenes: SceneBreakdown[]): string {
    let content = "TREATMENT\n\n";
    scenes.forEach((scene, index) => {
      scene.beats.forEach(beat => {
        content += `${beat.content} `;
      });
      content += "\n\n";
    });
    return content;
  }

  private formatOutline(scenes: SceneBreakdown[]): string {
    let content = "DETAILED OUTLINE\n\n";
    scenes.forEach((scene, index) => {
      content += `SCENE ${index + 1}:\n`;
      scene.beats.forEach((beat, beatIndex) => {
        content += `  ${beatIndex + 1}. ${beat.content}`;
        if (beat.productionNote) {
          content += ` [Note: ${beat.productionNote}]`;
        }
        content += "\n";
      });
      content += "\n";
    });
    return content;
  }

  private estimatePageCount(content: string, format: string): number {
    const wordsPerPage = {
      'beat_sheet': 400,
      'screenplay': 250,
      'treatment': 350,
      'outline': 400
    };
    const wordCount = content.split(' ').length;
    return Math.ceil(wordCount / (wordsPerPage[format] || 350));
  }

  private estimateScreenTime(scenes: SceneBreakdown[]): string {
    // Rough estimate: each scene beat = 30 seconds to 1 minute
    const totalBeats = scenes.reduce((sum, scene) => sum + scene.beats.length, 0);
    const minutes = Math.ceil(totalBeats * 0.75);
    return `${minutes} minutes`;
  }
}