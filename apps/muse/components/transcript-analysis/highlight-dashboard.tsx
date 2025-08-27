'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Zap, 
  Star, 
  Flame, 
  Users, 
  BookOpen, 
  Target,
  Edit,
  Save,
  X,
  Plus,
  Filter,
  Search,
  Eye,
  EyeOff,
  Sparkles,
  Play,
  AlertCircle,
  Film,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLivingStory } from '@/hooks/use-living-story';
import { StorySummaryGenerator } from './story-summary-generator';
import { SceneStructureGenerator } from './scene-structure-generator';
import { SceneBeatsGenerator } from './scene-beats-generator';
import { ExecutiveDocumentGenerator } from './executive-document-generator';
import { LivingStoryManager } from './living-story-manager';
import { LivingStoryNotification } from './living-story-notification';

interface StoryMoment {
  type: 'conflict' | 'revelation' | 'tension' | 'character_development' | 'plot_point' | 'theme';
  text: string;
  context: string;
  timestamp?: string;
  characters?: string[];
  intensity: number;
  tags: string[];
}

interface Analysis {
  moments: StoryMoment[];
  summary: {
    main_themes: string[];
    key_characters: string[];
    story_potential: number;
    genre_indicators: string[];
    emotional_arc: string;
  };
}

interface HighlightDashboardProps {
  transcriptId: string;
  transcriptTitle: string;
  analysis: Analysis;
  onUpdateAnalysis?: (updatedAnalysis: Analysis) => void;
  onBack?: () => void;
}

const momentTypeConfig = {
  conflict: { 
    icon: Flame, 
    color: 'text-red-500', 
    bgColor: 'bg-red-50 dark:bg-red-950/20', 
    borderColor: 'border-red-200 dark:border-red-800',
    label: 'Conflict' 
  },
  revelation: { 
    icon: Zap, 
    color: 'text-yellow-500', 
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/20', 
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    label: 'Revelation' 
  },
  tension: { 
    icon: Target, 
    color: 'text-orange-500', 
    bgColor: 'bg-orange-50 dark:bg-orange-950/20', 
    borderColor: 'border-orange-200 dark:border-orange-800',
    label: 'Tension' 
  },
  character_development: { 
    icon: Users, 
    color: 'text-blue-500', 
    bgColor: 'bg-blue-50 dark:bg-blue-950/20', 
    borderColor: 'border-blue-200 dark:border-blue-800',
    label: 'Character Development' 
  },
  plot_point: { 
    icon: BookOpen, 
    color: 'text-green-500', 
    bgColor: 'bg-green-50 dark:bg-green-950/20', 
    borderColor: 'border-green-200 dark:border-green-800',
    label: 'Plot Point' 
  },
  theme: { 
    icon: Star, 
    color: 'text-purple-500', 
    bgColor: 'bg-purple-50 dark:bg-purple-950/20', 
    borderColor: 'border-purple-200 dark:border-purple-800',
    label: 'Theme' 
  }
};

