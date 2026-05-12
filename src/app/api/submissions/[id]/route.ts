import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const submission = await db.submission.findUnique({
      where: { id },
      include: {
        patient: { biomarkers: true },
        createdBy: true,
        documents: true,
        timeline: true,
        auditLogs: true,
      },
    });

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    return NextResponse.json(submission);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch submission' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const existing = await db.submission.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    const allowedFields = [
      'drugId', 'drugName', 'indicationId', 'indication', 'payerId', 'payerName',
      'icd10Code', 'icd10Desc', 'priority', 'notes', 'externalId',
      'gapCheckResult', 'docCheckResult', 'icd10Validation', 'aiVerdict', 'aiNotes',
      'denialReason', 'appealResult', 'appealStatus',
    ];
    for (const field of allowedFields) {
      if (body[field] !== undefined) updateData[field] = body[field];
    }
    if (typeof body.gapCheckResult === 'object') updateData.gapCheckResult = JSON.stringify(body.gapCheckResult);
    if (typeof body.docCheckResult === 'object') updateData.docCheckResult = JSON.stringify(body.docCheckResult);
    if (typeof body.icd10Validation === 'object') updateData.icd10Validation = JSON.stringify(body.icd10Validation);
    if (typeof body.appealResult === 'object') updateData.appealResult = JSON.stringify(body.appealResult);

    // Date fields
    if (body.submittedDate) updateData.submittedDate = new Date(body.submittedDate).toISOString();
    if (body.denialDate) updateData.denialDate = new Date(body.denialDate).toISOString();
    if (body.appealDate) updateData.appealDate = new Date(body.appealDate).toISOString();
    if (body.approvedDate) updateData.approvedDate = new Date(body.approvedDate).toISOString();
    if (body.closedDate) updateData.closedDate = new Date(body.closedDate).toISOString();
    if (body.daysToDecision !== undefined) updateData.daysToDecision = body.daysToDecision;

    const submission = await db.submission.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(submission);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update submission' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const existing = await db.submission.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    // Delete all related records
    await db.timelineEvent.deleteMany({ where: { submissionId: id } });
    await db.document.deleteMany({ where: { submissionId: id } });
    await db.auditLog.deleteMany({ where: { submissionId: id } });
    await db.submission.delete({ where: { id } });

    return NextResponse.json({ message: 'Submission deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete submission' }, { status: 500 });
  }
}
