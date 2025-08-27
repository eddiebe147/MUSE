'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  FileText,
  Download,
  Check,
  Clock,
  Users,
  MapPin,
  DollarSign,
  Calendar,
  Star,
  TrendingUp,
  Briefcase,
  Camera,
  AlertCircle,
  Loader2,
  Settings,
  BookOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProductionBibleManager } from '@/components/production-bible/production-bible-manager';

interface ExecutiveDocumentGeneratorProps {
  transcriptId: string;
  transcriptTitle: string;
  storyDNA: string;
  sceneStructure: any;
  sceneBeats: any;
  onCancel: () => void;
}

interface DocumentData {
  header: {
    title: string;
    subtitle: string;
    date: string;
    status: string;
  };
  executiveSummary: {
    title: string;
    storyDNA: string;
    logline: string;
    keyMetrics: {
      totalScenes: number;
      totalBeats: number;
      estimatedRuntime: string;
      productionComplexity: string;
      genreFocus: string;
    };
    producerNotes: string[];
    marketPosition: {
      targetDemographic: string;
      comparableProjects: string[];
      uniqueSellingPoints: string[];
      estimatedBudgetRange: string;
    };
  };
  narrativeStructure: any;
  sceneBreakdown: any;
  productionPackage: any;
  characterProfiles: any;
  appendix: any;
}

