/**
 * Two-Tier Knowledge Base Storage System
 * Separates global guidelines from story-specific content while preserving existing functionality
 */

export interface KnowledgeFile {
  id: string;
  name: string;
  type: 'document' | 'transcript' | 'character' | 'guideline' | 'note' | 'draft';
  content?: string;
  tags: string[];
  size: number;
  createdAt: Date;
  updatedAt: Date;
  lastAccessed?: Date;
  starred: boolean;
  preview?: string;
  versionCount?: number;
  tier: 'global' | 'story'; // New field to identify storage tier
  projectId?: string; // Only for story-specific files
}

export interface TwoTierKnowledgeBase {
  global: KnowledgeFile[];
  story: KnowledgeFile[];
}

class TwoTierStorageManager {
  private readonly GLOBAL_STORAGE_KEY = 'muse_global_knowledge_base';
  private readonly STORY_STORAGE_KEY_PREFIX = 'muse_story_knowledge_';

  /**
   * Get the storage key for a specific project's story files
   */
  private getStoryStorageKey(projectId: string): string {
    return `${this.STORY_STORAGE_KEY_PREFIX}${projectId}`;
  }

  /**
   * Load global knowledge base files (available to all stories)
   */
  loadGlobalKnowledge(): KnowledgeFile[] {
    try {
      const stored = localStorage.getItem(this.GLOBAL_STORAGE_KEY);
      if (!stored) return this.getDefaultGlobalKnowledge();
      
      const files = JSON.parse(stored);
      
      // Validate data structure
      if (!Array.isArray(files)) {
        console.warn('Invalid global knowledge data structure, resetting to defaults');
        return this.getDefaultGlobalKnowledge();
      }
      
      return files.map((file: any) => {
        // Validate required fields
        if (!file.id || !file.name || !file.type) {
          console.warn('Invalid file data found in global knowledge, skipping:', file);
          return null;
        }
        
        return {
          ...file,
          createdAt: new Date(file.createdAt || Date.now()),
          updatedAt: new Date(file.updatedAt || Date.now()),
          lastAccessed: file.lastAccessed ? new Date(file.lastAccessed) : undefined,
          tier: 'global',
          tags: Array.isArray(file.tags) ? file.tags : [],
          starred: Boolean(file.starred),
          size: Number(file.size) || 0
        };
      }).filter(Boolean) as KnowledgeFile[];
    } catch (error) {
      console.error('Failed to load global knowledge base:', error);
      return this.getDefaultGlobalKnowledge();
    }
  }

  /**
   * Load story-specific knowledge base files for a project
   */
  loadStoryKnowledge(projectId: string): KnowledgeFile[] {
    if (!projectId || typeof projectId !== 'string') {
      console.warn('Invalid projectId provided to loadStoryKnowledge');
      return [];
    }

    try {
      const stored = localStorage.getItem(this.getStoryStorageKey(projectId));
      if (!stored) return [];
      
      const files = JSON.parse(stored);
      
      // Validate data structure
      if (!Array.isArray(files)) {
        console.warn(`Invalid story knowledge data structure for project ${projectId}, returning empty array`);
        return [];
      }
      
      return files.map((file: any) => {
        // Validate required fields
        if (!file.id || !file.name || !file.type) {
          console.warn(`Invalid file data found in story knowledge for project ${projectId}, skipping:`, file);
          return null;
        }
        
        return {
          ...file,
          createdAt: new Date(file.createdAt || Date.now()),
          updatedAt: new Date(file.updatedAt || Date.now()),
          lastAccessed: file.lastAccessed ? new Date(file.lastAccessed) : undefined,
          tier: 'story',
          projectId,
          tags: Array.isArray(file.tags) ? file.tags : [],
          starred: Boolean(file.starred),
          size: Number(file.size) || 0
        };
      }).filter(Boolean) as KnowledgeFile[];
    } catch (error) {
      console.error('Failed to load story knowledge base:', error);
      return [];
    }
  }

  /**
   * Load combined knowledge base for Active Guidelines compatibility
   * This preserves the existing API that Active Guidelines expects
   */
  loadCombinedKnowledge(projectId: string): KnowledgeFile[] {
    const globalFiles = this.loadGlobalKnowledge();
    const storyFiles = this.loadStoryKnowledge(projectId);
    return [...globalFiles, ...storyFiles];
  }

