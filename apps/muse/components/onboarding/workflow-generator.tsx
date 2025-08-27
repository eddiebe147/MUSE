'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { 
  Workflow,
  Target,
  Clock,
  Users,
  Lightbulb,
  CheckCircle,
  Settings,
  ArrowRight,
  Play,
  Calendar,
  FileText,
  Film,
  Sparkles,
  Zap,
  Brain,
  Star,
  Timer,
  Flag
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { FadeIn, Stagger, HoverScale, Pulse } from '../ui/micro-interactions';
import { ProfessionalCard, StatusIndicator, QualityScore, InsightCard } from '../ui/design-system';
import { ProjectType, SubCategory } from './project-type-selector';

interface WorkflowPhase {
  id: string;
  name: string;
  description: string;
  estimatedTime: string;
  tools: string[];
  deliverables: string[];
  aiAssistance: string[];
  dependencies?: string[];
  isOptional?: boolean;
}

interface PersonalizedWorkflow {
  id: string;
  name: string;
  description: string;
  totalEstimatedTime: string;
  phases: WorkflowPhase[];
  customizations: {
    experienceLevel: 'beginner' | 'intermediate' | 'advanced';
    timeCommitment: 'light' | 'moderate' | 'intensive';
    focusAreas: string[];
    aiAutomation: number; // 0-100%
  };
  insights: {
    strengths: string[];
    challenges: string[];
    recommendations: string[];
  };
}

interface WorkflowGeneratorProps {
  projectType: ProjectType;
  subcategory: SubCategory;
  selectedTemplate?: any;
  materialAnalysis?: any;
  onWorkflowComplete: (workflow: PersonalizedWorkflow) => void;
  onBack?: () => void;
  className?: string;
}

