'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  FolderOpen,
  Upload,
  FileText,
  Search,
  Clock,
  Star,
  Plus,
  X,
  ChevronRight,
  ChevronDown,
  Filter,
  History,
  Archive,
  Hash,
  Eye,
  Download,
  Trash2,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { KnowledgeBaseEditor } from './knowledge-base-editor';

interface KnowledgeFile {
  id: string;
  name: string;
  type: 'document' | 'transcript' | 'character' | 'guideline' | 'note' | 'draft';
  content?: string;
  tags: string[];
  size: number;
  createdAt: Date;
  updatedAt: Date;
  lastAccessed?: Date;
  starred: boolean;
  preview?: string;
  versionCount?: number;
}

interface UnifiedKnowledgeBaseProps {
  projectId: string;
  onFileSelect?: (file: KnowledgeFile) => void;
  onFilesChange?: (files: KnowledgeFile[]) => void;
  className?: string;
}

// Load knowledge base files from localStorage
const loadKnowledgeBaseFiles = (projectId: string): KnowledgeFile[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const savedFiles = localStorage.getItem(`kb-files-${projectId}`);
    if (!savedFiles) return [];
    
    const parsed = JSON.parse(savedFiles);
    // Ensure dates are properly converted back to Date objects
    return parsed.map((file: any) => ({
      ...file,
      createdAt: new Date(file.createdAt),
      updatedAt: new Date(file.updatedAt),
      lastAccessed: file.lastAccessed ? new Date(file.lastAccessed) : undefined
    }));
  } catch (error) {
    console.error('Error loading knowledge base files:', error);
    return [];
  }
};

// Save knowledge base files to localStorage
const saveKnowledgeBaseFiles = (projectId: string, files: KnowledgeFile[]) => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(`kb-files-${projectId}`, JSON.stringify(files));
  } catch (error) {
    console.error('Error saving knowledge base files:', error);
  }
};

/*
  {
    id: '1',
    name: 'Network_Treatment_Guide.pdf',
    type: 'guideline',
    content: `NETWORK TREATMENT STANDARDS
    
MUST follow standard treatment format with:
- Title page with logline
- Character descriptions MUST be under 50 words each
- NEVER exceed 8 pages for one-hour drama
- ALWAYS include act breaks clearly marked
- Format: 12pt Courier font, 1.5 line spacing
- Voice SHOULD be present tense, active voice
- REQUIRED: Executive summary on page 1
    
STYLE GUIDELINES:
- Tone MUST match network brand (sophisticated, character-driven)
- NEVER use technical jargon or industry slang
- Character motivations SHOULD be clear in every scene
- Dialogue examples MUST sound authentic to character demographics`,
    tags: ['guideline', 'network', 'treatment', 'active'],
    size: 3420,
    createdAt: new Date('2024-02-20'),
    updatedAt: new Date('2024-02-22'),
    lastAccessed: new Date('2024-02-22'),
    starred: true,
    preview: 'NETWORK TREATMENT STANDARDS - Format requirements...',
    versionCount: 2
  },
  {
    id: '2',
    name: 'Voice_Style_Bible.txt',
    type: 'guideline',
    content: `WRITING VOICE GUIDELINES
    
TONE: Contemporary, grounded, emotionally honest
STYLE: Present tense, immersive POV
CHARACTER VOICE: Each character MUST have distinct speech patterns
NEVER use: excessive exposition, on-the-nose dialogue
ALWAYS: Show don't tell, subtext over text
REQUIRED: Authentic regional dialects when appropriate
    
STRUCTURE RULES:
- Scenes SHOULD start in media res
- MUST end each scene with forward momentum
- Conflict in every scene - internal or external
- Character growth MUST be visible through action`,
    tags: ['guideline', 'voice', 'style', 'active'],
    size: 2890,
    createdAt: new Date('2024-02-18'),
    updatedAt: new Date('2024-02-18'),
    starred: true,
    preview: 'WRITING VOICE GUIDELINES - Tone and style requirements...'
  },
  {
    id: '3',
    name: 'Chapter 1 - Draft v3.txt',
    type: 'draft',
    tags: ['chapter-1', 'draft', 'current'],
    size: 15420,
    createdAt: new Date('2024-02-20'),
    updatedAt: new Date('2024-02-22'),
    lastAccessed: new Date('2024-02-22'),
    starred: false,
    preview: 'The morning sun cast long shadows across...',
    versionCount: 3
  },
  {
    id: '4',
    name: 'Interview_Transcript.txt',
    type: 'transcript',
    tags: ['research', 'interview'],
    size: 8900,
    createdAt: new Date('2024-02-18'),
    updatedAt: new Date('2024-02-18'),
    starred: false,
    preview: 'Q: Tell me about your experience...'
  },
  {
    id: '5',
    name: 'Character_Sarah.md',
    type: 'character',
    tags: ['protagonist', 'sarah'],
    size: 2340,
    createdAt: new Date('2024-02-21'),
    updatedAt: new Date('2024-02-21'),
    starred: true,
    preview: 'Sarah is a 28-year-old journalist who...'
  },
  {
    id: '6',
    name: 'Production_Format_Standards.txt', 
    type: 'guideline',
    content: `PRODUCTION FORMAT REQUIREMENTS
    
SCREENPLAY FORMAT:
- MUST use Courier 12pt font only
- Scene headings: ALL CAPS, no periods
- Character names: CENTERED, ALL CAPS
- Parentheticals: lowercase in parentheses, centered
- NEVER exceed 120 pages for feature
- Page margins: 1.5" left, 1" right, top, bottom
    
SCENE STRUCTURE:
- Each scene MUST advance plot or character
- ALWAYS establish time/location clearly  
- Transitions SHOULD be invisible
- Action lines MUST be present tense, active voice`,
    tags: ['guideline', 'format', 'production'],
    size: 1840,
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-02-20'),
    starred: false,
    preview: 'PRODUCTION FORMAT REQUIREMENTS - Screenplay standards...'
  }
*/

