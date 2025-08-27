'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Tv,
  Camera,
  BookOpen,
  Gamepad2,
  Users,
  Drama,
  FileText,
  Star,
  Trophy,
  Heart,
  Zap,
  ChevronRight,
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { FadeIn, Stagger, HoverScale } from '../ui/micro-interactions';
import { ProfessionalCard } from '../ui/design-system';

export interface ProjectType {
  id: string;
  category: 'tv' | 'film' | 'written' | 'interactive' | 'gaming';
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgGradient: string;
  subcategories: SubCategory[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  popularityScore: number;
}

export interface SubCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  examples: string[];
  templateCount: number;
  isPopular?: boolean;
}

const PROJECT_TYPES: ProjectType[] = [
  {
    id: 'tv',
    category: 'tv',
    name: 'Television & Streaming',
    description: 'Create compelling TV series, limited series, and streaming content',
    icon: <Tv className="size-8" />,
    color: 'text-purple-600',
    bgGradient: 'from-purple-500 to-indigo-600',
    difficulty: 'intermediate',
    estimatedTime: '2-6 hours',
    popularityScore: 95,
    subcategories: [
      {
        id: 'reality',
        name: 'Reality TV',
        description: 'Competition shows, lifestyle, dating, and documentary-style reality',
        icon: <Users className="size-5" />,
        examples: ['Survivor', 'Real Housewives', 'The Bachelor', 'Below Deck'],
        templateCount: 12,
        isPopular: true
      },
      {
        id: 'drama',
        name: 'Drama Series',
        description: 'Character-driven dramatic television with serialized storytelling',
        icon: <Drama className="size-5" />,
        examples: ['Breaking Bad', 'The Crown', 'This Is Us', 'Succession'],
        templateCount: 18,
        isPopular: true
      },
      {
        id: 'comedy',
        name: 'Comedy Series',
        description: 'Sitcoms, workplace comedies, and comedy-drama hybrids',
        icon: <Heart className="size-5" />,
        examples: ['The Office', 'Friends', 'Brooklyn Nine-Nine', 'Ted Lasso'],
        templateCount: 15
      },
      {
        id: 'limited_series',
        name: 'Limited Series',
        description: 'Self-contained miniseries with defined beginning, middle, and end',
        icon: <Star className="size-5" />,
        examples: ['Mare of Easttown', 'Chernobyl', 'The Queen\'s Gambit'],
        templateCount: 8
      }
    ]
  },
  {
    id: 'film',
    category: 'film',
    name: 'Feature Film',
    description: 'Develop theatrical releases and streaming films',
    icon: <Camera className="size-8" />,
    color: 'text-red-600',
    bgGradient: 'from-red-500 to-orange-600',
    difficulty: 'intermediate',
    estimatedTime: '3-8 hours',
    popularityScore: 88,
    subcategories: [
      {
        id: 'feature',
        name: 'Feature Film',
        description: 'Full-length theatrical and streaming films with three-act structure',
        icon: <Camera className="size-5" />,
        examples: ['Marvel films', 'A24 indies', 'Netflix originals'],
        templateCount: 25,
        isPopular: true
      },
      {
        id: 'documentary',
        name: 'Documentary',
        description: 'Non-fiction storytelling with real people and events',
        icon: <FileText className="size-5" />,
        examples: ['Free Solo', 'Making a Murderer', 'Won\'t You Be My Neighbor'],
        templateCount: 10
      }
    ]
  },
  {
    id: 'written',
    category: 'written',
    name: 'Written Content',
    description: 'Novels, screenplays, and published content development',
    icon: <BookOpen className="size-8" />,
    color: 'text-green-600',
    bgGradient: 'from-green-500 to-emerald-600',
    difficulty: 'beginner',
    estimatedTime: '1-4 hours',
    popularityScore: 76,
    subcategories: [
      {
        id: 'novel',
        name: 'Novel/Fiction',
        description: 'Literary fiction, genre novels, and young adult literature',
        icon: <BookOpen className="size-5" />,
        examples: ['Literary fiction', 'Romance', 'Sci-fi/Fantasy', 'Mystery'],
        templateCount: 22,
        isPopular: true
      },
      {
        id: 'screenplay',
        name: 'Screenplay',
        description: 'Feature film and television scripts in proper format',
        icon: <FileText className="size-5" />,
        examples: ['Spec scripts', 'Commissioned screenplays', 'TV pilots'],
        templateCount: 16
      }
    ]
  },
  {
    id: 'interactive',
    category: 'interactive',
    name: 'Interactive Media',
    description: 'Choose-your-own-adventure and branching narratives',
    icon: <Zap className="size-8" />,
    color: 'text-blue-600',
    bgGradient: 'from-blue-500 to-cyan-600',
    difficulty: 'advanced',
    estimatedTime: '4-12 hours',
    popularityScore: 62,
    subcategories: [
      {
        id: 'interactive_fiction',
        name: 'Interactive Fiction',
        description: 'Branching narratives with multiple story paths and endings',
        icon: <Zap className="size-5" />,
        examples: ['Choose Your Own Adventure', 'Twine stories', 'Visual novels'],
        templateCount: 8
      }
    ]
  },
  {
    id: 'gaming',
    category: 'gaming',
    name: 'Game Narratives',
    description: 'Video game storylines, character development, and world-building',
    icon: <Gamepad2 className="size-8" />,
    color: 'text-orange-600',
    bgGradient: 'from-orange-500 to-red-600',
    difficulty: 'advanced',
    estimatedTime: '6-16 hours',
    popularityScore: 71,
    subcategories: [
      {
        id: 'rpg',
        name: 'RPG Storylines',
        description: 'Character-driven narratives with branching dialogue and quests',
        icon: <Trophy className="size-5" />,
        examples: ['The Witcher 3', 'Mass Effect', 'Baldur\'s Gate'],
        templateCount: 12,
        isPopular: true
      }
    ]
  }
];

