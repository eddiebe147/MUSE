'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { 
  Settings,
  Palette,
  Users,
  Clock,
  Target,
  Lightbulb,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Plus,
  Minus,
  Edit,
  Save,
  RotateCcw,
  Sparkles,
  Film,
  BookOpen,
  Tv,
  Gamepad2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { FadeIn, Stagger, HoverScale } from '../ui/micro-interactions';
import { ProfessionalCard, StatusIndicator, QualityScore } from '../ui/design-system';

interface TemplateSection {
  id: string;
  name: string;
  description: string;
  required: boolean;
  estimatedTime: string;
  aiAssistance: boolean;
  customizable: boolean;
  order: number;
}

interface TemplateCustomization {
  id: string;
  name: string;
  description: string;
  sections: TemplateSection[];
  settings: {
    duration: number; // minutes
    complexity: 'simple' | 'moderate' | 'complex';
    aiAutomation: number; // 0-100%
    focusAreas: string[];
    targetAudience: string;
    genre?: string;
    format?: string;
  };
}

interface TemplateCustomizerProps {
  originalTemplate: any;
  projectType: any;
  subcategory: any;
  onCustomizationComplete: (customizedTemplate: TemplateCustomization) => void;
  onCancel?: () => void;
  className?: string;
}

export function TemplateCustomizer({
  originalTemplate,
  projectType,
  subcategory,
  onCustomizationComplete,
  onCancel,
  className
}: TemplateCustomizerProps) {
  const [customization, setCustomization] = useState<TemplateCustomization>({
    id: `customized_${originalTemplate.id}_${Date.now()}`,
    name: originalTemplate.name,
    description: originalTemplate.description,
    sections: originalTemplate.sections?.map((section: any, index: number) => ({
      ...section,
      order: index,
      aiAssistance: true,
      customizable: true
    })) || getDefaultSections(),
    settings: {
      duration: originalTemplate.estimatedDuration || 120,
      complexity: 'moderate',
      aiAutomation: 70,
      focusAreas: ['story_structure', 'character_development'],
      targetAudience: originalTemplate.targetAudience || 'General',
      genre: subcategory.name,
      format: projectType.name
    }
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  function getDefaultSections(): TemplateSection[] {
    const baseSections = [
      {
        id: 'concept',
        name: 'Concept Development',
        description: 'Core idea and premise development',
        required: true,
        estimatedTime: '30-45 minutes',
        aiAssistance: true,
        customizable: false,
        order: 0
      },
      {
        id: 'characters',
        name: 'Character Profiles',
        description: 'Main character development and arcs',
        required: true,
        estimatedTime: '45-60 minutes',
        aiAssistance: true,
        customizable: true,
        order: 1
      },
      {
        id: 'structure',
        name: 'Story Structure',
        description: 'Plot outline and pacing',
        required: true,
        estimatedTime: '60-90 minutes',
        aiAssistance: true,
        customizable: true,
        order: 2
      },
      {
        id: 'scenes',
        name: 'Scene Development',
        description: 'Detailed scene breakdown',
        required: false,
        estimatedTime: '90-120 minutes',
        aiAssistance: true,
        customizable: true,
        order: 3
      }
    ];

    // Add format-specific sections
    if (subcategory.name.includes('Reality')) {
      baseSections.push({
        id: 'casting',
        name: 'Casting Strategy',
        description: 'Contestant types and dynamics',
        required: true,
        estimatedTime: '30-45 minutes',
        aiAssistance: true,
        customizable: true,
        order: 4
      });
    }

    if (subcategory.name.includes('Feature')) {
      baseSections.push({
        id: 'treatment',
        name: 'Treatment Writing',
        description: 'Professional treatment document',
        required: false,
        estimatedTime: '120-180 minutes',
        aiAssistance: true,
        customizable: true,
        order: 4
      });
    }

    return baseSections;
  }

  const updateSetting = useCallback((key: string, value: any) => {
    setCustomization(prev => ({
      ...prev,
      settings: { ...prev.settings, [key]: value }
    }));
    setHasChanges(true);
  }, []);

  const updateSection = useCallback((sectionId: string, updates: Partial<TemplateSection>) => {
    setCustomization(prev => ({
      ...prev,
      sections: prev.sections.map(section =>
        section.id === sectionId ? { ...section, ...updates } : section
      )
    }));
    setHasChanges(true);
  }, []);

  const addSection = useCallback(() => {
    const newSection: TemplateSection = {
      id: `custom_${Date.now()}`,
      name: 'Custom Section',
      description: 'Add your own development step',
      required: false,
      estimatedTime: '30-45 minutes',
      aiAssistance: true,
      customizable: true,
      order: customization.sections.length
    };
    
    setCustomization(prev => ({
      ...prev,
      sections: [...prev.sections, newSection]
    }));
    setHasChanges(true);
  }, [customization.sections.length]);

  const removeSection = useCallback((sectionId: string) => {
    setCustomization(prev => ({
      ...prev,
      sections: prev.sections.filter(section => section.id !== sectionId)
        .map((section, index) => ({ ...section, order: index }))
    }));
    setHasChanges(true);
  }, []);

  const reorderSection = useCallback((sectionId: string, direction: 'up' | 'down') => {
    setCustomization(prev => {
      const sections = [...prev.sections];
      const currentIndex = sections.findIndex(s => s.id === sectionId);
      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      
      if (newIndex >= 0 && newIndex < sections.length) {
        [sections[currentIndex], sections[newIndex]] = [sections[newIndex], sections[currentIndex]];
        sections.forEach((section, index) => {
          section.order = index;
        });
      }
      
      return { ...prev, sections };
    });
    setHasChanges(true);
  }, []);

  const resetToOriginal = useCallback(() => {
    setCustomization({
      id: `customized_${originalTemplate.id}_${Date.now()}`,
      name: originalTemplate.name,
      description: originalTemplate.description,
      sections: originalTemplate.sections?.map((section: any, index: number) => ({
        ...section,
        order: index,
        aiAssistance: true,
        customizable: true
      })) || getDefaultSections(),
      settings: {
        duration: originalTemplate.estimatedDuration || 120,
        complexity: 'moderate',
        aiAutomation: 70,
        focusAreas: ['story_structure', 'character_development'],
        targetAudience: originalTemplate.targetAudience || 'General',
        genre: subcategory.name,
        format: projectType.name
      }
    });
    setHasChanges(false);
  }, [originalTemplate, subcategory.name, projectType.name]);

  const handleSave = useCallback(() => {
    onCustomizationComplete(customization);
  }, [customization, onCustomizationComplete]);

  const totalEstimatedTime = customization.sections.reduce((total, section) => {
    const timeRange = section.estimatedTime.match(/(\d+)-(\d+)/);
    if (timeRange) {
      const avgTime = (parseInt(timeRange[1]) + parseInt(timeRange[2])) / 2;
      return total + avgTime;
    }
    return total + 45; // default
  }, 0);

  const focusAreaOptions = [
    'story_structure',
    'character_development', 
    'dialogue_writing',
    'world_building',
    'pacing',
    'theme_development'
  ];

  return (
    <FadeIn className={className}>
      <div className="space-y-6">
        {/* Header */}
        <ProfessionalCard variant="feature">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                  <Settings className="size-6 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Customize Template</h2>
                  <p className="text-muted-foreground">
                    Tailor "{originalTemplate.name}" to your specific needs
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {hasChanges && (
                  <Badge variant="outline" className="text-yellow-600">
                    <Edit className="size-3 mr-1" />
                    Unsaved Changes
                  </Badge>
                )}
                <QualityScore 
                  score={Math.round((customization.sections.filter(s => s.required).length / customization.sections.length) * 100)}
                  label="Completeness"
                />
              </div>
            </div>
          </CardContent>
        </ProfessionalCard>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Settings Panel */}
          <div className="lg:col-span-1 space-y-6">
            <ProfessionalCard>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="size-5 text-indigo-600" />
                  Template Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Basic Settings */}
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Template Name</label>
                    <Input
                      value={customization.name}
                      onChange={(e) => setCustomization(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter template name"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Description</label>
                    <Textarea
                      value={customization.description}
                      onChange={(e) => setCustomization(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe your customized template"
                      rows={3}
                    />
                  </div>
                </div>

                {/* Complexity */}
                <div>
                  <label className="text-sm font-medium mb-3 block">Complexity Level</label>
                  <div className="space-y-2">
                    {(['simple', 'moderate', 'complex'] as const).map((level) => (
                      <div 
                        key={level}
                        className={cn(
                          "p-3 rounded-lg border cursor-pointer transition-all",
                          customization.settings.complexity === level 
                            ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20" 
                            : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                        )}
                        onClick={() => updateSetting('complexity', level)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium capitalize">{level}</span>
                          <div className={cn(
                            "w-4 h-4 rounded-full border-2",
                            customization.settings.complexity === level 
                              ? "border-indigo-500 bg-indigo-500" 
                              : "border-gray-300"
                          )} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Automation */}
                <div>
                  <label className="text-sm font-medium mb-3 block">
                    AI Automation: {customization.settings.aiAutomation}%
                  </label>
                  <Slider
                    value={[customization.settings.aiAutomation]}
                    onValueChange={([value]) => updateSetting('aiAutomation', value)}
                    max={100}
                    min={0}
                    step={10}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Manual</span>
                    <span>Automated</span>
                  </div>
                </div>

                {/* Advanced Settings Toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Advanced Settings</span>
                  <Switch 
                    checked={showAdvanced}
                    onCheckedChange={setShowAdvanced}
                  />
                </div>

                {/* Advanced Settings */}
                {showAdvanced && (
                  <FadeIn>
                    <div className="space-y-4 pt-4 border-t">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Target Audience</label>
                        <Input
                          value={customization.settings.targetAudience}
                          onChange={(e) => updateSetting('targetAudience', e.target.value)}
                          placeholder="e.g., Young Adults, General Audience"
                        />
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium mb-2 block">Focus Areas</label>
                        <div className="grid grid-cols-2 gap-2">
                          {focusAreaOptions.map((area) => (
                            <div
                              key={area}
                              className={cn(
                                "p-2 rounded border text-xs cursor-pointer transition-all",
                                customization.settings.focusAreas.includes(area)
                                  ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                                  : "border-gray-200 dark:border-gray-700"
                              )}
                              onClick={() => {
                                const newFocusAreas = customization.settings.focusAreas.includes(area)
                                  ? customization.settings.focusAreas.filter(f => f !== area)
                                  : [...customization.settings.focusAreas, area];
                                updateSetting('focusAreas', newFocusAreas);
                              }}
                            >
                              {area.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </FadeIn>
                )}

                {/* Summary */}
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                  <h4 className="font-medium mb-2">Template Summary</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Sections:</span>
                      <span>{customization.sections.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Est. Time:</span>
                      <span>{Math.round(totalEstimatedTime / 60)} hours</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Required:</span>
                      <span>{customization.sections.filter(s => s.required).length}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </ProfessionalCard>
          </div>

          {/* Sections Panel */}
          <div className="lg:col-span-2 space-y-6">
            <ProfessionalCard>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Target className="size-5 text-green-600" />
                    Template Sections
                  </CardTitle>
                  <Button onClick={addSection} size="sm" variant="outline">
                    <Plus className="size-4 mr-2" />
                    Add Section
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Stagger className="space-y-4">
                  {customization.sections
                    .sort((a, b) => a.order - b.order)
                    .map((section, index) => (
                    <HoverScale key={section.id}>
                      <div className={cn(
                        "p-4 rounded-lg border transition-all",
                        section.required ? "border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-900/10" : "border-gray-200 dark:border-gray-700"
                      )}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center size-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-full text-sm font-semibold text-indigo-600">
                                {index + 1}
                              </div>
                              <div className="flex-1">
                                <Input
                                  value={section.name}
                                  onChange={(e) => updateSection(section.id, { name: e.target.value })}
                                  className="font-medium"
                                  placeholder="Section name"
                                />
                              </div>
                              <div className="flex items-center gap-1">
                                {section.required && (
                                  <Badge variant="outline" className="text-green-600">
                                    Required
                                  </Badge>
                                )}
                                <Badge variant="secondary" className="text-xs">
                                  {section.estimatedTime}
                                </Badge>
                              </div>
                            </div>
                            
                            <Textarea
                              value={section.description}
                              onChange={(e) => updateSection(section.id, { description: e.target.value })}
                              placeholder="Section description"
                              rows={2}
                            />

                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                  <Switch
                                    checked={section.aiAssistance}
                                    onCheckedChange={(checked) => updateSection(section.id, { aiAssistance: checked })}
                                  />
                                  <span className="text-sm">AI Assistance</span>
                                </div>
                                {section.customizable && (
                                  <div className="flex items-center gap-2">
                                    <Switch
                                      checked={section.required}
                                      onCheckedChange={(checked) => updateSection(section.id, { required: checked })}
                                    />
                                    <span className="text-sm">Required</span>
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => reorderSection(section.id, 'up')}
                                  disabled={index === 0}
                                >
                                  ↑
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => reorderSection(section.id, 'down')}
                                  disabled={index === customization.sections.length - 1}
                                >
                                  ↓
                                </Button>
                                {section.customizable && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeSection(section.id)}
                                  >
                                    <Minus className="size-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </HoverScale>
                  ))}
                </Stagger>
              </CardContent>
            </ProfessionalCard>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel}>
              <ArrowLeft className="size-4 mr-2" />
              Cancel
            </Button>
            <Button variant="outline" onClick={resetToOriginal}>
              <RotateCcw className="size-4 mr-2" />
              Reset to Original
            </Button>
          </div>
          
          <Button onClick={handleSave} disabled={!hasChanges}>
            <Save className="size-4 mr-2" />
            Save Customization
            <ArrowRight className="size-4 ml-2" />
          </Button>
        </div>
      </div>
    </FadeIn>
  );
}