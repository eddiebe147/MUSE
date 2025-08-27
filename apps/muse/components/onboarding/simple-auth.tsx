'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Sparkles,
  BookOpen,
  FileText,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SimpleAuthProps {
  className?: string;
}

export function SimpleAuth({ className }: SimpleAuthProps) {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const endpoint = isSignUp ? '/api/auth/signup' : '/api/auth/signin';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        // After successful auth, redirect to writing interface
        router.push('/write');
      } else {
        const error = await response.json();
        console.error('Auth error:', error);
      }
    } catch (error) {
      console.error('Auth request failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className={cn("min-h-screen bg-background flex items-center justify-center p-6", className)}>
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="size-8 text-purple-600" />
            <h1 className="text-3xl font-bold">MUSE</h1>
          </div>
          <p className="text-xl text-muted-foreground">
            AI Story Development
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Sign in to start creating your stories
          </p>
        </div>

        {/* Auth Card */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4 mb-6">
              <h2 className="text-xl font-semibold text-center">
                {isSignUp ? 'Create Account' : 'Sign In'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required={isSignUp}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  required
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="size-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {isSignUp ? 'Creating Account...' : 'Signing In...'}
                  </>
                ) : (
                  <>
                    {isSignUp ? 'Create Account' : 'Sign In'}
                    <ArrowRight className="size-4 ml-2" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6">
              <Separator />
              <div className="text-center mt-4">
                <Button
                  variant="link"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-sm"
                >
                  {isSignUp 
                    ? 'Already have an account? Sign in' 
                    : "Don't have an account? Sign up"
                  }
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* What You'll Get */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground mb-4">What you'll get:</p>
          <div className="flex justify-center gap-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <BookOpen className="size-3" />
              <span>4-Phase Workflow</span>
            </div>
            <div className="flex items-center gap-1">
              <FileText className="size-3" />
              <span>AI Co-Writing</span>
            </div>
            <div className="flex items-center gap-1">
              <Sparkles className="size-3" />
              <span>Story Intelligence</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}