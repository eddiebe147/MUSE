'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Edit3, 
  ArrowRight, 
  RefreshCw, 
  CheckCircle,
  Wand2,
  ChevronRight,
  AlertCircle,
  List
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Phase3AIInterfaceProps {
  scenes: string[];
  phase1Summary: string;
  brainstormContext?: string;
  knowledgeBase?: any;
  onComplete: (beats: any) => void;
  onSave?: (beats: any) => void;
  className?: string;
}

export function Phase3AIInterface({ 
  scenes,
  phase1Summary,
  brainstormContext,
  knowledgeBase,
  onComplete,
  onSave,
  className 
}: Phase3AIInterfaceProps) {
  const [sceneBeats, setSceneBeats] = useState<{ [key: number]: string }>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [specificRequirements, setSpecificRequirements] = useState('');
  const [error, setError] = useState<string | null>(null);

  const generateBeats = useCallback(async (regenerate = false) => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/four-phase/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phase: 3,
          previousPhaseContent: { 
            oneLine: phase1Summary,
            scenes 
          },
          brainstormContext,
          knowledgeBase,
          regenerate,
          specificRequirements: specificRequirements.trim() || undefined
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate scene beats');
      }

      const data = await response.json();
      
      if (data.success && data.generated) {
        // Parse the beats for each scene
        const beatsText = data.generated.beats || data.generated.fullContent || '';
        const parsedBeats: { [key: number]: string } = {};
        
        // Simple parsing - split by "SCENE" markers
        const sceneChunks = beatsText.split(/SCENE \d+:/i);
        sceneChunks.forEach((chunk, index) => {
          if (chunk.trim() && index > 0 && index <= scenes.length) {
            parsedBeats[index - 1] = chunk.trim();
          }
        });

        // If parsing failed, put all content in first scene
        if (Object.keys(parsedBeats).length === 0) {
          parsedBeats[0] = beatsText;
        }

        setSceneBeats(parsedBeats);
        setHasGenerated(true);
        onSave?.(parsedBeats);
      } else {
        throw new Error(data.error || 'Invalid response format');
      }
    } catch (error: any) {
      console.error('Generation error:', error);
      setError(error.message || 'Failed to generate scene beats. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [phase1Summary, scenes, brainstormContext, knowledgeBase, specificRequirements, onSave]);

  const updateBeats = (index: number, value: string) => {
    const newBeats = { ...sceneBeats, [index]: value };
    setSceneBeats(newBeats);
    onSave?.(newBeats);
  };

  const handleCompletePhase = () => {
    if (Object.keys(sceneBeats).length === scenes.length) {
      onComplete(sceneBeats);
    }
  };

  const isComplete = Object.keys(sceneBeats).length === scenes.length && 
    Object.values(sceneBeats).every(beats => beats.trim().length > 50);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Phase Header */}
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center gap-3">
          <Badge variant="secondary" className="px-4 py-2 bg-green-100 text-green-700">
            <Edit3 className="size-4 mr-2" />
            Phase 3: Scene Beats
          </Badge>
        </div>
        <div className="space-y-1">
          <h2 className="text-2xl font-bold">AI-Generated Scene Details</h2>
          <p className="text-muted-foreground">
            Claude will expand each scene into detailed beats and moments
          </p>
        </div>
      </div>

      {/* Generation Controls */}
      <Card className="border-2 border-green-200 dark:border-green-800">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Wand2 className="size-5 text-green-600" />
            AI Beat Generation
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
              placeholder="e.g., 'Include visual descriptions', 'Focus on dialogue beats', 'Add emotional moments'..."
              className="min-h-[80px] text-sm"
              disabled={isGenerating}
            />
          </div>

          {/* Generate Button */}
          <div className="flex gap-2">
            <Button
              onClick={() => generateBeats(false)}
              disabled={isGenerating}
              size="lg"
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="size-4 mr-2 animate-spin" />
                  Generating Scene Beats...
                </>
              ) : (
                <>
                  <Wand2 className="size-4 mr-2" />
                  {hasGenerated ? 'Regenerate All Beats' : 'Generate Detailed Beats'}
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

      {/* Generated Beats */}
      {hasGenerated && scenes.length > 0 && (
        <div className="space-y-6">
          {scenes.map((scene, index) => (
            <Card key={index} className="border-2 border-gray-200">
              <CardHeader className="bg-gray-50 dark:bg-gray-900/20">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Scene {index + 1}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1 italic">{scene}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingIndex(editingIndex === index ? null : index)}
                  >
                    <Edit3 className="size-4 mr-1" />
                    {editingIndex === index ? 'Save' : 'Edit'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                {editingIndex === index ? (
                  <div className="space-y-2">
                    <Textarea
                      value={sceneBeats[index] || ''}
                      onChange={(e) => updateBeats(index, e.target.value)}
                      className="min-h-[200px] font-mono text-sm"
                      placeholder="• Opening beat&#10;• Character introduction&#10;• Conflict escalation&#10;• Emotional turn&#10;• Scene climax&#10;• Transition..."
                    />
                    <Button
                      size="sm"
                      onClick={() => setEditingIndex(null)}
                    >
                      Save Beats
                    </Button>
                  </div>
                ) : (
                  <div className="prose prose-sm max-w-none">
                    {sceneBeats[index] ? (
                      <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                        {sceneBeats[index]}
                      </pre>
                    ) : (
                      <p className="text-muted-foreground italic">
                        Beats will be generated for this scene...
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Phase Completion */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          {isComplete ? (
            <span className="flex items-center gap-2 text-green-600">
              <CheckCircle className="size-4" />
              Ready for Phase 4 - Final Script
            </span>
          ) : (
            <span>Generate beats for all scenes to continue</span>
          )}
        </div>

        <Button
          onClick={handleCompletePhase}
          disabled={!isComplete}
          size="lg"
          className="px-6"
        >
          Continue to Phase 4
          <ChevronRight className="size-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}