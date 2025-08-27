'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, 
  Send, 
  Sparkles, 
  Brain,
  FileText,
  ArrowRight,
  RefreshCw,
  Lightbulb,
  MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface BrainstormInterfaceProps {
  transcriptData?: any;
  knowledgeBase?: any;
  onProceedToPhase1: (brainstormSummary: string) => void;
}

export function BrainstormInterface({ 
  transcriptData, 
  knowledgeBase, 
  onProceedToPhase1 
}: BrainstormInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [hasStartedBrainstorming, setHasStartedBrainstorming] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isGenerating) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsGenerating(true);
    setHasStartedBrainstorming(true);

    try {
      const response = await fetch('/api/brainstorm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input.trim(),
          conversationHistory: messages,
          transcriptData,
          knowledgeBase
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
          timestamp: new Date()
        };

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
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickPrompts = [
    "What story do you see in this transcript?",
    "What are the strongest conflicts or tensions?", 
    "Who are the most compelling characters?",
    "What themes emerge from this material?",
    "What different story angles could we explore?"
  ];

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt);
  };

  const generateBrainstormSummary = () => {
    if (messages.length === 0) return '';
    
    const conversation = messages.map(msg => 
      `${msg.role === 'user' ? 'You' : 'Claude'}: ${msg.content}`
    ).join('\n\n');
    
    return `BRAINSTORM DISCUSSION:\n\n${conversation}`;
  };

  const handleProceedToPhase1 = () => {
    const brainstormSummary = generateBrainstormSummary();
    onProceedToPhase1(brainstormSummary);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card className="border-2 border-indigo-200 dark:border-indigo-800">
        <CardHeader className="bg-indigo-50 dark:bg-indigo-900/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg">
              <Brain className="size-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">Story Brainstorming</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Explore the story potential with Claude before creating your One Line
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Chat Interface */}
      <Card className="border-2 border-indigo-200 dark:border-indigo-800">
        <CardContent className="p-0">
          {/* Messages */}
          <div className="h-[500px] overflow-y-auto p-6 space-y-4">
            {!hasStartedBrainstorming && (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center size-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full mb-4">
                  <MessageSquare className="size-8 text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Let's Explore Your Story</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  I have access to your transcript and knowledge base. Let's discuss what story possibilities you see.
                </p>
                
                {/* Quick Start Prompts */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Quick Start:</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {quickPrompts.slice(0, 3).map((prompt, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickPrompt(prompt)}
                        className="h-auto py-2 px-3 text-xs whitespace-normal max-w-[200px]"
                      >
                        {prompt}
                      </Button>
                    ))}
                  </div>
                </div>
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
                    : "bg-purple-600"
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
                <div className="shrink-0 size-8 rounded-full bg-purple-600 flex items-center justify-center">
                  <Brain className="size-4 text-white" />
                </div>
                <div className="flex-1 px-4 py-3 rounded-2xl bg-muted">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="size-4 animate-spin" />
                    <span className="text-sm">Claude is thinking...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t p-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about the story potential, explore conflicts, discuss characters..."
                  className={`w-full p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    input.length === 0 ? 'is-floating-placeholder-empty' : ''
                  }`}
                  data-placeholder="Ask about the story potential, explore conflicts, discuss characters..."
                  rows={3}
                  disabled={isGenerating}
                />
                
                <style jsx>{`
                  .is-floating-placeholder-empty::before {
                    content: attr(data-placeholder);
                    position: absolute;
                    left: 12px;
                    top: 12px;
                    color: hsl(var(--muted-foreground));
                    pointer-events: none;
                    user-select: none;
                    transition: opacity 0.3s ease;
                    opacity: 0.7;
                  }
                  
                  .is-floating-placeholder-empty:focus::before {
                    opacity: 0.4;
                  }
                  
                  .is-floating-placeholder-empty::placeholder {
                    opacity: 0;
                  }
                `}</style>
              </div>
              
              <Button
                onClick={handleSendMessage}
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

            {/* Quick Prompts */}
            {!hasStartedBrainstorming && (
              <div className="mt-3 flex flex-wrap gap-2">
                {quickPrompts.map((prompt, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    onClick={() => handleQuickPrompt(prompt)}
                    className="h-auto py-1 px-2 text-xs bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300"
                  >
                    <Lightbulb className="size-3 mr-1" />
                    {prompt}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Proceed Button */}
      {messages.length > 0 && (
        <Card className="border-2 border-purple-200 dark:border-purple-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Ready to Create Your One Line?</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Use our brainstorming discussion to craft your story's foundation
                </p>
              </div>
              <Button 
                onClick={handleProceedToPhase1}
                className="gap-2"
                size="lg"
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