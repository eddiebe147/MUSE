import { useState, useEffect, useCallback, useRef } from 'react';

interface Version {
  id: string;
  content: string;
  timestamp: Date;
  wordCount: number;
  title: string;
}

interface TypingStats {
  wpm: number;
  startTime: Date | null;
  keystrokes: number;
}

interface UseWritingCanvasOptions {
  projectId: string;
  initialContent?: string;
  autoSaveInterval?: number; // milliseconds
  onContentChange?: (content: string) => void;
}

interface UseWritingCanvasReturn {
  content: string;
  wordCount: number;
  characterCount: number;
  lastSaved: Date | null;
  versions: Version[];
  isAutoSaving: boolean;
  updateContent: (newContent: string) => void;
  saveVersion: (title?: string) => void;
  loadVersion: (versionId: string) => void;
  deleteVersion: (versionId: string) => void;
  getTypingStats: () => TypingStats;
  getWritingStats: () => {
    wordCount: number;
    sessionWordCount: number;
    writingTime: number;
    wpm: number;
    dailyGoal?: number;
  };
}

export function useWritingCanvas({
  projectId,
  initialContent = '',
  autoSaveInterval = 3000, // 3 seconds
  onContentChange
}: UseWritingCanvasOptions): UseWritingCanvasReturn {
  
  const [content, setContent] = useState(initialContent);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [versions, setVersions] = useState<Version[]>([]);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  
  // Typing statistics
  const [typingStats, setTypingStats] = useState<TypingStats>({
    wpm: 0,
    startTime: null,
    keystrokes: 0
  });

  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();
  const lastContentRef = useRef(content);
  const keyStrokeCountRef = useRef(0);
  const sessionStartRef = useRef<Date | null>(null);
  const sessionStartWordCountRef = useRef(0);
  const writingTimeRef = useRef(0);

  // Storage keys
  const getStorageKey = (suffix: string) => `muse-canvas-${projectId}-${suffix}`;

  // Load initial data from localStorage
  useEffect(() => {
    // Check for workflow export data first (from Phase 4 completion)
    const workflowExportContent = localStorage.getItem('muse_canvas_content');
    const workflowExportFormat = localStorage.getItem('muse_canvas_format');
    const workflowExportMetadata = localStorage.getItem('muse_canvas_metadata');
    
    // Regular canvas data
    const savedContent = localStorage.getItem(getStorageKey('content'));
    const savedVersions = localStorage.getItem(getStorageKey('versions'));
    const savedStats = localStorage.getItem(getStorageKey('stats'));

    // Prioritize workflow export data if available
    if (workflowExportContent && !initialContent) {
      console.log('Loading content from Phase 4 workflow export');
      setContent(workflowExportContent);
      
      // Create a version for this workflow export
      const version: Version = {
        id: `workflow-export-${Date.now()}`,
        content: workflowExportContent,
        timestamp: new Date(),
        wordCount: workflowExportContent.split(' ').length,
        title: `Phase 4 Export - ${workflowExportFormat || 'Script'}`
      };
      setVersions(prev => [version, ...prev]);
      
      // Save to regular canvas storage and clear workflow export
      localStorage.setItem(getStorageKey('content'), workflowExportContent);
      localStorage.removeItem('muse_canvas_content');
      localStorage.removeItem('muse_canvas_format');
      localStorage.removeItem('muse_canvas_metadata');
      
    } else if (savedContent && !initialContent) {
      setContent(savedContent);
    }
    
    if (savedVersions) {
      try {
        const parsedVersions = JSON.parse(savedVersions).map((v: any) => ({
          ...v,
          timestamp: new Date(v.timestamp)
        }));
        setVersions(parsedVersions);
      } catch (error) {
        console.error('Failed to parse saved versions:', error);
      }
    }

    if (savedStats) {
      try {
        const parsedStats = JSON.parse(savedStats);
        if (parsedStats.startTime) {
          parsedStats.startTime = new Date(parsedStats.startTime);
        }
        setTypingStats(parsedStats);
        sessionStartRef.current = parsedStats.startTime;
      } catch (error) {
        console.error('Failed to parse saved stats:', error);
      }
    }

    // Initialize session start time and word count
    if (!sessionStartRef.current) {
      sessionStartRef.current = new Date();
      sessionStartWordCountRef.current = wordCount;
    }
  }, [projectId, initialContent]);

  // Calculate word and character counts
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const characterCount = content.length;

  // Auto-save functionality
  const saveToStorage = useCallback(async () => {
    setIsAutoSaving(true);
    
    try {
      // Save content
      localStorage.setItem(getStorageKey('content'), content);
      
      // Save versions
      localStorage.setItem(getStorageKey('versions'), JSON.stringify(versions));
      
      // Save stats
      localStorage.setItem(getStorageKey('stats'), JSON.stringify(typingStats));
      
      // Simulate API save delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setLastSaved(new Date());
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setIsAutoSaving(false);
    }
  }, [content, versions, typingStats, projectId]);

  // Update content with auto-save
  const updateContent = useCallback((newContent: string) => {
    setContent(newContent);
    onContentChange?.(newContent);

    // Update typing stats
    const now = new Date();
    if (!sessionStartRef.current) {
      sessionStartRef.current = now;
    }

    // Count keystrokes (rough estimate)
    const newKeystrokes = Math.abs(newContent.length - lastContentRef.current.length);
    keyStrokeCountRef.current += newKeystrokes;
    lastContentRef.current = newContent;

    // Calculate WPM
    const sessionDuration = (now.getTime() - (sessionStartRef.current?.getTime() || now.getTime())) / 60000; // minutes
    const wordsTyped = newContent.trim().split(/\s+/).length;
    const wpm = sessionDuration > 0 ? Math.round(wordsTyped / sessionDuration) : 0;

    setTypingStats(prev => ({
      ...prev,
      wpm: Math.min(wpm, 200), // Cap at reasonable maximum
      keystrokes: keyStrokeCountRef.current,
      startTime: sessionStartRef.current
    }));

    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Set new auto-save timeout
    autoSaveTimeoutRef.current = setTimeout(() => {
      saveToStorage();
    }, autoSaveInterval);
  }, [onContentChange, saveToStorage, autoSaveInterval]);

  // Manual version save
  const saveVersion = useCallback((title?: string) => {
    if (!content.trim()) return;

    const version: Version = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content,
      timestamp: new Date(),
      wordCount,
      title: title || `Draft ${versions.length + 1}`
    };

    setVersions(prev => {
      const updated = [...prev, version];
      // Keep only last 50 versions to prevent storage bloat
      return updated.slice(-50);
    });

    // Save immediately
    saveToStorage();
  }, [content, wordCount, versions.length, saveToStorage]);

  // Load a specific version
  const loadVersion = useCallback((versionId: string) => {
    const version = versions.find(v => v.id === versionId);
    if (version) {
      setContent(version.content);
      onContentChange?.(version.content);
    }
  }, [versions, onContentChange]);

  // Delete a version
  const deleteVersion = useCallback((versionId: string) => {
    setVersions(prev => prev.filter(v => v.id !== versionId));
  }, []);

  // Get current typing stats
  const getTypingStats = useCallback(() => typingStats, [typingStats]);

  // Get comprehensive writing stats for tools sidebar
  const getWritingStats = useCallback(() => {
    const sessionDuration = sessionStartRef.current 
      ? Math.floor((Date.now() - sessionStartRef.current.getTime()) / 60000) 
      : 0;
    
    const sessionWordCount = Math.max(0, wordCount - sessionStartWordCountRef.current);
    
    return {
      wordCount,
      sessionWordCount,
      writingTime: sessionDuration,
      wpm: typingStats.wpm,
      dailyGoal: 1000 // Could be user-configurable
    };
  }, [wordCount, typingStats.wpm]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // Save when component unmounts or page unloads
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
        // Synchronous save on page unload
        localStorage.setItem(getStorageKey('content'), content);
        localStorage.setItem(getStorageKey('versions'), JSON.stringify(versions));
        localStorage.setItem(getStorageKey('stats'), JSON.stringify(typingStats));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [content, versions, typingStats, projectId]);

  return {
    content,
    wordCount,
    characterCount,
    lastSaved,
    versions,
    isAutoSaving,
    updateContent,
    saveVersion,
    loadVersion,
    deleteVersion,
    getTypingStats,
    getWritingStats
  };
}