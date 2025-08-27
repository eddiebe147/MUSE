import { ProductionBibleRule, ProductionBibleApplication } from '@muse/db';

export interface DocumentContent {
  executiveSummary: any;
  narrativeStructure: any;
  productionPackage: any;
  phase?: number;
  section?: string;
}

export interface RuleApplicationResult {
  ruleId: string;
  documentSection: string;
  originalText: string;
  suggestedText: string;
  confidence: number;
  applied: boolean;
  reason: string;
}

export interface ValidationResult {
  isValid: boolean;
  violations: RuleViolation[];
  suggestions: RuleSuggestion[];
  warnings: RuleWarning[];
}

export interface RuleViolation {
  ruleId: string;
  ruleTitle: string;
  section: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  suggestedFix?: string;
}

export interface RuleSuggestion {
  ruleId: string;
  ruleTitle: string;
  section: string;
  description: string;
  suggestedChange: string;
  confidence: number;
}

export interface RuleWarning {
  ruleId: string;
  ruleTitle: string;
  section: string;
  description: string;
  impact: string;
}

class RuleEngine {
  private rules: ProductionBibleRule[] = [];

  async loadRules(rules: ProductionBibleRule[]): Promise<void> {
    this.rules = rules.filter(rule => rule.is_active);
  }

  async applyRules(content: DocumentContent): Promise<{
    modifiedContent: DocumentContent;
    applications: RuleApplicationResult[];
  }> {
    let modifiedContent = JSON.parse(JSON.stringify(content)); // Deep clone
    const applications: RuleApplicationResult[] = [];

    for (const rule of this.rules) {
      if (rule.action === 'apply') {
        const result = await this.applyRule(rule, modifiedContent);
        if (result) {
          modifiedContent = result.content;
          applications.push(result.application);
        }
      }
    }

    return {
      modifiedContent,
      applications
    };
  }

  async validateContent(content: DocumentContent): Promise<ValidationResult> {
    const violations: RuleViolation[] = [];
    const suggestions: RuleSuggestion[] = [];
    const warnings: RuleWarning[] = [];

    for (const rule of this.rules) {
      const result = await this.validateRule(rule, content);
      
      switch (rule.action) {
        case 'validate':
          if (result && !result.passes) {
            violations.push({
              ruleId: rule.id,
              ruleTitle: rule.title,
              section: result.section,
              description: rule.description,
              severity: rule.priority,
              suggestedFix: result.suggestedFix
            });
          }
          break;
          
        case 'suggest':
          if (result && result.suggestion) {
            suggestions.push({
              ruleId: rule.id,
              ruleTitle: rule.title,
              section: result.section,
              description: rule.description,
              suggestedChange: result.suggestion,
              confidence: rule.confidence || 70
            });
          }
          break;
          
        case 'warn':
          if (result && result.warning) {
            warnings.push({
              ruleId: rule.id,
              ruleTitle: rule.title,
              section: result.section,
              description: rule.description,
              impact: result.warning
            });
          }
          break;
      }
    }

    return {
      isValid: violations.length === 0,
      violations,
      suggestions,
      warnings
    };
  }

  private async applyRule(rule: ProductionBibleRule, content: DocumentContent): Promise<{
    content: DocumentContent;
    application: RuleApplicationResult;
  } | null> {
    const textContent = this.extractTextFromContent(content);
    
    if (!rule.pattern) {
      return null; // Can't apply rule without pattern
    }

    try {
      const regex = new RegExp(rule.pattern, 'gi');
      let match;
      let hasChanges = false;
      
      while ((match = regex.exec(textContent)) !== null) {
        if (rule.replacement) {
          const originalText = match[0];
          const suggestedText = rule.replacement;
          
          // Apply the replacement to the content
          const modifiedContent = this.replaceInContent(content, originalText, suggestedText);
          
          if (modifiedContent) {
            hasChanges = true;
            return {
              content: modifiedContent,
              application: {
                ruleId: rule.id,
                documentSection: this.findSection(content, originalText),
                originalText,
                suggestedText,
                confidence: rule.confidence || 70,
                applied: true,
                reason: rule.description
              }
            };
          }
        }
      }

      return null;
    } catch (error) {
      console.error(`Error applying rule ${rule.id}:`, error);
      return null;
    }
  }

  private async validateRule(rule: ProductionBibleRule, content: DocumentContent): Promise<{
    passes: boolean;
    section: string;
    suggestedFix?: string;
    suggestion?: string;
    warning?: string;
  } | null> {
    const textContent = this.extractTextFromContent(content);
    
    if (!rule.pattern) {
      return null;
    }

    try {
      const regex = new RegExp(rule.pattern, 'gi');
      const matches = textContent.match(regex);
      
      if (rule.action === 'validate') {
        // For validation rules, matches indicate violations
        if (matches && matches.length > 0) {
          return {
            passes: false,
            section: this.findSection(content, matches[0]),
            suggestedFix: rule.replacement || `Fix ${rule.title.toLowerCase()}`
          };
        }
        return { passes: true, section: '' };
      }
      
      if (rule.action === 'suggest') {
        // For suggestion rules, matches indicate opportunities for improvement
        if (matches && matches.length > 0) {
          return {
            passes: true,
            section: this.findSection(content, matches[0]),
            suggestion: rule.replacement || `Consider applying ${rule.title.toLowerCase()}`
          };
        }
        return null;
      }
      
      if (rule.action === 'warn') {
        // For warning rules, matches indicate potential issues
        if (matches && matches.length > 0) {
          return {
            passes: true,
            section: this.findSection(content, matches[0]),
            warning: `Potential issue detected: ${rule.description}`
          };
        }
        return null;
      }

      return null;
    } catch (error) {
      console.error(`Error validating rule ${rule.id}:`, error);
      return null;
    }
  }

