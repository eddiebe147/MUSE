'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  PenTool,
  Lightbulb, 
  Zap,
  Target,
  Timer,
  BarChart3,
  Brain,
  Sparkles,
  RefreshCw,
  X,
  PanelRightClose,
  PanelRight,
  TrendingUp,
  Wand2,
  Layers
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface WritingStats {
  wordCount: number;
  sessionWordCount: number;
  writingTime: number; // minutes
  wpm: number;
  dailyGoal?: number;
}

interface StreamlinedWritingToolsProps {
  writingStats: WritingStats;
  suggestions?: string[];
  isGenerating?: boolean;
  onGenerateSuggestions?: () => void;
  onApplySuggestion?: (suggestion: string) => void;
  onOpenArcGenerator?: () => void;
  className?: string;
}

export function StreamlinedWritingTools({
  writingStats,
  suggestions = [],
  isGenerating = false,
  onGenerateSuggestions,
  onApplySuggestion,
  onOpenArcGenerator,
  className
}: StreamlinedWritingToolsProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState<'stats' | 'ai' | null>('stats');
  const [isHydrated, setIsHydrated] = useState(false);

  // Load collapsed state from localStorage after hydration
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem('writing-tools-collapsed');
      if (savedState === 'true') {
        setIsCollapsed(true);
        setActiveSection(null);
      }
      setIsHydrated(true);
    }
  }, []);

  // Save collapsed state
  const toggleCollapsed = useCallback(() => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    if (isHydrated && typeof window !== 'undefined') {
      localStorage.setItem('writing-tools-collapsed', newState.toString());
    }
    
    if (newState) {
      setActiveSection(null);
    } else {
      setActiveSection('stats');
    }
  }, [isCollapsed, isHydrated]);

  // Format writing time
  const formatWritingTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  // Calculate progress to daily goal
  const goalProgress = writingStats.dailyGoal 
    ? Math.min((writingStats.sessionWordCount / writingStats.dailyGoal) * 100, 100)
    : 0;

  // Contextual AI suggestions based on writing activity
  const getContextualPrompt = () => {
    if (writingStats.wordCount === 0) return "Start writing to get personalized suggestions";
    if (writingStats.wordCount < 100) return "Keep writing to unlock AI insights";
    if (suggestions.length === 0) return "Generate suggestions to enhance your writing";
    return `${suggestions.length} suggestions available`;
  };

  // Collapsed state - minimal sidebar
  if (isCollapsed) {
    return (
      <div className="w-12 h-full bg-background border-l border-border flex flex-col items-center py-4 gap-4 transition-all duration-300 ease-in-out">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleCollapsed}
          className="size-8 p-0"
          title="Show Writing Tools"
        >
          <PanelRight className="size-4" />
        </Button>
        
        <div className="flex flex-col gap-3 items-center">
          {/* Quick word count */}
          <div className="text-center">
            <div className="text-xs font-medium">{writingStats.wordCount}</div>
            <div className="text-xs text-muted-foreground">words</div>
          </div>
          
          {/* AI indicator */}
          {suggestions.length > 0 && (
            <div className="size-2 bg-yellow-500 rounded-full animate-pulse" title={`${suggestions.length} suggestions`} />
          )}
        </div>
      </div>
    );
  }

  // Full sidebar - streamlined design
  return (
    <div className={cn("w-72 h-full bg-background border-l border-border transition-all duration-300 ease-in-out", className)}>
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PenTool className="size-4 text-orange-600" />
            <h2 className="font-semibold text-sm">Writing Tools</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleCollapsed}
            className="size-7 p-0"
            title="Hide Tools"
          >
            <PanelRightClose className="size-4" />
          </Button>
        </div>
      </div>

      {/* Quick Section Toggle */}
      <div className="border-b px-4 py-2">
        <div className="flex gap-1">
          <Button
            variant={activeSection === 'stats' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setActiveSection(activeSection === 'stats' ? null : 'stats')}
            className="h-6 px-2 text-xs"
          >
            <BarChart3 className="size-3 mr-1" />
            Stats
          </Button>
          <Button
            variant={activeSection === 'ai' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setActiveSection(activeSection === 'ai' ? null : 'ai')}
            className="h-6 px-2 text-xs"
          >
            <Brain className="size-3 mr-1" />
            AI
            {suggestions.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs h-4 px-1">
                {suggestions.length}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Writing Stats Section */}
        {activeSection === 'stats' && (
          <div className="p-4 space-y-3">
            {/* Main Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="p-3">
                <div className="text-center">
                  <div className="text-lg font-semibold">{writingStats.wordCount.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">Total Words</div>
                </div>
              </Card>
              
              <Card className="p-3">
                <div className="text-center">
                  <div className="text-lg font-semibold text-green-600">+{writingStats.sessionWordCount}</div>
                  <div className="text-xs text-muted-foreground">This Session</div>
                </div>
              </Card>
            </div>

            {/* Secondary Stats */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Timer className="size-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Writing Time</span>
                </div>
                <span className="font-medium">{formatWritingTime(writingStats.writingTime)}</span>
              </div>
              
              {writingStats.wpm > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="size-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Speed</span>
                  </div>
                  <span className="font-medium">{writingStats.wpm} WPM</span>
                </div>
              )}
            </div>

            {/* Daily Goal Progress */}
            {writingStats.dailyGoal && (
              <Card className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Target className="size-3 text-orange-600" />
                    <span className="text-sm font-medium">Daily Goal</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {Math.round(goalProgress)}%
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 mb-1">
                  <div 
                    className={cn(
                      "h-2 rounded-full transition-all duration-500",
                      goalProgress >= 100 ? "bg-green-500" : "bg-orange-600"
                    )}
                    style={{ width: `${Math.min(goalProgress, 100)}%` }}
                  />
                </div>
                <div className="text-xs text-muted-foreground">
                  {writingStats.sessionWordCount.toLocaleString()} / {writingStats.dailyGoal.toLocaleString()} words
                </div>
              </Card>
            )}

            
            {/* Quick Actions */}
            <div className="space-y-2 pt-2 border-t">
              <div className="text-xs font-medium text-muted-foreground mb-2">Quick Actions</div>
              <div className="grid grid-cols-2 gap-2">
                <Button size="sm" variant="outline" className="h-8 text-xs">
                  <Target className="size-3 mr-1" />
                  Set Goal
                </Button>
                <Button size="sm" variant="outline" className="h-8 text-xs">
                  <BarChart3 className="size-3 mr-1" />
                  Export
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* AI Assistant Section */}
        {activeSection === 'ai' && (
          <div className="p-4 space-y-3">
            {/* Context-aware prompt */}
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Sparkles className="size-4 text-orange-600" />
                <span className="text-sm font-medium">AI Assistant</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {getContextualPrompt()}
              </p>
            </div>

            {/* Generate Button */}
            <Button
              onClick={onGenerateSuggestions}
              disabled={isGenerating || writingStats.wordCount < 50}
              className="w-full h-10"
              size="sm"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="size-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Zap className="size-4 mr-2" />
                  Generate Suggestions
                </>
              )}
            </Button>

            {/* Suggestions List */}
            {suggestions.length > 0 && (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                <div className="text-xs font-medium text-muted-foreground">
                  Suggestions ({suggestions.length})
                </div>
                {suggestions.map((suggestion, index) => (
                  <Card 
                    key={index}
                    className="p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => onApplySuggestion?.(suggestion)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm leading-relaxed flex-1">{suggestion}</p>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="size-6 p-0 opacity-0 group-hover:opacity-100"
                      >
                        <Zap className="size-3" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* AI Tools */}
            <div className="space-y-2 pt-2 border-t">
              <div className="text-xs font-medium text-muted-foreground mb-2">AI Tools</div>
              <div className="space-y-1">
                <Button size="sm" variant="outline" className="w-full justify-start h-8 text-xs">
                  <Lightbulb className="size-3 mr-2" />
                  Improve Clarity
                </Button>
                <Button size="sm" variant="outline" className="w-full justify-start h-8 text-xs">
                  <Sparkles className="size-3 mr-2" />
                  Enhance Style
                </Button>
                <Button size="sm" variant="outline" className="w-full justify-start h-8 text-xs">
                  <Target className="size-3 mr-2" />
                  Fix Grammar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Minimal State - Show brief stats */}
        {!activeSection && (
          <div className="p-4">
            <div className="text-center">
              <div className="text-2xl font-semibold mb-1">{writingStats.wordCount.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground mb-3">words written</div>
              
              {writingStats.sessionWordCount > 0 && (
                <div className="flex items-center justify-center gap-2 text-sm">
                  <span className="text-green-600 font-medium">+{writingStats.sessionWordCount}</span>
                  <span className="text-muted-foreground">today</span>
                </div>
              )}
              
              {suggestions.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setActiveSection('ai')}
                  className="mt-3 w-full h-8"
                >
                  <Lightbulb className="size-3 mr-2" />
                  {suggestions.length} AI suggestions
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}