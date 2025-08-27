import { useState, useCallback, useRef, useEffect } from 'react';
import { FormatType } from '@/components/writing-canvas/formatting-toolbar';

interface UseRichTextEditorOptions {
  initialContent?: string;
  onContentChange?: (content: string) => void;
}

interface UseRichTextEditorReturn {
  content: string;
  activeFormats: Set<FormatType>;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  handleFormat: (format: FormatType) => void;
  handleContentChange: (newContent: string) => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
}

export function useRichTextEditor({
  initialContent = '',
  onContentChange
}: UseRichTextEditorOptions): UseRichTextEditorReturn {
  
  const [content, setContent] = useState(initialContent);
  const [activeFormats, setActiveFormats] = useState<Set<FormatType>>(new Set());
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Update active formats based on cursor position
  const updateActiveFormats = useCallback(() => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const { selectionStart, selectionEnd } = textarea;
    const selectedText = content.substring(selectionStart, selectionEnd);
    const currentLine = content.substring(
      content.lastIndexOf('\n', selectionStart - 1) + 1,
      content.indexOf('\n', selectionEnd) === -1 
        ? content.length 
        : content.indexOf('\n', selectionEnd)
    );

    const newActiveFormats = new Set<FormatType>();

    // Check for inline formatting around cursor
    if (selectionStart > 0 && selectionEnd < content.length) {
      const beforeCursor = content.substring(Math.max(0, selectionStart - 10), selectionStart);
      const afterCursor = content.substring(selectionEnd, Math.min(content.length, selectionEnd + 10));
      
      // Check for bold (**text** or __text__)
      if ((beforeCursor.includes('**') || beforeCursor.includes('__')) && 
          (afterCursor.includes('**') || afterCursor.includes('__'))) {
        newActiveFormats.add('bold');
      }
      
      // Check for italic (*text* or _text_)
      if ((beforeCursor.includes('*') && !beforeCursor.includes('**')) ||
          (beforeCursor.includes('_') && !beforeCursor.includes('__'))) {
        if ((afterCursor.includes('*') && !afterCursor.includes('**')) ||
            (afterCursor.includes('_') && !afterCursor.includes('__'))) {
          newActiveFormats.add('italic');
        }
      }

      // Check for strikethrough (~~text~~)
      if (beforeCursor.includes('~~') && afterCursor.includes('~~')) {
        newActiveFormats.add('strikethrough');
      }
    }

    // Check for line-based formatting
    if (currentLine.startsWith('- ') || currentLine.startsWith('* ')) {
      newActiveFormats.add('bulletList');
    }
    
    if (/^\d+\.\s/.test(currentLine)) {
      newActiveFormats.add('numberedList');
    }
    
    if (currentLine.startsWith('> ')) {
      newActiveFormats.add('blockquote');
    }

    setActiveFormats(newActiveFormats);
  }, [content]);

  // Handle text formatting
  const handleFormat = useCallback((format: FormatType) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const { selectionStart, selectionEnd } = textarea;
    const selectedText = content.substring(selectionStart, selectionEnd);
    const hasSelection = selectionStart !== selectionEnd;

    let newContent = content;
    let newCursorPos = selectionStart;

    switch (format) {
      case 'bold': {
        if (hasSelection) {
          const formattedText = `**${selectedText}**`;
          newContent = content.substring(0, selectionStart) + formattedText + content.substring(selectionEnd);
          newCursorPos = selectionStart + formattedText.length;
        } else {
          const insertion = '**bold text**';
          newContent = content.substring(0, selectionStart) + insertion + content.substring(selectionStart);
          newCursorPos = selectionStart + 2; // Position cursor between asterisks
        }
        break;
      }
      
      case 'italic': {
        if (hasSelection) {
          const formattedText = `*${selectedText}*`;
          newContent = content.substring(0, selectionStart) + formattedText + content.substring(selectionEnd);
          newCursorPos = selectionStart + formattedText.length;
        } else {
          const insertion = '*italic text*';
          newContent = content.substring(0, selectionStart) + insertion + content.substring(selectionStart);
          newCursorPos = selectionStart + 1; // Position cursor between asterisks
        }
        break;
      }

      case 'underline': {
        // Using HTML-style underline since markdown doesn't have native underline
        if (hasSelection) {
          const formattedText = `<u>${selectedText}</u>`;
          newContent = content.substring(0, selectionStart) + formattedText + content.substring(selectionEnd);
          newCursorPos = selectionStart + formattedText.length;
        } else {
          const insertion = '<u>underlined text</u>';
          newContent = content.substring(0, selectionStart) + insertion + content.substring(selectionStart);
          newCursorPos = selectionStart + 3; // Position cursor after opening tag
        }
        break;
      }
      
      case 'strikethrough': {
        if (hasSelection) {
          const formattedText = `~~${selectedText}~~`;
          newContent = content.substring(0, selectionStart) + formattedText + content.substring(selectionEnd);
          newCursorPos = selectionStart + formattedText.length;
        } else {
          const insertion = '~~strikethrough text~~';
          newContent = content.substring(0, selectionStart) + insertion + content.substring(selectionStart);
          newCursorPos = selectionStart + 2; // Position cursor between tildes
        }
        break;
      }

      case 'bulletList': {
        const lineStart = content.lastIndexOf('\n', selectionStart - 1) + 1;
        const lineEnd = content.indexOf('\n', selectionStart);
        const currentLine = content.substring(lineStart, lineEnd === -1 ? content.length : lineEnd);
        
        if (currentLine.startsWith('- ') || currentLine.startsWith('* ')) {
          // Remove bullet point
          newContent = content.substring(0, lineStart) + 
                      currentLine.substring(2) + 
                      content.substring(lineEnd === -1 ? content.length : lineEnd);
          newCursorPos = selectionStart - 2;
        } else {
          // Add bullet point
          const bulletPoint = lineStart === 0 || content.charAt(lineStart - 1) === '\n' ? '- ' : '\n- ';
          newContent = content.substring(0, lineStart) + bulletPoint + currentLine + 
                      (lineEnd === -1 ? '' : content.substring(lineEnd));
          newCursorPos = selectionStart + bulletPoint.length;
        }
        break;
      }

      case 'numberedList': {
        const lineStart = content.lastIndexOf('\n', selectionStart - 1) + 1;
        const lineEnd = content.indexOf('\n', selectionStart);
        const currentLine = content.substring(lineStart, lineEnd === -1 ? content.length : lineEnd);
        
        if (/^\d+\.\s/.test(currentLine)) {
          // Remove numbered list
          newContent = content.substring(0, lineStart) + 
                      currentLine.replace(/^\d+\.\s/, '') + 
                      content.substring(lineEnd === -1 ? content.length : lineEnd);
          newCursorPos = selectionStart - currentLine.match(/^\d+\.\s/)![0].length;
        } else {
          // Add numbered list
          const numberPoint = lineStart === 0 || content.charAt(lineStart - 1) === '\n' ? '1. ' : '\n1. ';
          newContent = content.substring(0, lineStart) + numberPoint + currentLine + 
                      (lineEnd === -1 ? '' : content.substring(lineEnd));
          newCursorPos = selectionStart + numberPoint.length;
        }
        break;
      }

      case 'blockquote': {
        const lineStart = content.lastIndexOf('\n', selectionStart - 1) + 1;
        const lineEnd = content.indexOf('\n', selectionStart);
        const currentLine = content.substring(lineStart, lineEnd === -1 ? content.length : lineEnd);
        
        if (currentLine.startsWith('> ')) {
          // Remove blockquote
          newContent = content.substring(0, lineStart) + 
                      currentLine.substring(2) + 
                      content.substring(lineEnd === -1 ? content.length : lineEnd);
          newCursorPos = selectionStart - 2;
        } else {
          // Add blockquote
          const quote = lineStart === 0 || content.charAt(lineStart - 1) === '\n' ? '> ' : '\n> ';
          newContent = content.substring(0, lineStart) + quote + currentLine + 
                      (lineEnd === -1 ? '' : content.substring(lineEnd));
          newCursorPos = selectionStart + quote.length;
        }
        break;
      }
    }

    setContent(newContent);
    onContentChange?.(newContent);

    // Restore cursor position
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.selectionStart = newCursorPos;
        textareaRef.current.selectionEnd = newCursorPos;
        textareaRef.current.focus();
      }
    }, 0);
  }, [content, onContentChange]);

  // Handle keyboard shortcuts and AI suggestions
  const handleKeyDown = useCallback(async (e: React.KeyboardEvent) => {
    const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const cmdKey = isMac ? e.metaKey : e.ctrlKey;

    // Handle Tab key for AI text generation
    if (e.key === 'Tab' && !cmdKey && !e.shiftKey && !e.altKey) {
      e.preventDefault();
      
      if (!textareaRef.current) return;
      
      const textarea = textareaRef.current;
      const { selectionStart } = textarea;
      
      // Get context before and after cursor
      const contextBefore = content.substring(0, selectionStart);
      const contextAfter = content.substring(selectionStart);
      
      // Only generate suggestions if there's some content and cursor is at end of word
      if (contextBefore.length > 10 && !content.charAt(selectionStart)?.match(/\w/)) {
        try {
          const response = await fetch('/api/inline-suggestion', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contextBefore,
              contextAfter,
              fullContent: content,
              aiOptions: {
                suggestionLength: 'medium',
                applyStyle: true
              }
            })
          });
          if (response.ok && response.body) {
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let suggestion = '';

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunk = decoder.decode(value, { stream: true });
              const lines = chunk.split('\n\n');

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  try {
                    const data = JSON.parse(line.slice(5));
                    if (data.type === 'suggestion-delta') {
                      suggestion += data.content;
                    } else if (data.type === 'finish') {
                      // Insert the suggestion at cursor position
                      const newContent = content.substring(0, selectionStart) + 
                                       suggestion + 
                                       content.substring(selectionStart);
                      setContent(newContent);
                      onContentChange?.(newContent);
                      
                      // Update cursor position to end of inserted text
                      setTimeout(() => {
                        if (textareaRef.current) {
                          const newPos = selectionStart + suggestion.length;
                          textareaRef.current.selectionStart = newPos;
                          textareaRef.current.selectionEnd = newPos;
                          textareaRef.current.focus();
                        }
                      }, 0);
                      return;
                    }
                  } catch (err) {
                    console.warn('Error parsing AI suggestion:', err);
                  }
                }
              }
            }
          }
        } catch (error) {
          console.warn('AI suggestion failed:', error);
        }
      }
      return;
    }

    if (cmdKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          handleFormat('bold');
          break;
        case 'i':
          e.preventDefault();
          handleFormat('italic');
          break;
        case 'u':
          e.preventDefault();
          handleFormat('underline');
          break;
        case 'x':
          if (e.shiftKey) {
            e.preventDefault();
            handleFormat('strikethrough');
          }
          break;
        case '8':
          if (e.shiftKey) {
            e.preventDefault();
            handleFormat('bulletList');
          }
          break;
        case '7':
          if (e.shiftKey) {
            e.preventDefault();
            handleFormat('numberedList');
          }
          break;
        case '9':
          if (e.shiftKey) {
            e.preventDefault();
            handleFormat('blockquote');
          }
          break;
      }
    }
  }, [handleFormat, content, onContentChange]);

  // Handle content changes
  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
    onContentChange?.(newContent);
  }, [onContentChange]);

  // Update active formats when cursor moves
  useEffect(() => {
    const handleSelectionChange = () => {
      updateActiveFormats();
    };

    const textarea = textareaRef.current;
    if (textarea) {
      textarea.addEventListener('selectionchange', handleSelectionChange);
      textarea.addEventListener('keyup', handleSelectionChange);
      textarea.addEventListener('mouseup', handleSelectionChange);
      
      return () => {
        textarea.removeEventListener('selectionchange', handleSelectionChange);
        textarea.removeEventListener('keyup', handleSelectionChange);
        textarea.removeEventListener('mouseup', handleSelectionChange);
      };
    }
  }, [updateActiveFormats]);

  return {
    content,
    activeFormats,
    textareaRef,
    handleFormat,
    handleContentChange,
    handleKeyDown
  };
}