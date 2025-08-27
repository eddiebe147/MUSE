'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Brain,
  Sparkles,
  TrendingUp,
  Users,
  Clock,
  Target,
  Star,
  Lightbulb,
  CheckCircle,
  ArrowRight,
  Wand2,
  BarChart3,
  Film,
  BookOpen,
  Tv,
  Gamepad2,
  Zap,
  Eye,
  ThumbsUp,
  Award
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { FadeIn, Stagger, HoverScale, Pulse } from '../ui/micro-interactions';
import { ProfessionalCard, StatusIndicator, QualityScore, InsightCard } from '../ui/design-system';
import { ProjectType, SubCategory } from './project-type-selector';

interface SmartSuggestion {
  id: string;
  templateId: string;
  name: string;
  description: string;
  category: string;
  confidence: number;
  reasons: string[];
  benefits: string[];
  similarProjects: string[];
  successMetrics: {
    completionRate: number;
    userSatisfaction: number;
    timeToCompletion: string;
    popularityTrend: 'rising' | 'stable' | 'declining';
  };
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  aiFeatures: string[];
}

interface UserProfile {
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  preferredGenres: string[];
  completedProjects: number;
  averageSessionTime: number; // minutes
  preferredComplexity: 'simple' | 'moderate' | 'complex';
  aiUsagePattern: 'low' | 'moderate' | 'high';
}

interface SmartSuggestionsProps {
  projectType?: ProjectType;
  subcategory?: SubCategory;
  userProfile?: Partial<UserProfile>;
  materialAnalysis?: any;
  onSuggestionSelect: (suggestion: SmartSuggestion) => void;
  onViewAll?: () => void;
  maxSuggestions?: number;
  className?: string;
}

