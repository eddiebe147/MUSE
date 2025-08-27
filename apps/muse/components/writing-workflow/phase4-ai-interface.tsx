'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Download, 
  RefreshCw, 
  CheckCircle,
  Wand2,
  AlertCircle,
  FileText,
  Copy,
  Edit3,
  Maximize2,
  Eye,
  FileDown,
  Printer,
  Send,
  Settings,
  Upload,
  Save,
  Plus,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { FormattedScriptDisplay } from './formatted-script-display';

interface Phase4AIInterfaceProps {
  phase1Summary: string;
  scenes: string[];
  sceneBeats: any;
  brainstormContext?: string;
  knowledgeBase?: any;
  onComplete: (script: any) => void;
  onSave?: (script: any) => void;
  className?: string;
}

type ScriptFormat = 'treatment' | 'screenplay' | 'beat_sheet' | 'outline' | 'novel_chapter' | 'custom';

interface CustomFormatTemplate {
  id: string;
  name: string;
  description: string;
  baseFormat: ScriptFormat;
  customRules: {
    tone: string;
    structure: string;
    formatting: string;
    voice: string;
    specificRequirements: string;
  };
  templateContent?: string;
  styleGuide?: string;
  createdAt: Date;
  isUserDefined: boolean;
}

export function Phase4AIInterface({ 
  phase1Summary,
  scenes,
  sceneBeats,
  brainstormContext,
  knowledgeBase,
  onComplete,
  onSave,
  className 
}: Phase4AIInterfaceProps) {
  const [generatedScript, setGeneratedScript] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<ScriptFormat>('treatment');
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [specificRequirements, setSpecificRequirements] = useState('');
  const [scriptMetadata, setScriptMetadata] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Custom format configuration state
  const [customTemplates, setCustomTemplates] = useState<CustomFormatTemplate[]>([]);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [selectedCustomTemplate, setSelectedCustomTemplate] = useState<CustomFormatTemplate | null>(null);
  const [newTemplate, setNewTemplate] = useState<Partial<CustomFormatTemplate>>({
    name: '',
    description: '',
    baseFormat: 'treatment',
    customRules: {
      tone: '',
      structure: '',
      formatting: '',
      voice: '',
      specificRequirements: ''
    }
  });

  // Custom template management functions
  const saveCustomTemplate = useCallback(() => {
    if (!newTemplate.name?.trim()) return;
    
    const template: CustomFormatTemplate = {
      id: `custom_${Date.now()}`,
      name: newTemplate.name.trim(),
      description: newTemplate.description || '',
      baseFormat: newTemplate.baseFormat || 'treatment',
      customRules: newTemplate.customRules || {
        tone: '',
        structure: '',
        formatting: '',
        voice: '',
        specificRequirements: ''
      },
      templateContent: newTemplate.templateContent,
      styleGuide: newTemplate.styleGuide,
      createdAt: new Date(),
      isUserDefined: true
    };
    
    const updatedTemplates = [...customTemplates, template];
    setCustomTemplates(updatedTemplates);
    
    // Save to localStorage for persistence
    localStorage.setItem('muse_custom_format_templates', JSON.stringify(updatedTemplates));
    
    // Reset form
    setNewTemplate({
      name: '',
      description: '',
      baseFormat: 'treatment',
      customRules: {
        tone: '',
        structure: '',
        formatting: '',
        voice: '',
        specificRequirements: ''
      }
    });
    
    setIsConfigModalOpen(false);
  }, [newTemplate, customTemplates]);

  const loadCustomTemplates = useCallback(() => {
    try {
      const saved = localStorage.getItem('muse_custom_format_templates');
      if (saved) {
        const templates = JSON.parse(saved).map((t: any) => ({
          ...t,
          createdAt: new Date(t.createdAt)
        }));
        setCustomTemplates(templates);
      }
    } catch (error) {
      console.error('Failed to load custom templates:', error);
    }
  }, []);

  const deleteCustomTemplate = useCallback((templateId: string) => {
    const updatedTemplates = customTemplates.filter(t => t.id !== templateId);
    setCustomTemplates(updatedTemplates);
    localStorage.setItem('muse_custom_format_templates', JSON.stringify(updatedTemplates));
  }, [customTemplates]);

  // Load custom templates on mount
  React.useEffect(() => {
    loadCustomTemplates();
  }, [loadCustomTemplates]);

  // File import handler for template/style guide
  const handleFileImport = useCallback((event: React.ChangeEvent<HTMLInputElement>, type: 'template' | 'styleGuide') => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setNewTemplate(prev => ({
        ...prev,
        [type === 'template' ? 'templateContent' : 'styleGuide']: content
      }));
    };
    reader.readAsText(file);
  }, []);

  const formatOptions: { value: ScriptFormat; label: string; description: string }[] = [
    { value: 'treatment', label: 'Network Treatment', description: 'Professional treatment for network executives' },
    { value: 'screenplay', label: 'Screenplay', description: 'Industry standard format with dialogue and action' },
    { value: 'beat_sheet', label: 'Beat Sheet', description: 'Scene-by-scene breakdown for production' },
    { value: 'novel_chapter', label: 'Novel Chapter', description: 'Narrative prose for book publishing' },
    { value: 'outline', label: 'Detailed Outline', description: 'Comprehensive structural document' }
  ];

  const generateScript = useCallback(async (regenerate = false) => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/four-phase/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phase: 4,
          previousPhaseContent: { 
            oneLine: phase1Summary,
            scenes,
            beats: sceneBeats,
            format: selectedFormat === 'custom' ? selectedCustomTemplate?.baseFormat : selectedFormat,
            customTemplate: selectedFormat === 'custom' ? selectedCustomTemplate : undefined
          },
          brainstormContext,
          knowledgeBase,
          regenerate,
          specificRequirements: specificRequirements.trim() || undefined
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate script');
      }

      const data = await response.json();
      
      if (data.success && data.generated) {
        setGeneratedScript(data.generated.script || '');
        setScriptMetadata(data.generated.metadata || null);
        setHasGenerated(true);
        onSave?.({ 
          content: data.generated.script, 
          format: selectedFormat,
          metadata: data.generated.metadata 
        });
      } else {
        throw new Error(data.error || 'Invalid response format');
      }
    } catch (error: any) {
      console.error('Generation error:', error);
      setError(error.message || 'Failed to generate script. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [phase1Summary, scenes, sceneBeats, selectedFormat, brainstormContext, knowledgeBase, specificRequirements, onSave]);

  const handleDownload = () => {
    if (!generatedScript) return;

    const blob = new Blob([generatedScript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `script_${selectedFormat}_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedScript);
  };

  const handleSaveEdit = () => {
    setIsEditing(false);
    onSave?.({ 
      content: generatedScript, 
      format: selectedFormat,
      metadata: scriptMetadata 
    });
  };

  const handleCompletePhase = () => {
    if (generatedScript) {
      onComplete({
        content: generatedScript,
        format: selectedFormat,
        metadata: scriptMetadata
      });
    }
  };

  return (
    <div className={cn("space-y-6", className, isFullscreen && "fixed inset-0 z-50 bg-background p-6 overflow-auto")}>
      {/* Phase Header */}
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center gap-3">
          <Badge variant="secondary" className="px-4 py-2 bg-orange-100 text-orange-700">
            <Download className="size-4 mr-2" />
            Phase 4: Final Script
          </Badge>
          {isFullscreen && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFullscreen(false)}
            >
              Exit Fullscreen
            </Button>
          )}
        </div>
        <div className="space-y-1">
          <h2 className="text-2xl font-bold">AI-Generated Complete Script</h2>
          <p className="text-muted-foreground">
            Claude will create your production-ready script
          </p>
        </div>
      </div>

      {/* Format Selection & Generation */}
      <Card className="border-2 border-orange-200 dark:border-orange-800">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Wand2 className="size-5 text-orange-600" />
            Script Generation Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Format Selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium">Script Format</label>
              <Dialog open={isConfigModalOpen} onOpenChange={setIsConfigModalOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2"
                    title="Configure Custom Formats"
                  >
                    <Settings className="size-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Custom Format Configuration</DialogTitle>
                  </DialogHeader>
                  
                  <div className="space-y-6">
                    {/* Create New Template Section */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Create New Format Template</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="template-name">Template Name</Label>
                            <Input
                              id="template-name"
                              placeholder="e.g., NBC Reality Style"
                              value={newTemplate.name || ''}
                              onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="base-format">Base Format</Label>
                            <select
                              id="base-format"
                              value={newTemplate.baseFormat}
                              onChange={(e) => setNewTemplate(prev => ({ ...prev, baseFormat: e.target.value as ScriptFormat }))}
                              className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                            >
                              {formatOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="template-description">Description</Label>
                          <Input
                            id="template-description"
                            placeholder="Brief description of this format style"
                            value={newTemplate.description || ''}
                            onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                          />
                        </div>

                        {/* File Import Section */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Import Template Document</Label>
                            <div className="mt-2">
                              <input
                                type="file"
                                accept=".txt,.doc,.docx,.pdf"
                                onChange={(e) => handleFileImport(e, 'template')}
                                style={{ display: 'none' }}
                                id="template-file-input"
                              />
                              <Button
                                variant="outline"
                                onClick={() => document.getElementById('template-file-input')?.click()}
                                className="w-full"
                              >
                                <Upload className="size-4 mr-2" />
                                Upload Example Script
                              </Button>
                              {newTemplate.templateContent && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Template imported ({newTemplate.templateContent.length} chars)
                                </p>
                              )}
                            </div>
                          </div>
                          <div>
                            <Label>Import Style Guide</Label>
                            <div className="mt-2">
                              <input
                                type="file"
                                accept=".txt,.doc,.docx,.pdf"
                                onChange={(e) => handleFileImport(e, 'styleGuide')}
                                style={{ display: 'none' }}
                                id="style-guide-input"
                              />
                              <Button
                                variant="outline"
                                onClick={() => document.getElementById('style-guide-input')?.click()}
                                className="w-full"
                              >
                                <Upload className="size-4 mr-2" />
                                Upload Style Guide
                              </Button>
                              {newTemplate.styleGuide && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Style guide imported ({newTemplate.styleGuide.length} chars)
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Custom Rules Section */}
                        <div className="space-y-3">
                          <Label className="text-sm font-medium">Customization Rules</Label>
                          <div className="grid grid-cols-1 gap-3">
                            <div>
                              <Label htmlFor="tone">Tone & Voice</Label>
                              <Textarea
                                id="tone"
                                placeholder="e.g., 'Conversational, energetic, network-friendly tone with executive appeal'"
                                value={newTemplate.customRules?.tone || ''}
                                onChange={(e) => setNewTemplate(prev => ({
                                  ...prev,
                                  customRules: { ...prev.customRules!, tone: e.target.value }
                                }))}
                                className="h-20"
                              />
                            </div>
                            <div>
                              <Label htmlFor="structure">Structure Requirements</Label>
                              <Textarea
                                id="structure"
                                placeholder="e.g., 'Three-act structure, cold opens, commercial breaks at specific moments'"
                                value={newTemplate.customRules?.structure || ''}
                                onChange={(e) => setNewTemplate(prev => ({
                                  ...prev,
                                  customRules: { ...prev.customRules!, structure: e.target.value }
                                }))}
                                className="h-20"
                              />
                            </div>
                            <div>
                              <Label htmlFor="formatting">Formatting Style</Label>
                              <Textarea
                                id="formatting"
                                placeholder="e.g., 'Courier 12pt, specific margin requirements, scene headers format'"
                                value={newTemplate.customRules?.formatting || ''}
                                onChange={(e) => setNewTemplate(prev => ({
                                  ...prev,
                                  customRules: { ...prev.customRules!, formatting: e.target.value }
                                }))}
                                className="h-20"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-between">
                          <Button
                            variant="outline"
                            onClick={() => setIsConfigModalOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={saveCustomTemplate}
                            disabled={!newTemplate.name?.trim()}
                          >
                            <Save className="size-4 mr-2" />
                            Save Template
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Existing Templates */}
                    {customTemplates.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Saved Custom Templates</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {customTemplates.map((template) => (
                              <div key={template.id} className="flex items-center justify-between p-3 border rounded">
                                <div>
                                  <p className="font-medium">{template.name}</p>
                                  <p className="text-sm text-muted-foreground">{template.description}</p>
                                  <p className="text-xs text-muted-foreground">
                                    Based on {formatOptions.find(f => f.value === template.baseFormat)?.label}
                                  </p>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedCustomTemplate(template);
                                      setSelectedFormat('custom');
                                      setIsConfigModalOpen(false);
                                    }}
                                  >
                                    Use
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => deleteCustomTemplate(template.id)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <X className="size-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {formatOptions.map((format) => (
                <Card 
                  key={format.value}
                  className={cn(
                    "cursor-pointer transition-all",
                    selectedFormat === format.value 
                      ? "border-orange-300 bg-orange-50 dark:bg-orange-900/20"
                      : "hover:border-gray-300"
                  )}
                  onClick={() => setSelectedFormat(format.value)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-2">
                      <CheckCircle className={cn(
                        "w-4 h-4 mt-0.5",
                        selectedFormat === format.value ? "text-orange-600" : "text-transparent"
                      )} />
                      <div>
                        <p className="font-medium text-sm">{format.label}</p>
                        <p className="text-xs text-muted-foreground">{format.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {/* Custom Templates */}
              {customTemplates.map((template) => (
                <Card 
                  key={template.id}
                  className={cn(
                    "cursor-pointer transition-all",
                    selectedFormat === 'custom' && selectedCustomTemplate?.id === template.id
                      ? "border-purple-300 bg-purple-50 dark:bg-purple-900/20"
                      : "hover:border-gray-300"
                  )}
                  onClick={() => {
                    setSelectedFormat('custom');
                    setSelectedCustomTemplate(template);
                  }}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-2">
                      <CheckCircle className={cn(
                        "w-4 h-4 mt-0.5",
                        selectedFormat === 'custom' && selectedCustomTemplate?.id === template.id 
                          ? "text-purple-600" : "text-transparent"
                      )} />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{template.name}</p>
                          <Badge variant="outline" className="text-xs">Custom</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{template.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {/* Display Custom Template Details */}
            {selectedFormat === 'custom' && selectedCustomTemplate && (
              <Card className="border-purple-200 bg-purple-50/50 dark:bg-purple-900/10">
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">Selected Custom Template: {selectedCustomTemplate.name}</h4>
                      <Badge variant="outline">
                        Based on {formatOptions.find(f => f.value === selectedCustomTemplate.baseFormat)?.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{selectedCustomTemplate.description}</p>
                    
                    {selectedCustomTemplate.customRules.tone && (
                      <div>
                        <p className="text-xs font-medium">Tone:</p>
                        <p className="text-xs text-muted-foreground">{selectedCustomTemplate.customRules.tone}</p>
                      </div>
                    )}
                    
                    {selectedCustomTemplate.customRules.structure && (
                      <div>
                        <p className="text-xs font-medium">Structure:</p>
                        <p className="text-xs text-muted-foreground">{selectedCustomTemplate.customRules.structure}</p>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {selectedCustomTemplate.templateContent && (
                        <Badge variant="outline" className="text-xs">Template Imported</Badge>
                      )}
                      {selectedCustomTemplate.styleGuide && (
                        <Badge variant="outline" className="text-xs">Style Guide</Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Optional Requirements */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Specific Requirements (Optional)
            </label>
            <Textarea
              value={specificRequirements}
              onChange={(e) => setSpecificRequirements(e.target.value)}
              placeholder="e.g., 'Keep under 10 pages', 'Focus on visual storytelling', 'Minimal dialogue'..."
              className="min-h-[80px] text-sm"
              disabled={isGenerating}
            />
          </div>

          {/* Generate Button */}
          <div className="flex gap-2">
            <Button
              onClick={() => generateScript(false)}
              disabled={isGenerating}
              size="lg"
              className="flex-1 bg-orange-600 hover:bg-orange-700"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="size-4 mr-2 animate-spin" />
                  Generating {formatOptions.find(f => f.value === selectedFormat)?.label}...
                </>
              ) : (
                <>
                  <Wand2 className="size-4 mr-2" />
                  {hasGenerated ? 'Regenerate Script' : 'Generate Complete Script'}
                </>
              )}
            </Button>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="size-4 text-red-600 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Professional Script Canvas Display */}
      {hasGenerated && generatedScript && (
        <Card className="border-2 border-purple-200 dark:border-purple-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Eye className="size-5 text-purple-600" />
                  {formatOptions.find(f => f.value === selectedFormat)?.label}
                </CardTitle>
                {scriptMetadata && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {scriptMetadata.wordCount} words
                    </Badge>
                    <Badge variant="outline">
                      ~{scriptMetadata.pageCount} pages
                    </Badge>
                    <Badge variant="outline">
                      {scriptMetadata.estimatedDuration}
                    </Badge>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  title="Toggle Fullscreen"
                >
                  <Maximize2 className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                  title="Edit Script"
                >
                  <Edit3 className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  title="Copy to Clipboard"
                >
                  <Copy className="size-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <FormattedScriptDisplay
              content={generatedScript}
              format={selectedFormat === 'custom' ? selectedCustomTemplate?.baseFormat || 'treatment' : selectedFormat}
              isEditable={true}
              onContentChange={(content) => {
                setGeneratedScript(content);
                handleSaveEdit();
              }}
              className="min-h-[700px]"
            />
          </CardContent>
        </Card>
      )}

      {/* Export & Final Actions */}
      {hasGenerated && generatedScript && (
        <Card className="border-2 border-green-200 dark:border-green-800">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Send className="size-5 text-green-600" />
              Ready for Delivery
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Your script is formatted and ready for executives. Export when satisfied.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleDownload} variant="outline">
                <FileDown className="size-4 mr-2" />
                Download Text
              </Button>
              <Button onClick={() => window.print()} variant="outline">
                <Printer className="size-4 mr-2" />
                Print/PDF
              </Button>
              <Button onClick={handleCopy} variant="outline">
                <Copy className="size-4 mr-2" />
                Copy All
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Phase Completion */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          {generatedScript ? (
            <span className="flex items-center gap-2 text-green-600">
              <CheckCircle className="size-4" />
              Professional script ready for delivery
            </span>
          ) : (
            <span>Generate your final script to see formatted output</span>
          )}
        </div>

        <Button
          onClick={handleCompletePhase}
          disabled={!generatedScript}
          size="lg"
          className="px-6"
        >
          <CheckCircle className="size-4 mr-2" />
          Complete Workflow
        </Button>
      </div>
    </div>
  );
}