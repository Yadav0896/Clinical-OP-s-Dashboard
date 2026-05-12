import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: submissionId } = await params;
    const body = await req.json();
    const { type, name, fileName, fileSize, mimeType, fileData, category, status, notes, uploadedById } = body;

    if (!type || !name) {
      return NextResponse.json({ error: 'Missing required fields: type, name' }, { status: 400 });
    }

    const submission = await db.submission.findUnique({ where: { id: submissionId } });
    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    const document = await db.document.create({
      data: {
        submissionId,
        type,
        name,
        fileName,
        fileSize,
        mimeType,
        fileData,
        category: category || 'other',
        status: status || 'pending',
        notes,
        uploadedById,
      },
    });

    // Create timeline event
    await db.timelineEvent.create({
      data: {
        submissionId,
        event: 'document_uploaded',
        description: `Document uploaded: ${name} (${type})`,
        metadata: JSON.stringify({ type, category: category || 'other' }),
        userId: uploadedById,
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to upload document' }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: submissionId } = await params;
    const docs = await db.document.findMany({
      where: { submissionId },
      orderBy: { uploadedAt: 'desc' },
    });

    return NextResponse.json(docs);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
  }
}