  /**
   * Save global knowledge base files
   */
  saveGlobalKnowledge(files: KnowledgeFile[]): boolean {
    try {
      if (!Array.isArray(files)) {
        console.error('Invalid data provided to saveGlobalKnowledge: expected array');
        return false;
      }

      const globalFiles = files.filter(file => file.tier === 'global');
      const dataString = JSON.stringify(globalFiles);
      
      // Check data size (warn if approaching localStorage limits)
      if (dataString.length > 5000000) { // ~5MB warning threshold
        console.warn('Global knowledge base approaching storage limits:', dataString.length, 'characters');
      }
      
      localStorage.setItem(this.GLOBAL_STORAGE_KEY, dataString);
      return true;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
          console.error('Storage quota exceeded while saving global knowledge base');
          // Could trigger a cleanup or user notification here
        } else {
          console.error('Failed to save global knowledge base:', error.message);
        }
      } else {
        console.error('Failed to save global knowledge base:', error);
      }
      return false;
    }
  }

  /**
   * Save story-specific knowledge base files
   */
  saveStoryKnowledge(projectId: string, files: KnowledgeFile[]): boolean {
    if (!projectId || typeof projectId !== 'string') {
      console.error('Invalid projectId provided to saveStoryKnowledge');
      return false;
    }

    try {
      if (!Array.isArray(files)) {
        console.error('Invalid data provided to saveStoryKnowledge: expected array');
        return false;
      }

      const storyFiles = files.filter(file => file.tier === 'story' && file.projectId === projectId);
      const dataString = JSON.stringify(storyFiles);
      
      // Check data size (warn if approaching localStorage limits)
      if (dataString.length > 5000000) { // ~5MB warning threshold
        console.warn(`Story knowledge base for project ${projectId} approaching storage limits:`, dataString.length, 'characters');
      }
      
      localStorage.setItem(this.getStoryStorageKey(projectId), dataString);
      return true;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
          console.error(`Storage quota exceeded while saving story knowledge base for project ${projectId}`);
          // Could trigger a cleanup or user notification here
        } else {
          console.error('Failed to save story knowledge base:', error.message);
        }
      } else {
        console.error('Failed to save story knowledge base:', error);
      }
      return false;
    }
  }

  /**
   * Add a file to the appropriate tier
   */
  addFile(file: KnowledgeFile, tier: 'global' | 'story', projectId?: string): void {
    const fileWithTier = {
      ...file,
      tier,
      projectId: tier === 'story' ? projectId : undefined
    };

    if (tier === 'global') {
      const globalFiles = this.loadGlobalKnowledge();
      globalFiles.push(fileWithTier);
      this.saveGlobalKnowledge(globalFiles);
    } else if (tier === 'story' && projectId) {
      const storyFiles = this.loadStoryKnowledge(projectId);
      storyFiles.push(fileWithTier);
      this.saveStoryKnowledge(projectId, storyFiles);
    }
  }

  /**
   * Update a file in the appropriate tier
   */
  updateFile(file: KnowledgeFile): void {
    if (file.tier === 'global') {
      const globalFiles = this.loadGlobalKnowledge();
      const index = globalFiles.findIndex(f => f.id === file.id);
      if (index !== -1) {
        globalFiles[index] = { ...file, updatedAt: new Date() };
        this.saveGlobalKnowledge(globalFiles);
      }
    } else if (file.tier === 'story' && file.projectId) {
      const storyFiles = this.loadStoryKnowledge(file.projectId);
      const index = storyFiles.findIndex(f => f.id === file.id);
      if (index !== -1) {
        storyFiles[index] = { ...file, updatedAt: new Date() };
        this.saveStoryKnowledge(file.projectId, storyFiles);
      }
    }
  }

  /**
   * Delete a file from the appropriate tier
   */
  deleteFile(fileId: string, tier: 'global' | 'story', projectId?: string): void {
    if (tier === 'global') {
      const globalFiles = this.loadGlobalKnowledge().filter(f => f.id !== fileId);
      this.saveGlobalKnowledge(globalFiles);
    } else if (tier === 'story' && projectId) {
      const storyFiles = this.loadStoryKnowledge(projectId).filter(f => f.id !== fileId);
      this.saveStoryKnowledge(projectId, storyFiles);
    }
  }

  /**
   * Move a file between tiers
   */
  moveFile(fileId: string, fromTier: 'global' | 'story', toTier: 'global' | 'story', projectId?: string): void {
    let file: KnowledgeFile | undefined;

    // Find and remove from source tier
    if (fromTier === 'global') {
      const globalFiles = this.loadGlobalKnowledge();
      const index = globalFiles.findIndex(f => f.id === fileId);
      if (index !== -1) {
        file = globalFiles.splice(index, 1)[0];
        this.saveGlobalKnowledge(globalFiles);
      }
    } else if (fromTier === 'story' && projectId) {
      const storyFiles = this.loadStoryKnowledge(projectId);
      const index = storyFiles.findIndex(f => f.id === fileId);
      if (index !== -1) {
        file = storyFiles.splice(index, 1)[0];
        this.saveStoryKnowledge(projectId, storyFiles);
      }
    }

    // Add to destination tier
    if (file) {
      file.tier = toTier;
      file.projectId = toTier === 'story' ? projectId : undefined;
      this.addFile(file, toTier, projectId);
    }
  }

  /**
   * Default global knowledge base with network standards and universal guidelines
   */
  private getDefaultGlobalKnowledge(): KnowledgeFile[] {
    return [
      {
        id: 'global_network_treatment_standards',
        name: 'Network_Treatment_Standards.txt',
        type: 'guideline',
        content: `NETWORK TREATMENT STANDARDS

FORMAT REQUIREMENTS:
- Format: 12pt Courier font, 1.5 line spacing
- Voice SHOULD be present tense, active voice
- REQUIRED: Executive summary on page 1
    
STYLE GUIDELINES:
- Tone MUST match network brand (sophisticated, character-driven)
- NEVER use technical jargon or industry slang
- Character motivations SHOULD be clear in every scene
- Dialogue examples MUST sound authentic to character demographics`,
        tags: ['guideline', 'network', 'treatment', 'active'],
        size: 3420,
        createdAt: new Date('2024-02-20'),
        updatedAt: new Date('2024-02-22'),
        lastAccessed: new Date('2024-02-22'),
        starred: true,
        preview: 'NETWORK TREATMENT STANDARDS - Format requirements...',
        versionCount: 2,
        tier: 'global'
      },
      {
        id: 'global_voice_style_bible',
        name: 'Voice_Style_Bible.txt',
        type: 'guideline',
        content: `WRITING VOICE GUIDELINES
    
TONE: Contemporary, grounded, emotionally honest
STYLE: Present tense, immersive POV
CHARACTER VOICE: Each character MUST have distinct speech patterns
NEVER use: excessive exposition, on-the-nose dialogue
ALWAYS: Show don't tell, subtext over text
REQUIRED: Authentic regional dialects when appropriate
    
STRUCTURE RULES:
- Scenes SHOULD start in media res
- MUST end each scene with forward momentum
- Conflict in every scene - internal or external
- Character growth MUST be visible through action`,
        tags: ['guideline', 'voice', 'style', 'active'],
        size: 2890,
        createdAt: new Date('2024-02-18'),
        updatedAt: new Date('2024-02-18'),
        starred: true,
        preview: 'WRITING VOICE GUIDELINES - Tone and style requirements...',
        tier: 'global'
      },
      {
        id: 'global_screenplay_format_guide',
        name: 'Screenplay_Format_Guide.txt',
        type: 'guideline',
        content: `PROFESSIONAL SCREENPLAY FORMAT

SCENE HEADINGS:
- Format: INT./EXT. LOCATION - TIME OF DAY
- Always in ALL CAPS
- New scene = new page unless very brief

CHARACTER NAMES:
- ALL CAPS when first introduced in action
- ALL CAPS above dialogue
- Consistent names throughout (no nicknames in action)

DIALOGUE:
- Double-spaced from character name
- Single-spaced within dialogue blocks
- Parentheticals sparingly - only for clarity

ACTION LINES:
- Present tense, active voice
- Brief, visual descriptions only
- Keep to 4 lines maximum per block`,
        tags: ['guideline', 'screenplay', 'format', 'active'],
        size: 2156,
        createdAt: new Date('2024-02-15'),
        updatedAt: new Date('2024-02-15'),
        starred: true,
        preview: 'PROFESSIONAL SCREENPLAY FORMAT - Industry standard formatting...',
        tier: 'global'
      }
    ];
  }
}

// Export singleton instance
export const twoTierStorage = new TwoTierStorageManager();