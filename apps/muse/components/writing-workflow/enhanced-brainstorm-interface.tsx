'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageCircle, 
  Send, 
  Sparkles, 
  Brain,
  FileText,
  ArrowRight,
  RefreshCw,
  Lightbulb,
  MessageSquare,
  Upload,
  File,
  GitBranch,
  Target,
  Zap,
  Users,
  Heart,
  Swords,
  Clock,
  Map,
  Palette,
  Plus,
  X,
  TreePine,
  ArrowDown,
  ChevronDown,
  ChevronRight,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  explorationMethod?: ExplorationMethod;
}

interface ImportedFile {
  id: string;
  name: string;
  content: string;
  type: 'transcript' | 'text' | 'notes' | 'research';
  size: number;
}

type ExplorationMethod = 
  | 'tree-of-thought'
  | 'character-analysis' 
  | 'conflict-mapping'
  | 'theme-discovery'
  | 'structure-analysis'
  | 'genre-exploration'
  | 'tone-development'
  | 'audience-targeting'
  | 'free-form';

interface ExplorationPrompt {
  method: ExplorationMethod;
  title: string;
  description: string;
  icon: React.ReactNode;
  prompts: string[];
  color: string;
}

interface KnowledgeBaseFile {
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

interface EnhancedBrainstormInterfaceProps {
  transcriptData?: any;
  knowledgeBase?: any;
  knowledgeBaseFiles?: KnowledgeBaseFile[];
  onFilesChange?: (files: KnowledgeBaseFile[]) => void;
  onProceedToPhase1: (brainstormSummary: string) => void;
}

const EXPLORATION_METHODS: ExplorationPrompt[] = [
  {
    method: 'tree-of-thought',
    title: 'Tree of Thought',
    description: 'Systematic exploration of story branches and possibilities',
    icon: <TreePine className="size-4" />,
    color: 'bg-green-50 border-green-200 text-green-700',
    prompts: [
      "Let's explore this story using tree-of-thought reasoning. What are 3 different main character perspectives we could take?",
      "If we branch this story into different genres (drama, thriller, comedy), how would each version unfold?",
      "What are the key decision points in this narrative that could lead to completely different stories?"
    ]
  },
  {
    method: 'character-analysis',
    title: 'Character Deep Dive',
    description: 'Explore character motivations, arcs, and relationships',
    icon: <Users className="size-4" />,
    color: 'bg-blue-50 border-blue-200 text-blue-700',
    prompts: [
      "Who is the most compelling character in this material and why?",
      "What hidden motivations might drive the main characters?",
      "How do the character relationships create natural conflict and tension?"
    ]
  },
  {
    method: 'conflict-mapping',
    title: 'Conflict Architecture',
    description: 'Map internal and external conflicts for maximum drama',
    icon: <Swords className="size-4" />,
    color: 'bg-red-50 border-red-200 text-red-700',
    prompts: [
      "What are the layers of conflict in this story - personal, interpersonal, and societal?",
      "Where is the central tension that drives the entire narrative?",
      "How do smaller conflicts build toward the main confrontation?"
    ]
  },
  {
    method: 'theme-discovery',
    title: 'Theme Exploration',
    description: 'Uncover deeper meanings and universal themes',
    icon: <Heart className="size-4" />,
    color: 'bg-orange-50 border-orange-200 text-orange-700',
    prompts: [
      "What universal human experiences does this story explore?",
      "What themes emerge naturally from the characters' journeys?",
      "How can we weave meaningful themes without being heavy-handed?"
    ]
  },
  {
    method: 'structure-analysis',
    title: 'Story Structure',
    description: 'Analyze pacing, acts, and narrative architecture',
    icon: <Map className="size-4" />,
    color: 'bg-orange-50 border-orange-200 text-orange-700',
    prompts: [
      "How should we structure this story for maximum emotional impact?",
      "Where are the natural act breaks and turning points?",
      "What pacing will keep the audience engaged throughout?"
    ]
  },
  {
    method: 'genre-exploration',
    title: 'Genre Possibilities',
    description: 'Explore different genre approaches and conventions',
    icon: <Palette className="size-4" />,
    color: 'bg-indigo-50 border-indigo-200 text-indigo-700',
    prompts: [
      "What genre best serves this story's core emotional journey?",
      "How could we blend genres to create something unique?",
      "What genre conventions should we embrace or subvert?"
    ]
  }
];

export function EnhancedBrainstormInterface({ 
  transcriptData, 
  knowledgeBase,
  knowledgeBaseFiles = [],
  onFilesChange,
  onProceedToPhase1 
}: EnhancedBrainstormInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasStartedBrainstorming, setHasStartedBrainstorming] = useState(false);
  // Use unified knowledge base files instead of separate importedFiles state
  const [activeExploration, setActiveExploration] = useState<ExplorationMethod | null>(null);
  const [usedMethods, setUsedMethods] = useState<Set<ExplorationMethod>>(new Set());
  const [customPrompt, setCustomPrompt] = useState('');
  const [expandedMethod, setExpandedMethod] = useState<ExplorationMethod | null>(null);
  // NUCLEAR OPTION: ALL AUTO-SCROLL LOGIC DISABLED
  // const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  // const [userHasScrolled, setUserHasScrolled] = useState(false);
  // const [lastUserScrollTime, setLastUserScrollTime] = useState(0);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // DISABLED: All scroll automation
  // const isNearBottom = useCallback(() => {
  //   const container = messagesContainerRef.current;
  //   if (!container) return true;
  //   const { scrollTop, scrollHeight, clientHeight } = container;
  //   const threshold = 100;
  //   const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
  //   return distanceFromBottom <= threshold;
  // }, []);