export function PersonalizedWorkflowGenerator({
  projectType,
  subcategory,
  selectedTemplate,
  materialAnalysis,
  onWorkflowComplete,
  onBack,
  className
}: WorkflowGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [workflow, setWorkflow] = useState<PersonalizedWorkflow | null>(null);
  const [showCustomization, setShowCustomization] = useState(false);
  
  // Customization options
  const [experienceLevel, setExperienceLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [timeCommitment, setTimeCommitment] = useState<'light' | 'moderate' | 'intensive'>('moderate');
  const [focusAreas, setFocusAreas] = useState<string[]>(['story_development', 'character_development']);
  const [aiAutomation, setAiAutomation] = useState([70]);

  const focusAreaOptions = [
    { id: 'story_development', name: 'Story Development', icon: <FileText className="size-4" /> },
    { id: 'character_development', name: 'Character Development', icon: <Users className="size-4" /> },
    { id: 'world_building', name: 'World Building', icon: <Film className="size-4" /> },
    { id: 'dialogue_writing', name: 'Dialogue Writing', icon: <Sparkles className="size-4" /> },
    { id: 'scene_crafting', name: 'Scene Crafting', icon: <Target className="size-4" /> },
    { id: 'pacing_structure', name: 'Pacing & Structure', icon: <Timer className="size-4" /> }
  ];

  const toggleFocusArea = (areaId: string) => {
    setFocusAreas(prev => 
      prev.includes(areaId) 
        ? prev.filter(id => id !== areaId)
        : [...prev, areaId]
    );
  };

  const generateWorkflow = async () => {
    setIsGenerating(true);
    setGenerationProgress(0);
    
    const steps = [
      'Analyzing project requirements...',
      'Mapping optimal development phases...',
      'Customizing for your experience level...',
      'Integrating AI assistance tools...',
      'Optimizing timeline and deliverables...',
      'Finalizing personalized workflow...'
    ];

    for (let i = 0; i < steps.length; i++) {
      setCurrentStep(steps[i]);
      setGenerationProgress((i + 1) * 16.67);
      await new Promise(resolve => setTimeout(resolve, 700));
    }

    // Generate personalized workflow based on selections
    const generatedWorkflow: PersonalizedWorkflow = {
      id: `workflow_${Date.now()}`,
      name: `${subcategory.name} Development Workflow`,
      description: `Personalized ${projectType.name.toLowerCase()} development process optimized for your goals and experience level`,
      totalEstimatedTime: calculateTotalTime(),
      phases: generatePhases(),
      customizations: {
        experienceLevel,
        timeCommitment,
        focusAreas,
        aiAutomation: aiAutomation[0]
      },
      insights: {
        strengths: [
          `Optimized for ${experienceLevel} writers with ${timeCommitment} time commitment`,
          `${aiAutomation[0]}% AI automation reduces manual work by approximately ${Math.round(aiAutomation[0] * 0.3)} hours`,
          `Focus on ${focusAreas.length} key areas ensures targeted skill development`
        ],
        challenges: [
          experienceLevel === 'beginner' ? 'Learning curve for industry-standard formatting and conventions' : 'Maintaining creative originality while following genre conventions',
          timeCommitment === 'light' ? 'Limited time may require extending development timeline' : 'Intensive schedule requires strong time management',
          `Complex ${subcategory.name.toLowerCase()} format requires attention to ${getGenreSpecificChallenges()}`
        ],
        recommendations: [
          `Start with Phase 1 (${generatePhases()[0]?.name}) to establish foundation`,
          `Use AI assistance at ${aiAutomation[0]}% to maintain creative control while boosting productivity`,
          `Focus heavily on ${focusAreas.map(id => focusAreaOptions.find(opt => opt.id === id)?.name).slice(0, 2).join(' and ')} for maximum impact`
        ]
      }
    };

    setWorkflow(generatedWorkflow);
    setIsGenerating(false);
    setGenerationProgress(100);
  };

  const calculateTotalTime = (): string => {
    const baseHours = {
      light: { beginner: 20, intermediate: 15, advanced: 12 },
      moderate: { beginner: 35, intermediate: 28, advanced: 22 },
      intensive: { beginner: 50, intermediate: 40, advanced: 30 }
    };
    
    const hours = baseHours[timeCommitment][experienceLevel];
    const automationReduction = (aiAutomation[0] / 100) * 0.3;
    const finalHours = Math.max(hours * (1 - automationReduction), hours * 0.6);
    
    if (finalHours < 20) return `${Math.round(finalHours)} hours`;
    if (finalHours < 80) return `${Math.round(finalHours / 8)} days`;
    return `${Math.round(finalHours / 40)} weeks`;
  };

  const getGenreSpecificChallenges = (): string => {
    const challenges = {
      'Reality TV': 'authentic character dynamics and competition balance',
      'Drama Series': 'serialized storytelling and character arcs',
      'Feature Film': 'three-act structure and pacing',
      'Novel/Fiction': 'narrative voice and character development',
      'Interactive Fiction': 'branching storylines and player agency'
    };
    
    return challenges[subcategory.name as keyof typeof challenges] || 'genre-specific formatting and conventions';
  };

  const generatePhases = (): WorkflowPhase[] => {
    const basePhases: WorkflowPhase[] = [
      {
        id: 'foundation',
        name: 'Foundation & Planning',
        description: 'Establish core story elements and development plan',
        estimatedTime: experienceLevel === 'beginner' ? '6-8 hours' : experienceLevel === 'intermediate' ? '4-6 hours' : '3-4 hours',
        tools: ['Story DNA Generator', 'Character Profiler', 'World Builder'],
        deliverables: ['Story concept', 'Character outlines', 'Development timeline'],
        aiAssistance: ['Automated story analysis', 'Character archetype suggestions', 'Genre convention guidance']
      },
      {
        id: 'structure',
        name: 'Structure & Outline',
        description: 'Build detailed story structure and scene breakdown',
        estimatedTime: experienceLevel === 'beginner' ? '8-12 hours' : experienceLevel === 'intermediate' ? '6-8 hours' : '4-6 hours',
        tools: ['Scene Structure Generator', 'Beat Sheet Creator', 'Timeline Manager'],
        deliverables: ['Complete outline', 'Scene breakdown', 'Plot progression'],
        aiAssistance: ['Structure optimization', 'Pacing analysis', 'Plot hole detection'],
        dependencies: ['foundation']
      },
      {
        id: 'development',
        name: 'Content Development',
        description: 'Create detailed scenes, dialogue, and narrative content',
        estimatedTime: timeCommitment === 'light' ? '12-20 hours' : timeCommitment === 'moderate' ? '15-25 hours' : '20-30 hours',
        tools: ['Scene Writer', 'Dialogue Generator', 'Content Polisher'],
        deliverables: ['Draft scenes', 'Character dialogue', 'Narrative content'],
        aiAssistance: ['Dialogue enhancement', 'Scene transitions', 'Style consistency'],
        dependencies: ['structure']
      },
      {
        id: 'polish',
        name: 'Polish & Refinement',
        description: 'Review, edit, and finalize your content',
        estimatedTime: experienceLevel === 'advanced' ? '3-5 hours' : '5-8 hours',
        tools: ['Content Analyzer', 'Format Checker', 'Quality Reviewer'],
        deliverables: ['Polished draft', 'Format compliance', 'Quality report'],
        aiAssistance: ['Grammar and style checking', 'Format optimization', 'Final review'],
        dependencies: ['development']
      }
    ];

    // Add optional phases based on focus areas
    if (focusAreas.includes('world_building')) {
      basePhases.splice(1, 0, {
        id: 'world_building',
        name: 'World Building',
        description: 'Develop rich, consistent world details and background',
        estimatedTime: '4-6 hours',
        tools: ['World Builder', 'Location Manager', 'Culture Creator'],
        deliverables: ['World bible', 'Location descriptions', 'Cultural details'],
        aiAssistance: ['World consistency checking', 'Detail generation', 'Research assistance'],
        isOptional: true
      });
    }

    return basePhases;
  };

  useEffect(() => {
    if (!workflow && !isGenerating && !showCustomization) {
      generateWorkflow();
    }
  }, []);

  if (isGenerating) {
    return (
      <FadeIn className={className}>
        <ProfessionalCard variant="feature" className="max-w-2xl mx-auto">
          <CardContent className="py-12">
            <div className="text-center space-y-6">
              <div className="flex items-center justify-center">
                <div className="p-4 bg-indigo-100 dark:bg-indigo-900/30 rounded-full">
                  <Workflow className="size-8 text-indigo-600 animate-pulse" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Creating Your Workflow</h3>
                <p className="text-muted-foreground">
                  Generating a personalized development process just for you
                </p>
              </div>

              <div className="space-y-4">
                <Progress value={generationProgress} className="w-full" />
                <div className="flex items-center justify-center gap-2">
                  <Pulse size="sm" />
                  <span className="text-sm text-muted-foreground">{currentStep}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </ProfessionalCard>
      </FadeIn>
    );
  }

  if (showCustomization) {
    return (
      <FadeIn className={className}>
        <div className="space-y-6">
          {/* Header */}
          <ProfessionalCard variant="feature">
            <CardContent className="py-6">
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center">
                  <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-full">
                    <Settings className="size-6 text-indigo-600" />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Customize Your Workflow</h2>
                  <p className="text-muted-foreground">
                    Tailor the development process to your experience and goals
                  </p>
                </div>
              </div>
            </CardContent>
          </ProfessionalCard>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Experience Level */}
            <ProfessionalCard>
              <CardHeader>
                <CardTitle>Experience Level</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(['beginner', 'intermediate', 'advanced'] as const).map((level) => (
                  <div 
                    key={level}
                    className={cn(
                      "p-3 rounded-lg border cursor-pointer transition-all",
                      experienceLevel === level 
                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20" 
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                    )}
                    onClick={() => setExperienceLevel(level)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium capitalize">{level}</span>
                      <div className={cn(
                        "w-4 h-4 rounded-full border-2",
                        experienceLevel === level 
                          ? "border-indigo-500 bg-indigo-500" 
                          : "border-gray-300"
                      )} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </ProfessionalCard>

            {/* Time Commitment */}
            <ProfessionalCard>
              <CardHeader>
                <CardTitle>Time Commitment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(['light', 'moderate', 'intensive'] as const).map((commitment) => (
                  <div 
                    key={commitment}
                    className={cn(
                      "p-3 rounded-lg border cursor-pointer transition-all",
                      timeCommitment === commitment 
                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20" 
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                    )}
                    onClick={() => setTimeCommitment(commitment)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium capitalize">{commitment}</span>
                      <div className={cn(
                        "w-4 h-4 rounded-full border-2",
                        timeCommitment === commitment 
                          ? "border-indigo-500 bg-indigo-500" 
                          : "border-gray-300"
                      )} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </ProfessionalCard>

            {/* Focus Areas */}
            <ProfessionalCard className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Focus Areas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {focusAreaOptions.map((area) => (
                    <div 
                      key={area.id}
                      className={cn(
                        "p-3 rounded-lg border cursor-pointer transition-all flex items-center gap-2",
                        focusAreas.includes(area.id)
                          ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20" 
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                      )}
                      onClick={() => toggleFocusArea(area.id)}
                    >
                      {area.icon}
                      <span className="text-sm font-medium">{area.name}</span>
                      {focusAreas.includes(area.id) && (
                        <CheckCircle className="size-4 text-indigo-600 ml-auto" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </ProfessionalCard>

            {/* AI Automation Level */}
            <ProfessionalCard className="lg:col-span-2">
              <CardHeader>
                <CardTitle>AI Automation Level</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Manual Control</span>
                    <span>{aiAutomation[0]}% AI Assistance</span>
                    <span>Full Automation</span>
                  </div>
                  <Slider
                    value={aiAutomation}
                    onValueChange={setAiAutomation}
                    max={100}
                    min={0}
                    step={10}
                    className="w-full"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Higher automation speeds up development but reduces creative control
                </p>
              </CardContent>
            </ProfessionalCard>
          </div>

          {/* Actions */}
          <div className="flex justify-center gap-4">
            <Button variant="outline" onClick={() => setShowCustomization(false)}>
              Use Defaults
            </Button>
            <Button onClick={generateWorkflow}>
              Generate Workflow
              <ArrowRight className="size-4 ml-2" />
            </Button>
          </div>
        </div>
      </FadeIn>
    );
  }

  if (!workflow) {
    return (
      <FadeIn className={className}>
        <div className="text-center py-12">
          <Button onClick={() => setShowCustomization(true)}>
            Customize Workflow
          </Button>
        </div>
      </FadeIn>
    );
  }

  return (
    <FadeIn className={className}>
      <div className="space-y-6">
        {/* Workflow Header */}
        <ProfessionalCard variant="feature">
          <CardContent className="py-8">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center">
                <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-full">
                  <CheckCircle className="size-8 text-green-600" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold">{workflow.name}</h1>
                <p className="text-lg text-muted-foreground">
                  {workflow.description}
                </p>
              </div>
              <div className="flex items-center justify-center gap-4">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="size-4" />
                  {workflow.totalEstimatedTime}
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Target className="size-4" />
                  {workflow.phases.length} Phases
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Zap className="size-4" />
                  {workflow.customizations.aiAutomation}% AI
                </Badge>
              </div>
            </div>
          </CardContent>
        </ProfessionalCard>

        {/* Workflow Phases */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Development Phases</h3>
          <Stagger>
            {workflow.phases.map((phase, index) => (
              <HoverScale key={phase.id}>
                <ProfessionalCard className={cn(
                  phase.isOptional && "border-dashed border-yellow-300 dark:border-yellow-700"
                )}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center size-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-full text-sm font-semibold text-indigo-600">
                          {index + 1}
                        </div>
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {phase.name}
                            {phase.isOptional && (
                              <Badge variant="outline" className="text-xs">Optional</Badge>
                            )}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">{phase.description}</p>
                        </div>
                      </div>
                      <Badge variant="secondary">{phase.estimatedTime}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <h5 className="font-medium mb-2 flex items-center gap-1">
                          <Settings className="size-4" />
                          Tools
                        </h5>
                        <div className="space-y-1">
                          {phase.tools.map((tool) => (
                            <Badge key={tool} variant="outline" className="text-xs mr-1 mb-1">
                              {tool}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h5 className="font-medium mb-2 flex items-center gap-1">
                          <Flag className="size-4" />
                          Deliverables
                        </h5>
                        <ul className="text-sm space-y-1">
                          {phase.deliverables.map((deliverable) => (
                            <li key={deliverable} className="flex items-center gap-2">
                              <div className="size-1.5 bg-indigo-600 rounded-full" />
                              {deliverable}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h5 className="font-medium mb-2 flex items-center gap-1">
                          <Brain className="size-4" />
                          AI Assistance
                        </h5>
                        <ul className="text-sm space-y-1">
                          {phase.aiAssistance.map((assistance) => (
                            <li key={assistance} className="flex items-center gap-2">
                              <Sparkles className="size-3 text-yellow-600" />
                              {assistance}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </ProfessionalCard>
              </HoverScale>
            ))}
          </Stagger>
        </div>

        {/* Workflow Insights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InsightCard
            title="Workflow Strength"
            content={workflow.insights.strengths[0]}
            icon={<Star className="size-5 text-yellow-600" />}
            variant="warning"
          />
          <InsightCard
            title="Challenge to Watch"
            content={workflow.insights.challenges[0]}
            icon={<Target className="size-5 text-red-600" />}
            variant="destructive"
          />
          <InsightCard
            title="Key Recommendation"
            content={workflow.insights.recommendations[0]}
            icon={<Lightbulb className="size-5 text-green-600" />}
            variant="success"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-center gap-4">
          <Button variant="outline" onClick={() => setShowCustomization(true)}>
            Customize Further
          </Button>
          <Button onClick={() => onWorkflowComplete(workflow)} size="lg">
            <Play className="size-5 mr-2" />
            Start Development
          </Button>
        </div>
      </div>
    </FadeIn>
  );
}