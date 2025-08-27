'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { LivingStoryEngine, StoryData, UpdateOperation, ConsistencyIssue } from '@/lib/living-story/story-engine';

export interface UpdateStatus {
  isUpdating: boolean;
  affectedPhases: number[];
  updateId: string | null;
  error: string | null;
}

export interface LivingStoryState {
  storyData: StoryData;
  updateStatus: UpdateStatus;
  updateHistory: UpdateOperation[];
  consistencyIssues: ConsistencyIssue[];
  canUndo: boolean;
}

export interface UseFourPhaseStoryOptions {
  projectId: string;
  initialData: StoryData;
  onUpdate?: (updateId: string, affectedPhases: number[]) => void;
  onError?: (error: string) => void;
  autoSave?: boolean;
  autoSaveDelay?: number;
}

export function useFourPhaseStory({
  projectId,
  initialData,
  onUpdate,
  onError,
  autoSave = true,
  autoSaveDelay = 2000
}: UseFourPhaseStoryOptions) {
  const engineRef = useRef<LivingStoryEngine>(new LivingStoryEngine(initialData));
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();
  const [updateQueue, setUpdateQueue] = useState<Array<{ phase: number; content: any; options?: any }>>([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);

  const [state, setState] = useState<LivingStoryState>({
    storyData: initialData,
    updateStatus: {
      isUpdating: false,
      affectedPhases: [],
      updateId: null,
      error: null
    },
    updateHistory: [],
    consistencyIssues: [],
    canUndo: false
  });

  // Process update queue
  useEffect(() => {
    const processQueue = async () => {
      if (updateQueue.length === 0 || isProcessingQueue) return;
      
      setIsProcessingQueue(true);
      const nextUpdate = updateQueue[0];
      
      try {
        await performUpdate(nextUpdate.phase, nextUpdate.content, nextUpdate.options);
        setUpdateQueue(prev => prev.slice(1));
      } catch (error) {
        console.error('Error processing update queue:', error);
      } finally {
        setIsProcessingQueue(false);
      }
    };

    processQueue();
  }, [updateQueue, isProcessingQueue]);

  // Auto-save functionality
  useEffect(() => {
    if (!autoSave) return;

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      saveToDatabase(state.storyData);
    }, autoSaveDelay);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [state.storyData, autoSave, autoSaveDelay]);

  const performUpdate = async (
    phase: number, 
    content: any, 
    options: {
      skipRippleUpdate?: boolean;
      reason?: string;
      immediate?: boolean;
    } = {}
  ) => {
    // Update UI state immediately for responsiveness
    setState(prev => ({
      ...prev,
      updateStatus: {
        isUpdating: true,
        affectedPhases: [phase],
        updateId: null,
        error: null
      }
    }));

    try {
      const result = await engineRef.current.updatePhase(phase, content, options);
      
      if (result.success) {
        // Update state with new data
        setState(prev => ({
          ...prev,
          storyData: engineRef.current.getStoryData(),
          updateStatus: {
            isUpdating: false,
            affectedPhases: result.affectedPhases,
            updateId: result.updateId,
            error: null
          },
          updateHistory: engineRef.current.getUpdateHistory(),
          consistencyIssues: result.consistencyIssues,
          canUndo: engineRef.current.getUpdateHistory().length > 0
        }));

        // Call update callback
        onUpdate?.(result.updateId, result.affectedPhases);

        // Show completion after brief delay
        setTimeout(() => {
          setState(prev => ({
            ...prev,
            updateStatus: {
              ...prev.updateStatus,
              isUpdating: false,
              affectedPhases: []
            }
          }));
        }, 1000);

      } else {
        setState(prev => ({
          ...prev,
          updateStatus: {
            isUpdating: false,
            affectedPhases: [],
            updateId: null,
            error: 'Failed to update story'
          }
        }));
        onError?.('Failed to update story');
      }
      
    } catch (error) {
      console.error('Error updating story:', error);
      setState(prev => ({
        ...prev,
        updateStatus: {
          isUpdating: false,
          affectedPhases: [],
          updateId: null,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }));
      onError?.(error instanceof Error ? error.message : 'Unknown error');
    }
  };

  // Public methods
  const updatePhase = useCallback((
    phase: number, 
    content: any, 
    options: {
      skipRippleUpdate?: boolean;
      reason?: string;
      immediate?: boolean;
    } = {}
  ) => {
    if (options.immediate) {
      // Process immediately
      performUpdate(phase, content, options);
    } else {
      // Queue for batch processing
      setUpdateQueue(prev => [...prev, { phase, content, options }]);
    }
  }, []);

  const undoLastUpdate = useCallback(() => {
    const success = engineRef.current.undoLastUpdate();
    
    if (success) {
      setState(prev => ({
        ...prev,
        storyData: engineRef.current.getStoryData(),
        updateHistory: engineRef.current.getUpdateHistory(),
        consistencyIssues: engineRef.current.getConsistencyIssues(),
        canUndo: engineRef.current.getUpdateHistory().length > 0,
        updateStatus: {
          ...prev.updateStatus,
          error: null
        }
      }));
    }
    
    return success;
  }, []);

  const lockPhase = useCallback((phase: number, locked: boolean) => {
    // TODO: Implement phase locking
    console.log(`Phase ${phase} ${locked ? 'locked' : 'unlocked'}`);
  }, []);

  const refreshFromPreviousPhase = useCallback((phase: number) => {
    if (phase <= 1) return;
    
    // Force regenerate from previous phase
    const previousPhaseContent = getPhaseContent(phase - 1);
    updatePhase(phase, {}, { 
      skipRippleUpdate: false, 
      reason: `Manual refresh from Phase ${phase - 1}`,
      immediate: true 
    });
  }, [updatePhase]);

  const getPhaseContent = useCallback((phase: number) => {
    const data = engineRef.current.getStoryData();
    switch (phase) {
      case 1: return data.phase1;
      case 2: return data.phase2;
      case 3: return data.phase3;
      case 4: return data.phase4;
      default: return null;
    }
  }, []);

  const isPhaseOutOfSync = useCallback((phase: number) => {
    // Check if phase needs updating based on previous phases
    const history = state.updateHistory;
    if (history.length === 0) return false;
    
    const lastUpdate = history[history.length - 1];
    return lastUpdate.affectedPhases.includes(phase) && 
           lastUpdate.sourcePhase < phase;
  }, [state.updateHistory]);

  // Helper function to save to database
  const saveToDatabase = async (data: StoryData) => {
    try {
      // TODO: Implement actual database save
      console.log('Auto-saving story data...', data);
    } catch (error) {
      console.error('Error saving to database:', error);
    }
  };

  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      updateStatus: {
        ...prev.updateStatus,
        error: null
      }
    }));
  }, []);

  return {
    // State
    storyData: state.storyData,
    isUpdating: state.updateStatus.isUpdating,
    affectedPhases: state.updateStatus.affectedPhases,
    updateError: state.updateStatus.error,
    updateHistory: state.updateHistory,
    consistencyIssues: state.consistencyIssues,
    canUndo: state.canUndo,
    
    // Methods
    updatePhase,
    undoLastUpdate,
    lockPhase,
    refreshFromPreviousPhase,
    getPhaseContent,
    isPhaseOutOfSync,
    clearError,
    
    // Utilities
    isProcessingQueue,
    queueLength: updateQueue.length
  };
}