  // DISABLED: Auto-scroll to bottom
  // const scrollToBottom = useCallback(() => {
  //   messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  //   setUserHasScrolled(false);
  //   setLastUserScrollTime(0);
  // }, []);

  // DISABLED: All scroll event handling
  // const handleScroll = useCallback(() => {
  //   const now = Date.now();
  //   setLastUserScrollTime(now);
  //   setUserHasScrolled(true);
  //   const nearBottom = isNearBottom();
  //   setShowScrollToBottom(!nearBottom);
  //   if (nearBottom) {
  //     setTimeout(() => {
  //       setUserHasScrolled(false);
  //       setLastUserScrollTime(0);
  //     }, 500);
  //   }
  // }, [isNearBottom]);

  // DISABLED: Scroll listeners
  // useEffect(() => {
  //   const container = messagesContainerRef.current;
  //   if (container) {
  //     container.addEventListener('scroll', handleScroll);
  //     return () => container.removeEventListener('scroll', handleScroll);
  //   }
  // }, [handleScroll]);

  // DISABLED: Auto-scroll on message updates - NUCLEAR DISABLE
  // useEffect(() => {
  //   const now = Date.now();
  //   const recentScrollThreshold = 2000;
  //   const hasRecentlyScrolled = userHasScrolled && (now - lastUserScrollTime < recentScrollThreshold);
  //   const shouldAutoScroll = isNearBottom() && (!hasRecentlyScrolled || messages.length <= 1);
  //   if (shouldAutoScroll) {
  //     scrollToBottom();
  //     setShowScrollToBottom(false);
  //   }
  // }, [messages, isNearBottom, scrollToBottom, userHasScrolled, lastUserScrollTime]);

  console.log('🚨 NUCLEAR DEBUG: Enhanced brainstorm interface loaded - ALL SCROLL AUTOMATION DISABLED');

