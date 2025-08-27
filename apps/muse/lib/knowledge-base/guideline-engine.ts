interface KnowledgeFile {
  id: string;
  name: string;
  type: 'document' | 'transcript' | 'character' | 'guideline' | 'note' | 'draft';
  content?: string;
  tags: string[];
  size: number;
  createdAt: Date;
  updatedAt: Date;
  starred: boolean;
  preview?: string;
}

interface GuidelineRule {
  id: string;
  source: string; // filename
  category: 'style' | 'format' | 'structure' | 'voice' | 'network' | 'genre';
  rule: string;
  priority: 'high' | 'medium' | 'low';
  applicablePhases: number[]; // Which phases this applies to
  example?: string;
}

interface GuidelineApplication {
  fileId: string;
  fileName: string;
  isActive: boolean;
  rules: GuidelineRule[];
  confidence: number; // How well content matches guidelines (0-100)
}

export class GuidelineEngine {
  private guidelines: GuidelineApplication[] = [];
  private activeGuidelines: Set<string> = new Set();

  // Parse knowledge base files and extract guidelines
  parseKnowledgeBase(files: KnowledgeFile[]): GuidelineApplication[] {
    this.guidelines = [];
    
    files.forEach(file => {
      if (file.content && this.isGuidelineFile(file)) {
        const rules = this.extractRules(file);
        if (rules.length > 0) {
          this.guidelines.push({
            fileId: file.id,
            fileName: file.name,
            isActive: file.starred || file.tags.includes('active'), // Auto-activate starred files
            rules,
            confidence: 0
          });
          
          if (file.starred || file.tags.includes('active')) {
            this.activeGuidelines.add(file.id);
          }
        }
      }
    });

    return this.guidelines;
  }

  // Check if a file contains guidelines
  private isGuidelineFile(file: KnowledgeFile): boolean {
    const guidelineIndicators = [
      'guideline', 'standard', 'format', 'style', 'voice', 
      'network', 'production', 'bible', 'template', 'requirements'
    ];
    
    const fileName = file.name.toLowerCase();
    const tags = file.tags.map(t => t.toLowerCase());
    
    return guidelineIndicators.some(indicator => 
      fileName.includes(indicator) || tags.includes(indicator)
    ) || file.type === 'guideline';
  }

  // Extract rules from guideline content
  private extractRules(file: KnowledgeFile): GuidelineRule[] {
    if (!file.content) return [];
    
    const rules: GuidelineRule[] = [];
    const content = file.content;
    const lines = content.split('\n');
    
    // Look for different rule patterns
    lines.forEach((line, index) => {
      const cleanLine = line.trim();
      if (!cleanLine) return;

      // Direct rules (MUST, SHOULD, ALWAYS, NEVER)
      if (this.isDirectRule(cleanLine)) {
        rules.push({
          id: `${file.id}_${index}`,
          source: file.name,
          category: this.categorizeRule(cleanLine, file),
          rule: cleanLine,
          priority: this.determinePriority(cleanLine),
          applicablePhases: this.determinePhases(cleanLine),
          example: this.findExample(lines, index)
        });
      }

      // Format specifications
      if (this.isFormatRule(cleanLine)) {
        rules.push({
          id: `${file.id}_format_${index}`,
          source: file.name,
          category: 'format',
          rule: cleanLine,
          priority: 'high',
          applicablePhases: [4], // Mainly for final formatting
          example: this.findExample(lines, index)
        });
      }

      // Style guidelines
      if (this.isStyleRule(cleanLine)) {
        rules.push({
          id: `${file.id}_style_${index}`,
          source: file.name,
          category: 'style',
          rule: cleanLine,
          priority: 'medium',
          applicablePhases: [1, 2, 3, 4],
          example: this.findExample(lines, index)
        });
      }
    });

    return rules;
  }

  private isDirectRule(line: string): boolean {
    const ruleKeywords = ['MUST', 'SHOULD', 'ALWAYS', 'NEVER', 'REQUIRED', 'MANDATORY', 'ESSENTIAL'];
    return ruleKeywords.some(keyword => line.toUpperCase().includes(keyword));
  }

  private isFormatRule(line: string): boolean {
    const formatKeywords = ['format', 'font', 'spacing', 'margin', 'page', 'length', 'words', 'pages'];
    return formatKeywords.some(keyword => line.toLowerCase().includes(keyword));
  }

  private isStyleRule(line: string): boolean {
    const styleKeywords = ['voice', 'tone', 'style', 'character', 'dialogue', 'description', 'pacing'];
    return styleKeywords.some(keyword => line.toLowerCase().includes(keyword));
  }

  private categorizeRule(line: string, file: KnowledgeFile): GuidelineRule['category'] {
    const lower = line.toLowerCase();
    
    if (lower.includes('network') || lower.includes('executive')) return 'network';
    if (lower.includes('format') || lower.includes('page') || lower.includes('font')) return 'format';
    if (lower.includes('voice') || lower.includes('tone') || lower.includes('style')) return 'voice';
    if (lower.includes('structure') || lower.includes('act') || lower.includes('scene')) return 'structure';
    if (lower.includes('genre') || lower.includes('comedy') || lower.includes('drama')) return 'genre';
    
    return 'style'; // default
  }

  private determinePriority(line: string): GuidelineRule['priority'] {
    const upper = line.toUpperCase();
    if (upper.includes('MUST') || upper.includes('REQUIRED') || upper.includes('MANDATORY')) return 'high';
    if (upper.includes('SHOULD') || upper.includes('IMPORTANT')) return 'medium';
    return 'low';
  }

