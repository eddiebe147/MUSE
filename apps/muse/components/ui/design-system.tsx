'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  AlertCircle, 
  Info, 
  Clock,
  TrendingUp,
  Sparkles,
  Zap,
  Star,
  Award
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Professional Status Indicators
export interface StatusIndicatorProps {
  status: 'success' | 'warning' | 'error' | 'info' | 'pending' | 'processing';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  label?: string;
  className?: string;
}

export function StatusIndicator({ 
  status, 
  size = 'md', 
  showLabel = false, 
  label, 
  className 
}: StatusIndicatorProps) {
  const configs = {
    success: {
      icon: CheckCircle,
      color: 'text-green-600',
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-800',
      label: label || 'Complete'
    },
    warning: {
      icon: AlertCircle,
      color: 'text-orange-600',
      bg: 'bg-orange-50 dark:bg-orange-900/20',
      border: 'border-orange-200 dark:border-orange-800',
      label: label || 'Attention Required'
    },
    error: {
      icon: AlertCircle,
      color: 'text-red-600',
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800',
      label: label || 'Error'
    },
    info: {
      icon: Info,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      label: label || 'Information'
    },
    pending: {
      icon: Clock,
      color: 'text-gray-600',
      bg: 'bg-gray-50 dark:bg-gray-900/20',
      border: 'border-gray-200 dark:border-gray-800',
      label: label || 'Pending'
    },
    processing: {
      icon: () => <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50 dark:bg-indigo-900/20',
      border: 'border-indigo-200 dark:border-indigo-800',
      label: label || 'Processing'
    }
  };

  const config = configs[status];
  const IconComponent = config.icon;
  
  const sizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  if (showLabel) {
    return (
      <div className={cn("inline-flex items-center gap-2", className)}>
        <div className={cn("p-1 rounded-full", config.bg, config.border, "border")}>
          <IconComponent className={cn(sizes[size], config.color)} />
        </div>
        <span className={cn("text-sm font-medium", config.color)}>
          {config.label}
        </span>
      </div>
    );
  }

  return (
    <IconComponent className={cn(sizes[size], config.color, className)} />
  );
}

// Quality Score Display
export interface QualityScoreProps {
  score: number; // 0-100
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
  className?: string;
}

export function QualityScore({ 
  score, 
  label = "Quality", 
  size = 'md', 
  showDetails = false, 
  className 
}: QualityScoreProps) {
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 70) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 60) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getScoreGrade = (score: number) => {
    if (score >= 97) return 'A+';
    if (score >= 93) return 'A';
    if (score >= 90) return 'A-';
    if (score >= 87) return 'B+';
    if (score >= 83) return 'B';
    if (score >= 80) return 'B-';
    if (score >= 77) return 'C+';
    if (score >= 73) return 'C';
    if (score >= 70) return 'C-';
    return 'D';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 90) return <Award className="w-4 h-4" />;
    if (score >= 80) return <Star className="w-4 h-4" />;
    if (score >= 70) return <TrendingUp className="w-4 h-4" />;
    return <AlertCircle className="w-4 h-4" />;
  };

  const sizes = {
    sm: 'text-sm px-2 py-1',
    md: 'text-base px-3 py-1.5',
    lg: 'text-lg px-4 py-2'
  };

  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <Badge className={cn("font-semibold border", sizes[size], getScoreColor(score))}>
        <div className="flex items-center gap-1.5">
          {getScoreIcon(score)}
          <span>{score}%</span>
          {showDetails && <span className="opacity-70">({getScoreGrade(score)})</span>}
        </div>
      </Badge>
      {label && (
        <span className="text-sm text-muted-foreground font-medium">{label}</span>
      )}
    </div>
  );
}

// Professional Card Variants
export interface ProfessionalCardProps {
  variant?: 'default' | 'feature' | 'success' | 'warning' | 'premium';
  className?: string;
  children: React.ReactNode;
}

export function ProfessionalCard({ variant = 'default', className, children, ...props }: ProfessionalCardProps) {
  const variants = {
    default: '',
    feature: 'border-indigo-200 dark:border-indigo-800 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/50 dark:to-purple-950/50',
    success: 'border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50',
    warning: 'border-orange-200 dark:border-orange-800 bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-950/50 dark:to-yellow-950/50',
    premium: 'border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50 shadow-lg'
  };

  return (
    <Card className={cn("transition-all duration-300 hover:shadow-md", variants[variant], className)} {...props}>
      {children}
    </Card>
  );
}

// AI-Powered Badge
export interface AIPoweredBadgeProps {
  feature?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function AIPoweredBadge({ feature, size = 'sm', className }: AIPoweredBadgeProps) {
  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1'
  };

  return (
    <Badge 
      className={cn(
        "bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-0 font-medium",
        sizes[size],
        className
      )}
    >
      <Sparkles className="w-3 h-3 mr-1" />
      {feature ? `AI ${feature}` : 'AI-Powered'}
    </Badge>
  );
}

// Progress Ring Component
export interface ProgressRingProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  showPercentage?: boolean;
  className?: string;
}