  // NUCLEAR DEBUGGING: Track any external scroll interference
  useEffect(() => {
    const trackScrollEvents = () => {
      console.log('🚨 NUCLEAR DEBUG: Window scroll event detected at position:', window.scrollY);
    };

    const trackContainerScroll = () => {
      const container = messagesContainerRef.current;
      if (container) {
        console.log('🚨 NUCLEAR DEBUG: Container scroll event - scrollTop:', container.scrollTop, 'scrollHeight:', container.scrollHeight, 'clientHeight:', container.clientHeight);
      }
    };

    window.addEventListener('scroll', trackScrollEvents);
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', trackContainerScroll);
    }

    return () => {
      window.removeEventListener('scroll', trackScrollEvents);
      if (container) {
        container.removeEventListener('scroll', trackContainerScroll);
      }
    };
  }, []);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !onFilesChange) return;

    const newFiles: KnowledgeBaseFile[] = [];

    for (const file of Array.from(files)) {
      const content = await file.text();
      const knowledgeBaseFile: KnowledgeBaseFile = {
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
      newFiles.push(knowledgeBaseFile);
    }

    const updatedFiles = [...knowledgeBaseFiles, ...newFiles];
    onFilesChange(updatedFiles);

    // Reset the input
    event.target.value = '';
  }, [knowledgeBaseFiles, onFilesChange]);

  const handleTextImport = useCallback((text: string, name: string) => {
    if (!text.trim() || !onFilesChange) return;
    
    const knowledgeBaseFile: KnowledgeBaseFile = {
      id: Date.now().toString() + Math.random().toString(36),
      name: name || 'Imported Text',
      content: text.trim(),
      type: 'note',
      tags: ['imported'],
      size: text.length,
      createdAt: new Date(),
      updatedAt: new Date(),
      starred: false,
      preview: text.substring(0, 100) + (text.length > 100 ? '...' : '')
    };
    
    const updatedFiles = [...knowledgeBaseFiles, knowledgeBaseFile];
    onFilesChange(updatedFiles);
    setCustomPrompt('');
  }, [knowledgeBaseFiles, onFilesChange]);

  const removeFile = useCallback((fileId: string) => {
    if (!onFilesChange) return;
    const updatedFiles = knowledgeBaseFiles.filter(f => f.id !== fileId);
    onFilesChange(updatedFiles);
  }, [knowledgeBaseFiles, onFilesChange]);

  const handleSendMessage = async (messageContent?: string, method?: ExplorationMethod) => {
    const contentToSend = messageContent || input.trim();
    if (!contentToSend || isGenerating) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: contentToSend,
      timestamp: new Date(),
      explorationMethod: method
    };

    console.log('🚨 NUCLEAR DEBUG: Adding user message, prev count:', messages.length, '-> new count:', messages.length + 1);
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsGenerating(true);
    setHasStartedBrainstorming(true);
    setActiveExploration(method || null);
    
    // Track methods that have been used (for UI indicators)
    if (method) {
      setUsedMethods(prev => new Set([...prev, method]));
    }

    try {
      const response = await fetch('/api/brainstorm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: contentToSend,
          conversationHistory: messages,
          transcriptData,
          knowledgeBase,
          importedFiles: knowledgeBaseFiles,
          explorationMethod: method,
          activeExploration
        })
      });

      if (response.ok && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let assistantContent = '';
        
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: '',
          timestamp: new Date(),
          explorationMethod: method
        };

        console.log('🚨 NUCLEAR DEBUG: Adding assistant message placeholder');
        setMessages(prev => [...prev, assistantMessage]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(5));
                if (data.type === 'content-delta') {
                  assistantContent += data.content;
                  console.log('🚨 NUCLEAR DEBUG: Streaming content update, length:', assistantContent.length);
                  setMessages(prev => prev.map(msg => 
                    msg.id === assistantMessage.id 
                      ? { ...msg, content: assistantContent }
                      : msg
                  ));
                }
              } catch (err) {
                console.warn('Error parsing brainstorm response:', err);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Brainstorming error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try asking your question again.',
        timestamp: new Date()
      };
      console.log('🚨 NUCLEAR DEBUG: Adding error message');
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsGenerating(false);
      // Clear active exploration to show all methods are available again
      setTimeout(() => setActiveExploration(null), 1000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const generateBrainstormSummary = () => {
    if (messages.length === 0) return '';
    
    const conversation = messages.map(msg => 
      `${msg.role === 'user' ? 'You' : 'Claude'}: ${msg.content}`
    ).join('\n\n');
    
    const fileContext = knowledgeBaseFiles.length > 0 
      ? `\n\nKNOWLEDGE BASE FILES:\n${knowledgeBaseFiles.map(f => `- ${f.name} (${f.size} chars)`).join('\n')}`
      : '';
    
    return `BRAINSTORM DISCUSSION:${fileContext}\n\n${conversation}`;
  };

  const handleProceedToPhase1 = () => {
    const brainstormSummary = generateBrainstormSummary();
    onProceedToPhase1(brainstormSummary);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header - Compressed */}
      <Card className="border-2 border-indigo-200 dark:border-indigo-800">
        <CardHeader className="bg-indigo-50 dark:bg-indigo-900/20 py-4">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-indigo-600 rounded-lg shrink-0">
              <Brain className="size-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Story Brainstorming & Exploration</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Import files, explore story possibilities, and collaborate with Claude
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: File Import & Exploration Methods */}
        <div className="space-y-6">
          {/* File Import Section */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Upload className="size-5" />
                Import Materials
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs defaultValue="upload" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="upload">Upload Files</TabsTrigger>
                  <TabsTrigger value="paste">Paste Text</TabsTrigger>
                </TabsList>
                
                <TabsContent value="upload" className="space-y-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".txt,.md,.doc,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="w-full border-dashed border-2"
                  >
                    <Upload className="size-4 mr-2" />
                    Choose Files
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Transcripts, notes, research files
                  </p>
                </TabsContent>
                
                <TabsContent value="paste" className="space-y-3">
                  <Textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="Paste transcript, notes, or any text material here..."
                    className="min-h-[100px]"
                  />
                  <div className="flex gap-2">
                    <Input
                      placeholder="File name (optional)"
                      className="flex-1"
                      id="filename"
                    />
                    <Button
                      onClick={() => {
                        const filename = (document.getElementById('filename') as HTMLInputElement)?.value || 'Pasted Text';
                        handleTextImport(customPrompt, filename);
                      }}
                      disabled={!customPrompt.trim()}
                    >
                      Import
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
              
              {/* Knowledge Base Files List */}
              {knowledgeBaseFiles.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Knowledge Base Files:</Label>
                  {knowledgeBaseFiles.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-2 bg-muted rounded">
                      <div className="flex items-center gap-2">
                        <File className="size-4" />
                        <span className="text-sm truncate">{file.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {file.type}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {Math.round(file.size / 1024)}KB
                        </Badge>
                        {file.starred && <Badge variant="default" className="text-xs">★</Badge>}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(file.id)}
                        className="size-6 p-0 hover:text-red-600"
                        title="Remove from knowledge base"
                      >
                        <X className="size-3" />
                      </Button>
                    </div>
                  ))}
                  <div className="text-xs text-muted-foreground">
                    Changes sync with knowledge base sidebar
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Exploration Methods - Compressed Design */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <GitBranch className="size-4" />
                Exploration Methods
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 pt-0">
              {EXPLORATION_METHODS.map((method) => {
                const isExpanded = expandedMethod === method.method;
                const isUsed = usedMethods.has(method.method);
                const isActive = activeExploration === method.method;
                
                return (
                  <div 
                    key={method.method}
                    className={cn(
                      "transition-all rounded-lg border",
                      isActive && "ring-2 ring-primary ring-offset-1",
                      isUsed && !isActive && "border-green-500/30 bg-green-50/30 dark:bg-green-900/10"
                    )}
                  >
                    {/* Compact header - always visible */}
                    <button
                      onClick={() => setExpandedMethod(isExpanded ? null : method.method)}
                      className={cn(
                        "w-full flex items-center justify-between p-2 hover:bg-muted/50 rounded-t-lg transition-colors",
                        isExpanded && "bg-muted/30"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "shrink-0 transition-transform",
                          isExpanded && "rotate-90"
                        )}>
                          <ChevronRight className="size-3 text-muted-foreground" />
                        </div>
                        {method.icon}
                        <span className="font-medium text-sm">{method.title}</span>
                        {isUsed && (
                          <div className="size-1.5 rounded-full bg-green-500" title="Method used" />
                        )}
                        {isActive && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                            Active
                          </Badge>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground pr-2">{method.description}</span>
                    </button>
                    
                    {/* Expandable content */}
                    {isExpanded && (
                      <div className="px-3 pb-2 space-y-1 animate-in slide-in-from-top-1 duration-200">
                        <div className="pl-5 space-y-1">
                          {method.prompts.map((prompt, index) => (
                            <Button
                              key={index}
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                handleSendMessage(prompt, method.method);
                                setExpandedMethod(null);
                              }}
                              className="h-auto p-1.5 text-xs text-left whitespace-normal justify-start w-full hover:bg-primary/10"
                              disabled={isGenerating}
                            >
                              <span className="text-muted-foreground mr-2 font-normal">•</span>
                              {prompt}
                            </Button>
                          ))}
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              handleSendMessage(`Let's use ${method.title} methodology to explore my story elements.`, method.method);
                              setExpandedMethod(null);
                            }}
                            className="w-full text-xs h-7 mt-1"
                            disabled={isGenerating}
                          >
                            <Sparkles className="size-3 mr-1" />
                            Quick Start {method.title}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              
              {/* Subtle tip at bottom */}
              <p className="text-[10px] text-muted-foreground pt-2 pl-2">
                <RefreshCw className="size-3 inline mr-1" />
                All methods reusable • Combine approaches freely
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Chat Interface */}
        <div className="lg:col-span-2">
          <Card className="border-2 border-indigo-200 dark:border-indigo-800">
            <CardContent className="p-0 relative">
              {/* Messages */}
              <div 
                ref={messagesContainerRef}
                className="h-[600px] overflow-y-auto p-6 space-y-4"
              >
                {!hasStartedBrainstorming && (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center size-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full mb-4">
                      <MessageSquare className="size-8 text-indigo-600" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Let's Explore Your Story</h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                      Import your materials and choose an exploration method, or start with a free-form conversation about your story ideas.
                    </p>
                  </div>
                )}

                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-3 max-w-[85%]",
                      message.role === 'user' ? "ml-auto" : "mr-auto"
                    )}
                  >
                    <div className={cn(
                      "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                      message.role === 'user' 
                        ? "bg-indigo-600 order-2" 
                        : "bg-orange-600"
                    )}>
                      {message.role === 'user' ? (
                        <span className="text-white text-sm font-semibold">You</span>
                      ) : (
                        <Brain className="size-4 text-white" />
                      )}
                    </div>
                    <div className={cn(
                      "flex-1 px-4 py-3 rounded-2xl text-sm",
                      message.role === 'user'
                        ? "bg-indigo-600 text-white order-1"
                        : "bg-muted"
                    )}>
                      {message.explorationMethod && (
                        <Badge 
                          variant="secondary" 
                          className="mb-2 text-xs"
                        >
                          {EXPLORATION_METHODS.find(m => m.method === message.explorationMethod)?.title}
                        </Badge>
                      )}
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      <div className={cn(
                        "text-xs mt-2 opacity-70",
                        message.role === 'user' ? "text-indigo-100" : "text-muted-foreground"
                      )}>
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}

                {isGenerating && (
                  <div className="flex gap-3 max-w-[85%] mr-auto">
                    <div className="shrink-0 size-8 rounded-full bg-orange-600 flex items-center justify-center">
                      <Brain className="size-4 text-white" />
                    </div>
                    <div className="flex-1 px-4 py-3 rounded-2xl bg-muted">
                      <div className="flex items-center gap-2">
                        <RefreshCw className="size-4 animate-spin" />
                        <span className="text-sm">Claude is exploring...</span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* DISABLED: Scroll to Bottom Button - Nuclear Option */}
              {/* {showScrollToBottom && (
                <div className="absolute bottom-[100px] left-1/2 transform -translate-x-1/2 z-10">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={scrollToBottom}
                    className="shadow-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <ArrowDown className="size-4 mr-2" />
                    New messages
                  </Button>
                </div>
              )} */}

              {/* Input Area */}
              <div className="border-t p-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask about story potential, explore characters, discuss themes, or try an exploration method..."
                      className="resize-none"
                      rows={3}
                      disabled={isGenerating}
                    />
                  </div>
                  
                  <Button
                    onClick={() => handleSendMessage()}
                    disabled={!input.trim() || isGenerating}
                    size="lg"
                    className="px-6"
                  >
                    {isGenerating ? (
                      <RefreshCw className="size-4 animate-spin" />
                    ) : (
                      <Send className="size-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Proceed Button - Compressed */}
      {messages.length > 0 && (
        <Card className="border-2 border-orange-200 dark:border-orange-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-medium text-sm">Ready to Create Your One Line?</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Use your brainstorming insights to craft your story
                </p>
              </div>
              <Button 
                onClick={handleProceedToPhase1}
                className="gap-2 shrink-0"
                size="default"
              >
                Create One Line
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}