'use client';

import React from 'react';
import { SimpleAuth } from './simple-auth';

interface OnboardingExperienceProps {
  isGuest?: boolean;
  userId?: string;
  className?: string;
}

export function OnboardingExperience({ 
  isGuest = false, 
  userId, 
  className 
}: OnboardingExperienceProps) {
  // For guest users, show simple authentication
  // All the complex production workflow setup has been removed
  return <SimpleAuth className={className} />;
}