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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { 
  Film,
  Edit3,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  Clock,
  Users,
  Camera,
  ArrowRight,
  RefreshCw,
  Play,
  MapPin,
  MessageSquare,
  Zap,
  Eye,
  Plus,
  Minus
} from 'lucide-react';

interface Beat {
  beat_number: number;
  beat_title: string;
  action_description: string;
  dialogue_notes?: string;
  character_focus: string[];
  character_states: Record<string, string>;
  tension_moment: string;
  story_function: string;
  production_notes: string;
  duration_estimate: 'short' | 'medium' | 'long';
  transition_to_next: string;
  visual_elements: string[];
}

interface SceneBreakdown {
  scene_number: number;
  scene_title: string;
  total_beats: number;
  beats: Beat[];
}

interface CharacterTracking {
  main_characters: string[];
  character_arcs: Record<string, {
    starting_state: string;
    progression: string[];
    ending_state: string;
    key_moments: string[];
  }>;
  consistency_notes: string[];
}

interface ProductionSummary {
  total_beats: number;
  estimated_runtime: string;
  key_locations: string[];
  production_complexity: 'low' | 'medium' | 'high';
  budget_considerations: string[];
  scheduling_notes: string[];
}

interface SceneBeatBreakdown {
  scene_breakdowns: SceneBreakdown[];
  character_tracking: CharacterTracking;
  production_summary: ProductionSummary;
}

interface ValidationResults {
  overall_score: number;
  issues: string[];
  warnings: string[];
  strengths: string[];
  is_production_ready: boolean;
  needs_revision: boolean;
  beat_count: number;
  character_consistency: boolean;
}

interface SceneBeatsGeneratorProps {
  transcriptId: string;
  transcriptTitle: string;
  storyDNA: string;
  sceneStructure: any;
  onBeatsSelected: (beatBreakdown: SceneBeatBreakdown, userNotes?: string) => void;
  onCancel: () => void;
}

