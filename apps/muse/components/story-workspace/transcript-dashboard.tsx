'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TranscriptAnalysis } from '@/components/transcript-analysis/transcript-analysis';
import { 
  FileText, 
  Users, 
  Zap, 
  Upload,
  TrendingUp,
  BookOpen,
  ChevronRight,
  ChevronDown,
  Target,
  Drama,
  Heart,
  BarChart3,
  Lightbulb,
  Clock
} from 'lucide-react';

// Simple time formatting function
const formatDistanceToNow = (date: Date, options?: { addSuffix?: boolean }) => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  
  if (diffMins < 1) return options?.addSuffix ? 'just now' : '0 minutes';
  if (diffMins < 60) return options?.addSuffix ? `${diffMins}m ago` : `${diffMins} minutes`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return options?.addSuffix ? `${diffHours}h ago` : `${diffHours} hours`;
  
  const diffDays = Math.floor(diffHours / 24);
  return options?.addSuffix ? `${diffDays}d ago` : `${diffDays} days`;
};

interface SidebarSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  hasData: boolean;
  isExpanded: boolean;
  dataCount?: number;
  lastUpdated?: Date;
  emptyStateMessage: string;
  emptyStateAction?: string;
  isProcessing?: boolean;
}

interface TranscriptDashboardProps {
  selectedProject?: {
    id: string;
    title: string;
    status: string;
  };
  onProjectChange?: (projectId: string) => void;
}

