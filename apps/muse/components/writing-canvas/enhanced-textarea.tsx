'use client';

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface EnhancedTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  isMinimalMode?: boolean;
  enhancedCursor?: boolean;
}

const EnhancedTextarea = forwardRef<HTMLTextAreaElement, EnhancedTextareaProps>(
  ({ className, isMinimalMode = false, enhancedCursor = true, ...props }, ref) => {
    return (
      <>
        <style jsx global>{`
          /* Enhanced cursor styles */
          .enhanced-cursor {
            caret-color: rgb(147, 51, 234); /* Purple cursor */
          }

          .enhanced-cursor:focus {
            caret-color: rgb(168, 85, 247); /* Lighter purple when focused */
          }

          /* Custom cursor animation for better visibility */
          @keyframes blink {
            0%, 50% { opacity: 1; }
            51%, 100% { opacity: 0; }
          }

          .enhanced-cursor::selection {
            background-color: rgba(147, 51, 234, 0.2);
            color: inherit;
          }

          /* Dark theme cursor colors */
          .dark .enhanced-cursor {
            caret-color: rgb(196, 181, 253); /* Light purple for dark mode */
          }

          .dark .enhanced-cursor:focus {
            caret-color: rgb(221, 214, 254); /* Lighter purple when focused in dark mode */
          }

          .dark .enhanced-cursor::selection {
            background-color: rgba(196, 181, 253, 0.3);
            color: inherit;
          }

          /* Smooth cursor transitions */
          .enhanced-cursor {
            transition: caret-color 0.2s ease;
          }

          /* Better text selection visibility */
          .enhanced-cursor::-moz-selection {
            background-color: rgba(147, 51, 234, 0.2);
            color: inherit;
          }

          .dark .enhanced-cursor::-moz-selection {
            background-color: rgba(196, 181, 253, 0.3);
            color: inherit;
          }

          /* Custom scrollbar for better visual cohesion */
          .enhanced-textarea::-webkit-scrollbar {
            width: 8px;
          }

          .enhanced-textarea::-webkit-scrollbar-track {
            background: transparent;
          }

          .enhanced-textarea::-webkit-scrollbar-thumb {
            background-color: rgba(0, 0, 0, 0.1);
            border-radius: 4px;
            transition: background-color 0.2s ease;
          }

          .enhanced-textarea::-webkit-scrollbar-thumb:hover {
            background-color: rgba(0, 0, 0, 0.2);
          }

          .dark .enhanced-textarea::-webkit-scrollbar-thumb {
            background-color: rgba(255, 255, 255, 0.1);
          }

          .dark .enhanced-textarea::-webkit-scrollbar-thumb:hover {
            background-color: rgba(255, 255, 255, 0.2);
          }

          /* Focus ring enhancement */
          .enhanced-textarea:focus {
            outline: 2px solid rgba(147, 51, 234, 0.1);
            outline-offset: -1px;
            transition: outline 0.2s ease;
          }

          .dark .enhanced-textarea:focus {
            outline: 2px solid rgba(196, 181, 253, 0.2);
          }

          /* Line height and spacing for better readability */
          .enhanced-textarea {
            line-height: 1.75;
            letter-spacing: 0.01em;
          }

          /* Floating placeholder/instruction styles */
          .enhanced-textarea.is-placeholder-empty::before {
            content: attr(data-placeholder);
            position: absolute;
            left: 0;
            top: 0;
            color: hsl(var(--muted-foreground));
            font-family: inherit;
            font-size: inherit;
            line-height: inherit;
            pointer-events: none;
            user-select: none;
            transition: opacity 0.3s ease;
            opacity: 0.7;
          }

          .enhanced-textarea.is-placeholder-empty:focus::before {
            opacity: 0.4;
          }

          /* Hide the default placeholder since we're using the floating one */
          .enhanced-textarea.is-placeholder-empty::placeholder {
            opacity: 0;
          }
        `}</style>
        
        <textarea
          ref={ref}
          className={cn(
            // Base styles
            "w-full bg-transparent border-none outline-none resize-none",
            "placeholder:text-muted-foreground/70",
            "selection:bg-purple-100 dark:selection:bg-purple-900/30",
            
            // Enhanced cursor and experience
            enhancedCursor && "enhanced-cursor enhanced-textarea writing-canvas-enhanced",
            
            // Typography
            isMinimalMode 
              ? "text-lg md:text-xl leading-relaxed md:leading-loose font-serif writing-flow-minimal" 
              : "text-base leading-relaxed font-serif writing-flow",
            
            // Professional typography
            "writing-typography",
            
            // Enhanced placeholder
            "enhanced-placeholder",
            
            // Focus improvements
            "writing-focus focus:outline-none",
            
            // Spacing and size
            "p-0 min-h-[300px]",
            
            className
          )}
          style={{
            fontFamily: '"Merriweather", "Georgia", "Times New Roman", serif',
            lineHeight: isMinimalMode ? '1.8' : '1.7',
            // Ensure the cursor is always visible with sufficient contrast
            caretColor: 'var(--cursor-color, rgb(147, 51, 234))',
            ...props.style
          }}
          {...props}
        />
      </>
    );
  }
);

EnhancedTextarea.displayName = 'EnhancedTextarea';

export { EnhancedTextarea };