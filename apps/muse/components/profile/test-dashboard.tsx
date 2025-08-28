'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  User, 
  Crown, 
  Save, 
  Download, 
  Upload,
  FileText,
  Zap,
  TestTube,
  CheckCircle,
  XCircle,
  AlertCircle,
  Users,
  Heart
} from 'lucide-react';
import { useProfile } from '@/contexts/profile-context';
import { usePaywall } from '@/hooks/use-paywall';
import { FeatureGate, useFeatureGate } from '@/components/paywall/feature-gate';
import { PaywallProvider } from '@/components/paywall/paywall-provider';

interface TestDashboardProps {
  initialSession: any;
}

export function TestDashboard({ initialSession }: TestDashboardProps) {
  const { profile, usage, features, loading, isGuest } = useProfile();
  const { 
    checkSaveProject, 
    checkARCAnalysis, 
    checkExport,
    checkKnowledgeBaseUpload,
    checkMultipleProjects,
    triggerSavePrompt,
    triggerUpgradeAfterExports
  } = usePaywall();

  const [testResults, setTestResults] = useState<Record<string, 'success' | 'blocked' | 'error'>>({});
  
  const runTest = async (testName: string, testFunction: () => any) => {
    try {
      const result = testFunction();
      if (result.allowed) {
        setTestResults(prev => ({ ...prev, [testName]: 'success' }));
      } else {
        setTestResults(prev => ({ ...prev, [testName]: 'blocked' }));
        if (result.showPaywall) {
          result.showPaywall();
        }
      }
    } catch (error) {
      console.error(`Test ${testName} failed:`, error);
      setTestResults(prev => ({ ...prev, [testName]: 'error' }));
    }
  };

  const getResultIcon = (result: 'success' | 'blocked' | 'error' | undefined) => {
    switch (result) {
      case 'success': return <CheckCircle className="size-4 text-green-600" />;
      case 'blocked': return <XCircle className="size-4 text-red-600" />;
      case 'error': return <AlertCircle className="size-4 text-yellow-600" />;
      default: return <TestTube className="size-4 text-gray-400" />;
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'free': return <Heart className="size-4" />;
      case 'pro': return <Crown className="size-4" />;
      case 'team': return <Users className="size-4" />;
      default: return <User className="size-4" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="bg-gray-200 rounded h-8 w-1/2 mb-4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-gray-200 rounded-lg h-48"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <PaywallProvider>
      <div className="space-y-8">
        {/* User Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="size-5" />
              Current User Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Authentication</label>
                <Badge variant={initialSession ? 'default' : 'secondary'}>
                  {initialSession ? 'Logged In' : 'Guest Mode'}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Current Tier</label>
                <Badge className="flex items-center gap-1">
                  {getTierIcon(profile?.tier)}
                  {profile?.tier || 'Unknown'}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Guest Status</label>
                <Badge variant={isGuest ? 'destructive' : 'default'}>
                  {isGuest ? 'Guest User' : 'Authenticated'}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Profile ID</label>
                <div className="text-xs text-muted-foreground font-mono">
                  {profile?.id?.substring(0, 12)}...
                </div>
              </div>
            </div>

            {profile?.email && (
              <Alert>
                <User className="size-4" />
                <AlertDescription>
                  Logged in as: {profile.email} 
                  {profile.name && ` (${profile.name})`}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Usage Statistics */}
        {usage && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="size-5" />
                Current Usage Limits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(usage).map(([key, limit]) => (
                  <div key={key} className="space-y-1">
                    <div className="text-sm font-medium capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {limit.unlimited 
                        ? `${limit.used} / Unlimited`
                        : `${limit.used} / ${limit.limit}`
                      }
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: limit.unlimited 
                            ? '100%' 
                            : `${Math.min((limit.used / limit.limit) * 100, 100)}%`
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Feature Access Tests */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Paywall Trigger Tests */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="size-5" />
                Paywall Trigger Tests
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Save className="size-4" />
                    <span className="text-sm">Save Project</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getResultIcon(testResults.saveProject)}
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => runTest('saveProject', checkSaveProject)}
                    >
                      Test
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="size-4" />
                    <span className="text-sm">ARC Analysis</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getResultIcon(testResults.arcAnalysis)}
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => runTest('arcAnalysis', checkARCAnalysis)}
                    >
                      Test
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Download className="size-4" />
                    <span className="text-sm">Export Feature</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getResultIcon(testResults.export)}
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => runTest('export', checkExport)}
                    >
                      Test
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Upload className="size-4" />
                    <span className="text-sm">Knowledge Base Upload</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getResultIcon(testResults.knowledgeBase)}
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => runTest('knowledgeBase', () => checkKnowledgeBaseUpload(1024))}
                    >
                      Test
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="size-4" />
                    <span className="text-sm">Multiple Projects</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getResultIcon(testResults.multipleProjects)}
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => runTest('multipleProjects', checkMultipleProjects)}
                    >
                      Test
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Feature Gate Demo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="size-5" />
                Feature Gate Demonstrations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">ARC Generator (Pro Feature)</h4>
                  <FeatureGate feature="arcGenerator">
                    <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                      <p className="text-sm text-purple-800">
                        🎉 ARC Generator is available! You can analyze story arcs.
                      </p>
                    </div>
                  </FeatureGate>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Advanced Exports (Pro Feature)</h4>
                  <FeatureGate feature="advancedExports">
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        📊 Advanced export options are available!
                      </p>
                    </div>
                  </FeatureGate>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Team Collaboration (Team Feature)</h4>
                  <FeatureGate feature="teamCollaboration">
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-800">
                        👥 Team collaboration features are available!
                      </p>
                    </div>
                  </FeatureGate>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Smart Triggers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="size-5" />
              Smart Paywall Triggers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              These triggers simulate smart paywall behavior based on user actions:
            </p>
            
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={triggerSavePrompt}
              >
                Trigger Save Prompt
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={triggerUpgradeAfterExports}
              >
                Trigger Export Limit
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 flex-wrap">
              <Button asChild>
                <a href="/profile">View Full Profile</a>
              </Button>
              
              <Button variant="outline" asChild>
                <a href="/profile/billing">Manage Billing</a>
              </Button>
              
              {isGuest && (
                <Button variant="default" asChild>
                  <a href="/auth/signup">Sign Up Now</a>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </PaywallProvider>
  );
}