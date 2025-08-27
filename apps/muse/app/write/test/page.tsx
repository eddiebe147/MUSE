'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CanvasInterface } from '@/components/writing-canvas/canvas-interface';
import { FourPhaseInterface } from '@/components/writing-workflow/four-phase-interface';

export default function TestCanvasPage() {
  const [showWorkflow, setShowWorkflow] = useState(false);
  
  // Mock project data for testing
  const initialData = {
    transcript: '',
    phase1: 'Welcome to your new canvas-first writing interface! Start typing here to see the auto-save functionality and real-time statistics in action. This interface now has exactly 3 panels: Unified Knowledge Base (left), Writing Canvas (center), and Streamlined Writing Tools (right).',
    phase2: ['Scene 1: Opening scene', 'Scene 2: Conflict introduction', 'Scene 3: Resolution'],
    phase3: [],
    phase4: null
  };
  
  if (showWorkflow) {
    return (
      <div className="min-h-screen bg-background">
        <div className="absolute top-4 left-4 z-50">
          <Button onClick={() => setShowWorkflow(false)} variant="outline" size="sm">
            ← Back to Canvas Interface
          </Button>
        </div>
        <FourPhaseInterface
          projectId="550e8400-e29b-41d4-a716-446655440001"
          initialData={initialData}
          onExitWorkflow={() => setShowWorkflow(false)}
        />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background">
      <CanvasInterface 
        projectId="550e8400-e29b-41d4-a716-446655440001"
        initialData={initialData}
      />
    </div>
  );
}