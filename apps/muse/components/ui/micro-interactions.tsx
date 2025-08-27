'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

// Smooth Fade In Animation
export interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  className?: string;
}

export function FadeIn({ 
  children, 
  delay = 0, 
  duration = 300, 
  direction = 'up', 
  className 
}: FadeInProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  const directions = {
    up: 'translate-y-4',
    down: '-translate-y-4',
    left: 'translate-x-4',
    right: '-translate-x-4',
    none: ''
  };

  return (
    <div
      className={cn(
        "transition-all ease-out",
        isVisible ? "opacity-100 translate-y-0 translate-x-0" : `opacity-0 ${directions[direction]}`,
        className
      )}
      style={{ transitionDuration: `${duration}ms` }}
    >
      {children}
    </div>
  );
}

// Stagger Animation for Lists
export interface StaggerProps {
  children: React.ReactNode[];
  delay?: number;
  stagger?: number;
  className?: string;
}

export function Stagger({ children, delay = 0, stagger = 100, className }: StaggerProps) {
  return (
    <div className={className}>
      {React.Children.map(children, (child, index) => (
        <FadeIn key={index} delay={delay + (index * stagger)}>
          {child}
        </FadeIn>
      ))}
    </div>
  );
}

// Hover Scale Effect
export interface HoverScaleProps {
  children: React.ReactNode;
  scale?: number;
  duration?: number;
  className?: string;
}

export function HoverScale({ 
  children, 
  scale = 1.02, 
  duration = 200, 
  className 
}: HoverScaleProps) {
  return (
    <div
      className={cn(
        "transition-transform ease-out cursor-pointer",
        "hover:scale-105 active:scale-95",
        className
      )}
      style={{ transitionDuration: `${duration}ms` }}
    >
      {children}
    </div>
  );
}

// Pulse Animation
export interface PulseProps {
  children: React.ReactNode;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Pulse({ children, color = 'bg-indigo-600', size = 'md', className }: PulseProps) {
  const sizes = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  return (
    <div className={cn("relative inline-flex items-center", className)}>
      <div className={cn("absolute animate-ping rounded-full opacity-75", sizes[size], color)} />
      <div className={cn("relative rounded-full", sizes[size], color)} />
      {children && <span className="ml-2">{children}</span>}
    </div>
  );
}

// Loading Skeleton
export interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
  rounded?: boolean;
}

export function Skeleton({ className, width, height, rounded = false }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-gray-200 dark:bg-gray-800",
        rounded ? "rounded-full" : "rounded",
        className
      )}
      style={{ width, height }}
    />
  );
}

// Animated Counter
export interface AnimatedCounterProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export function AnimatedCounter({ 
  value, 
  duration = 1000, 
  prefix = '', 
  suffix = '', 
  className 
}: AnimatedCounterProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      setCount(Math.floor(progress * value));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [value, duration]);

  return (
    <span className={className}>
      {prefix}{count}{suffix}
    </span>
  );
}

// Smooth Progress Animation
export interface AnimatedProgressProps {
  value: number;
  max?: number;
  duration?: number;
  color?: string;
  backgroundColor?: string;
  height?: string;
  className?: string;
}

export function AnimatedProgress({ 
  value, 
  max = 100, 
  duration = 800, 
  color = 'bg-indigo-600', 
  backgroundColor = 'bg-gray-200 dark:bg-gray-800',
  height = 'h-2',
  className 
}: AnimatedProgressProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setProgress((value / max) * 100);
    }, 100);

    return () => clearTimeout(timer);
  }, [value, max]);

  return (
    <div className={cn("w-full rounded-full overflow-hidden", backgroundColor, height, className)}>
      <div
        className={cn("h-full rounded-full transition-all ease-out", color)}
        style={{ 
          width: `${progress}%`,
          transitionDuration: `${duration}ms`
        }}
      />
    </div>
  );
}