export function SmartTemplateSuggestions({
  projectType,
  subcategory,
  userProfile = {},
  materialAnalysis,
  onSuggestionSelect,
  onViewAll,
  maxSuggestions = 3,
  className
}: SmartSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSuggestionId, setSelectedSuggestionId] = useState<string | null>(null);

  const defaultUserProfile: UserProfile = {
    experienceLevel: 'intermediate',
    preferredGenres: [],
    completedProjects: 0,
    averageSessionTime: 60,
    preferredComplexity: 'moderate',
    aiUsagePattern: 'moderate',
    ...userProfile
  };

  const generateSmartSuggestions = useCallback(async () => {
    setIsLoading(true);
    
    // Simulate AI analysis with realistic delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const mockSuggestions: SmartSuggestion[] = [
      {
        id: 'reality_competition_enhanced',
        templateId: 'reality_competition',
        name: 'Reality Competition Pro',
        description: 'Enhanced competition format with social dynamics and strategic elements',
        category: 'Television',
        confidence: 94,
        reasons: [
          'Perfect match for your TV project type',
          'High success rate with similar user profiles',
          'Trending format in current market',
          'Matches your intermediate experience level'
        ],
        benefits: [
          'Built-in audience engagement mechanisms',
          '95% project completion rate',
          'Proven commercial viability',
          'Strong social media integration'
        ],
        similarProjects: ['Survivor', 'The Challenge', 'Love Island'],
        successMetrics: {
          completionRate: 95,
          userSatisfaction: 4.7,
          timeToCompletion: '4-6 weeks',
          popularityTrend: 'rising'
        },
        tags: ['Popular', 'Trending', 'High Success Rate', 'Beginner Friendly'],
        difficulty: 'intermediate',
        estimatedTime: '6-8 hours',
        aiFeatures: ['Character archetypes', 'Drama prediction', 'Casting suggestions', 'Format optimization']
      },
      {
        id: 'three_act_feature_modern',
        templateId: 'three_act_feature',
        name: 'Modern Three-Act Structure',
        description: 'Updated classical structure optimized for streaming and modern audiences',
        category: 'Film',
        confidence: 87,
        reasons: [
          'Excellent foundation for film development',
          'Adapted for modern storytelling preferences',
          'Strong track record with new filmmakers',
          'Flexible structure allows creative freedom'
        ],
        benefits: [
          'Industry-standard format',
          'High festival acceptance rate',
          'Distributor-friendly structure',
          'Proven audience engagement'
        ],
        similarProjects: ['Parasite', 'Knives Out', 'Everything Everywhere'],
        successMetrics: {
          completionRate: 88,
          userSatisfaction: 4.5,
          timeToCompletion: '8-12 weeks',
          popularityTrend: 'stable'
        },
        tags: ['Classic', 'Proven', 'Festival Ready', 'Industry Standard'],
        difficulty: 'intermediate',
        estimatedTime: '10-15 hours',
        aiFeatures: ['Plot optimization', 'Character development', 'Pacing analysis', 'Theme integration']
      },
      {
        id: 'interactive_narrative_basic',
        templateId: 'interactive_fiction',
        name: 'Branching Story Builder',
        description: 'User-friendly approach to interactive storytelling with guided branching',
        category: 'Interactive',
        confidence: 76,
        reasons: [
          'Growing market demand',
          'Innovative format with high engagement',
          'Good match for creative experimentation',
          'Strong AI assistance available'
        ],
        benefits: [
          'High user engagement potential',
          'Multiple monetization paths',
          'Portfolio differentiator',
          'Future-focused medium'
        ],
        similarProjects: ['Bandersnatch', 'Detroit: Become Human', 'Choice of Games'],
        successMetrics: {
          completionRate: 72,
          userSatisfaction: 4.3,
          timeToCompletion: '6-10 weeks',
          popularityTrend: 'rising'
        },
        tags: ['Innovative', 'High Engagement', 'Experimental', 'AI-Assisted'],
        difficulty: 'advanced',
        estimatedTime: '12-20 hours',
        aiFeatures: ['Branch logic', 'Narrative coherence', 'Choice impact analysis', 'Player psychology']
      }
    ];

    // Filter and sort based on context
    let filteredSuggestions = mockSuggestions;
    
    if (projectType) {
      filteredSuggestions = filteredSuggestions.filter(s => 
        s.category.toLowerCase().includes(projectType.category) ||
        projectType.name.toLowerCase().includes(s.category.toLowerCase())
      );
    }

    if (materialAnalysis) {
      // Boost confidence for suggestions that match analysis
      filteredSuggestions = filteredSuggestions.map(s => ({
        ...s,
        confidence: s.category === materialAnalysis.recommendedTemplate?.category 
          ? Math.min(s.confidence + 15, 99) 
          : s.confidence
      }));
    }

    // Sort by confidence and limit
    filteredSuggestions = filteredSuggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, maxSuggestions);

    setSuggestions(filteredSuggestions);
    setIsLoading(false);
  }, [projectType, subcategory, materialAnalysis, maxSuggestions]);

  useEffect(() => {
    generateSmartSuggestions();
  }, [generateSmartSuggestions]);

  const handleSuggestionSelect = (suggestion: SmartSuggestion) => {
    setSelectedSuggestionId(suggestion.id);
    onSuggestionSelect(suggestion);
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'television': return <Tv className="size-5" />;
      case 'film': return <Film className="size-5" />;
      case 'written': return <BookOpen className="size-5" />;
      case 'interactive': return <Zap className="size-5" />;
      case 'gaming': return <Gamepad2 className="size-5" />;
      default: return <Target className="size-5" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'rising': return <TrendingUp className="size-4 text-green-600" />;
      case 'stable': return <BarChart3 className="size-4 text-blue-600" />;
      case 'declining': return <BarChart3 className="size-4 text-orange-600" />;
      default: return <BarChart3 className="size-4 text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <FadeIn className={className}>
        <ProfessionalCard>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center">
                <div className="p-4 bg-indigo-100 dark:bg-indigo-900/30 rounded-full">
                  <Brain className="size-8 text-indigo-600 animate-pulse" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Analyzing Perfect Matches</h3>
                <p className="text-muted-foreground">
                  Our AI is finding the best templates for your project
                </p>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Pulse size="sm" />
                <span className="text-sm text-muted-foreground">Processing recommendations...</span>
              </div>
            </div>
          </CardContent>
        </ProfessionalCard>
      </FadeIn>
    );
  }

  if (suggestions.length === 0) {
    return (
      <FadeIn className={className}>
        <ProfessionalCard>
          <CardContent className="py-12 text-center">
            <Lightbulb className="size-12 mx-auto mb-4 text-yellow-600 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No Smart Suggestions Available</h3>
            <p className="text-muted-foreground mb-4">
              We couldn't find specific recommendations for your criteria.
            </p>
            {onViewAll && (
              <Button onClick={onViewAll} variant="outline">
                Browse All Templates
              </Button>
            )}
          </CardContent>
        </ProfessionalCard>
      </FadeIn>
    );
  }

  return (
    <FadeIn className={className}>
      <div className="space-y-6">
        {/* Header */}
        <ProfessionalCard variant="feature">
          <CardContent className="py-6">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full">
                  <Wand2 className="size-6 text-white" />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold">AI-Powered Recommendations</h2>
                <p className="text-muted-foreground">
                  Personalized template suggestions based on your project and profile
                </p>
              </div>
              <div className="flex items-center justify-center gap-4">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Brain className="size-3" />
                  AI Matched
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Star className="size-3" />
                  {suggestions.length} Suggestions
                </Badge>
              </div>
            </div>
          </CardContent>
        </ProfessionalCard>

        {/* Suggestions List */}
        <Stagger className="space-y-4">
          {suggestions.map((suggestion, index) => (
            <HoverScale key={suggestion.id}>
              <ProfessionalCard 
                className={cn(
                  "cursor-pointer transition-all duration-200 hover:shadow-lg",
                  selectedSuggestionId === suggestion.id && "ring-2 ring-indigo-500",
                  index === 0 && "border-2 border-indigo-200 dark:border-indigo-800"
                )}
                onClick={() => handleSuggestionSelect(suggestion)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-3 rounded-xl bg-gradient-to-br",
                        index === 0 ? "from-indigo-500 to-purple-600" : "from-gray-500 to-gray-600"
                      )}>
                        <div className="text-white">
                          {getCategoryIcon(suggestion.category)}
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{suggestion.name}</CardTitle>
                          {index === 0 && (
                            <Badge variant="default" className="bg-indigo-600 text-white">
                              <Award className="size-3 mr-1" />
                              Best Match
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {suggestion.category}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {suggestion.difficulty}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <QualityScore 
                        score={suggestion.confidence}
                        label="Match"
                        size="sm"
                      />
                      <div className="flex items-center gap-1 mt-1">
                        {getTrendIcon(suggestion.successMetrics.popularityTrend)}
                        <span className="text-xs text-muted-foreground capitalize">
                          {suggestion.successMetrics.popularityTrend}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    {suggestion.description}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1">
                    {suggestion.tags.slice(0, 4).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  {/* Key Benefits */}
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                      <CheckCircle className="size-4 text-green-600" />
                      Why This Template?
                    </h4>
                    <ul className="text-sm space-y-1">
                      {suggestion.reasons.slice(0, 2).map((reason, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <div className="size-1.5 bg-indigo-600 rounded-full" />
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Success Metrics */}
                  <div className="grid grid-cols-3 gap-4 pt-2 border-t">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-green-600">
                        {suggestion.successMetrics.completionRate}%
                      </div>
                      <div className="text-xs text-muted-foreground">Completion Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Star className="size-4 text-yellow-500 fill-yellow-500" />
                        <span className="text-lg font-semibold">
                          {suggestion.successMetrics.userSatisfaction}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">User Rating</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-blue-600">
                        {suggestion.estimatedTime}
                      </div>
                      <div className="text-xs text-muted-foreground">Est. Time</div>
                    </div>
                  </div>

                  {/* AI Features Preview */}
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                      <Sparkles className="size-4 text-purple-600" />
                      AI Features Included
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {suggestion.aiFeatures.slice(0, 3).map((feature) => (
                        <Badge key={feature} variant="outline" className="text-xs bg-purple-50 dark:bg-purple-900/20">
                          {feature}
                        </Badge>
                      ))}
                      {suggestion.aiFeatures.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{suggestion.aiFeatures.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Action */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="text-sm text-muted-foreground">
                      Similar to: {suggestion.similarProjects.slice(0, 2).join(', ')}
                    </div>
                    <Button size="sm" variant={index === 0 ? "default" : "outline"}>
                      {index === 0 ? (
                        <>
                          <Zap className="size-4 mr-2" />
                          Use This Template
                        </>
                      ) : (
                        <>
                          Select Template
                          <ArrowRight className="size-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </ProfessionalCard>
            </HoverScale>
          ))}
        </Stagger>

        {/* Footer Actions */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-4">
            {onViewAll && (
              <Button variant="outline" onClick={onViewAll}>
                <Eye className="size-4 mr-2" />
                Browse All Templates
              </Button>
            )}
            <Button 
              variant="ghost" 
              onClick={() => generateSmartSuggestions()}
              className="text-muted-foreground"
            >
              <Sparkles className="size-4 mr-2" />
              Get New Suggestions
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Suggestions are personalized based on your project type, experience, and current trends
          </p>
        </div>
      </div>
    </FadeIn>
  );
}