'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { WritingCanvas } from './writing-canvas';
import { UnifiedKnowledgeBase } from '../knowledge-base/unified-knowledge-base';
import { StreamlinedWritingTools } from '../writing-tools/streamlined-writing-tools';
import { ResizableSidebar } from '../writing-workflow/resizable-sidebar';
import { FourPhaseInterface } from '../writing-workflow/four-phase-interface';

interface CanvasInterfaceProps {
  projectId: string;
  initialData?: {
    transcript?: string;
    phase1?: string;
    phase2?: string[];
    phase3?: any[];
    phase4?: any;
    transcriptAnalysis?: any;
  };
  className?: string;
}

type SidebarType = 'none' | 'workflow';

export function CanvasInterface({ 
  projectId, 
  initialData, 
  className 
}: CanvasInterfaceProps) {
  const [activeSidebar, setActiveSidebar] = useState<SidebarType>('none');
  const [canvasContent, setCanvasContent] = useState(initialData?.phase1 || '');
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [writingStats, setWritingStats] = useState({
    wordCount: 0,
    sessionWordCount: 0,
    writingTime: 0,
    wpm: 0,
    dailyGoal: 1000
  });

  // Handle sidebar toggle
  const toggleSidebar = (sidebar: SidebarType) => {
    setActiveSidebar(current => current === sidebar ? 'none' : sidebar);
  };

  // Handle content sync between canvas and workflow
  const handleCanvasContentChange = (content: string) => {
    setCanvasContent(content);
  };

  // Handle file selection from knowledge base
  const handleFileSelect = (file: any) => {
    console.log('File selected:', file);
    // Could integrate file content into canvas
    if (file.content && file.type === 'transcript') {
      // For example, append transcript content to canvas
      setCanvasContent(prev => prev + '\n\n--- From ' + file.name + ' ---\n' + file.content);
    }
  };

  // Handle AI suggestion generation
  const handleGenerateAISuggestions = async () => {
    if (!canvasContent.trim() || canvasContent.length < 50) return;
    
    setIsGeneratingAI(true);
    try {
      // Simulate AI generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockSuggestions = [
        "Consider expanding this dialogue to reveal more character motivation.",
        "The pacing could be improved by adding a transition paragraph here.",
        "This scene would benefit from more sensory details to immerse the reader."
      ];
      
      setAiSuggestions(mockSuggestions);
    } catch (error) {
      console.error('Error generating AI suggestions:', error);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Handle applying AI suggestions
  const handleApplySuggestion = (suggestion: string) => {
    // Insert suggestion as a comment or append to content
    setCanvasContent(prev => prev + '\n\n[AI Suggestion: ' + suggestion + ']');
    
    // Remove applied suggestion
    setAiSuggestions(prev => prev.filter(s => s !== suggestion));
  };

  // If workflow mode is active, show the full workflow interface
  if (activeSidebar === 'workflow') {
    return (
      <div className={cn("min-h-screen bg-background", className)}>
        <FourPhaseInterface
          projectId={projectId}
          initialData={initialData}
          onExitWorkflow={() => setActiveSidebar('none')}
        />
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen bg-background flex", className)}>
      {/* Unified Knowledge Base Sidebar - Always visible but collapsible */}
      <ResizableSidebar
        defaultWidth={320}
        minWidth={50}  // Allow very narrow for collapsed state
        maxWidth={500}
      >
        <UnifiedKnowledgeBase 
          projectId={projectId}
          onFileSelect={handleFileSelect}
        />
      </ResizableSidebar>

      {/* Main Writing Canvas - Hero Component */}
      <WritingCanvas
        projectId={projectId}
        initialContent={canvasContent}
        onContentChange={handleCanvasContentChange}
        onToggleWorkflow={() => toggleSidebar('workflow')}
        onStatsChange={setWritingStats}
        className="flex-1"
      />

      {/* Streamlined Writing Tools - Always visible but collapsible */}
      <StreamlinedWritingTools
        writingStats={writingStats}
        suggestions={aiSuggestions}
        isGenerating={isGeneratingAI}
        onGenerateSuggestions={handleGenerateAISuggestions}
        onApplySuggestion={handleApplySuggestion}
        onOpenArcGenerator={() => toggleSidebar('workflow')}
      />
    </div>
  );
}