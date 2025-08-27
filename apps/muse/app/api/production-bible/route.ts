import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, production_bible_documents, production_bible_rules, story_projects } from '@muse/db';
import { eq, and, desc } from 'drizzle-orm';
import { documentParser } from '@/lib/production-bible/document-parser';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { z } from 'zod';

const uploadSchema = z.object({
  name: z.string().min(1).max(255),
  projectId: z.string().uuid().optional(),
  file: z.any() // File will be validated separately
});

const querySchema = z.object({
  projectId: z.string().uuid().optional(),
  status: z.enum(['pending', 'processing', 'completed', 'failed']).optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0)
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ 
      headers: request.headers 
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const name = formData.get('name') as string;
    const projectId = formData.get('projectId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!name) {
      return NextResponse.json({ error: 'Document name is required' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'text/markdown'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Unsupported file type. Supported types: PDF, DOCX, TXT, MD' 
      }, { status: 400 });
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Maximum size: 10MB' }, { status: 400 });
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

    // Determine file type
    const fileType = getFileType(file.type, file.name);
    
    // Create upload directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'uploads', 'production-bible');
    await mkdir(uploadDir, { recursive: true });

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = path.extname(file.name);
    const filename = `${session.user.id}_${timestamp}_${encodeURIComponent(file.name.replace(/[^a-zA-Z0-9.-]/g, '_'))}`;
    const filePath = path.join(uploadDir, filename);

    // Save file to disk
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Create database record
    const [document] = await db.insert(production_bible_documents)
      .values({
        name,
        original_filename: file.name,
        file_type: fileType,
        file_size: file.size,
        file_path: filePath,
        user_id: session.user.id,
        story_project_id: projectId || null,
        parsing_status: 'pending'
      })
      .returning();

    // Start parsing in background (don't await)
    parseDocumentAsync(document.id, filePath, fileType).catch(error => {
      console.error('Background parsing failed:', error);
      // Update status to failed
      db.update(production_bible_documents)
        .set({ 
          parsing_status: 'failed', 
          parsing_error: error.message 
        })
        .where(eq(production_bible_documents.id, document.id))
        .execute()
        .catch(console.error);
    });

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        name: document.name,
        originalFilename: document.original_filename,
        fileType: document.file_type,
        fileSize: document.file_size,
        parsingStatus: document.parsing_status,
        uploadedAt: document.uploaded_at
      },
      message: 'Document uploaded successfully. Parsing will begin shortly.'
    });

  } catch (error) {
    console.error('Error uploading production bible document:', error);
    return NextResponse.json({ 
      error: 'Failed to upload document' 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ 
      headers: request.headers 
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const params = Object.fromEntries(url.searchParams.entries());
    
    const validation = querySchema.safeParse(params);
    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Invalid query parameters',
        details: validation.error.issues
      }, { status: 400 });
    }

    const { projectId, status, limit, offset } = validation.data;

    // Build query conditions
    const conditions = [eq(production_bible_documents.user_id, session.user.id)];
    
    if (projectId) {
      conditions.push(eq(production_bible_documents.story_project_id, projectId));
    }
    
    if (status) {
      conditions.push(eq(production_bible_documents.parsing_status, status));
    }

    // Get documents with rule counts
    const documents = await db.select({
      id: production_bible_documents.id,
      name: production_bible_documents.name,
      original_filename: production_bible_documents.original_filename,
      file_type: production_bible_documents.file_type,
      file_size: production_bible_documents.file_size,
      uploaded_at: production_bible_documents.uploaded_at,
      parsing_status: production_bible_documents.parsing_status,
      parsing_error: production_bible_documents.parsing_error,
      extracted_rules_count: production_bible_documents.extracted_rules_count,
      story_project_id: production_bible_documents.story_project_id
    })
    .from(production_bible_documents)
    .where(and(...conditions))
    .orderBy(desc(production_bible_documents.uploaded_at))
    .limit(limit)
    .offset(offset);

    // Get total count
    const [totalResult] = await db.select({ count: production_bible_documents.id })
      .from(production_bible_documents)
      .where(and(...conditions));

    return NextResponse.json({
      success: true,
      documents,
      pagination: {
        total: totalResult?.count || 0,
        limit,
        offset,
        hasMore: (totalResult?.count || 0) > offset + documents.length
      }
    });

  } catch (error) {
    console.error('Error fetching production bible documents:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch documents' 
    }, { status: 500 });
  }
}

// Helper functions
function getFileType(mimeType: string, filename: string): 'pdf' | 'docx' | 'txt' | 'md' {
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'docx';
  if (mimeType === 'text/markdown' || filename.endsWith('.md')) return 'md';
  return 'txt';
}

async function parseDocumentAsync(documentId: string, filePath: string, fileType: string) {
  try {
    // Update status to processing
    await db.update(production_bible_documents)
      .set({ parsing_status: 'processing' })
      .where(eq(production_bible_documents.id, documentId));

    // Parse the document
    const result = await documentParser.parseDocument(filePath, fileType);

    // Save extracted rules to database
    const ruleInserts = result.extractedRules.map(rule => ({
      ...rule,
      document_id: documentId
    }));

    if (ruleInserts.length > 0) {
      await db.insert(production_bible_rules).values(ruleInserts);
    }

    // Update document status and rule count
    await db.update(production_bible_documents)
      .set({ 
        parsing_status: 'completed',
        extracted_rules_count: ruleInserts.length,
        metadata: {
          structure: result.structure,
          contentLength: result.content.length
        }
      })
      .where(eq(production_bible_documents.id, documentId));

  } catch (error) {
    console.error('Error parsing document:', error);
    
    // Update status to failed
    await db.update(production_bible_documents)
      .set({ 
        parsing_status: 'failed',
        parsing_error: error instanceof Error ? error.message : 'Unknown parsing error'
      })
      .where(eq(production_bible_documents.id, documentId));
  }
}