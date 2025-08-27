import { useState, useEffect, useCallback, useRef } from 'react';

interface UseResizableSidebarOptions {
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  storageKey?: string;
}

interface UseResizableSidebarReturn {
  width: number;
  isResizing: boolean;
  handleMouseDown: (e: React.MouseEvent) => void;
  resetWidth: () => void;
}

export function useResizableSidebar({
  defaultWidth = 320,
  minWidth = 280,
  maxWidth = 600,
  storageKey = 'muse-sidebar-width'
}: UseResizableSidebarOptions = {}): UseResizableSidebarReturn {
  // Always initialize with defaultWidth to avoid hydration mismatch
  const [width, setWidth] = useState(defaultWidth);
  const [isResizing, setIsResizing] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);

  // Hydrate from localStorage after component mounts
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedWidth = localStorage.getItem(storageKey);
      if (savedWidth) {
        const parsedWidth = parseInt(savedWidth, 10);
        const constrainedWidth = Math.max(minWidth, Math.min(maxWidth, parsedWidth));
        setWidth(constrainedWidth);
      }
      setIsHydrated(true);
    }
  }, [storageKey, minWidth, maxWidth]);

  // Save width to localStorage whenever it changes (only after hydration)
  useEffect(() => {
    if (isHydrated && typeof window !== 'undefined') {
      localStorage.setItem(storageKey, width.toString());
    }
  }, [width, storageKey, isHydrated]);

  // Handle mouse move during resize
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;

    const deltaX = e.clientX - startXRef.current;
    const newWidth = startWidthRef.current + deltaX;
    
    // Constrain within min/max bounds
    const constrainedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
    setWidth(constrainedWidth);
  }, [isResizing, minWidth, maxWidth]);

  // Handle mouse up to end resize
  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  // Set up global mouse listeners
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  // Handle mouse down to start resize
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = width;
  }, [width]);

  // Reset to default width
  const resetWidth = useCallback(() => {
    setWidth(defaultWidth);
  }, [defaultWidth]);

  return {
    width,
    isResizing,
    handleMouseDown,
    resetWidth
  };
}