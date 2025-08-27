'use client';

import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

export function useProjectContext() {
  const pathname = usePathname();
  
  const projectId = useMemo(() => {
    // Extract project ID from URL patterns like /write/[projectId]
    const writeMatch = pathname.match(/^\/write\/([a-f0-9-]{36})$/i);
    if (writeMatch) {
      return writeMatch[1];
    }
    
    // Add other project URL patterns here as needed
    return null;
  }, [pathname]);

  const hasProject = Boolean(projectId);

  return {
    projectId,
    hasProject
  };
}