'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  RefreshCw, 
  Undo2, 
  Lock, 
  Unlock, 
  AlertCircle,
  CheckCircle,
  Clock,
  Zap,
  ArrowRight,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface UpdateIndicatorProps {
  isUpdating: boolean;
  affectedPhases: number[];
  canUndo: boolean;
  consistencyIssues: any[];
  onUndo: () => void;
  onClearError?: () => void;
  error?: string | null;
  className?: string;
}

interface PhaseStatusProps {
  phase: number;
  isOutOfSync: boolean;
  isLocked: boolean;
  isUpdating: boolean;
  onRefreshFromPrevious: () => void;
  onToggleLock: () => void;
  className?: string;
}

interface RippleUpdateProgressProps {
  isUpdating: boolean;
  sourcePhase: number;
  affectedPhases: number[];
  progress?: number;
  className?: string;
}

export function UpdateIndicator({
  isUpdating,
  affectedPhases,
  canUndo,
  consistencyIssues,
  onUndo,
  onClearError,
  error,
  className
}: UpdateIndicatorProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Update Progress */}
      {isUpdating && (
        <Badge variant="secondary" className="animate-pulse">
          <RefreshCw className="size-3 mr-1 animate-spin" />
          Updating {affectedPhases.length > 1 ? `${affectedPhases.length} phases` : `Phase ${affectedPhases[0]}`}
        </Badge>
      )}

      {/* Undo Button */}
      {canUndo && !isUpdating && (
        <Button
          size="sm"
          variant="outline"
          onClick={onUndo}
          className="h-7 text-xs"
        >
          <Undo2 className="size-3 mr-1" />
          Undo
        </Button>
      )}

      {/* Consistency Issues */}
      {consistencyIssues.length > 0 && (
        <Badge variant="destructive" className="text-xs">
          <AlertCircle className="size-3 mr-1" />
          {consistencyIssues.length} issue{consistencyIssues.length !== 1 ? 's' : ''}
        </Badge>
      )}

      {/* Error Display */}
      {error && (
        <div className="flex items-center gap-2">
          <Badge variant="destructive" className="text-xs">
            <AlertCircle className="size-3 mr-1" />
            Error
          </Badge>
          {onClearError && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onClearError}
              className="size-6 p-0"
            >
              <X className="size-3" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export function PhaseStatus({
  phase,
  isOutOfSync,
  isLocked,
  isUpdating,
  onRefreshFromPrevious,
  onToggleLock,
  className
}: PhaseStatusProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Lock Status */}
      <Button
        size="sm"
        variant="ghost"
        onClick={onToggleLock}
        className="size-6 p-0"
        title={isLocked ? 'Unlock phase (enable auto-updates)' : 'Lock phase (prevent auto-updates)'}
      >
        {isLocked ? (
          <Lock className="size-3 text-orange-500" />
        ) : (
          <Unlock className="size-3 text-muted-foreground" />
        )}
      </Button>

      {/* Sync Status */}
      {isOutOfSync && !isLocked && (
        <div className="flex items-center gap-1">
          <Badge variant="outline" className="text-xs text-orange-600">
            <Clock className="size-3 mr-1" />
            Out of sync
          </Badge>
          <Button
            size="sm"
            variant="outline"
            onClick={onRefreshFromPrevious}
            disabled={isUpdating || phase <= 1}
            className="h-6 text-xs px-2"
          >
            <RefreshCw className={cn("w-3 h-3 mr-1", isUpdating && "animate-spin")} />
            Refresh
          </Button>
        </div>
      )}

      {/* Update Status */}
      {isUpdating && (
        <Badge variant="secondary" className="text-xs animate-pulse">
          <RefreshCw className="size-3 mr-1 animate-spin" />
          Updating...
        </Badge>
      )}
    </div>
  );
}

export function RippleUpdateProgress({
  isUpdating,
  sourcePhase,
  affectedPhases,
  progress = 0,
  className
}: RippleUpdateProgressProps) {
  if (!isUpdating || affectedPhases.length <= 1) return null;

  return (
    <Card className={cn("border-blue-200 bg-blue-50 dark:bg-blue-950/20", className)}>
      <CardContent className="p-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-blue-700 dark:text-blue-300">
            <Zap className="size-4" />
            Ripple update in progress...
          </div>
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Phase {sourcePhase}</span>
            <ArrowRight className="size-3" />
            <span>
              Phase{affectedPhases.filter(p => p !== sourcePhase).length > 1 ? 's' : ''}{' '}
              {affectedPhases.filter(p => p !== sourcePhase).join(', ')}
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-blue-100 rounded-full h-1.5 dark:bg-blue-900">
            <div 
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          
          {/* Affected Phases Indicator */}
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4].map(phaseNum => {
              const isSource = phaseNum === sourcePhase;
              const isAffected = affectedPhases.includes(phaseNum);
              const isCompleted = progress >= (phaseNum / 4) * 100;
              
              return (
                <div
                  key={phaseNum}
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-200",
                    isSource && "bg-blue-600 text-white",
                    isAffected && !isSource && isCompleted && "bg-green-500 text-white",
                    isAffected && !isSource && !isCompleted && "bg-blue-200 text-blue-700 animate-pulse",
                    !isAffected && "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                  )}
                >
                  {isCompleted && isAffected ? (
                    <CheckCircle className="size-3" />
                  ) : (
                    phaseNum
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface ConsistencyAlertProps {
  issues: any[];
  onResolve?: (issueId: string) => void;
  onDismiss?: (issueId: string) => void;
  className?: string;
}

export function ConsistencyAlert({
  issues,
  onResolve,
  onDismiss,
  className
}: ConsistencyAlertProps) {
  if (issues.length === 0) return null;

  return (
    <Card className={cn("border-orange-200 bg-orange-50 dark:bg-orange-950/20", className)}>
      <CardContent className="p-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-orange-700 dark:text-orange-300">
              <AlertCircle className="size-4" />
              Consistency Issues ({issues.length})
            </div>
          </div>
          
          <div className="space-y-2">
            {issues.slice(0, 3).map((issue) => (
              <div key={issue.id} className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="text-xs text-orange-700 dark:text-orange-300 font-medium">
                    {issue.description}
                  </p>
                  {issue.suggestedFix && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Suggestion: {issue.suggestedFix}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center gap-1">
                  {onResolve && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onResolve(issue.id)}
                      className="h-6 text-xs px-2"
                    >
                      Resolve
                    </Button>
                  )}
                  {onDismiss && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDismiss(issue.id)}
                      className="size-6 p-0"
                    >
                      <X className="size-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            
            {issues.length > 3 && (
              <p className="text-xs text-muted-foreground">
                And {issues.length - 3} more issues...
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}