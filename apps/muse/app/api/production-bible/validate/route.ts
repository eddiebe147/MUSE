import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, production_bible_rules, production_bible_documents, production_bible_applications, transcripts, story_projects } from '@muse/db';
import { eq, and } from 'drizzle-orm';
import { ruleEngine, type DocumentContent, type ValidationResult } from '@/lib/production-bible/rule-engine';
import { z } from 'zod';

const validateRequestSchema = z.object({
  transcriptId: z.string().uuid(),
  content: z.object({
    executiveSummary: z.any(),
    narrativeStructure: z.any(),
    productionPackage: z.any(),
    phase: z.number().optional(),
    section: z.string().optional()
  }),
  applyRules: z.boolean().default(false),
  saveApplications: z.boolean().default(false)
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ 
      headers: request.headers 
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = validateRequestSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Invalid request data',
        details: validation.error.issues
      }, { status: 400 });
    }

    const { transcriptId, content, applyRules, saveApplications } = validation.data;

    // Verify transcript ownership
    const [transcript] = await db.select()
      .from(transcripts)
      .where(eq(transcripts.id, transcriptId))
      .limit(1);

    if (!transcript) {
      return NextResponse.json({ error: 'Transcript not found' }, { status: 404 });
    }

    // Verify ownership through project
    const [project] = await db.select()
      .from(story_projects)
      .where(eq(story_projects.id, transcript.story_project_id))
      .limit(1);

    if (!project || project.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized access to transcript' }, { status: 403 });
    }

    // Load production bible rules for this project
    const rules = await loadProjectRules(project.id, session.user.id);

    if (rules.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No production bible rules configured for this project',
        validation: {
          isValid: true,
          violations: [],
          suggestions: [],
          warnings: []
        },
        applications: [],
        rulesApplied: 0
      });
    }

    // Load rules into the rule engine
    await ruleEngine.loadRules(rules);

    const documentContent: DocumentContent = {
      executiveSummary: content.executiveSummary,
      narrativeStructure: content.narrativeStructure,
      productionPackage: content.productionPackage,
      phase: content.phase || 4,
      section: content.section || 'executive_document'
    };

    let validationResult: ValidationResult;
    let applications = [];
    let modifiedContent = documentContent;

    if (applyRules) {
      // Apply rules and get modified content
      const applyResult = await ruleEngine.applyRules(documentContent);
      modifiedContent = applyResult.modifiedContent;
      applications = applyResult.applications;

      // Validate the modified content
      validationResult = await ruleEngine.validateContent(modifiedContent);
    } else {
      // Just validate without applying
      validationResult = await ruleEngine.validateContent(documentContent);
    }

    // Save applications to database if requested
    if (saveApplications && applications.length > 0) {
      try {
        const applicationInserts = applications.map(app => ({
          rule_id: app.ruleId,
          document_section: app.documentSection,
          original_text: app.originalText,
          suggested_text: app.suggestedText,
          confidence: app.confidence,
          applied: app.applied,
          reason: app.reason,
          transcript_id: transcriptId,
          phase: content.phase || 4
        }));

        await db.insert(production_bible_applications).values(applicationInserts);
      } catch (error) {
        console.error('Error saving rule applications:', error);
        // Don't fail the request if saving fails
      }
    }

    // Generate quality score
    const qualityScore = calculateQualityScore(validationResult, applications.length);

    return NextResponse.json({
      success: true,
      validation: validationResult,
      applications,
      rulesApplied: applications.length,
      qualityScore,
      modifiedContent: applyRules ? {
        executiveSummary: modifiedContent.executiveSummary,
        narrativeStructure: modifiedContent.narrativeStructure,
        productionPackage: modifiedContent.productionPackage
      } : undefined,
      summary: {
        totalRulesEvaluated: rules.length,
        violations: validationResult.violations.length,
        suggestions: validationResult.suggestions.length,
        warnings: validationResult.warnings.length,
        applicationsApplied: applications.filter(a => a.applied).length,
        averageConfidence: applications.length > 0 
          ? Math.round(applications.reduce((sum, a) => sum + a.confidence, 0) / applications.length)
          : 0
      }
    });

  } catch (error) {
    console.error('Error validating with production bible:', error);
    return NextResponse.json({ 
      error: 'Failed to validate content with production bible' 
    }, { status: 500 });
  }
}

// Helper function to load project rules
async function loadProjectRules(projectId: string, userId: string) {
  try {
    // Load all active rules from documents associated with this project
    const rulesQuery = await db.select()
      .from(production_bible_rules)
      .innerJoin(
        production_bible_documents, 
        eq(production_bible_rules.document_id, production_bible_documents.id)
      )
      .where(and(
        eq(production_bible_documents.user_id, userId),
        eq(production_bible_documents.story_project_id, projectId),
        eq(production_bible_rules.is_active, true),
        eq(production_bible_documents.parsing_status, 'completed')
      ));

    return rulesQuery.map(row => row.production_bible_rules);
  } catch (error) {
    console.error('Error loading project rules:', error);
    return [];
  }
}

// Helper function to calculate quality score
function calculateQualityScore(validation: ValidationResult, applicationsCount: number): {
  overall: number;
  breakdown: {
    compliance: number;
    enhancement: number;
    consistency: number;
  };
  grade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F';
} {
  const { violations, suggestions, warnings } = validation;
  
  // Base score starts at 100
  let complianceScore = 100;
  let enhancementScore = 80; // Base enhancement score
  let consistencyScore = 90; // Base consistency score

  // Deduct points for violations based on severity
  violations.forEach(violation => {
    switch (violation.severity) {
      case 'critical':
        complianceScore -= 20;
        break;
      case 'high':
        complianceScore -= 10;
        break;
      case 'medium':
        complianceScore -= 5;
        break;
      case 'low':
        complianceScore -= 2;
        break;
    }
  });

  // Deduct points for warnings
  consistencyScore -= warnings.length * 3;

  // Add points for applied enhancements
  enhancementScore += Math.min(applicationsCount * 2, 20);

  // Ensure scores don't go below 0 or above 100
  complianceScore = Math.max(0, Math.min(100, complianceScore));
  enhancementScore = Math.max(0, Math.min(100, enhancementScore));
  consistencyScore = Math.max(0, Math.min(100, consistencyScore));

  // Calculate overall score (weighted average)
  const overall = Math.round(
    (complianceScore * 0.5) + 
    (enhancementScore * 0.3) + 
    (consistencyScore * 0.2)
  );

  // Determine grade
  let grade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F';
  if (overall >= 97) grade = 'A+';
  else if (overall >= 93) grade = 'A';
  else if (overall >= 90) grade = 'B+';
  else if (overall >= 87) grade = 'B';
  else if (overall >= 83) grade = 'C+';
  else if (overall >= 80) grade = 'C';
  else if (overall >= 70) grade = 'D';
  else grade = 'F';

  return {
    overall,
    breakdown: {
      compliance: complianceScore,
      enhancement: enhancementScore,
      consistency: consistencyScore
    },
    grade
  };
}