  private determinePhases(line: string): number[] {
    const lower = line.toLowerCase();
    
    if (lower.includes('summary') || lower.includes('logline') || lower.includes('pitch')) return [1];
    if (lower.includes('scene') || lower.includes('structure')) return [2, 3];
    if (lower.includes('format') || lower.includes('final') || lower.includes('delivery')) return [4];
    if (lower.includes('dialogue') || lower.includes('character') || lower.includes('action')) return [3, 4];
    
    return [1, 2, 3, 4]; // Apply to all phases by default
  }

  private findExample(lines: string[], currentIndex: number): string | undefined {
    // Look for examples in the next few lines
    for (let i = currentIndex + 1; i < Math.min(currentIndex + 3, lines.length); i++) {
      const line = lines[i].trim();
      if (line.toLowerCase().includes('example:') || line.toLowerCase().includes('e.g.')) {
        return line;
      }
    }
    return undefined;
  }

  // Get active guidelines for a specific phase
  getActiveGuidelinesForPhase(phase: number): GuidelineRule[] {
    return this.guidelines
      .filter(app => app.isActive && this.activeGuidelines.has(app.fileId))
      .flatMap(app => app.rules)
      .filter(rule => rule.applicablePhases.includes(phase))
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });
  }

  // Generate prompt context from guidelines
  generatePromptContext(phase: number): string {
    const activeRules = this.getActiveGuidelinesForPhase(phase);
    if (activeRules.length === 0) return '';

    let context = '\n\nACTIVE GUIDELINES:\n';
    
    // Group by category
    const rulesByCategory: { [key: string]: GuidelineRule[] } = {};
    activeRules.forEach(rule => {
      if (!rulesByCategory[rule.category]) {
        rulesByCategory[rule.category] = [];
      }
      rulesByCategory[rule.category].push(rule);
    });

    Object.entries(rulesByCategory).forEach(([category, rules]) => {
      context += `\n${category.toUpperCase()} REQUIREMENTS:\n`;
      rules.forEach(rule => {
        context += `- ${rule.rule}`;
        if (rule.example) {
          context += ` (${rule.example})`;
        }
        context += `\n`;
      });
    });

    context += '\nPlease follow these guidelines carefully in your generation.';
    return context;
  }

  // Toggle guideline file on/off
  toggleGuideline(fileId: string, isActive: boolean): void {
    const guideline = this.guidelines.find(g => g.fileId === fileId);
    if (guideline) {
      guideline.isActive = isActive;
      if (isActive) {
        this.activeGuidelines.add(fileId);
      } else {
        this.activeGuidelines.delete(fileId);
      }
    }
  }

  // Analyze content against guidelines
  analyzeCompliance(content: string, phase: number): {
    overallScore: number;
    ruleCompliance: Array<{
      rule: GuidelineRule;
      compliant: boolean;
      confidence: number;
      suggestion?: string;
    }>;
  } {
    const activeRules = this.getActiveGuidelinesForPhase(phase);
    const ruleCompliance: Array<{
      rule: GuidelineRule;
      compliant: boolean;
      confidence: number;
      suggestion?: string;
    }> = [];

    let totalScore = 0;
    let ruleCount = 0;

    activeRules.forEach(rule => {
      const compliance = this.checkRuleCompliance(content, rule);
      ruleCompliance.push(compliance);
      totalScore += compliance.compliant ? 100 : 0;
      ruleCount++;
    });

    return {
      overallScore: ruleCount > 0 ? totalScore / ruleCount : 100,
      ruleCompliance
    };
  }

  private checkRuleCompliance(content: string, rule: GuidelineRule): {
    rule: GuidelineRule;
    compliant: boolean;
    confidence: number;
    suggestion?: string;
  } {
    // Simple compliance checking - can be enhanced with AI
    const lower = content.toLowerCase();
    const ruleLower = rule.rule.toLowerCase();
    
    let compliant = true;
    let confidence = 80; // Base confidence
    let suggestion: string | undefined;

    // Check for negative rules (NEVER, MUST NOT)
    if (ruleLower.includes('never') || ruleLower.includes('must not')) {
      const forbiddenTerms = this.extractForbiddenTerms(rule.rule);
      forbiddenTerms.forEach(term => {
        if (lower.includes(term.toLowerCase())) {
          compliant = false;
          suggestion = `Remove or rephrase: "${term}" (violates: ${rule.rule})`;
        }
      });
    }

    // Check for positive rules (MUST, SHOULD)
    if (ruleLower.includes('must') || ruleLower.includes('should')) {
      const requiredTerms = this.extractRequiredTerms(rule.rule);
      requiredTerms.forEach(term => {
        if (!lower.includes(term.toLowerCase())) {
          compliant = false;
          confidence = 60;
          suggestion = `Consider adding: "${term}" (required by: ${rule.rule})`;
        }
      });
    }

    return { rule, compliant, confidence, suggestion };
  }

  private extractForbiddenTerms(rule: string): string[] {
    // Extract terms from rules like "Never use clichés like 'dark and stormy night'"
    const matches = rule.match(/['"]([^'"]+)['"]/g);
    return matches ? matches.map(match => match.replace(/['"]/g, '')) : [];
  }

  private extractRequiredTerms(rule: string): string[] {
    // Extract terms from rules like "Must include protagonist motivation"
    const matches = rule.match(/\b(include|contain|mention)\s+([^.]+)/gi);
    return matches ? matches.map(match => match.replace(/\b(include|contain|mention)\s+/gi, '')) : [];
  }

  // Get summary of active guidelines for display
  getActiveGuidelinesSummary(): Array<{
    fileName: string;
    fileId: string;
    ruleCount: number;
    categories: string[];
    isActive: boolean;
  }> {
    return this.guidelines.map(app => ({
      fileName: app.fileName,
      fileId: app.fileId,
      ruleCount: app.rules.length,
      categories: [...new Set(app.rules.map(r => r.category))],
      isActive: app.isActive
    }));
  }
}