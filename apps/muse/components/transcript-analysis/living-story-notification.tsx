'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  Eye,
  X,
  Zap,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLivingStory } from '@/hooks/use-living-story';

interface LivingStoryNotificationProps {
  transcriptId: string;
  onOpenManager?: () => void;
  onPhaseUpdated?: (phase: number) => void;
  className?: string;
}

export function LivingStoryNotification({
  transcriptId,
  onOpenManager,
  onPhaseUpdated,
  className
}: LivingStoryNotificationProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [lastNotificationCount, setLastNotificationCount] = useState(0);

  const {
    status,
    pendingChanges,
    isProcessing,
    hasPendingChanges,
    acceptChange,
    rejectChange,
    acceptAllChanges,
    rejectAllChanges
  } = useLivingStory({
    transcriptId,
    enabled: true,
    onAutoUpdatesGenerated: (count) => {
      // Show notification when new updates are generated
      if (count > 0) {
        setIsDismissed(false);
        setIsExpanded(true);
      }
    },
    onChangeApplied: (phase) => {
      if (onPhaseUpdated) {
        onPhaseUpdated(phase);
      }
    }
  });

  // Auto-expand when new pending changes appear
  useEffect(() => {
    if (status.pendingChangesCount > lastNotificationCount && status.pendingChangesCount > 0) {
      setIsDismissed(false);
      setIsExpanded(true);
    }
    setLastNotificationCount(status.pendingChangesCount);
  }, [status.pendingChangesCount, lastNotificationCount]);

  // Don't show if dismissed or no pending changes
  if (isDismissed || !hasPendingChanges) {
    return null;
  }

  const getPhaseColor = (phase: number) => {
    switch (phase) {
      case 1: return 'text-purple-600 bg-purple-50 border-purple-200 dark:text-purple-400 dark:bg-purple-900/20 dark:border-purple-800';
      case 2: return 'text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-900/20 dark:border-blue-800';
      case 3: return 'text-green-600 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-900/20 dark:border-green-800';
      case 4: return 'text-orange-600 bg-orange-50 border-orange-200 dark:text-orange-400 dark:bg-orange-900/20 dark:border-orange-800';
      default: return 'text-gray-600 bg-gray-50 border-gray-200 dark:text-gray-400 dark:bg-gray-900/20 dark:border-gray-800';
    }
  };

  return (
    <div className={cn(
      "fixed bottom-4 right-4 z-50 max-w-md transition-all duration-300",
      isExpanded ? "w-96" : "w-80",
      className
    )}>
      <Card className="border-indigo-200 dark:border-indigo-800 shadow-lg bg-white dark:bg-gray-900">
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="size-5 text-indigo-600 animate-pulse" />
                <div>
                  <h4 className="text-sm font-medium">Living Story Updates</h4>
                  <p className="text-xs text-muted-foreground">
                    {status.pendingChangesCount} suggested changes available
                  </p>
                </div>
              </div>
              <div className="flex gap-1">
                {!isExpanded && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsExpanded(true)}
                    className="size-6 p-0"
                  >
                    <ArrowRight className="size-3" />
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsDismissed(true)}
                  className="size-6 p-0"
                >
                  <X className="size-3" />
                </Button>
              </div>
            </div>

            {/* Compact View */}
            {!isExpanded && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-indigo-600 border-indigo-300 text-xs">
                    <Clock className="size-2 mr-1" />
                    {status.pendingChangesCount} pending
                  </Badge>
                  {isProcessing && (
                    <Badge variant="outline" className="text-orange-600 border-orange-300 text-xs">
                      <RefreshCw className="size-2 mr-1 animate-spin" />
                      Processing...
                    </Badge>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => setIsExpanded(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
                  >
                    <Eye className="size-3 mr-1" />
                    Review
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={acceptAllChanges}
                    disabled={isProcessing}
                    className="text-green-600 border-green-300 hover:bg-green-50 text-xs"
                  >
                    <CheckCircle className="size-3 mr-1" />
                    Accept All
                  </Button>
                </div>
              </div>
            )}

            {/* Expanded View */}
            {isExpanded && (
              <div className="space-y-3">
                {/* Pending Changes List */}
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {pendingChanges.slice(0, 3).map((change) => (
                    <div key={change.id} className="p-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex items-center gap-1">
                          <Badge className={cn("text-xs", getPhaseColor(change.phase))}>
                            Phase {change.phase}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {change.type === 'auto_update' ? 'Auto' : 'Manual'}
                          </Badge>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            onClick={() => acceptChange(change.id)}
                            disabled={isProcessing}
                            className="size-5 p-0 bg-green-600 hover:bg-green-700 text-white"
                          >
                            <CheckCircle className="size-2" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => rejectChange(change.id)}
                            disabled={isProcessing}
                            className="size-5 p-0 text-red-600 border-red-300 hover:bg-red-50"
                          >
                            <XCircle className="size-2" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {change.reason}
                      </p>
                    </div>
                  ))}
                  
                  {pendingChanges.length > 3 && (
                    <div className="text-xs text-center text-muted-foreground py-1">
                      +{pendingChanges.length - 3} more changes...
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    size="sm"
                    onClick={onOpenManager}
                    variant="outline"
                    className="flex-1 text-xs"
                  >
                    <Eye className="size-3 mr-1" />
                    Manage All
                  </Button>
                  <Button
                    size="sm"
                    onClick={acceptAllChanges}
                    disabled={isProcessing}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs"
                  >
                    {isProcessing ? (
                      <RefreshCw className="size-3 mr-1 animate-spin" />
                    ) : (
                      <CheckCircle className="size-3 mr-1" />
                    )}
                    Accept All
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={rejectAllChanges}
                    disabled={isProcessing}
                    className="flex-1 text-red-600 border-red-300 hover:bg-red-50 text-xs"
                  >
                    <XCircle className="size-3 mr-1" />
                    Reject All
                  </Button>
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsExpanded(false)}
                  className="w-full text-xs"
                >
                  Collapse
                </Button>
              </div>
            )}

            {/* Status Indicator */}
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
              <div className="flex items-center gap-1">
                <div className="size-2 rounded-full bg-green-500 animate-pulse" />
                <span>Living Story Active</span>
              </div>
              {status.lastChangeTime && (
                <span>
                  Last update: {new Date(status.lastChangeTime).toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}