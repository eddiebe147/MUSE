'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { 
  Upload,
  FileText,
  Film,
  Sparkles,
  Target,
  Users,
  Clock,
  Lightbulb,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Download,
  Eye,
  Brain,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { FadeIn, Stagger, HoverScale, Pulse } from '../ui/micro-interactions';
import { ProfessionalCard, StatusIndicator, QualityScore, InsightCard } from '../ui/design-system';
import { ProjectType, SubCategory } from './project-type-selector';

interface MaterialAnalysis {
  id: string;
  confidence: number;
  recommendedTemplate: {
    id: string;
    name: string;
    category: string;
    reason: string;
    compatibility: number;
  };
  extractedElements: {
    genre: string;
    tone: string;
    characters: string[];
    themes: string[];
    structure: string;
    setting: string;
    conflict: string;
  };
  insights: {
    strengths: string[];
    opportunities: string[];
    suggestions: string[];
  };
  estimatedDevelopmentTime: string;
  similarWorks: string[];
}

interface MaterialAnalysisProps {
  onAnalysisComplete: (analysis: MaterialAnalysis, selectedTemplate?: any) => void;
  onBack?: () => void;
  availableTemplates: any[];
  className?: string;
}

export function MaterialAnalysisEngine({
  onAnalysisComplete,
  onBack,
  availableTemplates,
  className
}: MaterialAnalysisProps) {
  const [uploadedContent, setUploadedContent] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<MaterialAnalysis | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [currentAnalysisStep, setCurrentAnalysisStep] = useState('');
  const [showDetailedView, setShowDetailedView] = useState(false);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setUploadedContent(content);
      };
      reader.readAsText(file);
    }
  }, []);

  const simulateAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    
    const steps = [
      'Analyzing narrative structure...',
      'Identifying character archetypes...',
      'Extracting thematic elements...',
      'Evaluating genre conventions...',
      'Matching template compatibility...',
      'Generating recommendations...'
    ];

    for (let i = 0; i < steps.length; i++) {
      setCurrentAnalysisStep(steps[i]);
      setAnalysisProgress((i + 1) * 16.67);
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    // Simulate AI analysis results
    const mockAnalysis: MaterialAnalysis = {
      id: `analysis_${Date.now()}`,
      confidence: 87,
      recommendedTemplate: {
        id: 'reality_competition',
        name: 'Reality Competition Series',
        category: 'Television',
        reason: 'Content shows strong competitive dynamics and character-driven conflicts typical of reality TV',
        compatibility: 94
      },
      extractedElements: {
        genre: 'Reality/Competition',
        tone: 'Dramatic with comedic moments',
        characters: ['Host/Producer', 'Contestants', 'Judges/Panel'],
        themes: ['Competition', 'Personal Growth', 'Authenticity', 'Drama'],
        structure: 'Episode-driven with elimination format',
        setting: 'Controlled competition environment',
        conflict: 'Individual vs. group, internal vs. external challenges'
      },
      insights: {
        strengths: [
          'Strong character dynamics and natural conflict',
          'Clear competitive structure with built-in stakes',
          'Authentic emotional moments and personal stories'
        ],
        opportunities: [
          'Develop unique competition format or twist',
          'Enhance visual storytelling and production value',
          'Create distinctive casting criteria and character types'
        ],
        suggestions: [
          'Focus on personal transformation arcs alongside competition',
          'Consider multi-episode character development',
          'Build in social media and audience engagement elements'
        ]
      },
      estimatedDevelopmentTime: '4-8 weeks',
      similarWorks: ['Survivor', 'The Bachelor', 'Love Island', 'Big Brother']
    };

    setAnalysis(mockAnalysis);
    setIsAnalyzing(false);
    setAnalysisProgress(100);
  };

  const handleUseRecommendation = () => {
    if (analysis) {
      const recommendedTemplate = availableTemplates.find(
        t => t.id === analysis.recommendedTemplate.id
      );
      onAnalysisComplete(analysis, recommendedTemplate);
    }
  };

  if (isAnalyzing) {
    return (
      <FadeIn className={className}>
        <ProfessionalCard variant="feature" className="max-w-2xl mx-auto">
          <CardContent className="py-12">
            <div className="text-center space-y-6">
              <div className="flex items-center justify-center">
                <div className="p-4 bg-indigo-100 dark:bg-indigo-900/30 rounded-full">
                  <Brain className="size-8 text-indigo-600 animate-pulse" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Analyzing Your Material</h3>
                <p className="text-muted-foreground">
                  Our AI is examining your content to find the perfect template match
                </p>
              </div>

              <div className="space-y-4">
                <Progress value={analysisProgress} className="w-full" />
                <div className="flex items-center justify-center gap-2">
                  <Pulse size="sm" />
                  <span className="text-sm text-muted-foreground">{currentAnalysisStep}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </ProfessionalCard>
      </FadeIn>
    );
  }

  if (analysis && showDetailedView) {
    return (
      <FadeIn className={className}>
        <div className="space-y-6">
          {/* Header */}
          <ProfessionalCard variant="feature">
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                    <CheckCircle className="size-6 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Analysis Complete</h2>
                    <p className="text-muted-foreground">
                      {analysis.confidence}% confidence match found
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowDetailedView(false)}>
                    <Eye className="size-4 mr-2" />
                    Summary
                  </Button>
                  <Button onClick={handleUseRecommendation}>
                    Use Recommendation
                    <ArrowRight className="size-4 ml-2" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </ProfessionalCard>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recommended Template */}
            <ProfessionalCard>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="size-5 text-indigo-600" />
                  Recommended Template
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                  <h4 className="font-semibold text-indigo-900 dark:text-indigo-100">
                    {analysis.recommendedTemplate.name}
                  </h4>
                  <Badge variant="secondary" className="mt-1 mb-3">
                    {analysis.recommendedTemplate.category}
                  </Badge>
                  <p className="text-sm text-indigo-700 dark:text-indigo-300">
                    {analysis.recommendedTemplate.reason}
                  </p>
                </div>
                <QualityScore 
                  score={analysis.recommendedTemplate.compatibility} 
                  label="Template Compatibility"
                />
              </CardContent>
            </ProfessionalCard>

            {/* Extracted Elements */}
            <ProfessionalCard>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="size-5 text-yellow-600" />
                  Story Elements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="font-medium text-muted-foreground">Genre:</span>
                    <p>{analysis.extractedElements.genre}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Tone:</span>
                    <p>{analysis.extractedElements.tone}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Structure:</span>
                    <p>{analysis.extractedElements.structure}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Setting:</span>
                    <p>{analysis.extractedElements.setting}</p>
                  </div>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground text-sm">Themes:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {analysis.extractedElements.themes.map((theme) => (
                      <Badge key={theme} variant="outline" className="text-xs">
                        {theme}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </ProfessionalCard>

            {/* Insights */}
            <ProfessionalCard className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="size-5 text-yellow-600" />
                  AI Insights & Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h4 className="font-semibold text-green-700 dark:text-green-400 mb-2">
                      Strengths
                    </h4>
                    <ul className="space-y-1 text-sm">
                      {analysis.insights.strengths.map((strength, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle className="size-3 text-green-600 mt-0.5 shrink-0" />
                          <span>{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-700 dark:text-blue-400 mb-2">
                      Opportunities
                    </h4>
                    <ul className="space-y-1 text-sm">
                      {analysis.insights.opportunities.map((opportunity, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Target className="size-3 text-blue-600 mt-0.5 shrink-0" />
                          <span>{opportunity}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-purple-700 dark:text-purple-400 mb-2">
                      Suggestions
                    </h4>
                    <ul className="space-y-1 text-sm">
                      {analysis.insights.suggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Sparkles className="size-3 text-purple-600 mt-0.5 shrink-0" />
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </ProfessionalCard>
          </div>
        </div>
      </FadeIn>
    );
  }

  if (analysis) {
    return (
      <FadeIn className={className}>
        <div className="space-y-6">
          {/* Results Header */}
          <ProfessionalCard variant="feature">
            <CardContent className="py-8">
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center">
                  <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-full">
                    <CheckCircle className="size-8 text-green-600" />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Perfect Match Found!</h2>
                  <p className="text-lg text-muted-foreground">
                    We've analyzed your material and found the ideal template
                  </p>
                </div>
                <QualityScore 
                  score={analysis.confidence} 
                  label="Match Confidence"
                  size="lg"
                />
              </div>
            </CardContent>
          </ProfessionalCard>

          {/* Recommendation Card */}
          <Stagger>
            <HoverScale>
              <ProfessionalCard className="cursor-pointer border-2 border-indigo-200 dark:border-indigo-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-full">
                        <Film className="size-6 text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold">
                          {analysis.recommendedTemplate.name}
                        </h3>
                        <Badge variant="secondary" className="mt-1">
                          {analysis.recommendedTemplate.category}
                        </Badge>
                      </div>
                    </div>
                    <QualityScore 
                      score={analysis.recommendedTemplate.compatibility}
                      label="Compatibility"
                    />
                  </div>
                  
                  <p className="text-muted-foreground mb-4">
                    {analysis.recommendedTemplate.reason}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="size-4" />
                        <span>{analysis.estimatedDevelopmentTime}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="size-4" />
                        <span>Similar: {analysis.similarWorks.slice(0, 2).join(', ')}</span>
                      </div>
                    </div>
                    <Button onClick={() => setShowDetailedView(true)} variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </ProfessionalCard>
            </HoverScale>

            {/* Quick Insights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InsightCard
                type="strength"
                title="Key Strength"
                description={analysis.insights.strengths[0]}
              />
              <InsightCard
                type="opportunity"
                title="Opportunity"
                description={analysis.insights.opportunities[0]}
              />
              <InsightCard
                type="insight"
                title="Suggestion"
                description={analysis.insights.suggestions[0]}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-center gap-4">
              <Button variant="outline" onClick={onBack}>
                Analyze Different Content
              </Button>
              <Button onClick={handleUseRecommendation} size="lg">
                Use This Template
                <ArrowRight className="size-4 ml-2" />
              </Button>
            </div>
          </Stagger>
        </div>
      </FadeIn>
    );
  }

  return (
    <FadeIn className={className}>
      <div className="space-y-8">
        {/* Header */}
        <ProfessionalCard variant="feature">
          <CardContent className="py-8">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center">
                <div className="p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full">
                  <Brain className="size-8 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold">AI Material Analysis</h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Upload your existing material and let our AI analyze it to find the perfect template and extract story elements
                </p>
              </div>
            </div>
          </CardContent>
        </ProfessionalCard>

        {/* Upload Section */}
        <ProfessionalCard>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="size-5 text-indigo-600" />
              Upload Your Material
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* File Upload */}
              <div className="space-y-4">
                <h4 className="font-medium">Upload Files</h4>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-indigo-400 transition-colors">
                  <Upload className="size-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Drop files here or click to upload
                  </p>
                  <input
                    type="file"
                    accept=".txt,.doc,.docx,.pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => document.getElementById('file-upload')?.click()}
                  >
                    <FileText className="size-4 mr-2" />
                    Choose Files
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Supports: Scripts, treatments, outlines, transcripts, research notes
                  </p>
                </div>
              </div>

              {/* Text Input */}
              <div className="space-y-4">
                <h4 className="font-medium">Or Paste Content</h4>
                <Textarea
                  placeholder="Paste your script, treatment, outline, or story ideas here..."
                  className="min-h-[200px] resize-none"
                  value={uploadedContent}
                  onChange={(e) => setUploadedContent(e.target.value)}
                />
              </div>
            </div>

            {/* Analysis Button */}
            {uploadedContent && (
              <FadeIn>
                <div className="text-center pt-4">
                  <Button onClick={simulateAnalysis} size="lg">
                    <Brain className="size-5 mr-2" />
                    Analyze Material
                  </Button>
                  <p className="text-sm text-muted-foreground mt-2">
                    This will take 30-60 seconds to complete
                  </p>
                </div>
              </FadeIn>
            )}

            {/* What We Analyze */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t">
              <div className="text-center space-y-2">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full w-fit mx-auto">
                  <Target className="size-6 text-blue-600" />
                </div>
                <h4 className="font-medium">Story Structure</h4>
                <p className="text-sm text-muted-foreground">
                  Genre, format, pacing, and narrative patterns
                </p>
              </div>
              <div className="text-center space-y-2">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full w-fit mx-auto">
                  <Users className="size-6 text-purple-600" />
                </div>
                <h4 className="font-medium">Characters & Themes</h4>
                <p className="text-sm text-muted-foreground">
                  Character archetypes, relationships, and core themes
                </p>
              </div>
              <div className="text-center space-y-2">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full w-fit mx-auto">
                  <Sparkles className="size-6 text-green-600" />
                </div>
                <h4 className="font-medium">Template Match</h4>
                <p className="text-sm text-muted-foreground">
                  Best template recommendations with confidence scores
                </p>
              </div>
            </div>
          </CardContent>
        </ProfessionalCard>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Your content is analyzed locally and securely. We don't store your material.
          </p>
        </div>
      </div>
    </FadeIn>
  );
}