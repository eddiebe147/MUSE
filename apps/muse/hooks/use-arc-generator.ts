'use client';

import { useState, useCallback, useRef } from 'react';
import { ARCGenerator, StoryAnalysis, SceneStructure, SceneBreakdown, ExportFormat } from '@/lib/arc-generator/arc-intelligence';

export interface ARCGeneratorState {
  isAnalyzing: boolean;
  isGenerating: boolean;
  currentPhase: number;
  storyAnalysis: StoryAnalysis | null;
  sceneStructures: SceneStructure[];
  sceneBreakdowns: SceneBreakdown[];
  exportFormat: ExportFormat | null;
  suggestions: string[];
  error: string | null;
}

export interface UseARCGeneratorOptions {
  onPhaseComplete?: (phase: number, data: any) => void;
  onSuggestion?: (suggestion: string) => void;
  onError?: (error: string) => void;
}

export function useARCGenerator({
  onPhaseComplete,
  onSuggestion,
  onError
}: UseARCGeneratorOptions = {}) {
  const arcGeneratorRef = useRef<ARCGenerator>(new ARCGenerator());

  const [state, setState] = useState<ARCGeneratorState>({
    isAnalyzing: false,
    isGenerating: false,
    currentPhase: 1,
    storyAnalysis: null,
    sceneStructures: [],
    sceneBreakdowns: [],
    exportFormat: null,
    suggestions: [],
    error: null
  });

  // Phase 1: Analyze transcript and generate story foundations
  const analyzeTranscript = useCallback(async (transcript: string) => {
    setState(prev => ({ ...prev, isAnalyzing: true, error: null }));

    try {
      const analysis = await arcGeneratorRef.current.analyzeTranscriptForStory(transcript);
      
      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        storyAnalysis: analysis,
        suggestions: [
          `Strong ${analysis.genre} potential with ${analysis.storyPotential.score}/10 score`,
          `Main conflict: ${analysis.mainConflict}`,
          `Protagonist arc: ${analysis.protagonist.arc}`
        ]
      }));

      onPhaseComplete?.(1, { analysis });
      return analysis;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Analysis failed';
      setState(prev => ({ ...prev, isAnalyzing: false, error: errorMessage }));
      onError?.(errorMessage);
      return null;
    }
  }, [onPhaseComplete, onError]);

  const generateSummaryOptions = useCallback(async (userInput?: string) => {
    if (!state.storyAnalysis) return [];

    setState(prev => ({ ...prev, isGenerating: true }));

    try {
      const options = await arcGeneratorRef.current.generateSummaryOptions(state.storyAnalysis, userInput);
      
      setState(prev => ({ 
        ...prev, 
        isGenerating: false,
        suggestions: options.map(option => `Suggestion: ${option}`)
      }));

      return options;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Summary generation failed';
      setState(prev => ({ ...prev, isGenerating: false, error: errorMessage }));
      onError?.(errorMessage);
      return [];
    }
  }, [state.storyAnalysis, onError]);

  // Phase 2: Generate scene structure with proper story arc
  const generateSceneStructure = useCallback(async (summary: string) => {
    if (!state.storyAnalysis) return [];

    setState(prev => ({ ...prev, isGenerating: true, error: null }));

    try {
      const scenes = await arcGeneratorRef.current.generateSceneStructure(summary, state.storyAnalysis);
      
      setState(prev => ({
        ...prev,
        isGenerating: false,
        sceneStructures: scenes,
        suggestions: scenes.map(scene => `${scene.title}: ${scene.emotionalBeat}`)
      }));

      onPhaseComplete?.(2, { scenes });
      return scenes;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Scene generation failed';
      setState(prev => ({ ...prev, isGenerating: false, error: errorMessage }));
      onError?.(errorMessage);
      return [];
    }
  }, [state.storyAnalysis, onPhaseComplete, onError]);

  const validateStoryStructure = useCallback(async (scenes: SceneStructure[]) => {
    try {
      const validation = await arcGeneratorRef.current.validateStoryStructure(scenes);
      
      setState(prev => ({
        ...prev,
        suggestions: [
          ...validation.issues.map(issue => `Issue: ${issue}`),
          ...validation.suggestions.map(suggestion => `Suggestion: ${suggestion}`)
        ]
      }));

      return validation;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Validation failed';
      onError?.(errorMessage);
      return { isComplete: false, issues: [errorMessage], suggestions: [] };
    }
  }, [onError]);

  // Phase 3: Expand scenes with character consistency and pacing
  const expandScene = useCallback(async (sceneIndex: number) => {
    const sceneStructure = state.sceneStructures[sceneIndex];
    if (!sceneStructure) return null;

    setState(prev => ({ ...prev, isGenerating: true, error: null }));

    try {
      const previousScenes = state.sceneBreakdowns.slice(0, sceneIndex);
      const breakdown = await arcGeneratorRef.current.expandSceneWithBeats(sceneStructure, previousScenes);
      
      setState(prev => {
        const newBreakdowns = [...prev.sceneBreakdowns];
        newBreakdowns[sceneIndex] = breakdown;
        
        return {
          ...prev,
          isGenerating: false,
          sceneBreakdowns: newBreakdowns,
          suggestions: [
            `Scene expanded with ${breakdown.beats.length} beats`,
            `Tension level: ${breakdown.tensionLevel}/10`,
            ...breakdown.pacingNotes
          ]
        };
      });

      onPhaseComplete?.(3, { sceneIndex, breakdown });
      return breakdown;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Scene expansion failed';
      setState(prev => ({ ...prev, isGenerating: false, error: errorMessage }));
      onError?.(errorMessage);
      return null;
    }
  }, [state.sceneStructures, state.sceneBreakdowns, onPhaseComplete, onError]);

  const analyzeTensionCurve = useCallback(async () => {
    if (state.sceneBreakdowns.length === 0) return null;

    try {
      const analysis = await arcGeneratorRef.current.maintainTensionAcrossScenes(state.sceneBreakdowns);
      
      setState(prev => ({
        ...prev,
        suggestions: [
          `Tension curve analyzed across ${analysis.tensionCurve.length} scenes`,
          ...analysis.recommendations
        ]
      }));

      return analysis;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Tension analysis failed';
      onError?.(errorMessage);
      return null;
    }
  }, [state.sceneBreakdowns, onError]);

  // Phase 4: Format for professional export
  const generateExport = useCallback(async (
    format: 'beat_sheet' | 'screenplay' | 'treatment' | 'outline',
    metadata: any
  ) => {
    if (state.sceneBreakdowns.length === 0) return null;

    setState(prev => ({ ...prev, isGenerating: true, error: null }));

    try {
      const exportData = await arcGeneratorRef.current.formatForExport(
        state.sceneBreakdowns,
        format,
        metadata
      );
      
      setState(prev => ({
        ...prev,
        isGenerating: false,
        exportFormat: exportData,
        suggestions: [
          `Generated ${format} format`,
          `Estimated ${exportData.metadata.estimatedDuration}`,
          `${exportData.metadata.pageCount} pages, ${exportData.metadata.wordCount} words`,
          ...exportData.productionNotes.slice(0, 3)
        ]
      }));

      onPhaseComplete?.(4, { exportData });
      return exportData;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Export generation failed';
      setState(prev => ({ ...prev, isGenerating: false, error: errorMessage }));
      onError?.(errorMessage);
      return null;
    }
  }, [state.sceneBreakdowns, onPhaseComplete, onError]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const clearSuggestions = useCallback(() => {
    setState(prev => ({ ...prev, suggestions: [] }));
  }, []);

  const getPhaseProgress = useCallback(() => {
    let completedPhases = 0;
    
    if (state.storyAnalysis) completedPhases = 1;
    if (state.sceneStructures.length > 0) completedPhases = 2;
    if (state.sceneBreakdowns.length > 0) completedPhases = 3;
    if (state.exportFormat) completedPhases = 4;

    return {
      current: completedPhases,
      total: 4,
      percentage: (completedPhases / 4) * 100
    };
  }, [state]);

  const getSuggestionsByPhase = useCallback((phase: number) => {
    switch (phase) {
      case 1:
        return state.storyAnalysis ? [
          `Genre: ${state.storyAnalysis.genre}`,
          `Main conflict: ${state.storyAnalysis.mainConflict}`,
          `Story potential: ${state.storyAnalysis.storyPotential.score}/10`
        ] : [];
      case 2:
        return state.sceneStructures.map(scene => 
          `${scene.title} (${scene.purpose}): ${scene.emotionalBeat}`
        );
      case 3:
        return state.sceneBreakdowns.map(scene => 
          `Scene ${scene.sceneId}: ${scene.beats.length} beats, tension ${scene.tensionLevel}/10`
        );
      case 4:
        return state.exportFormat ? [
          `Format: ${state.exportFormat.type}`,
          `Duration: ${state.exportFormat.metadata.estimatedDuration}`,
          `Pages: ${state.exportFormat.metadata.pageCount}`
        ] : [];
      default:
        return [];
    }
  }, [state]);

  return {
    // State
    ...state,
    progress: getPhaseProgress(),
    
    // Phase 1 Methods
    analyzeTranscript,
    generateSummaryOptions,
    
    // Phase 2 Methods
    generateSceneStructure,
    validateStoryStructure,
    
    // Phase 3 Methods
    expandScene,
    analyzeTensionCurve,
    
    // Phase 4 Methods
    generateExport,
    
    // Utility Methods
    clearError,
    clearSuggestions,
    getSuggestionsByPhase
  };
}