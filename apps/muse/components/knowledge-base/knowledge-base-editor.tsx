'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Upload,
  FileText,
  Save,
  X,
  Plus,
  AlertCircle,
  CheckCircle,
  Globe,
  BookOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface KnowledgeFile {
  id: string;
  name: string;
  type: 'document' | 'transcript' | 'character' | 'guideline' | 'note' | 'draft';
  content?: string;
  tags: string[];
  size: number;
  createdAt: Date;
  updatedAt: Date;
  starred: boolean;
  preview?: string;
  tier: 'global' | 'story';
  projectId?: string;
}

interface KnowledgeBaseEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (file: Omit<KnowledgeFile, 'id' | 'createdAt' | 'updatedAt' | 'size'>, tier: 'global' | 'story') => void;
  initialData?: Partial<KnowledgeFile>;
}

const FILE_TYPES: { value: KnowledgeFile['type']; label: string; description: string }[] = [
  { value: 'note', label: 'Note', description: 'General notes and ideas' },
  { value: 'guideline', label: 'Style Guide', description: 'Writing guidelines and rules' },
  { value: 'character', label: 'Character', description: 'Character profiles and details' },
  { value: 'document', label: 'Document', description: 'Reference documents' },
  { value: 'transcript', label: 'Transcript', description: 'Interview or conversation transcripts' },
  { value: 'draft', label: 'Draft', description: 'Story drafts and versions' }
];

