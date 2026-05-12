import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { stage, userId } = body;

    if (!stage) {
      return NextResponse.json({ error: 'Missing required field: stage' }, { status: 400 });
    }

    const validStages = ['draft', 'patient_setup', 'expert_review', 'submitted', 'approved', 'denied', 'closed'];
    if (!validStages.includes(stage)) {
      return NextResponse.json({ error: `Invalid stage. Must be one of: ${validStages.join(', ')}` }, { status: 400 });
    }

    const existing = await db.submission.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    const previousStage = (existing as Record<string, unknown>).stage as string;
    const existingSubmittedDate = (existing as Record<string, unknown>).submittedDate as string | undefined;
    const updateData: Record<string, unknown> = { stage };

    // Auto-set date fields based on stage
    const nowISO = new Date().toISOString();
    if (stage === 'submitted') updateData.submittedDate = nowISO;
    if (stage === 'approved') updateData.approvedDate = nowISO;
    if (stage === 'denied') updateData.deniedDate = nowISO;
    if (stage === 'closed') updateData.closedDate = nowISO;

    // Calculate days to decision if applicable
    if (['approved', 'denied'].includes(stage) && existingSubmittedDate) {
      const diff = new Date(nowISO).getTime() - new Date(existingSubmittedDate).getTime();
      updateData.daysToDecision = Math.round(diff / (1000 * 60 * 60 * 24));
    }

    const submission = await db.submission.update({
      where: { id },
      data: updateData,
    });

    // Create timeline event
    await db.timelineEvent.create({
      data: {
        submissionId: id,
        event: 'stage_changed',
        description: `Stage changed from "${previousStage}" to "${stage}"`,
        metadata: JSON.stringify({ previousStage, newStage: stage }),
        userId,
      },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        userId,
        submissionId: id,
        action: 'stage_changed',
        entity: 'submission',
        entityId: id,
        details: JSON.stringify({ previousStage, newStage: stage }),
      },
    });

    return NextResponse.json(submission);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update stage' }, { status: 500 });
  }
}
