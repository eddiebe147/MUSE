'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { 
  Sparkles,
  ThumbsUp,
  Edit3,
  Save,
  X,
  Lightbulb,
  Target,
  Heart,
  Zap,
  RefreshCw
} from 'lucide-react';

interface StorySummary {
  version: string;
  summary: string;
  genre_focus: string;
  emotional_core: string;
  hook_strength: number;
  reasoning: string;
}

interface SummaryOptions {
  summaries: StorySummary[];
  recommendation: {
    preferred_version: string;
    rationale: string;
  };
}

interface StorySummaryGeneratorProps {
  transcriptId: string;
  transcriptTitle: string;
  onSummarySelected: (summary: string, version: string, metadata: any) => void;
  onCancel: () => void;
}

export function StorySummaryGenerator({ 
  transcriptId, 
  transcriptTitle, 
  onSummarySelected, 
  onCancel 
}: StorySummaryGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [summaryOptions, setSummaryOptions] = useState<SummaryOptions | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [customSummary, setCustomSummary] = useState('');
  const [customGenre, setCustomGenre] = useState('');
  const [customEmotionalCore, setCustomEmotionalCore] = useState('');

  const generateSummaries = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch(`/api/transcripts/${transcriptId}/generate-summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to generate summaries');
      }

      const data = await response.json();
      setSummaryOptions(data.summary_options);
      
      // Auto-select the recommended version
      setSelectedVersion(data.summary_options.recommendation.preferred_version);
      toast.success('Story summaries generated successfully!');
    } catch (error) {
      console.error('Error generating summaries:', error);
      toast.error('Failed to generate story summaries');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleVersionSelect = (version: string) => {
    setSelectedVersion(version);
    setIsEditing(false);
  };

  const handleEditMode = () => {
    if (!selectedVersion || !summaryOptions) return;
    
    const selectedSummary = summaryOptions.summaries.find(s => s.version === selectedVersion);
    if (selectedSummary) {
      setCustomSummary(selectedSummary.summary);
      setCustomGenre(selectedSummary.genre_focus);
      setCustomEmotionalCore(selectedSummary.emotional_core);
      setIsEditing(true);
    }
  };

  const handleSaveCustom = async () => {
    if (!customSummary.trim()) {
      toast.error('Please enter a story summary');
      return;
    }

    const customMetadata = {
      version: 'Custom',
      genre_focus: customGenre || 'Drama',
      emotional_core: customEmotionalCore || 'Character transformation',
      hook_strength: 8,
      reasoning: 'Custom summary created by user',
      is_custom: true
    };

    try {
      // Save to database
      const response = await fetch(`/api/transcripts/${transcriptId}/save-summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          summary: customSummary.trim(),
          version: 'Custom',
          metadata: customMetadata
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save story summary');
      }

      toast.success('Story DNA saved successfully!');
      onSummarySelected(customSummary.trim(), 'Custom', customMetadata);
    } catch (error) {
      console.error('Error saving summary:', error);
      toast.error('Failed to save story summary');
    }
  };

  const handleSelectSummary = async () => {
    if (!selectedVersion || !summaryOptions) return;
    
    const selectedSummary = summaryOptions.summaries.find(s => s.version === selectedVersion);
    if (selectedSummary) {
      try {
        // Save to database
        const response = await fetch(`/api/transcripts/${transcriptId}/save-summary`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            summary: selectedSummary.summary,
            version: selectedVersion,
            metadata: {
              genre_focus: selectedSummary.genre_focus,
              emotional_core: selectedSummary.emotional_core,
              hook_strength: selectedSummary.hook_strength,
              reasoning: selectedSummary.reasoning,
              is_custom: false
            }
          })
        });

        if (!response.ok) {
          throw new Error('Failed to save story summary');
        }

        toast.success('Story DNA saved successfully!');
        onSummarySelected(selectedSummary.summary, selectedVersion, selectedSummary);
      } catch (error) {
        console.error('Error saving summary:', error);
        toast.error('Failed to save story summary');
      }
    }
  };

  const getHookStrengthColor = (strength: number) => {
    if (strength >= 8) return 'text-green-600 dark:text-green-400';
    if (strength >= 6) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getHookStrengthIcon = (strength: number) => {
    if (strength >= 8) return <Zap className="size-3" />;
    if (strength >= 6) return <Target className="size-3" />;
    return <Heart className="size-3" />;
  };

  // Initial state - generate summaries
  if (!summaryOptions && !isGenerating) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-2 text-purple-600 dark:text-purple-400">
            <Sparkles className="size-6" />
            <h2 className="text-xl font-semibold">Story DNA Generator</h2>
          </div>
          <p className="text-muted-foreground max-w-2xl">
            Transform your transcript insights into compelling one-line story summaries. 
            This becomes the foundational DNA that drives all subsequent story development.
          </p>
        </div>

        {/* Transcript Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Source Transcript</CardTitle>
            <CardDescription>"{transcriptTitle}"</CardDescription>
          </CardHeader>
        </Card>

        {/* Generate Button */}
        <div className="text-center">
          <Button 
            onClick={generateSummaries}
            size="lg"
            className="flex items-center gap-2"
          >
            <Sparkles className="size-4" />
            Generate Story Summaries
          </Button>
          <p className="text-sm text-muted-foreground mt-2">
            AI will analyze your story moments to create 5 unique approaches
          </p>
        </div>

        {/* Cancel */}
        <div className="text-center">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  // Loading state
  if (isGenerating) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 text-purple-600 dark:text-purple-400 mb-3">
            <RefreshCw className="size-6 animate-spin" />
            <h2 className="text-xl font-semibold">Generating Story DNA...</h2>
          </div>
          <p className="text-muted-foreground">
            Analyzing story moments and creating compelling narrative summaries
          </p>
        </div>

        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                  <Skeleton className="h-6 w-full" />
                  <div className="flex gap-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Summary options display
  if (summaryOptions && !isEditing) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-purple-600 dark:text-purple-400">
            <Sparkles className="size-5" />
            <h2 className="text-lg font-semibold">Choose Your Story DNA</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Select the one-line summary that will drive your entire story development
          </p>
        </div>

        {/* Recommendation */}
        <Card className="border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <ThumbsUp className="size-4 text-purple-600 dark:text-purple-400" />
              <CardTitle className="text-sm">AI Recommendation</CardTitle>
            </div>
            <CardDescription className="text-purple-700 dark:text-purple-300">
              Version {summaryOptions.recommendation.preferred_version} is recommended
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-purple-800 dark:text-purple-200">
              {summaryOptions.recommendation.rationale}
            </p>
          </CardContent>
        </Card>

        {/* Summary Options */}
        <div className="space-y-3">
          {summaryOptions.summaries.map((summary) => (
            <Card 
              key={summary.version}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedVersion === summary.version 
                  ? 'ring-2 ring-purple-500 border-purple-300 dark:border-purple-700' 
                  : 'hover:border-gray-300 dark:hover:border-gray-700'
              }`}
              onClick={() => handleVersionSelect(summary.version)}
            >
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={selectedVersion === summary.version ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        Version {summary.version}
                      </Badge>
                      {summaryOptions.recommendation.preferred_version === summary.version && (
                        <Badge variant="outline" className="text-xs bg-purple-100 dark:bg-purple-900 border-purple-300">
                          <ThumbsUp className="size-2 mr-1" />
                          Recommended
                        </Badge>
                      )}
                    </div>
                    <div className={`flex items-center gap-1 text-xs ${getHookStrengthColor(summary.hook_strength)}`}>
                      {getHookStrengthIcon(summary.hook_strength)}
                      {summary.hook_strength}/10
                    </div>
                  </div>

                  {/* Summary Text */}
                  <p className="text-sm font-medium leading-relaxed">
                    "{summary.summary}"
                  </p>

                  {/* Metadata */}
                  <div className="flex flex-wrap gap-2 text-xs">
                    <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/30">
                      <Lightbulb className="size-2 mr-1" />
                      {summary.genre_focus}
                    </Badge>
                    <Badge variant="outline" className="bg-red-50 dark:bg-red-900/30">
                      <Heart className="size-2 mr-1" />
                      {summary.emotional_core}
                    </Badge>
                  </div>

                  {/* Reasoning */}
                  <p className="text-xs text-muted-foreground">
                    {summary.reasoning}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-center">
          <Button
            variant="outline"
            onClick={handleEditMode}
            disabled={!selectedVersion}
            className="flex items-center gap-2"
          >
            <Edit3 className="size-4" />
            Customize Summary
          </Button>
          <Button
            onClick={handleSelectSummary}
            disabled={!selectedVersion}
            className="flex items-center gap-2"
          >
            <Target className="size-4" />
            Set as Story DNA
          </Button>
        </div>

        {/* Cancel */}
        <div className="text-center">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  // Custom editing mode
  if (isEditing) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-purple-600 dark:text-purple-400">
            <Edit3 className="size-5" />
            <h2 className="text-lg font-semibold">Customize Your Story DNA</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Refine the summary to perfectly capture your story's essence
          </p>
        </div>

        {/* Custom Summary Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Story Summary</CardTitle>
            <CardDescription>
              One powerful sentence that captures your story's core
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="summary">Summary (One Sentence)</Label>
              <Textarea
                id="summary"
                value={customSummary}
                onChange={(e) => setCustomSummary(e.target.value)}
                placeholder="Enter your story summary in one compelling sentence..."
                className="mt-1 min-h-20"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="genre">Genre Focus</Label>
                <Input
                  id="genre"
                  value={customGenre}
                  onChange={(e) => setCustomGenre(e.target.value)}
                  placeholder="e.g., Drama, Thriller, Character Study"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="emotional">Emotional Core</Label>
                <Input
                  id="emotional"
                  value={customEmotionalCore}
                  onChange={(e) => setCustomEmotionalCore(e.target.value)}
                  placeholder="e.g., Self-discovery, Redemption"
                  className="mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3 justify-center">
          <Button
            variant="outline"
            onClick={() => setIsEditing(false)}
            className="flex items-center gap-2"
          >
            <X className="size-4" />
            Cancel Edit
          </Button>
          <Button
            onClick={handleSaveCustom}
            className="flex items-center gap-2"
          >
            <Save className="size-4" />
            Set Custom DNA
          </Button>
        </div>
      </div>
    );
  }

  return null;
}