// Typewriter Effect
export interface TypewriterProps {
  text: string;
  speed?: number;
  delay?: number;
  cursor?: boolean;
  className?: string;
}

export function Typewriter({ 
  text, 
  speed = 50, 
  delay = 0, 
  cursor = true, 
  className 
}: TypewriterProps) {
  const [displayText, setDisplayText] = useState('');
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const startTyping = () => {
      let index = 0;
      
      const type = () => {
        if (index < text.length) {
          setDisplayText(text.substring(0, index + 1));
          index++;
          timeoutId = setTimeout(type, speed);
        } else if (cursor) {
          // Blink cursor after typing is complete
          const cursorInterval = setInterval(() => {
            setShowCursor(prev => !prev);
          }, 500);
          return () => clearInterval(cursorInterval);
        }
      };
      
      type();
    };

    timeoutId = setTimeout(startTyping, delay);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [text, speed, delay, cursor]);

  return (
    <span className={className}>
      {displayText}
      {cursor && <span className={cn("animate-pulse", showCursor ? "opacity-100" : "opacity-0")}>|</span>}
    </span>
  );
}

// Smooth Accordion
export interface SmoothAccordionProps {
  isOpen: boolean;
  children: React.ReactNode;
  duration?: number;
  className?: string;
}

export function SmoothAccordion({ 
  isOpen, 
  children, 
  duration = 300, 
  className 
}: SmoothAccordionProps) {
  const [height, setHeight] = useState<number | undefined>(isOpen ? undefined : 0);
  const contentRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!contentRef.current) return;

    if (isOpen) {
      const scrollHeight = contentRef.current.scrollHeight;
      setHeight(scrollHeight);
      
      const timer = setTimeout(() => {
        setHeight(undefined);
      }, duration);
      
      return () => clearTimeout(timer);
    } else {
      setHeight(contentRef.current.scrollHeight);
      
      requestAnimationFrame(() => {
        setHeight(0);
      });
    }
  }, [isOpen, duration]);

  return (
    <div
      ref={contentRef}
      className={cn(
        "overflow-hidden transition-all ease-out",
        className
      )}
      style={{ 
        height,
        transitionDuration: `${duration}ms`
      }}
    >
      {children}
    </div>
  );
}

// Floating Action Button with Ripple Effect
export interface FloatingActionButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  className?: string;
}

export function FloatingActionButton({ 
  children, 
  onClick, 
  position = 'bottom-right',
  className 
}: FloatingActionButtonProps) {
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);

  const positions = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6'
  };

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    const newRipple = {
      id: Date.now(),
      x,
      y
    };
    
    setRipples(prev => [...prev, newRipple]);
    
    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
    }, 600);

    onClick?.();
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "fixed z-50 w-14 h-14 rounded-full shadow-lg",
        "bg-indigo-600 hover:bg-indigo-700 text-white",
        "transition-all duration-200 hover:scale-110 active:scale-95",
        "focus:outline-none focus:ring-4 focus:ring-indigo-300",
        "relative overflow-hidden",
        positions[position],
        className
      )}
    >
      <div className="relative z-10 flex items-center justify-center w-full h-full">
        {children}
      </div>
      
      {ripples.map((ripple) => (
        <div
          key={ripple.id}
          className="absolute bg-white opacity-30 rounded-full animate-ping"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: 20,
            height: 20,
            transform: 'scale(0)',
            animation: 'ripple 0.6s ease-out'
          }}
        />
      ))}
      
      <style jsx>{`
        @keyframes ripple {
          to {
            transform: scale(4);
            opacity: 0;
          }
        }
      `}</style>
    </button>
  );
}

// Smooth Page Transition
export interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={cn(
        "transition-all duration-500 ease-out",
        isVisible 
          ? "opacity-100 translate-y-0" 
          : "opacity-0 translate-y-4",
        className
      )}
    >
      {children}
    </div>
  );
}