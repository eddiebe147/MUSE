'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  BookOpen, 
  Users, 
  FileText, 
  Workflow,
  Settings,
  Plus,
  FolderOpen,
  Zap,
  Lightbulb,
  Play,
  CheckCircle as CheckCircleIcon,
  Clock,
  AlertCircle,
  TrendingUp,
  Activity
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { TranscriptUpload } from '@/components/transcript-analysis/transcript-upload';
import { ProductionBibleManager } from '@/components/production-bible/production-bible-manager';
import { useRouter } from 'next/navigation';

interface WorkflowPhase {
  phase: number;
  title: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'needs_update';
  lastUpdated?: Date;
  content?: any;
  progress: number;
}

interface ProjectWorkflowStatus {
  projectId: string;
  projectTitle: string;
  currentPhase: number;
  overallProgress: number;
  phases: WorkflowPhase[];
  hasTranscriptAnalysis: boolean;
  activeGuidelines: number;
  detectedCharacters: string[];
  lastActivity?: Date;
}

interface StoryNavigationProps {
  activeSection?: 'documents' | 'characters' | 'transcripts' | 'workflows' | 'guidelines';
  onSectionChange?: (section: string) => void;
  className?: string;
  // Real data counts
  documentCount?: number;
  characterCount?: number;
  transcriptCount?: number;
  workflowCount?: number;
  guidelineCount?: number;
  // Project context for uploads
  projectId?: string;
  onDataUpdate?: () => void;
  // Enhanced workflow integration
  enableWorkflowTracking?: boolean;
}

const navigationItems = [
  {
    key: 'documents',
    label: 'Documents',
    icon: BookOpen,
    description: 'Story documents and scripts',
    badge: null, // Will be populated with real count
    color: 'text-blue-500'
  },
  {
    key: 'characters',
    label: 'Characters',
    icon: Users,
    description: 'Character profiles and development',
    badge: null, // Will be populated with real count
    color: 'text-green-500'
  },
  {
    key: 'transcripts',
    label: 'Transcripts',
    icon: FileText,
    description: 'Interview recordings and notes',
    badge: null, // Will be populated with real count
    color: 'text-orange-500'
  },
  {
    key: 'workflows',
    label: 'Workflows',
    icon: Workflow,
    description: '4-phase production system',
    badge: null, // Will be populated with real count
    color: 'text-purple-500'
  },
  {
    key: 'guidelines',
    label: 'Guidelines',
    icon: Lightbulb,
    description: 'Production guidelines and best practices',
    badge: null, // Will be populated with real count
    color: 'text-yellow-500'
  }
];

type QuickActionType = 'new-document' | 'add-character' | 'upload-transcript' | 'create-workflow' | 'upload-guidelines' | 'continue-workflow';

const quickActions = [
  { label: 'New Document', icon: BookOpen, action: 'new-document' as QuickActionType },
  { label: 'Add Character', icon: Users, action: 'add-character' as QuickActionType },
  { label: 'Upload Transcript', icon: FileText, action: 'upload-transcript' as QuickActionType },
  { label: 'Upload Guidelines', icon: Lightbulb, action: 'upload-guidelines' as QuickActionType },
  { label: 'Continue Workflow', icon: Play, action: 'continue-workflow' as QuickActionType }
];

