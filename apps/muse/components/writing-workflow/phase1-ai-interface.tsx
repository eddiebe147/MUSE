'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Sparkles, 
  ArrowRight, 
  RefreshCw, 
  CheckCircle, 
  Edit3,
  Lightbulb,
  Copy,
  ChevronRight,
  Wand2,
  ThumbsUp,
  ThumbsDown,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Phase1AIInterfaceProps {
  brainstormContext?: string;
  transcriptData?: any;
  knowledgeBase?: any;
  onComplete: (summary: string) => void;
  onSave?: (summary: string) => void;
  className?: string;
}

interface GeneratedOption {
  content: string;
  isSelected: boolean;
  rating?: 'like' | 'dislike' | null;
}

export function Phase1AIInterface({ 
  brainstormContext,
  transcriptData,
  knowledgeBase,
  onComplete,
  onSave,
  className 
}: Phase1AIInterfaceProps) {
  const [currentSummary, setCurrentSummary] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedOptions, setGeneratedOptions] = useState<GeneratedOption[]>([]);
  const [recommendation, setRecommendation] = useState('');
  const [hasGenerated, setHasGenerated] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [specificRequirements, setSpecificRequirements] = useState('');
  const [error, setError] = useState<string | null>(null);

  const generateOneLine = useCallback(async (regenerate = false) => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/four-phase/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phase: 1,
          brainstormContext,
          transcriptData,
          knowledgeBase,
          regenerate,
          specificRequirements: specificRequirements.trim() || undefined
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate one-line summary');
      }

      const data = await response.json();
      
      if (data.success && data.generated) {
        const options = data.generated.options || [];
        setGeneratedOptions(options.map((opt: string) => ({
          content: opt,
          isSelected: false,
          rating: null
        })));
        setRecommendation(data.generated.recommendation || '');
        setHasGenerated(true);
        
        // Auto-select the first option as current
        if (options.length > 0 && !currentSummary) {
          setCurrentSummary(options[0]);
        }
      } else {
        throw new Error(data.error || 'Invalid response format');
      }
    } catch (error: any) {
      console.error('Generation error:', error);
      setError(error.message || 'Failed to generate one-line summary. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [brainstormContext, transcriptData, knowledgeBase, specificRequirements, currentSummary]);

  const selectOption = (option: GeneratedOption) => {
    setCurrentSummary(option.content);
    setGeneratedOptions(prev => prev.map(opt => ({
      ...opt,
      isSelected: opt.content === option.content
    })));
    setEditMode(false);
    onSave?.(option.content);
  };

  const rateOption = (index: number, rating: 'like' | 'dislike') => {
    setGeneratedOptions(prev => prev.map((opt, i) => 
      i === index ? { ...opt, rating: opt.rating === rating ? null : rating } : opt
    ));
  };

  const handleEditedSave = () => {
    setEditMode(false);
    onSave?.(currentSummary);
  };

  const handleCompletePhase = () => {
    if (currentSummary.trim()) {
      onComplete(currentSummary.trim());
    }
  };

  const isComplete = currentSummary.trim().length > 10;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Phase Header */}
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center gap-3">
          <Badge variant="secondary" className="px-4 py-2">
            <Sparkles className="size-4 mr-2" />
            Phase 1: One Line Summary
          </Badge>
        </div>
        <div className="space-y-1">
          <h2 className="text-2xl font-bold">AI-Generated Story Foundation</h2>
          <p className="text-muted-foreground">
            Claude will generate complete one-line summaries based on your brainstorming session
          </p>
        </div>
      </div>

      {/* Generation Controls */}
      <Card className="border-2 border-orange-200 dark:border-orange-800">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Wand2 className="size-5 text-orange-600" />
            AI Generation Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Optional Requirements */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Specific Requirements (Optional)
            </label>
            <Textarea
              value={specificRequirements}
              onChange={(e) => setSpecificRequirements(e.target.value)}
              placeholder="e.g., 'Make it a thriller', 'Focus on the mother-daughter relationship', 'Set in the 1980s'..."
              className="min-h-[80px] text-sm"
              disabled={isGenerating}
            />
          </div>

          {/* Generate Button */}
          <div className="flex gap-2">
            <Button
              onClick={() => generateOneLine(false)}
              disabled={isGenerating}
              size="lg"
              className="flex-1"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="size-4 mr-2 animate-spin" />
                  Generating with AI...
                </>
              ) : (
                <>
                  <Wand2 className="size-4 mr-2" />
                  {hasGenerated ? 'Regenerate Options' : 'Generate One-Line Summaries'}
                </>
              )}
            </Button>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="size-4 text-red-600 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generated Options */}
      {hasGenerated && generatedOptions.length > 0 && (
        <Card className="border-2 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="size-5 text-blue-600" />
              AI-Generated Options
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {generatedOptions.map((option, index) => (
              <Card 
                key={index}
                className={cn(
                  "cursor-pointer transition-all hover:shadow-sm",
                  option.isSelected
                    ? "border-orange-300 bg-orange-50 dark:bg-orange-900/20"
                    : "hover:border-gray-300"
                )}
              >
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm leading-relaxed flex-1">{option.content}</p>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant={option.rating === 'like' ? 'default' : 'ghost'}
                          onClick={(e) => {
                            e.stopPropagation();
                            rateOption(index, 'like');
                          }}
                          className="size-7 p-0"
                        >
                          <ThumbsUp className="size-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant={option.rating === 'dislike' ? 'destructive' : 'ghost'}
                          onClick={(e) => {
                            e.stopPropagation();
                            rateOption(index, 'dislike');
                          }}
                          className="size-7 p-0"
                        >
                          <ThumbsDown className="size-3" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          selectOption(option);
                        }}
                        variant={option.isSelected ? "default" : "outline"}
                      >
                        {option.isSelected ? (
                          <>
                            <CheckCircle className="size-3 mr-1" />
                            Selected
                          </>
                        ) : (
                          <>
                            <CheckCircle className="size-3 mr-1" />
                            Select This
                          </>
                        )}
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(option.content);
                        }}
                      >
                        <Copy className="size-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* AI Recommendation */}
            {recommendation && (
              <Card className="bg-gradient-to-r from-orange-50 to-blue-50 dark:from-orange-900/20 dark:to-blue-900/20 border-orange-200">
                <CardContent className="p-4">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="size-5 text-orange-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium mb-1">Claude's Recommendation</p>
                      <p className="text-sm text-muted-foreground">{recommendation}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      )}

      {/* Current Selection & Edit */}
      {currentSummary && (
        <Card className="border-2 border-green-200 dark:border-green-800">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Your Working One-Line</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditMode(!editMode)}
              >
                <Edit3 className="size-4 mr-1" />
                {editMode ? 'Save Edit' : 'Edit'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {editMode ? (
              <div className="space-y-3">
                <Textarea
                  value={currentSummary}
                  onChange={(e) => setCurrentSummary(e.target.value)}
                  className="min-h-[100px] text-lg"
                />
                <div className="flex gap-2">
                  <Button onClick={handleEditedSave} size="sm">
                    Save Changes
                  </Button>
                  <Button 
                    onClick={() => setEditMode(false)} 
                    size="sm"
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-lg leading-relaxed">{currentSummary}</p>
                <div className="text-sm text-muted-foreground">
                  {currentSummary.length} characters
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Phase Completion */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          {isComplete ? (
            <span className="flex items-center gap-2 text-green-600">
              <CheckCircle className="size-4" />
              Ready for Phase 2
            </span>
          ) : (
            <span>Generate and select a one-line summary to continue</span>
          )}
        </div>

        <Button
          onClick={handleCompletePhase}
          disabled={!isComplete}
          size="lg"
          className="px-6"
        >
          Continue to Phase 2
          <ChevronRight className="size-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}