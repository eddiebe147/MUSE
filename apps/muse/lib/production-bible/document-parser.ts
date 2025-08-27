import { ProductionBibleRule } from '@muse/db';
import mammoth from 'mammoth';
import pdf from 'pdf-parse';
import fs from 'fs/promises';

export interface ParsedDocument {
  content: string;
  structure: DocumentSection[];
  extractedRules: Omit<ProductionBibleRule, 'id' | 'document_id' | 'created_at' | 'updated_at'>[];
}

export interface DocumentSection {
  type: 'header' | 'paragraph' | 'list' | 'table' | 'formatted';
  level?: number;
  content: string;
  formatting?: {
    bold: boolean;
    italic: boolean;
    underline: boolean;
  };
  metadata?: Record<string, any>;
}

class DocumentParser {
  private rulePatterns = {
    formatting: [
      /format(?:ting)?[:\s]+(.*)/gi,
      /style[:\s]+(.*)/gi,
      /font[:\s]+(.*)/gi,
      /margin[:\s]+(.*)/gi,
      /spacing[:\s]+(.*)/gi,
      /alignment[:\s]+(.*)/gi,
    ],
    content: [
      /content[:\s]+(.*)/gi,
      /text[:\s]+(.*)/gi,
      /language[:\s]+(.*)/gi,
      /tone[:\s]+(.*)/gi,
      /voice[:\s]+(.*)/gi,
    ],
    structure: [
      /structure[:\s]+(.*)/gi,
      /organization[:\s]+(.*)/gi,
      /layout[:\s]+(.*)/gi,
      /section[:\s]+(.*)/gi,
      /heading[:\s]+(.*)/gi,
    ],
    validation: [
      /requirement[:\s]+(.*)/gi,
      /must[:\s]+(.*)/gi,
      /should[:\s]+(.*)/gi,
      /cannot[:\s]+(.*)/gi,
      /forbidden[:\s]+(.*)/gi,
    ]
  };

