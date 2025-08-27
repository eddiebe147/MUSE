'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { 
  Play,
  Edit3,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  Zap,
  TrendingUp,
  Users,
  Target,
  ArrowRight,
  RefreshCw,
  Book
} from 'lucide-react';

interface Scene {
  scene_number: number;
  title: string;
  summary: string;
  purpose: string;
  stakes: string;
  character_arc: string;
  conflict_type: 'internal' | 'interpersonal' | 'external' | 'societal';
  emotional_beat: string;
  forward_movement: string;
  key_moments: string[];
  tension_level: number;
  pacing: 'slow' | 'medium' | 'fast';
}

interface ArcAnalysis {
  overall_progression: string;
  escalation_pattern: string;
  resolution_approach: string;
  cohesion_strength: number;
  structural_notes: string[];
}

interface SceneStructure {
  scenes: Scene[];
  arc_analysis: ArcAnalysis;
}

interface ValidationResults {
  overall_score: number;
  issues: string[];
  warnings: string[];
  strengths: string[];
  is_structurally_sound: boolean;
  needs_revision: boolean;
}

interface SceneStructureGeneratorProps {
  transcriptId: string;
  transcriptTitle: string;
  storyDNA: string;
  onSceneStructureSelected: (sceneStructure: SceneStructure, userNotes?: string) => void;
  onCancel: () => void;
}

