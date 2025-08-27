'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { 
  Upload, 
  File, 
  FileText, 
  Loader2, 
  CheckCircle, 
  AlertTriangle,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TranscriptUploadProps {
  projectId: string;
  onUploadComplete?: (transcript: any, analysis: any) => void;
  onCancel?: () => void;
}

interface UploadedFile extends File {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  error?: string;
}

const sourceTypeOptions = [
  { value: 'interview', label: 'Interview' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'brainstorm', label: 'Brainstorm Session' },
  { value: 'other', label: 'Other' }
];

export function TranscriptUpload({ projectId, onUploadComplete, onCancel }: TranscriptUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [title, setTitle] = useState('');
  const [sourceType, setSourceType] = useState<string>('interview');
  const [isProcessing, setIsProcessing] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadedFile[] = acceptedFiles.map(file => ({
      ...file,
      id: `${file.name}-${Date.now()}`,
      status: 'pending' as const,
      progress: 0
    }));

    setFiles(prev => [...prev, ...newFiles]);

    // Auto-set title from first file if not set
    if (!title && newFiles.length > 0) {
      const fileName = newFiles[0].name.replace(/\.[^/.]+$/, '');
      setTitle(fileName);
    }
  }, [title]);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 5,
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const processFiles = async () => {
    if (files.length === 0 || !projectId) {
      toast.error('Please select files and ensure project is selected');
      return;
    }

    setIsProcessing(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Update file status to processing
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, status: 'processing', progress: 10 } : f
        ));

        const formData = new FormData();
        formData.append('file', file);
        formData.append('projectId', projectId);
        formData.append('sourceType', sourceType);
        formData.append('title', title || file.name.replace(/\.[^/.]+$/, ''));

        try {
          // Simulate progress updates
          let progress = 10;
          const progressInterval = setInterval(() => {
            progress += Math.random() * 20;
            if (progress >= 90) {
              clearInterval(progressInterval);
              progress = 90;
            }
            setFiles(prev => prev.map(f => 
              f.id === file.id ? { ...f, progress } : f
            ));
          }, 500);

          const response = await fetch('/api/transcripts/process', {
            method: 'POST',
            body: formData,
          });

          clearInterval(progressInterval);

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Upload failed');
          }

          const result = await response.json();

          // Update file status to completed
          setFiles(prev => prev.map(f => 
            f.id === file.id ? { ...f, status: 'completed', progress: 100 } : f
          ));

          // Call completion callback
          if (onUploadComplete) {
            onUploadComplete(result.transcript, result.analysis);
          }

          toast.success(`Successfully processed ${file.name}`, {
            description: `Found ${result.analysis.moments.length} story moments`
          });

        } catch (error) {
          console.error('File processing error:', error);
          
          setFiles(prev => prev.map(f => 
            f.id === file.id ? { 
              ...f, 
              status: 'error', 
              progress: 0, 
              error: error instanceof Error ? error.message : 'Processing failed' 
            } : f
          ));

          toast.error(`Failed to process ${file.name}`, {
            description: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith('.txt')) return <FileText className="size-5 text-blue-500" />;
    if (fileName.endsWith('.docx')) return <File className="size-5 text-blue-500" />;
    return <File className="size-5 text-gray-500" />;
  };

  const getStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'pending': return null;
      case 'processing': return <Loader2 className="size-4 animate-spin text-blue-500" />;
      case 'completed': return <CheckCircle className="size-4 text-green-500" />;
      case 'error': return <AlertTriangle className="size-4 text-red-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="size-5 text-purple-500" />
            Upload Transcript
          </CardTitle>
          <CardDescription>
            Upload interview recordings, meeting notes, or brainstorm sessions for AI story analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Upload Area */}
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
              isDragActive ? "border-purple-500 bg-purple-50 dark:bg-purple-950/20" : "border-muted-foreground/25",
              "hover:border-purple-400 hover:bg-muted/50"
            )}
          >
            <input {...getInputProps()} />
            <Upload className="size-8 mx-auto mb-4 text-muted-foreground" />
            {isDragActive ? (
              <p className="text-purple-600 font-medium">Drop files here...</p>
            ) : (
              <div>
                <p className="font-medium mb-1">Drag & drop transcript files here</p>
                <p className="text-sm text-muted-foreground">or click to browse files</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Supports .txt and .docx files up to 10MB each
                </p>
              </div>
            )}
          </div>

          {/* File Rejections */}
          {fileRejections.length > 0 && (
            <div className="space-y-2">
              {fileRejections.map(({ file, errors }) => (
                <div key={file.name} className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-950/20 rounded border border-red-200 dark:border-red-800">
                  <AlertTriangle className="size-4 text-red-500" />
                  <span className="text-sm text-red-700 dark:text-red-300">
                    {file.name}: {errors[0].message}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Uploaded Files List */}
          {files.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Files to Process</Label>
              {files.map((file) => (
                <div key={file.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  {getFileIcon(file.name)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(file.status)}
                        {file.status !== 'error' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeFile(file.id)}
                            disabled={isProcessing}
                          >
                            <X className="size-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    {file.status === 'processing' && (
                      <Progress value={file.progress} className="mt-2 h-1" />
                    )}
                    {file.status === 'error' && file.error && (
                      <p className="text-xs text-red-500 mt-1">{file.error}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Metadata Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Interview title or description"
                disabled={isProcessing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sourceType">Source Type</Label>
              <Select value={sourceType} onValueChange={setSourceType} disabled={isProcessing}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sourceTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={processFiles}
              disabled={files.length === 0 || isProcessing}
              className="flex-1"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="size-4 mr-2" />
                  Analyze {files.length} {files.length === 1 ? 'File' : 'Files'}
                </>
              )}
            </Button>
            {onCancel && (
              <Button variant="outline" onClick={onCancel} disabled={isProcessing}>
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}