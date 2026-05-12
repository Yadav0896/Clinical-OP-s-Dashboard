import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { patientId, createdById, drugId, drugName, indicationId, indication, payerId, payerName, icd10Code, icd10Desc, priority, notes } = body;

    if (!patientId || !drugId || !drugName || !indicationId || !indication || !payerId || !payerName) {
      return NextResponse.json({ error: 'Missing required fields: patientId, drugId, drugName, indicationId, indication, payerId, payerName' }, { status: 400 });
    }

    const patient = await db.patient.findUnique({ where: { id: patientId } });
    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    const submission = await db.submission.create({
      data: {
        patientId,
        createdById,
        drugId,
        drugName,
        indicationId,
        indication,
        payerId,
        payerName,
        icd10Code,
        icd10Desc,
        priority: priority || 'normal',
        notes,
        stage: 'draft',
      } as Parameters<typeof db.submission.create>[0]['data'],
    });

    // Create initial timeline event
    await db.timelineEvent.create({
      data: {
        submissionId: submission.id,
        event: 'created',
        description: `Submission created for ${drugName} (${indication}) to ${payerName}`,
        metadata: JSON.stringify({ drugId, indicationId, payerId }),
        userId: createdById,
      },
    });

    // Create audit log
    if (createdById) {
      await db.auditLog.create({
        data: {
          userId: createdById,
          submissionId: submission.id,
          action: 'created',
          entity: 'submission',
          entityId: submission.id,
          details: JSON.stringify({ drugId, drugName, indicationId, payerId, payerName }),
        },
      });
    }

    return NextResponse.json(submission, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create submission', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const stage = searchParams.get('stage');
    const drugId = searchParams.get('drugId');
    const patientId = searchParams.get('patientId');
    const priority = searchParams.get('priority');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: Record<string, unknown> = {};
    if (stage) where.stage = stage;
    if (drugId) where.drugId = drugId;
    if (patientId) where.patientId = patientId;
    if (priority) where.priority = priority;

    const [submissionsList, total] = await Promise.all([
      db.submission.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          patient: true,
          createdBy: true,
          _count: true,
        },
      }),
      db.submission.count({ where }),
    ]);

    return NextResponse.json({
      submissions: submissionsList,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 });
  }
}