export function KnowledgeBaseEditor({ 
  isOpen, 
  onClose, 
  onSave, 
  initialData 
}: KnowledgeBaseEditorProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [type, setType] = useState<KnowledgeFile['type']>(initialData?.type || 'note');
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [tier, setTier] = useState<'global' | 'story'>(initialData?.tier || 'story');
  const [newTag, setNewTag] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddTag = () => {
    const sanitizedTag = newTag.trim().toLowerCase().replace(/[^\w\s-]/g, '').substring(0, 20);
    
    // Validate tag
    if (!sanitizedTag) return;
    if (sanitizedTag.length < 2) return;
    if (tags.length >= 10) {
      setError('Maximum 10 tags allowed');
      return;
    }
    if (tags.includes(sanitizedTag)) return;
    
    setTags([...tags, sanitizedTag]);
    setNewTag('');
    setError(null);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Security: File size validation (max 10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      setError('File size too large. Maximum size is 10MB.');
      return;
    }

    // Security: File type validation
    const allowedTypes = ['text/plain', 'text/markdown', 'application/pdf'];
    const allowedExtensions = ['.txt', '.md', '.doc', '.docx', '.pdf'];
    const hasValidExtension = allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    
    if (!hasValidExtension && !allowedTypes.includes(file.type)) {
      setError('Invalid file type. Only text files, documents, and PDFs are allowed.');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const fileContent = await file.text();
      
      // Security: Content length validation
      if (fileContent.length > 1000000) { // 1MB text limit
        setError('File content too large. Please use a smaller file.');
        setIsUploading(false);
        return;
      }
      
      // Sanitize filename
      const sanitizedName = file.name.replace(/[<>:"/\\|?*]/g, '_').substring(0, 100);
      
      setName(name || sanitizedName);
      setContent(fileContent);
      
      // Auto-detect type based on filename
      const fileName = file.name.toLowerCase();
      if (fileName.includes('character')) setType('character');
      else if (fileName.includes('guideline') || fileName.includes('style') || fileName.includes('format')) setType('guideline');
      else if (fileName.includes('transcript') || fileName.includes('interview')) setType('transcript');
      else if (fileName.includes('draft')) setType('draft');
      
    } catch (error) {
      setError('Failed to read file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = () => {
    // Input validation and sanitization
    const sanitizedName = name.trim().substring(0, 200); // Limit name length
    const sanitizedContent = content.trim().substring(0, 1000000); // Limit content length (1MB)
    
    if (!sanitizedName) {
      setError('Please enter a name for this entry');
      return;
    }

    if (!sanitizedContent) {
      setError('Please enter some content or upload a file');
      return;
    }

    // Additional validation
    if (sanitizedName.length < 2) {
      setError('Name must be at least 2 characters long');
      return;
    }

    if (sanitizedContent.length < 10) {
      setError('Content must be at least 10 characters long');
      return;
    }

    const fileData: Omit<KnowledgeFile, 'id' | 'createdAt' | 'updatedAt' | 'size'> = {
      name: sanitizedName,
      type,
      content: sanitizedContent,
      tags: tags.filter(tag => tag.trim().length > 0).slice(0, 10), // Limit to 10 tags, filter empty
      starred: false,
      preview: sanitizedContent.substring(0, 100) + (sanitizedContent.length > 100 ? '...' : ''),
      tier,
      projectId: tier === 'story' ? 'current-project' : undefined // Will be set by parent
    };

    onSave(fileData, tier);
    handleClose();
  };

  const handleClose = () => {
    setName('');
    setContent('');
    setType('note');
    setTags([]);
    setTier('story');
    setNewTag('');
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose} aria-describedby="knowledge-editor-description">
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle id="knowledge-editor-title">
            {initialData ? 'Edit Knowledge Base Entry' : 'Add New Knowledge Base Entry'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {error && (
            <div 
              className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2" 
              role="alert"
              aria-live="polite"
            >
              <AlertCircle className="size-4 text-red-600 mt-0.5" aria-hidden="true" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Library Destination Selector */}
          <div>
            <Label className="text-base font-medium mb-3 block" id="library-destination-label">
              Library Destination
            </Label>
            <div 
              className="grid grid-cols-1 gap-2" 
              role="radiogroup" 
              aria-labelledby="library-destination-label"
            >
              <Button
                type="button"
                variant={tier === 'story' ? 'default' : 'outline'}
                size="lg"
                onClick={() => setTier('story')}
                className="justify-start h-auto p-4 text-left"
                role="radio"
                aria-checked={tier === 'story'}
                aria-describedby="story-library-description"
              >
                <div className="flex items-start gap-3 w-full">
                  <BookOpen className={cn(
                    "size-5 mt-1 shrink-0",
                    tier === 'story' ? "text-white" : "text-green-600"
                  )} />
                  <div className="flex-1">
                    <div className="font-medium">Story Library</div>
                    <div 
                      id="story-library-description"
                      className={cn(
                        "text-sm mt-1",
                        tier === 'story' ? "text-white/80" : "text-muted-foreground"
                      )}
                    >
                      Available only for this project • Characters, drafts, story-specific materials
                    </div>
                  </div>
                  {tier === 'story' && (
                    <div className="shrink-0">
                      <CheckCircle className="size-4 text-white" />
                    </div>
                  )}
                </div>
              </Button>
              
              <Button
                type="button"
                variant={tier === 'global' ? 'default' : 'outline'}
                size="lg"
                onClick={() => setTier('global')}
                className="justify-start h-auto p-4 text-left"
                role="radio"
                aria-checked={tier === 'global'}
                aria-describedby="global-library-description"
              >
                <div className="flex items-start gap-3 w-full">
                  <Globe className={cn(
                    "size-5 mt-1 shrink-0",
                    tier === 'global' ? "text-white" : "text-blue-600"
                  )} />
                  <div className="flex-1">
                    <div className="font-medium">Global Guidelines</div>
                    <div 
                      id="global-library-description"
                      className={cn(
                        "text-sm mt-1",
                        tier === 'global' ? "text-white/80" : "text-muted-foreground"
                      )}
                    >
                      Available across all stories • Writing standards, network requirements
                    </div>
                  </div>
                  {tier === 'global' && (
                    <div className="shrink-0">
                      <CheckCircle className="size-4 text-white" />
                    </div>
                  )}
                </div>
              </Button>
            </div>
          </div>

          <Tabs defaultValue="manual" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual">Manual Entry</TabsTrigger>
              <TabsTrigger value="upload">File Upload</TabsTrigger>
            </TabsList>

            <TabsContent value="manual" className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Character Profile - Sarah, Style Guidelines, etc."
                  />
                </div>

                <div>
                  <Label htmlFor="type">Type</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {FILE_TYPES.map((fileType) => (
                      <Button
                        key={fileType.value}
                        variant={type === fileType.value ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setType(fileType.value)}
                        className="justify-start h-auto p-3"
                      >
                        <div className="text-left">
                          <div className="font-medium text-sm">{fileType.label}</div>
                          <div className="text-xs text-muted-foreground">
                            {fileType.description}
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div>
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Enter your content here... You can paste text, write notes, guidelines, character descriptions, etc."
                  className="min-h-[200px] mt-2"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {content.length} characters
                </div>
              </div>
            </TabsContent>

            <TabsContent value="upload" className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <FileText className="size-8 mx-auto mb-2 text-muted-foreground" />
                <h3 className="font-medium mb-1">Upload a file</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Upload text files, documents, or paste content
                </p>
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  <Upload className="size-4 mr-2" />
                  {isUploading ? 'Uploading...' : 'Choose File'}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".txt,.md,.doc,.docx,.pdf"
                  onChange={handleFileUpload}
                />
              </div>

              {content && (
                <div>
                  <Label>File Preview</Label>
                  <div className="mt-2 p-3 bg-gray-50 rounded border max-h-32 overflow-y-auto">
                    <pre className="text-xs whitespace-pre-wrap">
                      {content.substring(0, 500)}
                      {content.length > 500 && '\n...'}
                    </pre>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Tags */}
          <div>
            <Label>Tags (Optional)</Label>
            <div className="flex flex-wrap gap-2 mt-2 mb-3">
              {tags.map(tag => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <X 
                    className="size-3 cursor-pointer hover:text-red-600" 
                    onClick={() => handleRemoveTag(tag)}
                  />
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add a tag..."
                className="flex-1"
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
              />
              <Button size="sm" variant="outline" onClick={handleAddTag}>
                <Plus className="size-4" />
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!name.trim() || !content.trim()}
            >
              <Save className="size-4 mr-2" />
              Save Entry
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}