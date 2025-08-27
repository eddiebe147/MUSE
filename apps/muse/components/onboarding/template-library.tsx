'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Search,
  Star,
  Clock,
  Users,
  Trophy,
  Sparkles,
  ChevronRight,
  ArrowLeft,
  Filter,
  BookOpen,
  Play,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { FadeIn, Stagger, HoverScale } from '../ui/micro-interactions';
import { ProfessionalCard, QualityScore } from '../ui/design-system';
import type { ProjectType, SubCategory } from './project-type-selector';

export interface StoryTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  subcategory: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  estimatedDuration: string;
  isBuiltin: boolean;
  isFeatured: boolean;
  usageCount: number;
  ratingAverage: number;
  ratingCount: number;
  tags: string[];
  structureConfig: {
    phases: Array<{
      phase: number;
      customInstructions?: string;
      focusAreas: string[];
      qualityChecklist: string[];
    }>;
    workflow: {
      skipPhases?: number[];
      emphasizePhases?: number[];
      customValidation?: Record<string, any>;
    };
  };
  formattingRules: {
    pageLength?: string;
    formatStyle?: string;
    industryStandards: string[];
  };
  exampleProjects: Array<{
    title: string;
    network?: string;
    year?: string;
    genre?: string;
  }>;
  preview: {
    phase1Example: string;
    phase2Example: string;
    phase3Example: string;
    phase4Example: string;
  };
  createdBy?: string;
  isPopular?: boolean;
}

