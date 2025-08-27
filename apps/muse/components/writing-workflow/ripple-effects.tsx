'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Waves,
  ArrowRight,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Eye,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RippleEffect {
  id: string;
  sourcePhase: number;
  affectedPhases: number[];
  type: 'update' | 'regenerate' | 'refresh';
  status: 'pending' | 'processing' | 'complete' | 'failed';
  description: string;
  timestamp: Date;
  changes?: {
    phase: number;
    before: string;
    after: string;
    confidence: number;
  }[];
}

interface RippleEffectsProps {
  activeEffects: RippleEffect[];
  onApplyEffect: (effectId: string) => Promise<void>;
  onDismissEffect: (effectId: string) => void;
  onPreviewChanges: (effectId: string) => void;
  isExpanded?: boolean;
  onToggleExpanded?: () => void;
  className?: string;
}

const RippleEffectCard: React.FC<{
  effect: RippleEffect;
  onApply: () => Promise<void>;
  onDismiss: () => void;
  onPreview: () => void;
}> = ({ effect, onApply, onDismiss, onPreview }) => {
  const [isApplying, setIsApplying] = useState(false);

  const handleApply = async () => {
    setIsApplying(true);
    try {
      await onApply();
    } finally {
      setIsApplying(false);
    }
  };

  const getStatusColor = (status: RippleEffect['status']) => {
    switch (status) {
      case 'pending': return 'border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20';
      case 'processing': return 'border-blue-300 bg-blue-50 dark:bg-blue-900/20';
      case 'complete': return 'border-green-300 bg-green-50 dark:bg-green-900/20';
      case 'failed': return 'border-red-300 bg-red-50 dark:bg-red-900/20';
      default: return 'border-gray-300 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getStatusIcon = (status: RippleEffect['status']) => {
    switch (status) {
      case 'pending': return <Clock className="size-4 text-yellow-600" />;
      case 'processing': return <RefreshCw className="size-4 text-blue-600 animate-spin" />;
      case 'complete': return <CheckCircle className="size-4 text-green-600" />;
      case 'failed': return <AlertTriangle className="size-4 text-red-600" />;
      default: return <Zap className="size-4 text-gray-600" />;
    }
  };

  const getTypeLabel = (type: RippleEffect['type']) => {
    switch (type) {
      case 'update': return 'Content Update';
      case 'regenerate': return 'AI Regeneration';
      case 'refresh': return 'Context Refresh';
      default: return 'Change';
    }
  };

  return (
    <Card className={cn("border-2 transition-all duration-200", getStatusColor(effect.status))}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3">
            <div className="mt-1">
              {getStatusIcon(effect.status)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-sm">{getTypeLabel(effect.type)}</h4>
                <Badge variant="secondary" className="text-xs">
                  Phase {effect.sourcePhase}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {effect.description}
              </p>
            </div>
          </div>
          
          {effect.status === 'pending' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="size-6 p-0 opacity-60 hover:opacity-100"
            >
              ×
            </Button>
          )}
        </div>

        {/* Affected Phases */}
        <div className="mb-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <Waves className="size-3" />
            Affects phases:
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              Phase {effect.sourcePhase}
            </Badge>
            {effect.affectedPhases.map((phase) => (
              <React.Fragment key={phase}>
                <ArrowRight className="size-3 text-muted-foreground" />
                <Badge variant="outline" className="text-xs">
                  Phase {phase}
                </Badge>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Change Preview */}
        {effect.changes && effect.changes.length > 0 && (
          <div className="mb-3 p-2 rounded bg-white dark:bg-gray-800 border border-dashed">
            <div className="text-xs font-medium text-muted-foreground mb-2">
              Proposed Changes:
            </div>
            {effect.changes.slice(0, 2).map((change, index) => (
              <div key={index} className="text-xs space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">Phase {change.phase}</Badge>
                  <span className="text-muted-foreground">
                    {Math.round(change.confidence)}% confidence
                  </span>
                </div>
                <div className="text-muted-foreground truncate">
                  {change.after.substring(0, 80)}...
                </div>
              </div>
            ))}
            {effect.changes.length > 2 && (
              <div className="text-xs text-muted-foreground mt-1">
                +{effect.changes.length - 2} more changes
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        {effect.status === 'pending' && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleApply}
              disabled={isApplying}
              className="h-7 text-xs"
            >
              {isApplying ? (
                <RefreshCw className="size-3 mr-1 animate-spin" />
              ) : (
                <CheckCircle className="size-3 mr-1" />
              )}
              Apply Changes
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={onPreview}
              className="h-7 text-xs"
            >
              <Eye className="size-3 mr-1" />
              Preview
            </Button>
          </div>
        )}

        {/* Timestamp */}
        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs text-muted-foreground">
            {effect.timestamp.toLocaleTimeString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export function RippleEffects({ 
  activeEffects, 
  onApplyEffect, 
  onDismissEffect, 
  onPreviewChanges,
  isExpanded = false,
  onToggleExpanded,
  className 
}: RippleEffectsProps) {
  const [appliedEffects, setAppliedEffects] = useState<Set<string>>(new Set());
  
  const pendingEffects = activeEffects.filter(e => e.status === 'pending');
  const processingEffects = activeEffects.filter(e => e.status === 'processing');
  const completedEffects = activeEffects.filter(e => e.status === 'complete');

  const handleApplyEffect = async (effectId: string) => {
    await onApplyEffect(effectId);
    setAppliedEffects(prev => new Set([...prev, effectId]));
  };

  if (activeEffects.length === 0) {
    return null;
  }

  return (
    <Card className={cn("border-2 border-blue-200 dark:border-blue-800", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Waves className="size-5 text-blue-600" />
            <CardTitle className="text-lg">Smart Updates</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {pendingEffects.length > 0 && (
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                {pendingEffects.length} pending
              </Badge>
            )}
            {processingEffects.length > 0 && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {processingEffects.length} updating
              </Badge>
            )}
            {onToggleExpanded && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleExpanded}
                className="size-8 p-0"
              >
                {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
              </Button>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Changes in one phase can intelligently update downstream phases
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Processing Effects */}
        {processingEffects.length > 0 && (
          <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
            <RefreshCw className="size-4 animate-spin text-blue-600" />
            <AlertDescription className="text-sm">
              {processingEffects.length} update{processingEffects.length !== 1 ? 's' : ''} in progress...
            </AlertDescription>
          </Alert>
        )}

        {/* Pending Effects */}
        {pendingEffects.map((effect) => (
          <RippleEffectCard
            key={effect.id}
            effect={effect}
            onApply={() => handleApplyEffect(effect.id)}
            onDismiss={() => onDismissEffect(effect.id)}
            onPreview={() => onPreviewChanges(effect.id)}
          />
        ))}

        {/* Recently Completed (if expanded) */}
        {isExpanded && completedEffects.length > 0 && (
          <div className="space-y-3">
            <div className="text-sm font-medium text-muted-foreground border-t pt-3">
              Recently Applied:
            </div>
            {completedEffects.slice(0, 3).map((effect) => (
              <RippleEffectCard
                key={effect.id}
                effect={effect}
                onApply={() => handleApplyEffect(effect.id)}
                onDismiss={() => onDismissEffect(effect.id)}
                onPreview={() => onPreviewChanges(effect.id)}
              />
            ))}
          </div>
        )}

        {/* No Effects Message */}
        {pendingEffects.length === 0 && processingEffects.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            <Waves className="size-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No pending updates</p>
            <p className="text-xs mt-1">Changes will appear here automatically</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}