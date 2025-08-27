import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, production_bible_documents, production_bible_rules, story_projects } from '@muse/db';
import { eq, and } from 'drizzle-orm';
import { unlink } from 'fs/promises';
import { z } from 'zod';

const updateDocumentSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  projectId: z.string().uuid().nullable().optional()
});

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth.api.getSession({ 
      headers: request.headers 
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const documentId = params.id;

    // Get document details
    const [document] = await db.select()
      .from(production_bible_documents)
      .where(and(
        eq(production_bible_documents.id, documentId),
        eq(production_bible_documents.user_id, session.user.id)
      ))
      .limit(1);

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Get extracted rules
    const rules = await db.select()
      .from(production_bible_rules)
      .where(eq(production_bible_rules.document_id, documentId));

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        name: document.name,
        originalFilename: document.original_filename,
        fileType: document.file_type,
        fileSize: document.file_size,
        uploadedAt: document.uploaded_at,
        parsingStatus: document.parsing_status,
        parsingError: document.parsing_error,
        extractedRulesCount: document.extracted_rules_count,
        storyProjectId: document.story_project_id,
        metadata: document.metadata
      },
      rules: rules.map(rule => ({
        id: rule.id,
        ruleType: rule.rule_type,
        title: rule.title,
        description: rule.description,
        pattern: rule.pattern,
        replacement: rule.replacement,
        examples: rule.examples,
        conditions: rule.conditions,
        action: rule.action,
        priority: rule.priority,
        confidence: rule.confidence,
        isActive: rule.is_active,
        createdAt: rule.created_at,
        updatedAt: rule.updated_at
      }))
    });

  } catch (error) {
    console.error('Error fetching production bible document:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch document' 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth.api.getSession({ 
      headers: request.headers 
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const documentId = params.id;
    const body = await request.json();
    
    const validation = updateDocumentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Invalid request data',
        details: validation.error.issues
      }, { status: 400 });
    }

    const { name, projectId } = validation.data;

    // Verify document ownership
    const [document] = await db.select()
      .from(production_bible_documents)
      .where(and(
        eq(production_bible_documents.id, documentId),
        eq(production_bible_documents.user_id, session.user.id)
      ))
      .limit(1);

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Verify project ownership if projectId provided
    if (projectId) {
      const [project] = await db.select()
        .from(story_projects)
        .where(and(
          eq(story_projects.id, projectId),
          eq(story_projects.user_id, session.user.id)
        ))
        .limit(1);

      if (!project) {
        return NextResponse.json({ error: 'Project not found or unauthorized' }, { status: 403 });
      }
    }

    // Update document
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (projectId !== undefined) updateData.story_project_id = projectId;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const [updatedDocument] = await db.update(production_bible_documents)
      .set(updateData)
      .where(eq(production_bible_documents.id, documentId))
      .returning();

    return NextResponse.json({
      success: true,
      document: {
        id: updatedDocument.id,
        name: updatedDocument.name,
        originalFilename: updatedDocument.original_filename,
        fileType: updatedDocument.file_type,
        fileSize: updatedDocument.file_size,
        uploadedAt: updatedDocument.uploaded_at,
        parsingStatus: updatedDocument.parsing_status,
        parsingError: updatedDocument.parsing_error,
        extractedRulesCount: updatedDocument.extracted_rules_count,
        storyProjectId: updatedDocument.story_project_id,
        metadata: updatedDocument.metadata
      },
      message: 'Document updated successfully'
    });

  } catch (error) {
    console.error('Error updating production bible document:', error);
    return NextResponse.json({ 
      error: 'Failed to update document' 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth.api.getSession({ 
      headers: request.headers 
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const documentId = params.id;

    // Get document to verify ownership and get file path
    const [document] = await db.select()
      .from(production_bible_documents)
      .where(and(
        eq(production_bible_documents.id, documentId),
        eq(production_bible_documents.user_id, session.user.id)
      ))
      .limit(1);

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Delete associated rules first (cascade delete should handle this, but being explicit)
    await db.delete(production_bible_rules)
      .where(eq(production_bible_rules.document_id, documentId));

    // Delete the document record
    await db.delete(production_bible_documents)
      .where(eq(production_bible_documents.id, documentId));

    // Delete the physical file
    try {
      await unlink(document.file_path);
    } catch (fileError) {
      console.warn('Could not delete physical file:', fileError);
      // Don't fail the request if file deletion fails
    }

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting production bible document:', error);
    return NextResponse.json({ 
      error: 'Failed to delete document' 
    }, { status: 500 });
  }
}