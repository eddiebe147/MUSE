'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Zap,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  Undo2,
  AlertTriangle,
  Eye,
  TrendingUp,
  RefreshCw,
  Sparkles,
  History,
  ChevronDown,
  ChevronRight,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface StoryChange {
  id: string;
  timestamp: string;
  phase: 1 | 2 | 3 | 4;
  type: 'edit' | 'auto_update' | 'manual_update';
  field: string;
  oldValue: any;
  newValue: any;
  reason: string;
  affectedPhases: number[];
  status: 'pending' | 'accepted' | 'rejected' | 'applied';
  userId: string;
  transcriptId: string;
}

interface ChangePreview {
  changeId: string;
  phase: number;
  changes: {
    field: string;
    before: any;
    after: any;
    confidence: number;
    reason: string;
  }[];
  impact: {
    phase: number;
    affectedFields: string[];
    riskLevel: 'low' | 'medium' | 'high';
  }[];
}

interface LivingStoryManagerProps {
  transcriptId: string;
  transcriptTitle: string;
  onClose?: () => void;
  onPhasesUpdated?: (updatedPhases: number[]) => void;
}

export function LivingStoryManager({
  transcriptId,
  transcriptTitle,
  onClose,
  onPhasesUpdated
}: LivingStoryManagerProps) {
  const [pendingChanges, setPendingChanges] = useState<Array<{change: StoryChange, preview: ChangePreview}>>([]);
  const [changeHistory, setChangeHistory] = useState<StoryChange[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingChanges, setProcessingChanges] = useState<Set<string>>(new Set());
  const [expandedChanges, setExpandedChanges] = useState<Set<string>>(new Set());
  const [selectedTab, setSelectedTab] = useState<'pending' | 'history'>('pending');

  useEffect(() => {
    loadLivingStoryData();
    const interval = setInterval(loadLivingStoryData, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, [transcriptId]);

  const loadLivingStoryData = async () => {
    try {
      // Load pending changes
      const pendingResponse = await fetch(`/api/transcripts/${transcriptId}/living-story`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_pending' })
      });

      if (pendingResponse.ok) {
        const pendingData = await pendingResponse.json();
        setPendingChanges(pendingData.pendingChanges || []);
      }

      // Load change history
      const historyResponse = await fetch(`/api/transcripts/${transcriptId}/living-story`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_history' })
      });

      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        setChangeHistory(historyData.history || []);
      }

    } catch (error) {
      console.error('Error loading living story data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const acceptChange = async (changeId: string) => {
    setProcessingChanges(prev => new Set([...prev, changeId]));
    
    try {
      const response = await fetch(`/api/transcripts/${transcriptId}/living-story`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'accept_change',
          changeId 
        })
      });

      if (response.ok) {
        setPendingChanges(prev => prev.filter(item => item.change.id !== changeId));
        await loadLivingStoryData(); // Refresh data
        
        // Notify parent of phase updates
        const change = pendingChanges.find(item => item.change.id === changeId);
        if (change && onPhasesUpdated) {
          onPhasesUpdated([change.change.phase, ...change.change.affectedPhases]);
        }
      }
    } catch (error) {
      console.error('Error accepting change:', error);
    } finally {
      setProcessingChanges(prev => {
        const newSet = new Set(prev);
        newSet.delete(changeId);
        return newSet;
      });
    }
  };

  const rejectChange = async (changeId: string) => {
    setProcessingChanges(prev => new Set([...prev, changeId]));
    
    try {
      const response = await fetch(`/api/transcripts/${transcriptId}/living-story`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'reject_change',
          changeId 
        })
      });

      if (response.ok) {
        setPendingChanges(prev => prev.filter(item => item.change.id !== changeId));
        await loadLivingStoryData(); // Refresh data
      }
    } catch (error) {
      console.error('Error rejecting change:', error);
    } finally {
      setProcessingChanges(prev => {
        const newSet = new Set(prev);
        newSet.delete(changeId);
        return newSet;
      });
    }
  };

  const undoChange = async (changeId: string) => {
    setProcessingChanges(prev => new Set([...prev, changeId]));
    
    try {
      const response = await fetch(`/api/transcripts/${transcriptId}/living-story`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'undo_change',
          changeId 
        })
      });

      if (response.ok) {
        await loadLivingStoryData(); // Refresh data
        
        // Notify parent of phase updates
        const change = changeHistory.find(c => c.id === changeId);
        if (change && onPhasesUpdated) {
          onPhasesUpdated([change.phase]);
        }
      }
    } catch (error) {
      console.error('Error undoing change:', error);
    } finally {
      setProcessingChanges(prev => {
        const newSet = new Set(prev);
        newSet.delete(changeId);
        return newSet;
      });
    }
  };

  const toggleChangeExpansion = (changeId: string) => {
    setExpandedChanges(prev => {
      const newSet = new Set(prev);
      if (newSet.has(changeId)) {
        newSet.delete(changeId);
      } else {
        newSet.add(changeId);
      }
      return newSet;
    });
  };

  const getPhaseColor = (phase: number) => {
    switch (phase) {
      case 1: return 'text-purple-600 bg-purple-50 border-purple-200 dark:text-purple-400 dark:bg-purple-900/20 dark:border-purple-800';
      case 2: return 'text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-900/20 dark:border-blue-800';
      case 3: return 'text-green-600 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-900/20 dark:border-green-800';
      case 4: return 'text-orange-600 bg-orange-50 border-orange-200 dark:text-orange-400 dark:bg-orange-900/20 dark:border-orange-800';
      default: return 'text-gray-600 bg-gray-50 border-gray-200 dark:text-gray-400 dark:bg-gray-900/20 dark:border-gray-800';
    }
  };

  const getRiskColor = (risk: 'low' | 'medium' | 'high') => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const truncateValue = (value: any, maxLength = 100) => {
    const str = typeof value === 'string' ? value : JSON.stringify(value);
    return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
  };

  if (isLoading) {
    return (
      <Card className="border-indigo-200 dark:border-indigo-800">
        <CardHeader>
          <div className="flex items-center gap-2">
            <RefreshCw className="size-5 text-indigo-600 animate-spin" />
            <CardTitle className="text-lg">Living Story Manager</CardTitle>
          </div>
          <CardDescription>Loading story changes...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Progress value={50} className="w-48 mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">Loading intelligent story updates</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-indigo-200 dark:border-indigo-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="size-5 text-indigo-600 dark:text-indigo-400" />
              <div>
                <CardTitle className="text-lg">Living Story Manager</CardTitle>
                <CardDescription>Intelligent story consistency across all phases</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-indigo-600 border-indigo-300">
                {pendingChanges.length} Pending
              </Badge>
              {onClose && (
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Status Overview */}
      {(pendingChanges.length > 0 || changeHistory.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="size-4 text-orange-500" />
                <span className="text-sm font-medium">Pending Updates</span>
              </div>
              <div className="text-2xl font-bold">{pendingChanges.length}</div>
              <p className="text-xs text-muted-foreground">Awaiting your review</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <History className="size-4 text-blue-500" />
                <span className="text-sm font-medium">Recent Changes</span>
              </div>
              <div className="text-2xl font-bold">{changeHistory.filter(c => c.status === 'accepted' || c.status === 'applied').length}</div>
              <p className="text-xs text-muted-foreground">Successfully applied</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="size-4 text-green-500" />
                <span className="text-sm font-medium">Story Health</span>
              </div>
              <div className="text-2xl font-bold">
                {pendingChanges.length === 0 ? '100' : Math.max(60, 100 - pendingChanges.length * 10)}%
              </div>
              <p className="text-xs text-muted-foreground">Consistency score</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={selectedTab} onValueChange={(value: 'pending' | 'history') => setSelectedTab(value)} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="size-3" />
            Pending Changes ({pendingChanges.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="size-3" />
            Change History ({changeHistory.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingChanges.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="size-12 mx-auto mb-4 text-green-500" />
                <h3 className="text-lg font-medium mb-2">All Caught Up!</h3>
                <p className="text-muted-foreground">
                  Your story is perfectly consistent across all phases. Any changes you make will appear here for review.
                </p>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-4">
                {pendingChanges.map(({ change, preview }) => (
                  <Card key={change.id} className="border-l-4 border-l-orange-500">
                    <CardContent className="p-4">
                      <div className="space-y-4">
                        {/* Change Header */}
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge className={getPhaseColor(change.phase)}>
                                Phase {change.phase}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {change.type === 'auto_update' ? 'Auto Update' : 'Manual Edit'}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {formatTimestamp(change.timestamp)}
                              </span>
                            </div>
                            <p className="text-sm font-medium">{change.reason}</p>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => toggleChangeExpansion(change.id)}
                                className="h-6 px-2 text-xs"
                              >
                                {expandedChanges.has(change.id) ? (
                                  <>
                                    <ChevronDown className="size-3 mr-1" />
                                    Hide Details
                                  </>
                                ) : (
                                  <>
                                    <ChevronRight className="size-3 mr-1" />
                                    Show Details
                                  </>
                                )}
                              </Button>
                              {change.affectedPhases.length > 0 && (
                                <Badge variant="secondary" className="text-xs">
                                  Affects {change.affectedPhases.length} phases
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => acceptChange(change.id)}
                              disabled={processingChanges.has(change.id)}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              {processingChanges.has(change.id) ? (
                                <RefreshCw className="size-3 animate-spin mr-1" />
                              ) : (
                                <CheckCircle className="size-3 mr-1" />
                              )}
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => rejectChange(change.id)}
                              disabled={processingChanges.has(change.id)}
                              className="text-red-600 border-red-300 hover:bg-red-50"
                            >
                              <XCircle className="size-3 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </div>

                        {/* Expanded Details */}
                        {expandedChanges.has(change.id) && preview && (
                          <div className="space-y-4 pt-4 border-t">
                            {/* Changes Preview */}
                            <div>
                              <h4 className="text-sm font-medium mb-2">Proposed Changes:</h4>
                              <div className="space-y-2">
                                {preview.changes.map((fieldChange, index) => (
                                  <div key={index} className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-sm font-medium">{fieldChange.field}</span>
                                      <Badge className={`text-xs ${fieldChange.confidence > 0.8 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                        {Math.round(fieldChange.confidence * 100)}% confident
                                      </Badge>
                                    </div>
                                    <div className="text-xs space-y-1">
                                      <div>
                                        <span className="text-red-600 font-medium">Before:</span>
                                        <span className="ml-2">{truncateValue(fieldChange.before)}</span>
                                      </div>
                                      <div>
                                        <span className="text-green-600 font-medium">After:</span>
                                        <span className="ml-2">{truncateValue(fieldChange.after)}</span>
                                      </div>
                                      <div className="text-muted-foreground">
                                        <span className="font-medium">Reason:</span>
                                        <span className="ml-2">{fieldChange.reason}</span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Impact Analysis */}
                            <div>
                              <h4 className="text-sm font-medium mb-2">Impact Analysis:</h4>
                              <div className="space-y-2">
                                {preview.impact.map((impact, index) => (
                                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded">
                                    <div className="flex items-center gap-2">
                                      <Badge className={getPhaseColor(impact.phase)}>
                                        Phase {impact.phase}
                                      </Badge>
                                      <span className="text-xs">
                                        {impact.affectedFields.length} fields affected
                                      </span>
                                    </div>
                                    <Badge className={`text-xs ${getRiskColor(impact.riskLevel)}`}>
                                      {impact.riskLevel} risk
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {changeHistory.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <History className="size-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">No Changes Yet</h3>
                <p className="text-muted-foreground">
                  Start editing your story phases to see intelligent updates appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-4">
                {changeHistory.map((change) => (
                  <Card key={change.id} className={cn(
                    "border-l-4",
                    change.status === 'accepted' || change.status === 'applied' ? 'border-l-green-500' : 
                    change.status === 'rejected' ? 'border-l-red-500' : 'border-l-gray-400'
                  )}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge className={getPhaseColor(change.phase)}>
                              Phase {change.phase}
                            </Badge>
                            <Badge variant={
                              change.status === 'accepted' || change.status === 'applied' ? 'default' :
                              change.status === 'rejected' ? 'destructive' : 'secondary'
                            } className="text-xs">
                              {change.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatTimestamp(change.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm">{change.reason}</p>
                          <div className="text-xs text-muted-foreground">
                            Field: {change.field}
                          </div>
                        </div>
                        
                        {(change.status === 'accepted' || change.status === 'applied') && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => undoChange(change.id)}
                            disabled={processingChanges.has(change.id)}
                            className="text-orange-600 border-orange-300 hover:bg-orange-50"
                          >
                            {processingChanges.has(change.id) ? (
                              <RefreshCw className="size-3 animate-spin mr-1" />
                            ) : (
                              <Undo2 className="size-3 mr-1" />
                            )}
                            Undo
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>
      </Tabs>

      {/* Help Section */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="size-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">How Living Story Works</h4>
              <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <p>• When you edit any phase, MUSE intelligently identifies dependent phases that should be updated</p>
                <p>• Proposed changes maintain narrative consistency while preserving your creative intent</p>
                <p>• Review and approve changes before they're applied - you're always in control</p>
                <p>• Use the undo feature to revert any change if needed</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}