type ViewMode = 'all' | 'recent' | 'starred' | 'drafts';

export function UnifiedKnowledgeBase({
  projectId,
  onFileSelect,
  onFilesChange,
  className
}: UnifiedKnowledgeBaseProps) {
  const [files, setFiles] = useState<KnowledgeFile[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['quick-access', 'files'])
  );
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load collapsed state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem(`kb-collapsed-${projectId}`);
    if (savedState === 'true') {
      setIsCollapsed(true);
    }
  }, [projectId]);

  // Load knowledge base files after hydration to prevent SSR mismatch
  useEffect(() => {
    if (!isHydrated) {
      setIsHydrated(true);
      const initialFiles = loadKnowledgeBaseFiles(projectId);
      setFiles(initialFiles);
      // Call onFilesChange with initial files
      onFilesChange?.(initialFiles);
    }
  }, [projectId, isHydrated, onFilesChange]);

  // Debug: Log knowledge base state changes (can be removed in production)
  useEffect(() => {
    console.log(`[KnowledgeBase] Project ${projectId} has ${files.length} files:`, files.map(f => f.name));
  }, [files, projectId]);

  // Update file access time when files are accessed
  const updateFileAccess = useCallback((fileId: string) => {
    const updatedFiles = files.map(file =>
      file.id === fileId ? { ...file, lastAccessed: new Date() } : file
    );
    setFiles(updatedFiles);
    saveKnowledgeBaseFiles(projectId, updatedFiles);
    onFilesChange?.(updatedFiles);
  }, [files, projectId, onFilesChange]);

  // Save collapsed state
  const toggleCollapsed = useCallback(() => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem(`kb-collapsed-${projectId}`, newState.toString());
  }, [isCollapsed, projectId]);

  // Get all unique tags from files
  const allTags = Array.from(
    new Set(files.flatMap(file => file.tags))
  ).sort();

  // Filter files based on search, tags, and view mode
  const filteredFiles = files.filter(file => {
    // Search filter
    const matchesSearch = searchQuery === '' || 
      file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (file.preview && file.preview.toLowerCase().includes(searchQuery.toLowerCase()));

    // Tag filter
    const matchesTags = selectedTags.length === 0 ||
      selectedTags.every(tag => file.tags.includes(tag));

    // View mode filter
    let matchesView = true;
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    switch (viewMode) {
      case 'recent':
        matchesView = file.lastAccessed ? file.lastAccessed > dayAgo : file.updatedAt > dayAgo;
        break;
      case 'starred':
        matchesView = file.starred;
        break;
      case 'drafts':
        matchesView = file.type === 'draft';
        break;
    }

    return matchesSearch && matchesTags && matchesView;
  }).sort((a, b) => {
    // Sort by last accessed/updated date
    const dateA = a.lastAccessed || a.updatedAt;
    const dateB = b.lastAccessed || b.updatedAt;
    return dateB.getTime() - dateA.getTime();
  });

  // Recent files (last 5)
  const recentFiles = [...files]
    .sort((a, b) => {
      const dateA = a.lastAccessed || a.updatedAt;
      const dateB = b.lastAccessed || b.updatedAt;
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, 5);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const handleFileUpload = () => {
    if (!fileInputRef.current) return;
    fileInputRef.current.click();
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles) return;

    setIsUploading(true);
    const newFiles: KnowledgeFile[] = [];

    try {
      for (const file of Array.from(uploadedFiles)) {
        const content = await file.text();
        const newFile: KnowledgeFile = {
          id: Date.now().toString() + Math.random().toString(36),
          name: file.name,
          type: file.name.toLowerCase().includes('transcript') ? 'transcript' : 
                file.name.toLowerCase().includes('character') ? 'character' :
                file.name.toLowerCase().includes('guideline') || file.name.toLowerCase().includes('style') ? 'guideline' : 'document',
          content,
          tags: [],
          size: file.size,
          createdAt: new Date(),
          updatedAt: new Date(),
          starred: false,
          preview: content.substring(0, 100) + (content.length > 100 ? '...' : '')
        };
        newFiles.push(newFile);
      }

      const updatedFiles = [...files, ...newFiles];
      setFiles(updatedFiles);
      saveKnowledgeBaseFiles(projectId, updatedFiles);
      onFilesChange?.(updatedFiles);
    } catch (error) {
      console.error('Failed to upload files:', error);
    } finally {
      setIsUploading(false);
      // Reset the input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const toggleStar = (fileId: string) => {
    const updatedFiles = files.map(file =>
      file.id === fileId ? { ...file, starred: !file.starred } : file
    );
    setFiles(updatedFiles);
    saveKnowledgeBaseFiles(projectId, updatedFiles);
    onFilesChange?.(updatedFiles);
  };

  const deleteFile = (fileId: string) => {
    const updatedFiles = files.filter(file => file.id !== fileId);
    setFiles(updatedFiles);
    saveKnowledgeBaseFiles(projectId, updatedFiles);
    onFilesChange?.(updatedFiles);
  };

  // REMOVED - replaced with modal-based createNewNote below
  const createNewNoteOLD = () => {
    const newNote: KnowledgeFile = {
      id: `note_${Date.now()}`,
      name: `New Note ${new Date().toLocaleDateString()}`,
      type: 'note',
      content: '',
      tags: ['note', 'draft'],
      size: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      starred: false,
      preview: 'Empty note - click to edit...'
    };
    
    setFiles(prev => {
      const updatedFiles = [newNote, ...prev];
      onFilesChange?.(updatedFiles);
      return updatedFiles;
    });
    setViewMode('all');
    // Auto-select the new note for editing
    onFileSelect?.(newNote);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    return date.toLocaleDateString();
  };

  const getFileIcon = (type: KnowledgeFile['type']) => {
    switch (type) {
      case 'draft': return <FileText className="size-3" />;
      case 'character': return <Hash className="size-3" />;
      case 'transcript': return <FileText className="size-3" />;
      default: return <FileText className="size-3" />;
    }
  };

  // Handler functions for Knowledge Base Editor integration
  const createNewNote = () => {
    setIsEditorOpen(true);
  };

  const handleSaveNewEntry = (fileData: Omit<KnowledgeFile, 'id' | 'createdAt' | 'updatedAt' | 'size'>) => {
    const newFile: KnowledgeFile = {
      ...fileData,
      id: Date.now().toString() + Math.random().toString(36),
      size: fileData.content?.length || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedFiles = [...files, newFile];
    setFiles(updatedFiles);
    saveKnowledgeBaseFiles(projectId, updatedFiles);
    onFilesChange?.(updatedFiles);
  };

  // Collapsed state - minimal sidebar
  if (isCollapsed) {
    return (
      <div className="w-12 h-full bg-background border-r border-border flex flex-col items-center py-4 gap-4 transition-all duration-300 ease-in-out">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleCollapsed}
          className="size-8 p-0"
        >
          <PanelLeft className="size-4" />
        </Button>
        
        <div className="flex flex-col gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { toggleCollapsed(); setViewMode('all'); }}
            className="size-8 p-0"
            title="All Files"
          >
            <FolderOpen className="size-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { toggleCollapsed(); setViewMode('recent'); }}
            className="size-8 p-0"
            title="Recent"
          >
            <Clock className="size-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { toggleCollapsed(); setViewMode('starred'); }}
            className="size-8 p-0"
            title="Starred"
          >
            <Star className="size-4" />
          </Button>
        </div>
      </div>
    );
  }

  // Full sidebar
  return (
    <div className={cn("flex flex-col h-full bg-background transition-all duration-300 ease-in-out", className)}>
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FolderOpen className="size-5 text-purple-600" />
            <h2 className="font-semibold text-sm">Knowledge Base</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleCollapsed}
            className="size-7 p-0"
          >
            <PanelLeftClose className="size-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-2 top-2 size-3 text-muted-foreground" />
          <Input
            placeholder="Search everything..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-7 h-8 text-xs"
          />
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="default"
            onClick={handleFileUpload}
            disabled={isUploading}
            className="flex-1 h-7 text-xs"
          >
            <Upload className="size-3 mr-1" />
            {isUploading ? 'Uploading...' : 'Upload'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={createNewNote}
            className="flex-1 h-7 text-xs"
          >
            <Plus className="size-3 mr-1" />
            New Note
          </Button>
        </div>
      </div>

      {/* Hidden file input */}
      <input 
        ref={fileInputRef} 
        type="file" 
        multiple 
        className="hidden" 
        onChange={handleFileInputChange}
      />

      {/* View Mode Tabs */}
      <div className="border-b px-4 py-2">
        <div className="flex gap-1">
          {(['all', 'recent', 'starred', 'drafts'] as ViewMode[]).map(mode => (
            <Button
              key={mode}
              variant={viewMode === mode ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode(mode)}
              className="h-6 px-2 text-xs capitalize"
            >
              {mode === 'all' && <FolderOpen className="size-3 mr-1" />}
              {mode === 'recent' && <Clock className="size-3 mr-1" />}
              {mode === 'starred' && <Star className="size-3 mr-1" />}
              {mode === 'drafts' && <History className="size-3 mr-1" />}
              {mode}
            </Button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          
          {/* Quick Access Section */}
          {viewMode === 'all' && recentFiles.length > 0 && (
            <div>
              <button
                onClick={() => toggleSection('quick-access')}
                className="flex items-center gap-2 text-sm font-medium mb-2 hover:text-muted-foreground transition-colors w-full"
              >
                {expandedSections.has('quick-access') ? (
                  <ChevronDown className="size-3" />
                ) : (
                  <ChevronRight className="size-3" />
                )}
                Quick Access
                <Badge variant="secondary" className="text-xs ml-auto">
                  {recentFiles.length}
                </Badge>
              </button>

              {expandedSections.has('quick-access') && (
                <div className="space-y-1 mb-4">
                  {recentFiles.map(file => (
                    <div
                      key={file.id}
                      onClick={() => {
                        onFileSelect?.(file);
                        updateFileAccess(file.id);
                      }}
                      className="flex items-center gap-2 p-2 hover:bg-muted/50 rounded cursor-pointer group"
                    >
                      <div className="text-muted-foreground">
                        {getFileIcon(file.type)}
                      </div>
                      <span className="text-xs truncate flex-1">{file.name}</span>
                      <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                        {formatDate(file.lastAccessed || file.updatedAt)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tag Filter */}
          {allTags.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Filter className="size-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Filter by tags</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {allTags.slice(0, 8).map(tag => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                    className="text-xs cursor-pointer"
                    onClick={() => {
                      setSelectedTags(prev =>
                        prev.includes(tag)
                          ? prev.filter(t => t !== tag)
                          : [...prev, tag]
                      );
                    }}
                  >
                    {tag}
                  </Badge>
                ))}
                {allTags.length > 8 && (
                  <Badge variant="outline" className="text-xs">
                    +{allTags.length - 8} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Files List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <button
                onClick={() => toggleSection('files')}
                className="flex items-center gap-2 text-sm font-medium hover:text-muted-foreground transition-colors"
              >
                {expandedSections.has('files') ? (
                  <ChevronDown className="size-3" />
                ) : (
                  <ChevronRight className="size-3" />
                )}
                Files
              </button>
              <span className="text-xs text-muted-foreground">
                {filteredFiles.length} {viewMode !== 'all' && `of ${files.length}`}
              </span>
            </div>

            {expandedSections.has('files') && (
              <div className="space-y-2">
                {filteredFiles.length === 0 ? (
                  <div className="text-center py-8">
                    <FolderOpen className="size-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                    <p className="text-sm text-muted-foreground mb-3">
                      {searchQuery || selectedTags.length > 0 
                        ? 'No files match your filters' 
                        : 'No knowledge base content yet'}
                    </p>
                    {!searchQuery && selectedTags.length === 0 && (
                      <div className="space-y-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={createNewNote}
                          className="border-dashed border-2 hover:border-solid"
                        >
                          <Plus className="size-4 mr-2" />
                          Create your first entry
                        </Button>
                        <p className="text-xs text-muted-foreground">
                          Add guidelines, characters, or reference materials
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  filteredFiles.map(file => (
                    <Card 
                      key={file.id}
                      className="cursor-pointer transition-all duration-200 hover:shadow-sm hover:bg-muted/50"
                      onClick={() => {
                        onFileSelect?.(file);
                        updateFileAccess(file.id);
                      }}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start gap-2">
                          <div className="text-muted-foreground mt-0.5">
                            {getFileIcon(file.type)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-1">
                              <div className="flex-1">
                                <h4 className="font-medium text-xs break-words leading-tight">
                                  {file.name}
                                </h4>
                                {file.versionCount && file.versionCount > 1 && (
                                  <span className="text-xs text-muted-foreground">
                                    v{file.versionCount}
                                  </span>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-1 shrink-0">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleStar(file.id);
                                  }}
                                  className="size-5 p-0"
                                >
                                  <Star className={cn(
                                    "w-3 h-3",
                                    file.starred ? "fill-yellow-400 text-yellow-400" : "text-gray-400"
                                  )} />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteFile(file.id);
                                  }}
                                  className="size-5 p-0 hover:text-red-600"
                                >
                                  <Trash2 className="size-3" />
                                </Button>
                              </div>
                            </div>
                            
                            {file.preview && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                {file.preview}
                              </p>
                            )}
                            
                            <div className="flex items-center justify-between mt-2 gap-2">
                              <div className="flex gap-1 flex-wrap">
                                {file.tags.slice(0, 2).map((tag, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs px-1 py-0">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                              
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>{formatFileSize(file.size)}</span>
                                <span>•</span>
                                <span>{formatDate(file.updatedAt)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Project History Section */}
          {viewMode === 'drafts' && (
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-3">
                <History className="size-4 text-muted-foreground" />
                <h3 className="text-sm font-medium">Version History</h3>
              </div>
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground bg-muted/50 rounded p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">Auto-save Draft</span>
                    <span>2 minutes ago</span>
                  </div>
                  <p className="text-xs">3,421 words • Chapter 2 edits</p>
                </div>
                <div className="text-xs text-muted-foreground bg-muted/50 rounded p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">Manual Save</span>
                    <span>1 hour ago</span>
                  </div>
                  <p className="text-xs">3,200 words • Major revision</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Knowledge Base Editor Modal */}
      <KnowledgeBaseEditor
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSave={handleSaveNewEntry}
      />
    </div>
  );
}