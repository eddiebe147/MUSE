import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

export interface StoryChange {
  id: string;
  timestamp: string;
  phase: 1 | 2 | 3 | 4;
  type: 'edit' | 'auto_update' | 'manual_update';
  field: string;
  oldValue: any;
  newValue: any;
  reason: string;
  affectedPhases: number[];
  status: 'pending' | 'accepted' | 'rejected' | 'applied';
  userId: string;
  transcriptId: string;
}

export interface PhaseDependency {
  sourcePhase: number;
  targetPhase: number;
  fields: string[];
  updateType: 'full_regenerate' | 'intelligent_merge' | 'field_specific';
  priority: 'high' | 'medium' | 'low';
}

export interface ChangePreview {
  changeId: string;
  phase: number;
  changes: {
    field: string;
    before: any;
    after: any;
    confidence: number;
    reason: string;
  }[];
  impact: {
    phase: number;
    affectedFields: string[];
    riskLevel: 'low' | 'medium' | 'high';
  }[];
}

// Define phase dependencies
export const PHASE_DEPENDENCIES: PhaseDependency[] = [
  {
    sourcePhase: 1, // Story DNA
    targetPhase: 2, // Scene Structure
    fields: ['summary', 'theme', 'genre_indicators'],
    updateType: 'intelligent_merge',
    priority: 'high'
  },
  {
    sourcePhase: 1, // Story DNA
    targetPhase: 3, // Beat Breakdown
    fields: ['summary', 'theme'],
    updateType: 'intelligent_merge',
    priority: 'medium'
  },
  {
    sourcePhase: 1, // Story DNA
    targetPhase: 4, // Document
    fields: ['summary'],
    updateType: 'field_specific',
    priority: 'low'
  },
  {
    sourcePhase: 2, // Scene Structure
    targetPhase: 3, // Beat Breakdown
    fields: ['scenes', 'arc_analysis', 'thematic_analysis'],
    updateType: 'intelligent_merge',
    priority: 'high'
  },
  {
    sourcePhase: 2, // Scene Structure
    targetPhase: 4, // Document
    fields: ['scenes', 'arc_analysis'],
    updateType: 'field_specific',
    priority: 'low'
  },
  {
    sourcePhase: 3, // Beat Breakdown
    targetPhase: 4, // Document
    fields: ['scene_breakdowns', 'character_tracking', 'production_summary'],
    updateType: 'field_specific',
    priority: 'low'
  }
];

export class LivingStoryManager {
  private pendingChanges: Map<string, StoryChange> = new Map();
  private changeHistory: StoryChange[] = [];

  constructor() {
    this.loadChangeHistory();
  }

  // Detect changes in a phase
  async detectChanges(
    transcriptId: string,
    userId: string,
    phase: number,
    oldData: any,
    newData: any
  ): Promise<StoryChange[]> {
    const changes: StoryChange[] = [];
    const timestamp = new Date().toISOString();

    // Deep comparison to find actual changes
    const changedFields = this.findChangedFields(oldData, newData);

    for (const { field, oldValue, newValue } of changedFields) {
      const change: StoryChange = {
        id: this.generateChangeId(),
        timestamp,
        phase: phase as 1 | 2 | 3 | 4,
        type: 'edit',
        field,
        oldValue,
        newValue,
        reason: `User edited ${field} in Phase ${phase}`,
        affectedPhases: this.getAffectedPhases(phase),
        status: 'applied',
        userId,
        transcriptId
      };

      changes.push(change);
      this.addToHistory(change);
    }

    return changes;
  }

