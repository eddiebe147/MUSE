'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Plus,
  PenTool, 
  FileText,
  Clock,
  ArrowRight,
  Sparkles,
  Edit3,
  Download,
  BookOpen,
  Upload,
  CheckCircle
} from 'lucide-react';
import { StoryCreationStart } from './story-creation-start';
import { cn } from '@/lib/utils';
import type { User } from '@/lib/auth';

interface WritingProject {
  id: string;
  title: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  progress: {
    phase1Complete: boolean;
    phase2Complete: boolean;
    phase3Complete: boolean;
    phase4Complete: boolean;
    currentPhase: number;
  };
  stats: {
    wordCount?: number;
    sceneCount?: number;
    estimatedDuration?: string;
  };
}

interface ProjectDashboardProps {
  user: User;
  className?: string;
}

// Mock data for now - replace with actual database queries
const getMockProjects = (): WritingProject[] => [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    title: 'The Last Symphony',
    description: 'A dystopian story about music as resistance',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20'),
    progress: {
      phase1Complete: true,
      phase2Complete: true,
      phase3Complete: false,
      phase4Complete: false,
      currentPhase: 3
    },
    stats: {
      wordCount: 2400,
      sceneCount: 4,
      estimatedDuration: '120 min'
    }
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    title: 'Desert Winds',
    description: 'Adventure story set in post-apocalyptic desert',
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-05'),
    progress: {
      phase1Complete: true,
      phase2Complete: false,
      phase3Complete: false,
      phase4Complete: false,
      currentPhase: 2
    },
    stats: {
      wordCount: 800,
      sceneCount: 2,
      estimatedDuration: '90 min'
    }
  }
];

const PHASE_ICONS = [
  <Sparkles className="size-4" key="1" />,
  <FileText className="size-4" key="2" />,
  <Edit3 className="size-4" key="3" />,
  <Download className="size-4" key="4" />
];

const PHASE_NAMES = [
  'One Line Summary',
  'Scene Lines',
  'Scene Breakdowns', 
  'Script Export'
];

export function ProjectDashboard({ user, className }: ProjectDashboardProps) {
  const router = useRouter();
  const [projects, setProjects] = useState<WritingProject[]>([]);
  const [isLoading, setIsLoading] = useState(false); // Start as not loading
  const [showCreationInterface, setShowCreationInterface] = useState(true); // Show creation interface by default

  useEffect(() => {
    // Load existing projects in background but don't block UI
    const loadProjects = async () => {
      try {
        // TODO: Replace with actual API call
        await new Promise(resolve => setTimeout(resolve, 500));
        const existingProjects = getMockProjects();
        setProjects(existingProjects);
        // If user has projects, still show creation interface first
      } catch (error) {
        console.error('Error loading projects:', error);
      }
    };

    loadProjects();
  }, []);

  const calculateProgress = (progress: WritingProject['progress']) => {
    const completed = [
      progress.phase1Complete,
      progress.phase2Complete, 
      progress.phase3Complete,
      progress.phase4Complete
    ].filter(Boolean).length;
    
    return (completed / 4) * 100;
  };

  const formatDate = (date: Date) => {
    return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
      Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      'day'
    );
  };

  const handleCreateNew = () => {
    setShowCreationInterface(true);
  };

  const handleStartWithTranscript = async (analysisData: any) => {
    // Create a new project with transcript analysis data and navigate to it
    const newProjectId = crypto.randomUUID();
    // Store analysis data in sessionStorage for the new project
    sessionStorage.setItem(`project_${newProjectId}_transcript`, JSON.stringify(analysisData));
    router.push(`/write/${newProjectId}`);
  };

  const handleStartBlank = async () => {
    // Create a new project with hasStarted=true and navigate to it  
    const newProjectId = crypto.randomUUID();
    // Mark as started to skip startup screen
    sessionStorage.setItem(`project_${newProjectId}_started`, 'true');
    router.push(`/write/${newProjectId}`);
  };

  const handleOpenProject = (projectId: string) => {
    router.push(`/write/${projectId}`);
  };

  // Always show creation interface immediately - no loading states
  if (showCreationInterface) {
    return (
      <div className={cn("min-h-screen bg-background", className)}>
        <StoryCreationStart
          onStartWithTranscript={handleStartWithTranscript}
          onStartBlank={handleStartBlank}
        />
        
        {/* Show existing projects if any */}
        {projects.length > 0 && (
          <div className="w-full max-w-4xl mx-auto px-6 pb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Your Recent Projects</h2>
              <Button
                variant="ghost" 
                onClick={() => setShowCreationInterface(false)}
                className="text-sm"
              >
                View All Projects
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {projects.slice(0, 3).map((project) => (
                <Card 
                  key={project.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleOpenProject(project.id)}
                >
                  <CardContent className="p-4">
                    <h3 className="font-medium mb-1">{project.title}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{project.description}</p>
                    <Badge variant="secondary" className="text-xs">
                      Phase {project.progress.currentPhase}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full projects view (if user clicks "View All Projects")
  return (
    <div className={cn("min-h-screen bg-background p-6", className)}>
      <div className="w-full max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <PenTool className="size-8 text-purple-600" />
              <div>
                <h1 className="text-3xl font-bold">Your Writing Projects</h1>
                <p className="text-muted-foreground">Continue writing or start a new story</p>
              </div>
            </div>
            <Button onClick={handleCreateNew} className="flex items-center gap-2">
              <Plus className="size-4" />
              New Project
            </Button>
          </div>
        </div>

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="size-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No Projects Yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Start your first writing project and use MUSE's 4-phase workflow to create professional scripts.
            </p>
            <Button onClick={handleCreateNew}>
              <Plus className="size-4 mr-2" />
              Create Your First Project
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Card 
                key={project.id} 
                className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
                onClick={() => handleOpenProject(project.id)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-1">{project.title}</CardTitle>
                      {project.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {project.description}
                        </p>
                      )}
                    </div>
                    <Badge variant="secondary" className="ml-2">
                      Phase {project.progress.currentPhase}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Writing Progress</span>
                      <span className="font-medium">
                        {Math.round(calculateProgress(project.progress))}%
                      </span>
                    </div>
                    <Progress value={calculateProgress(project.progress)} className="h-2" />
                  </div>

                  {/* Phase Status */}
                  <div className="grid grid-cols-4 gap-2">
                    {PHASE_NAMES.map((phaseName, index) => {
                      const isComplete = [
                        project.progress.phase1Complete,
                        project.progress.phase2Complete,
                        project.progress.phase3Complete,
                        project.progress.phase4Complete
                      ][index];
                      
                      const isCurrent = project.progress.currentPhase === index + 1;
                      
                      return (
                        <div 
                          key={index}
                          className={cn(
                            "flex flex-col items-center p-2 rounded text-xs",
                            isComplete ? "bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-300" :
                            isCurrent ? "bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-300" :
                            "bg-gray-50 text-gray-500 dark:bg-gray-950/20 dark:text-gray-400"
                          )}
                        >
                          {PHASE_ICONS[index]}
                          <span className="mt-1 text-center leading-tight">
                            {phaseName.split(' ')[0]}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="size-3" />
                        <span>{formatDate(project.updatedAt)}</span>
                      </div>
                      {project.stats.sceneCount && (
                        <div className="flex items-center gap-1">
                          <FileText className="size-3" />
                          <span>{project.stats.sceneCount} scenes</span>
                        </div>
                      )}
                    </div>
                    
                    <Button size="sm" variant="ghost" className="p-1 h-auto">
                      <ArrowRight className="size-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}