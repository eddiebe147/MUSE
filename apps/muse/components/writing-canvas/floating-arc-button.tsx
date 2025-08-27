'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Wand2, Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FloatingArcButtonProps {
  onOpenArcGenerator: () => void;
  wordCount: number;
  minWordCount?: number;
  className?: string;
}

export function FloatingArcButton({
  onOpenArcGenerator,
  wordCount,
  minWordCount = 200,
  className
}: FloatingArcButtonProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Show the floating button when:
  // 1. User has written enough content
  // 2. User hasn't dismissed it
  // 3. User has scrolled down (engaged with content)
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const shouldShow = 
        wordCount >= minWordCount && 
        !isDismissed && 
        scrollY > 100; // Show after scrolling 100px
      
      setIsVisible(shouldShow);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial state

    return () => window.removeEventListener('scroll', handleScroll);
  }, [wordCount, minWordCount, isDismissed]);

  // Auto-dismiss after showing for a while to avoid being intrusive
  useEffect(() => {
    if (isVisible && !isDismissed) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 30000); // Hide after 30 seconds

      return () => clearTimeout(timer);
    }
  }, [isVisible, isDismissed]);

  const handleClick = () => {
    onOpenArcGenerator();
    setIsDismissed(true); // Don't show again in this session
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDismissed(true);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "fixed bottom-8 right-8 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300",
        className
      )}
    >
      <div className="relative group">
        {/* Floating Button */}
        <Button
          onClick={handleClick}
          className={cn(
            "h-14 px-6 text-sm font-medium shadow-lg",
            "bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800",
            "text-white border-0",
            "transform transition-all duration-200 hover:scale-105 hover:shadow-xl",
            "animate-pulse hover:animate-none"
          )}
        >
          <Wand2 className="size-5 mr-3" />
          <span className="hidden sm:inline">Analyze Your Story Structure</span>
          <span className="sm:hidden">ARC Generator</span>
          <Sparkles className="size-4 ml-3 animate-pulse" />
        </Button>

        {/* Dismiss Button */}
        <Button
          onClick={handleDismiss}
          variant="ghost"
          size="sm"
          className={cn(
            "absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full",
            "bg-white dark:bg-gray-800 border border-border shadow-sm",
            "hover:bg-gray-50 dark:hover:bg-gray-700",
            "opacity-0 group-hover:opacity-100 transition-opacity"
          )}
        >
          <X className="size-3" />
        </Button>

        {/* Tooltip */}
        <div className={cn(
          "absolute bottom-full mb-2 left-1/2 -translate-x-1/2",
          "px-3 py-1 bg-black dark:bg-gray-900 text-white text-xs rounded",
          "opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none",
          "whitespace-nowrap"
        )}>
          You've written {wordCount} words - ready for story analysis!
        </div>

        {/* Pulsing Ring Effect */}
        <div className="absolute inset-0 rounded-lg animate-ping bg-purple-400 opacity-20 -z-10" />
        <div className="absolute inset-0 rounded-lg animate-pulse bg-purple-300 opacity-10 -z-10" />
      </div>
    </div>
  );
}