interface ProjectTypeSelectorProps {
  onSelect: (projectType: ProjectType, subcategory?: SubCategory) => void;
  onBack?: () => void;
  className?: string;
}

export function ProjectTypeSelector({
  onSelect,
  onBack,
  className
}: ProjectTypeSelectorProps) {
  const [selectedType, setSelectedType] = useState<ProjectType | null>(null);
  const [hoveredType, setHoveredType] = useState<string | null>(null);

  const handleTypeSelect = (type: ProjectType) => {
    if (type.subcategories.length === 1) {
      // If only one subcategory, auto-select it
      onSelect(type, type.subcategories[0]);
    } else {
      setSelectedType(type);
    }
  };

  const handleSubcategorySelect = (subcategory: SubCategory) => {
    if (selectedType) {
      onSelect(selectedType, subcategory);
    }
  };

  if (selectedType) {
    return (
      <FadeIn className={className}>
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center space-y-4">
            <Button
              variant="ghost"
              onClick={() => setSelectedType(null)}
              className="absolute left-0 top-0"
            >
              <ArrowLeft className="size-4 mr-2" />
              Back
            </Button>
            
            <div className="flex items-center justify-center">
              <div className={cn("p-3 rounded-full bg-gradient-to-br", selectedType.bgGradient)}>
                <div className="text-white">
                  {selectedType.icon}
                </div>
              </div>
            </div>
            
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {selectedType.name}
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Choose the specific format that best matches your project
              </p>
            </div>
          </div>

          {/* Subcategories */}
          <Stagger className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedType.subcategories.map((subcategory) => (
              <HoverScale key={subcategory.id}>
                <ProfessionalCard 
                  variant="default" 
                  className="cursor-pointer transition-all duration-200 hover:shadow-lg"
                  onClick={() => handleSubcategorySelect(subcategory)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-lg bg-gradient-to-br", selectedType.bgGradient)}>
                          <div className="text-white">
                            {subcategory.icon}
                          </div>
                        </div>
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            {subcategory.name}
                            {subcategory.isPopular && (
                              <Badge variant="secondary" className="text-xs">
                                <Sparkles className="size-3 mr-1" />
                                Popular
                              </Badge>
                            )}
                          </CardTitle>
                        </div>
                      </div>
                      <ChevronRight className="size-5 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {subcategory.description}
                    </p>
                    
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-2">
                        Examples:
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {subcategory.examples.slice(0, 3).map((example) => (
                          <Badge key={example} variant="outline" className="text-xs">
                            {example}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{subcategory.templateCount} templates available</span>
                    </div>
                  </CardContent>
                </ProfessionalCard>
              </HoverScale>
            ))}
          </Stagger>
        </div>
      </FadeIn>
    );
  }

  return (
    <FadeIn className={className}>
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          {onBack && (
            <Button
              variant="ghost"
              onClick={onBack}
              className="absolute left-0 top-0"
            >
              <ArrowLeft className="size-4 mr-2" />
              Back
            </Button>
          )}
          
          <div className="flex items-center justify-center">
            <div className="p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full">
              <Sparkles className="size-8 text-white" />
            </div>
          </div>
          
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              What are you creating today?
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose your story format and let MUSE customize the perfect development workflow for your project
            </p>
          </div>
        </div>

        {/* Project Type Grid */}
        <Stagger className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {PROJECT_TYPES.map((type) => (
            <HoverScale key={type.id}>
              <ProfessionalCard 
                variant="default"
                className={cn(
                  "cursor-pointer transition-all duration-300 hover:shadow-xl relative overflow-hidden group",
                  hoveredType === type.id ? "scale-105 shadow-lg" : ""
                )}
                onMouseEnter={() => setHoveredType(type.id)}
                onMouseLeave={() => setHoveredType(null)}
                onClick={() => handleTypeSelect(type)}
              >
                {/* Background Gradient */}
                <div className={cn(
                  "absolute inset-0 bg-gradient-to-br opacity-5 group-hover:opacity-10 transition-opacity",
                  type.bgGradient
                )} />
                
                <CardHeader className="relative pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-3 rounded-xl bg-gradient-to-br transition-transform group-hover:scale-110",
                        type.bgGradient
                      )}>
                        <div className="text-white">
                          {type.icon}
                        </div>
                      </div>
                      <div>
                        <CardTitle className="text-xl">{type.name}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {type.difficulty}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {type.estimatedTime}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className={cn(
                      "w-6 h-6 text-muted-foreground transition-transform group-hover:translate-x-1",
                      type.color
                    )} />
                  </div>
                </CardHeader>
                
                <CardContent className="relative space-y-4">
                  <p className="text-muted-foreground">
                    {type.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      {type.subcategories.length} format{type.subcategories.length !== 1 ? 's' : ''} available
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="flex">
                        {[1,2,3,4,5].map((star) => (
                          <Star
                            key={star}
                            className={cn(
                              "w-3 h-3",
                              star <= Math.floor(type.popularityScore / 20) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                            )}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground ml-1">
                        ({type.popularityScore}%)
                      </span>
                    </div>
                  </div>
                </CardContent>
              </ProfessionalCard>
            </HoverScale>
          ))}
        </Stagger>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Not sure which format? <Button variant="link" className="p-0 h-auto text-sm">Browse all templates</Button> or <Button variant="link" className="p-0 h-auto text-sm">start with a blank project</Button>
          </p>
        </div>
      </div>
    </FadeIn>
  );
}