export function StoryNavigation({ 
  activeSection = 'documents', 
  onSectionChange,
  className,
  documentCount = 0,
  characterCount = 0,
  transcriptCount = 0,
  workflowCount = 0,
  guidelineCount = 0,
  projectId,
  onDataUpdate,
  enableWorkflowTracking = true
}: StoryNavigationProps) {
  const router = useRouter();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<QuickActionType | null>(null);
  const [workflowStatus, setWorkflowStatus] = useState<ProjectWorkflowStatus | null>(null);
  const [isLoadingWorkflow, setIsLoadingWorkflow] = useState(false);

  // Fetch workflow status when project ID changes
  const fetchWorkflowStatus = useCallback(async () => {
    if (!projectId || !enableWorkflowTracking) return;
    
    setIsLoadingWorkflow(true);
    try {
      const response = await fetch(`/api/workflow/${projectId}?insights=true`);
      if (response.ok) {
        const data = await response.json();
        setWorkflowStatus(data.workflow);
      }
    } catch (error) {
      console.error('Failed to fetch workflow status:', error);
    } finally {
      setIsLoadingWorkflow(false);
    }
  }, [projectId, enableWorkflowTracking]);

  useEffect(() => {
    fetchWorkflowStatus();
  }, [fetchWorkflowStatus]);

  // Real-time workflow tracking
  useEffect(() => {
    if (!projectId || !enableWorkflowTracking) return;

    const interval = setInterval(() => {
      fetchWorkflowStatus();
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [projectId, enableWorkflowTracking, fetchWorkflowStatus]);

  const handleQuickAction = (action: QuickActionType) => {
    switch (action) {
      case 'upload-transcript':
        setActiveModal('upload-transcript');
        break;
      case 'upload-guidelines':
        setActiveModal('upload-guidelines');
        break;
      case 'continue-workflow':
        if (workflowStatus) {
          router.push(`/write/${workflowStatus.projectId}`);
        } else if (projectId) {
          router.push(`/write/${projectId}`);
        }
        break;
      case 'new-document':
        // TODO: Implement new document creation
        console.log('New document creation - to be implemented');
        break;
      case 'add-character':
        // TODO: Implement character creation
        console.log('Character creation - to be implemented');
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  const handleUploadComplete = () => {
    setActiveModal(null);
    if (onDataUpdate) {
      onDataUpdate();
    }
    // Refresh workflow status after upload
    fetchWorkflowStatus();
  };

  // Enhanced navigation items with workflow intelligence
  const getNavigationItems = () => [
    {
      key: 'documents',
      label: 'Documents',
      icon: BookOpen,
      description: documentCount === 0 ? 'No documents yet' : 'Story documents and scripts',
      badge: documentCount > 0 ? documentCount.toString() : null,
      color: 'text-blue-500',
      isEmpty: documentCount === 0,
      workflowRelevance: workflowStatus ? ['all'] : []
    },
    {
      key: 'characters',
      label: 'Characters',
      icon: Users,
      description: workflowStatus?.detectedCharacters.length 
        ? `${workflowStatus.detectedCharacters.length} characters detected`
        : characterCount === 0 ? 'Upload transcript to detect characters' : 'Character profiles and development',
      badge: workflowStatus?.detectedCharacters.length 
        ? workflowStatus.detectedCharacters.length.toString()
        : characterCount > 0 ? characterCount.toString() : null,
      color: 'text-green-500',
      isEmpty: (workflowStatus?.detectedCharacters.length || characterCount) === 0,
      workflowRelevance: workflowStatus && workflowStatus.currentPhase >= 2 ? ['phase-2', 'phase-3'] : []
    },
    {
      key: 'transcripts',
      label: 'Transcripts',
      icon: FileText,
      description: workflowStatus?.hasTranscriptAnalysis 
        ? 'Transcript analyzed - ready for Phase 1'
        : transcriptCount === 0 ? 'Upload transcript to detect characters' : 'Interview recordings and notes',
      badge: transcriptCount > 0 ? transcriptCount.toString() : null,
      color: workflowStatus?.hasTranscriptAnalysis ? 'text-purple-500' : 'text-orange-500',
      isEmpty: transcriptCount === 0,
      workflowRelevance: workflowStatus?.hasTranscriptAnalysis ? ['phase-1'] : [],
      hasAnalysis: workflowStatus?.hasTranscriptAnalysis
    },
    {
      key: 'workflows',
      label: 'Workflows',
      icon: Workflow,
      description: workflowStatus 
        ? `Phase ${workflowStatus.currentPhase}/4 - ${Math.round(workflowStatus.overallProgress)}% complete`
        : workflowCount === 0 ? 'Start 4-phase workflow' : '4-phase production system',
      badge: workflowStatus 
        ? `${workflowStatus.currentPhase}/4`
        : workflowCount > 0 ? workflowCount.toString() : null,
      color: workflowStatus && workflowStatus.overallProgress > 0 ? 'text-purple-500' : 'text-purple-500',
      isEmpty: !workflowStatus && workflowCount === 0,
      workflowRelevance: ['all'],
      progress: workflowStatus?.overallProgress,
      currentPhase: workflowStatus?.currentPhase
    },
    {
      key: 'guidelines',
      label: 'Guidelines',
      icon: Lightbulb,
      description: workflowStatus?.activeGuidelines 
        ? `${workflowStatus.activeGuidelines} active guidelines for Phase 4`
        : guidelineCount === 0 ? 'Upload guidelines to improve output quality' : 'Production guidelines and best practices',
      badge: workflowStatus?.activeGuidelines 
        ? workflowStatus.activeGuidelines.toString()
        : guidelineCount > 0 ? guidelineCount.toString() : null,
      color: workflowStatus?.activeGuidelines ? 'text-amber-500' : 'text-yellow-500',
      isEmpty: (workflowStatus?.activeGuidelines || guidelineCount) === 0,
      workflowRelevance: workflowStatus && workflowStatus.currentPhase >= 4 ? ['phase-4'] : [],
      isActive: workflowStatus?.activeGuidelines && workflowStatus.activeGuidelines > 0
    }
  ];

  const currentNavigationItems = getNavigationItems();

  // Workflow status indicator
  const getWorkflowStatusIcon = (phase: WorkflowPhase) => {
    switch (phase.status) {
      case 'completed':
        return <CheckCircleIcon className="size-3 text-green-500" />;
      case 'in_progress':
        return <Activity className="size-3 text-blue-500 animate-pulse" />;
      case 'needs_update':
        return <AlertCircle className="size-3 text-amber-500" />;
      default:
        return <Clock className="size-3 text-gray-400" />;
    }
  };

  return (
    <div className={cn('flex flex-col space-y-4', className)}>
      {/* Enhanced Story Intelligence Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="size-4 text-purple-500" />
          <span className="text-sm font-medium">Story Intelligence</span>
          {workflowStatus && (
            <Badge variant="outline" className="text-xs">
              <TrendingUp className="size-3 mr-1" />
              {Math.round(workflowStatus.overallProgress)}%
            </Badge>
          )}
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline" className="h-7">
              <Plus className="size-3 mr-1" />
              Create
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {quickActions.map((action) => (
              <DropdownMenuItem 
                key={action.label} 
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => handleQuickAction(action.action)}
              >
                <action.icon className="size-4" />
                <span>{action.label}</span>
                {action.action === 'continue-workflow' && workflowStatus && (
                  <Badge variant="secondary" className="text-xs ml-auto">
                    Phase {workflowStatus.currentPhase}
                  </Badge>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Workflow Progress Indicator */}
      {workflowStatus && (
        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex space-x-1">
                {workflowStatus.phases.map((phase) => (
                  <div key={phase.phase} className="flex items-center">
                    {getWorkflowStatusIcon(phase)}
                  </div>
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                {workflowStatus.projectTitle}
              </span>
            </div>
            {workflowStatus.lastActivity && (
              <span className="text-xs text-muted-foreground">
                {new Date(workflowStatus.lastActivity).toLocaleDateString()}
              </span>
            )}
          </div>
          <Progress value={workflowStatus.overallProgress} className="h-1" />
        </div>
      )}

      {/* Enhanced Navigation Items */}
      <div className="space-y-1">
        {currentNavigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.key;
          const isHovered = hoveredItem === item.key;
          const hasWorkflowRelevance = item.workflowRelevance && item.workflowRelevance.length > 0;
          
          return (
            <div
              key={item.key}
              className={cn(
                "w-full h-auto p-3 text-left border rounded-md transition-colors cursor-pointer relative",
                isActive && "bg-secondary border-border",
                !isActive && "hover:bg-muted border-transparent",
                item.isEmpty && !hasWorkflowRelevance && "opacity-60",
                hasWorkflowRelevance && "ring-1 ring-purple-200 dark:ring-purple-800"
              )}
              onClick={() => onSectionChange?.(item.key)}
              onMouseEnter={() => setHoveredItem(item.key)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              {/* Workflow relevance indicator */}
              {hasWorkflowRelevance && (
                <div className="absolute -top-1 -right-1 size-2 bg-purple-500 rounded-full" />
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Icon className={cn(
                    "w-4 h-4", 
                    isActive ? item.color : "text-muted-foreground",
                    item.isEmpty && !hasWorkflowRelevance && "opacity-50"
                  )} />
                  <div className="flex flex-col items-start">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-sm font-medium",
                        isActive ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {item.label}
                      </span>
                      {item.key === 'workflows' && item.progress !== undefined && (
                        <div className="w-12 h-1 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-purple-500 transition-all"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                    {(isActive || isHovered) && (
                      <span className={cn(
                        "text-xs mt-1",
                        item.isEmpty && !hasWorkflowRelevance ? "text-orange-500" : "text-muted-foreground"
                      )}>
                        {item.description}
                      </span>
                    )}
                    
                    {/* Upload CTA for empty states */}
                    {(isActive || isHovered) && item.isEmpty && (item.key === 'transcripts' || item.key === 'guidelines') && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-1 h-6 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (item.key === 'transcripts') {
                            handleQuickAction('upload-transcript');
                          } else if (item.key === 'guidelines') {
                            handleQuickAction('upload-guidelines');
                          }
                        }}
                      >
                        <Plus className="size-3 mr-1" />
                        Upload {item.key === 'transcripts' ? 'Transcript' : 'Guidelines'}
                      </Button>
                    )}

                    {/* Workflow continuation CTA */}
                    {(isActive || isHovered) && item.key === 'workflows' && workflowStatus && workflowStatus.overallProgress < 100 && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-1 h-6 text-xs bg-purple-50 border-purple-200 text-purple-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuickAction('continue-workflow');
                        }}
                      >
                        <Play className="size-3 mr-1" />
                        Continue Phase {workflowStatus.currentPhase}
                      </Button>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center">
                  {item.badge && (
                    <Badge 
                      variant={isActive ? "default" : "secondary"} 
                      className={cn(
                        "text-xs",
                        hasWorkflowRelevance && "bg-purple-100 text-purple-700 border-purple-200"
                      )}
                    >
                      {item.badge}
                    </Badge>
                  )}
                  {!item.badge && item.isEmpty && !hasWorkflowRelevance && (
                    <Badge 
                      variant="outline" 
                      className="text-xs border-orange-200 text-orange-600"
                    >
                      Empty
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Additional Actions */}
      <div className="pt-4 border-t border-border space-y-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start h-8"
        >
          <FolderOpen className="size-4 mr-2" />
          <span className="text-sm">Browse All Projects</span>
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start h-8"
        >
          <Settings className="size-4 mr-2" />
          <span className="text-sm">Story Settings</span>
        </Button>
      </div>

      {/* Upload Modals */}
      <Dialog open={activeModal === 'upload-transcript'} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload Transcript</DialogTitle>
          </DialogHeader>
          {projectId && (
            <TranscriptUpload
              projectId={projectId}
              onUploadComplete={handleUploadComplete}
              onCancel={() => setActiveModal(null)}
            />
          )}
          {!projectId && (
            <div className="text-center py-8 text-muted-foreground">
              <p>Please create or select a story project first to upload transcripts.</p>
              <Button className="mt-4" onClick={() => setActiveModal(null)}>
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={activeModal === 'upload-guidelines'} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload Production Guidelines</DialogTitle>
          </DialogHeader>
          <ProductionBibleManager
            projectId={projectId}
            onClose={() => setActiveModal(null)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}