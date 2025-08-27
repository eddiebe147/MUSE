'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { 
  FileText, 
  Upload, 
  Eye, 
  Trash2, 
  Clock, 
  Zap,
  Plus,
  ArrowLeft
} from 'lucide-react';
import { TranscriptUpload } from './transcript-upload';
import { HighlightDashboard } from './highlight-dashboard';
import { formatDistanceToNow } from 'date-fns';

interface TranscriptSummary {
  id: string;
  title: string;
  source_type: string;
  word_count: number;
  duration_minutes: number;
  created_at: string;
  updated_at: string;
  has_analysis: boolean;
  story_moments_count: number;
  story_potential: number;
}

interface TranscriptAnalysisProps {
  projectId: string;
  onClose?: () => void;
}

type ViewMode = 'list' | 'upload' | 'dashboard';

export function TranscriptAnalysis({ projectId, onClose }: TranscriptAnalysisProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [transcripts, setTranscripts] = useState<TranscriptSummary[]>([]);
  const [selectedTranscript, setSelectedTranscript] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchTranscripts();
  }, [projectId]);

  const fetchTranscripts = async () => {
    if (!projectId) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/transcripts?projectId=${projectId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch transcripts');
      }
      
      const data = await response.json();
      setTranscripts(data.transcripts || []);
    } catch (error) {
      console.error('Error fetching transcripts:', error);
      toast.error('Failed to load transcripts');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTranscriptDetails = async (transcriptId: string) => {
    try {
      const response = await fetch(`/api/transcripts/${transcriptId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch transcript details');
      }
      
      const transcript = await response.json();
      setSelectedTranscript(transcript);
      setViewMode('dashboard');
    } catch (error) {
      console.error('Error fetching transcript details:', error);
      toast.error('Failed to load transcript details');
    }
  };

  const deleteTranscript = async (transcriptId: string) => {
    if (!confirm('Are you sure you want to delete this transcript? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(transcriptId);
    try {
      const response = await fetch(`/api/transcripts?id=${transcriptId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete transcript');
      }

      toast.success('Transcript deleted successfully');
      await fetchTranscripts();
    } catch (error) {
      console.error('Error deleting transcript:', error);
      toast.error('Failed to delete transcript');
    } finally {
      setIsDeleting(null);
    }
  };

  const updateTranscriptAnalysis = async (updatedAnalysis: any) => {
    if (!selectedTranscript) return;

    try {
      const response = await fetch(`/api/transcripts/${selectedTranscript.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          analysis: updatedAnalysis
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update analysis');
      }

      // Update local state
      setSelectedTranscript(prev => ({
        ...prev,
        analysis: updatedAnalysis
      }));

      toast.success('Analysis updated successfully');
    } catch (error) {
      console.error('Error updating analysis:', error);
      toast.error('Failed to update analysis');
    }
  };

  const handleUploadComplete = (transcript: any, analysis: any) => {
    toast.success('Transcript processed successfully!');
    fetchTranscripts(); // Refresh the list
    setViewMode('list');
  };

  const getSourceTypeColor = (sourceType: string) => {
    switch (sourceType) {
      case 'interview': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'meeting': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'brainstorm': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getPotentialColor = (potential: number) => {
    if (potential >= 8) return 'text-green-600 dark:text-green-400';
    if (potential >= 6) return 'text-yellow-600 dark:text-yellow-400';
    if (potential >= 4) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  // Render different views based on current mode
  if (viewMode === 'upload') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <ArrowLeft className="size-4 mr-2" />
            Back to Transcripts
          </Button>
        </div>
        
        <TranscriptUpload
          projectId={projectId}
          onUploadComplete={handleUploadComplete}
          onCancel={() => setViewMode('list')}
        />
      </div>
    );
  }

  if (viewMode === 'dashboard' && selectedTranscript) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <ArrowLeft className="size-4 mr-2" />
            Back to Transcripts
          </Button>
        </div>

        <HighlightDashboard
          transcriptId={selectedTranscript.id}
          transcriptTitle={selectedTranscript.title}
          analysis={selectedTranscript.analysis}
          onUpdateAnalysis={updateTranscriptAnalysis}
          onBack={() => setViewMode('list')}
        />
      </div>
    );
  }

  // Default list view
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="size-5 text-purple-500" />
            Transcript Analysis
          </h2>
          <p className="text-sm text-muted-foreground">
            Transform raw interviews and conversations into structured story elements
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={() => setViewMode('upload')}
            className="flex items-center gap-2"
          >
            <Plus className="size-4" />
            Upload Transcript
          </Button>
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-5 w-28" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && transcripts.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Upload className="size-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No Transcripts Yet</h3>
            <p className="text-muted-foreground mb-6">
              Upload your first interview or conversation to extract story moments using AI analysis.
            </p>
            <Button onClick={() => setViewMode('upload')}>
              <Upload className="size-4 mr-2" />
              Upload Your First Transcript
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Transcripts List */}
      {!isLoading && transcripts.length > 0 && (
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            {transcripts.length} transcript{transcripts.length !== 1 ? 's' : ''} • 
            {transcripts.reduce((sum, t) => sum + (t.story_moments_count || 0), 0)} total story moments found
          </div>

          <ScrollArea className="space-y-4">
            {transcripts.map((transcript) => (
              <Card key={transcript.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <h3 className="font-medium">{transcript.title}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="size-4" />
                          <span>{transcript.duration_minutes} min</span>
                          <span>•</span>
                          <span>{transcript.word_count.toLocaleString()} words</span>
                          <span>•</span>
                          <span>{formatDistanceToNow(new Date(transcript.created_at), { addSuffix: true })}</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => fetchTranscriptDetails(transcript.id)}
                          disabled={!transcript.has_analysis}
                        >
                          <Eye className="size-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteTranscript(transcript.id)}
                          disabled={isDeleting === transcript.id}
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="secondary" 
                        className={getSourceTypeColor(transcript.source_type)}
                      >
                        {transcript.source_type}
                      </Badge>
                      
                      {transcript.has_analysis && (
                        <>
                          <Badge variant="outline">
                            <Zap className="size-3 mr-1" />
                            {transcript.story_moments_count} moments
                          </Badge>
                          <Badge 
                            variant="outline"
                            className={getPotentialColor(transcript.story_potential)}
                          >
                            {transcript.story_potential}/10 potential
                          </Badge>
                        </>
                      )}
                      
                      {!transcript.has_analysis && (
                        <Badge variant="destructive">Processing failed</Badge>
                      )}
                    </div>

                    {/* Quick Preview */}
                    {transcript.has_analysis && transcript.story_moments_count > 0 && (
                      <div className="text-sm text-muted-foreground">
                        <strong>Story Potential:</strong> Analysis found {transcript.story_moments_count} significant moments 
                        with an overall story rating of {transcript.story_potential}/10.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}