  async parseDocument(filePath: string, fileType: string): Promise<ParsedDocument> {
    let content: string;
    let structure: DocumentSection[] = [];

    try {
      switch (fileType) {
        case 'pdf':
          content = await this.parsePDF(filePath);
          structure = this.extractStructureFromText(content);
          break;
        case 'docx':
          const docxResult = await this.parseDOCX(filePath);
          content = docxResult.content;
          structure = docxResult.structure;
          break;
        case 'txt':
        case 'md':
          content = await this.parseText(filePath);
          structure = this.extractStructureFromText(content);
          break;
        default:
          throw new Error(`Unsupported file type: ${fileType}`);
      }

      const extractedRules = this.extractRules(content, structure);

      return {
        content,
        structure,
        extractedRules
      };
    } catch (error) {
      console.error('Error parsing document:', error);
      throw new Error(`Failed to parse document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async parsePDF(filePath: string): Promise<string> {
    const dataBuffer = await fs.readFile(filePath);
    const data = await pdf(dataBuffer);
    return data.text;
  }

  private async parseDOCX(filePath: string): Promise<{ content: string; structure: DocumentSection[] }> {
    const buffer = await fs.readFile(filePath);
    const result = await mammoth.convertToHtml({ buffer });
    
    // Extract plain text for content
    const textResult = await mammoth.extractRawText({ buffer });
    
    // Parse HTML structure
    const structure = this.parseHTMLStructure(result.value);
    
    return {
      content: textResult.value,
      structure
    };
  }

  private async parseText(filePath: string): Promise<string> {
    return await fs.readFile(filePath, 'utf-8');
  }

  private parseHTMLStructure(html: string): DocumentSection[] {
    const sections: DocumentSection[] = [];
    const lines = html.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      if (trimmed.match(/<h[1-6][^>]*>/)) {
        const level = parseInt(trimmed.match(/<h([1-6])/)?.[1] || '1');
        const content = trimmed.replace(/<[^>]+>/g, '');
        sections.push({
          type: 'header',
          level,
          content,
          formatting: {
            bold: trimmed.includes('<strong>') || trimmed.includes('<b>'),
            italic: trimmed.includes('<em>') || trimmed.includes('<i>'),
            underline: trimmed.includes('<u>')
          }
        });
      } else if (trimmed.match(/<p[^>]*>/)) {
        const content = trimmed.replace(/<[^>]+>/g, '');
        sections.push({
          type: 'paragraph',
          content,
          formatting: {
            bold: trimmed.includes('<strong>') || trimmed.includes('<b>'),
            italic: trimmed.includes('<em>') || trimmed.includes('<i>'),
            underline: trimmed.includes('<u>')
          }
        });
      } else if (trimmed.match(/<li[^>]*>/)) {
        const content = trimmed.replace(/<[^>]+>/g, '');
        sections.push({
          type: 'list',
          content
        });
      }
    }

    return sections;
  }

  private extractStructureFromText(content: string): DocumentSection[] {
    const sections: DocumentSection[] = [];
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Markdown-style headers
      const headerMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
      if (headerMatch) {
        sections.push({
          type: 'header',
          level: headerMatch[1].length,
          content: headerMatch[2]
        });
        continue;
      }

      // List items
      if (trimmed.match(/^[-*+]\s+/) || trimmed.match(/^\d+\.\s+/)) {
        sections.push({
          type: 'list',
          content: trimmed.replace(/^[-*+]\s+/, '').replace(/^\d+\.\s+/, '')
        });
        continue;
      }

      // Regular paragraphs
      sections.push({
        type: 'paragraph',
        content: trimmed
      });
    }

    return sections;
  }

  private extractRules(content: string, structure: DocumentSection[]): Omit<ProductionBibleRule, 'id' | 'document_id' | 'created_at' | 'updated_at'>[] {
    const rules: Omit<ProductionBibleRule, 'id' | 'document_id' | 'created_at' | 'updated_at'>[] = [];
    
    // Extract rules based on patterns
    for (const [ruleType, patterns] of Object.entries(this.rulePatterns)) {
      for (const pattern of patterns) {
        pattern.lastIndex = 0; // Reset regex
        let match;
        
        while ((match = pattern.exec(content)) !== null) {
          const description = match[1].trim();
          if (description.length < 10) continue; // Skip very short rules
          
          const rule = this.createRule(
            ruleType as 'format' | 'style' | 'content' | 'structure' | 'validation',
            description,
            content,
            structure
          );
          
          if (rule) {
            rules.push(rule);
          }
        }
      }
    }

    // Extract structured rules from headers and sections
    for (const section of structure) {
      if (section.type === 'header' && section.level <= 3) {
        const contextualRules = this.extractContextualRules(section, structure);
        rules.push(...contextualRules);
      }
    }

    return this.deduplicateRules(rules);
  }

  private createRule(
    ruleType: 'format' | 'style' | 'content' | 'structure' | 'validation',
    description: string,
    fullContent: string,
    structure: DocumentSection[]
  ): Omit<ProductionBibleRule, 'id' | 'document_id' | 'created_at' | 'updated_at'> | null {
    // Determine rule action based on content
    let action: 'apply' | 'suggest' | 'validate' | 'warn' = 'suggest';
    if (description.toLowerCase().includes('must') || description.toLowerCase().includes('required')) {
      action = 'validate';
    } else if (description.toLowerCase().includes('should') || description.toLowerCase().includes('recommend')) {
      action = 'suggest';
    } else if (description.toLowerCase().includes('cannot') || description.toLowerCase().includes('forbidden')) {
      action = 'warn';
    }

    // Determine priority
    let priority: 'low' | 'medium' | 'high' | 'critical' = 'medium';
    if (description.toLowerCase().includes('critical') || description.toLowerCase().includes('essential')) {
      priority = 'critical';
    } else if (description.toLowerCase().includes('important') || description.toLowerCase().includes('must')) {
      priority = 'high';
    } else if (description.toLowerCase().includes('optional') || description.toLowerCase().includes('prefer')) {
      priority = 'low';
    }

    // Extract examples from surrounding context
    const examples = this.extractExamples(description, fullContent);

    return {
      rule_type: ruleType,
      title: this.generateRuleTitle(description),
      description,
      pattern: this.generatePattern(description, ruleType),
      replacement: this.generateReplacement(description, ruleType),
      examples,
      conditions: null,
      action,
      priority,
      confidence: this.calculateConfidence(description, ruleType),
      is_active: true
    };
  }

  private extractContextualRules(
    headerSection: DocumentSection,
    allSections: DocumentSection[]
  ): Omit<ProductionBibleRule, 'id' | 'document_id' | 'created_at' | 'updated_at'>[] {
    const rules: Omit<ProductionBibleRule, 'id' | 'document_id' | 'created_at' | 'updated_at'>[] = [];
    const headerIndex = allSections.indexOf(headerSection);
    
    // Get content under this header until the next header of same or higher level
    const relatedSections = [];
    for (let i = headerIndex + 1; i < allSections.length; i++) {
      const section = allSections[i];
      if (section.type === 'header' && (section.level || 1) <= (headerSection.level || 1)) {
        break;
      }
      relatedSections.push(section);
    }

    const contextContent = relatedSections.map(s => s.content).join(' ');
    
    // Determine rule type from header
    const headerLower = headerSection.content.toLowerCase();
    let ruleType: 'format' | 'style' | 'content' | 'structure' | 'validation' = 'content';
    
    if (headerLower.includes('format') || headerLower.includes('style')) {
      ruleType = 'format';
    } else if (headerLower.includes('structure') || headerLower.includes('organization')) {
      ruleType = 'structure';
    } else if (headerLower.includes('requirement') || headerLower.includes('rule')) {
      ruleType = 'validation';
    }

    if (contextContent.length > 20) {
      const rule = this.createRule(ruleType, contextContent, contextContent, relatedSections);
      if (rule) {
        rule.title = headerSection.content;
        rules.push(rule);
      }
    }

    return rules;
  }

  private generateRuleTitle(description: string): string {
    const words = description.split(' ').slice(0, 8);
    return words.join(' ').replace(/[.!?]+$/, '');
  }

  private generatePattern(description: string, ruleType: string): string | null {
    // Generate regex patterns based on rule type and description
    if (ruleType === 'format') {
      if (description.toLowerCase().includes('font')) {
        return '\\b(Times|Arial|Calibri|Helvetica)\\b';
      }
      if (description.toLowerCase().includes('size')) {
        return '\\b(\\d+)pt\\b';
      }
    }
    
    return null;
  }

  private generateReplacement(description: string, ruleType: string): string | null {
    // Generate replacement text based on the rule
    return null; // Most rules won't have simple replacements
  }

  private extractExamples(description: string, fullContent: string): string[] {
    const examples: string[] = [];
    
    // Look for examples in the surrounding text
    const lines = fullContent.split('\n');
    const descriptionIndex = lines.findIndex(line => line.includes(description));
    
    if (descriptionIndex !== -1) {
      // Check following lines for examples
      for (let i = descriptionIndex + 1; i < Math.min(descriptionIndex + 5, lines.length); i++) {
        const line = lines[i].trim();
        if (line.toLowerCase().includes('example') || line.toLowerCase().includes('e.g.')) {
          examples.push(line);
        }
      }
    }
    
    return examples;
  }

  private calculateConfidence(description: string, ruleType: string): number {
    let confidence = 70; // Base confidence
    
    // Increase confidence for explicit rules
    if (description.toLowerCase().includes('must') || description.toLowerCase().includes('required')) {
      confidence += 20;
    }
    
    // Increase confidence for specific formatting rules
    if (ruleType === 'format' && description.match(/\b\d+(pt|px|em)\b/)) {
      confidence += 10;
    }
    
    return Math.min(confidence, 100);
  }

  private deduplicateRules(rules: Omit<ProductionBibleRule, 'id' | 'document_id' | 'created_at' | 'updated_at'>[]): Omit<ProductionBibleRule, 'id' | 'document_id' | 'created_at' | 'updated_at'>[] {
    const seen = new Set<string>();
    return rules.filter(rule => {
      const key = `${rule.rule_type}:${rule.title.toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}

export const documentParser = new DocumentParser();