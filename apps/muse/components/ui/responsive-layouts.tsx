'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Menu, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  MoreHorizontal,
  Maximize2,
  Minimize2
} from 'lucide-react';

// Responsive Grid System
export interface ResponsiveGridProps {
  children: React.ReactNode;
  cols?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: number;
  className?: string;
}

export function ResponsiveGrid({ 
  children, 
  cols = { default: 1, md: 2, lg: 3 },
  gap = 6,
  className 
}: ResponsiveGridProps) {
  const getGridClasses = () => {
    const classes = [`gap-${gap}`];
    
    if (cols.default) classes.push(`grid-cols-${cols.default}`);
    if (cols.sm) classes.push(`sm:grid-cols-${cols.sm}`);
    if (cols.md) classes.push(`md:grid-cols-${cols.md}`);
    if (cols.lg) classes.push(`lg:grid-cols-${cols.lg}`);
    if (cols.xl) classes.push(`xl:grid-cols-${cols.xl}`);
    
    return classes.join(' ');
  };

  return (
    <div className={cn("grid", getGridClasses(), className)}>
      {children}
    </div>
  );
}

// Mobile-First Container
export interface ResponsiveContainerProps {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
}

export function ResponsiveContainer({ 
  children, 
  size = 'lg', 
  className 
}: ResponsiveContainerProps) {
  const sizes = {
    sm: 'max-w-2xl',
    md: 'max-w-4xl',
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
    full: 'max-w-full'
  };

  return (
    <div className={cn(
      "w-full mx-auto px-4 sm:px-6 lg:px-8",
      sizes[size],
      className
    )}>
      {children}
    </div>
  );
}

// Adaptive Navigation Bar
export interface AdaptiveNavProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  backAction?: () => void;
  className?: string;
}