export function ProgressRing({
  progress,
  size = 60,
  strokeWidth = 4,
  color = '#4f46e5',
  backgroundColor = '#e5e7eb',
  showPercentage = true,
  className
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className={cn("relative", className)} style={{ width: size, height: size }}>
      <svg
        className="transform -rotate-90"
        width={size}
        height={size}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-300"
        />
      </svg>
      {showPercentage && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {Math.round(progress)}%
          </span>
        </div>
      )}
    </div>
  );
}

// Smart Button with Loading States
export interface SmartButtonProps {
  children: React.ReactNode;
  isLoading?: boolean;
  success?: boolean;
  error?: boolean;
  loadingText?: string;
  successText?: string;
  errorText?: string;
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export function SmartButton({
  children,
  isLoading = false,
  success = false,
  error = false,
  loadingText = "Processing...",
  successText,
  errorText,
  variant = 'default',
  size = 'md',
  className,
  onClick,
  disabled = false,
  ...props
}: SmartButtonProps) {
  const getButtonContent = () => {
    if (isLoading) {
      return (
        <>
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
          {loadingText}
        </>
      );
    }
    
    if (success && successText) {
      return (
        <>
          <CheckCircle className="w-4 h-4 mr-2" />
          {successText}
        </>
      );
    }
    
    if (error && errorText) {
      return (
        <>
          <AlertCircle className="w-4 h-4 mr-2" />
          {errorText}
        </>
      );
    }
    
    return children;
  };

  const getVariantStyles = () => {
    if (success) return 'bg-green-600 hover:bg-green-700 text-white border-green-600';
    if (error) return 'bg-red-600 hover:bg-red-700 text-white border-red-600';
    
    const variants = {
      default: '',
      primary: 'bg-indigo-600 hover:bg-indigo-700 text-white',
      secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
      success: 'bg-green-600 hover:bg-green-700 text-white',
      warning: 'bg-orange-600 hover:bg-orange-700 text-white',
      destructive: 'bg-red-600 hover:bg-red-700 text-white'
    };
    
    return variants[variant];
  };

  return (
    <Button
      className={cn(
        "transition-all duration-200",
        getVariantStyles(),
        className
      )}
      onClick={onClick}
      disabled={disabled || isLoading}
      size={size}
      {...props}
    >
      {getButtonContent()}
    </Button>
  );
}

// Insight Card Component
export interface InsightCardProps {
  type: 'strength' | 'opportunity' | 'concern' | 'insight';
  title: string;
  description: string;
  actionable?: boolean;
  onAction?: () => void;
  actionLabel?: string;
  className?: string;
}

export function InsightCard({
  type,
  title,
  description,
  actionable = false,
  onAction,
  actionLabel = "Take Action",
  className
}: InsightCardProps) {
  const configs = {
    strength: {
      icon: <Award className="w-5 h-5" />,
      color: 'text-green-700 dark:text-green-300',
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-800',
      accent: 'bg-green-600'
    },
    opportunity: {
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'text-blue-700 dark:text-blue-300',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      accent: 'bg-blue-600'
    },
    concern: {
      icon: <AlertCircle className="w-5 h-5" />,
      color: 'text-orange-700 dark:text-orange-300',
      bg: 'bg-orange-50 dark:bg-orange-900/20',
      border: 'border-orange-200 dark:border-orange-800',
      accent: 'bg-orange-600'
    },
    insight: {
      icon: <Zap className="w-5 h-5" />,
      color: 'text-purple-700 dark:text-purple-300',
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      border: 'border-purple-200 dark:border-purple-800',
      accent: 'bg-purple-600'
    }
  };

  const config = configs[type];

  // Fallback if config is undefined
  if (!config) {
    console.warn(`InsightCard: Unknown type "${type}". Using default insight config.`);
    const fallbackConfig = configs.insight;
    return (
      <Card className={cn(
        "relative overflow-hidden transition-all duration-200 hover:shadow-md",
        fallbackConfig.bg,
        fallbackConfig.border,
        className
      )}>
        <div className={cn("absolute left-0 top-0 bottom-0 w-1", fallbackConfig.accent)} />
        <CardContent className="p-4 pl-6">
          <div className="flex items-start gap-3">
            <div className={cn("mt-0.5", fallbackConfig.color)}>
              {fallbackConfig.icon}
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-sm mb-1">{title}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
            </div>
          </div>
          {actionable && (
            <div className="mt-3 pt-3 border-t border-border">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={onAction}
                className="h-8 px-3 text-xs"
              >
                {actionLabel}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "relative overflow-hidden transition-all duration-200 hover:shadow-md",
      config.bg,
      config.border,
      className
    )}>
      <div className={cn("absolute left-0 top-0 bottom-0 w-1", config.accent)} />
      <CardContent className="p-4 pl-6">
        <div className="flex items-start gap-3">
          <div className={cn("mt-0.5", config.color)}>
            {config.icon}
          </div>
          <div className="flex-1 space-y-2">
            <h4 className={cn("font-semibold", config.color)}>
              {title}
            </h4>
            <p className="text-sm text-muted-foreground">
              {description}
            </p>
            {actionable && onAction && (
              <Button
                size="sm"
                variant="outline"
                onClick={onAction}
                className="mt-2"
              >
                {actionLabel}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}