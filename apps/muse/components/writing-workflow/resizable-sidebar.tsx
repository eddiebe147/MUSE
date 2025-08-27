'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { useResizableSidebar } from '@/hooks/use-resizable-sidebar';
import { GripVertical } from 'lucide-react';

interface ResizableSidebarProps {
  children: React.ReactNode;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  className?: string;
}

export function ResizableSidebar({
  children,
  defaultWidth = 320,
  minWidth = 280,
  maxWidth = 600,
  className
}: ResizableSidebarProps) {
  const { width, isResizing, handleMouseDown, resetWidth } = useResizableSidebar({
    defaultWidth,
    minWidth,
    maxWidth
  });

  return (
    <div 
      className={cn("relative shrink-0 bg-background", className)}
      style={{ width: `${width}px` }}
    >
      {/* Sidebar Content */}
      <div className="size-full overflow-hidden">
        {children}
      </div>

      {/* Resize Handle */}
      <div
        className={cn(
          "absolute right-0 top-0 bottom-0 w-1 group cursor-col-resize",
          "hover:bg-border transition-colors",
          isResizing && "bg-blue-500"
        )}
        onMouseDown={handleMouseDown}
      >
        {/* Visual resize indicator */}
        <div className={cn(
          "absolute right-0 top-1/2 -translate-y-1/2 -translate-x-1/2",
          "w-4 h-8 bg-background border border-border rounded",
          "flex items-center justify-center opacity-0 group-hover:opacity-100",
          "transition-opacity shadow-sm",
          isResizing && "opacity-100 bg-blue-50 border-blue-300"
        )}>
          <GripVertical className={cn(
            "w-3 h-3 text-muted-foreground",
            isResizing && "text-blue-600"
          )} />
        </div>
      </div>

      {/* Resize overlay during drag */}
      {isResizing && (
        <div className="fixed inset-0 z-50 cursor-col-resize" />
      )}
    </div>
  );
}