export function TranscriptDashboard({ selectedProject, onProjectChange }: TranscriptDashboardProps) {
  const currentProject = selectedProject;
  
  // Add demo mode toggle for testing
  const [isDemoMode, setIsDemoMode] = useState(false);
  
  // Initialize sidebar sections with empty states (or demo data)
  const [sections, setSections] = useState<SidebarSection[]>([
    {
      id: 'story_moments',
      title: 'Story Moments',
      icon: <Zap className="size-4" />,
      hasData: isDemoMode,
      isExpanded: false,
      dataCount: isDemoMode ? 3 : 0,
      lastUpdated: isDemoMode ? new Date(Date.now() - 1000 * 60 * 15) : undefined, // 15 min ago
      emptyStateMessage: 'Upload transcript to detect story moments',
      emptyStateAction: 'Upload Transcript'
    },
    {
      id: 'characters',
      title: 'Characters',
      icon: <Users className="size-4" />,
      hasData: isDemoMode,
      isExpanded: false,
      dataCount: isDemoMode ? 2 : 0,
      lastUpdated: isDemoMode ? new Date(Date.now() - 1000 * 60 * 10) : undefined, // 10 min ago
      emptyStateMessage: 'Characters will appear from transcript analysis',
      emptyStateAction: 'Analyze Transcript'
    },
    {
      id: 'structure',
      title: 'Structure Analysis',
      icon: <Drama className="size-4" />,
      hasData: false,
      isExpanded: false,
      dataCount: 0,
      emptyStateMessage: 'Complete Phase 2 to see story structure',
      emptyStateAction: 'Continue to Phase 2'
    },
    {
      id: 'themes',
      title: 'Themes',
      icon: <Target className="size-4" />,
      hasData: false,
      isExpanded: false,
      dataCount: 0,
      emptyStateMessage: 'Themes emerge as your story develops',
      emptyStateAction: 'Develop Story'
    },
    {
      id: 'story_health',
      title: 'Story Health',
      icon: <BarChart3 className="size-4" />,
      hasData: isDemoMode,
      isExpanded: false,
      dataCount: isDemoMode ? 1 : 0,
      lastUpdated: isDemoMode ? new Date(Date.now() - 1000 * 60 * 5) : undefined, // 5 min ago
      emptyStateMessage: 'Story health updates with your progress',
      emptyStateAction: 'Add Content'
    }
  ]);
  
  // Update sections when demo mode changes
  React.useEffect(() => {
    setSections(prev => prev.map(section => ({
      ...section,
      hasData: ['story_moments', 'characters', 'story_health'].includes(section.id) ? isDemoMode : false,
      dataCount: section.id === 'story_moments' && isDemoMode ? 3 :
                 section.id === 'characters' && isDemoMode ? 2 :
                 section.id === 'story_health' && isDemoMode ? 1 : 0,
      lastUpdated: isDemoMode ? 
        (section.id === 'story_moments' ? new Date(Date.now() - 1000 * 60 * 15) :
         section.id === 'characters' ? new Date(Date.now() - 1000 * 60 * 10) :
         section.id === 'story_health' ? new Date(Date.now() - 1000 * 60 * 5) : undefined) : undefined
    })));
  }, [isDemoMode]);

  const toggleSection = (sectionId: string) => {
    setSections(prev => prev.map(section => 
      section.id === sectionId 
        ? { ...section, isExpanded: !section.isExpanded }
        : section
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'development': return 'bg-blue-500';
      case 'pre_production': return 'bg-yellow-500';
      case 'production': return 'bg-green-500';
      case 'post_production': return 'bg-purple-500';
      default: return 'bg-gray-400';
    }
  };

  const getSectionStyle = (section: SidebarSection) => {
    if (section.isProcessing) {
      return 'border-l-4 border-blue-500 bg-blue-50/50 dark:bg-blue-950/20';
    }
    if (section.hasData) {
      return 'border-l-4 border-green-500 bg-green-50/50 dark:bg-green-950/20';
    }
    return 'border-l-4 border-gray-300 bg-gray-50/50 dark:bg-gray-950/20';
  };

  // Show general empty state if no project is selected
  if (!currentProject) {
    return (
      <div className="flex flex-col h-full">
        <div className="border-b p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Zap className="size-5 text-purple-500" />
            <h2 className="font-semibold text-sm">Story Intelligence</h2>
          </div>
        </div>
        <div className="p-4 space-y-3">
          {sections.map((section) => (
            <div key={section.id} className="border rounded-lg p-3 bg-gray-50/50 dark:bg-gray-950/20">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {section.icon}
                <span>{section.title}</span>
              </div>
              <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                <Lightbulb className="size-3" />
                <span>Create a project to unlock insights</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Zap className="size-5 text-purple-500" />
          <h2 className="font-semibold text-sm">Story Intelligence</h2>
        </div>
        
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className={`size-2 rounded-full ${getStatusColor(currentProject.status)}`} />
            <span className="font-medium">{currentProject.title}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              variant={isDemoMode ? "default" : "outline"} 
              onClick={() => setIsDemoMode(!isDemoMode)}
              className="text-xs h-6 px-2"
            >
              {isDemoMode ? 'Live' : 'Demo'}
            </Button>
            <Badge variant="outline" className="text-xs">
              {currentProject.status.replace('_', ' ')}
            </Badge>
          </div>
        </div>
      </div>

      {/* Interactive Sections */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-3">
          {sections.map((section) => (
            <div key={section.id} className={`border rounded-lg transition-all duration-200 ${getSectionStyle(section)}`}>
              {/* Section Header */}
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full p-3 flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {section.icon}
                  <span className="text-sm font-medium">{section.title}</span>
                  {section.hasData && section.dataCount && (
                    <Badge variant="secondary" className="text-xs">
                      {section.dataCount} {section.dataCount === 1 ? 'item' : 'items'}
                    </Badge>
                  )}
                  {section.isProcessing && (
                    <Badge variant="secondary" className="text-xs animate-pulse">
                      Processing...
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {section.lastUpdated && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="size-3" />
                      <span>{formatDistanceToNow(section.lastUpdated, { addSuffix: true })}</span>
                    </div>
                  )}
                  {section.isExpanded ? (
                    <ChevronDown className="size-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="size-4 text-muted-foreground" />
                  )}
                </div>
              </button>

              {/* Section Content */}
              {section.isExpanded && (
                <div className="px-3 pb-3">
                  {section.hasData ? (
                    <div className="space-y-2">
                      {/* Demo content based on section type */}
                      {section.id === 'story_moments' && isDemoMode && (
                        <div className="space-y-2">
                          <div className="flex items-start gap-2 p-2 rounded bg-orange-50 dark:bg-orange-950/20">
                            <Heart className="size-3 mt-1 text-orange-500" />
                            <div className="text-xs">
                              <div className="font-medium">Conflict: Sarah vs landlord</div>
                              <div className="text-muted-foreground">(0:15-2:30) • Confidence: 85%</div>
                            </div>
                          </div>
                          <div className="flex items-start gap-2 p-2 rounded bg-blue-50 dark:bg-blue-950/20">
                            <Lightbulb className="size-3 mt-1 text-blue-500" />
                            <div className="text-xs">
                              <div className="font-medium">Revelation: Mike's job situation</div>
                              <div className="text-muted-foreground">(4:45-6:20) • Confidence: 92%</div>
                            </div>
                          </div>
                          <div className="flex items-start gap-2 p-2 rounded bg-red-50 dark:bg-red-950/20">
                            <Zap className="size-3 mt-1 text-red-500" />
                            <div className="text-xs">
                              <div className="font-medium">Tension: Family dinner argument</div>
                              <div className="text-muted-foreground">(8:10-12:15) • Confidence: 78%</div>
                            </div>
                          </div>
                        </div>
                      )}
                      {section.id === 'characters' && isDemoMode && (
                        <div className="space-y-2">
                          <div className="flex items-start gap-2 p-2 rounded bg-green-50 dark:bg-green-950/20">
                            <Users className="size-3 mt-1 text-green-500" />
                            <div className="text-xs">
                              <div className="font-medium">Sarah (Protagonist)</div>
                              <div className="text-muted-foreground">Goal-oriented, appears in 3 scenes</div>
                            </div>
                          </div>
                          <div className="flex items-start gap-2 p-2 rounded bg-blue-50 dark:bg-blue-950/20">
                            <Users className="size-3 mt-1 text-blue-500" />
                            <div className="text-xs">
                              <div className="font-medium">Mike (Supporting)</div>
                              <div className="text-muted-foreground">Facing challenges, appears in 2 scenes</div>
                            </div>
                          </div>
                        </div>
                      )}
                      {section.id === 'story_health' && isDemoMode && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between p-2 rounded bg-green-50 dark:bg-green-950/20">
                            <div className="flex items-center gap-2 text-xs">
                              <div className="size-2 rounded-full bg-green-500"></div>
                              <span>Clear protagonist</span>
                            </div>
                            <div className="text-xs text-green-600 dark:text-green-400 font-medium">✓</div>
                          </div>
                          <div className="flex items-center justify-between p-2 rounded bg-yellow-50 dark:bg-yellow-950/20">
                            <div className="flex items-center gap-2 text-xs">
                              <div className="size-2 rounded-full bg-yellow-500"></div>
                              <span>Conflict needs escalation</span>
                            </div>
                            <div className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">⚠</div>
                          </div>
                          <div className="flex items-center justify-between p-2 rounded bg-red-50 dark:bg-red-950/20">
                            <div className="flex items-center gap-2 text-xs">
                              <div className="size-2 rounded-full bg-red-500"></div>
                              <span>Resolution incomplete</span>
                            </div>
                            <div className="text-xs text-red-600 dark:text-red-400 font-medium">✗</div>
                          </div>
                          <div className="mt-3 p-2 rounded bg-purple-50 dark:bg-purple-950/20">
                            <div className="flex items-center gap-2 text-xs font-medium">
                              <BarChart3 className="size-3 text-purple-500" />
                              <span>Overall Score: 73%</span>
                            </div>
                          </div>
                        </div>
                      )}
                      {!isDemoMode && (
                        <div className="text-sm text-muted-foreground">
                          Real analysis data would appear here...
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4 space-y-2">
                      <Lightbulb className="size-6 mx-auto text-muted-foreground opacity-50" />
                      <p className="text-sm text-muted-foreground">{section.emptyStateMessage}</p>
                      {section.emptyStateAction && (
                        <Button size="sm" variant="outline" className="text-xs">
                          {section.emptyStateAction}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Quick Actions Section */}
          <Card className="mt-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Upload className="size-4" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              <TranscriptAnalysis 
                projectId={currentProject.id}
                onClose={() => {}}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}