import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Total counts
    const [totalPatients, totalSubmissions, totalDocuments, totalUsers] = await Promise.all([
      db.patient.count({ where: { isActive: true } }),
      db.submission.count(),
      db.document.count(),
      db.user.count({ where: { isActive: true } }),
    ]);

    // Submissions by stage
    const submissionsByStageRaw = await db.submission.groupBy({
      by: ['stage'],
      _count: { stage: true },
    });
    const submissionsByStage: Record<string, number> = {};
    for (const item of submissionsByStageRaw) {
      const key = (item as Record<string, unknown>).stage as string;
      const countVal = (item as Record<string, unknown>)._count;
      submissionsByStage[key] = typeof countVal === 'number' ? countVal : (countVal as Record<string, number>).stage;
    }

    // Submissions by drug
    const submissionsByDrugRaw = await db.submission.groupBy({
      by: ['drugId'],
      _count: { drugId: true },
    });
    const submissionsByDrug: Record<string, number> = {};
    for (const item of submissionsByDrugRaw) {
      const key = (item as Record<string, unknown>).drugId as string;
      const countVal = (item as Record<string, unknown>)._count;
      submissionsByDrug[key] = typeof countVal === 'number' ? countVal : (countVal as Record<string, number>).drugId;
    }

    // Submissions by payer
    const submissionsByPayerRaw = await db.submission.groupBy({
      by: ['payerId'],
      _count: { payerId: true },
    });
    const submissionsByPayer: Record<string, number> = {};
    for (const item of submissionsByPayerRaw) {
      const key = (item as Record<string, unknown>).payerId as string;
      const countVal = (item as Record<string, unknown>)._count;
      submissionsByPayer[key] = typeof countVal === 'number' ? countVal : (countVal as Record<string, number>).payerId;
    }

    // Average days to decision
    const decidedSubmissions = await db.submission.findMany({
      where: {
        stage: { in: ['approved', 'denied'] },
      } as Record<string, unknown>,
    });
    const decidedWithDays = decidedSubmissions.filter(s => s.daysToDecision != null);
    const avgDaysToDecision = decidedWithDays.length > 0
      ? Math.round(decidedWithDays.reduce((sum, s) => sum + Number(s.daysToDecision || 0), 0) / decidedWithDays.length)
      : 0;

    // Approval rate
    const approvedCount = submissionsByStage['approved'] || 0;
    const deniedCount = submissionsByStage['denied'] || 0;
    const totalDecided = approvedCount + deniedCount;
    const approvalRate = totalDecided > 0 ? Math.round((approvedCount / totalDecided) * 100) : 0;

    // Recent submissions (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentSubmissions = await db.submission.count({
      where: { createdAt: { gte: sevenDaysAgo.toISOString() } } as Record<string, unknown>,
    });

    // Urgent submissions
    const urgentSubmissions = await db.submission.count({
      where: {
        priority: 'urgent',
        stage: { notIn: ['approved', 'denied', 'closed'] },
      } as Record<string, unknown>,
    });

    // Pending submissions (need attention)
    const pendingSubmissions = await db.submission.count({
      where: {
        stage: { in: ['expert_review', 'submitted'] },
      } as Record<string, unknown>,
    });

    // Documents by status
    const documentsByStatusRaw = await db.document.groupBy({
      by: ['status'],
      _count: { status: true },
    });
    const documentsByStatus: Record<string, number> = {};
    for (const item of documentsByStatusRaw) {
      const key = (item as Record<string, unknown>).status as string;
      const countVal = (item as Record<string, unknown>)._count;
      documentsByStatus[key] = typeof countVal === 'number' ? countVal : (countVal as Record<string, number>).status;
    }

    return NextResponse.json({
      overview: {
        totalPatients,
        totalSubmissions,
        totalDocuments,
        totalUsers,
        avgDaysToDecision,
        approvalRate,
      },
      submissions: {
        byStage: submissionsByStage,
        byDrug: submissionsByDrug,
        byPayer: submissionsByPayer,
        recentCount: recentSubmissions,
        urgentCount: urgentSubmissions,
        pendingCount: pendingSubmissions,
      },
      documents: {
        byStatus: documentsByStatus,
      },
      stages: submissionsByStage,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 });
  }
}