  // Generate auto-updates for dependent phases
  async generateAutoUpdates(
    transcriptId: string,
    userId: string,
    sourceChange: StoryChange,
    currentStoryData: any
  ): Promise<StoryChange[]> {
    const autoUpdates: StoryChange[] = [];
    const dependencies = this.getDependencies(sourceChange.phase);

    for (const dependency of dependencies) {
      if (dependency.priority === 'low') continue; // Skip low priority auto-updates

      const targetPhaseData = currentStoryData[`phase${dependency.targetPhase}`];
      if (!targetPhaseData) continue;

      try {
        const updatedData = await this.generateSmartUpdate(
          dependency,
          sourceChange,
          currentStoryData,
          targetPhaseData
        );

        if (updatedData && this.hasSignificantChanges(targetPhaseData, updatedData)) {
          const autoUpdate: StoryChange = {
            id: this.generateChangeId(),
            timestamp: new Date().toISOString(),
            phase: dependency.targetPhase as 1 | 2 | 3 | 4,
            type: 'auto_update',
            field: 'full_phase_data',
            oldValue: targetPhaseData,
            newValue: updatedData,
            reason: `Auto-updated Phase ${dependency.targetPhase} based on changes to ${sourceChange.field} in Phase ${sourceChange.phase}`,
            affectedPhases: this.getAffectedPhases(dependency.targetPhase),
            status: 'pending',
            userId,
            transcriptId
          };

          autoUpdates.push(autoUpdate);
          this.pendingChanges.set(autoUpdate.id, autoUpdate);
        }
      } catch (error) {
        console.error(`Failed to generate auto-update for Phase ${dependency.targetPhase}:`, error);
      }
    }

    return autoUpdates;
  }

  // Generate smart updates using AI
  private async generateSmartUpdate(
    dependency: PhaseDependency,
    sourceChange: StoryChange,
    fullStoryData: any,
    targetPhaseData: any
  ): Promise<any> {
    const hasOpenAI = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim() !== '';
    if (!hasOpenAI) {
      console.warn('OpenAI API key not configured, skipping smart update');
      return null;
    }

    const prompt = this.buildUpdatePrompt(dependency, sourceChange, fullStoryData, targetPhaseData);
    const schema = this.getSchemaForPhase(dependency.targetPhase);

    try {
      const result = await generateObject({
        model: openai('gpt-4o'),
        prompt,
        schema,
      });

      return result.object;
    } catch (error) {
      console.error('Smart update generation failed:', error);
      return null;
    }
  }

  // Build AI prompt for updates
  private buildUpdatePrompt(
    dependency: PhaseDependency,
    sourceChange: StoryChange,
    fullStoryData: any,
    targetPhaseData: any
  ): string {
    const storyDNA = fullStoryData.phase1?.summary || 'Not available';
    const sceneStructure = fullStoryData.phase2 || {};
    const sceneBeats = fullStoryData.phase3 || {};

    return `You are an expert story development AI maintaining narrative consistency across a 4-phase story development system.

SOURCE CHANGE:
- Phase ${sourceChange.phase} field "${sourceChange.field}" was changed
- From: ${JSON.stringify(sourceChange.oldValue, null, 2)}
- To: ${JSON.stringify(sourceChange.newValue, null, 2)}
- Reason: ${sourceChange.reason}

CURRENT STORY STATE:
Story DNA (Phase 1): "${storyDNA}"

Scene Structure (Phase 2): ${JSON.stringify(sceneStructure, null, 2)}

Scene Beats (Phase 3): ${JSON.stringify(sceneBeats, null, 2)}

TARGET PHASE TO UPDATE: Phase ${dependency.targetPhase}
Current Target Data: ${JSON.stringify(targetPhaseData, null, 2)}

TASK: Update Phase ${dependency.targetPhase} to maintain consistency with the source change while preserving the core narrative structure.

REQUIREMENTS:
1. Maintain narrative consistency across all phases
2. Preserve existing story elements that weren't affected by the source change
3. Only make necessary changes to reflect the source modification
4. Ensure the updated content flows logically with unchanged phases
5. Keep character development and thematic consistency intact
6. Maintain production viability for later phases

Update Strategy: ${dependency.updateType}
Priority: ${dependency.priority}

Generate the updated Phase ${dependency.targetPhase} data that incorporates the source change while maintaining story consistency.`;
  }

