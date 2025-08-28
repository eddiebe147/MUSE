'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User,
  Crown,
  CreditCard,
  Settings,
  BarChart3,
  FileText,
  Zap,
  Calendar,
  Mail,
  Edit,
  Check,
  X,
  ArrowUpRight,
  Download,
  Users
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProfile } from '@/contexts/profile-context';
import { PRICING_PLANS, TIER_FEATURES } from '@/types/profile';

interface ProfileDashboardProps {
  className?: string;
}

export function ProfileDashboard({ className }: ProfileDashboardProps) {
  const { profile, usage, features, refreshProfile, loading } = useProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: profile?.name || '',
    email: profile?.email || '',
  });

  if (loading || !profile) {
    return <div className="p-8 text-center">Loading profile...</div>;
  }

  const currentPlan = PRICING_PLANS[profile.tier as keyof typeof PRICING_PLANS];
  const isSubscribed = profile.tier === 'pro' || profile.tier === 'team';

  const handleSaveProfile = async () => {
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      });
      
      if (response.ok) {
        await refreshProfile();
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const getUsageColor = (used: number, limit: number, unlimited: boolean) => {
    if (unlimited) return 'text-green-600';
    const percentage = (used / limit) * 100;
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getUsagePercentage = (used: number, limit: number, unlimited: boolean) => {
    if (unlimited) return 0;
    return Math.min((used / limit) * 100, 100);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className={cn("max-w-6xl mx-auto space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Profile & Settings</h1>
          <p className="text-muted-foreground">Manage your account and subscription</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge 
            variant={isSubscribed ? 'default' : 'secondary'}
            className={cn(
              "px-3 py-1",
              profile.tier === 'pro' && "bg-purple-600",
              profile.tier === 'team' && "bg-blue-600",
            )}
          >
            {profile.tier === 'pro' && <Crown className="size-3 mr-1" />}
            {profile.tier === 'team' && <Users className="size-3 mr-1" />}
            {currentPlan?.name || 'Free Plan'}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="size-5" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={editData.name}
                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                        placeholder="Enter your name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={editData.email}
                        onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                        placeholder="Enter your email"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSaveProfile} size="sm">
                        <Check className="size-4 mr-1" />
                        Save
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setIsEditing(false)} 
                        size="sm"
                      >
                        <X className="size-4 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Name</span>
                        <span className="font-medium">{profile.name || 'Not set'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Email</span>
                        <span className="font-medium">{profile.email}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Member since</span>
                        <span className="font-medium">
                          {new Date(profile.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                      <Edit className="size-4 mr-1" />
                      Edit Profile
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="size-5" />
                  Current Plan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-bold">{currentPlan?.name}</h3>
                  <div className="text-3xl font-bold">
                    ${currentPlan?.price}
                    <span className="text-lg text-muted-foreground">/{currentPlan?.interval}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Features included:</h4>
                  <ul className="space-y-1">
                    {currentPlan?.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <Check className="size-3 text-green-600" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {!isSubscribed && (
                  <Button className="w-full" asChild>
                    <a href="/profile/billing?upgrade=pro">
                      <Crown className="size-4 mr-2" />
                      Upgrade Plan
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Usage Tab */}
        <TabsContent value="usage">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="size-5" />
                  Usage Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {usage && (
                  <>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">ARC Analyses</span>
                        <span className={cn("text-sm", getUsageColor(usage.arcAnalyses.used, usage.arcAnalyses.limit, usage.arcAnalyses.unlimited))}>
                          {usage.arcAnalyses.unlimited 
                            ? `${usage.arcAnalyses.used} / Unlimited`
                            : `${usage.arcAnalyses.used} / ${usage.arcAnalyses.limit}`
                          }
                        </span>
                      </div>
                      {!usage.arcAnalyses.unlimited && (
                        <Progress 
                          value={getUsagePercentage(usage.arcAnalyses.used, usage.arcAnalyses.limit, usage.arcAnalyses.unlimited)} 
                          className="h-2"
                        />
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Projects</span>
                        <span className={cn("text-sm", getUsageColor(usage.projects.used, usage.projects.limit, usage.projects.unlimited))}>
                          {usage.projects.unlimited 
                            ? `${usage.projects.used} / Unlimited`
                            : `${usage.projects.used} / ${usage.projects.limit}`
                          }
                        </span>
                      </div>
                      {!usage.projects.unlimited && (
                        <Progress 
                          value={getUsagePercentage(usage.projects.used, usage.projects.limit, usage.projects.unlimited)} 
                          className="h-2"
                        />
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Exports</span>
                        <span className={cn("text-sm", getUsageColor(usage.exports.used, usage.exports.limit, usage.exports.unlimited))}>
                          {usage.exports.unlimited 
                            ? `${usage.exports.used} / Unlimited`
                            : `${usage.exports.used} / ${usage.exports.limit}`
                          }
                        </span>
                      </div>
                      {!usage.exports.unlimited && (
                        <Progress 
                          value={getUsagePercentage(usage.exports.used, usage.exports.limit, usage.exports.unlimited)} 
                          className="h-2"
                        />
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Storage</span>
                        <span className={cn("text-sm", getUsageColor(usage.storageSize.used, usage.storageSize.limit, usage.storageSize.unlimited))}>
                          {usage.storageSize.unlimited 
                            ? `${formatBytes(usage.storageSize.used)} / Unlimited`
                            : `${formatBytes(usage.storageSize.used)} / ${formatBytes(usage.storageSize.limit)}`
                          }
                        </span>
                      </div>
                      {!usage.storageSize.unlimited && (
                        <Progress 
                          value={getUsagePercentage(usage.storageSize.used, usage.storageSize.limit, usage.storageSize.unlimited)} 
                          className="h-2"
                        />
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="size-5" />
                  Feature Access
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {features && Object.entries(features).map(([feature, enabled]) => (
                  <div key={feature} className="flex items-center justify-between">
                    <span className="text-sm capitalize">{feature.replace(/([A-Z])/g, ' $1').trim()}</span>
                    {enabled ? (
                      <Check className="size-4 text-green-600" />
                    ) : (
                      <X className="size-4 text-red-400" />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="size-5" />
                Billing & Subscription
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center space-y-4">
                <h3 className="text-xl font-semibold">Subscription Management</h3>
                <p className="text-muted-foreground">
                  {isSubscribed 
                    ? 'Manage your subscription and billing information'
                    : 'Upgrade to unlock all features and remove limits'
                  }
                </p>

                <div className="flex gap-4 justify-center">
                  {!isSubscribed ? (
                    <>
                      <Button size="lg" asChild>
                        <a href="/profile/billing?upgrade=pro">
                          <Crown className="size-4 mr-2" />
                          Upgrade to Pro
                        </a>
                      </Button>
                      <Button variant="outline" size="lg" asChild>
                        <a href="/profile/billing?upgrade=team">
                          <Users className="size-4 mr-2" />
                          Upgrade to Team
                        </a>
                      </Button>
                    </>
                  ) : (
                    <Button variant="outline" asChild>
                      <a href="/profile/billing/manage">
                        <Settings className="size-4 mr-2" />
                        Manage Subscription
                        <ArrowUpRight className="size-4 ml-2" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="size-5" />
                  Account Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">Data & Privacy</h4>
                  <Button variant="outline" size="sm">
                    <Download className="size-4 mr-2" />
                    Export Data
                  </Button>
                  <Button variant="destructive" size="sm">
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="size-5" />
                  Notifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Notification settings coming soon...
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}