import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { firstName, lastName, dateOfBirth, gender, mrn, memberId, payerId, payerName, phone, email, address, allergies, diagnosisNotes } = body;

    if (!firstName || !lastName || !dateOfBirth) {
      return NextResponse.json({ error: 'Missing required fields: firstName, lastName, dateOfBirth' }, { status: 400 });
    }

    const patient = await db.patient.create({
      data: {
        firstName,
        lastName,
        dateOfBirth,
        gender,
        mrn,
        memberId,
        payerId,
        payerName,
        phone,
        email,
        address,
        allergies: allergies ? JSON.stringify(allergies) : null,
        diagnosisNotes,
        isActive: true,
      } as Parameters<typeof db.patient.create>[0]['data'],
    });

    return NextResponse.json(patient, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create patient', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const where: Record<string, unknown> = { isActive: true };
    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { mrn: { contains: search } },
        { memberId: { contains: search } },
      ];
    }

    const [patientsList, total] = await Promise.all([
      db.patient.findMany({
        where,
        orderBy: { [sortBy]: sortOrder as 'asc' | 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { _count: true },
      }),
      db.patient.count({ where }),
    ]);

    return NextResponse.json({
      patients: patientsList,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch patients' }, { status: 500 });
  }
}