// Built-in templates for different story formats
const BUILTIN_TEMPLATES: StoryTemplate[] = [
  {
    id: 'reality-competition',
    name: 'Reality Competition Format',
    description: 'Proven structure for competition reality shows with eliminations, challenges, and character development',
    category: 'tv',
    subcategory: 'reality',
    difficulty: 'intermediate',
    estimatedDuration: '3-5 hours',
    isBuiltin: true,
    isFeatured: true,
    usageCount: 1247,
    ratingAverage: 92,
    ratingCount: 156,
    isPopular: true,
    tags: ['competition', 'elimination', 'challenges', 'alliances', 'voting'],
    structureConfig: {
      phases: [
        {
          phase: 1,
          customInstructions: 'Focus on cast dynamics, competition format, and prize structure',
          focusAreas: ['Cast Archetypes', 'Competition Rules', 'Elimination Format', 'Prize Stakes'],
          qualityChecklist: ['Clear competition rules', 'Diverse cast representation', 'Compelling prize structure']
        },
        {
          phase: 2,
          focusAreas: ['Episode Structure', 'Challenge Types', 'Voting Dynamics', 'Alliance Potential'],
          qualityChecklist: ['Episode pacing', 'Challenge variety', 'Conflict opportunities']
        },
        {
          phase: 3,
          focusAreas: ['Individual Storylines', 'Rivalry Development', 'Redemption Arcs', 'Finale Build-up'],
          qualityChecklist: ['Character development', 'Dramatic tension', 'Production feasibility']
        },
        {
          phase: 4,
          focusAreas: ['Casting Requirements', 'Production Timeline', 'Budget Considerations', 'Network Pitch'],
          qualityChecklist: ['Casting specifications', 'Location requirements', 'Season structure']
        }
      ],
      workflow: {
        emphasizePhases: [2, 3],
        customValidation: {
          requiresCompetitionFormat: true,
          minimumCastSize: 12,
          eliminationStructure: true
        }
      }
    },
    formattingRules: {
      pageLength: '15-25 pages',
      formatStyle: 'Reality TV Bible',
      industryStandards: ['Network Reality Guidelines', 'Competition Show Format', 'Casting Specifications']
    },
    exampleProjects: [
      { title: 'Survivor', network: 'CBS', year: '2000', genre: 'Competition Reality' },
      { title: 'Big Brother', network: 'CBS', year: '2000', genre: 'Competition Reality' },
      { title: 'The Challenge', network: 'MTV', year: '1998', genre: 'Competition Reality' }
    ],
    preview: {
      phase1Example: '16 contestants compete in a remote location for $1 million prize through physical and mental challenges while forming strategic alliances...',
      phase2Example: 'Episode 1: Arrival & Team Formation (42 min)\n- Cold open: Dramatic challenge moment\n- Act 1: Cast introductions...',
      phase3Example: 'Sarah (Episode 1-3): The Strategic Leader\n- Immediately forms core alliance\n- Wins first immunity challenge...',
      phase4Example: 'CASTING REQUIREMENTS:\n- 16 contestants, ages 21-65\n- Diverse backgrounds and professions\n- Physical and mental capabilities...'
    }
  },
  {
    id: 'three-act-feature',
    name: 'Three-Act Feature Film',
    description: 'Classic Hollywood structure for feature films with proven dramatic beats and character arcs',
    category: 'film',
    subcategory: 'feature',
    difficulty: 'intermediate',
    estimatedDuration: '4-6 hours',
    isBuiltin: true,
    isFeatured: true,
    usageCount: 2156,
    ratingAverage: 89,
    ratingCount: 284,
    isPopular: true,
    tags: ['three-act', 'feature', 'hollywood', 'character-driven', 'commercial'],
    structureConfig: {
      phases: [
        {
          phase: 1,
          customInstructions: 'Establish protagonist, central conflict, and thematic foundation using three-act principles',
          focusAreas: ['Protagonist Setup', 'Central Conflict', 'Theme', 'Genre Expectations'],
          qualityChecklist: ['Clear protagonist goals', 'Compelling stakes', 'Genre adherence']
        },
        {
          phase: 2,
          focusAreas: ['Act Breaks', 'Plot Points', 'Midpoint Turn', 'Character Arcs'],
          qualityChecklist: ['25/50/25 structure', 'Major plot points', 'Character development']
        },
        {
          phase: 3,
          focusAreas: ['Scene Breakdown', 'Dialogue Beats', 'Visual Storytelling', 'Pacing'],
          qualityChecklist: ['Scene structure', 'Character voice', 'Visual elements']
        },
        {
          phase: 4,
          focusAreas: ['Logline', 'Treatment', 'Character Breakdown', 'Market Position'],
          qualityChecklist: ['Compelling logline', 'Clear market', 'Budget considerations']
        }
      ],
      workflow: {
        emphasizePhases: [2],
        customValidation: {
          requiresThreeActStructure: true,
          targetLength: '90-120 pages',
          genreConsistency: true
        }
      }
    },
    formattingRules: {
      pageLength: '90-120 pages',
      formatStyle: 'Industry Standard Screenplay',
      industryStandards: ['Final Draft Format', 'WGA Guidelines', 'Studio Submission Standards']
    },
    exampleProjects: [
      { title: 'The Dark Knight', year: '2008', genre: 'Action/Drama' },
      { title: 'Get Out', year: '2017', genre: 'Thriller/Horror' },
      { title: 'La La Land', year: '2016', genre: 'Musical/Romance' }
    ],
    preview: {
      phase1Example: 'A struggling musician in LA discovers her roommate is involved in a supernatural conspiracy that threatens everything she holds dear...',
      phase2Example: 'ACT I (Pages 1-25): Setup\n- Opening Image: Jazz club performance\n- Inciting Incident: Mysterious disappearance...',
      phase3Example: 'Scene 1: INT. COFFEE SHOP - MORNING\nEMMA sits alone, scrolling through missing person reports...',
      phase4Example: 'LOGLINE: When a jazz pianist discovers her missing roommate was involved in supernatural activities...'
    }
  },
  {
    id: 'novel-literary',
    name: 'Literary Fiction Novel',
    description: 'Character-driven literary fiction with deep themes and sophisticated narrative structure',
    category: 'written',
    subcategory: 'novel',
    difficulty: 'advanced',
    estimatedDuration: '2-4 hours',
    isBuiltin: true,
    isFeatured: false,
    usageCount: 892,
    ratingAverage: 85,
    ratingCount: 127,
    tags: ['literary', 'character-driven', 'themes', 'narrative', 'literary-awards'],
    structureConfig: {
      phases: [
        {
          phase: 1,
          customInstructions: 'Develop complex themes, character psychology, and literary style',
          focusAreas: ['Thematic Depth', 'Character Psychology', 'Narrative Voice', 'Literary Devices'],
          qualityChecklist: ['Sophisticated themes', 'Complex characters', 'Distinctive voice']
        },
        {
          phase: 2,
          focusAreas: ['Narrative Structure', 'Chapter Breaks', 'Pacing', 'Subplot Integration'],
          qualityChecklist: ['Structural integrity', 'Thematic consistency', 'Character development']
        },
        {
          phase: 3,
          focusAreas: ['Scene Crafting', 'Dialogue Quality', 'Descriptive Passages', 'Literary Style'],
          qualityChecklist: ['Literary quality', 'Scene purpose', 'Style consistency']
        },
        {
          phase: 4,
          focusAreas: ['Query Letter', 'Synopsis', 'Market Position', 'Awards Potential'],
          qualityChecklist: ['Publishing readiness', 'Market viability', 'Literary merit']
        }
      ],
      workflow: {
        emphasizePhases: [1, 3],
        customValidation: {
          literaryQuality: true,
          thematicDepth: true,
          characterComplexity: true
        }
      }
    },
    formattingRules: {
      pageLength: '250-400 pages',
      formatStyle: 'Standard Manuscript Format',
      industryStandards: ['Publishing Industry Standards', 'Literary Agency Requirements']
    },
    exampleProjects: [
      { title: 'The Goldfinch', year: '2013', genre: 'Literary Fiction' },
      { title: 'Normal People', year: '2018', genre: 'Literary Fiction' },
      { title: 'The Seven Husbands of Evelyn Hugo', year: '2017', genre: 'Literary Fiction' }
    ],
    preview: {
      phase1Example: 'An exploration of identity and belonging through the lens of a first-generation immigrant family navigating cultural displacement...',
      phase2Example: 'PART ONE: Arrival (Chapters 1-8)\nThe family\'s initial experience in their new country...',
      phase3Example: 'Chapter 1: The Weight of Suitcases\n\nAmira pressed her palm against the airplane window...',
      phase4Example: 'QUERY: A multigenerational saga exploring themes of identity, belonging, and the immigrant experience...'
    }
  },
  {
    id: 'workplace-comedy',
    name: 'Workplace Comedy Series',
    description: 'Character ensemble workplace comedy with mockumentary style and relationship dynamics',
    category: 'tv',
    subcategory: 'comedy',
    difficulty: 'intermediate',
    estimatedDuration: '3-5 hours',
    isBuiltin: true,
    isFeatured: true,
    usageCount: 756,
    ratingAverage: 88,
    ratingCount: 98,
    isPopular: true,
    tags: ['workplace', 'ensemble', 'mockumentary', 'relationships', 'comedy'],
    structureConfig: {
      phases: [
        {
          phase: 1,
          customInstructions: 'Establish workplace setting, ensemble cast dynamics, and comedic tone',
          focusAreas: ['Workplace Setting', 'Character Ensemble', 'Comedy Style', 'Relationship Dynamics'],
          qualityChecklist: ['Unique workplace', 'Diverse characters', 'Clear comedy tone']
        },
        {
          phase: 2,
          focusAreas: ['Episode Templates', 'A/B/C Stories', 'Character Pairings', 'Running Gags'],
          qualityChecklist: ['Episode variety', 'Character rotation', 'Comedy consistency']
        },
        {
          phase: 3,
          focusAreas: ['Character Relationships', 'Seasonal Arcs', 'Will-They-Won\'t-They', 'Character Growth'],
          qualityChecklist: ['Relationship development', 'Character evolution', 'Comedy/heart balance']
        },
        {
          phase: 4,
          focusAreas: ['Pilot Script', 'Series Bible', 'Casting Profiles', 'Network Pitch'],
          qualityChecklist: ['Strong pilot concept', 'Long-term potential', 'Network fit']
        }
      ],
      workflow: {
        emphasizePhases: [1, 2],
        customValidation: {
          ensembleCast: true,
          comedyConsistency: true,
          workplaceSetting: true
        }
      }
    },
    formattingRules: {
      pageLength: '22-30 pages (pilot)',
      formatStyle: 'TV Comedy Script',
      industryStandards: ['Network Comedy Standards', 'Multi-Camera Format', 'Writers Room Guidelines']
    },
    exampleProjects: [
      { title: 'The Office', network: 'NBC', year: '2005', genre: 'Workplace Comedy' },
      { title: 'Brooklyn Nine-Nine', network: 'FOX/NBC', year: '2013', genre: 'Workplace Comedy' },
      { title: 'Parks and Recreation', network: 'NBC', year: '2009', genre: 'Workplace Comedy' }
    ],
    preview: {
      phase1Example: 'A dysfunctional team at a small-town marketing agency navigates office politics, client disasters, and personal relationships...',
      phase2Example: 'Episode Template: Cold Open + 3 Acts\n- A Story: Main office conflict/project\n- B Story: Character relationship...',
      phase3Example: 'JAMIE & ALEX (Season 1 Arc):\nEpisode 1: Meet as rivals for same promotion...',
      phase4Example: 'LOGLINE: A mockumentary following the misadventures of employees at Pinnacle Marketing...'
    }
  }
];

