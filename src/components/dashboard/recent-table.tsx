"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { STAGE_LABELS, STAGE_COLORS } from "@/lib/constants";
import { format } from "date-fns";
import type { Submission } from "@/lib/api";

interface RecentTableProps {
  submissions: Submission[];
  isLoading: boolean;
}

export function RecentTable({ submissions, isLoading }: RecentTableProps) {
  if (isLoading) {
    return (
      <Card className="border-slate-200 shadow-none">
        <CardContent className="p-6">
          <div className="animate-shimmer h-48 rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (submissions.length === 0) {
    return (
      <Card className="border-slate-200 shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-700">Recent Submissions</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="py-8 text-center text-sm text-slate-400">No submissions yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200 shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-slate-700">Recent Submissions</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="pb-2 text-left text-xs font-medium text-slate-400">Patient</th>
                <th className="pb-2 text-left text-xs font-medium text-slate-400">Drug</th>
                <th className="pb-2 text-left text-xs font-medium text-slate-400">Payer</th>
                <th className="pb-2 text-left text-xs font-medium text-slate-400">Stage</th>
                <th className="pb-2 text-left text-xs font-medium text-slate-400">Created</th>
              </tr>
            </thead>
            <tbody>
              {submissions.slice(0, 10).map((sub) => (
                <tr key={sub.id} className="border-b border-slate-50 last:border-0">
                  <td className="py-2.5 font-medium text-slate-700">
                    {sub.patient ? `${sub.patient.firstName} ${sub.patient.lastName}` : "—"}
                  </td>
                  <td className="py-2.5 text-slate-600">{sub.drugName}</td>
                  <td className="py-2.5 text-slate-600">{sub.payerName}</td>
                  <td className="py-2.5">
                    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${STAGE_COLORS[sub.stage] || "bg-slate-100 text-slate-600"}`}>
                      {STAGE_LABELS[sub.stage] || sub.stage}
                    </span>
                  </td>
                  <td className="py-2.5 text-xs text-slate-400">
                    {format(new Date(sub.createdAt), "MMM d, yyyy")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
