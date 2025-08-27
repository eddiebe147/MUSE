'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Sparkles, 
  Save, 
  Download, 
  User, 
  ArrowRight, 
  Clock,
  Shield,
  CheckCircle,
  Lightbulb
} from 'lucide-react';
import { FadeIn, Stagger, HoverScale } from '@/components/ui/micro-interactions';
import { ProfessionalCard, StatusIndicator, QualityScore } from '@/components/ui/design-system';
import { getGuestSession, getGuestDataForConversion } from '@/lib/guest-session';

export default function GuestWorkspacePage() {
  const router = useRouter();
  const [guestSession, setGuestSession] = useState<any>(null);
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);

  useEffect(() => {
    const session = getGuestSession();
    setGuestSession(session);
    
    // Show signup prompt after a brief delay
    const timer = setTimeout(() => setShowSignupPrompt(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleSignup = () => {
    router.push('/register?source=guest_workspace');
  };

  const handleContinueAsGuest = () => {
    setShowSignupPrompt(false);
    // Continue with limited functionality
  };

  if (!guestSession?.projectData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <ProfessionalCard className="max-w-md text-center">
          <CardContent className="py-12">
            <h2 className="text-xl font-semibold mb-2">No Project Found</h2>
            <p className="text-muted-foreground mb-4">
              Complete the onboarding flow to create your project.
            </p>
            <Button onClick={() => router.push('/onboarding')}>
              Start Onboarding
            </Button>
          </CardContent>
        </ProfessionalCard>
      </div>
    );
  }

  const { projectData } = guestSession;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-full">
                <Sparkles className="size-5 text-indigo-600" />
              </div>
              <div>
                <h1 className="font-semibold">{projectData.subcategory?.name} Project</h1>
                <p className="text-sm text-muted-foreground">Guest workspace</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400">
                <Clock className="size-3 mr-1" />
                Guest Mode
              </Badge>
              <Button variant="outline" size="sm" onClick={handleSignup}>
                <User className="size-4 mr-2" />
                Sign Up to Save
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Signup Prompt */}
      {showSignupPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <ProfessionalCard variant="feature" className="max-w-lg">
            <CardContent className="py-8">
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center">
                  <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-full">
                    <Save className="size-6 text-indigo-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Save Your Work</h3>
                  <p className="text-muted-foreground">
                    You've created an amazing project! Sign up to save your progress and unlock full MUSE features.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <CheckCircle className="size-4 text-green-600" />
                    <span>Save your project permanently</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <Shield className="size-4 text-blue-600" />
                    <span>Access from any device</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <Sparkles className="size-4 text-purple-600" />
                    <span>Unlock AI-powered features</span>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button variant="outline" onClick={handleContinueAsGuest}>
                    Continue as Guest
                  </Button>
                  <Button onClick={handleSignup}>
                    Sign Up Free
                    <ArrowRight className="size-4 ml-2" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </ProfessionalCard>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FadeIn>
          <div className="space-y-8">
            {/* Welcome Message */}
            <ProfessionalCard variant="feature">
              <CardContent className="py-8">
                <div className="text-center space-y-4">
                  <div className="flex items-center justify-center">
                    <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full">
                      <CheckCircle className="size-8 text-white" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                      Project Created Successfully!
                    </h2>
                    <p className="text-lg text-muted-foreground">
                      Your {projectData.subcategory?.name} development workspace is ready
                    </p>
                  </div>
                  <QualityScore score={100} label="Setup Complete" />
                </div>
              </CardContent>
            </ProfessionalCard>

            {/* Project Summary */}
            <ProfessionalCard>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="size-5 text-yellow-600" />
                  Your Project Setup
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                    <div className="text-sm font-medium text-indigo-600 dark:text-indigo-400">Format</div>
                    <div className="font-semibold">{projectData.subcategory?.name}</div>
                  </div>
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div className="text-sm font-medium text-purple-600 dark:text-purple-400">Category</div>
                    <div className="font-semibold">{projectData.projectType?.name}</div>
                  </div>
                  {projectData.template && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="text-sm font-medium text-blue-600 dark:text-blue-400">Template</div>
                      <div className="font-semibold">{projectData.template.name}</div>
                    </div>
                  )}
                  {projectData.workflow && (
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="text-sm font-medium text-green-600 dark:text-green-400">Timeline</div>
                      <div className="font-semibold">{projectData.workflow.totalEstimatedTime}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </ProfessionalCard>

            {/* Guest Limitations */}
            <Alert>
              <Shield className="size-4" />
              <AlertDescription>
                <strong>Guest Mode:</strong> Your project is temporarily saved in your browser. 
                Sign up to save permanently and unlock full AI features.
              </AlertDescription>
            </Alert>

            {/* Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Stagger>
                <HoverScale>
                  <ProfessionalCard className="cursor-pointer" onClick={handleSignup}>
                    <CardContent className="p-6">
                      <div className="text-center space-y-3">
                        <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-full w-fit mx-auto">
                          <User className="size-6 text-indigo-600" />
                        </div>
                        <h3 className="font-semibold">Sign Up & Save</h3>
                        <p className="text-sm text-muted-foreground">
                          Create your account to save this project permanently
                        </p>
                      </div>
                    </CardContent>
                  </ProfessionalCard>
                </HoverScale>

                <HoverScale>
                  <ProfessionalCard className="cursor-pointer opacity-75">
                    <CardContent className="p-6">
                      <div className="text-center space-y-3">
                        <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full w-fit mx-auto">
                          <Download className="size-6 text-gray-600" />
                        </div>
                        <h3 className="font-semibold">Export Project</h3>
                        <p className="text-sm text-muted-foreground">
                          Download your project data (requires signup)
                        </p>
                      </div>
                    </CardContent>
                  </ProfessionalCard>
                </HoverScale>

                <HoverScale>
                  <ProfessionalCard className="cursor-pointer" onClick={() => router.push('/onboarding')}>
                    <CardContent className="p-6">
                      <div className="text-center space-y-3">
                        <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full w-fit mx-auto">
                          <Sparkles className="size-6 text-green-600" />
                        </div>
                        <h3 className="font-semibold">Create New Project</h3>
                        <p className="text-sm text-muted-foreground">
                          Start a different type of story project
                        </p>
                      </div>
                    </CardContent>
                  </ProfessionalCard>
                </HoverScale>
              </Stagger>
            </div>
          </div>
        </FadeIn>
      </main>
    </div>
  );
}