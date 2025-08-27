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
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Phase1Suggestion {
  suggestion: string;
  isAccepted: boolean;
  isModified: boolean;
}

interface Phase1InterfaceProps {
  initialSummary?: string;
  onComplete: (summary: string) => void;
  onSave?: (summary: string) => void;
  className?: string;
}

export function Phase1Interface({ 
  initialSummary = '', 
  onComplete,
  onSave,
  className 
}: Phase1InterfaceProps) {
  const [userSummary, setUserSummary] = useState(initialSummary);
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateSuggestions = useCallback(async (action: 'improve' | 'expand' | 'alternatives' = 'improve') => {
    if (!userSummary.trim()) {
      setError('Please write something first before generating suggestions');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/four-phase/phase1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userSummary: userSummary.trim(),
          action
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate suggestions');
      }

      const data = await response.json();
      
      if (data.success && data.suggestions) {
        setSuggestions(data.suggestions);
        setShowSuggestions(true);
        setSelectedSuggestion(null);
      } else {
        throw new Error(data.error || 'Invalid response format');
      }
    } catch (error: any) {
      console.error('Generation error:', error);
      setError(error.message || 'Failed to generate suggestions. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [userSummary]);

  const handleSuggestionSelect = (suggestion: string) => {
    setSelectedSuggestion(suggestion);
  };

  const handleAcceptSuggestion = (suggestion: string) => {
    setUserSummary(suggestion);
    setShowSuggestions(false);
    setSelectedSuggestion(null);
    onSave?.(suggestion);
  };

  const handleModifySuggestion = (suggestion: string) => {
    setUserSummary(suggestion);
    setShowSuggestions(false);
    setSelectedSuggestion(null);
    // Focus will be on the textarea for user to edit
  };

  const handleUserTextChange = (value: string) => {
    setUserSummary(value);
    setShowSuggestions(false); // Hide suggestions when user types
    onSave?.(value);
  };

  const handleCompletePhase = () => {
    if (userSummary.trim()) {
      onComplete(userSummary.trim());
    }
  };

  const isComplete = userSummary.trim().length > 10; // Reasonable minimum length
  const hasContent = userSummary.trim().length > 0;

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
          <h2 className="text-2xl font-bold">Your Story Foundation</h2>
          <p className="text-muted-foreground">
            Write one powerful line that captures your entire narrative arc
          </p>
        </div>
      </div>

      {/* Main Writing Area */}
      <Card className="border-2 border-purple-200 dark:border-purple-800">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="story-summary" className="block text-sm font-medium mb-3">
                Your One-Line Story Summary
              </label>
              <div className="relative">
                <Textarea
                  id="story-summary"
                  value={userSummary}
                  onChange={(e) => handleUserTextChange(e.target.value)}
                  className={`min-h-[120px] text-lg leading-relaxed resize-y ${
                    userSummary.length === 0 ? 'is-floating-placeholder-empty' : ''
                  }`}
                  data-placeholder="Write a single sentence that captures your entire story..."
                  disabled={isGenerating}
                />
                
                <style jsx>{`
                  .is-floating-placeholder-empty::before {
                    content: attr(data-placeholder);
                    position: absolute;
                    left: 12px;
                    top: 12px;
                    color: hsl(var(--muted-foreground));
                    font-size: 1.125rem;
                    line-height: 1.75rem;
                    pointer-events: none;
                    user-select: none;
                    transition: opacity 0.3s ease;
                    opacity: 0.7;
                  }
                  
                  .is-floating-placeholder-empty:focus::before {
                    opacity: 0.4;
                  }
                  
                  .is-floating-placeholder-empty::placeholder {
                    opacity: 0;
                  }
                `}</style>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                {userSummary.length} characters | Make it compelling and complete
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Generate Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => generateSuggestions('improve')}
                disabled={!hasContent || isGenerating}
                variant="default"
                size="sm"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="size-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4 mr-2" />
                    Generate Improvements
                  </>
                )}
              </Button>

              <Button
                onClick={() => generateSuggestions('expand')}
                disabled={!hasContent || isGenerating}
                variant="outline"
                size="sm"
              >
                <Edit3 className="size-4 mr-2" />
                Expand
              </Button>

              <Button
                onClick={() => generateSuggestions('alternatives')}
                disabled={!hasContent || isGenerating}
                variant="outline"
                size="sm"
              >
                <Lightbulb className="size-4 mr-2" />
                Alternatives
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="size-5 text-blue-600" />
              Claude's Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {suggestions.map((suggestion, index) => (
              <Card 
                key={index}
                className={cn(
                  "cursor-pointer transition-all hover:shadow-sm",
                  selectedSuggestion === suggestion
                    ? "border-blue-300 bg-blue-100 dark:bg-blue-900/20"
                    : "border-gray-200 hover:border-gray-300"
                )}
                onClick={() => handleSuggestionSelect(suggestion)}
              >
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <p className="text-sm leading-relaxed">{suggestion}</p>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAcceptSuggestion(suggestion);
                        }}
                      >
                        <CheckCircle className="size-3 mr-1" />
                        Accept
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleModifySuggestion(suggestion);
                        }}
                      >
                        <Edit3 className="size-3 mr-1" />
                        Use as Base
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(suggestion);
                        }}
                      >
                        <Copy className="size-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
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
            <span>Write a compelling one-line summary to continue</span>
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