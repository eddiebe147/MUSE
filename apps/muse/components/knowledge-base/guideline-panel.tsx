'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  CheckCircle,
  AlertTriangle,
  FileText,
  Settings,
  ChevronDown,
  ChevronRight,
  Info,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface GuidelineRule {
  id: string;
  source: string;
  category: 'style' | 'format' | 'structure' | 'voice' | 'network' | 'genre';
  rule: string;
  priority: 'high' | 'medium' | 'low';
  applicablePhases: number[];
  example?: string;
}

interface GuidelineCompliance {
  rule: GuidelineRule;
  compliant: boolean;
  confidence: number;
  suggestion?: string;
}

interface GuidelinePanelProps {
  phase: number;
  activeGuidelines: Array<{
    fileName: string;
    fileId: string;
    ruleCount: number;
    categories: string[];
    isActive: boolean;
  }>;
  compliance?: {
    overallScore: number;
    ruleCompliance: GuidelineCompliance[];
  };
  onToggleGuideline: (fileId: string, isActive: boolean) => void;
  className?: string;
}

export function GuidelinePanel({
  phase,
  activeGuidelines,
  compliance,
  onToggleGuideline,
  className
}: GuidelinePanelProps) {
  const [expandedGuidelines, setExpandedGuidelines] = useState<Set<string>>(new Set());
  const [showCompliance, setShowCompliance] = useState(true);

  const toggleGuideline = (fileId: string) => {
    if (expandedGuidelines.has(fileId)) {
      expandedGuidelines.delete(fileId);
    } else {
      expandedGuidelines.add(fileId);
    }
    setExpandedGuidelines(new Set(expandedGuidelines));
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      style: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      format: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
      structure: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      voice: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
      network: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      genre: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400'
    };
    return colors[category] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      high: 'border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-900/20',
      medium: 'border-yellow-300 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20',
      low: 'border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
    };
    return colors[priority] || 'border-gray-300 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/20';
  };

  const activeCount = activeGuidelines.filter(g => g.isActive).length;
  const totalRules = activeGuidelines.reduce((sum, g) => g.isActive ? sum + g.ruleCount : sum, 0);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="size-5 text-purple-600" />
              Active Guidelines
              <Badge variant="secondary">{activeCount} files</Badge>
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="size-4" />
              {totalRules} rules for Phase {phase}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Compliance Score */}
          {compliance && (
            <div className="p-3 rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Guideline Compliance</span>
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "text-sm font-bold",
                    compliance.overallScore >= 80 ? "text-green-600" :
                    compliance.overallScore >= 60 ? "text-yellow-600" : "text-red-600"
                  )}>
                    {Math.round(compliance.overallScore)}%
                  </div>
                  {compliance.overallScore >= 80 ? (
                    <CheckCircle className="size-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="size-4 text-yellow-600" />
                  )}
                </div>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={cn(
                    "h-2 rounded-full transition-all duration-300",
                    compliance.overallScore >= 80 ? "bg-green-500" :
                    compliance.overallScore >= 60 ? "bg-yellow-500" : "bg-red-500"
                  )}
                  style={{ width: `${compliance.overallScore}%` }}
                />
              </div>
            </div>
          )}

          {/* Guidelines List */}
          <div className="space-y-2">
            {activeGuidelines.map((guideline) => (
              <div
                key={guideline.fileId}
                className="border rounded-lg p-3 transition-all hover:shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <Switch
                      checked={guideline.isActive}
                      onCheckedChange={(checked) => onToggleGuideline(guideline.fileId, checked)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {guideline.fileName}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {guideline.ruleCount} rule{guideline.ruleCount !== 1 ? 's' : ''}
                        </span>
                        <div className="flex gap-1">
                          {guideline.categories.slice(0, 3).map(category => (
                            <Badge
                              key={category}
                              variant="secondary"
                              className={cn("text-xs", getCategoryColor(category))}
                            >
                              {category}
                            </Badge>
                          ))}
                          {guideline.categories.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{guideline.categories.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleGuideline(guideline.fileId)}
                      className="size-6 p-0"
                    >
                      {expandedGuidelines.has(guideline.fileId) ? (
                        <ChevronDown className="size-3" />
                      ) : (
                        <ChevronRight className="size-3" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedGuidelines.has(guideline.fileId) && guideline.isActive && (
                  <div className="mt-3 pt-3 border-t space-y-2">
                    <div className="text-xs text-muted-foreground">
                      This guideline provides {guideline.categories.join(', ')} rules for your content.
                    </div>
                    {compliance && (
                      <div className="space-y-1">
                        {compliance.ruleCompliance
                          .filter(c => c.rule.source === guideline.fileName)
                          .slice(0, 3)
                          .map((comp, index) => (
                            <div
                              key={index}
                              className={cn(
                                "p-2 rounded text-xs border",
                                comp.compliant
                                  ? "bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400"
                                  : "bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400"
                              )}
                            >
                              <div className="flex items-center gap-1">
                                {comp.compliant ? (
                                  <CheckCircle className="size-3" />
                                ) : (
                                  <AlertTriangle className="size-3" />
                                )}
                                <span className="font-medium">
                                  {comp.compliant ? 'Following' : 'Not following'}: {comp.rule.category}
                                </span>
                              </div>
                              {comp.suggestion && (
                                <div className="mt-1 text-xs opacity-80">
                                  {comp.suggestion}
                                </div>
                              )}
                            </div>
                          ))
                        }
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {activeGuidelines.length === 0 && (
            <div className="text-center py-6 text-muted-foreground">
              <Info className="size-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No guidelines detected in knowledge base</p>
              <p className="text-xs mt-1">Upload style guides, format rules, or production standards</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}