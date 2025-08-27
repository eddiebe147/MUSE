'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowRight, 
  CheckCircle2,
  ChevronRight,
  RotateCcw,
  Sparkles,
  FileText,
  Edit3,
  Download,
  Brain,
  Zap,
  EyeIcon,
  Users
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PhaseData {
  phase: number;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  isCompleted: boolean;
  content?: any;
  summary?: string;
}

interface PhaseTransitionProps {
  phases: PhaseData[];
  currentPhase: number;
  onPhaseTransition: (fromPhase: number, toPhase: number) => void;
  onEditPhase: (phase: number) => void;
  className?: string;
}

interface ContentPreviewProps {
  phase: PhaseData;
  isExpanded: boolean;
  onToggle: () => void;
}

const ContentPreview: React.FC<ContentPreviewProps> = ({ phase, isExpanded, onToggle }) => {
  const getPreviewContent = () => {
    if (!phase.content) return null;
    
    switch (phase.phase) {
      case 0:
        return phase.summary || 'Brainstorm discussion completed';
      case 1:
        return typeof phase.content === 'string' ? phase.content : phase.content.summary;
      case 2:
        return Array.isArray(phase.content) ? 
          `${phase.content.length} scenes: ${phase.content[0]?.substring(0, 80)}...` : 
          'Scene breakdown complete';
      case 3:
        return typeof phase.content === 'object' ? 
          `Detailed beats for ${Object.keys(phase.content).length} scenes` :
          'Scene beats complete';
      case 4:
        return phase.content.content ? 
          `${phase.content.format} format ready (${phase.content.metadata?.wordCount || 'Unknown'} words)` :
          'Final script complete';
      default:
        return 'Phase completed';
    }
  };

  const previewContent = getPreviewContent();
  if (!previewContent) return null;

  return (
    <div className="mt-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggle}
        className="h-auto p-2 text-left justify-start hover:bg-opacity-50"
      >
        <EyeIcon className="size-3 mr-2 opacity-60" />
        <span className="text-xs text-muted-foreground truncate">
          {isExpanded ? 'Hide preview' : 'Show preview'}
        </span>
      </Button>
      
      {isExpanded && (
        <div className="mt-2 p-3 rounded-md bg-gray-50 dark:bg-gray-900/50 border">
          <div className="text-xs text-muted-foreground leading-relaxed">
            {previewContent}
          </div>
        </div>
      )}
    </div>
  );
};