  // Get schema for different phases
  private getSchemaForPhase(phase: number): z.ZodSchema {
    switch (phase) {
      case 2: // Scene Structure
        return z.object({
          scenes: z.array(z.object({
            scene_number: z.number(),
            title: z.string(),
            summary: z.string(),
            stakes: z.string(),
            character_arc: z.string(),
            conflict_type: z.enum(['internal', 'interpersonal', 'external', 'societal']),
            tension_level: z.number().min(1).max(10),
            pacing: z.enum(['slow', 'medium', 'fast']),
            purpose: z.string(),
            forward_movement: z.string(),
            emotional_beat: z.string()
          })),
          arc_analysis: z.object({
            overall_progression: z.string(),
            escalation_pattern: z.string(),
            resolution_approach: z.string(),
            cohesion_strength: z.number().min(1).max(10)
          }),
          thematic_analysis: z.object({
            central_theme: z.string(),
            thematic_progression: z.array(z.string()),
            resolution: z.string()
          }).optional()
        });

      case 3: // Beat Breakdown
        return z.object({
          scene_breakdowns: z.array(z.object({
            scene_number: z.number(),
            scene_title: z.string(),
            total_beats: z.number(),
            beats: z.array(z.object({
              beat_number: z.number(),
              beat_title: z.string(),
              action_description: z.string(),
              dialogue_notes: z.string().optional(),
              character_focus: z.array(z.string()),
              character_states: z.record(z.string()),
              tension_moment: z.string(),
              story_function: z.string(),
              production_notes: z.string(),
              duration_estimate: z.enum(['short', 'medium', 'long']),
              transition_to_next: z.string(),
              visual_elements: z.array(z.string())
            }))
          })),
          character_tracking: z.object({
            main_characters: z.array(z.string()),
            character_arcs: z.record(z.object({
              starting_state: z.string(),
              progression: z.array(z.string()),
              ending_state: z.string(),
              key_moments: z.array(z.string())
            })),
            consistency_notes: z.array(z.string())
          }),
          production_summary: z.object({
            total_beats: z.number(),
            estimated_runtime: z.string(),
            key_locations: z.array(z.string()),
            production_complexity: z.enum(['low', 'medium', 'high']),
            budget_considerations: z.array(z.string()),
            scheduling_notes: z.array(z.string())
          })
        });

      default:
        return z.object({
          updated: z.boolean(),
          data: z.any()
        });
    }
  }

  // Generate change preview for user approval
  async generateChangePreview(changeId: string): Promise<ChangePreview | null> {
    const change = this.pendingChanges.get(changeId);
    if (!change) return null;

    const preview: ChangePreview = {
      changeId,
      phase: change.phase,
      changes: this.extractFieldChanges(change.oldValue, change.newValue),
      impact: this.calculateImpact(change)
    };

    return preview;
  }

  // Accept a pending change
  async acceptChange(changeId: string): Promise<boolean> {
    const change = this.pendingChanges.get(changeId);
    if (!change) return false;

    change.status = 'accepted';
    this.addToHistory(change);
    this.pendingChanges.delete(changeId);
    
    return true;
  }

  // Reject a pending change
  async rejectChange(changeId: string): Promise<boolean> {
    const change = this.pendingChanges.get(changeId);
    if (!change) return false;

    change.status = 'rejected';
    this.addToHistory(change);
    this.pendingChanges.delete(changeId);
    
    return true;
  }

  // Undo a change
  async undoChange(changeId: string): Promise<any> {
    const change = this.changeHistory.find(c => c.id === changeId);
    if (!change) return null;

    // Create undo change
    const undoChange: StoryChange = {
      id: this.generateChangeId(),
      timestamp: new Date().toISOString(),
      phase: change.phase,
      type: 'manual_update',
      field: change.field,
      oldValue: change.newValue,
      newValue: change.oldValue,
      reason: `Undo: ${change.reason}`,
      affectedPhases: change.affectedPhases,
      status: 'applied',
      userId: change.userId,
      transcriptId: change.transcriptId
    };

    this.addToHistory(undoChange);
    return change.oldValue;
  }

  // Get all pending changes for a transcript
  getPendingChanges(transcriptId: string): StoryChange[] {
    return Array.from(this.pendingChanges.values())
      .filter(change => change.transcriptId === transcriptId);
  }

