'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  FileText, 
  ArrowRight, 
  RefreshCw, 
  CheckCircle, 
  Edit3,
  Wand2,
  Plus,
  X,
  ChevronRight,
  AlertCircle,
  GripVertical
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Phase2AIInterfaceProps {
  phase1Summary: string;
  brainstormContext?: string;
  knowledgeBase?: any;
  onComplete: (scenes: string[]) => void;
  onSave?: (scenes: string[]) => void;
  className?: string;
}

export function Phase2AIInterface({ 
  phase1Summary,
  brainstormContext,
  knowledgeBase,
  onComplete,
  onSave,
  className 
}: Phase2AIInterfaceProps) {
  const [scenes, setScenes] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [structureNotes, setStructureNotes] = useState('');
  const [specificRequirements, setSpecificRequirements] = useState('');
  const [sceneCount, setSceneCount] = useState(3);
  const [error, setError] = useState<string | null>(null);

  const generateScenes = useCallback(async (regenerate = false) => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/four-phase/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phase: 2,
          previousPhaseContent: { oneLine: phase1Summary },
          brainstormContext,
          knowledgeBase,
          regenerate,
          specificRequirements: specificRequirements.trim() || undefined,
          sceneCount
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate scene breakdown');
      }

      const data = await response.json();
      
      if (data.success && data.generated) {
        const generatedScenes = data.generated.scenes || [];
        setScenes(generatedScenes);
        setStructureNotes(data.generated.structureNotes || '');
        setHasGenerated(true);
        onSave?.(generatedScenes);
      } else {
        throw new Error(data.error || 'Invalid response format');
      }
    } catch (error: any) {
      console.error('Generation error:', error);
      setError(error.message || 'Failed to generate scene breakdown. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [phase1Summary, brainstormContext, knowledgeBase, specificRequirements, sceneCount, onSave]);

  const updateScene = (index: number, value: string) => {
    const newScenes = [...scenes];
    newScenes[index] = value;
    setScenes(newScenes);
    onSave?.(newScenes);
  };

  const addScene = () => {
    const newScenes = [...scenes, ''];
    setScenes(newScenes);
    setEditingIndex(scenes.length);
  };

  const removeScene = (index: number) => {
    if (scenes.length <= 1) return;
    const newScenes = scenes.filter((_, i) => i !== index);
    setScenes(newScenes);
    onSave?.(newScenes);
  };

  const moveScene = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === scenes.length - 1) return;
    
    const newScenes = [...scenes];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [newScenes[index], newScenes[newIndex]] = [newScenes[newIndex], newScenes[index]];
    setScenes(newScenes);
    onSave?.(newScenes);
  };

  const handleCompletePhase = () => {
    if (scenes.length > 0 && scenes.every(s => s.trim())) {
      onComplete(scenes);
    }
  };

  const isComplete = scenes.length >= sceneCount && scenes.every(s => s.trim().length > 30); // Require richer summaries

  return (
    <div className={cn("space-y-6", className)}>
      {/* Phase Header */}
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center gap-3">
          <Badge variant="secondary" className="px-4 py-2 bg-blue-100 text-blue-700">
            <FileText className="size-4 mr-2" />
            Phase 2: Scene Breakdown
          </Badge>
        </div>
        <div className="space-y-1">
          <h2 className="text-2xl font-bold">AI-Generated Scene Summaries</h2>
          <p className="text-muted-foreground">
            Claude will create detailed one-line summaries for each scene with character actions, conflicts, and emotional stakes
          </p>
          <p className="text-sm text-muted-foreground italic mt-2">
            Based on: "{phase1Summary}"
          </p>
        </div>
      </div>

      {/* Generation Controls */}
      <Card className="border-2 border-blue-200 dark:border-blue-800">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Wand2 className="size-5 text-blue-600" />
            AI Scene Generation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Scene Count Selector */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Number of Scenes
            </label>
            <div className="flex items-center gap-3">
              <select 
                value={sceneCount}
                onChange={(e) => setSceneCount(parseInt(e.target.value))}
                className="px-3 py-2 border border-input bg-background rounded-md text-sm min-w-[100px]"
                disabled={isGenerating}
              >
                <option value={3}>3 scenes</option>
                <option value={4}>4 scenes</option>
                <option value={5}>5 scenes</option>
                <option value={6}>6 scenes</option>
                <option value={7}>7 scenes</option>
                <option value={8}>8 scenes</option>
              </select>
              <span className="text-xs text-muted-foreground">
                Default: 3 scenes • More scenes = greater detail
              </span>
            </div>
          </div>

          {/* Optional Requirements */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Specific Requirements (Optional)
            </label>
            <Textarea
              value={specificRequirements}
              onChange={(e) => setSpecificRequirements(e.target.value)}
              placeholder="e.g., 'Include a flashback scene', 'End with a cliffhanger', 'Follow three-act structure'..."
              className="min-h-[80px] text-sm"
              disabled={isGenerating}
            />
          </div>

          {/* Generate Button */}
          <div className="flex gap-2">
            <Button
              onClick={() => generateScenes(false)}
              disabled={isGenerating}
              size="lg"
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="size-4 mr-2 animate-spin" />
                  Generating Scene Breakdown...
                </>
              ) : (
                <>
                  <Wand2 className="size-4 mr-2" />
                  {hasGenerated ? 'Regenerate Scene Breakdown' : 'Generate Scene Breakdown'}
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

      {/* Generated Scenes */}
      {hasGenerated && scenes.length > 0 && (
        <Card className="border-2 border-green-200 dark:border-green-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="size-5 text-green-600" />
                Generated Scene Summaries
              </CardTitle>
              <Badge variant="outline">
                {scenes.length} scene{scenes.length !== 1 ? 's' : ''}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {scenes.map((scene, index) => (
              <Card key={index} className="relative group">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Drag Handle */}
                    <div className="flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveScene(index, 'up')}
                        disabled={index === 0}
                        className="size-6 p-0"
                      >
                        ↑
                      </Button>
                      <GripVertical className="size-4 text-muted-foreground" />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveScene(index, 'down')}
                        disabled={index === scenes.length - 1}
                        className="size-6 p-0"
                      >
                        ↓
                      </Button>
                    </div>

                    {/* Scene Content */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sm">Scene {index + 1}</h4>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingIndex(editingIndex === index ? null : index)}
                            className="size-7 p-0"
                          >
                            <Edit3 className="size-3" />
                          </Button>
                          {scenes.length > 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeScene(index)}
                              className="size-7 p-0 hover:text-red-600"
                            >
                              <X className="size-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {editingIndex === index ? (
                        <div className="space-y-2">
                          <Textarea
                            value={scene}
                            onChange={(e) => updateScene(index, e.target.value)}
                            className="min-h-[100px]"
                            autoFocus
                          />
                          <Button
                            size="sm"
                            onClick={() => setEditingIndex(null)}
                          >
                            Save
                          </Button>
                        </div>
                      ) : (
                        <p className="text-sm leading-relaxed">{scene}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Add Scene Button */}
            <Button
              variant="outline"
              onClick={addScene}
              className="w-full border-dashed border-2"
            >
              <Plus className="size-4 mr-2" />
              Add Another Scene
            </Button>

            {/* Structure Notes */}
            {structureNotes && (
              <Card className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20">
                <CardContent className="p-4">
                  <h4 className="font-semibold text-sm mb-2">Structure Analysis</h4>
                  <p className="text-sm text-muted-foreground">{structureNotes}</p>
                </CardContent>
              </Card>
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
              Ready for Phase 3
            </span>
          ) : (
            <span>Generate scene breakdown to continue</span>
          )}
        </div>

        <Button
          onClick={handleCompletePhase}
          disabled={!isComplete}
          size="lg"
          className="px-6"
        >
          Continue to Phase 3
          <ChevronRight className="size-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}