export function PhaseTransitions({ 
  phases, 
  currentPhase, 
  onPhaseTransition, 
  onEditPhase,
  className 
}: PhaseTransitionProps) {
  const [expandedPreviews, setExpandedPreviews] = useState<Set<number>>(new Set());
  
  const togglePreview = (phaseNum: number) => {
    const newExpanded = new Set(expandedPreviews);
    if (newExpanded.has(phaseNum)) {
      newExpanded.delete(phaseNum);
    } else {
      newExpanded.add(phaseNum);
    }
    setExpandedPreviews(newExpanded);
  };

  const completedPhases = phases.filter(p => p.isCompleted).length;
  const progressPercentage = (completedPhases / phases.length) * 100;

  const getPhaseRelation = (phaseNum: number) => {
    if (phaseNum < currentPhase) return 'completed';
    if (phaseNum === currentPhase) return 'current';
    return 'upcoming';
  };

  const getConnectionStyle = (phaseNum: number) => {
    const relation = getPhaseRelation(phaseNum);
    if (relation === 'completed') return 'bg-green-400';
    if (relation === 'current') return 'bg-blue-400';
    return 'bg-gray-300 dark:bg-gray-600';
  };

  const handleContinueToNext = () => {
    const nextPhase = currentPhase + 1;
    if (nextPhase < phases.length) {
      onPhaseTransition(currentPhase, nextPhase);
    }
  };

  const canContinue = currentPhase < phases.length - 1 && phases[currentPhase]?.isCompleted;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Overall Progress Header */}
      <Card className="border-2 border-purple-200 dark:border-purple-800">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                <Sparkles className="size-5 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Story Development Progress</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Building your story through connected phases
                </p>
              </div>
            </div>
            <Badge variant="outline" className="text-sm">
              {completedPhases} of {phases.length} complete
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Progress value={progressPercentage} className="flex-1" />
            <span className="text-sm text-muted-foreground">
              {Math.round(progressPercentage)}%
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Phase Flow Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="size-5" />
            Creative Collaboration Flow
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Each phase builds naturally on your previous work
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {phases.map((phase, index) => (
              <div key={phase.phase} className="relative">
                {/* Connection Line */}
                {index < phases.length - 1 && (
                  <div className="absolute left-6 top-12 w-0.5 h-8 bg-gray-200 dark:bg-gray-700">
                    <div 
                      className={cn(
                        "w-full transition-all duration-500",
                        getConnectionStyle(phase.phase)
                      )}
                      style={{ 
                        height: phase.isCompleted ? '100%' : '0%',
                        transition: 'height 0.5s ease-in-out'
                      }}
                    />
                  </div>
                )}
                
                {/* Phase Card */}
                <div className={cn(
                  "flex items-start gap-4 p-4 rounded-lg border transition-all duration-200",
                  phase.phase === currentPhase && "border-blue-300 bg-blue-50 dark:bg-blue-900/10",
                  phase.isCompleted && phase.phase !== currentPhase && "border-green-300 bg-green-50 dark:bg-green-900/10",
                  !phase.isCompleted && phase.phase !== currentPhase && "border-gray-200 bg-gray-50 dark:bg-gray-900/20 opacity-75"
                )}>
                  {/* Phase Icon & Status */}
                  <div className="flex flex-col items-center gap-2">
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200",
                      phase.phase === currentPhase && "bg-blue-500 text-white shadow-lg",
                      phase.isCompleted && phase.phase !== currentPhase && "bg-green-500 text-white",
                      !phase.isCompleted && phase.phase !== currentPhase && "bg-gray-200 text-gray-500"
                    )}>
                      {phase.isCompleted ? (
                        <CheckCircle2 className="size-6" />
                      ) : (
                        phase.icon
                      )}
                    </div>
                    
                    {phase.phase === currentPhase && (
                      <div className="flex items-center gap-1">
                        <Zap className="size-3 text-blue-500" />
                        <span className="text-xs text-blue-600 font-medium">Active</span>
                      </div>
                    )}
                  </div>

                  {/* Phase Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-base">
                          Phase {phase.phase}: {phase.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {phase.subtitle}
                        </p>
                      </div>
                      
                      {/* Phase Actions */}
                      <div className="flex items-center gap-2">
                        {phase.isCompleted && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEditPhase(phase.phase)}
                            className="size-8 p-0"
                          >
                            <RotateCcw className="size-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Build Relationship Indicator */}
                    {phase.phase > 0 && (
                      <div className="mb-3 p-2 rounded bg-white dark:bg-gray-800 border border-dashed border-gray-300">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <ArrowRight className="size-3" />
                          <span>
                            {phase.phase === 1 && "Builds from brainstorm insights"}
                            {phase.phase === 2 && "Expands the one-line story into scenes"}
                            {phase.phase === 3 && "Details each scene with specific beats"}
                            {phase.phase === 4 && "Formats scene beats into professional script"}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Content Preview */}
                    {phase.isCompleted && (
                      <ContentPreview
                        phase={phase}
                        isExpanded={expandedPreviews.has(phase.phase)}
                        onToggle={() => togglePreview(phase.phase)}
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Continue Button */}
          {canContinue && (
            <div className="mt-6 pt-4 border-t">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Phase {currentPhase} complete. Ready to continue building your story.
                </div>
                <Button 
                  onClick={handleContinueToNext}
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Continue to Phase {currentPhase + 1}
                  <ChevronRight className="size-4 ml-2" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}