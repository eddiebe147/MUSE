'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowDown, 
  Sparkles,
  FileText,
  Edit3,
  Download,
  Brain,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Layers
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PhaseContent {
  phase: number;
  title: string;
  content: any;
  summary: string;
  isCompleted: boolean;
}

interface ContentInheritanceProps {
  currentPhase: number;
  phaseContents: PhaseContent[];
  onRefreshFromPrevious?: (phase: number) => void;
  isExpanded?: boolean;
  onToggleExpanded?: () => void;
  className?: string;
}

const PhaseContentCard: React.FC<{
  phaseContent: PhaseContent;
  isActive: boolean;
  onRefreshFromPrevious?: (phase: number) => void;
}> = ({ phaseContent, isActive, onRefreshFromPrevious }) => {
  const getIcon = (phase: number) => {
    switch (phase) {
      case 0: return <Brain className="size-4" />;
      case 1: return <Sparkles className="size-4" />;
      case 2: return <FileText className="size-4" />;
      case 3: return <Edit3 className="size-4" />;
      case 4: return <Download className="size-4" />;
      default: return <FileText className="size-4" />;
    }
  };

  const getColor = (phase: number) => {
    const colors = [
      "text-indigo-600 bg-indigo-50 border-indigo-200",
      "text-purple-600 bg-purple-50 border-purple-200",
      "text-blue-600 bg-blue-50 border-blue-200", 
      "text-green-600 bg-green-50 border-green-200",
      "text-orange-600 bg-orange-50 border-orange-200"
    ];
    return colors[phase] || "text-gray-600 bg-gray-50 border-gray-200";
  };

  return (
    <div className={cn(
      "relative border rounded-lg transition-all duration-200",
      isActive ? "border-blue-300 bg-blue-50 dark:bg-blue-900/10 shadow-sm" : getColor(phaseContent.phase),
      !phaseContent.isCompleted && "opacity-60"
    )}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center",
              isActive ? "bg-blue-500 text-white" : phaseContent.isCompleted ? "bg-green-500 text-white" : "bg-gray-300 text-gray-600"
            )}>
              {getIcon(phaseContent.phase)}
            </div>
            <div>
              <h4 className="font-medium text-sm">
                Phase {phaseContent.phase}: {phaseContent.title}
              </h4>
            </div>
          </div>
          
          {phaseContent.isCompleted && onRefreshFromPrevious && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRefreshFromPrevious(phaseContent.phase)}
              className="size-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Refresh from previous phase"
            >
              <RefreshCw className="size-3" />
            </Button>
          )}
        </div>
        
        <div className="text-xs text-muted-foreground leading-relaxed">
          {phaseContent.summary || (phaseContent.isCompleted ? "Phase completed" : "Ready to start")}
        </div>
      </div>
      
      {/* Connection Arrow */}
      {phaseContent.phase < 4 && (
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
          <div className={cn(
            "w-4 h-4 rounded-full flex items-center justify-center border-2 bg-white",
            isActive ? "border-blue-300 text-blue-600" : "border-gray-300 text-gray-400"
          )}>
            <ArrowDown className="size-2" />
          </div>
        </div>
      )}
    </div>
  );
};

export function ContentInheritance({ 
  currentPhase, 
  phaseContents, 
  onRefreshFromPrevious,
  isExpanded = false,
  onToggleExpanded,
  className 
}: ContentInheritanceProps) {
  const completedContents = phaseContents.filter(p => p.isCompleted);
  
  if (completedContents.length === 0) {
    return null;
  }

  return (
    <Card className={cn("border-2 border-purple-200 dark:border-purple-800", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="size-5 text-purple-600" />
            <CardTitle className="text-lg">Story Building Blocks</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {completedContents.length} phase{completedContents.length !== 1 ? 's' : ''} complete
            </Badge>
            {onToggleExpanded && (
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
        </div>
        <p className="text-sm text-muted-foreground">
          See how each phase builds naturally on your previous work
        </p>
      </CardHeader>
      
      <CardContent className={cn(
        "space-y-4 transition-all duration-300",
        !isExpanded && completedContents.length > 2 && "max-h-40 overflow-hidden"
      )}>
        {phaseContents.map((phaseContent) => {
          // Only show completed phases and the current phase
          if (!phaseContent.isCompleted && phaseContent.phase !== currentPhase) {
            return null;
          }
          
          return (
            <div key={phaseContent.phase} className="group">
              <PhaseContentCard
                phaseContent={phaseContent}
                isActive={phaseContent.phase === currentPhase}
                onRefreshFromPrevious={onRefreshFromPrevious}
              />
              
              {/* Phase Relationship Description */}
              {phaseContent.phase < 4 && phaseContent.isCompleted && (
                <div className="mt-2 mb-4 px-4 py-2 rounded-md bg-gray-50 dark:bg-gray-900/20 border border-dashed">
                  <div className="text-xs text-muted-foreground text-center">
                    {phaseContent.phase === 0 && "⬇ Insights inform story foundation"}
                    {phaseContent.phase === 1 && "⬇ One-line expands into scene structure"}
                    {phaseContent.phase === 2 && "⬇ Scenes develop detailed beats"}
                    {phaseContent.phase === 3 && "⬇ Beats format into final script"}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        
        {!isExpanded && completedContents.length > 2 && onToggleExpanded && (
          <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-white dark:from-gray-950 to-transparent flex items-end justify-center pb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleExpanded}
              className="bg-white dark:bg-gray-950 border-2"
            >
              Show all {completedContents.length} phases
              <ChevronDown className="size-4 ml-1" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}