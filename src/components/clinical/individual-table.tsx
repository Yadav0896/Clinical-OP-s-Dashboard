'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { ClinicalRecord } from '@/lib/clinical-data';
import { getAgentSummaries, MOD_COLORS } from '@/lib/clinical-data';

interface AgentTableProps {
  data: ClinicalRecord[];
}

export function IndividualTable({ data }: AgentTableProps) {
  const summaries = useMemo(() => getAgentSummaries(data), [data]);
  const maxTotal = summaries[0]?.total || 1;

  const getBadge = (_total: number, avg: number) => {
    if (avg >= 120) return { label: 'Excellent', variant: 'default' as const, className: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' };
    if (avg >= 80) return { label: 'Good', variant: 'secondary' as const, className: 'bg-blue-100 text-blue-700 hover:bg-blue-100' };
    if (avg >= 50) return { label: 'Average', variant: 'outline' as const, className: 'bg-amber-100 text-amber-700 hover:bg-amber-100' };
    return { label: 'Below Avg', variant: 'outline' as const, className: 'bg-red-100 text-red-700 hover:bg-red-100' };
  };

  return (
    <Card className="bg-white border border-slate-200 rounded-xl shadow-sm">
      <CardHeader className="pb-2 pt-4 px-5">
        <CardTitle className="text-sm font-semibold text-slate-700">Individual Summary</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[400px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="text-slate-500 uppercase text-[10px] font-semibold tracking-wider">Individual</TableHead>
                <TableHead className="text-slate-500 uppercase text-[10px] font-semibold tracking-wider text-right">Tasks</TableHead>
                <TableHead className="text-slate-500 uppercase text-[10px] font-semibold tracking-wider text-right">Days</TableHead>
                <TableHead className="text-slate-500 uppercase text-[10px] font-semibold tracking-wider text-right">Avg/Day</TableHead>
                <TableHead className="text-slate-500 uppercase text-[10px] font-semibold tracking-wider">Module Breakdown</TableHead>
                <TableHead className="text-slate-500 uppercase text-[10px] font-semibold tracking-wider text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summaries.map((a, i) => {
                const pct = Math.round((a.total / maxTotal) * 100);
                const avg = a.days.size > 0 ? Math.round(a.total / a.days.size) : 0;
                const badge = getBadge(a.total, avg);
                const modules = [
                  { name: 'PI', val: a.pi, color: MOD_COLORS[0] },
                  { name: 'Ins', val: a.ins, color: MOD_COLORS[1] },
                  { name: 'Sch', val: a.sch, color: MOD_COLORS[2] },
                  { name: 'Fax', val: a.fax, color: MOD_COLORS[3] },
                  { name: 'VOB', val: a.vob, color: MOD_COLORS[4] },
                ].filter(m => m.val > 0);

                return (
                  <TableRow key={a.agent} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <TableCell className="py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center text-[11px] font-bold text-teal-700">
                          {i + 1}
                        </span>
                        <span className="font-medium text-slate-800 text-sm">{a.agent}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 text-right font-semibold text-slate-800 text-sm">
                      {a.total.toLocaleString()}
                    </TableCell>
                    <TableCell className="py-3 text-right text-slate-600 text-sm">
                      {a.days.size}
                    </TableCell>
                    <TableCell className="py-3 text-right text-slate-600 text-sm">
                      {avg}
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-teal-500 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="flex gap-1 flex-wrap">
                          {modules.map(m => (
                            <span
                              key={m.name}
                              className="px-1.5 py-0.5 rounded text-[10px] font-semibold"
                              style={{
                                background: m.color + '15',
                                color: m.color,
                              }}
                            >
                              {m.name}:{m.val}
                            </span>
                          ))}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 text-center">
                      <Badge variant={badge.variant} className={badge.className}>
                        {badge.label}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
