export interface ProductionGuideline {
  id: string;
  name: string;
  description: string;
  category: 'formatting' | 'style' | 'content' | 'structure' | 'technical';
  priority: 'low' | 'medium' | 'high' | 'critical';
  rules: GuidelineRule[];
  createdAt: string;
  updatedAt: string;
  projectId?: string; // Optional: guidelines can be global or project-specific
  userId: string;
}

export interface GuidelineRule {
  id: string;
  type: 'format' | 'style' | 'content' | 'structure' | 'validation';
  title: string;
  description: string;
  pattern?: string; // Regex pattern for matching
  replacement?: string; // Replacement text/format
  examples: string[];
  conditions?: RuleCondition[];
  action: 'apply' | 'suggest' | 'validate' | 'warn';
}

export interface RuleCondition {
  field: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'matches' | 'greaterThan' | 'lessThan';
  value: any;
}

export interface ProductionBibleDocument {
  id: string;
  name: string;
  originalFilename: string;
  fileType: 'pdf' | 'docx' | 'txt' | 'md';
  fileSize: number;
  filePath: string;
  uploadedAt: string;
  userId: string;
  projectId?: string;
  extractedRules: GuidelineRule[];
  parsingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  parsingError?: string;
}

export interface RuleApplication {
  ruleId: string;
  documentSection: string;
  originalText: string;
  suggestedText: string;
  confidence: number;
  applied: boolean;
  reason: string;
}

export interface ProductionBibleConfig {
  id: string;
  name: string;
  guidelines: string[]; // Guideline IDs
  priority: number;
  active: boolean;
  projectId?: string;
  userId: string;
}