interface TemplateLibraryProps {
  projectType?: ProjectType;
  subcategory?: SubCategory;
  onSelectTemplate: (template: StoryTemplate) => void;
  onBack?: () => void;
  className?: string;
}

export function TemplateLibrary({
  projectType,
  subcategory,
  onSelectTemplate,
  onBack,
  className
}: TemplateLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<StoryTemplate | null>(null);
  const [filteredTemplates, setFilteredTemplates] = useState<StoryTemplate[]>([]);
  const [sortBy, setSortBy] = useState<'popularity' | 'rating' | 'newest'>('popularity');

  // Create a blank template based on the selected project type
  const createBlankTemplate = (): StoryTemplate => {
    const templateCategory = projectType?.category || 'screenplay';
    const templateSubcategory = subcategory?.name || 'feature_film';
    
    return {
      id: 'blank-template',
      name: 'Blank Project',
      description: 'Start with a completely blank project and create your story from scratch.',
      category: templateCategory,
      subcategory: templateSubcategory,
      difficulty: 'beginner' as const,
      estimatedDuration: 'Variable',
      isBuiltin: true,
      isFeatured: false,
      usageCount: 0,
      ratingAverage: 0,
      ratingCount: 0,
      tags: ['blank', 'custom', 'starter'],
      structureConfig: {
        phases: [
          {
            phase: 1,
            focusAreas: ['Story Foundation', 'Character Development', 'Initial Concept'],
            qualityChecklist: ['Clear protagonist defined', 'Basic story premise established', 'Core conflict identified']
          },
          {
            phase: 2,
            focusAreas: ['Plot Structure', 'Story Arc', 'Pacing'],
            qualityChecklist: ['Three-act structure outlined', 'Key plot points identified', 'Character arcs defined']
          },
          {
            phase: 3,
            focusAreas: ['Character Depth', 'Dialogue', 'Scene Development'],
            qualityChecklist: ['Rich character backgrounds', 'Authentic dialogue', 'Compelling scenes']
          }
        ],
        workflow: {
          customizations: {
            allowSkipPhases: true,
            adaptivePacing: true,
            flexibleStructure: true
          }
        }
      },
      content: {
        outline: '',
        characters: [],
        plotPoints: [],
        themes: [],
        synopsis: ''
      }
    };
  };

  useEffect(() => {
    let templates = BUILTIN_TEMPLATES;

    // Filter by project type and subcategory
    if (projectType) {
      templates = templates.filter(t => t.category === projectType.category);
    }
    if (subcategory) {
      templates = templates.filter(t => t.subcategory === subcategory.id);
    }

    // Filter by search query
    if (searchQuery) {
      templates = templates.filter(t =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Sort templates
    switch (sortBy) {
      case 'popularity':
        templates.sort((a, b) => b.usageCount - a.usageCount);
        break;
      case 'rating':
        templates.sort((a, b) => b.ratingAverage - a.ratingAverage);
        break;
      case 'newest':
        templates.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    setFilteredTemplates(templates);
  }, [projectType, subcategory, searchQuery, sortBy]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-600 bg-green-50 border-green-200';
      case 'intermediate': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'advanced': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'expert': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (selectedTemplate) {
    return (
      <FadeIn className={className}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setSelectedTemplate(null)}
            >
              <ArrowLeft className="size-4 mr-2" />
              Back to Templates
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Eye className="size-4" />
                Preview
              </Button>
              <Button
                onClick={() => onSelectTemplate(selectedTemplate)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2"
              >
                <Play className="size-4" />
                Use This Template
              </Button>
            </div>
          </div>

          {/* Template Details */}
          <ProfessionalCard variant="feature">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-2xl">{selectedTemplate.name}</CardTitle>
                    {selectedTemplate.isFeatured && (
                      <Badge className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                        <Sparkles className="size-3 mr-1" />
                        Featured
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground text-lg max-w-2xl">
                    {selectedTemplate.description}
                  </p>
                  <div className="flex items-center gap-3">
                    <Badge className={cn("text-xs", getDifficultyColor(selectedTemplate.difficulty))}>
                      {selectedTemplate.difficulty}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      <Clock className="size-3 mr-1" />
                      {selectedTemplate.estimatedDuration}
                    </Badge>
                    <QualityScore score={selectedTemplate.ratingAverage} size="sm" />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 py-4 border-y">
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-600">{selectedTemplate.usageCount.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Projects Created</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{selectedTemplate.ratingAverage}%</div>
                  <div className="text-sm text-muted-foreground">Success Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{selectedTemplate.ratingCount}</div>
                  <div className="text-sm text-muted-foreground">User Reviews</div>
                </div>
              </div>

              {/* Example Projects */}
              <div>
                <h4 className="font-semibold mb-3">Example Projects</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {selectedTemplate.exampleProjects.map((project, index) => (
                    <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="font-medium">{project.title}</div>
                      {project.network && (
                        <div className="text-sm text-muted-foreground">{project.network} ({project.year})</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Phase Preview */}
              <div>
                <h4 className="font-semibold mb-3">What You'll Create</h4>
                <div className="space-y-3">
                  <div className="p-3 border rounded-lg">
                    <div className="font-medium mb-1">Phase 1: Story DNA</div>
                    <div className="text-sm text-muted-foreground">{selectedTemplate.preview.phase1Example}</div>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="font-medium mb-1">Phase 2: Scene Structure</div>
                    <div className="text-sm text-muted-foreground">{selectedTemplate.preview.phase2Example}</div>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="font-medium mb-1">Phase 3: Scene Beats</div>
                    <div className="text-sm text-muted-foreground">{selectedTemplate.preview.phase3Example}</div>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="font-medium mb-1">Phase 4: Executive Document</div>
                    <div className="text-sm text-muted-foreground">{selectedTemplate.preview.phase4Example}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </ProfessionalCard>
        </div>
      </FadeIn>
    );
  }

  return (
    <FadeIn className={className}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          {onBack && (
            <Button
              variant="ghost"
              onClick={onBack}
            >
              <ArrowLeft className="size-4 mr-2" />
              Back
            </Button>
          )}
          <div className="text-center flex-1">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Template Library
            </h2>
            <p className="text-muted-foreground">
              {projectType && subcategory ? 
                `${subcategory.name} templates` : 
                'Choose from proven industry formats'
              }
            </p>
          </div>
          <div /> {/* Spacer */}
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={sortBy === 'popularity' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('popularity')}
            >
              <Trophy className="size-4 mr-1" />
              Popular
            </Button>
            <Button
              variant={sortBy === 'rating' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('rating')}
            >
              <Star className="size-4 mr-1" />
              Top Rated
            </Button>
          </div>
        </div>

        {/* Templates Grid */}
        {filteredTemplates.length > 0 ? (
          <Stagger className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredTemplates.map((template) => (
              <HoverScale key={template.id}>
                <ProfessionalCard 
                  variant={template.isFeatured ? "feature" : "default"}
                  className="cursor-pointer transition-all duration-200 hover:shadow-lg h-full"
                  onClick={() => setSelectedTemplate(template)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                          {template.isFeatured && (
                            <Badge variant="secondary" className="text-xs">
                              <Sparkles className="size-3 mr-1" />
                              Featured
                            </Badge>
                          )}
                          {template.isPopular && (
                            <Badge variant="outline" className="text-xs">
                              Popular
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {template.description}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={cn("text-xs", getDifficultyColor(template.difficulty))}>
                            {template.difficulty}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            <Clock className="size-3 mr-1" />
                            {template.estimatedDuration}
                          </Badge>
                        </div>
                      </div>
                      <ChevronRight className="size-5 text-muted-foreground ml-2" />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Users className="size-3" />
                          {template.usageCount.toLocaleString()}
                        </div>
                        <QualityScore score={template.ratingAverage} size="sm" />
                      </div>
                      <Button size="sm" variant="outline">
                        <BookOpen className="size-3 mr-1" />
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </ProfessionalCard>
              </HoverScale>
            ))}
          </Stagger>
        ) : (
          <div className="text-center py-12">
            <BookOpen className="size-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No templates found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search or browse all available templates
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery('');
                setSortBy('popularity');
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}

        {/* Footer */}
        <div className="text-center pt-6 border-t">
          <p className="text-sm text-muted-foreground mb-3">
            Don't see what you need?
          </p>
          <div className="flex justify-center gap-3">
            <Button variant="outline" size="sm">
              Request a Template
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onSelectTemplate(createBlankTemplate())}
            >
              Start with Blank Project
            </Button>
          </div>
        </div>
      </div>
    </FadeIn>
  );
}