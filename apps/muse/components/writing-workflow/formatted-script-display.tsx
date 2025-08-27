'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface FormattedScriptDisplayProps {
  content: string;
  format: 'screenplay' | 'treatment' | 'beat_sheet' | 'outline' | 'novel_chapter';
  isEditable?: boolean;
  onContentChange?: (content: string) => void;
  className?: string;
}

export function FormattedScriptDisplay({
  content,
  format,
  isEditable = false,
  onContentChange,
  className
}: FormattedScriptDisplayProps) {
  const [editableContent, setEditableContent] = useState(content);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setEditableContent(content);
  }, [content]);

  const handleEdit = (e: React.FormEvent<HTMLDivElement>) => {
    const newContent = e.currentTarget.textContent || '';
    setEditableContent(newContent);
    onContentChange?.(newContent);
  };

  // Parse and format content based on format type
  const formatContent = () => {
    const lines = editableContent.split('\n');
    
    switch (format) {
      case 'treatment':
        return formatTreatment(lines);
      case 'screenplay':
        return formatScreenplay(lines);
      case 'beat_sheet':
        return formatBeatSheet(lines);
      case 'novel_chapter':
        return formatNovelChapter(lines);
      default:
        return formatOutline(lines);
    }
  };

  const formatTreatment = (lines: string[]) => {
    return (
      <div className="treatment-format space-y-6 font-serif">
        {lines.map((line, index) => {
          // Title (all caps)
          if (index === 0 && line.trim()) {
            return (
              <h1 key={index} className="text-3xl font-bold text-center uppercase tracking-wide mb-8">
                {line}
              </h1>
            );
          }
          
          // Section headers (lines starting with ACT, SCENE, INT., EXT.)
          if (line.match(/^(ACT|SCENE|INT\.|EXT\.)/)) {
            return (
              <h2 key={index} className="text-xl font-bold mt-8 mb-4 uppercase text-orange-700 dark:text-orange-400">
                {line}
              </h2>
            );
          }
          
          // Subheaders (lines in all caps but not title)
          if (line === line.toUpperCase() && line.trim() && index > 0) {
            return (
              <h3 key={index} className="text-lg font-semibold mt-6 mb-3 uppercase tracking-wide">
                {line}
              </h3>
            );
          }
          
          // Empty lines
          if (!line.trim()) {
            return <div key={index} className="h-4" />;
          }
          
          // Regular paragraphs
          return (
            <p key={index} className="text-base leading-relaxed indent-8 text-justify">
              {line}
            </p>
          );
        })}
      </div>
    );
  };

  const formatScreenplay = (lines: string[]) => {
    return (
      <div className="screenplay-format font-mono text-sm space-y-4 max-w-4xl mx-auto">
        {lines.map((line, index) => {
          // Fade in/out
          if (line.match(/^(FADE IN:|FADE OUT\.)/)) {
            return (
              <div key={index} className="text-left uppercase">
                {line}
              </div>
            );
          }
          
          // Scene headings
          if (line.match(/^(INT\.|EXT\.)/)) {
            return (
              <div key={index} className="font-bold uppercase mt-6 mb-2">
                {line}
              </div>
            );
          }
          
          // Character names (all caps, often followed by dialogue)
          if (line === line.toUpperCase() && line.trim() && !line.includes('.')) {
            return (
              <div key={index} className="text-center uppercase mt-4 mb-1">
                {line}
              </div>
            );
          }
          
          // Parentheticals
          if (line.match(/^\(.+\)$/)) {
            return (
              <div key={index} className="text-center mx-32 text-sm">
                {line}
              </div>
            );
          }
          
          // Dialogue (indented)
          if (index > 0 && lines[index - 1] === lines[index - 1].toUpperCase() && lines[index - 1].trim()) {
            return (
              <div key={index} className="mx-24 mb-4">
                {line}
              </div>
            );
          }
          
          // Action lines
          return (
            <div key={index} className="text-left">
              {line}
            </div>
          );
        })}
      </div>
    );
  };

  const formatBeatSheet = (lines: string[]) => {
    return (
      <div className="beat-sheet-format space-y-4">
        {lines.map((line, index) => {
          // Beat numbers
          if (line.match(/^(BEAT|Scene|#)\s*\d+/i)) {
            return (
              <div key={index} className="flex items-start gap-4 mt-6">
                <div className="bg-orange-100 dark:bg-orange-900/30 px-3 py-1 rounded-lg font-bold text-orange-700 dark:text-orange-400">
                  {line.split(':')[0]}
                </div>
                <div className="flex-1 font-semibold">
                  {line.split(':').slice(1).join(':')}
                </div>
              </div>
            );
          }
          
          // Bullet points
          if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
            return (
              <div key={index} className="ml-12 flex items-start gap-2">
                <span className="text-orange-600 dark:text-orange-400">•</span>
                <span className="flex-1">{line.replace(/^[•\-]\s*/, '')}</span>
              </div>
            );
          }
          
          // Section headers
          if (line === line.toUpperCase() && line.trim()) {
            return (
              <h3 key={index} className="text-lg font-bold mt-6 mb-3 text-orange-700 dark:text-orange-400">
                {line}
              </h3>
            );
          }
          
          // Regular text
          return (
            <div key={index} className="ml-4">
              {line}
            </div>
          );
        })}
      </div>
    );
  };

  const formatNovelChapter = (lines: string[]) => {
    return (
      <div className="novel-format font-serif space-y-4 max-w-3xl mx-auto">
        {lines.map((line, index) => {
          // Chapter title
          if (index === 0 || line.match(/^(Chapter|CHAPTER)/)) {
            return (
              <h1 key={index} className="text-2xl font-bold text-center mb-8">
                {line}
              </h1>
            );
          }
          
          // Scene breaks (*** or ---)
          if (line.match(/^(\*\*\*|---)$/)) {
            return (
              <div key={index} className="text-center my-8 text-2xl text-gray-400">
                * * *
              </div>
            );
          }
          
          // Empty lines
          if (!line.trim()) {
            return <div key={index} className="h-4" />;
          }
          
          // Dialogue (starts with quotation mark)
          if (line.trim().startsWith('"')) {
            return (
              <p key={index} className="text-base leading-loose">
                {line}
              </p>
            );
          }
          
          // Regular paragraphs with first-line indent
          return (
            <p key={index} className="text-base leading-loose indent-8">
              {line}
            </p>
          );
        })}
      </div>
    );
  };

  const formatOutline = (lines: string[]) => {
    return (
      <div className="outline-format space-y-3">
        {lines.map((line, index) => {
          // Main sections (I., II., III., etc.)
          if (line.match(/^[IVX]+\./)) {
            return (
              <h2 key={index} className="text-xl font-bold mt-6 mb-3 text-orange-700 dark:text-orange-400">
                {line}
              </h2>
            );
          }
          
          // Subsections (A., B., C., etc.)
          if (line.match(/^[A-Z]\./)) {
            return (
              <h3 key={index} className="text-lg font-semibold ml-6 mt-4 mb-2">
                {line}
              </h3>
            );
          }
          
          // Numbered items (1., 2., 3., etc.)
          if (line.match(/^\d+\./)) {
            return (
              <div key={index} className="ml-12 mb-2">
                {line}
              </div>
            );
          }
          
          // Bullet points
          if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
            return (
              <div key={index} className="ml-16 flex items-start gap-2">
                <span className="text-gray-500">•</span>
                <span className="flex-1">{line.replace(/^[•\-]\s*/, '')}</span>
              </div>
            );
          }
          
          return (
            <div key={index} className="ml-4">
              {line}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={cn("formatted-script-container", className)}>
      <style jsx global>{`
        /* Treatment Format Styles */
        .treatment-format {
          font-family: 'Times New Roman', 'Georgia', serif;
          line-height: 2;
        }
        
        /* Screenplay Format Styles */
        .screenplay-format {
          font-family: 'Courier New', 'Courier', monospace;
          font-size: 12pt;
          line-height: 1;
        }
        
        /* Beat Sheet Styles */
        .beat-sheet-format {
          font-family: system-ui, -apple-system, sans-serif;
        }
        
        /* Novel Format Styles */
        .novel-format {
          font-family: 'Georgia', 'Cambria', serif;
          font-size: 14pt;
        }
        
        /* Print-ready styles */
        @media print {
          .formatted-script-container {
            font-size: 12pt;
            line-height: 1.5;
            color: black;
            background: white;
          }
        }
      `}</style>
      
      {isEditable && isEditing ? (
        <div
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => {
            handleEdit(e);
            setIsEditing(false);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setIsEditing(false);
            }
          }}
          className="p-8 bg-white dark:bg-gray-900 rounded-lg min-h-[600px] focus:outline-none whitespace-pre-wrap"
          style={{ fontFamily: 'inherit' }}
        >
          {editableContent}
        </div>
      ) : (
        <div 
          onDoubleClick={() => isEditable && setIsEditing(true)}
          className={cn(
            "p-8 bg-white dark:bg-gray-900 rounded-lg min-h-[600px] select-text",
            isEditable && "cursor-text hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          )}
        >
          {formatContent()}
        </div>
      )}
    </div>
  );
}