  // Get change history for a transcript
  getChangeHistory(transcriptId: string): StoryChange[] {
    return this.changeHistory
      .filter(change => change.transcriptId === transcriptId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  // Helper methods
  private findChangedFields(oldData: any, newData: any): Array<{field: string, oldValue: any, newValue: any}> {
    const changes: Array<{field: string, oldValue: any, newValue: any}> = [];
    
    const compare = (obj1: any, obj2: any, path = '') => {
      if (typeof obj1 !== typeof obj2) {
        changes.push({ field: path || 'root', oldValue: obj1, newValue: obj2 });
        return;
      }

      if (obj1 === null || obj2 === null) {
        if (obj1 !== obj2) {
          changes.push({ field: path || 'root', oldValue: obj1, newValue: obj2 });
        }
        return;
      }

      if (typeof obj1 === 'object' && !Array.isArray(obj1)) {
        const allKeys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);
        for (const key of allKeys) {
          const newPath = path ? `${path}.${key}` : key;
          if (!(key in obj1)) {
            changes.push({ field: newPath, oldValue: undefined, newValue: obj2[key] });
          } else if (!(key in obj2)) {
            changes.push({ field: newPath, oldValue: obj1[key], newValue: undefined });
          } else {
            compare(obj1[key], obj2[key], newPath);
          }
        }
      } else if (Array.isArray(obj1) && Array.isArray(obj2)) {
        if (JSON.stringify(obj1) !== JSON.stringify(obj2)) {
          changes.push({ field: path || 'array', oldValue: obj1, newValue: obj2 });
        }
      } else if (obj1 !== obj2) {
        changes.push({ field: path || 'value', oldValue: obj1, newValue: obj2 });
      }
    };

    compare(oldData, newData);
    return changes;
  }

  private getAffectedPhases(sourcePhase: number): number[] {
    return PHASE_DEPENDENCIES
      .filter(dep => dep.sourcePhase === sourcePhase)
      .map(dep => dep.targetPhase);
  }

  private getDependencies(sourcePhase: number): PhaseDependency[] {
    return PHASE_DEPENDENCIES.filter(dep => dep.sourcePhase === sourcePhase);
  }

  private hasSignificantChanges(oldData: any, newData: any): boolean {
    const changes = this.findChangedFields(oldData, newData);
    return changes.length > 0 && changes.some(change => 
      typeof change.newValue === 'string' ? change.newValue.length > 10 : true
    );
  }

  private extractFieldChanges(oldValue: any, newValue: any): Array<{field: string, before: any, after: any, confidence: number, reason: string}> {
    const fieldChanges = this.findChangedFields(oldValue, newValue);
    return fieldChanges.map(change => ({
      field: change.field,
      before: change.oldValue,
      after: change.newValue,
      confidence: 0.8, // Default confidence
      reason: `Updated based on upstream changes`
    }));
  }

  private calculateImpact(change: StoryChange): Array<{phase: number, affectedFields: string[], riskLevel: 'low' | 'medium' | 'high'}> {
    return change.affectedPhases.map(phase => ({
      phase,
      affectedFields: ['multiple'],
      riskLevel: change.phase === 1 ? 'high' : change.phase === 2 ? 'medium' : 'low'
    }));
  }

  private generateChangeId(): string {
    return `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private addToHistory(change: StoryChange): void {
    this.changeHistory.push(change);
    // Keep only last 100 changes per transcript
    const transcriptChanges = this.changeHistory.filter(c => c.transcriptId === change.transcriptId);
    if (transcriptChanges.length > 100) {
      this.changeHistory = this.changeHistory.filter(c => 
        c.transcriptId !== change.transcriptId || 
        transcriptChanges.slice(-100).includes(c)
      );
    }
  }

  private loadChangeHistory(): void {
    // In a real implementation, this would load from database
    // For now, start with empty history
    this.changeHistory = [];
  }
}

// Global instance
export const livingStoryManager = new LivingStoryManager();