export function ExecutiveDocumentGenerator({
  transcriptId,
  transcriptTitle,
  storyDNA,
  sceneStructure,
  sceneBeats,
  onCancel
}: ExecutiveDocumentGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [documentData, setDocumentData] = useState<DocumentData | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'docx'>('pdf');
  const [isExporting, setIsExporting] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [showProductionBible, setShowProductionBible] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);

  // Fetch project ID from transcript
  useEffect(() => {
    const fetchTranscriptProject = async () => {
      try {
        const response = await fetch(`/api/transcripts/${transcriptId}`);
        if (response.ok) {
          const data = await response.json();
          setProjectId(data.transcript?.story_project_id || null);
        }
      } catch (error) {
        console.error('Error fetching transcript project:', error);
      }
    };

    fetchTranscriptProject();
  }, [transcriptId]);

  const generateDocument = async () => {
    setIsGenerating(true);
    setGenerationProgress(0);
    
    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch(`/api/transcripts/${transcriptId}/generate-document`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format: 'data' })
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate document');
      }

      const data = await response.json();
      setDocumentData(data.document_data);
      setGenerationProgress(100);
      
    } catch (error) {
      console.error('Document generation failed:', error);
      alert('Failed to generate executive document. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const exportDocument = async () => {
    if (!documentData) return;

    setIsExporting(true);
    
    try {
      if (selectedFormat === 'docx') {
        const response = await fetch(`/api/transcripts/${transcriptId}/generate-document`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ format: 'docx' })
        });

        if (!response.ok) throw new Error('Export failed');

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${transcriptTitle.replace(/[^a-zA-Z0-9]/g, '_')}_Executive_Document.docx`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        // Generate PDF using browser's print functionality with custom styles
        generatePDFDocument(documentData);
      }
      
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export document. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const generatePDFDocument = (data: DocumentData) => {
    // Create a new window with the formatted document
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${data.header.title} - Executive Document</title>
          <style>
            body {
              font-family: 'Times New Roman', serif;
              line-height: 1.6;
              margin: 40px;
              color: #333;
            }
            .header {
              text-align: center;
              margin-bottom: 40px;
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
            }
            .header h1 {
              font-size: 28px;
              margin-bottom: 5px;
              text-transform: uppercase;
              letter-spacing: 2px;
            }
            .header .subtitle {
              font-size: 18px;
              color: #666;
              font-style: italic;
            }
            .header .date {
              font-size: 14px;
              color: #888;
              margin-top: 10px;
            }
            .section {
              margin-bottom: 30px;
              page-break-inside: avoid;
            }
            .section-title {
              font-size: 20px;
              font-weight: bold;
              margin-bottom: 15px;
              color: #000;
              text-transform: uppercase;
              letter-spacing: 1px;
              border-bottom: 1px solid #ccc;
              padding-bottom: 5px;
            }
            .subsection-title {
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 10px;
              color: #333;
            }
            .metric-item {
              margin-bottom: 8px;
            }
            .metric-label {
              font-weight: bold;
              display: inline-block;
              width: 150px;
            }
            .producer-note {
              margin-bottom: 8px;
              padding-left: 20px;
              position: relative;
            }
            .producer-note:before {
              content: "•";
              position: absolute;
              left: 0;
              font-weight: bold;
            }
            .scene-item {
              margin-bottom: 15px;
              padding: 10px;
              background: #f9f9f9;
              border-left: 4px solid #007acc;
            }
            .character-arc {
              margin-bottom: 12px;
              padding: 8px;
              background: #f5f5f5;
              border-radius: 4px;
            }
            .two-column {
              display: flex;
              gap: 30px;
            }
            .column {
              flex: 1;
            }
            @media print {
              body { margin: 20px; }
              .section { page-break-inside: avoid; }
              .header { page-break-after: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${data.header.title}</h1>
            <div class="subtitle">${data.header.subtitle}</div>
            <div class="date">${data.header.date} • ${data.header.status}</div>
          </div>

          <div class="section">
            <div class="section-title">Executive Summary</div>
            <div class="subsection-title">Story DNA</div>
            <p><em>"${data.executiveSummary.storyDNA}"</em></p>
            
            <div class="subsection-title">Logline</div>
            <p>${data.executiveSummary.logline}</p>

            <div class="subsection-title">Key Metrics</div>
            <div class="metric-item"><span class="metric-label">Total Scenes:</span> ${data.executiveSummary.keyMetrics.totalScenes}</div>
            <div class="metric-item"><span class="metric-label">Total Beats:</span> ${data.executiveSummary.keyMetrics.totalBeats}</div>
            <div class="metric-item"><span class="metric-label">Estimated Runtime:</span> ${data.executiveSummary.keyMetrics.estimatedRuntime}</div>
            <div class="metric-item"><span class="metric-label">Production Complexity:</span> ${data.executiveSummary.keyMetrics.productionComplexity}</div>
            <div class="metric-item"><span class="metric-label">Genre Focus:</span> ${data.executiveSummary.keyMetrics.genreFocus}</div>

            <div class="subsection-title">Producer Notes</div>
            ${data.executiveSummary.producerNotes.map((note: string) => `<div class="producer-note">${note}</div>`).join('')}

            <div class="subsection-title">Market Position</div>
            <div class="metric-item"><span class="metric-label">Target Demographic:</span> ${data.executiveSummary.marketPosition.targetDemographic}</div>
            <div class="metric-item"><span class="metric-label">Budget Range:</span> ${data.executiveSummary.marketPosition.estimatedBudgetRange}</div>
            <div class="metric-item"><span class="metric-label">Comparables:</span> ${data.executiveSummary.marketPosition.comparableProjects.join(', ')}</div>
          </div>

          <div class="section">
            <div class="section-title">Scene Structure</div>
            ${data.sceneBreakdown.scenes.map((scene: any) => `
              <div class="scene-item">
                <strong>Scene ${scene.sceneNumber}: ${scene.title}</strong> (${scene.totalBeats} beats)
                <div style="margin-top: 8px;">
                  ${scene.keyBeats.map((beat: any) => `
                    <div style="margin-bottom: 4px;">
                      <em>${beat.title}:</em> ${beat.function}
                    </div>
                  `).join('')}
                </div>
              </div>
            `).join('')}
          </div>

          <div class="section">
            <div class="section-title">Production Planning</div>
            <div class="two-column">
              <div class="column">
                <div class="subsection-title">Schedule</div>
                ${data.productionPackage.schedule.productionPhases.map((phase: string) => `<div class="metric-item">${phase}</div>`).join('')}
                
                <div class="subsection-title">Budget</div>
                <div class="metric-item"><span class="metric-label">Complexity:</span> ${data.productionPackage.budget.complexity}</div>
                <div class="metric-item"><span class="metric-label">Range:</span> ${data.productionPackage.budget.estimatedRange}</div>
              </div>
              <div class="column">
                <div class="subsection-title">Locations</div>
                <div class="metric-item"><span class="metric-label">Primary:</span> ${data.productionPackage.locations.primary.join(', ')}</div>
                <div class="metric-item"><span class="metric-label">Total:</span> ${data.productionPackage.locations.total} unique elements</div>
                
                <div class="subsection-title">Key Crew</div>
                ${data.productionPackage.crew.keyDepartments.map((dept: string) => `<div class="metric-item">${dept}</div>`).join('')}
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Character Development</div>
            ${data.characterProfiles.characterArcs.map((char: any) => `
              <div class="character-arc">
                <strong>${char.name}</strong>
                <div style="margin-top: 5px;">
                  <div><strong>Arc:</strong> ${char.startingState} → ${char.endingState}</div>
                  <div><strong>Key Moments:</strong> ${char.keyMoments.join(', ')}</div>
                </div>
              </div>
            `).join('')}
          </div>

          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  if (!documentData && !isGenerating) {
    return (
      <Card className="border-orange-200 dark:border-orange-800">
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="size-5 text-orange-600 dark:text-orange-400" />
            <CardTitle className="text-lg">Executive Document Generator</CardTitle>
          </div>
          <CardDescription>
            Phase 4: Transform your story development into professional network deliverables
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Readiness Check */}
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <h4 className="text-sm font-medium text-green-800 dark:text-green-200 mb-3 flex items-center gap-2">
                <Check className="size-4" />
                Production Ready - All Phases Complete
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-green-700 border-green-300">Phase 1</Badge>
                  <span>Story DNA</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-green-700 border-green-300">Phase 2</Badge>
                  <span>Scene Structure</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-green-700 border-green-300">Phase 3</Badge>
                  <span>Beat Breakdown</span>
                </div>
              </div>
            </div>

            {/* Document Overview */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Executive Package Contents:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-3">
                  <Star className="size-4 text-orange-500" />
                  <span>One-page executive summary with commercial analysis</span>
                </div>
                <div className="flex items-center gap-3">
                  <TrendingUp className="size-4 text-orange-500" />
                  <span>Market positioning and comparable projects</span>
                </div>
                <div className="flex items-center gap-3">
                  <Briefcase className="size-4 text-orange-500" />
                  <span>Complete production planning package</span>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="size-4 text-orange-500" />
                  <span>Character profiles and casting requirements</span>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="size-4 text-orange-500" />
                  <span>Budget estimates and schedule breakdown</span>
                </div>
                <div className="flex items-center gap-3">
                  <Camera className="size-4 text-orange-500" />
                  <span>Scene-by-scene production notes</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <Button 
                onClick={generateDocument} 
                className="bg-orange-600 hover:bg-orange-700 text-white"
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="size-4 mr-2" />
                    Generate Executive Document
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            </div>

            {isGenerating && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Processing story elements...</span>
                  <span>{generationProgress}%</span>
                </div>
                <Progress value={generationProgress} />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isGenerating) {
    return (
      <Card className="border-orange-200 dark:border-orange-800">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Loader2 className="size-5 text-orange-600 animate-spin" />
            <CardTitle className="text-lg">Generating Executive Document</CardTitle>
          </div>
          <CardDescription>
            Processing all phases into professional network deliverable...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Analyzing story structure and production requirements...</span>
              <span>{generationProgress}%</span>
            </div>
            <Progress value={generationProgress} />
            <div className="text-center text-sm text-muted-foreground">
              Please wait while we format your story for executive consumption
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!documentData) return null;

  return (
    <div className="space-y-6">
      {/* Header with Export Controls */}
      <Card className="border-orange-200 dark:border-orange-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="size-5 text-orange-600 dark:text-orange-400" />
              <div>
                <CardTitle className="text-lg">Executive Document Ready</CardTitle>
                <CardDescription>Professional network deliverable generated</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowProductionBible(true)}
                className="flex items-center gap-2"
              >
                <BookOpen className="size-4" />
                Production Bible
              </Button>
              <Select value={selectedFormat} onValueChange={(value: 'pdf' | 'docx') => setSelectedFormat(value)}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="docx">DOCX</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                onClick={exportDocument}
                disabled={isExporting}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="size-4 mr-2" />
                    Export {selectedFormat.toUpperCase()}
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={onCancel}>
                Back
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Document Preview */}
      <Tabs defaultValue="executive" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="executive">Executive Summary</TabsTrigger>
          <TabsTrigger value="structure">Story Structure</TabsTrigger>
          <TabsTrigger value="production">Production</TabsTrigger>
          <TabsTrigger value="characters">Characters</TabsTrigger>
          <TabsTrigger value="market">Market Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="executive" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="size-4" />
                Executive Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-medium mb-2">Story DNA</h4>
                <p className="text-sm text-muted-foreground italic">"{documentData.executiveSummary.storyDNA}"</p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Logline</h4>
                <p className="text-sm">{documentData.executiveSummary.logline}</p>
              </div>

              <div>
                <h4 className="font-medium mb-2">Key Metrics</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Scenes:</span>
                    <div className="font-medium">{documentData.executiveSummary.keyMetrics.totalScenes}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Beats:</span>
                    <div className="font-medium">{documentData.executiveSummary.keyMetrics.totalBeats}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Runtime:</span>
                    <div className="font-medium">{documentData.executiveSummary.keyMetrics.estimatedRuntime}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Complexity:</span>
                    <div className="font-medium capitalize">{documentData.executiveSummary.keyMetrics.productionComplexity}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Genre:</span>
                    <div className="font-medium">{documentData.executiveSummary.keyMetrics.genreFocus}</div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Producer Notes</h4>
                <div className="space-y-2">
                  {documentData.executiveSummary.producerNotes.map((note: string, index: number) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      <div className="size-1 rounded-full bg-orange-500 mt-2 shrink-0" />
                      <span>{note}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="structure" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="size-4" />
                Scene Structure
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-4">
                  {documentData.sceneBreakdown.scenes.map((scene: any, index: number) => (
                    <Card key={index} className="border-l-4 border-l-orange-500">
                      <CardContent className="pt-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">Scene {scene.sceneNumber}: {scene.title}</h4>
                            <Badge variant="outline">{scene.totalBeats} beats</Badge>
                          </div>
                          <div>
                            <h5 className="text-sm font-medium mb-2">Key Beats:</h5>
                            <div className="space-y-2">
                              {scene.keyBeats.map((beat: any, beatIndex: number) => (
                                <div key={beatIndex} className="text-sm">
                                  <span className="font-medium">{beat.title}:</span> {beat.function}
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <h5 className="font-medium mb-1">Production Notes:</h5>
                              <ul className="text-muted-foreground">
                                {scene.productionConsiderations.map((note: string, noteIndex: number) => (
                                  <li key={noteIndex}>• {note}</li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <h5 className="font-medium mb-1">Location Elements:</h5>
                              <div className="text-muted-foreground">
                                {scene.locationNeeds.slice(0, 3).map((location: string, locIndex: number) => (
                                  <Badge key={locIndex} variant="secondary" className="text-xs mr-1 mb-1">
                                    {location}
                                  </Badge>
                                ))}
                                {scene.locationNeeds.length > 3 && (
                                  <span className="text-xs">+{scene.locationNeeds.length - 3} more</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="production" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Calendar className="size-4" />
                  Schedule
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {documentData.productionPackage.schedule.productionPhases.map((phase: string, index: number) => (
                  <div key={index} className="flex items-center gap-2">
                    <Clock className="size-3 text-muted-foreground" />
                    <span>{phase}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <DollarSign className="size-4" />
                  Budget Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Complexity:</span>
                  <div className="font-medium capitalize">{documentData.productionPackage.budget.complexity}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Estimated Range:</span>
                  <div className="font-medium">{documentData.productionPackage.budget.estimatedRange}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Key Considerations:</span>
                  <ul className="text-muted-foreground mt-1">
                    {documentData.productionPackage.budget.keyConsiderations.slice(0, 3).map((consideration: string, index: number) => (
                      <li key={index} className="text-xs">• {consideration}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <MapPin className="size-4" />
                  Locations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Primary Locations:</span>
                  <div className="mt-1">
                    {documentData.productionPackage.locations.primary.map((location: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs mr-1 mb-1">
                        {location}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Elements:</span>
                  <div className="font-medium">{documentData.productionPackage.locations.total} unique requirements</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Users className="size-4" />
                  Crew Requirements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Key Departments:</span>
                  <div className="mt-1 space-y-1">
                    {documentData.productionPackage.crew.keyDepartments.map((dept: string, index: number) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="size-1 rounded-full bg-orange-500" />
                        <span className="text-xs">{dept}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="characters" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="size-4" />
                Character Development
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-4">
                  {documentData.characterProfiles.characterArcs.map((character: any, index: number) => (
                    <Card key={index} className="border-l-4 border-l-blue-500">
                      <CardContent className="pt-4">
                        <div className="space-y-3">
                          <h4 className="font-medium text-lg">{character.name}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Character Arc:</span>
                              <div className="mt-1">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">Start</Badge>
                                  <span>{character.startingState}</span>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline" className="text-xs">End</Badge>
                                  <span>{character.endingState}</span>
                                </div>
                              </div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Key Moments:</span>
                              <ul className="mt-1 space-y-1">
                                {character.keyMoments.slice(0, 3).map((moment: string, momentIndex: number) => (
                                  <li key={momentIndex} className="text-xs">• {moment}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                          {character.progression && character.progression.length > 0 && (
                            <div>
                              <span className="text-muted-foreground text-sm">Progression:</span>
                              <div className="mt-1 space-y-1">
                                {character.progression.map((step: string, stepIndex: number) => (
                                  <div key={stepIndex} className="text-xs bg-gray-50 dark:bg-gray-900 p-2 rounded">
                                    {step}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="market" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="size-4" />
                Market Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Target Demographic</h4>
                  <p className="text-sm text-muted-foreground">{documentData.executiveSummary.marketPosition.targetDemographic}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Budget Range</h4>
                  <p className="text-sm text-muted-foreground">{documentData.executiveSummary.marketPosition.estimatedBudgetRange}</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Comparable Projects</h4>
                <div className="flex flex-wrap gap-2">
                  {documentData.executiveSummary.marketPosition.comparableProjects.map((project: string, index: number) => (
                    <Badge key={index} variant="secondary">{project}</Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Unique Selling Points</h4>
                <div className="space-y-2">
                  {documentData.executiveSummary.marketPosition.uniqueSellingPoints.map((usp: string, index: number) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      <Star className="size-4 text-orange-500 mt-0.5 shrink-0" />
                      <span>{usp}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Production Bible Manager Dialog */}
      {showProductionBible && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <ProductionBibleManager 
              projectId={projectId || undefined}
              onClose={() => setShowProductionBible(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}