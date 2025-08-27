import { useState, useEffect, useCallback } from 'react';

interface StoryChange {
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

interface UseLivingStoryProps {
  transcriptId: string;
  enabled?: boolean;
  onAutoUpdatesGenerated?: (count: number) => void;
  onChangeApplied?: (phase: number) => void;
}

interface LivingStoryStatus {
  isActive: boolean;
  pendingChangesCount: number;
  recentChangesCount: number;
  lastChangeTime: string | null;
}

export function useLivingStory({
  transcriptId,
  enabled = true,
  onAutoUpdatesGenerated,
  onChangeApplied
}: UseLivingStoryProps) {
  const [status, setStatus] = useState<LivingStoryStatus>({
    isActive: false,
    pendingChangesCount: 0,
    recentChangesCount: 0,
    lastChangeTime: null
  });
  const [pendingChanges, setPendingChanges] = useState<StoryChange[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load living story status
  const loadStatus = useCallback(async () => {
    if (!enabled || !transcriptId) return;

    try {
      const response = await fetch(`/api/transcripts/${transcriptId}/living-story?action=status`);
      if (response.ok) {
        const data = await response.json();
        setStatus({
          isActive: data.living_story_active,
          pendingChangesCount: data.pending_changes_count,
          recentChangesCount: data.recent_changes_count,
          lastChangeTime: data.last_change
        });
      }
    } catch (error) {
      console.error('Error loading living story status:', error);
    }
  }, [transcriptId, enabled]);

  // Load pending changes
  const loadPendingChanges = useCallback(async () => {
    if (!enabled || !transcriptId) return;

    try {
      const response = await fetch(`/api/transcripts/${transcriptId}/living-story`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_pending' })
      });

      if (response.ok) {
        const data = await response.json();
        setPendingChanges(data.pendingChanges?.map((item: any) => item.change) || []);
      }
    } catch (error) {
      console.error('Error loading pending changes:', error);
    }
  }, [transcriptId, enabled]);

  // Detect changes in a phase
  const detectChanges = useCallback(async (
    phase: number,
    oldData: any,
    newData: any
  ): Promise<StoryChange[]> => {
    if (!enabled || !transcriptId) return [];

    setIsProcessing(true);
    try {
      const response = await fetch(`/api/transcripts/${transcriptId}/living-story`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'detect_changes',
          phase,
          oldData,
          newData
        })
      });

      if (response.ok) {
        const data = await response.json();
        const changes = data.changes || [];

        // Generate auto-updates for detected changes
        for (const change of changes) {
          await generateAutoUpdates(change.id);
        }

        await loadStatus();
        await loadPendingChanges();
        
        return changes;
      }
    } catch (error) {
      console.error('Error detecting changes:', error);
    } finally {
      setIsProcessing(false);
    }

    return [];
  }, [transcriptId, enabled]);

  // Generate auto-updates for a change
  const generateAutoUpdates = useCallback(async (changeId: string) => {
    if (!enabled || !transcriptId) return;

    try {
      const response = await fetch(`/api/transcripts/${transcriptId}/living-story`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_updates',
          changeId
        })
      });

      if (response.ok) {
        const data = await response.json();
        const autoUpdates = data.autoUpdates || [];
        
        if (autoUpdates.length > 0 && onAutoUpdatesGenerated) {
          onAutoUpdatesGenerated(autoUpdates.length);
        }
        
        await loadStatus();
        await loadPendingChanges();
      }
    } catch (error) {
      console.error('Error generating auto-updates:', error);
    }
  }, [transcriptId, enabled, onAutoUpdatesGenerated]);

  // Accept a change
  const acceptChange = useCallback(async (changeId: string): Promise<boolean> => {
    if (!enabled || !transcriptId) return false;

    try {
      const response = await fetch(`/api/transcripts/${transcriptId}/living-story`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'accept_change',
          changeId
        })
      });

      if (response.ok) {
        const change = pendingChanges.find(c => c.id === changeId);
        if (change && onChangeApplied) {
          onChangeApplied(change.phase);
        }

        await loadStatus();
        await loadPendingChanges();
        return true;
      }
    } catch (error) {
      console.error('Error accepting change:', error);
    }

    return false;
  }, [transcriptId, enabled, pendingChanges, onChangeApplied]);

  // Reject a change
  const rejectChange = useCallback(async (changeId: string): Promise<boolean> => {
    if (!enabled || !transcriptId) return false;

    try {
      const response = await fetch(`/api/transcripts/${transcriptId}/living-story`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject_change',
          changeId
        })
      });

      if (response.ok) {
        await loadStatus();
        await loadPendingChanges();
        return true;
      }
    } catch (error) {
      console.error('Error rejecting change:', error);
    }

    return false;
  }, [transcriptId, enabled]);

  // Undo a change
  const undoChange = useCallback(async (changeId: string): Promise<boolean> => {
    if (!enabled || !transcriptId) return false;

    try {
      const response = await fetch(`/api/transcripts/${transcriptId}/living-story`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'undo_change',
          changeId
        })
      });

      if (response.ok) {
        await loadStatus();
        await loadPendingChanges();
        return true;
      }
    } catch (error) {
      console.error('Error undoing change:', error);
    }

    return false;
  }, [transcriptId, enabled]);

  // Accept all pending changes
  const acceptAllChanges = useCallback(async (): Promise<boolean> => {
    if (!enabled || !transcriptId || pendingChanges.length === 0) return false;

    try {
      const results = await Promise.all(
        pendingChanges.map(change => acceptChange(change.id))
      );

      return results.every(result => result);
    } catch (error) {
      console.error('Error accepting all changes:', error);
      return false;
    }
  }, [pendingChanges, acceptChange, transcriptId, enabled]);

  // Reject all pending changes
  const rejectAllChanges = useCallback(async (): Promise<boolean> => {
    if (!enabled || !transcriptId || pendingChanges.length === 0) return false;

    try {
      const results = await Promise.all(
        pendingChanges.map(change => rejectChange(change.id))
      );

      return results.every(result => result);
    } catch (error) {
      console.error('Error rejecting all changes:', error);
      return false;
    }
  }, [pendingChanges, rejectChange, transcriptId, enabled]);

  // Auto-refresh status periodically
  useEffect(() => {
    if (!enabled) return;

    loadStatus();
    loadPendingChanges();

    const interval = setInterval(() => {
      loadStatus();
      if (status.pendingChangesCount > 0) {
        loadPendingChanges();
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [enabled, loadStatus, loadPendingChanges, status.pendingChangesCount]);

  return {
    // Status
    status,
    pendingChanges,
    isProcessing,
    hasPendingChanges: status.pendingChangesCount > 0,
    
    // Actions
    detectChanges,
    generateAutoUpdates,
    acceptChange,
    rejectChange,
    undoChange,
    acceptAllChanges,
    rejectAllChanges,
    
    // Utilities
    refreshStatus: loadStatus,
    refreshPendingChanges: loadPendingChanges
  };
}