export function AdaptiveNav({ 
  title, 
  subtitle, 
  actions, 
  backAction, 
  className 
}: AdaptiveNavProps) {
  return (
    <header className={cn(
      "sticky top-0 z-40 bg-white dark:bg-gray-900 border-b",
      "px-4 py-3 sm:px-6 lg:px-8",
      className
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {backAction && (
            <Button
              variant="ghost"
              size="sm"
              onClick={backAction}
              className="lg:hidden"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
          )}
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground hidden sm:block">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}

// Responsive Card Stack
export interface CardStackProps {
  cards: Array<{
    id: string;
    title: string;
    content: React.ReactNode;
    badge?: string;
    priority?: 'high' | 'medium' | 'low';
  }>;
  className?: string;
}

export function CardStack({ cards, className }: CardStackProps) {
  const [activeCard, setActiveCard] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (isMobile) {
    // Mobile: Show cards as a carousel
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {cards.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveCard(index)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  activeCard === index 
                    ? "bg-indigo-600 w-6" 
                    : "bg-gray-300"
                )}
              />
            ))}
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveCard(Math.max(0, activeCard - 1))}
              disabled={activeCard === 0}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveCard(Math.min(cards.length - 1, activeCard + 1))}
              disabled={activeCard === cards.length - 1}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <div className="overflow-hidden">
          <div 
            className="flex transition-transform duration-300 ease-out"
            style={{ transform: `translateX(-${activeCard * 100}%)` }}
          >
            {cards.map((card) => (
              <div key={card.id} className="w-full flex-shrink-0">
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{card.title}</CardTitle>
                      {card.badge && (
                        <Badge variant="outline" className="text-xs">
                          {card.badge}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {card.content}
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Desktop: Show cards in a grid
  return (
    <ResponsiveGrid cols={{ default: 1, md: 2, lg: 3 }} className={className}>
      {cards.map((card) => (
        <Card key={card.id} className="h-fit">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{card.title}</CardTitle>
              {card.badge && (
                <Badge variant="outline" className="text-xs">
                  {card.badge}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {card.content}
          </CardContent>
        </Card>
      ))}
    </ResponsiveGrid>
  );
}

// Responsive Sidebar Layout
export interface ResponsiveSidebarProps {
  sidebar: React.ReactNode;
  children: React.ReactNode;
  sidebarWidth?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  className?: string;
}

export function ResponsiveSidebar({ 
  sidebar, 
  children, 
  sidebarWidth = 'w-80',
  collapsible = true,
  defaultCollapsed = false,
  className 
}: ResponsiveSidebarProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(!defaultCollapsed);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarOpen(false);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className={cn("flex h-screen bg-gray-50 dark:bg-gray-900", className)}>
      {/* Mobile Overlay */}
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "relative z-50 flex flex-col bg-white dark:bg-gray-800 border-r transition-all duration-300",
        isMobile 
          ? cn(
              "fixed inset-y-0 left-0",
              isSidebarOpen ? sidebarWidth : "w-0 overflow-hidden"
            )
          : cn(
              isSidebarOpen ? sidebarWidth : "w-0 overflow-hidden lg:w-16"
            )
      )}>
        {/* Sidebar Toggle */}
        {collapsible && (
          <div className="absolute -right-3 top-4 z-10">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="w-6 h-6 p-0 rounded-full bg-white dark:bg-gray-800 border shadow-sm"
            >
              {isSidebarOpen ? (
                <ChevronLeft className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </Button>
          </div>
        )}
        
        <div className={cn(
          "flex-1 overflow-hidden",
          isSidebarOpen ? "opacity-100" : "opacity-0 lg:opacity-100"
        )}>
          {sidebar}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        {isMobile && (
          <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b lg:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        )}
        
        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

// Responsive Action Bar
export interface ResponsiveActionBarProps {
  primaryAction?: {
    label: string;
    onClick: () => void;
    loading?: boolean;
  };
  secondaryActions?: Array<{
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  }>;
  position?: 'top' | 'bottom' | 'floating';
  className?: string;
}

export function ResponsiveActionBar({ 
  primaryAction, 
  secondaryActions = [], 
  position = 'bottom',
  className 
}: ResponsiveActionBarProps) {
  const [showMore, setShowMore] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const positions = {
    top: 'top-0 border-b',
    bottom: 'bottom-0 border-t',
    floating: 'bottom-4 left-4 right-4 rounded-lg shadow-lg border'
  };

  const visibleSecondaryActions = isMobile ? secondaryActions.slice(0, 1) : secondaryActions.slice(0, 3);
  const hiddenActions = isMobile ? secondaryActions.slice(1) : secondaryActions.slice(3);

  return (
    <div className={cn(
      "sticky z-30 bg-white dark:bg-gray-900 px-4 py-3",
      positions[position],
      position === 'floating' && "mx-4",
      className
    )}>
      <div className="flex items-center justify-between gap-2">
        {/* Secondary Actions */}
        <div className="flex items-center gap-2">
          {visibleSecondaryActions.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={action.onClick}
              className="hidden sm:flex"
            >
              {action.icon}
              <span className="ml-1">{action.label}</span>
            </Button>
          ))}
          
          {/* Mobile: Show icons only */}
          {isMobile && visibleSecondaryActions.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={action.onClick}
              className="sm:hidden p-2"
            >
              {action.icon}
            </Button>
          ))}
          
          {/* More Actions */}
          {hiddenActions.length > 0 && (
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMore(!showMore)}
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
              
              {showMore && (
                <div className="absolute bottom-full mb-2 right-0 bg-white dark:bg-gray-800 border rounded-lg shadow-lg py-1 min-w-40">
                  {hiddenActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        action.onClick();
                        setShowMore(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                      {action.icon}
                      {action.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Primary Action */}
        {primaryAction && (
          <Button
            onClick={primaryAction.onClick}
            disabled={primaryAction.loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {primaryAction.loading ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
            ) : null}
            {primaryAction.label}
          </Button>
        )}
      </div>
    </div>
  );
}

// Responsive Modal
export interface ResponsiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
}

export function ResponsiveModal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md',
  className 
}: ResponsiveModalProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full'
  };

  if (isMobile) {
    // Mobile: Full screen modal
    return (
      <div className="fixed inset-0 z-50 bg-white dark:bg-gray-900">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">{title}</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
          <div className="flex-1 overflow-auto p-4">
            {children}
          </div>
        </div>
      </div>
    );
  }

  // Desktop: Centered modal
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black bg-opacity-50" 
        onClick={onClose}
      />
      <div className={cn(
        "relative bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full",
        sizes[size],
        className
      )}>
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">{title}</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}