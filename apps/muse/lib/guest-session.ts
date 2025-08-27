'use client';

export interface GuestSession {
  id: string;
  createdAt: string;
  projectData?: any;
  onboardingData?: any;
  lastActivity: string;
}

const GUEST_SESSION_KEY = 'muse_guest_session';

/**
 * Sanitize data to prevent circular reference errors in JSON.stringify
 */
function sanitizeData(data: any): any {
  if (data === null || data === undefined) return data;
  
  if (typeof data === 'function') return undefined;
  
  // Check for React elements/components
  if (typeof data === 'object' && data.$$typeof) return undefined;
  
  if (data instanceof HTMLElement) return undefined;
  
  if (typeof data === 'object') {
    // Check for circular references and React fibers
    if (data.hasOwnProperty('$$typeof') || 
        data.hasOwnProperty('_reactInternalFiber') || 
        data.hasOwnProperty('__reactFiber$') ||
        data.constructor?.name === 'FiberNode') {
      return undefined;
    }
    
    if (Array.isArray(data)) {
      return data.map(sanitizeData).filter(item => item !== undefined);
    }
    
    const cleaned: any = {};
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        const value = sanitizeData(data[key]);
        if (value !== undefined) {
          cleaned[key] = value;
        }
      }
    }
    return cleaned;
  }
  
  return data;
}

/**
 * Generate a unique guest session ID
 */
function generateGuestId(): string {
  return `guest_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Get or create guest session
 */
export function getGuestSession(): GuestSession {
  if (typeof window === 'undefined') {
    // Server-side fallback
    return {
      id: generateGuestId(),
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString()
    };
  }

  try {
    const stored = localStorage.getItem(GUEST_SESSION_KEY);
    if (stored) {
      const session = JSON.parse(stored);
      // Update last activity
      session.lastActivity = new Date().toISOString();
      localStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(sanitizeData(session)));
      return session;
    }
  } catch (error) {
    console.warn('Failed to parse guest session:', error);
  }

  // Create new guest session
  const newSession: GuestSession = {
    id: generateGuestId(),
    createdAt: new Date().toISOString(),
    lastActivity: new Date().toISOString()
  };

  try {
    localStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(sanitizeData(newSession)));
  } catch (error) {
    console.warn('Failed to save guest session:', error);
  }

  return newSession;
}

/**
 * Update guest session data
 */
export function updateGuestSession(updates: Partial<GuestSession>): void {
  if (typeof window === 'undefined') return;

  try {
    const current = getGuestSession();
    const updated = {
      ...current,
      ...updates,
      lastActivity: new Date().toISOString()
    };
    localStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(sanitizeData(updated)));
  } catch (error) {
    console.warn('Failed to update guest session:', error);
  }
}

/**
 * Save onboarding data to guest session
 */
export function saveGuestOnboardingData(data: any): void {
  updateGuestSession({
    onboardingData: data
  });
}

/**
 * Save project data to guest session
 */
export function saveGuestProjectData(data: any): void {
  updateGuestSession({
    projectData: data
  });
}

/**
 * Clear guest session
 */
export function clearGuestSession(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(GUEST_SESSION_KEY);
  } catch (error) {
    console.warn('Failed to clear guest session:', error);
  }
}

/**
 * Convert guest session to user account
 */
export function getGuestDataForConversion(): { onboardingData?: any; projectData?: any } | null {
  const session = getGuestSession();
  return {
    onboardingData: session.onboardingData,
    projectData: session.projectData
  };
}

/**
 * Check if session is a guest session
 */
export function isGuestSession(sessionId: string): boolean {
  return sessionId.startsWith('guest_');
}

/**
 * Get guest session age in minutes
 */
export function getGuestSessionAge(): number {
  const session = getGuestSession();
  const created = new Date(session.createdAt);
  const now = new Date();
  return Math.floor((now.getTime() - created.getTime()) / (1000 * 60));
}

/**
 * Should prompt for signup based on activity
 */
export function shouldPromptSignup(): boolean {
  const session = getGuestSession();
  
  // Prompt if they have significant onboarding or project data
  if (session.onboardingData || session.projectData) {
    return true;
  }

  // Prompt after 10 minutes of activity
  const age = getGuestSessionAge();
  return age >= 10;
}