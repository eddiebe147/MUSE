'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { 
  Upload,
  FileText,
  PenTool,
  Sparkles,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Users,
  Zap,
  BookOpen,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface StoryCreationStartProps {
  onStartWithTranscript: (analysisData: TranscriptAnalysis) => void;
  onStartBlank: () => void;
  className?: string;
}

interface TranscriptAnalysis {
  summary: string;
  characters: string[];
  themes: string[];
  conflicts: string[];
  keyMoments: Array<{
    timestamp?: string;
    description: string;
    emotional_weight: number;
  }>;
  suggestedGenre: string;
}

interface UploadedFile {
  name: string;
  size: number;
  type: string;
  content: string;
}

export function StoryCreationStart({
  onStartWithTranscript,
  onStartBlank,
  className
}: StoryCreationStartProps) {
  const [selectedPath, setSelectedPath] = useState<'transcript' | 'blank' | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [analysisResult, setAnalysisResult] = useState<TranscriptAnalysis | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState(0);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setUploadedFile({
        name: file.name,
        size: file.size,
        type: file.type,
        content
      });
    };
    reader.readAsText(file);
  }, []);

  const analyzeTranscript = useCallback(async () => {
    if (!uploadedFile) return;

    setIsAnalyzing(true);
    setAnalysisProgress(0);

    try {
      // Simulate AI analysis with progressive updates
      const progressSteps = [
        { progress: 20, status: "Reading transcript..." },
        { progress: 40, status: "Identifying characters..." },
        { progress: 60, status: "Extracting themes..." },
        { progress: 80, status: "Finding key moments..." },
        { progress: 100, status: "Analysis complete!" }
      ];

      for (const step of progressSteps) {
        await new Promise(resolve => setTimeout(resolve, 800));
        setAnalysisProgress(step.progress);
      }

      // Mock analysis result - in reality, this would call AI service
      const mockAnalysis: TranscriptAnalysis = {
        summary: "A conversation between two friends discussing life choices, career challenges, and the importance of following one's dreams despite setbacks.",
        characters: ["Alex", "Jamie", "The Mentor Figure"],
        themes: ["Self-discovery", "Friendship", "Career transitions", "Taking risks"],
        conflicts: ["Internal doubt vs ambition", "Security vs adventure", "Past failures vs future hopes"],
        keyMoments: [
          {
            timestamp: "03:45",
            description: "Alex reveals their fear of leaving their stable job",
            emotional_weight: 8
          },
          {
            timestamp: "08:20", 
            description: "Jamie shares the story of their own career pivot",
            emotional_weight: 9
          },
          {
            timestamp: "15:30",
            description: "Both friends realize they're at similar crossroads",
            emotional_weight: 10
          }
        ],
        suggestedGenre: "Contemporary Drama"
      };

      setAnalysisResult(mockAnalysis);
    } catch (error) {
      console.error('Error analyzing transcript:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [uploadedFile]);

  const handleProceedWithTranscript = useCallback(() => {
    if (analysisResult) {
      onStartWithTranscript(analysisResult);
    }
  }, [analysisResult, onStartWithTranscript]);

  if (selectedPath === null) {
    return (
      <div className={cn("w-full max-w-4xl mx-auto p-6", className)}>
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="size-8 text-purple-600" />
            <h1 className="text-3xl font-bold">MUSE Story Creation</h1>
          </div>
          <p className="text-xl text-muted-foreground">
            How would you like to start your story?
          </p>
        </div>

        {/* Path Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Path 1: From Transcript */}
          <Card 
            className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-2 hover:border-purple-300"
            onClick={() => setSelectedPath('transcript')}
          >
            <CardContent className="p-8 text-center">
              <div className="size-16 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
                <FileText className="size-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">📄 From Transcript</h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Upload real-world conversations and let AI extract the story moments, 
                characters, and themes automatically.
              </p>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="size-4 text-green-500" />
                  <span>Auto-detect characters & conflicts</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="size-4 text-green-500" />
                  <span>Extract emotional story beats</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="size-4 text-green-500" />
                  <span>Pre-populate Phase 1 suggestions</span>
                </div>
              </div>
              
              <div className="text-xs text-muted-foreground mb-4">
                Supports: .txt, .docx, .pdf files
              </div>
              
              <Button className="w-full">
                <Upload className="size-4 mr-2" />
                Upload File
              </Button>
            </CardContent>
          </Card>

          {/* Path 2: Start Blank */}
          <Card 
            className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-2 hover:border-blue-300"
            onClick={() => setSelectedPath('blank')}
          >
            <CardContent className="p-8 text-center">
              <div className="size-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                <PenTool className="size-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">🎨 Writing Canvas</h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Jump into a clean, distraction-free writing environment. Your 
                words take center stage with AI helpers available when needed.
              </p>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="size-4 text-green-500" />
                  <span>Premium writing interface</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="size-4 text-green-500" />
                  <span>Auto-save & version history</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="size-4 text-green-500" />
                  <span>Optional AI & workflow tools</span>
                </div>
              </div>
              
              <div className="text-xs text-muted-foreground mb-4">
                Writer-focused, distraction-free experience
              </div>
              
              <Button className="w-full" variant="default">
                <PenTool className="size-4 mr-2" />
                Open Writing Canvas
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Info */}
        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground">
            Both paths lead to the same premium writing experience with optional AI assistance
          </p>
        </div>
      </div>
    );
  }

  // Transcript Path Interface
  if (selectedPath === 'transcript') {
    return (
      <div className={cn("w-full max-w-4xl mx-auto p-6", className)}>
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => setSelectedPath(null)}
            className="mb-4"
          >
            ← Back to path selection
          </Button>
          
          <div className="flex items-center gap-3 mb-2">
            <FileText className="size-6 text-purple-600" />
            <h2 className="text-2xl font-bold">Start with Transcript</h2>
          </div>
          <p className="text-muted-foreground">
            Upload your transcript file and let AI extract the story elements
          </p>
        </div>

        {!uploadedFile && (
          <Card>
            <CardContent className="p-8">
              <div className="text-center space-y-4">
                <div className="size-16 mx-auto bg-purple-100 rounded-full flex items-center justify-center">
                  <Upload className="size-8 text-purple-600" />
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2">Choose Your Transcript File</h3>
                  <p className="text-muted-foreground">
                    Upload a conversation, interview, or any text that contains story elements
                  </p>
                </div>
                
                <div className="flex flex-wrap justify-center gap-2 mb-4">
                  <Badge variant="outline">.txt</Badge>
                  <Badge variant="outline">.docx</Badge>
                  <Badge variant="outline">.pdf</Badge>
                </div>
                
                <Input
                  type="file"
                  accept=".txt,.docx,.pdf"
                  onChange={handleFileUpload}
                  className="max-w-md mx-auto"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {uploadedFile && !analysisResult && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold">{uploadedFile.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {(uploadedFile.size / 1024).toFixed(1)} KB • Ready for analysis
                  </p>
                </div>
                <Button
                  onClick={analyzeTranscript}
                  disabled={isAnalyzing}
                  className="min-w-[140px]"
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="size-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-4 mr-2" />
                      Analyze with AI
                    </>
                  )}
                </Button>
              </div>

              {isAnalyzing && (
                <div className="space-y-3">
                  <Progress value={analysisProgress} className="h-2" />
                  <p className="text-sm text-muted-foreground text-center">
                    AI is extracting story elements from your transcript...
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {analysisResult && (
          <div className="space-y-6">
            {/* Analysis Results */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="size-5 text-yellow-500" />
                  AI Analysis Complete
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Story Summary */}
                <div>
                  <h4 className="font-semibold mb-2">📖 Story Summary</h4>
                  <p className="text-muted-foreground bg-gray-50 p-3 rounded">
                    {analysisResult.summary}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Characters */}
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Users className="size-4" />
                      Characters ({analysisResult.characters.length})
                    </h4>
                    <div className="space-y-1">
                      {analysisResult.characters.map((character, index) => (
                        <Badge key={index} variant="outline">{character}</Badge>
                      ))}
                    </div>
                  </div>

                  {/* Themes */}
                  <div>
                    <h4 className="font-semibold mb-2">🎭 Themes</h4>
                    <div className="space-y-1">
                      {analysisResult.themes.map((theme, index) => (
                        <Badge key={index} variant="secondary">{theme}</Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Key Moments */}
                <div>
                  <h4 className="font-semibold mb-3">⭐ Key Story Moments</h4>
                  <div className="space-y-3">
                    {analysisResult.keyMoments.map((moment, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          {moment.timestamp && (
                            <Badge variant="outline" className="text-xs">
                              {moment.timestamp}
                            </Badge>
                          )}
                          <span className="text-sm">{moment.description}</span>
                        </div>
                        <div className="flex">
                          {Array.from({ length: 5 }, (_, i) => (
                            <div
                              key={i}
                              className={cn(
                                "w-2 h-2 rounded-full mr-1",
                                i < Math.ceil(moment.emotional_weight / 2) 
                                  ? "bg-yellow-400" 
                                  : "bg-gray-200"
                              )}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <Button onClick={handleProceedWithTranscript} className="flex-1">
                    <ArrowRight className="size-4 mr-2" />
                    Start 4-Phase Workflow
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setUploadedFile(null);
                      setAnalysisResult(null);
                    }}
                  >
                    Upload Different File
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    );
  }

  // Blank Path Interface
  if (selectedPath === 'blank') {
    return (
      <div className={cn("w-full max-w-4xl mx-auto p-6", className)}>
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => setSelectedPath(null)}
            className="mb-4"
          >
            ← Back to path selection
          </Button>
          
          <div className="flex items-center gap-3 mb-2">
            <PenTool className="size-6 text-blue-600" />
            <h2 className="text-2xl font-bold">Start with Blank Story</h2>
          </div>
          <p className="text-muted-foreground">
            Begin with a clean slate and create your original story
          </p>
        </div>

        <Card>
          <CardContent className="p-8 text-center">
            <div className="size-16 mx-auto mb-6 bg-blue-100 rounded-full flex items-center justify-center">
              <BookOpen className="size-8 text-blue-600" />
            </div>
            
            <h3 className="text-xl font-semibold mb-3">Ready to Create</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              You'll start with Phase 1: creating your one-line story summary. 
              AI will assist you throughout all 4 phases of the writing process.
            </p>
            
            <div className="text-center space-y-3 mb-6">
              <p className="text-sm font-medium">What you'll create:</p>
              <div className="flex flex-wrap justify-center gap-2">
                <Badge variant="outline">Phase 1: One Line Summary</Badge>
                <Badge variant="outline">Phase 2: Scene Lines</Badge>
                <Badge variant="outline">Phase 3: Scene Breakdowns</Badge>
                <Badge variant="outline">Phase 4: Full Script</Badge>
              </div>
            </div>
            
            <Button onClick={onStartBlank} size="lg">
              <ArrowRight className="size-4 mr-2" />
              Begin Phase 1
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}