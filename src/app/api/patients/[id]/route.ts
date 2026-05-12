import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const patient = await db.patient.findUnique({
      where: { id, isActive: true },
    });

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    // Manually include biomarkers and submissions with counts
    const patientBiomarkers = await db.biomarker.findMany({
      where: { patientId: id },
      orderBy: { dateCollected: 'desc' },
    });

    const patientSubmissions = await db.submission.findMany({
      where: { patientId: id },
      orderBy: { createdAt: 'desc' },
      include: { _count: true },
    });

    return NextResponse.json({
      ...patient,
      biomarkers: patientBiomarkers,
      submissions: patientSubmissions,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch patient' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const existing = await db.patient.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    const allowedFields = ['firstName', 'lastName', 'gender', 'mrn', 'memberId', 'payerId', 'payerName', 'phone', 'email', 'address', 'diagnosisNotes'];
    for (const field of allowedFields) {
      if (body[field] !== undefined) updateData[field] = body[field];
    }
    if (body.dateOfBirth) updateData.dateOfBirth = body.dateOfBirth;
    if (body.allergies !== undefined) updateData.allergies = typeof body.allergies === 'object' ? JSON.stringify(body.allergies) : body.allergies;

    const patient = await db.patient.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(patient);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update patient' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const existing = await db.patient.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    await db.patient.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ message: 'Patient soft-deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete patient' }, { status: 500 });
  }
}
