/**
 * Living Story Engine - Manages dynamic updates across all 4 phases
 * Ensures narrative consistency and handles ripple updates
 */

export interface StoryPhase {
  phase: number;
  content: any;
  lastUpdated: Date;
  isLocked: boolean;
  version: number;
}

export interface StoryData {
  projectId: string;
  phase1: {
    summary: string;
    themes?: string[];
    characters?: string[];
    genre?: string;
  };
  phase2: {
    scenes: Array<{
      id: string;
      title: string;
      description: string;
      purpose: string;
      order: number;
    }>;
  };
  phase3: {
    sceneBreakdowns: Array<{
      sceneId: string;
      beats: Array<{
        id: string;
        description: string;
        characters: string[];
        emotions: string[];
        conflicts: string[];
      }>;
    }>;
  };
  phase4: {
    format: 'beat_sheet' | 'screenplay' | 'treatment' | 'outline';
    content: string;
    exportReady: boolean;
  };
}

export interface UpdateOperation {
  id: string;
  timestamp: Date;
  sourcePhase: number;
  affectedPhases: number[];
  changes: Record<string, any>;
  previousState: Partial<StoryData>;
  reason: string;
}

export interface ConsistencyIssue {
  id: string;
  type: 'character_inconsistency' | 'plot_hole' | 'timeline_conflict' | 'emotional_disconnect';
  severity: 'low' | 'medium' | 'high';
  description: string;
  affectedPhases: number[];
  suggestedFix?: string;
}

export class LivingStoryEngine {
  private storyData: StoryData;
  private updateHistory: UpdateOperation[] = [];
  private maxHistorySize = 50;
  private consistencyChecks: ConsistencyIssue[] = [];
  
  constructor(initialData: StoryData) {
    this.storyData = { ...initialData };
  }