export function HighlightDashboard({ 
  transcriptId, 
  transcriptTitle, 
  analysis, 
  onUpdateAnalysis,
  onBack 
}: HighlightDashboardProps) {
  const [editingMoment, setEditingMoment] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterIntensity, setFilterIntensity] = useState<string>('all');
  const [showSummaryGenerator, setShowSummaryGenerator] = useState(false);
  const [selectedStorySummary, setSelectedStorySummary] = useState<string | null>(null);
  const [showSceneGenerator, setShowSceneGenerator] = useState(false);
  const [sceneStructure, setSceneStructure] = useState<any>(null);
  const [showBeatsGenerator, setShowBeatsGenerator] = useState(false);
  const [sceneBeats, setSceneBeats] = useState<any>(null);
  const [showDocumentGenerator, setShowDocumentGenerator] = useState(false);
  const [showLivingStoryManager, setShowLivingStoryManager] = useState(false);
  const [previousPhaseData, setPreviousPhaseData] = useState<any>({});

  // Initialize living story hook
  const { detectChanges: detectLivingStoryChanges, hasPendingChanges } = useLivingStory({
    transcriptId,
    enabled: true,
    onAutoUpdatesGenerated: (count) => {
      console.log(`Generated ${count} auto-updates`);
    },
    onChangeApplied: (phase) => {
      // Refresh the affected phase data
      if (phase === 1) loadStorySummary();
      if (phase === 2) loadSceneStructure();
      if (phase === 3) loadSceneBeats();
    }
  });

  // Load existing story summary on mount
  useEffect(() => {
    const loadStorySummary = async () => {
      try {
        const response = await fetch(`/api/transcripts/${transcriptId}/save-summary`);
        if (response.ok) {
          const data = await response.json();
          if (data.has_summary && data.story_summary) {
            const newSummary = data.story_summary.summary;
            
            // Detect changes for living story
            if (selectedStorySummary && selectedStorySummary !== newSummary) {
              await detectLivingStoryChanges(1, { summary: selectedStorySummary }, { summary: newSummary });
            }
            
            setSelectedStorySummary(newSummary);
            setPreviousPhaseData(prev => ({ ...prev, phase1: data.story_summary }));
          }
        }
      } catch (error) {
        console.error('Error loading story summary:', error);
      }
    };

    loadStorySummary();
    loadSceneStructure();
    loadSceneBeats();
  }, [transcriptId]);

  // Load existing scene structure
  const loadSceneStructure = async () => {
    try {
      const response = await fetch(`/api/transcripts/${transcriptId}/save-scenes`);
      if (response.ok) {
        const data = await response.json();
        if (data.has_scenes && data.scene_structure) {
          setSceneStructure(data.scene_structure);
        }
      }
    } catch (error) {
      console.error('Error loading scene structure:', error);
    }
  };

  // Load existing scene beats
  const loadSceneBeats = async () => {
    try {
      const response = await fetch(`/api/transcripts/${transcriptId}/save-beats`);
      if (response.ok) {
        const data = await response.json();
        if (data.has_beats && data.scene_beats) {
          setSceneBeats(data.scene_beats);
        }
      }
    } catch (error) {
      console.error('Error loading scene beats:', error);
    }
  };
  const [showHidden, setShowHidden] = useState(false);
  const [hiddenMoments, setHiddenMoments] = useState<Set<number>>(new Set());

  // Filter and search moments
  const filteredMoments = useMemo(() => {
    let filtered = analysis.moments.map((moment, index) => ({ ...moment, originalIndex: index }));

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(moment => 
        moment.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        moment.context.toLowerCase().includes(searchQuery.toLowerCase()) ||
        moment.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(moment => moment.type === filterType);
    }

    // Apply intensity filter
    if (filterIntensity !== 'all') {
      const intensityThreshold = parseInt(filterIntensity);
      filtered = filtered.filter(moment => moment.intensity >= intensityThreshold);
    }

    // Apply hidden filter
    if (!showHidden) {
      filtered = filtered.filter((_, index) => !hiddenMoments.has(index));
    }

    return filtered;
  }, [analysis.moments, searchQuery, filterType, filterIntensity, showHidden, hiddenMoments]);

  const toggleMomentVisibility = (index: number) => {
    const newHidden = new Set(hiddenMoments);
    if (newHidden.has(index)) {
      newHidden.delete(index);
    } else {
      newHidden.add(index);
    }
    setHiddenMoments(newHidden);
  };

  const updateMoment = (index: number, updatedMoment: StoryMoment) => {
    if (!onUpdateAnalysis) return;

    const updatedMoments = [...analysis.moments];
    updatedMoments[index] = updatedMoment;

    onUpdateAnalysis({
      ...analysis,
      moments: updatedMoments
    });

    setEditingMoment(null);
  };

  const addNewMoment = () => {
    if (!onUpdateAnalysis) return;

    const newMoment: StoryMoment = {
      type: 'conflict',
      text: '',
      context: '',
      intensity: 5,
      tags: []
    };

    onUpdateAnalysis({
      ...analysis,
      moments: [...analysis.moments, newMoment]
    });

    setEditingMoment(analysis.moments.length);
  };

  const deleteMoment = (index: number) => {
    if (!onUpdateAnalysis) return;

    const updatedMoments = analysis.moments.filter((_, i) => i !== index);
    onUpdateAnalysis({
      ...analysis,
      moments: updatedMoments
    });
  };

  const getIntensityColor = (intensity: number) => {
    if (intensity >= 8) return 'text-red-500';
    if (intensity >= 6) return 'text-orange-500';
    if (intensity >= 4) return 'text-yellow-500';
    return 'text-green-500';
  };

  const momentsByType = useMemo(() => {
    const grouped: Record<string, StoryMoment[]> = {};
    analysis.moments.forEach(moment => {
      if (!grouped[moment.type]) grouped[moment.type] = [];
      grouped[moment.type].push(moment);
    });
    return grouped;
  }, [analysis.moments]);

  const handleSummarySelected = (summary: string, version: string, metadata: any) => {
    setSelectedStorySummary(summary);
    setShowSummaryGenerator(false);
    
    // Here we would typically save to database
    // For now, we'll show a success message
    console.log('Selected Story DNA:', { summary, version, metadata });
    // toast.success('Story DNA saved successfully!');
  };

  const handleCancelSummary = () => {
    setShowSummaryGenerator(false);
  };

  const handleSceneStructureSelected = (sceneStructure: any, userNotes?: string) => {
    setSceneStructure({ ...sceneStructure, user_notes: userNotes });
    setShowSceneGenerator(false);
  };

  const handleCancelScenes = () => {
    setShowSceneGenerator(false);
  };

  const handleSceneBeatsSelected = (sceneBeats: any, userNotes?: string) => {
    setSceneBeats({ ...sceneBeats, user_notes: userNotes });
    setShowBeatsGenerator(false);
  };

  const handleCancelBeats = () => {
    setShowBeatsGenerator(false);
  };

  const handleCancelDocument = () => {
    setShowDocumentGenerator(false);
  };

  // Show story summary generator if requested
  if (showSummaryGenerator) {
    return (
      <div className="space-y-4">
        {onBack && (
          <Button variant="ghost" size="sm" onClick={onBack}>
            ← Back to Transcripts
          </Button>
        )}
        <StorySummaryGenerator
          transcriptId={transcriptId}
          transcriptTitle={transcriptTitle}
          onSummarySelected={handleSummarySelected}
          onCancel={handleCancelSummary}
        />
      </div>
    );
  }

  // Show scene structure generator if requested
  if (showSceneGenerator) {
    return (
      <div className="space-y-4">
        {onBack && (
          <Button variant="ghost" size="sm" onClick={onBack}>
            ← Back to Transcripts
          </Button>
        )}
        <SceneStructureGenerator
          transcriptId={transcriptId}
          transcriptTitle={transcriptTitle}
          storyDNA={selectedStorySummary || ''}
          onSceneStructureSelected={handleSceneStructureSelected}
          onCancel={handleCancelScenes}
        />
      </div>
    );
  }

  // Show scene beats generator if requested
  if (showBeatsGenerator) {
    return (
      <div className="space-y-4">
        {onBack && (
          <Button variant="ghost" size="sm" onClick={onBack}>
            ← Back to Transcripts
          </Button>
        )}
        <SceneBeatsGenerator
          transcriptId={transcriptId}
          transcriptTitle={transcriptTitle}
          storyDNA={selectedStorySummary || ''}
          sceneStructure={sceneStructure}
          onSceneBeatsSelected={handleSceneBeatsSelected}
          onCancel={handleCancelBeats}
        />
      </div>
    );
  }

  // Show executive document generator if requested
  if (showDocumentGenerator) {
    return (
      <div className="space-y-4">
        {onBack && (
          <Button variant="ghost" size="sm" onClick={onBack}>
            ← Back to Transcripts
          </Button>
        )}
        <ExecutiveDocumentGenerator
          transcriptId={transcriptId}
          transcriptTitle={transcriptTitle}
          storyDNA={selectedStorySummary || ''}
          sceneStructure={sceneStructure}
          sceneBeats={sceneBeats}
          onCancel={handleCancelDocument}
        />
      </div>
    );
  }

  // Show living story manager if requested
  if (showLivingStoryManager) {
    return (
      <div className="space-y-4">
        {onBack && (
          <Button variant="ghost" size="sm" onClick={onBack}>
            ← Back to Transcripts
          </Button>
        )}
        <LivingStoryManager
          transcriptId={transcriptId}
          transcriptTitle={transcriptTitle}
          onClose={() => setShowLivingStoryManager(false)}
          onPhasesUpdated={(phases) => {
            // Refresh affected phases
            phases.forEach(phase => {
              if (phase === 1) loadStorySummary();
              if (phase === 2) loadSceneStructure();
              if (phase === 3) loadSceneBeats();
            });
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{transcriptTitle}</h2>
          <p className="text-sm text-muted-foreground">
            {analysis.moments.length} story moments found • Story potential: {analysis.summary.story_potential}/10
          </p>
        </div>
        <div className="flex gap-2">
          {selectedStorySummary ? (
            <div className="text-right">
              <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">Story DNA Set</p>
              <p className="text-xs text-muted-foreground max-w-48 truncate">"{selectedStorySummary}"</p>
            </div>
          ) : (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowSummaryGenerator(true)}
              className="text-purple-600 border-purple-200 hover:bg-purple-50 dark:text-purple-400 dark:border-purple-800 dark:hover:bg-purple-900/20"
            >
              <Sparkles className="size-4 mr-2" />
              Generate Story DNA
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={addNewMoment}>
            <Plus className="size-4 mr-2" />
            Add Moment
          </Button>
          {onBack && (
            <Button variant="outline" size="sm" onClick={onBack}>
              Back to List
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="moments" className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="moments">Moments</TabsTrigger>
          <TabsTrigger value="dna" className="text-purple-600 dark:text-purple-400">
            <Sparkles className="size-3 mr-1" />
            DNA
          </TabsTrigger>
          <TabsTrigger value="scenes" className="text-blue-600 dark:text-blue-400">
            <Play className="size-3 mr-1" />
            Scenes
          </TabsTrigger>
          <TabsTrigger value="beats" className="text-green-600 dark:text-green-400">
            <Film className="size-3 mr-1" />
            Beats
          </TabsTrigger>
          <TabsTrigger value="document" className="text-orange-600 dark:text-orange-400">
            <FileText className="size-3 mr-1" />
            Document
          </TabsTrigger>
          <TabsTrigger value="summary">Analysis</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="moments" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="search">Search</Label>
                  <div className="relative">
                    <Search className="size-4 absolute left-3 top-3 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search moments..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Type Filter</Label>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {Object.entries(momentTypeConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>{config.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Min. Intensity</Label>
                  <Select value={filterIntensity} onValueChange={setFilterIntensity}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Intensities</SelectItem>
                      <SelectItem value="7">High (7+)</SelectItem>
                      <SelectItem value="5">Medium (5+)</SelectItem>
                      <SelectItem value="3">Low (3+)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>View Options</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowHidden(!showHidden)}
                    className="w-full justify-start"
                  >
                    {showHidden ? <Eye className="size-4 mr-2" /> : <EyeOff className="size-4 mr-2" />}
                    {showHidden ? 'Show All' : 'Hide Filtered'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Story Moments List */}
          <ScrollArea className="h-[600px]">
            <div className="space-y-4">
              {filteredMoments.map((moment, displayIndex) => {
                const config = momentTypeConfig[moment.type];
                const Icon = config.icon;
                const isEditing = editingMoment === moment.originalIndex;
                const isHidden = hiddenMoments.has(displayIndex);

                if (isEditing) {
                  return (
                    <MomentEditor
                      key={`edit-${moment.originalIndex}`}
                      moment={moment}
                      onSave={(updatedMoment) => updateMoment(moment.originalIndex, updatedMoment)}
                      onCancel={() => setEditingMoment(null)}
                      onDelete={() => deleteMoment(moment.originalIndex)}
                    />
                  );
                }

                return (
                  <Card key={moment.originalIndex} className={cn(
                    "transition-all",
                    isHidden && "opacity-50",
                    config.borderColor
                  )}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          {/* Header */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Icon className={cn("w-4 h-4", config.color)} />
                              <Badge variant="outline" className="text-xs">
                                {config.label}
                              </Badge>
                              <Badge variant="secondary" className={cn("text-xs", getIntensityColor(moment.intensity))}>
                                Intensity: {moment.intensity}/10
                              </Badge>
                              {moment.timestamp && (
                                <Badge variant="outline" className="text-xs">
                                  {moment.timestamp}
                                </Badge>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => toggleMomentVisibility(displayIndex)}
                              >
                                {isHidden ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingMoment(moment.originalIndex)}
                              >
                                <Edit className="size-3" />
                              </Button>
                            </div>
                          </div>

                          {/* Quote */}
                          <div className={cn("p-3 rounded border-l-4", config.bgColor, config.borderColor)}>
                            <blockquote className="text-sm italic">
                              "{moment.text}"
                            </blockquote>
                          </div>

                          {/* Context */}
                          <div className="text-sm text-muted-foreground">
                            <strong>Context:</strong> {moment.context}
                          </div>

                          {/* Characters */}
                          {moment.characters && moment.characters.length > 0 && (
                            <div className="flex items-center gap-2">
                              <Users className="size-4 text-muted-foreground" />
                              <div className="flex gap-1">
                                {moment.characters.map((character, i) => (
                                  <Badge key={i} variant="outline" className="text-xs">
                                    {character}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Tags */}
                          {moment.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {moment.tags.map((tag, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  #{tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {filteredMoments.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">No story moments match your current filters.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="dna" className="space-y-4">
          <Card className="border-purple-200 dark:border-purple-800">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="size-5 text-purple-600 dark:text-purple-400" />
                <CardTitle className="text-lg">Story DNA</CardTitle>
              </div>
              <CardDescription>
                The foundational one-line summary that drives all subsequent story development
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedStorySummary ? (
                <div className="space-y-4">
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <h4 className="text-sm font-medium text-purple-800 dark:text-purple-200 mb-2">
                      Active Story DNA
                    </h4>
                    <p className="text-purple-900 dark:text-purple-100 font-medium leading-relaxed">
                      "{selectedStorySummary}"
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setShowSummaryGenerator(true)}
                      className="text-purple-600 border-purple-200 hover:bg-purple-50 dark:text-purple-400 dark:border-purple-800 dark:hover:bg-purple-900/20"
                    >
                      <Sparkles className="size-3 mr-2" />
                      Regenerate Options
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <p><strong>Next Steps:</strong> This story DNA will drive character development, plot structure, and thematic elements in subsequent phases.</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Sparkles className="size-12 mx-auto mb-4 text-purple-400" />
                  <h3 className="text-lg font-medium mb-2">Generate Your Story DNA</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Transform your analyzed story moments into a compelling one-line summary that captures the essence of your narrative.
                  </p>
                  <Button 
                    onClick={() => setShowSummaryGenerator(true)}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <Sparkles className="size-4 mr-2" />
                    Generate Story DNA
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Phase 1 Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Phase 1: Foundation</CardTitle>
              <CardDescription>
                Story DNA Generation - The critical first step
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <div className="size-2 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                  <p><strong>Purpose:</strong> Create the foundational narrative essence that drives all subsequent development</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="size-2 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                  <p><strong>Input:</strong> Analyzed story moments from your transcript</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="size-2 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                  <p><strong>Output:</strong> One compelling sentence that captures your story's DNA</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="size-2 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                  <p><strong>Next Phase:</strong> Character development, plot structure, and thematic exploration</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scenes" className="space-y-4">
          <Card className="border-blue-200 dark:border-blue-800">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Play className="size-5 text-blue-600 dark:text-blue-400" />
                <CardTitle className="text-lg">Scene Structure</CardTitle>
              </div>
              <CardDescription>
                Phase 2: Transform your Story DNA into a complete 4-scene narrative arc
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sceneStructure ? (
                <div className="space-y-4">
                  {/* Scene Structure Overview */}
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                      Active Scene Structure ({sceneStructure.scenes?.length || 0} scenes)
                    </h4>
                    <div className="space-y-2">
                      {sceneStructure.scenes?.map((scene: any, index: number) => (
                        <div key={index} className="flex items-center gap-3 text-sm">
                          <Badge variant="outline" className="text-xs">
                            Scene {scene.scene_number}
                          </Badge>
                          <span className="font-medium">{scene.title}</span>
                          <Badge className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                            {scene.pacing}
                          </Badge>
                          <div className={`flex items-center gap-1 text-xs ${scene.tension_level >= 8 ? 'text-red-600' : scene.tension_level >= 6 ? 'text-orange-600' : 'text-green-600'}`}>
                            <Zap className="size-2" />
                            {scene.tension_level}/10
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Arc Analysis */}
                  {sceneStructure.arc_analysis && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <h4 className="font-medium mb-1">Overall Progression</h4>
                        <p className="text-muted-foreground">{sceneStructure.arc_analysis.overall_progression}</p>
                      </div>
                      <div>
                        <h4 className="font-medium mb-1">Escalation Pattern</h4>
                        <p className="text-muted-foreground">{sceneStructure.arc_analysis.escalation_pattern}</p>
                      </div>
                      <div>
                        <h4 className="font-medium mb-1">Resolution Approach</h4>
                        <p className="text-muted-foreground">{sceneStructure.arc_analysis.resolution_approach}</p>
                      </div>
                      <div>
                        <h4 className="font-medium mb-1">Cohesion Strength</h4>
                        <p className="text-muted-foreground">{sceneStructure.arc_analysis.cohesion_strength}/10</p>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setShowSceneGenerator(true)}
                      className="text-blue-600 border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-900/20"
                    >
                      <Play className="size-3 mr-2" />
                      Edit Structure
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <p><strong>Next Phase:</strong> Character development and relationship mapping will build upon this scene foundation.</p>
                  </div>
                </div>
              ) : selectedStorySummary ? (
                <div className="text-center py-8">
                  <Play className="size-12 mx-auto mb-4 text-blue-400" />
                  <h3 className="text-lg font-medium mb-2">Generate Scene Structure</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Transform your Story DNA into a complete 4-scene narrative arc with clear stakes and forward movement.
                  </p>
                  <Button 
                    onClick={() => setShowSceneGenerator(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Play className="size-4 mr-2" />
                    Generate Scene Structure
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="space-y-2 mb-6">
                    <AlertCircle className="size-12 mx-auto text-gray-400" />
                    <h3 className="text-lg font-medium">Story DNA Required</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Complete Phase 1 (Story DNA) before generating your scene structure.
                    </p>
                  </div>
                  <Button 
                    variant="outline"
                    onClick={() => setShowSummaryGenerator(true)}
                  >
                    <Sparkles className="size-4 mr-2" />
                    Go to Story DNA
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Phase 2 Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Phase 2: Structure</CardTitle>
              <CardDescription>
                Scene Structure Generation - Building the narrative backbone
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <div className="size-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <p><strong>Purpose:</strong> Transform Story DNA into a complete 4-scene narrative arc</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="size-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <p><strong>Input:</strong> Story DNA foundation from Phase 1</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="size-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <p><strong>Output:</strong> Four scenes with clear stakes, tension escalation, and cohesive flow</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="size-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <p><strong>Next Phase:</strong> Character development and relationship dynamics</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="beats" className="space-y-4">
          <Card className="border-green-200 dark:border-green-800">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Film className="size-5 text-green-600 dark:text-green-400" />
                <CardTitle className="text-lg">Scene Beat Breakdown</CardTitle>
              </div>
              <CardDescription>
                Phase 3: Transform your scene structure into production-ready beat breakdowns
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sceneBeats ? (
                <div className="space-y-4">
                  {/* Scene Beats Overview */}
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <h4 className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
                      Production-Ready Beat Breakdown ({sceneBeats.scene_breakdowns?.length || 0} scenes, {sceneBeats.production_summary?.total_beats || 0} beats)
                    </h4>
                    <div className="space-y-2">
                      {sceneBeats.scene_breakdowns?.map((scene: any, index: number) => (
                        <div key={index} className="flex items-center gap-3 text-sm">
                          <Badge variant="outline" className="text-xs">
                            Scene {scene.scene_number}
                          </Badge>
                          <span className="font-medium">{scene.scene_title}</span>
                          <Badge className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                            {scene.total_beats} beats
                          </Badge>
                          <div className="flex items-center gap-1 text-xs text-green-600">
                            <Film className="size-2" />
                            Production ready
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Production Summary */}
                  {sceneBeats.production_summary && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <h4 className="font-medium mb-1">Estimated Runtime</h4>
                        <p className="text-muted-foreground">{sceneBeats.production_summary.estimated_runtime}</p>
                      </div>
                      <div>
                        <h4 className="font-medium mb-1">Production Complexity</h4>
                        <p className="text-muted-foreground capitalize">{sceneBeats.production_summary.production_complexity}</p>
                      </div>
                      <div>
                        <h4 className="font-medium mb-1">Key Locations</h4>
                        <p className="text-muted-foreground">{sceneBeats.production_summary.key_locations?.join(', ') || 'None specified'}</p>
                      </div>
                      <div>
                        <h4 className="font-medium mb-1">Character Arcs Tracked</h4>
                        <p className="text-muted-foreground">{Object.keys(sceneBeats.character_tracking?.character_arcs || {}).length} characters</p>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setShowBeatsGenerator(true)}
                      className="text-green-600 border-green-200 hover:bg-green-50 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-900/20"
                    >
                      <Film className="size-3 mr-2" />
                      Edit Beat Breakdown
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <p><strong>Production Ready:</strong> All beats include action descriptions, character states, production notes, and visual elements for immediate filming.</p>
                  </div>
                </div>
              ) : sceneStructure ? (
                <div className="text-center py-8">
                  <Film className="size-12 mx-auto mb-4 text-green-400" />
                  <h3 className="text-lg font-medium mb-2">Generate Beat Breakdown</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Transform your scene structure into detailed, production-ready beat breakdowns with character tracking and visual elements.
                  </p>
                  <Button 
                    onClick={() => setShowBeatsGenerator(true)}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Film className="size-4 mr-2" />
                    Generate Beat Breakdown
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="space-y-2 mb-6">
                    <AlertCircle className="size-12 mx-auto text-gray-400" />
                    <h3 className="text-lg font-medium">Scene Structure Required</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Complete Phase 2 (Scene Structure) before generating beat breakdowns.
                    </p>
                  </div>
                  <Button 
                    variant="outline"
                    onClick={() => setShowSceneGenerator(true)}
                    disabled={!selectedStorySummary}
                  >
                    <Play className="size-4 mr-2" />
                    Go to Scene Structure
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Phase 3 Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Phase 3: Production</CardTitle>
              <CardDescription>
                Beat Breakdown Generation - Making story actionable for production
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <div className="size-2 rounded-full bg-green-500 mt-1.5 shrink-0" />
                  <p><strong>Purpose:</strong> Break scenes into specific, filmable beats with character tracking and production notes</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="size-2 rounded-full bg-green-500 mt-1.5 shrink-0" />
                  <p><strong>Input:</strong> Scene structure foundation from Phase 2</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="size-2 rounded-full bg-green-500 mt-1.5 shrink-0" />
                  <p><strong>Output:</strong> Detailed beat breakdowns with production notes, character states, and visual elements</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="size-2 rounded-full bg-green-500 mt-1.5 shrink-0" />
                  <p><strong>Result:</strong> Production-ready story that can be immediately filmed or performed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="document" className="space-y-4">
          <Card className="border-orange-200 dark:border-orange-800">
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="size-5 text-orange-600 dark:text-orange-400" />
                <CardTitle className="text-lg">Executive Document</CardTitle>
              </div>
              <CardDescription>
                Phase 4: Generate professional network deliverables for executive consumption
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sceneBeats && sceneBeats.is_active ? (
                <div className="space-y-4">
                  {/* Document Status */}
                  <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                    <h4 className="text-sm font-medium text-orange-800 dark:text-orange-200 mb-2 flex items-center gap-2">
                      <FileText className="size-4" />
                      Ready for Executive Document Generation
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center gap-2">
                          <div className="size-2 rounded-full bg-orange-500" />
                          <span>All phases complete and validated</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="size-2 rounded-full bg-orange-500" />
                          <span>Production-ready content available</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="size-2 rounded-full bg-orange-500" />
                          <span>Export formats: PDF & DOCX</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Document Features Preview */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h4 className="font-medium mb-2">Executive Package Includes:</h4>
                      <ul className="space-y-1 text-muted-foreground">
                        <li>• One-page executive summary with Story DNA</li>
                        <li>• Market positioning and comparable projects</li>
                        <li>• Production budget and schedule estimates</li>
                        <li>• Character development and casting notes</li>
                        <li>• Complete scene structure breakdown</li>
                        <li>• Appendix with detailed beat-by-beat notes</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Professional Features:</h4>
                      <ul className="space-y-1 text-muted-foreground">
                        <li>• Industry-standard formatting for network review</li>
                        <li>• Producer notes with commercial analysis</li>
                        <li>• Location requirements and crew estimates</li>
                        <li>• Target demographic and market analysis</li>
                        <li>• Unique selling points and differentiation</li>
                        <li>• Ready for immediate pitch and development</li>
                      </ul>
                    </div>
                  </div>

                  {/* Key Metrics Preview */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded">
                      <div className="font-medium text-lg">{sceneBeats.scene_breakdowns?.length || 0}</div>
                      <div className="text-muted-foreground">Scenes</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded">
                      <div className="font-medium text-lg">{sceneBeats.production_summary?.total_beats || 0}</div>
                      <div className="text-muted-foreground">Total Beats</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded">
                      <div className="font-medium text-lg capitalize">{sceneBeats.production_summary?.production_complexity || 'Medium'}</div>
                      <div className="text-muted-foreground">Complexity</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded">
                      <div className="font-medium text-lg">{sceneBeats.production_summary?.estimated_runtime || 'TBD'}</div>
                      <div className="text-muted-foreground">Runtime</div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4 border-t">
                    <Button 
                      onClick={() => setShowDocumentGenerator(true)}
                      className="bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      <FileText className="size-4 mr-2" />
                      Generate Executive Document
                    </Button>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    <p><strong>Network Ready:</strong> This document is formatted for immediate executive review, containing all necessary information for development decisions and network pitches.</p>
                  </div>
                </div>
              ) : sceneStructure && sceneStructure.is_active ? (
                <div className="text-center py-8">
                  <div className="space-y-2 mb-6">
                    <AlertCircle className="size-12 mx-auto text-gray-400" />
                    <h3 className="text-lg font-medium">Scene Beats Required</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Complete Phase 3 (Scene Beat Breakdown) before generating executive documents.
                    </p>
                  </div>
                  <Button 
                    variant="outline"
                    onClick={() => setShowBeatsGenerator(true)}
                  >
                    <Film className="size-4 mr-2" />
                    Go to Beat Breakdown
                  </Button>
                </div>
              ) : selectedStorySummary ? (
                <div className="text-center py-8">
                  <div className="space-y-2 mb-6">
                    <AlertCircle className="size-12 mx-auto text-gray-400" />
                    <h3 className="text-lg font-medium">Scene Structure Required</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Complete Phase 2 (Scene Structure) before generating executive documents.
                    </p>
                  </div>
                  <Button 
                    variant="outline"
                    onClick={() => setShowSceneGenerator(true)}
                  >
                    <Play className="size-4 mr-2" />
                    Go to Scene Structure
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="space-y-2 mb-6">
                    <AlertCircle className="size-12 mx-auto text-gray-400" />
                    <h3 className="text-lg font-medium">Story DNA Required</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Complete all previous phases before generating executive documents.
                    </p>
                  </div>
                  <Button 
                    variant="outline"
                    onClick={() => setShowSummaryGenerator(true)}
                  >
                    <Sparkles className="size-4 mr-2" />
                    Start with Story DNA
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Phase 4 Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Phase 4: Network Deliverable</CardTitle>
              <CardDescription>
                Executive Document Generation - Professional network-ready content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <div className="size-2 rounded-full bg-orange-500 mt-1.5 shrink-0" />
                  <p><strong>Purpose:</strong> Transform complete story development into executive-consumable deliverables</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="size-2 rounded-full bg-orange-500 mt-1.5 shrink-0" />
                  <p><strong>Input:</strong> All phases (Story DNA, Scene Structure, Beat Breakdown)</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="size-2 rounded-full bg-orange-500 mt-1.5 shrink-0" />
                  <p><strong>Output:</strong> Professional documents (PDF/DOCX) with market analysis and production planning</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="size-2 rounded-full bg-orange-500 mt-1.5 shrink-0" />
                  <p><strong>Result:</strong> Network-ready packages for executive review and development decisions</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Story Potential</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Overall Rating</span>
                    <span className="font-semibold">{analysis.summary.story_potential}/10</span>
                  </div>
                  <Progress value={analysis.summary.story_potential * 10} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Moment Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(momentsByType).map(([type, moments]) => {
                    const config = momentTypeConfig[type as keyof typeof momentTypeConfig];
                    const percentage = (moments.length / analysis.moments.length) * 100;
                    return (
                      <div key={type} className="flex justify-between items-center text-sm">
                        <span className="flex items-center gap-2">
                          <config.icon className={cn("w-3 h-3", config.color)} />
                          {config.label}
                        </span>
                        <span>{moments.length} ({percentage.toFixed(0)}%)</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Main Themes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {analysis.summary.main_themes.map((theme, i) => (
                    <Badge key={i} variant="outline">{theme}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Key Characters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {analysis.summary.key_characters.map((character, i) => (
                    <Badge key={i} variant="secondary">{character}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-sm">Emotional Arc</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{analysis.summary.emotional_arc}</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Genre Indicators</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {analysis.summary.genre_indicators.map((indicator, i) => (
                  <Badge key={i} variant="outline">{indicator}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Story Structure Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">High-Intensity Moments</h4>
                  <p className="text-sm text-muted-foreground">
                    {analysis.moments.filter(m => m.intensity >= 7).length} moments with intensity 7+ suggest strong dramatic potential.
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2">Character Development</h4>
                  <p className="text-sm text-muted-foreground">
                    {analysis.moments.filter(m => m.type === 'character_development').length} character development moments indicate rich character arcs.
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2">Conflict Density</h4>
                  <p className="text-sm text-muted-foreground">
                    {((analysis.moments.filter(m => m.type === 'conflict').length / analysis.moments.length) * 100).toFixed(0)}% of moments are conflicts, suggesting good dramatic tension.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Living Story Notification */}
      <LivingStoryNotification
        transcriptId={transcriptId}
        onOpenManager={() => setShowLivingStoryManager(true)}
        onPhaseUpdated={(phase) => {
          // Refresh affected phase data
          if (phase === 1) loadStorySummary();
          if (phase === 2) loadSceneStructure();
          if (phase === 3) loadSceneBeats();
        }}
      />
    </div>
  );
}

// Moment Editor Component
interface MomentEditorProps {
  moment: StoryMoment;
  onSave: (moment: StoryMoment) => void;
  onCancel: () => void;
  onDelete: () => void;
}

function MomentEditor({ moment, onSave, onCancel, onDelete }: MomentEditorProps) {
  const [editedMoment, setEditedMoment] = useState<StoryMoment>(moment);

  const handleSave = () => {
    onSave(editedMoment);
  };

  return (
    <Card className="border-blue-200 dark:border-blue-800">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Edit className="size-4 text-blue-500" />
          Edit Story Moment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Type</Label>
            <Select 
              value={editedMoment.type} 
              onValueChange={(value) => setEditedMoment(prev => ({ ...prev, type: value as any }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(momentTypeConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Intensity (1-10)</Label>
            <Input
              type="number"
              min="1"
              max="10"
              value={editedMoment.intensity}
              onChange={(e) => setEditedMoment(prev => ({ ...prev, intensity: parseInt(e.target.value) || 1 }))}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Quote/Text</Label>
          <Textarea
            value={editedMoment.text}
            onChange={(e) => setEditedMoment(prev => ({ ...prev, text: e.target.value }))}
            placeholder="The exact quote or passage..."
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label>Context</Label>
          <Textarea
            value={editedMoment.context}
            onChange={(e) => setEditedMoment(prev => ({ ...prev, context: e.target.value }))}
            placeholder="Why this moment is significant..."
            rows={2}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Characters (comma-separated)</Label>
            <Input
              value={editedMoment.characters?.join(', ') || ''}
              onChange={(e) => setEditedMoment(prev => ({ 
                ...prev, 
                characters: e.target.value ? e.target.value.split(',').map(s => s.trim()) : []
              }))}
              placeholder="Character names..."
            />
          </div>
          <div className="space-y-2">
            <Label>Tags (comma-separated)</Label>
            <Input
              value={editedMoment.tags.join(', ')}
              onChange={(e) => setEditedMoment(prev => ({ 
                ...prev, 
                tags: e.target.value ? e.target.value.split(',').map(s => s.trim()) : []
              }))}
              placeholder="emotion, genre, etc..."
            />
          </div>
        </div>

        <div className="flex gap-2 pt-4 border-t">
          <Button onClick={handleSave} size="sm">
            <Save className="size-3 mr-2" />
            Save
          </Button>
          <Button variant="outline" onClick={onCancel} size="sm">
            <X className="size-3 mr-2" />
            Cancel
          </Button>
          <Button variant="destructive" onClick={onDelete} size="sm" className="ml-auto">
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}