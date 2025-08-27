'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowRight, 
  CheckCircle, 
  Play, 
  Sparkles, 
  FileText,
  Upload,
  PenTool,
  Download,
  ChevronRight,
  Lightbulb,
  Circle,
  Edit3,
  RefreshCw,
  Plus,
  Trash2,
  X,
  Brain,
  GripVertical
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFourPhaseStory } from '@/hooks/use-four-phase-story';
import { useARCGenerator } from '@/hooks/use-arc-generator';
import { UpdateIndicator, PhaseStatus, RippleUpdateProgress, ConsistencyAlert } from './update-indicators';
import { StoryCreationStart } from './story-creation-start';
import { StreamlinedWritingTools } from '../writing-tools/streamlined-writing-tools';
import { UnifiedKnowledgeBase } from '../knowledge-base/unified-knowledge-base';
import { ResizableSidebar } from './resizable-sidebar';
import { Phase1AIInterface } from './phase1-ai-interface';
import { Phase2AIInterface } from './phase2-ai-interface';
import { Phase3AIInterface } from './phase3-ai-interface';
import { Phase4AIInterface } from './phase4-ai-interface';
import { EnhancedBrainstormInterface } from './enhanced-brainstorm-interface';
import { GuidelinePanel } from '../knowledge-base/guideline-panel';
import { GuidelineEngine } from '@/lib/knowledge-base/guideline-engine';
import { PhaseTransitions } from './phase-transitions';
import { ContentInheritance } from './content-inheritance';
import { RippleEffects } from './ripple-effects';
import { PhaseContextPreview } from './phase-context-preview';
import type { StoryData } from '@/lib/living-story/story-engine';

interface TranscriptAnalysis {
  summary: string;
  characters: string[];
  themes: string[];
  conflicts: string[];
  keyMoments: Array<{
    timestamp?: string;
    description: string;
    emotional_weight: number;
  }>;
  suggestedGenre: string;
}

interface WritingPhase {
  phase: number;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  isCompleted: boolean;
  isActive: boolean;
  output?: any;
}

interface FourPhaseInterfaceProps {
  projectId: string;
  initialData?: {
    transcript?: string;
    transcriptAnalysis?: TranscriptAnalysis;
    phase1?: string;
    phase2?: string[];
    phase3?: any[];
    phase4?: any;
  };
  onSaveProgress?: (phase: number, data: any) => void;
  onExitWorkflow?: () => void;
  className?: string;
}

const WRITING_PHASES: Omit<WritingPhase, 'isCompleted' | 'isActive' | 'output'>[] = [
  {
    phase: 0,
    title: "Brainstorm",
    subtitle: "Story Exploration",
    description: "Chat with Claude to explore story potential, characters, and themes from your transcript.",
    icon: <Brain className="size-5" />,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50 dark:bg-indigo-900/20",
    borderColor: "border-indigo-200 dark:border-indigo-800"
  },
  {
    phase: 1,
    title: "One Line Summary",
    subtitle: "Story Foundation",
    description: "Generate complete story summary in one powerful line that captures your entire narrative arc.",
    icon: <Sparkles className="size-5" />,
    color: "text-orange-600",
    bgColor: "bg-orange-50 dark:bg-orange-900/20",
    borderColor: "border-orange-200 dark:border-orange-800"
  },
  {
    phase: 2,
    title: "Scene Lines",
    subtitle: "3-4 Essential Scenes",
    description: "Break your story into 3-4 core scenes, with one powerful line describing each scene's purpose.",
    icon: <FileText className="size-5" />,
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-900/20",
    borderColor: "border-blue-200 dark:border-blue-800"
  },
  {
    phase: 3,
    title: "Scene Breakdowns",
    subtitle: "Detailed Bullet Points",
    description: "Expand each scene into detailed bullet-point breakdowns with character actions and emotional beats.",
    icon: <Edit3 className="size-5" />,
    color: "text-green-600",
    bgColor: "bg-green-50 dark:bg-green-900/20",
    borderColor: "border-green-200 dark:border-green-800"
  },
  {
    phase: 4,
    title: "Full Script Export",
    subtitle: "Professional Format",
    description: "Generate your complete script in professional format - beat sheet, screenplay, treatment, or outline.",
    icon: <Download className="size-5" />,
    color: "text-orange-600",
    bgColor: "bg-orange-50 dark:bg-orange-900/20",
    borderColor: "border-orange-200 dark:border-orange-800"
  }
];