export function SceneBeatsGenerator({ 
  transcriptId, 
  transcriptTitle, 
  storyDNA,
  sceneStructure,
  onBeatsSelected, 
  onCancel 
}: SceneBeatsGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [beatBreakdown, setBeatBreakdown] = useState<SceneBeatBreakdown | null>(null);
  const [editingBeat, setEditingBeat] = useState<string | null>(null); // sceneNumber-beatNumber
  const [userNotes, setUserNotes] = useState('');
  const [validationResults, setValidationResults] = useState<ValidationResults | null>(null);

  const generateBeats = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch(`/api/transcripts/${transcriptId}/generate-beats`, {
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
        if (errorData.phase_required === 2) {
          toast.error('Scene structure required. Please complete Phase 2 first.');
          onCancel();
          return;
        }
        throw new Error('Failed to generate scene beats');
      }

      const data = await response.json();
      setBeatBreakdown(data.scene_beats);
      toast.success('Scene beat breakdown generated successfully!');
    } catch (error) {
      console.error('Error generating beats:', error);
      toast.error('Failed to generate scene beat breakdown');
    } finally {
      setIsGenerating(false);
    }
  };

  const updateBeat = (sceneNumber: number, beatNumber: number, updates: Partial<Beat>) => {
    if (!beatBreakdown) return;
    
    const updatedScenes = beatBreakdown.scene_breakdowns.map(scene => 
      scene.scene_number === sceneNumber 
        ? {
            ...scene,
            beats: scene.beats.map(beat =>
              beat.beat_number === beatNumber 
                ? { ...beat, ...updates }
                : beat
            )
          }
        : scene
    );
    
    setBeatBreakdown({
      ...beatBreakdown,
      scene_breakdowns: updatedScenes
    });
  };

  const addBeat = (sceneNumber: number) => {
    if (!beatBreakdown) return;
    
    const updatedScenes = beatBreakdown.scene_breakdowns.map(scene => {
      if (scene.scene_number === sceneNumber && scene.beats.length < 8) {
        const newBeatNumber = scene.beats.length + 1;
        const newBeat: Beat = {
          beat_number: newBeatNumber,
          beat_title: `New Beat ${newBeatNumber}`,
          action_description: 'Describe what happens in this beat...',
          dialogue_notes: 'Key dialogue points...',
          character_focus: ['protagonist'],
          character_states: { protagonist: 'active' },
          tension_moment: 'Moment of tension...',
          story_function: 'What this beat accomplishes...',
          production_notes: 'Production considerations...',
          duration_estimate: 'medium',
          transition_to_next: 'How it connects to next beat...',
          visual_elements: ['Key visual elements...']
        };
        
        return {
          ...scene,
          total_beats: scene.beats.length + 1,
          beats: [...scene.beats, newBeat]
        };
      }
      return scene;
    });
    
    setBeatBreakdown({
      ...beatBreakdown,
      scene_breakdowns: updatedScenes
    });
  };

  const removeBeat = (sceneNumber: number, beatNumber: number) => {
    if (!beatBreakdown) return;
    
    const updatedScenes = beatBreakdown.scene_breakdowns.map(scene => {
      if (scene.scene_number === sceneNumber && scene.beats.length > 3) {
        const filteredBeats = scene.beats
          .filter(beat => beat.beat_number !== beatNumber)
          .map((beat, index) => ({ ...beat, beat_number: index + 1 }));
          
        return {
          ...scene,
          total_beats: filteredBeats.length,
          beats: filteredBeats
        };
      }
      return scene;
    });
    
    setBeatBreakdown({
      ...beatBreakdown,
      scene_breakdowns: updatedScenes
    });
  };

  const handleSaveBreakdown = async () => {
    if (!beatBreakdown) return;

    try {
      const response = await fetch(`/api/transcripts/${transcriptId}/save-beats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          scene_breakdowns: beatBreakdown.scene_breakdowns,
          character_tracking: beatBreakdown.character_tracking,
          production_summary: beatBreakdown.production_summary,
          user_notes: userNotes
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save scene beat breakdown');
      }

      const data = await response.json();
      setValidationResults(data.scene_beats.validation_results);
      toast.success('Scene beat breakdown saved successfully!');
      onBeatsSelected(beatBreakdown, userNotes);
    } catch (error) {
      console.error('Error saving beat breakdown:', error);
      toast.error('Failed to save scene beat breakdown');
    }
  };

  const getDurationColor = (duration: string) => {
    switch (duration) {
      case 'short': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'long': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  // Initial state - generate beats
  if (!beatBreakdown && !isGenerating) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-2 text-orange-600 dark:text-orange-400">
            <Film className="size-6" />
            <h2 className="text-xl font-semibold">Scene Beat Breakdown</h2>
          </div>
          <p className="text-muted-foreground max-w-2xl">
            Transform your scene structure into detailed, production-ready beat breakdowns. 
            Each beat will be actionable for filming and execution.
          </p>
        </div>

        {/* Prerequisites */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Play className="size-4 text-purple-600 dark:text-purple-400" />
                Story DNA Foundation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-purple-800 dark:text-purple-200 font-medium leading-relaxed">
                "{storyDNA}"
              </p>
            </CardContent>
          </Card>

          <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Film className="size-4 text-blue-600 dark:text-blue-400" />
                Scene Structure
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                {sceneStructure?.scenes?.length || 0} scenes ready for beat breakdown
              </p>
              <div className="mt-2 space-y-1">
                {sceneStructure?.scenes?.slice(0, 2).map((scene: any) => (
                  <div key={scene.scene_number} className="text-xs text-blue-700 dark:text-blue-300">
                    Scene {scene.scene_number}: {scene.title}
                  </div>
                ))}
                {sceneStructure?.scenes?.length > 2 && (
                  <div className="text-xs text-blue-600 dark:text-blue-400">
                    +{sceneStructure.scenes.length - 2} more scenes
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

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
            onClick={generateBeats}
            size="lg"
            className="flex items-center gap-2"
          >
            <Film className="size-4" />
            Generate Beat Breakdown
          </Button>
          <p className="text-sm text-muted-foreground mt-2">
            AI will break down each scene into detailed, production-ready beats
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
          <div className="flex items-center justify-center gap-2 text-orange-600 dark:text-orange-400 mb-3">
            <RefreshCw className="size-6 animate-spin" />
            <h2 className="text-xl font-semibold">Generating Beat Breakdown...</h2>
          </div>
          <p className="text-muted-foreground">
            Breaking down each scene into detailed, actionable production beats
          </p>
        </div>

        <div className="space-y-4">
          {sceneStructure?.scenes?.map((scene: any) => (
            <Card key={scene.scene_number}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="p-3 border rounded">
                    <div className="flex items-center justify-between mb-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-6 w-16" />
                    </div>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Beat breakdown display and editing
  if (beatBreakdown) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-orange-600 dark:text-orange-400">
            <Film className="size-5" />
            <h2 className="text-lg font-semibold">Phase 3: Production Beat Breakdown</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Detailed, actionable beats for production planning and execution
          </p>
        </div>

        <Tabs defaultValue="beats" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="beats">Scene Beats</TabsTrigger>
            <TabsTrigger value="characters">Character Tracking</TabsTrigger>
            <TabsTrigger value="production">Production Summary</TabsTrigger>
          </TabsList>

          <TabsContent value="beats" className="space-y-4">
            {/* Scene Breakdowns */}
            <div className="space-y-6">
              {beatBreakdown.scene_breakdowns.map((scene) => (
                <Card key={scene.scene_number} className="border-orange-200 dark:border-orange-800">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Scene {scene.scene_number}</Badge>
                        <h3 className="font-medium">{scene.scene_title}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="text-xs">{scene.total_beats} beats</Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => addBeat(scene.scene_number)}
                          disabled={scene.beats.length >= 8}
                        >
                          <Plus className="size-3" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      {scene.beats.map((beat) => (
                        <Card key={beat.beat_number} className="bg-gray-50 dark:bg-gray-900/50">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-xs">
                                  Beat {beat.beat_number}
                                </Badge>
                                <span className="font-medium text-sm">{beat.beat_title}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className={getDurationColor(beat.duration_estimate)}>
                                  <Clock className="size-2 mr-1" />
                                  {beat.duration_estimate}
                                </Badge>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setEditingBeat(
                                    editingBeat === `${scene.scene_number}-${beat.beat_number}` 
                                      ? null 
                                      : `${scene.scene_number}-${beat.beat_number}`
                                  )}
                                >
                                  <Edit3 className="size-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removeBeat(scene.scene_number, beat.beat_number)}
                                  disabled={scene.beats.length <= 3}
                                >
                                  <Minus className="size-3" />
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          
                          <CardContent className="pt-0">
                            {editingBeat === `${scene.scene_number}-${beat.beat_number}` ? (
                              <BeatEditor
                                beat={beat}
                                onSave={(updatedBeat) => {
                                  updateBeat(scene.scene_number, beat.beat_number, updatedBeat);
                                  setEditingBeat(null);
                                }}
                                onCancel={() => setEditingBeat(null)}
                              />
                            ) : (
                              <div className="space-y-3">
                                <div>
                                  <h4 className="text-sm font-medium mb-1">Action</h4>
                                  <p className="text-sm text-muted-foreground">{beat.action_description}</p>
                                </div>
                                
                                {beat.dialogue_notes && (
                                  <div>
                                    <h4 className="text-sm font-medium mb-1">Dialogue Notes</h4>
                                    <p className="text-sm text-muted-foreground">{beat.dialogue_notes}</p>
                                  </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div>
                                    <h4 className="text-sm font-medium mb-1">Story Function</h4>
                                    <p className="text-sm text-muted-foreground">{beat.story_function}</p>
                                  </div>
                                  <div>
                                    <h4 className="text-sm font-medium mb-1">Tension Moment</h4>
                                    <p className="text-sm text-muted-foreground">{beat.tension_moment}</p>
                                  </div>
                                </div>

                                <div>
                                  <h4 className="text-sm font-medium mb-1">Production Notes</h4>
                                  <p className="text-sm text-muted-foreground">{beat.production_notes}</p>
                                </div>

                                <div className="flex flex-wrap gap-2 text-xs">
                                  <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/30">
                                    <Users className="size-2 mr-1" />
                                    {beat.character_focus.join(', ')}
                                  </Badge>
                                  {beat.visual_elements.slice(0, 2).map((element, i) => (
                                    <Badge key={i} variant="outline" className="bg-green-50 dark:bg-green-900/30">
                                      <Camera className="size-2 mr-1" />
                                      {element}
                                    </Badge>
                                  ))}
                                  {beat.visual_elements.length > 2 && (
                                    <Badge variant="outline" className="bg-green-50 dark:bg-green-900/30">
                                      +{beat.visual_elements.length - 2} more
                                    </Badge>
                                  )}
                                </div>

                                {beat.transition_to_next && (
                                  <div className="flex items-start gap-2 text-sm text-muted-foreground bg-gray-100 dark:bg-gray-800 p-2 rounded">
                                    <ArrowRight className="size-3 mt-0.5 shrink-0" />
                                    {beat.transition_to_next}
                                  </div>
                                )}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="characters" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Character Tracking</CardTitle>
                <CardDescription>
                  Character development and consistency across all beats
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Main Characters</h4>
                  <div className="flex flex-wrap gap-2">
                    {beatBreakdown.character_tracking.main_characters.map((character, i) => (
                      <Badge key={i} variant="outline">{character}</Badge>
                    ))}
                  </div>
                </div>

                {Object.entries(beatBreakdown.character_tracking.character_arcs).map(([character, arc]) => (
                  <Card key={character} className="bg-gray-50 dark:bg-gray-900/50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">{character} Arc</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <h5 className="font-medium mb-1">Starting State</h5>
                          <p className="text-muted-foreground">{arc.starting_state}</p>
                        </div>
                        <div>
                          <h5 className="font-medium mb-1">Ending State</h5>
                          <p className="text-muted-foreground">{arc.ending_state}</p>
                        </div>
                      </div>
                      
                      <div>
                        <h5 className="text-sm font-medium mb-2">Progression</h5>
                        <div className="space-y-1">
                          {arc.progression.map((step, i) => (
                            <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <div className="size-1 rounded-full bg-orange-500 mt-2 shrink-0" />
                              {step}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h5 className="text-sm font-medium mb-2">Key Moments</h5>
                        <div className="space-y-1">
                          {arc.key_moments.map((moment, i) => (
                            <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <Zap className="size-3 mt-0.5 shrink-0 text-orange-500" />
                              {moment}
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {beatBreakdown.character_tracking.consistency_notes.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Consistency Notes</h4>
                    <div className="space-y-1">
                      {beatBreakdown.character_tracking.consistency_notes.map((note, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <CheckCircle className="size-3 mt-0.5 shrink-0 text-green-500" />
                          {note}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="production" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Production Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Beats</span>
                    <Badge variant="outline">{beatBreakdown.production_summary.total_beats}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Runtime</span>
                    <Badge variant="outline">{beatBreakdown.production_summary.estimated_runtime}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Complexity</span>
                    <Badge variant={
                      beatBreakdown.production_summary.production_complexity === 'high' ? 'destructive' :
                      beatBreakdown.production_summary.production_complexity === 'medium' ? 'secondary' : 'outline'
                    }>
                      {beatBreakdown.production_summary.production_complexity}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Key Locations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {beatBreakdown.production_summary.key_locations.map((location, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <MapPin className="size-3 text-orange-500" />
                        {location}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Budget Considerations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {beatBreakdown.production_summary.budget_considerations.map((consideration, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <div className="size-1 rounded-full bg-orange-500 mt-2 shrink-0" />
                      {consideration}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Scheduling Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {beatBreakdown.production_summary.scheduling_notes.map((note, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Clock className="size-3 mt-0.5 shrink-0 text-orange-500" />
                      {note}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* User Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Production Notes</CardTitle>
            <CardDescription>Add your production insights and adjustments</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={userNotes}
              onChange={(e) => setUserNotes(e.target.value)}
              placeholder="Add notes about production considerations, character insights, or beat adjustments..."
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Validation Results */}
        {validationResults && (
          <Card className={validationResults.is_production_ready ? 'border-green-200 dark:border-green-800' : 'border-yellow-200 dark:border-yellow-800'}>
            <CardHeader>
              <div className="flex items-center gap-2">
                {validationResults.is_production_ready ? (
                  <CheckCircle className="size-4 text-green-600" />
                ) : (
                  <AlertCircle className="size-4 text-yellow-600" />
                )}
                <CardTitle className="text-sm">Production Readiness</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span>Overall Score</span>
                <span className="font-semibold">{validationResults.overall_score.toFixed(1)}/10</span>
              </div>
              <Progress value={validationResults.overall_score * 10} />

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Total Beats:</span> {validationResults.beat_count}
                </div>
                <div>
                  <span className="font-medium">Character Consistency:</span>{' '}
                  {validationResults.character_consistency ? (
                    <CheckCircle className="size-3 inline text-green-600" />
                  ) : (
                    <X className="size-3 inline text-red-600" />
                  )}
                </div>
              </div>

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
              setBeatBreakdown(null);
              setValidationResults(null);
            }}
            className="flex items-center gap-2"
          >
            <RefreshCw className="size-4" />
            Regenerate Beats
          </Button>
          <Button
            onClick={handleSaveBreakdown}
            className="flex items-center gap-2"
          >
            <Save className="size-4" />
            Save Beat Breakdown
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

// Beat Editor Component
interface BeatEditorProps {
  beat: Beat;
  onSave: (beat: Beat) => void;
  onCancel: () => void;
}

function BeatEditor({ beat, onSave, onCancel }: BeatEditorProps) {
  const [editedBeat, setEditedBeat] = useState<Beat>(beat);

  const handleSave = () => {
    onSave(editedBeat);
  };

  const addVisualElement = () => {
    setEditedBeat(prev => ({
      ...prev,
      visual_elements: [...prev.visual_elements, '']
    }));
  };

  const updateVisualElement = (index: number, value: string) => {
    setEditedBeat(prev => ({
      ...prev,
      visual_elements: prev.visual_elements.map((el, i) => i === index ? value : el)
    }));
  };

  const removeVisualElement = (index: number) => {
    setEditedBeat(prev => ({
      ...prev,
      visual_elements: prev.visual_elements.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="space-y-4 p-4 border-l-4 border-orange-500 bg-orange-50 dark:bg-orange-900/20 rounded">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="text-xs">Beat Title</Label>
          <Input
            value={editedBeat.beat_title}
            onChange={(e) => setEditedBeat(prev => ({ ...prev, beat_title: e.target.value }))}
            className="mt-1"
          />
        </div>
        <div>
          <Label className="text-xs">Duration</Label>
          <Select 
            value={editedBeat.duration_estimate} 
            onValueChange={(value) => setEditedBeat(prev => ({ 
              ...prev, 
              duration_estimate: value as Beat['duration_estimate']
            }))}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="short">Short</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="long">Long</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label className="text-xs">Action Description</Label>
        <Textarea
          value={editedBeat.action_description}
          onChange={(e) => setEditedBeat(prev => ({ ...prev, action_description: e.target.value }))}
          rows={3}
          className="mt-1"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="text-xs">Dialogue Notes</Label>
          <Textarea
            value={editedBeat.dialogue_notes || ''}
            onChange={(e) => setEditedBeat(prev => ({ ...prev, dialogue_notes: e.target.value }))}
            rows={2}
            className="mt-1"
          />
        </div>
        <div>
          <Label className="text-xs">Production Notes</Label>
          <Textarea
            value={editedBeat.production_notes}
            onChange={(e) => setEditedBeat(prev => ({ ...prev, production_notes: e.target.value }))}
            rows={2}
            className="mt-1"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="text-xs">Story Function</Label>
          <Textarea
            value={editedBeat.story_function}
            onChange={(e) => setEditedBeat(prev => ({ ...prev, story_function: e.target.value }))}
            rows={2}
            className="mt-1"
          />
        </div>
        <div>
          <Label className="text-xs">Tension Moment</Label>
          <Textarea
            value={editedBeat.tension_moment}
            onChange={(e) => setEditedBeat(prev => ({ ...prev, tension_moment: e.target.value }))}
            rows={2}
            className="mt-1"
          />
        </div>
      </div>

      <div>
        <Label className="text-xs">Visual Elements</Label>
        <div className="space-y-2 mt-1">
          {editedBeat.visual_elements.map((element, i) => (
            <div key={i} className="flex gap-2">
              <Input
                value={element}
                onChange={(e) => updateVisualElement(i, e.target.value)}
                placeholder="Visual element..."
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => removeVisualElement(i)}
              >
                <X className="size-3" />
              </Button>
            </div>
          ))}
          <Button
            size="sm"
            variant="ghost"
            onClick={addVisualElement}
            className="w-full border-2 border-dashed"
          >
            <Plus className="size-3 mr-2" />
            Add Visual Element
          </Button>
        </div>
      </div>

      <div className="flex gap-2 pt-4 border-t">
        <Button onClick={handleSave} size="sm">
          <Save className="size-3 mr-2" />
          Save Beat
        </Button>
        <Button variant="outline" onClick={onCancel} size="sm">
          <X className="size-3 mr-2" />
          Cancel
        </Button>
      </div>
    </div>
  );
}