  private extractTextFromContent(content: DocumentContent): string {
    const texts: string[] = [];
    
    // Extract text from all sections
    if (content.executiveSummary) {
      texts.push(this.extractTextFromObject(content.executiveSummary));
    }
    
    if (content.narrativeStructure) {
      texts.push(this.extractTextFromObject(content.narrativeStructure));
    }
    
    if (content.productionPackage) {
      texts.push(this.extractTextFromObject(content.productionPackage));
    }
    
    return texts.join('\n\n');
  }

  private extractTextFromObject(obj: any): string {
    if (typeof obj === 'string') {
      return obj;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.extractTextFromObject(item)).join('\n');
    }
    
    if (typeof obj === 'object' && obj !== null) {
      return Object.values(obj)
        .map(value => this.extractTextFromObject(value))
        .join('\n');
    }
    
    return '';
  }

  private findSection(content: DocumentContent, text: string): string {
    // Try to identify which section contains the text
    const executiveText = content.executiveSummary ? this.extractTextFromObject(content.executiveSummary) : '';
    const narrativeText = content.narrativeStructure ? this.extractTextFromObject(content.narrativeStructure) : '';
    const productionText = content.productionPackage ? this.extractTextFromObject(content.productionPackage) : '';
    
    if (executiveText.includes(text)) {
      return 'Executive Summary';
    } else if (narrativeText.includes(text)) {
      return 'Narrative Structure';
    } else if (productionText.includes(text)) {
      return 'Production Package';
    }
    
    return 'Document';
  }

  private replaceInContent(content: DocumentContent, originalText: string, newText: string): DocumentContent | null {
    const modifiedContent = JSON.parse(JSON.stringify(content));
    let hasChanges = false;

    // Replace in all sections
    if (modifiedContent.executiveSummary) {
      const result = this.replaceInObject(modifiedContent.executiveSummary, originalText, newText);
      if (result.changed) {
        modifiedContent.executiveSummary = result.object;
        hasChanges = true;
      }
    }

    if (modifiedContent.narrativeStructure) {
      const result = this.replaceInObject(modifiedContent.narrativeStructure, originalText, newText);
      if (result.changed) {
        modifiedContent.narrativeStructure = result.object;
        hasChanges = true;
      }
    }

    if (modifiedContent.productionPackage) {
      const result = this.replaceInObject(modifiedContent.productionPackage, originalText, newText);
      if (result.changed) {
        modifiedContent.productionPackage = result.object;
        hasChanges = true;
      }
    }

    return hasChanges ? modifiedContent : null;
  }

  private replaceInObject(obj: any, originalText: string, newText: string): { object: any; changed: boolean } {
    if (typeof obj === 'string') {
      if (obj.includes(originalText)) {
        return {
          object: obj.replace(new RegExp(originalText, 'g'), newText),
          changed: true
        };
      }
      return { object: obj, changed: false };
    }

    if (Array.isArray(obj)) {
      let changed = false;
      const newArray = obj.map(item => {
        const result = this.replaceInObject(item, originalText, newText);
        if (result.changed) changed = true;
        return result.object;
      });
      return { object: newArray, changed };
    }

    if (typeof obj === 'object' && obj !== null) {
      let changed = false;
      const newObject: any = {};
      for (const [key, value] of Object.entries(obj)) {
        const result = this.replaceInObject(value, originalText, newText);
        if (result.changed) changed = true;
        newObject[key] = result.object;
      }
      return { object: newObject, changed };
    }

    return { object: obj, changed: false };
  }

  // Utility methods for specific rule types
  async applyFormattingRules(content: DocumentContent): Promise<DocumentContent> {
    const formatRules = this.rules.filter(rule => rule.rule_type === 'format');
    let modifiedContent = content;

    for (const rule of formatRules) {
      const result = await this.applyRule(rule, modifiedContent);
      if (result) {
        modifiedContent = result.content;
      }
    }

    return modifiedContent;
  }

  async validateStructure(content: DocumentContent): Promise<RuleViolation[]> {
    const structureRules = this.rules.filter(rule => rule.rule_type === 'structure');
    const violations: RuleViolation[] = [];

    for (const rule of structureRules) {
      const result = await this.validateRule(rule, content);
      if (result && !result.passes) {
        violations.push({
          ruleId: rule.id,
          ruleTitle: rule.title,
          section: result.section,
          description: rule.description,
          severity: rule.priority,
          suggestedFix: result.suggestedFix
        });
      }
    }

    return violations;
  }

  async getSuggestions(content: DocumentContent): Promise<RuleSuggestion[]> {
    const suggestionRules = this.rules.filter(rule => rule.action === 'suggest');
    const suggestions: RuleSuggestion[] = [];

    for (const rule of suggestionRules) {
      const result = await this.validateRule(rule, content);
      if (result && result.suggestion) {
        suggestions.push({
          ruleId: rule.id,
          ruleTitle: rule.title,
          section: result.section,
          description: rule.description,
          suggestedChange: result.suggestion,
          confidence: rule.confidence || 70
        });
      }
    }

    return suggestions;
  }
}

export const ruleEngine = new RuleEngine();