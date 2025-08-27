'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getGuestDataForConversion, clearGuestSession } from '@/lib/guest-session';

interface GuestConversionProps {
  onConversionComplete?: (projectId?: string) => void;
  autoConvert?: boolean;
}

export function GuestConversionHandler({ 
  onConversionComplete,
  autoConvert = true 
}: GuestConversionProps) {
  const router = useRouter();
  const [isConverting, setIsConverting] = useState(false);
  const [hasGuestData, setHasGuestData] = useState(false);

  useEffect(() => {
    const checkGuestData = () => {
      const guestData = getGuestDataForConversion();
      const hasData = !!(guestData?.onboardingData || guestData?.projectData);
      setHasGuestData(hasData);

      if (hasData && autoConvert) {
        convertGuestData(guestData);
      }
    };

    // Small delay to ensure user session is established
    const timer = setTimeout(checkGuestData, 1000);
    return () => clearTimeout(timer);
  }, [autoConvert]);

  const convertGuestData = async (guestData?: any) => {
    if (isConverting) return;

    setIsConverting(true);
    
    try {
      const dataToConvert = guestData || getGuestDataForConversion();
      
      if (!dataToConvert?.onboardingData && !dataToConvert?.projectData) {
        console.log('No guest data to convert');
        setIsConverting(false);
        return;
      }

      const response = await fetch('/api/convert-guest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          guestData: dataToConvert
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to convert guest data');
      }

      const result = await response.json();
      
      if (result.success) {
        // Clear guest session after successful conversion
        clearGuestSession();
        
        console.log('Guest data converted successfully', result);
        
        // Notify completion
        onConversionComplete?.(result.project?.id);
        
        // Redirect to the created project or documents
        if (result.project?.id) {
          router.push(`/documents/${result.project.id}`);
        } else {
          router.push('/documents');
        }
      } else {
        throw new Error(result.error || 'Conversion failed');
      }
    } catch (error) {
      console.error('Error converting guest data:', error);
      // Still redirect to documents on failure
      router.push('/documents');
    } finally {
      setIsConverting(false);
    }
  };

  // This component doesn't render anything visible
  return null;
}

// Hook version for easier use
export function useGuestConversion() {
  const [isConverting, setIsConverting] = useState(false);

  const convertGuestData = async () => {
    if (isConverting) return null;

    setIsConverting(true);
    
    try {
      const guestData = getGuestDataForConversion();
      
      if (!guestData?.onboardingData && !guestData?.projectData) {
        return null;
      }

      const response = await fetch('/api/convert-guest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          guestData
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to convert guest data');
      }

      const result = await response.json();
      
      if (result.success) {
        clearGuestSession();
        return result.project;
      }
      
      throw new Error(result.error || 'Conversion failed');
      
    } catch (error) {
      console.error('Error converting guest data:', error);
      return null;
    } finally {
      setIsConverting(false);
    }
  };

  const hasGuestData = () => {
    const guestData = getGuestDataForConversion();
    return !!(guestData?.onboardingData || guestData?.projectData);
  };

  return {
    convertGuestData,
    isConverting,
    hasGuestData
  };
}