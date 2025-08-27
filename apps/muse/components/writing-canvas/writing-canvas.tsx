'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  PenTool, 
  Save, 
  Clock, 
  Eye, 
  EyeOff,
  History,
  Settings,
  Brain,
  Minimize2,
  Maximize2,
  FileText,
  Type,
  Wand2,
  Sparkles,
  TrendingUp,
  Layout,
  HelpCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWritingCanvas } from '@/hooks/use-writing-canvas';
import { useRichTextEditor } from '@/hooks/use-rich-text-editor';
import { FormattingToolbar } from './formatting-toolbar';
import { EnhancedTextarea } from './enhanced-textarea';
import { FloatingArcButton } from './floating-arc-button';
import './writing-canvas.css';

interface WritingCanvasProps {
  projectId: string;
  initialContent?: string;
  className?: string;
  onContentChange?: (content: string) => void;
  onToggleWorkflow?: () => void;
  onStatsChange?: (stats: {
    wordCount: number;
    sessionWordCount: number;
    writingTime: number;
    wpm: number;
    dailyGoal?: number;
  }) => void;
}

export function WritingCanvas({
  projectId,
  initialContent = '',
  className,
  onContentChange,
  onToggleWorkflow,
  onStatsChange
}: WritingCanvasProps) {
  const [isMinimalMode, setIsMinimalMode] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showFormattingToolbar, setShowFormattingToolbar] = useState(true);
  const [showCanvasGuides, setShowCanvasGuides] = useState(true);
  const [showHelp, setShowHelp] = useState(false);

  const {
    content: canvasContent,
    wordCount,
    characterCount,
    lastSaved,
    versions,
    isAutoSaving,
    updateContent: updateCanvasContent,
    saveVersion,
    loadVersion,
    getTypingStats,
    getWritingStats
  } = useWritingCanvas({ 
    projectId, 
    initialContent,
    onContentChange 
  });

  // Rich text editor for formatting
  const {
    content,
    activeFormats,
    textareaRef,
    handleFormat,
    handleContentChange: handleRichTextChange,
    handleKeyDown
  } = useRichTextEditor({
    initialContent: canvasContent,
    onContentChange: (newContent) => {
      updateCanvasContent(newContent);
    }
  });

  // Sync content between canvas and rich text editor
  useEffect(() => {
    if (canvasContent !== content) {
      handleRichTextChange(canvasContent);
    }
  }, [canvasContent]);

  // Update stats when they change
  useEffect(() => {
    if (onStatsChange) {
      onStatsChange(getWritingStats());
    }
  }, [content, getWritingStats, onStatsChange]);

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    textarea.style.height = `${Math.max(300, textarea.scrollHeight)}px`;
  }, []);

  // Handle content changes with formatting support
  const handleContentChange = (value: string) => {
    handleRichTextChange(value);
    adjustTextareaHeight();
  };

  // Auto-resize on content change
  useEffect(() => {
    adjustTextareaHeight();
  }, [content, adjustTextareaHeight]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + S to save version
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        saveVersion();
      }
      
      // Cmd/Ctrl + M for minimal mode
      if ((e.metaKey || e.ctrlKey) && e.key === 'm') {
        e.preventDefault();
        setIsMinimalMode(prev => !prev);
      }

      // Cmd/Ctrl + Shift + F to toggle formatting toolbar
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        setShowFormattingToolbar(prev => !prev);
      }
      
      // Cmd/Ctrl + G to toggle canvas guidelines
      if ((e.metaKey || e.ctrlKey) && e.key === 'g') {
        e.preventDefault();
        setShowCanvasGuides(prev => !prev);
      }
      
      // ? key to open help (shift + /)
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setShowHelp(prev => !prev);
      }

      // Escape to exit minimal mode or close help
      if (e.key === 'Escape') {
        if (showHelp) {
          setShowHelp(false);
        } else if (isMinimalMode) {
          setIsMinimalMode(false);
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isMinimalMode, saveVersion, showHelp]);

  const formatLastSaved = (timestamp: Date | null) => {
    if (!timestamp) return 'Never';
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return timestamp.toLocaleDateString();
  };

  const typingStats = getTypingStats();

  return (
    <div className={cn(
      "flex-1 flex flex-col bg-background transition-all duration-300",
      isMinimalMode && "bg-white dark:bg-gray-950",
      className
    )}>
      {/* Header - Hidden in minimal mode */}
      {!isMinimalMode && (
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <PenTool className="size-5 text-orange-600" />
                <h1 className="font-semibold text-lg">Writing Canvas</h1>
              </div>
              
              {/* Live stats */}
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Badge variant="secondary" className="text-xs">
                  {wordCount} words
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {characterCount} chars
                </Badge>
                {typingStats.wpm > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {typingStats.wpm} WPM
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Auto-save indicator */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {isAutoSaving ? (
                  <div className="flex items-center gap-1">
                    <div className="size-2 bg-blue-500 rounded-full animate-pulse" />
                    <span>Saving...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <Save className="size-3 text-green-500" />
                    <span>Saved {formatLastSaved(lastSaved)}</span>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFormattingToolbar(!showFormattingToolbar)}
                className={cn(
                  "h-8 w-8 p-0 transition-colors",
                  showFormattingToolbar && "bg-accent text-accent-foreground"
                )}
                title="Toggle Formatting Toolbar (Cmd+Shift+F)"
              >
                <Type className="size-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCanvasGuides(!showCanvasGuides)}
                className={cn(
                  "h-8 w-8 p-0 transition-colors",
                  showCanvasGuides && "bg-accent/50 text-accent-foreground"
                )}
                title="Toggle Canvas Guidelines (Cmd+G)"
              >
                <Layout className="size-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowVersionHistory(!showVersionHistory)}
                className="size-8 p-0"
                title="Version History"
              >
                <History className="size-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimalMode(!isMinimalMode)}
                className="size-8 p-0"
                title={`${isMinimalMode ? 'Exit' : 'Enter'} Minimal Mode (Cmd+M)`}
              >
                {isMinimalMode ? <Maximize2 className="size-4" /> : <Minimize2 className="size-4" />}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHelp(true)}
                className={cn(
                  "size-8 p-0",
                  showHelp && "bg-accent text-accent-foreground"
                )}
                title="Help & Documentation (press ?)"
              >
                <HelpCircle className="size-4" />
              </Button>

              {/* AI-Powered Tools */}
              <div className="flex items-center gap-1 border-l pl-2 ml-2">
                {/* ARC Generator Button - Show when there's content to analyze */}
                {content.length >= 50 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onToggleWorkflow}
                    className="h-8 px-2 text-xs relative group hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-colors"
                    title="Open ARC Generator - AI-powered story structure analysis"
                  >
                    <Wand2 className="size-3 mr-1 text-orange-600" />
                    <span className="text-orange-700 dark:text-orange-300 font-medium">ARC Generator</span>
                    <Sparkles className="size-2 ml-1 text-orange-500 animate-pulse" />
                  </Button>
                )}
                
                {/* Simple Structure button when content is minimal */}
                {content.length < 50 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onToggleWorkflow}
                    className="h-8 px-2 text-xs text-muted-foreground"
                    title="Write more content to unlock AI story structure tools"
                    disabled={content.length < 10}
                  >
                    <TrendingUp className="size-3 mr-1" />
                    Structure
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Version History */}
          {showVersionHistory && (
            <div className="border-t bg-muted/50 p-3">
              <div className="flex items-center gap-2 mb-2">
                <History className="size-4 text-muted-foreground" />
                <span className="text-sm font-medium">Version History</span>
                <Badge variant="outline" className="text-xs">
                  {versions.length} versions
                </Badge>
              </div>
              
              <div className="flex gap-2 overflow-x-auto pb-1">
                {versions.slice(-10).map((version) => (
                  <Button
                    key={version.id}
                    variant="outline"
                    size="sm"
                    onClick={() => loadVersion(version.id)}
                    className="shrink-0 h-7 text-xs"
                  >
                    <Clock className="size-3 mr-1" />
                    {new Date(version.timestamp).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </Button>
                ))}
                
                {versions.length === 0 && (
                  <span className="text-xs text-muted-foreground">
                    No versions yet. Save your first version with Cmd+S
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Formatting Toolbar - Positioned below header */}
      {!isMinimalMode && showFormattingToolbar && (
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="px-4 py-2">
            <FormattingToolbar
              onFormat={handleFormat}
              activeFormats={activeFormats}
              position="top"
            />
          </div>
        </div>
      )}

      {/* Writing Area */}
      <div className={cn(
        "flex-1 relative",
        isMinimalMode ? "p-8 md:p-12 lg:p-16" : "p-6"
      )}>
        {/* Canvas Guidelines - Subtle frame indicators */}
        {showCanvasGuides && !isMinimalMode && (
          <>
            {/* Left guideline */}
            <div 
              className="absolute left-[10%] top-0 bottom-0 w-px pointer-events-none"
              style={{
                background: `linear-gradient(
                  to bottom,
                  transparent 0%,
                  transparent 5%,
                  rgba(156, 163, 175, 0.15) 10%,
                  rgba(156, 163, 175, 0.15) 90%,
                  transparent 95%,
                  transparent 100%
                )`
              }}
            />
            
            {/* Right guideline */}
            <div 
              className="absolute right-[10%] top-0 bottom-0 w-px pointer-events-none"
              style={{
                background: `linear-gradient(
                  to bottom,
                  transparent 0%,
                  transparent 5%,
                  rgba(156, 163, 175, 0.15) 10%,
                  rgba(156, 163, 175, 0.15) 90%,
                  transparent 95%,
                  transparent 100%
                )`
              }}
            />
            
            {/* Page break indicators (every ~750 words) */}
            {wordCount > 750 && (
              <div className="absolute left-[10%] right-[10%] pointer-events-none">
                {Array.from({ length: Math.floor(wordCount / 750) }, (_, i) => (
                  <div 
                    key={i}
                    className="relative"
                    style={{ 
                      top: `${(i + 1) * 100}vh`,
                      marginTop: '-40px'
                    }}
                  >
                    <div className="flex items-center justify-center">
                      <div className="text-[10px] text-gray-400/50 px-2 bg-background">
                        Page {i + 2}
                      </div>
                      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300/20 to-transparent" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Minimal mode header */}
        {isMinimalMode && (
          <div className="absolute top-4 right-4 z-10">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs bg-white/10 backdrop-blur border-white/20">
                {wordCount} words
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimalMode(false)}
                className="size-6 p-0 text-muted-foreground hover:text-foreground"
              >
                <Maximize2 className="size-3" />
              </Button>
            </div>
          </div>
        )}

        {/* Main writing textarea with formatting support */}
        <div className={cn(
          "w-full mx-auto relative",
          isMinimalMode ? "max-w-4xl" : "max-w-5xl"
        )}>
          {/* Formatting toolbar for minimal mode */}
          {isMinimalMode && showFormattingToolbar && (
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-10">
              <FormattingToolbar
                onFormat={handleFormat}
                activeFormats={activeFormats}
                className="bg-white/10 dark:bg-black/10 backdrop-blur-md border-white/20 dark:border-white/10"
              />
            </div>
          )}

          <EnhancedTextarea
            ref={textareaRef}
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            onKeyDown={handleKeyDown}
            isMinimalMode={isMinimalMode}
            enhancedCursor={true}
            spellCheck
            autoComplete="off"
            autoCorrect="on"
            autoCapitalize="sentences"
            className={content.length === 0 ? 'is-placeholder-empty' : ''}
            data-placeholder={isMinimalMode 
              ? "Start writing or press Tab for AI assistance..." 
              : "Start typing or paste your script here • Press TAB for AI content generation • Use Cmd+B/I/U for formatting • Click ARC Generator for story structure • Press ? for help"
            }
          />
        </div>

        {/* Writing progress indicator for minimal mode */}
        {isMinimalMode && content.length > 100 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
            <div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 backdrop-blur rounded-full px-3 py-1">
              <div className="size-2 bg-green-500 rounded-full" />
              <span className="text-xs text-muted-foreground">
                {Math.floor(content.length / 250)} pages written
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Floating save button for minimal mode */}
      {isMinimalMode && (
        <Button
          onClick={saveVersion}
          className="fixed bottom-6 right-6 rounded-full size-12 shadow-lg bg-orange-600 hover:bg-orange-700"
        >
          <Save className="size-5" />
        </Button>
      )}

      {/* Floating ARC Generator Button - Shows when user has substantial content */}
      {!isMinimalMode && onToggleWorkflow && (
        <FloatingArcButton
          onOpenArcGenerator={onToggleWorkflow}
          wordCount={wordCount}
          minWordCount={200}
        />
      )}

      {/* Help Documentation Modal */}
      <Dialog open={showHelp} onOpenChange={setShowHelp}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="size-5 text-primary" />
              MUSE Help & Documentation
            </DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="getting-started" className="w-full">
            <TabsList className="grid grid-cols-4 w-full mb-6">
              <TabsTrigger value="getting-started">Getting Started</TabsTrigger>
              <TabsTrigger value="features">Features</TabsTrigger>
              <TabsTrigger value="shortcuts">Shortcuts</TabsTrigger>
              <TabsTrigger value="faq">FAQ</TabsTrigger>
            </TabsList>

            <TabsContent value="getting-started" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Welcome to MUSE</h3>
                <p className="text-muted-foreground">
                  MUSE is an AI-powered creative writing workspace designed for screenwriters, novelists, and storytellers.
                </p>
                
                <div className="space-y-3">
                  <h4 className="font-medium">🎯 Quick Start Guide</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <Badge className="min-w-6 h-6 text-[10px] p-1">1</Badge>
                      <span>Start typing in the canvas or press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">TAB</kbd> for AI assistance</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Badge className="min-w-6 h-6 text-[10px] p-1">2</Badge>
                      <span>Use the Knowledge Base to import scripts, notes, or research materials</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Badge className="min-w-6 h-6 text-[10px] p-1">3</Badge>
                      <span>Click <strong>ARC Generator</strong> when you have 200+ words for AI story structure</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Badge className="min-w-6 h-6 text-[10px] p-1">4</Badge>
                      <span>Export your work in multiple professional formats (Fountain, Final Draft, PDF)</span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="features" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Wand2 className="size-4 text-orange-600" />
                    AI Writing Assistant
                  </h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>• Press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">TAB</kbd> anywhere for context-aware content generation</p>
                    <p>• Get suggestions for dialogue, action, and scene development</p>
                    <p>• Maintain your voice while AI enhances your creativity</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Brain className="size-4 text-indigo-600" />
                    ARC Generator (Story Structure)
                  </h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>• Analyze your existing content for story structure</p>
                    <p>• 4-phase workflow: Brainstorm → One Line → Scene Lines → Beats → Script</p>
                    <p>• Professional screenplay and treatment generation</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <FileText className="size-4 text-green-600" />
                    Knowledge Base
                  </h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>• Upload research materials, character notes, treatments</p>
                    <p>• AI integrates your knowledge into writing suggestions</p>
                    <p>• Supports .txt, .pdf, .docx, and screenplay formats</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Type className="size-4 text-blue-600" />
                    Professional Formatting
                  </h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>• Industry-standard screenplay formatting</p>
                    <p>• Export to Final Draft, Fountain, PDF, and more</p>
                    <p>• Real-time formatting as you write</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="shortcuts" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Writing & Editing</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span>AI Content Generation</span>
                      <kbd className="px-2 py-1 bg-muted rounded text-xs">TAB</kbd>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Bold Text</span>
                      <kbd className="px-2 py-1 bg-muted rounded text-xs">Cmd+B</kbd>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Italic Text</span>
                      <kbd className="px-2 py-1 bg-muted rounded text-xs">Cmd+I</kbd>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Underline Text</span>
                      <kbd className="px-2 py-1 bg-muted rounded text-xs">Cmd+U</kbd>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Save Version</span>
                      <kbd className="px-2 py-1 bg-muted rounded text-xs">Cmd+S</kbd>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Interface & Navigation</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span>Toggle Minimal Mode</span>
                      <kbd className="px-2 py-1 bg-muted rounded text-xs">Cmd+M</kbd>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Toggle Canvas Guidelines</span>
                      <kbd className="px-2 py-1 bg-muted rounded text-xs">Cmd+G</kbd>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Toggle Formatting Toolbar</span>
                      <kbd className="px-2 py-1 bg-muted rounded text-xs">Cmd+Shift+F</kbd>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Open Help</span>
                      <kbd className="px-2 py-1 bg-muted rounded text-xs">?</kbd>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Close Modal/Exit Mode</span>
                      <kbd className="px-2 py-1 bg-muted rounded text-xs">ESC</kbd>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="faq" className="space-y-6">
              <div className="space-y-6">
                <div className="space-y-3">
                  <h4 className="font-medium">How do I use the AI writing assistant?</h4>
                  <p className="text-sm text-muted-foreground">
                    Simply press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">TAB</kbd> at any point while writing. 
                    The AI will analyze your context and provide relevant suggestions for continuing your scene, 
                    dialogue, or action lines. The suggestions maintain your writing style and story direction.
                  </p>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-medium">When should I use the ARC Generator?</h4>
                  <p className="text-sm text-muted-foreground">
                    The ARC Generator works best when you have at least 200 words of content to analyze. 
                    It's perfect for developing rough drafts into structured screenplays, finding story beats 
                    in existing content, or brainstorming new story directions based on your initial ideas.
                  </p>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-medium">What file formats can I upload to the Knowledge Base?</h4>
                  <p className="text-sm text-muted-foreground">
                    MUSE supports .txt, .pdf, .docx, .fountain, and .fdx files. You can upload research materials, 
                    character bibles, previous drafts, treatments, and notes. The AI will use this context to 
                    provide more accurate and relevant suggestions.
                  </p>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-medium">How do I export my work?</h4>
                  <p className="text-sm text-muted-foreground">
                    Use the ARC Generator to format your work professionally, then export to industry-standard 
                    formats including Final Draft (.fdx), Fountain (.fountain), PDF, or plain text. 
                    Each format maintains proper screenplay formatting and pagination.
                  </p>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-medium">Can I collaborate with others?</h4>
                  <p className="text-sm text-muted-foreground">
                    Yes! MUSE supports real-time collaboration. Share your project with co-writers, 
                    and work together with shared Knowledge Base access and synchronized editing. 
                    All changes are saved automatically with version history.
                  </p>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-medium">What makes MUSE different from other writing tools?</h4>
                  <p className="text-sm text-muted-foreground">
                    MUSE combines AI-powered writing assistance with professional screenplay formatting 
                    and story structure analysis. It's designed specifically for creative writers who need 
                    both inspiration and industry-standard output formats.
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="flex justify-end pt-4 border-t">
            <DialogClose asChild>
              <Button variant="outline">Close Help</Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}