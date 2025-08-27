'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight, 
  ChevronDown,
  ChevronUp,
  Layers,
  Brain,
  Sparkles,
  FileText,
  Edit3
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PhaseContextPreviewProps {
  currentPhase: number;
  brainstormSummary?: string;
  phase1Summary?: string;
  phase2Scenes?: string[];
  phase3Breakdowns?: any;
  isExpanded?: boolean;
  onToggleExpanded?: () => void;
  className?: string;
}

export function PhaseContextPreview({ 
  currentPhase, 
  brainstormSummary,
  phase1Summary,
  phase2Scenes,
  phase3Breakdowns,
  isExpanded = false,
  onToggleExpanded,
  className 
}: PhaseContextPreviewProps) {
  const getContextData = () => {
    const contexts = [];

    // Add previous phases as context
    if (currentPhase > 0 && brainstormSummary) {
      contexts.push({
        phase: 0,
        title: 'Brainstorm Insights',
        icon: <Brain className="size-4" />,
        content: brainstormSummary,
        color: 'text-indigo-600 bg-indigo-50 border-indigo-200'
      });
    }

    if (currentPhase > 1 && phase1Summary) {
      contexts.push({
        phase: 1,
        title: 'Story Foundation',
        icon: <Sparkles className="size-4" />,
        content: phase1Summary,
        color: 'text-purple-600 bg-purple-50 border-purple-200'
      });
    }

    if (currentPhase > 2 && phase2Scenes && phase2Scenes.length > 0) {
      contexts.push({
        phase: 2,
        title: 'Scene Structure',
        icon: <FileText className="size-4" />,
        content: `${phase2Scenes.length} scenes: ${phase2Scenes[0]?.substring(0, 80)}${phase2Scenes.length > 1 ? '...' : ''}`,
        color: 'text-blue-600 bg-blue-50 border-blue-200'
      });
    }

    if (currentPhase > 3 && phase3Breakdowns) {
      const sceneCount = Object.keys(phase3Breakdowns).length;
      contexts.push({
        phase: 3,
        title: 'Scene Beats',
        icon: <Edit3 className="size-4" />,
        content: `Detailed beats for ${sceneCount} scene${sceneCount !== 1 ? 's' : ''}`,
        color: 'text-green-600 bg-green-50 border-green-200'
      });
    }

    return contexts;
  };

  const contexts = getContextData();

  if (contexts.length === 0) {
    return null;
  }

  const getBuildDescription = (currentPhase: number) => {
    switch (currentPhase) {
      case 1: return 'Using brainstorm insights to create your story foundation';
      case 2: return 'Expanding your one-line story into essential scenes';
      case 3: return 'Developing each scene into detailed beats and moments';
      case 4: return 'Formatting your scene beats into professional script';
      default: return 'Building on your previous work';
    }
  };

  return (
    <Card className={cn("border-2 border-gray-200 dark:border-gray-700 mb-4", className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Layers className="size-5 text-gray-600" />
            <div>
              <h4 className="font-medium text-sm">Building From Previous Work</h4>
              <p className="text-xs text-muted-foreground">
                {getBuildDescription(currentPhase)}
              </p>
            </div>
          </div>
          
          {contexts.length > 1 && onToggleExpanded && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleExpanded}
              className="size-8 p-0"
            >
              {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </Button>
          )}
        </div>

        {/* Context Flow */}
        <div className="space-y-3">
          {contexts.map((context, index) => (
            <div key={context.phase}>
              {/* Context Card */}
              <div className={cn(
                "flex items-start gap-3 p-3 rounded-lg border transition-all",
                context.color
              )}>
                <div className="size-8 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center border-2 border-current">
                  {context.icon}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary" className="text-xs">
                      Phase {context.phase}
                    </Badge>
                    <span className="font-medium text-sm">{context.title}</span>
                  </div>
                  
                  <div className={cn(
                    "text-xs text-muted-foreground transition-all duration-200",
                    !isExpanded && contexts.length > 1 && index > 0 && "truncate",
                    isExpanded && "leading-relaxed"
                  )}>
                    {context.content}
                  </div>
                </div>
              </div>

              {/* Arrow connector */}
              {index < contexts.length - 1 && (
                <div className="flex items-center justify-center my-2">
                  <ArrowRight className="size-4 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}

          {/* Final arrow to current phase */}
          <div className="flex items-center justify-center mt-4 pt-3 border-t border-dashed">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ArrowRight className="size-4" />
              <span className="font-medium">Now creating Phase {currentPhase}</span>
            </div>
          </div>
        </div>

        {/* Collapsed view hint */}
        {!isExpanded && contexts.length > 1 && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleExpanded}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                View all {contexts.length} building blocks
                <ChevronDown className="size-3 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}