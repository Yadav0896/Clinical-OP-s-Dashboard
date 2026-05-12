import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: patientId } = await params;
    const body = await req.json();
    const { type, value, unit, dateCollected, notes } = body;

    if (!type || value === undefined || !dateCollected) {
      return NextResponse.json({ error: 'Missing required fields: type, value, dateCollected' }, { status: 400 });
    }

    const patient = await db.patient.findUnique({ where: { id: patientId } });
    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    const biomarker = await db.biomarker.create({
      data: {
        patientId,
        type,
        value: parseFloat(value),
        unit,
        dateCollected,
        notes,
      },
    });

    return NextResponse.json(biomarker, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add biomarker' }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: patientId } = await params;
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');

    const where: Record<string, unknown> = { patientId };
    if (type) where.type = type;

    const bioList = await db.biomarker.findMany({
      where,
      orderBy: { dateCollected: 'desc' },
    });

    return NextResponse.json(bioList);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch biomarkers' }, { status: 500 });
  }
}