export function SceneStructureGenerator({ 
  transcriptId, 
  transcriptTitle, 
  storyDNA,
  onSceneStructureSelected, 
  onCancel 
}: SceneStructureGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [sceneStructure, setSceneStructure] = useState<SceneStructure | null>(null);
  const [editingScene, setEditingScene] = useState<number | null>(null);
  const [userNotes, setUserNotes] = useState('');
  const [validationResults, setValidationResults] = useState<ValidationResults | null>(null);

  const generateScenes = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch(`/api/transcripts/${transcriptId}/generate-scenes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.phase_required === 1) {
          toast.error('Story DNA required. Please complete Phase 1 first.');
          onCancel();
          return;
        }
        throw new Error('Failed to generate scene structure');
      }

      const data = await response.json();
      setSceneStructure(data.scene_structure);
      toast.success('Scene structure generated successfully!');
    } catch (error) {
      console.error('Error generating scenes:', error);
      toast.error('Failed to generate scene structure');
    } finally {
      setIsGenerating(false);
    }
  };

  const updateScene = (sceneNumber: number, updates: Partial<Scene>) => {
    if (!sceneStructure) return;
    
    const updatedScenes = sceneStructure.scenes.map(scene => 
      scene.scene_number === sceneNumber 
        ? { ...scene, ...updates }
        : scene
    );
    
    setSceneStructure({
      ...sceneStructure,
      scenes: updatedScenes
    });
  };

  const handleSaveStructure = async () => {
    if (!sceneStructure) return;

    try {
      const response = await fetch(`/api/transcripts/${transcriptId}/save-scenes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          scenes: sceneStructure.scenes,
          arc_analysis: sceneStructure.arc_analysis,
          user_notes: userNotes
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save scene structure');
      }

      const data = await response.json();
      setValidationResults(data.scene_structure.validation_results);
      toast.success('Scene structure saved successfully!');
      onSceneStructureSelected(sceneStructure, userNotes);
    } catch (error) {
      console.error('Error saving scene structure:', error);
      toast.error('Failed to save scene structure');
    }
  };

  const getConflictIcon = (type: string) => {
    switch (type) {
      case 'internal': return <Users className="size-3" />;
      case 'interpersonal': return <Users className="size-3" />;
      case 'external': return <Target className="size-3" />;
      case 'societal': return <TrendingUp className="size-3" />;
      default: return <Zap className="size-3" />;
    }
  };

  const getPacingColor = (pacing: string) => {
    switch (pacing) {
      case 'slow': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'fast': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getTensionColor = (level: number) => {
    if (level >= 8) return 'text-red-600 dark:text-red-400';
    if (level >= 6) return 'text-orange-600 dark:text-orange-400';
    if (level >= 4) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  // Initial state - generate scenes
  if (!sceneStructure && !isGenerating) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400">
            <Play className="size-6" />
            <h2 className="text-xl font-semibold">Scene Structure Generator</h2>
          </div>
          <p className="text-muted-foreground max-w-2xl">
            Transform your Story DNA into a complete 4-scene narrative arc. Each scene will have clear stakes, 
            character development, and forward movement that builds toward resolution.
          </p>
        </div>

        {/* Story DNA Foundation */}
        <Card className="border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Book className="size-4 text-purple-600 dark:text-purple-400" />
              Story DNA Foundation
            </CardTitle>
            <CardDescription>Phase 1 - The genetic code driving your scene structure</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-purple-800 dark:text-purple-200 font-medium leading-relaxed">
              "{storyDNA}"
            </p>
          </CardContent>
        </Card>

        {/* Source Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Source Material</CardTitle>
            <CardDescription>"{transcriptTitle}"</CardDescription>
          </CardHeader>
        </Card>

        {/* Generate Button */}
        <div className="text-center">
          <Button 
            onClick={generateScenes}
            size="lg"
            className="flex items-center gap-2"
          >
            <Play className="size-4" />
            Generate Scene Structure
          </Button>
          <p className="text-sm text-muted-foreground mt-2">
            AI will create a 4-scene arc based on your Story DNA and analyzed moments
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
          <div className="flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400 mb-3">
            <RefreshCw className="size-6 animate-spin" />
            <h2 className="text-xl font-semibold">Generating Scene Structure...</h2>
          </div>
          <p className="text-muted-foreground">
            Creating a complete 4-scene narrative arc from your Story DNA
          </p>
        </div>

        <div className="space-y-4">
          {[1, 2, 3, 4].map((sceneNum) => (
            <Card key={sceneNum}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Scene structure display and editing
  if (sceneStructure) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400">
            <Play className="size-5" />
            <h2 className="text-lg font-semibold">Phase 2: Scene Structure</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Review and refine your 4-scene narrative arc
          </p>
        </div>

        {/* Arc Overview */}
        <Card className="border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-sm">Arc Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span>Structural Cohesion</span>
              <span className="font-semibold">{sceneStructure.arc_analysis.cohesion_strength}/10</span>
            </div>
            <Progress value={sceneStructure.arc_analysis.cohesion_strength * 10} />
            
            <div className="space-y-2 text-sm">
              <p><strong>Progression:</strong> {sceneStructure.arc_analysis.overall_progression}</p>
              <p><strong>Escalation:</strong> {sceneStructure.arc_analysis.escalation_pattern}</p>
              <p><strong>Resolution:</strong> {sceneStructure.arc_analysis.resolution_approach}</p>
            </div>

            {sceneStructure.arc_analysis.structural_notes.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-1">Structural Notes:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {sceneStructure.arc_analysis.structural_notes.map((note, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <div className="size-1 rounded-full bg-blue-500 mt-2 shrink-0" />
                      {note}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Scenes */}
        <div className="space-y-4">
          {sceneStructure.scenes.map((scene) => (
            <Card key={scene.scene_number} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Scene {scene.scene_number}</Badge>
                    <h3 className="font-medium">{scene.title}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getPacingColor(scene.pacing)}>
                      {scene.pacing}
                    </Badge>
                    <div className={`flex items-center gap-1 text-xs ${getTensionColor(scene.tension_level)}`}>
                      <Zap className="size-3" />
                      {scene.tension_level}/10
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingScene(
                        editingScene === scene.scene_number ? null : scene.scene_number
                      )}
                    >
                      <Edit3 className="size-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {editingScene === scene.scene_number ? (
                  <SceneEditor
                    scene={scene}
                    onSave={(updatedScene) => {
                      updateScene(scene.scene_number, updatedScene);
                      setEditingScene(null);
                    }}
                    onCancel={() => setEditingScene(null)}
                  />
                ) : (
                  <>
                    <p className="text-sm leading-relaxed">{scene.summary}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <h4 className="font-medium mb-1">Purpose</h4>
                        <p className="text-muted-foreground">{scene.purpose}</p>
                      </div>
                      <div>
                        <h4 className="font-medium mb-1">Stakes</h4>
                        <p className="text-muted-foreground">{scene.stakes}</p>
                      </div>
                      <div>
                        <h4 className="font-medium mb-1">Character Arc</h4>
                        <p className="text-muted-foreground">{scene.character_arc}</p>
                      </div>
                      <div>
                        <h4 className="font-medium mb-1">Forward Movement</h4>
                        <p className="text-muted-foreground">{scene.forward_movement}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {getConflictIcon(scene.conflict_type)}
                        {scene.conflict_type}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {scene.emotional_beat}
                      </Badge>
                    </div>

                    {scene.key_moments.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Key Moments</h4>
                        <div className="space-y-1">
                          {scene.key_moments.map((moment, i) => (
                            <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <ArrowRight className="size-3 mt-0.5 shrink-0" />
                              {moment}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* User Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Development Notes</CardTitle>
            <CardDescription>Add your thoughts or refinements for this scene structure</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={userNotes}
              onChange={(e) => setUserNotes(e.target.value)}
              placeholder="Add notes about adjustments, character insights, or structural observations..."
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Validation Results */}
        {validationResults && (
          <Card className={validationResults.is_structurally_sound ? 'border-green-200 dark:border-green-800' : 'border-yellow-200 dark:border-yellow-800'}>
            <CardHeader>
              <div className="flex items-center gap-2">
                {validationResults.is_structurally_sound ? (
                  <CheckCircle className="size-4 text-green-600" />
                ) : (
                  <AlertCircle className="size-4 text-yellow-600" />
                )}
                <CardTitle className="text-sm">Structure Validation</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span>Overall Score</span>
                <span className="font-semibold">{validationResults.overall_score.toFixed(1)}/10</span>
              </div>
              <Progress value={validationResults.overall_score * 10} />

              {validationResults.strengths.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-green-700 dark:text-green-300 mb-1">Strengths</h4>
                  <ul className="text-sm space-y-1">
                    {validationResults.strengths.map((strength, i) => (
                      <li key={i} className="flex items-start gap-2 text-green-600 dark:text-green-400">
                        <CheckCircle className="size-3 mt-0.5 shrink-0" />
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {validationResults.warnings.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-yellow-700 dark:text-yellow-300 mb-1">Suggestions</h4>
                  <ul className="text-sm space-y-1">
                    {validationResults.warnings.map((warning, i) => (
                      <li key={i} className="flex items-start gap-2 text-yellow-600 dark:text-yellow-400">
                        <AlertCircle className="size-3 mt-0.5 shrink-0" />
                        {warning}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {validationResults.issues.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-red-700 dark:text-red-300 mb-1">Issues</h4>
                  <ul className="text-sm space-y-1">
                    {validationResults.issues.map((issue, i) => (
                      <li key={i} className="flex items-start gap-2 text-red-600 dark:text-red-400">
                        <X className="size-3 mt-0.5 shrink-0" />
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-center">
          <Button
            variant="outline"
            onClick={() => {
              setSceneStructure(null);
              setValidationResults(null);
            }}
            className="flex items-center gap-2"
          >
            <RefreshCw className="size-4" />
            Regenerate Scenes
          </Button>
          <Button
            onClick={handleSaveStructure}
            className="flex items-center gap-2"
          >
            <Save className="size-4" />
            Save Scene Structure
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

  return null;
}

// Scene Editor Component
interface SceneEditorProps {
  scene: Scene;
  onSave: (scene: Scene) => void;
  onCancel: () => void;
}

function SceneEditor({ scene, onSave, onCancel }: SceneEditorProps) {
  const [editedScene, setEditedScene] = useState<Scene>(scene);

  const handleSave = () => {
    onSave(editedScene);
  };

  return (
    <div className="space-y-4 p-4 border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20 rounded">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="text-xs">Title</Label>
          <Input
            value={editedScene.title}
            onChange={(e) => setEditedScene(prev => ({ ...prev, title: e.target.value }))}
            className="mt-1"
          />
        </div>
        <div>
          <Label className="text-xs">Conflict Type</Label>
          <Select 
            value={editedScene.conflict_type} 
            onValueChange={(value) => setEditedScene(prev => ({ 
              ...prev, 
              conflict_type: value as Scene['conflict_type']
            }))}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="internal">Internal</SelectItem>
              <SelectItem value="interpersonal">Interpersonal</SelectItem>
              <SelectItem value="external">External</SelectItem>
              <SelectItem value="societal">Societal</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label className="text-xs">Summary</Label>
        <Textarea
          value={editedScene.summary}
          onChange={(e) => setEditedScene(prev => ({ ...prev, summary: e.target.value }))}
          rows={3}
          className="mt-1"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="text-xs">Stakes</Label>
          <Textarea
            value={editedScene.stakes}
            onChange={(e) => setEditedScene(prev => ({ ...prev, stakes: e.target.value }))}
            rows={2}
            className="mt-1"
          />
        </div>
        <div>
          <Label className="text-xs">Forward Movement</Label>
          <Textarea
            value={editedScene.forward_movement}
            onChange={(e) => setEditedScene(prev => ({ ...prev, forward_movement: e.target.value }))}
            rows={2}
            className="mt-1"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label className="text-xs">Tension Level (1-10)</Label>
          <Input
            type="number"
            min="1"
            max="10"
            value={editedScene.tension_level}
            onChange={(e) => setEditedScene(prev => ({ 
              ...prev, 
              tension_level: parseInt(e.target.value) || 1 
            }))}
            className="mt-1"
          />
        </div>
        <div>
          <Label className="text-xs">Pacing</Label>
          <Select 
            value={editedScene.pacing} 
            onValueChange={(value) => setEditedScene(prev => ({ 
              ...prev, 
              pacing: value as Scene['pacing']
            }))}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="slow">Slow</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="fast">Fast</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Emotional Beat</Label>
          <Input
            value={editedScene.emotional_beat}
            onChange={(e) => setEditedScene(prev => ({ ...prev, emotional_beat: e.target.value }))}
            className="mt-1"
          />
        </div>
      </div>

      <div className="flex gap-2 pt-4 border-t">
        <Button onClick={handleSave} size="sm">
          <Save className="size-3 mr-2" />
          Save Changes
        </Button>
        <Button variant="outline" onClick={onCancel} size="sm">
          <X className="size-3 mr-2" />
          Cancel
        </Button>
      </div>
    </div>
  );
}