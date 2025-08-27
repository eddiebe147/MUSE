'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle, 
  Settings, 
  Eye, 
  Trash2,
  Download,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductionBibleDocument {
  id: string;
  name: string;
  originalFilename: string;
  fileType: 'pdf' | 'docx' | 'txt' | 'md';
  fileSize: number;
  uploadedAt: string;
  parsingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  parsingError?: string;
  extractedRulesCount: number;
  storyProjectId?: string;
}

interface ProductionBibleRule {
  id: string;
  ruleType: 'format' | 'style' | 'content' | 'structure' | 'validation';
  title: string;
  description: string;
  pattern?: string;
  replacement?: string;
  examples: string[];
  conditions?: any;
  action: 'apply' | 'suggest' | 'validate' | 'warn';
  priority: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ProductionBibleManagerProps {
  projectId?: string;
  onClose?: () => void;
}

export function ProductionBibleManager({
  projectId,
  onClose
}: ProductionBibleManagerProps) {
  const [documents, setDocuments] = useState<ProductionBibleDocument[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<ProductionBibleDocument | null>(null);
  const [documentRules, setDocumentRules] = useState<ProductionBibleRule[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('documents');

  useEffect(() => {
    loadDocuments();
  }, [projectId]);

  const loadDocuments = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (projectId) params.append('projectId', projectId);
      
      const response = await fetch(`/api/production-bible?${params}`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      }
    } catch (error) {
      console.error('Error loading production bible documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDocumentRules = async (documentId: string) => {
    try {
      const response = await fetch(`/api/production-bible/${documentId}`);
      if (response.ok) {
        const data = await response.json();
        setDocumentRules(data.rules || []);
        setSelectedDocument(data.document);
        setActiveTab('rules');
      }
    } catch (error) {
      console.error('Error loading document rules:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const name = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
    
    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', name);
      if (projectId) {
        formData.append('projectId', projectId);
      }

      const response = await fetch('/api/production-bible', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        await loadDocuments();
        event.target.value = ''; // Clear the input
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to upload document');
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  const deleteDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document? This will also delete all extracted rules.')) {
      return;
    }

    try {
      const response = await fetch(`/api/production-bible/${documentId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadDocuments();
        if (selectedDocument?.id === documentId) {
          setSelectedDocument(null);
          setDocumentRules([]);
          setActiveTab('documents');
        }
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete document');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Failed to delete document');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="size-4 text-green-600" />;
      case 'processing':
        return <RefreshCw className="size-4 text-blue-600 animate-spin" />;
      case 'failed':
        return <XCircle className="size-4 text-red-600" />;
      default:
        return <Clock className="size-4 text-orange-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'processing':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'failed':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-orange-600 bg-orange-50 border-orange-200';
    }
  };

  const getRuleTypeColor = (type: string) => {
    switch (type) {
      case 'format':
        return 'bg-blue-100 text-blue-800';
      case 'style':
        return 'bg-purple-100 text-purple-800';
      case 'content':
        return 'bg-green-100 text-green-800';
      case 'structure':
        return 'bg-orange-100 text-orange-800';
      case 'validation':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Production Bible Manager</h2>
          <p className="text-muted-foreground">
            Upload and manage production guidelines to ensure professional document quality
          </p>
        </div>
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="rules">Rules</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
        </TabsList>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          {/* Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="size-5" />
                Upload Production Bible
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="file-upload">Select Document</Label>
                  <p className="text-sm text-muted-foreground">
                    Supported formats: PDF, DOCX, TXT, MD (Max 10MB)
                  </p>
                </div>
                <Input
                  id="file-upload"
                  type="file"
                  accept=".pdf,.docx,.txt,.md"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
                {isUploading && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <RefreshCw className="size-4 animate-spin" />
                    Uploading and processing document...
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Documents List */}
          <Card>
            <CardHeader>
              <CardTitle>Uploaded Documents</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="size-6 animate-spin" />
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="size-12 mx-auto mb-4 opacity-50" />
                  <p>No production bible documents uploaded yet.</p>
                  <p className="text-sm">Upload your first document to get started.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {documents.map((document) => (
                    <div
                      key={document.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <FileText className="size-8 text-muted-foreground" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium">{document.name}</h3>
                            <Badge variant="outline" className="text-xs">
                              {document.fileType.toUpperCase()}
                            </Badge>
                            <Badge className={cn("text-xs", getStatusColor(document.parsingStatus))}>
                              {getStatusIcon(document.parsingStatus)}
                              <span className="ml-1 capitalize">{document.parsingStatus}</span>
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <span>{formatFileSize(document.fileSize)}</span>
                            {document.parsingStatus === 'completed' && (
                              <span> • {document.extractedRulesCount} rules extracted</span>
                            )}
                            {document.parsingError && (
                              <span className="text-red-600"> • Error: {document.parsingError}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {document.parsingStatus === 'completed' && document.extractedRulesCount > 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => loadDocumentRules(document.id)}
                          >
                            <Eye className="size-4 mr-1" />
                            View Rules
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteDocument(document.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rules Tab */}
        <TabsContent value="rules" className="space-y-4">
          {selectedDocument ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Rules from "{selectedDocument.name}"</span>
                  <Badge variant="outline">
                    {documentRules.length} rules
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {documentRules.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="size-12 mx-auto mb-4 opacity-50" />
                    <p>No rules extracted from this document.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {documentRules.map((rule) => (
                      <div
                        key={rule.id}
                        className="p-4 border rounded-lg space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <Badge className={getRuleTypeColor(rule.ruleType)}>
                              {rule.ruleType}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {rule.action}
                            </Badge>
                            <Badge variant="outline" className={cn(
                              "text-xs",
                              rule.priority === 'critical' ? 'bg-red-100 text-red-800' :
                              rule.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                              rule.priority === 'medium' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            )}>
                              {rule.priority}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {rule.confidence}% confidence
                            </span>
                            <Badge variant={rule.isActive ? "default" : "secondary"}>
                              {rule.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium mb-1">{rule.title}</h4>
                          <p className="text-sm text-muted-foreground">{rule.description}</p>
                        </div>

                        {rule.pattern && (
                          <div className="text-xs">
                            <span className="font-medium">Pattern: </span>
                            <code className="bg-muted px-1 py-0.5 rounded">{rule.pattern}</code>
                          </div>
                        )}

                        {rule.replacement && (
                          <div className="text-xs">
                            <span className="font-medium">Replacement: </span>
                            <code className="bg-muted px-1 py-0.5 rounded">{rule.replacement}</code>
                          </div>
                        )}

                        {rule.examples.length > 0 && (
                          <div className="text-xs">
                            <span className="font-medium">Examples:</span>
                            <ul className="list-disc list-inside mt-1 text-muted-foreground">
                              {rule.examples.slice(0, 2).map((example, index) => (
                                <li key={index}>{example}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <Settings className="size-12 mx-auto mb-4 opacity-50" />
                  <p>Select a document to view its extracted rules.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Configuration Tab */}
        <TabsContent value="configuration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rule Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Settings className="size-12 mx-auto mb-4 opacity-50" />
                <p>Rule configuration coming soon.</p>
                <p className="text-sm">Configure which rules are active and their priorities.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}