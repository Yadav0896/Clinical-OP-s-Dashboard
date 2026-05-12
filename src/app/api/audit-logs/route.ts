import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const submissionId = searchParams.get('submissionId');
    const action = searchParams.get('action');
    const entity = searchParams.get('entity');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: Record<string, unknown> = {};
    if (userId) where.userId = userId;
    if (submissionId) where.submissionId = submissionId;
    if (action) where.action = action;
    if (entity) where.entity = entity;

    const [auditLogsList, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: true,
          submission: true,
        },
      }),
      db.auditLog.count({ where }),
    ]);

    return NextResponse.json({
      auditLogs: auditLogsList,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
  }
}