export function FourPhaseInterface({
  projectId,
  initialData,
  onSaveProgress,
  onExitWorkflow,
  className
}: FourPhaseInterfaceProps) {
  const [currentPhase, setCurrentPhase] = useState(0);
  const [phases, setPhases] = useState<WritingPhase[]>(() => 
    WRITING_PHASES.map((phase, index) => ({
      ...phase,
      isCompleted: false,
      isActive: index === 0,
      output: null
    }))
  );
  
  // State for brainstorming phase
  const [brainstormSummary, setBrainstormSummary] = useState<string>('');
  const [hasBrainstormed, setHasBrainstormed] = useState(false);
  
  // Guideline engine integration
  const [guidelineEngine] = useState(() => new GuidelineEngine());
  const [activeGuidelines, setActiveGuidelines] = useState<Array<{
    fileName: string;
    fileId: string;
    ruleCount: number;
    categories: string[];
    isActive: boolean;
  }>>([]);
  const [currentCompliance, setCurrentCompliance] = useState<any>(null);
  const [knowledgeBaseFiles, setKnowledgeBaseFiles] = useState<any[]>([]);
  
  // Initialize guidelines from knowledge base files
  const initializeGuidelines = (files: any[]) => {
    setKnowledgeBaseFiles(files);
    const guidelines = guidelineEngine.parseKnowledgeBase(files);
    const summary = guidelineEngine.getActiveGuidelinesSummary();
    setActiveGuidelines(summary);
  };
  
  // Get guideline context for a specific phase
  const getGuidelineContext = (phase: number): string => {
    return guidelineEngine.generatePromptContext(phase);
  };
  
  // Toggle guideline on/off
  const handleToggleGuideline = (fileId: string, isActive: boolean) => {
    guidelineEngine.toggleGuideline(fileId, isActive);
    const summary = guidelineEngine.getActiveGuidelinesSummary();
    setActiveGuidelines(summary);
  };
  
  // Analyze content compliance
  const analyzeCompliance = (content: string, phase: number) => {
    if (!content.trim()) return;
    const compliance = guidelineEngine.analyzeCompliance(content, phase);
    setCurrentCompliance(compliance);
  };
  
  // Phase transition and content inheritance state
  const [showTransitions, setShowTransitions] = useState(false);
  const [showInheritance, setShowInheritance] = useState(true);
  const [inheritanceExpanded, setInheritanceExpanded] = useState(false);
  const [rippleEffects, setRippleEffects] = useState<any[]>([]);
  const [rippleExpanded, setRippleExpanded] = useState(false);
  const [contextPreviewExpanded, setContextPreviewExpanded] = useState(false);
  
  
  // Track whether we've started the workflow - hydration-safe approach
  const [hasStarted, setHasStarted] = useState(Boolean(initialData?.phase1 || initialData?.transcriptAnalysis));
  const [isHydrated, setIsHydrated] = useState(false);
  const [transcriptAnalysisData, setTranscriptAnalysisData] = useState<TranscriptAnalysis | null>(
    initialData?.transcriptAnalysis || null
  );

  // Handle hydration and check session storage after mount
  useEffect(() => {
    setIsHydrated(true);
    
    // Only check session storage after hydration
    const wasStarted = sessionStorage.getItem(`project_${projectId}_started`);
    const storedTranscriptData = sessionStorage.getItem(`project_${projectId}_transcript`);
    
    if (wasStarted) {
      setHasStarted(true);
    }
    
    if (storedTranscriptData && !transcriptAnalysisData) {
      try {
        const parsedData = JSON.parse(storedTranscriptData);
        setTranscriptAnalysisData(parsedData);
        setHasStarted(true);
      } catch {
        // Invalid data, ignore
      }
    }
  }, [projectId, transcriptAnalysisData]);

  // NUCLEAR OPTION: Disabled scroll-to-top - using natural browser behavior
  // useEffect(() => {
  //   // Scroll to top when the workflow interface mounts
  //   window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  // }, []);
  
  console.log('🚨 NUCLEAR DEBUG: FourPhaseInterface loaded - scroll-to-top DISABLED');

  // Convert initial data to StoryData format
  const convertToStoryData = (data: any): StoryData => ({
    projectId,
    phase1: {
      summary: data?.phase1 || '',
      themes: [],
      characters: [],
      genre: ''
    },
    phase2: {
      scenes: (data?.phase2 || ['']).map((scene: string, index: number) => ({
        id: `scene_${index + 1}`,
        title: `Scene ${index + 1}`,
        description: scene,
        purpose: '',
        order: index + 1
      }))
    },
    phase3: {
      sceneBreakdowns: data?.phase3 || []
    },
    phase4: {
      format: 'beat_sheet' as const,
      content: data?.phase4?.content || '',
      exportReady: false
    }
  });

  // Initialize living story system
  const livingStory = useFourPhaseStory({
    projectId,
    initialData: convertToStoryData(initialData),
    onUpdate: (updateId, affectedPhases) => {
      console.log(`Living story update ${updateId} affected phases:`, affectedPhases);
      // Update UI phases based on living story changes
      setPhases(prev => prev.map(phase => ({
        ...phase,
        isCompleted: affectedPhases.includes(phase.phase) || phase.isCompleted
      })));
    },
    onError: (error) => {
      console.error('Living story error:', error);
    }
  });

  // Initialize ARC Generator intelligence
  const arcGenerator = useARCGenerator({
    onPhaseComplete: (phase, data) => {
      console.log(`ARC completed phase ${phase}:`, data);
      // Update phase completion status
      setPhases(prev => prev.map(p => ({
        ...p,
        isCompleted: p.phase <= phase || p.isCompleted
      })));
    },
    onSuggestion: (suggestion) => {
      console.log('ARC suggestion:', suggestion);
    },
    onError: (error) => {
      console.error('ARC error:', error);
    }
  });

  // Phase-specific states - now synced with living story
  const [phase1Summary, setPhase1Summary] = useState(livingStory.storyData.phase1.summary);
  const [phase2Scenes, setPhase2Scenes] = useState<string[]>(
    livingStory.storyData.phase2.scenes.map(scene => scene.description)
  );
  const [phase3Breakdowns, setPhase3Breakdowns] = useState<any>(livingStory.storyData.phase3.sceneBreakdowns);
  const [phase4Script, setPhase4Script] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Scene management functions
  const addNewScene = () => {
    setPhase2Scenes(prev => {
      const newScenes = [...prev, ''];
      // Auto-trigger living story update to maintain consistency
      setTimeout(() => {
        const sceneData = {
          scenes: newScenes.map((sceneDesc, idx) => ({
            id: `scene_${idx + 1}`,
            title: `Scene ${idx + 1}`,
            description: sceneDesc,
            purpose: '',
            order: idx + 1
          }))
        };
        handlePhaseUpdate(2, sceneData);
      }, 100);
      return newScenes;
    });
  };

  const removeScene = (indexToRemove: number) => {
    if (phase2Scenes.length <= 1) return; // Don't allow removing the last scene
    
    const newScenes = phase2Scenes.filter((_, index) => index !== indexToRemove);
    setPhase2Scenes(newScenes);
    
    // Update living story immediately when scenes are removed
    const sceneData = {
      scenes: newScenes.map((sceneDesc, idx) => ({
        id: `scene_${idx + 1}`,
        title: `Scene ${idx + 1}`,
        description: sceneDesc,
        purpose: '',
        order: idx + 1
      }))
    };
    handlePhaseUpdate(2, sceneData);
  };

  // Update local state when living story changes
  useEffect(() => {
    setPhase1Summary(livingStory.storyData.phase1.summary);
    setPhase2Scenes(livingStory.storyData.phase2.scenes.map(scene => scene.description));
    setPhase3Breakdowns(livingStory.storyData.phase3.sceneBreakdowns);
  }, [livingStory.storyData]);

  const calculateProgress = () => {
    const completedPhases = phases.filter(p => p.isCompleted).length;
    return (completedPhases / 5) * 100; // Updated for 5 phases (0-4)
  };

  const handlePhaseComplete = (phaseNumber: number) => {
    setPhases(prev => prev.map(phase => ({
      ...phase,
      isCompleted: phase.phase === phaseNumber || phase.isCompleted,
      isActive: phase.phase === phaseNumber + 1
    })));
    
    // Show content inheritance after completing a phase
    setShowInheritance(true);
    
    // Auto-advance to next phase or export to canvas
    if (phaseNumber < 4) {
      setTimeout(() => {
        setCurrentPhase(phaseNumber + 1);
      }, 1000); // Small delay to show the transition
    } else if (phaseNumber === 4) {
      // Phase 4 complete - export to canvas
      setTimeout(() => {
        // Export the final script to canvas mode
        const finalScript = phase4Script;
        if (finalScript && onExitWorkflow) {
          // Create a completion message
          console.log('Phase 4 completed, exporting to canvas:', finalScript);
          
          // Save the final script content to localStorage for canvas
          localStorage.setItem('muse_canvas_content', finalScript.content || '');
          localStorage.setItem('muse_canvas_format', finalScript.format || 'treatment');
          localStorage.setItem('muse_canvas_metadata', JSON.stringify(finalScript.metadata || {}));
          
          // Exit workflow to canvas
          onExitWorkflow();
        }
      }, 2000); // Longer delay to show completion
    }

    // Save progress and trigger any necessary updates
    if (onSaveProgress) {
      onSaveProgress(phaseNumber, livingStory.getPhaseContent(phaseNumber));
    }

    // Generate ripple effects for completion
    generateRippleEffects(phaseNumber, getPhaseContent(phaseNumber));
  };

  const handlePhaseUpdate = (phaseNumber: number, content: any) => {
    // Update living story system which will trigger ripple updates
    livingStory.updatePhase(phaseNumber, content, {
      reason: `Manual edit to Phase ${phaseNumber}`,
      immediate: true
    });
    
    // Analyze compliance with guidelines
    if (knowledgeBaseFiles.length > 0) {
      const contentString = typeof content === 'string' ? content : JSON.stringify(content);
      const compliance = guidelineEngine.analyzeCompliance(contentString, phaseNumber);
      setCurrentCompliance(compliance);
    }
    
    // Generate ripple effects for downstream phases
    generateRippleEffects(phaseNumber, content);
  };

  // Phase transition handlers
  const handlePhaseTransition = (fromPhase: number, toPhase: number) => {
    setCurrentPhase(toPhase);
    setPhases(prev => prev.map(phase => ({
      ...phase,
      isActive: phase.phase === toPhase
    })));
  };

  const handleEditPhase = (phaseNumber: number) => {
    setCurrentPhase(phaseNumber);
    setPhases(prev => prev.map(phase => ({
      ...phase,
      isActive: phase.phase === phaseNumber
    })));
  };

  const goToPhase = (phaseNumber: number) => {
    handlePhaseTransition(currentPhase, phaseNumber);
  };

  // Ripple effect management
  const generateRippleEffects = (sourcePhase: number, content: any) => {
    const affectedPhases = getAffectedPhases(sourcePhase);
    if (affectedPhases.length === 0) return;

    const newEffect = {
      id: `ripple_${Date.now()}_${sourcePhase}`,
      sourcePhase,
      affectedPhases,
      type: 'update' as const,
      status: 'pending' as const,
      description: `Phase ${sourcePhase} changes can update ${affectedPhases.length > 1 ? 'phases' : 'phase'} ${affectedPhases.join(', ')}`,
      timestamp: new Date(),
      changes: generateChangePreview(sourcePhase, content, affectedPhases)
    };

    setRippleEffects(prev => [...prev.filter(e => e.sourcePhase !== sourcePhase), newEffect]);
  };

  const getAffectedPhases = (sourcePhase: number): number[] => {
    switch (sourcePhase) {
      case 0: return [1, 2, 3, 4]; // Brainstorm affects all
      case 1: return [2, 3, 4]; // One-line affects scene structure and beyond
      case 2: return [3, 4]; // Scenes affect beats and script
      case 3: return [4]; // Beats affect final script
      default: return [];
    }
  };

  const generateChangePreview = (sourcePhase: number, content: any, affectedPhases: number[]) => {
    // Generate intelligent preview of what would change
    return affectedPhases.map(phase => ({
      phase,
      before: getPhaseContent(phase),
      after: `Updated based on Phase ${sourcePhase} changes`,
      confidence: Math.floor(Math.random() * 40) + 60 // 60-100% confidence
    }));
  };

  const getPhaseContent = (phase: number): string => {
    switch (phase) {
      case 0: return brainstormSummary || '';
      case 1: return phase1Summary || '';
      case 2: return phase2Scenes.join('\n') || '';
      case 3: return JSON.stringify(phase3Breakdowns) || '';
      case 4: return phase4Script?.content || '';
      default: return '';
    }
  };

  // Create phase data for components
  const createPhaseDataArray = () => {
    return phases.map(phase => ({
      ...phase,
      content: getPhaseContent(phase.phase),
      summary: getPhaseContentSummary(phase.phase)
    }));
  };

  const getPhaseContentSummary = (phase: number): string => {
    switch (phase) {
      case 0: return brainstormSummary ? 'Brainstorming completed with creative insights' : '';
      case 1: return phase1Summary ? `"${phase1Summary.substring(0, 80)}..."` : '';
      case 2: return phase2Scenes.length > 0 ? `${phase2Scenes.length} scenes outlined` : '';
      case 3: return Object.keys(phase3Breakdowns || {}).length > 0 ? 'Scene beats detailed' : '';
      case 4: return phase4Script?.content ? `${phase4Script.format} script completed` : '';
      default: return '';
    }
  };

  // Ripple effect handlers
  const handleApplyRippleEffect = async (effectId: string) => {
    const effect = rippleEffects.find(e => e.id === effectId);
    if (!effect) return;

    // Update the effect status to processing
    setRippleEffects(prev => prev.map(e => 
      e.id === effectId ? { ...e, status: 'processing' as const } : e
    ));

    try {
      // Apply the ripple effect changes
      for (const change of effect.changes || []) {
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate processing
        // In a real implementation, this would regenerate content for affected phases
      }

      // Mark as complete
      setRippleEffects(prev => prev.map(e => 
        e.id === effectId ? { ...e, status: 'complete' as const } : e
      ));
    } catch (error) {
      // Mark as failed
      setRippleEffects(prev => prev.map(e => 
        e.id === effectId ? { ...e, status: 'failed' as const } : e
      ));
    }
  };

  const handleDismissRippleEffect = (effectId: string) => {
    setRippleEffects(prev => prev.filter(e => e.id !== effectId));
  };

  const handlePreviewRippleChanges = (effectId: string) => {
    // In a real implementation, this would show a detailed preview
    console.log('Preview changes for effect:', effectId);
  };


  const handleStartWithTranscript = async (analysisData: TranscriptAnalysis) => {
    setTranscriptAnalysisData(analysisData);
    setHasStarted(true);
    
    // Clean up session storage now that we're started
    sessionStorage.removeItem(`project_${projectId}_transcript`);
    sessionStorage.removeItem(`project_${projectId}_started`);
    
    // Run ARC analysis on the transcript for enhanced intelligence
    try {
      // Convert transcript analysis to full transcript text for ARC processing
      const mockTranscript = `
        ${analysisData.summary}
        Characters: ${analysisData.characters.join(', ')}
        Themes: ${analysisData.themes.join(', ')}
        Key moments: ${analysisData.keyMoments.map(m => m.description).join('. ')}
      `;
      
      await arcGenerator.analyzeTranscript(mockTranscript);
      
      // Generate enhanced summary options using ARC intelligence
      const summaryOptions = await arcGenerator.generateSummaryOptions(analysisData.summary);
      if (summaryOptions.length > 0) {
        setPhase1Summary(summaryOptions[0]); // Use the best ARC-enhanced summary
        handlePhaseUpdate(1, { summary: summaryOptions[0] });
      } else {
        // Fallback to original summary
        setPhase1Summary(analysisData.summary);
        handlePhaseUpdate(1, { summary: analysisData.summary });
      }
    } catch (error) {
      console.error('ARC analysis failed, using basic analysis:', error);
      // Fallback to original summary
      setPhase1Summary(analysisData.summary);
      handlePhaseUpdate(1, { summary: analysisData.summary });
    }
  };

  const handleStartBlank = () => {
    setHasStarted(true);
    
    // Clean up session storage now that we're started
    sessionStorage.removeItem(`project_${projectId}_transcript`);
    sessionStorage.removeItem(`project_${projectId}_started`);
    
    // Start with empty state - user will write their own summary
  };

  const generateAISuggestion = async (phase: number) => {
    setIsGenerating(true);
    try {
      if (phase === 1) {
        // Use ARC Generator for enhanced summary suggestions
        const summaryOptions = await arcGenerator.generateSummaryOptions(phase1Summary);
        if (summaryOptions.length > 0) {
          const bestSuggestion = summaryOptions[0];
          setPhase1Summary(bestSuggestion);
          handlePhaseUpdate(1, { summary: bestSuggestion });
        }
      } else if (phase === 2) {
        // Generate scene structure using ARC intelligence
        if (phase1Summary) {
          const sceneStructures = await arcGenerator.generateSceneStructure(phase1Summary);
          if (sceneStructures.length > 0) {
            const sceneDescriptions = sceneStructures.map(scene => scene.title + ': ' + scene.emotionalBeat);
            setPhase2Scenes(sceneDescriptions);
            
            // Update living story with new scene data
            const sceneData = {
              scenes: sceneStructures.map((scene, idx) => ({
                id: scene.id,
                title: scene.title,
                description: scene.emotionalBeat,
                purpose: scene.purpose,
                order: idx + 1
              }))
            };
            handlePhaseUpdate(2, sceneData);
          }
        }
      }
    } catch (error) {
      console.error('Error generating AI suggestion:', error);
      // Fallback to basic suggestions
      if (phase === 1) {
        const fallbackSuggestion = transcriptAnalysisData?.summary || 
          "A young music teacher discovers that in a world where music is banned, her melodies can literally break the oppressive government's mind-control technology.";
        setPhase1Summary(fallbackSuggestion);
        handlePhaseUpdate(1, { summary: fallbackSuggestion });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Show starting interface if workflow hasn't started
  if (!hasStarted) {
    return (
      <StoryCreationStart
        onStartWithTranscript={handleStartWithTranscript}
        onStartBlank={handleStartBlank}
        className={className}
      />
    );
  }

  return (
    <div className={cn("min-h-screen bg-background relative flex", className)}>
      {/* Unified Knowledge Base Sidebar */}
      <ResizableSidebar
        defaultWidth={320}
        minWidth={50}
        maxWidth={500}
      >
        <div className="space-y-4">
          <UnifiedKnowledgeBase 
            projectId={projectId}
            onFileSelect={(file) => {
              console.log('Selected file:', file);
              // Handle file integration with current writing phase
              if (file.type === 'transcript' && currentPhase === 1 && file.content) {
                // Auto-populate transcript analysis if available
                const analysisMatch = file.content.match(/Summary: (.+?)(?:\n|$)/);
                if (analysisMatch) {
                  setPhase1Summary(analysisMatch[1]);
                }
              } else if (file.type === 'character' && file.content) {
                // Could integrate character information into current phase
                console.log('Character file selected:', file.name);
              } else if (file.type === 'note' && file.content) {
                // Could append note content to current phase input
                console.log('Note selected:', file.name);
              }
              // TODO: Add more integration logic for different file types
            }}
            onFilesChange={(files) => {
              setKnowledgeBaseFiles(files);
              initializeGuidelines(files);
            }}
          />
          
          {/* Guideline Panel */}
          <GuidelinePanel
            phase={currentPhase}
            activeGuidelines={activeGuidelines}
            compliance={currentCompliance}
            onToggleGuideline={handleToggleGuideline}
          />
        </div>
      </ResizableSidebar>
      
      {/* Main Writing Canvas - Hero Section */}
      <div className="flex-1 p-6">
        {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <PenTool className="size-8 text-orange-600" />
            <div>
              <h1 className="text-3xl font-bold">4-Phase Writing Workflow</h1>
              <p className="text-muted-foreground">Transform your story from concept to complete script</p>
            </div>
          </div>
          
          {onExitWorkflow && (
            <Button
              variant="ghost"
              onClick={onExitWorkflow}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="size-4 mr-2" />
              Back to Canvas
            </Button>
          )}
        </div>
        
        <div className="flex items-center gap-4 mb-4">
          <Progress value={calculateProgress()} className="flex-1" />
          <span className="text-sm text-muted-foreground">
            {phases.filter(p => p.isCompleted).length} of 5 phases complete
          </span>
        </div>

        {/* Living Story Update Indicators */}
        <div className="space-y-3 mb-4">
          <UpdateIndicator
            isUpdating={livingStory.isUpdating}
            affectedPhases={livingStory.affectedPhases}
            canUndo={livingStory.canUndo}
            consistencyIssues={livingStory.consistencyIssues}
            onUndo={livingStory.undoLastUpdate}
            onClearError={livingStory.clearError}
            error={livingStory.updateError}
          />
          
          {livingStory.isUpdating && livingStory.affectedPhases.length > 1 && (
            <RippleUpdateProgress
              isUpdating={livingStory.isUpdating}
              sourcePhase={livingStory.affectedPhases[0]}
              affectedPhases={livingStory.affectedPhases}
              progress={75} // Could be calculated based on actual progress
            />
          )}

          {livingStory.consistencyIssues.length > 0 && (
            <ConsistencyAlert
              issues={livingStory.consistencyIssues}
              onResolve={(issueId) => {
                console.log('Resolve consistency issue:', issueId);
                // TODO: Implement issue resolution
              }}
              onDismiss={(issueId) => {
                console.log('Dismiss consistency issue:', issueId);
                // TODO: Implement issue dismissal
              }}
            />
          )}
        </div>

        {/* Smooth Transition Components */}
        <div className="space-y-6 mb-8">
          {/* Content Inheritance - Shows how phases build on each other */}
          {showInheritance && (
            <ContentInheritance
              currentPhase={currentPhase}
              phaseContents={createPhaseDataArray()}
              onRefreshFromPrevious={(phase) => {
                // Trigger regeneration from previous phase
                console.log('Refresh phase', phase, 'from previous phase');
              }}
              isExpanded={inheritanceExpanded}
              onToggleExpanded={() => setInheritanceExpanded(!inheritanceExpanded)}
            />
          )}

          {/* Ripple Effects - Shows and manages cascading changes */}
          {rippleEffects.length > 0 && (
            <RippleEffects
              activeEffects={rippleEffects}
              onApplyEffect={handleApplyRippleEffect}
              onDismissEffect={handleDismissRippleEffect}
              onPreviewChanges={handlePreviewRippleChanges}
              isExpanded={rippleExpanded}
              onToggleExpanded={() => setRippleExpanded(!rippleExpanded)}
            />
          )}

          {/* Phase Transitions - Alternative view for complex workflows */}
          {showTransitions && (
            <PhaseTransitions
              phases={createPhaseDataArray()}
              currentPhase={currentPhase}
              onPhaseTransition={handlePhaseTransition}
              onEditPhase={handleEditPhase}
            />
          )}
        </div>
      </div>

      {/* Phase Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-8">
        {phases.map((phase) => (
          <Card 
            key={phase.phase}
            className={cn(
              "cursor-pointer transition-all duration-200 hover:shadow-md",
              phase.isActive && "ring-2 ring-blue-500",
              phase.isCompleted && "bg-green-50 dark:bg-green-950/20"
            )}
            onClick={() => goToPhase(phase.phase)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center",
                  phase.isCompleted ? "bg-green-500 text-white" :
                  phase.isActive ? "bg-blue-500 text-white" :
                  "bg-gray-200 text-gray-500"
                )}>
                  {phase.isCompleted ? (
                    <CheckCircle className="size-4" />
                  ) : (
                    <Circle className="size-4" />
                  )}
                </div>
                <div className={phase.color}>
                  {phase.icon}
                </div>
              </div>
              <h3 className="font-semibold text-sm">{phase.title}</h3>
              <p className="text-xs text-muted-foreground">{phase.subtitle}</p>
              
              {/* Phase Status Indicator */}
              <PhaseStatus
                phase={phase.phase}
                isOutOfSync={livingStory.isPhaseOutOfSync(phase.phase)}
                isLocked={false} // TODO: Implement phase locking
                isUpdating={livingStory.isUpdating && livingStory.affectedPhases.includes(phase.phase)}
                onRefreshFromPrevious={() => livingStory.refreshFromPreviousPhase(phase.phase)}
                onToggleLock={() => livingStory.lockPhase(phase.phase, true)}
                className="mt-2"
              />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Active Phase Interface */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {phases[currentPhase - 1]?.icon}
                Phase {currentPhase}: {phases[currentPhase - 1]?.title}
              </CardTitle>
              <p className="text-muted-foreground mt-1">
                {phases[currentPhase - 1]?.description}
              </p>
            </div>
            <Badge variant="secondary">
              Step {currentPhase + 1} of 5
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Context Preview for Building on Previous Work */}
          {currentPhase > 0 && (
            <PhaseContextPreview
              currentPhase={currentPhase}
              brainstormSummary={brainstormSummary}
              phase1Summary={phase1Summary}
              phase2Scenes={phase2Scenes}
              phase3Breakdowns={phase3Breakdowns}
              isExpanded={contextPreviewExpanded}
              onToggleExpanded={() => setContextPreviewExpanded(!contextPreviewExpanded)}
            />
          )}

          {/* Phase 0: Brainstorming */}
          {currentPhase === 0 && (
            <EnhancedBrainstormInterface
              transcriptData={transcriptAnalysisData}
              knowledgeBase={{
                guidelines: getGuidelineContext(0),
                files: knowledgeBaseFiles
              }}
              knowledgeBaseFiles={knowledgeBaseFiles}
              onFilesChange={(files) => {
                setKnowledgeBaseFiles(files);
                initializeGuidelines(files);
              }}
              onProceedToPhase1={(brainstormSummary) => {
                setBrainstormSummary(brainstormSummary);
                setHasBrainstormed(true);
                handlePhaseComplete(0);
                // Auto-populate Phase 1 with brainstorm context
                if (brainstormSummary) {
                  handlePhaseUpdate(1, { 
                    summary: '', // Start empty but with context
                    brainstormContext: brainstormSummary 
                  });
                }
              }}
            />
          )}

          {/* Phase 1: One Line Summary */}
          {currentPhase === 1 && (
            <Phase1AIInterface
              brainstormContext={brainstormSummary}
              transcriptData={transcriptAnalysisData}
              knowledgeBase={{
                guidelines: getGuidelineContext(1),
                files: knowledgeBaseFiles
              }}
              onComplete={(summary) => {
                setPhase1Summary(summary);
                handlePhaseUpdate(1, { summary });
                handlePhaseComplete(1);
                analyzeCompliance(summary, 1);
              }}
              onSave={(summary) => {
                setPhase1Summary(summary);
                handlePhaseUpdate(1, { summary });
                onSaveProgress?.(1, { summary });
                analyzeCompliance(summary, 1);
              }}
              className="p-0"
            />
          )}

          {/* Phase 2: Scene Lines */}
          {currentPhase === 2 && (
            <Phase2AIInterface
              phase1Summary={phase1Summary}
              brainstormContext={brainstormSummary}
              knowledgeBase={{
                guidelines: getGuidelineContext(2),
                files: knowledgeBaseFiles
              }}
              onComplete={(scenes) => {
                setPhase2Scenes(scenes);
                handlePhaseUpdate(2, { scenes });
                handlePhaseComplete(2);
                analyzeCompliance(scenes.join('\n'), 2);
              }}
              onSave={(scenes) => {
                setPhase2Scenes(scenes);
                handlePhaseUpdate(2, { scenes });
                onSaveProgress?.(2, { scenes });
                analyzeCompliance(scenes.join('\n'), 2);
              }}
              className="p-0"
            />
          )}

          {/* Legacy Phase 2 code - Removed */}
          {false && currentPhase === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Break your story into essential scenes</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Based on: <em>"{phase1Summary}"</em>
                </p>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-muted-foreground">
                    {phase2Scenes.length} scene{phase2Scenes.length !== 1 ? 's' : ''}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addNewScene}
                    className="h-8"
                  >
                    <Plus className="size-3 mr-1" />
                    Add Scene
                  </Button>
                </div>
              </div>
              
              <div className="space-y-3">
                {phase2Scenes.map((scene, index) => (
                  <div
                    key={`scene_${index}`}
                    className="relative group animate-in fade-in-0 slide-in-from-top-1 duration-200"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium">
                        Scene {index + 1}
                      </label>
                      {phase2Scenes.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeScene(index)}
                          className="size-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20"
                          aria-label={`Remove scene ${index + 1}`}
                        >
                          <X className="size-3" />
                        </Button>
                      )}
                    </div>
                    <Textarea
                      value={scene}
                      onChange={(e) => {
                        const newScenes = [...phase2Scenes];
                        newScenes[index] = e.target.value;
                        setPhase2Scenes(newScenes);
                        
                        // Trigger living story update with debounce
                        clearTimeout((globalThis as any).phase2UpdateTimeout);
                        (globalThis as any).phase2UpdateTimeout = setTimeout(() => {
                          const sceneData = {
                            scenes: newScenes.map((sceneDesc, idx) => ({
                              id: `scene_${idx + 1}`,
                              title: `Scene ${idx + 1}`,
                              description: sceneDesc,
                              purpose: '',
                              order: idx + 1
                            }))
                          };
                          handlePhaseUpdate(2, sceneData);
                        }, 1000);
                      }}
                      placeholder={`Describe scene ${index + 1} in one powerful line...`}
                      className="min-h-[80px] transition-all duration-200 hover:border-muted-foreground/50 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                ))}
              </div>

              {/* Add Scene Button (Alternative placement) */}
              <div className="flex justify-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={addNewScene}
                  className="border-dashed border-2 hover:border-solid hover:bg-muted/50 transition-all duration-200"
                >
                  <Plus className="size-4 mr-2" />
                  Add Another Scene
                </Button>
              </div>
              
              <div className="flex gap-2 pt-4 border-t">
                <Button 
                  onClick={async () => {
                    await generateAISuggestion(2);
                    // Validate structure after generation
                    if (arcGenerator.sceneStructures.length > 0) {
                      arcGenerator.validateStoryStructure(arcGenerator.sceneStructures);
                    }
                  }}
                  disabled={isGenerating || arcGenerator.isGenerating}
                  variant="outline"
                >
                  {(isGenerating || arcGenerator.isGenerating) ? (
                    <RefreshCw className="size-4 mr-2 animate-spin" />
                  ) : (
                    <Lightbulb className="size-4 mr-2" />
                  )}
                  Generate Scene Breakdown
                </Button>
                
                <Button 
                  onClick={() => handlePhaseComplete(2)}
                  disabled={phase2Scenes.some(scene => !scene.trim())}
                >
                  Complete Phase 2
                  <ArrowRight className="size-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Phase 3: Scene Breakdowns */}
          {currentPhase === 3 && (
            <Phase3AIInterface
              scenes={phase2Scenes}
              phase1Summary={phase1Summary}
              brainstormContext={brainstormSummary}
              knowledgeBase={{
                guidelines: getGuidelineContext(3),
                files: knowledgeBaseFiles
              }}
              onComplete={(beats) => {
                setPhase3Breakdowns(beats);
                handlePhaseUpdate(3, { beats });
                handlePhaseComplete(3);
                analyzeCompliance(Object.values(beats).join('\n'), 3);
              }}
              onSave={(beats) => {
                setPhase3Breakdowns(beats);
                handlePhaseUpdate(3, { beats });
                onSaveProgress?.(3, { beats });
                analyzeCompliance(Object.values(beats).join('\n'), 3);
              }}
              className="p-0"
            />
          )}

          {/* Legacy Phase 3 code - Removed */}
          {false && currentPhase === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Expand each scene into detailed bullet points</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Character actions, conflicts, emotional beats, and what happens in each scene.
                </p>
              </div>
              
              <div className="space-y-6">
                {phase2Scenes.map((sceneLine, index) => (
                  <Card key={index} className="p-4">
                    <h4 className="font-medium mb-2">Scene {index + 1}</h4>
                    <p className="text-sm text-muted-foreground mb-3 italic">{sceneLine}</p>
                    
                    <Textarea
                      placeholder={`• What happens first?\n• Character actions and dialogue\n• Conflicts and tensions\n• Emotional beats\n• How does it end?`}
                      className="min-h-[150px] font-mono"
                    />
                  </Card>
                ))}
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={async () => {
                    // Expand each scene with ARC intelligence
                    for (let i = 0; i < phase2Scenes.length; i++) {
                      await arcGenerator.expandScene(i);
                    }
                    // Analyze tension curve across all scenes
                    await arcGenerator.analyzeTensionCurve();
                  }}
                  disabled={arcGenerator.isGenerating}
                >
                  {arcGenerator.isGenerating ? (
                    <RefreshCw className="size-4 mr-2 animate-spin" />
                  ) : (
                    <Lightbulb className="size-4 mr-2" />
                  )}
                  Generate Breakdowns
                </Button>
                
                <Button onClick={() => handlePhaseComplete(3)}>
                  Complete Phase 3
                  <ArrowRight className="size-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Phase 4: Export */}
          {currentPhase === 4 && (
            <Phase4AIInterface
              phase1Summary={phase1Summary}
              scenes={phase2Scenes}
              sceneBeats={phase3Breakdowns}
              brainstormContext={brainstormSummary}
              knowledgeBase={{
                guidelines: getGuidelineContext(4),
                files: knowledgeBaseFiles
              }}
              onComplete={(script) => {
                setPhase4Script(script);
                handlePhaseUpdate(4, script);
                handlePhaseComplete(4);
                analyzeCompliance(script.content || '', 4);
              }}
              onSave={(script) => {
                setPhase4Script(script);
                handlePhaseUpdate(4, script);
                onSaveProgress?.(4, script);
                analyzeCompliance(script.content || '', 4);
              }}
              className="p-0"
            />
          )}

          {/* Legacy Phase 4 code - Removed */}
          {false && currentPhase === 4 && (
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Export Your Complete Script</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Choose your format and generate a professional script from all your work.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: 'Beat Sheet', type: 'beat_sheet' as const, description: 'Scene-by-scene breakdown' },
                  { name: 'Screenplay', type: 'screenplay' as const, description: 'Industry standard format' },
                  { name: 'Treatment', type: 'treatment' as const, description: 'Narrative prose style' },
                  { name: 'Detailed Outline', type: 'outline' as const, description: 'Production-ready structure' }
                ].map((format) => (
                  <Card 
                    key={format.type} 
                    className="p-4 cursor-pointer hover:bg-gray-50 border-2 hover:border-blue-300"
                    onClick={async () => {
                      if (arcGenerator.sceneBreakdowns.length > 0) {
                        await arcGenerator.generateExport(format.type, {
                          title: 'Generated Story',
                          author: 'MUSE User',
                          genre: arcGenerator.storyAnalysis?.genre || 'Drama'
                        });
                      }
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{format.name}</h4>
                        <p className="text-sm text-muted-foreground">{format.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {arcGenerator.exportFormat?.type === format.type && (
                          <CheckCircle className="size-4 text-green-500" />
                        )}
                        <Download className="size-4" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
              
              <div className="flex gap-2">
                <Button
                  disabled={!arcGenerator.exportFormat || arcGenerator.isGenerating}
                  onClick={() => {
                    if (arcGenerator.exportFormat) {
                      // Create downloadable file
                      const blob = new Blob([arcGenerator.exportFormat.content], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `story_${arcGenerator.exportFormat.type}.txt`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }
                  }}
                >
                  <Download className="size-4 mr-2" />
                  Download Script
                </Button>
                
                {arcGenerator.exportFormat && (
                  <Button variant="outline" size="sm">
                    <FileText className="size-4 mr-2" />
                    {arcGenerator.exportFormat.metadata.pageCount} pages • {arcGenerator.exportFormat.metadata.estimatedDuration}
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      </div>

      {/* Streamlined Writing Tools - Right Sidebar */}
      <StreamlinedWritingTools
        writingStats={{
          wordCount: phase1Summary.length > 0 ? phase1Summary.split(' ').length : 0,
          sessionWordCount: phases.filter(p => p.isCompleted).length * 50, // Rough estimate
          writingTime: Math.floor(calculateProgress() * 2), // Rough estimate in minutes
          wpm: 25, // Default typing speed
          dailyGoal: 1000
        }}
        suggestions={arcGenerator.suggestions || []}
        isGenerating={arcGenerator.isGenerating || isGenerating}
        onGenerateSuggestions={() => generateAISuggestion(currentPhase)}
        onApplySuggestion={(suggestion) => {
          // Handle applying suggestions based on current phase
          if (currentPhase === 1) {
            const cleanSuggestion = suggestion.includes('Suggestion:') 
              ? suggestion.replace('Suggestion: ', '') 
              : suggestion;
            setPhase1Summary(cleanSuggestion);
            handlePhaseUpdate(1, { summary: cleanSuggestion });
          }
        }}
      />
    </div>
  );
}