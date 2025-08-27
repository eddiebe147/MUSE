'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Separator
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormattingToolbarProps {
  onFormat: (format: FormatType, value?: string) => void;
  activeFormats: Set<FormatType>;
  className?: string;
  position?: 'top' | 'bottom';
}

export type FormatType = 
  | 'bold' 
  | 'italic' 
  | 'underline' 
  | 'strikethrough'
  | 'bulletList'
  | 'numberedList'
  | 'blockquote';

const formatButtons = [
  {
    type: 'bold' as FormatType,
    icon: Bold,
    label: 'Bold',
    shortcut: 'Cmd+B',
  },
  {
    type: 'italic' as FormatType,
    icon: Italic,
    label: 'Italic',
    shortcut: 'Cmd+I',
  },
  {
    type: 'underline' as FormatType,
    icon: Underline,
    label: 'Underline',
    shortcut: 'Cmd+U',
  },
  {
    type: 'strikethrough' as FormatType,
    icon: Strikethrough,
    label: 'Strikethrough',
    shortcut: 'Cmd+Shift+X',
  },
] as const;

const listButtons = [
  {
    type: 'bulletList' as FormatType,
    icon: List,
    label: 'Bullet List',
    shortcut: 'Cmd+Shift+8',
  },
  {
    type: 'numberedList' as FormatType,
    icon: ListOrdered,
    label: 'Numbered List',
    shortcut: 'Cmd+Shift+7',
  },
] as const;

const blockButtons = [
  {
    type: 'blockquote' as FormatType,
    icon: Quote,
    label: 'Quote',
    shortcut: 'Cmd+Shift+9',
  },
] as const;

export function FormattingToolbar({
  onFormat,
  activeFormats,
  className,
  position = 'top'
}: FormattingToolbarProps) {
  const handleFormat = (formatType: FormatType) => {
    onFormat(formatType);
  };

  return (
    <div className={cn(
      'flex items-center gap-1 p-2 bg-background/95 backdrop-blur-sm',
      'border border-border/40 rounded-lg shadow-sm',
      'transition-all duration-200 formatting-toolbar-enter',
      position === 'bottom' && 'border-t-0 rounded-t-none',
      position === 'top' && 'border-b-0 rounded-b-none',
      className
    )}>
      {/* Text Formatting */}
      <div className="flex items-center gap-1">
        {formatButtons.map(({ type, icon: Icon, label, shortcut }) => (
          <Button
            key={type}
            variant="ghost"
            size="sm"
            onClick={() => handleFormat(type)}
            className={cn(
              'h-8 w-8 p-0 hover:bg-accent/50 transition-colors format-button',
              'tooltip-trigger relative group',
              activeFormats.has(type) && 'format-button-active bg-accent text-accent-foreground'
            )}
            title={`${label} (${shortcut})`}
          >
            <Icon className="size-4" />
            
            {/* Tooltip */}
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              {label} ({shortcut.replace('Cmd', '⌘')})
            </div>
          </Button>
        ))}
      </div>

      {/* Separator */}
      <div className="w-px h-6 bg-border/60" />

      {/* Lists */}
      <div className="flex items-center gap-1">
        {listButtons.map(({ type, icon: Icon, label, shortcut }) => (
          <Button
            key={type}
            variant="ghost"
            size="sm"
            onClick={() => handleFormat(type)}
            className={cn(
              'h-8 w-8 p-0 hover:bg-accent/50 transition-colors format-button',
              'tooltip-trigger relative group',
              activeFormats.has(type) && 'format-button-active bg-accent text-accent-foreground'
            )}
            title={`${label} (${shortcut})`}
          >
            <Icon className="size-4" />
            
            {/* Tooltip */}
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              {label} ({shortcut.replace('Cmd', '⌘')})
            </div>
          </Button>
        ))}
      </div>

      {/* Separator */}
      <div className="w-px h-6 bg-border/60" />

      {/* Block Formatting */}
      <div className="flex items-center gap-1">
        {blockButtons.map(({ type, icon: Icon, label, shortcut }) => (
          <Button
            key={type}
            variant="ghost"
            size="sm"
            onClick={() => handleFormat(type)}
            className={cn(
              'h-8 w-8 p-0 hover:bg-accent/50 transition-colors format-button',
              'tooltip-trigger relative group',
              activeFormats.has(type) && 'format-button-active bg-accent text-accent-foreground'
            )}
            title={`${label} (${shortcut})`}
          >
            <Icon className="size-4" />
            
            {/* Tooltip */}
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              {label} ({shortcut.replace('Cmd', '⌘')})
            </div>
          </Button>
        ))}
      </div>

      {/* Format indicator for screen readers */}
      <span className="sr-only">
        Active formats: {Array.from(activeFormats).join(', ')}
      </span>
    </div>
  );
}