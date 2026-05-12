import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const document = await db.document.findUnique({ where: { id } });
    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    await db.document.delete({ where: { id } });

    // Create timeline event
    await db.timelineEvent.create({
      data: {
        submissionId: document.submissionId,
        event: 'document_removed',
        description: `Document removed: ${document.name}`,
        metadata: JSON.stringify({ documentId: id, documentName: document.name }),
      },
    });

    return NextResponse.json({ message: 'Document deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
  }
}