  /**
   * Main update method - handles all cross-phase updates
   */
  async updatePhase(
    phase: number, 
    newContent: any, 
    options: { 
      skipRippleUpdate?: boolean;
      lockPhase?: boolean;
      reason?: string;
    } = {}
  ): Promise<{
    success: boolean;
    affectedPhases: number[];
    changes: Record<string, any>;
    consistencyIssues: ConsistencyIssue[];
    updateId: string;
  }> {
    const updateId = `update_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const previousState = JSON.parse(JSON.stringify(this.storyData));
    
    try {
      // Update the source phase
      this.updatePhaseContent(phase, newContent);
      
      let affectedPhases: number[] = [phase];
      let changes: Record<string, any> = {};
      
      // Perform ripple updates if not skipped
      if (!options.skipRippleUpdate) {
        const rippleResult = await this.performRippleUpdate(phase, newContent);
        affectedPhases = rippleResult.affectedPhases;
        changes = rippleResult.changes;
      }
      
      // Check for consistency issues
      const consistencyIssues = await this.checkNarrativeConsistency();
      
      // Record the update operation
      const updateOp: UpdateOperation = {
        id: updateId,
        timestamp: new Date(),
        sourcePhase: phase,
        affectedPhases,
        changes,
        previousState,
        reason: options.reason || `Phase ${phase} updated`
      };
      
      this.addToHistory(updateOp);
      
      return {
        success: true,
        affectedPhases,
        changes,
        consistencyIssues,
        updateId
      };
      
    } catch (error) {
      console.error('Error updating phase:', error);
      // Restore previous state on error
      this.storyData = previousState;
      
      return {
        success: false,
        affectedPhases: [phase],
        changes: {},
        consistencyIssues: [],
        updateId
      };
    }
  }

  /**
   * Performs ripple updates to dependent phases
   */
  private async performRippleUpdate(sourcePhase: number, newContent: any): Promise<{
    affectedPhases: number[];
    changes: Record<string, any>;
  }> {
    const affectedPhases: number[] = [sourcePhase];
    const changes: Record<string, any> = {};
    
    switch (sourcePhase) {
      case 1:
        // Phase 1 affects all other phases
        await this.updatePhasesFromSummary(newContent);
        affectedPhases.push(2, 3, 4);
        changes.phase2_scenes_regenerated = true;
        changes.phase3_breakdowns_updated = true;
        changes.phase4_format_refreshed = true;
        break;
        
      case 2:
        // Phase 2 affects phases 3 and 4
        await this.updatePhase3FromScenes();
        await this.updatePhase4FromStructure();
        affectedPhases.push(3, 4);
        changes.phase3_breakdowns_updated = true;
        changes.phase4_format_refreshed = true;
        break;
        
      case 3:
        // Phase 3 affects phase 4
        await this.updatePhase4FromBreakdowns();
        affectedPhases.push(4);
        changes.phase4_format_refreshed = true;
        break;
        
      case 4:
        // Phase 4 doesn't affect other phases
        break;
    }
    
    return { affectedPhases, changes };
  }

  /**
   * Updates phases 2, 3, 4 based on new Phase 1 summary
   */
  private async updatePhasesFromSummary(summaryData: any): Promise<void> {
    // Extract key elements from the summary
    const analysis = await this.analyzeSummary(summaryData.summary);
    
    // Update Phase 2: Generate new scene structure
    this.storyData.phase2.scenes = await this.generateScenesFromSummary(analysis);
    
    // Update Phase 3: Regenerate breakdowns for new scenes
    this.storyData.phase3.sceneBreakdowns = await this.generateBreakdownsFromScenes(this.storyData.phase2.scenes);
    
    // Update Phase 4: Refresh export format
    this.storyData.phase4.content = await this.generateExportFromBreakdowns(
      this.storyData.phase3.sceneBreakdowns,
      this.storyData.phase4.format
    );
  }

  /**
   * Updates Phase 3 based on Phase 2 scene changes
   */
  private async updatePhase3FromScenes(): Promise<void> {
    // Find scenes that have changed
    const updatedBreakdowns = await this.generateBreakdownsFromScenes(this.storyData.phase2.scenes);
    
    // Merge with existing breakdowns, preserving user edits where possible
    this.storyData.phase3.sceneBreakdowns = this.mergeBreakdowns(
      this.storyData.phase3.sceneBreakdowns,
      updatedBreakdowns
    );
  }

  /**
   * Updates Phase 4 based on Phase 3 breakdown changes
   */
  private async updatePhase4FromBreakdowns(): Promise<void> {
    this.storyData.phase4.content = await this.generateExportFromBreakdowns(
      this.storyData.phase3.sceneBreakdowns,
      this.storyData.phase4.format
    );
    this.storyData.phase4.exportReady = true;
  }

  /**
   * Updates Phase 4 based on Phase 2 structure changes
   */
  private async updatePhase4FromStructure(): Promise<void> {
    // If phase 3 doesn't exist yet, generate basic export from scenes
    if (!this.storyData.phase3.sceneBreakdowns.length) {
      this.storyData.phase4.content = await this.generateBasicExportFromScenes(
        this.storyData.phase2.scenes,
        this.storyData.phase4.format
      );
    } else {
      await this.updatePhase4FromBreakdowns();
    }
  }

  /**
   * Checks narrative consistency across all phases
   */
  private async checkNarrativeConsistency(): Promise<ConsistencyIssue[]> {
    const issues: ConsistencyIssue[] = [];
    
    // Check character consistency
    const characterIssues = await this.checkCharacterConsistency();
    issues.push(...characterIssues);
    
    // Check plot continuity
    const plotIssues = await this.checkPlotContinuity();
    issues.push(...plotIssues);
    
    // Check emotional arc coherence
    const emotionalIssues = await this.checkEmotionalCoherence();
    issues.push(...emotionalIssues);
    
    // Check timeline consistency
    const timelineIssues = await this.checkTimelineConsistency();
    issues.push(...timelineIssues);
    
    this.consistencyChecks = issues;
    return issues;
  }

  /**
   * Undo the last update operation
   */
  undoLastUpdate(): boolean {
    if (this.updateHistory.length === 0) {
      return false;
    }
    
    const lastUpdate = this.updateHistory[this.updateHistory.length - 1];
    
    // Restore previous state
    this.storyData = {
      ...this.storyData,
      ...lastUpdate.previousState
    };
    
    // Remove the undone operation from history
    this.updateHistory.pop();
    
    return true;
  }

  /**
   * Get current story data
   */
  getStoryData(): StoryData {
    return JSON.parse(JSON.stringify(this.storyData));
  }

  /**
   * Get update history
   */
  getUpdateHistory(): UpdateOperation[] {
    return [...this.updateHistory];
  }

  /**
   * Get current consistency issues
   */
  getConsistencyIssues(): ConsistencyIssue[] {
    return [...this.consistencyChecks];
  }

  // Private helper methods
  private updatePhaseContent(phase: number, content: any): void {
    switch (phase) {
      case 1:
        this.storyData.phase1 = { ...this.storyData.phase1, ...content };
        break;
      case 2:
        this.storyData.phase2 = { ...this.storyData.phase2, ...content };
        break;
      case 3:
        this.storyData.phase3 = { ...this.storyData.phase3, ...content };
        break;
      case 4:
        this.storyData.phase4 = { ...this.storyData.phase4, ...content };
        break;
    }
  }

  private addToHistory(operation: UpdateOperation): void {
    this.updateHistory.push(operation);
    
    // Keep history within bounds
    if (this.updateHistory.length > this.maxHistorySize) {
      this.updateHistory.shift();
    }
  }

  // AI Analysis Methods (to be implemented with actual AI)
  private async analyzeSummary(summary: string): Promise<any> {
    // TODO: Implement actual AI analysis
    return {
      characters: ['Protagonist', 'Antagonist'],
      themes: ['Courage', 'Sacrifice'],
      genre: 'Drama',
      tone: 'Serious'
    };
  }

  private async generateScenesFromSummary(analysis: any): Promise<any[]> {
    // TODO: Implement actual scene generation
    return [
      {
        id: 'scene_1',
        title: 'Setup',
        description: 'Introduce the world and protagonist',
        purpose: 'Establish character and world',
        order: 1
      }
    ];
  }

  private async generateBreakdownsFromScenes(scenes: any[]): Promise<any[]> {
    // TODO: Implement actual breakdown generation
    return scenes.map(scene => ({
      sceneId: scene.id,
      beats: [
        {
          id: `beat_${scene.id}_1`,
          description: 'Opening action',
          characters: ['Protagonist'],
          emotions: ['Curious'],
          conflicts: ['Internal doubt']
        }
      ]
    }));
  }

  private async generateExportFromBreakdowns(breakdowns: any[], format: string): Promise<string> {
    // TODO: Implement actual export generation
    return `Generated ${format} from breakdowns...`;
  }

  private async generateBasicExportFromScenes(scenes: any[], format: string): Promise<string> {
    // TODO: Implement basic export generation
    return `Basic ${format} from scenes...`;
  }

  private mergeBreakdowns(existing: any[], updated: any[]): any[] {
    // TODO: Implement intelligent merging
    return updated;
  }

  private async checkCharacterConsistency(): Promise<ConsistencyIssue[]> {
    // TODO: Implement character consistency checking
    return [];
  }

  private async checkPlotContinuity(): Promise<ConsistencyIssue[]> {
    // TODO: Implement plot continuity checking
    return [];
  }

  private async checkEmotionalCoherence(): Promise<ConsistencyIssue[]> {
    // TODO: Implement emotional coherence checking
    return [];
  }

  private async checkTimelineConsistency(): Promise<ConsistencyIssue[]> {
    // TODO: Implement timeline consistency checking
    return [];
  }
}