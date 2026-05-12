'use client';

import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Activity, Users, TrendingUp, Award, Printer, FileCheck } from 'lucide-react';
import type { ClinicalRecord } from '@/lib/clinical-data';
import { totalTasks, getAgentSummaries } from '@/lib/clinical-data';

interface KpiCardsProps {
  data: ClinicalRecord[];
}

const CARDS = [
  { label: 'Total Tasks', key: 'total', accent: '#00897B', icon: Activity },
  { label: 'Active Individuals', key: 'agents', accent: '#3B82F6', icon: Users },
  { label: 'Avg Tasks/Day', key: 'avg', accent: '#A855F7', icon: TrendingUp },
  { label: 'Top Performer', key: 'top', accent: '#22C55E', icon: Award },
  { label: 'Fax Success Rate', key: 'fax', accent: '#F59E0B', icon: Printer },
  { label: 'VOB Match Rate', key: 'vob', accent: '#EF4444', icon: FileCheck },
] as const;

export function KpiCards({ data }: KpiCardsProps) {
  const metrics = useMemo(() => {
    const uniqueAgents = new Set(data.map(r => r.agent).filter(Boolean));
    const uniqueDays = new Set(data.map(r => r.date).filter(Boolean));
    const total = data.reduce((sum, r) => sum + totalTasks(r), 0);

    const agentTotals = new Map<string, number>();
    data.forEach(r => {
      const name = r.agent || 'Unknown';
      agentTotals.set(name, (agentTotals.get(name) || 0) + totalTasks(r));
    });
    let topAgent = 'N/A';
    let topCount = 0;
    agentTotals.forEach((count, agent) => {
      if (count > topCount) { topCount = count; topAgent = agent; }
    });

    const faxReceived = data.reduce((s, r) => s + r.faxReceived, 0);
    const faxClassified = data.reduce((s, r) => s + r.faxClassified, 0);
    const faxRate = faxReceived > 0 ? Math.round((faxClassified / faxReceived) * 100) : 0;

    const vobTotal = data.reduce((s, r) => s + r.vobTotal, 0);
    const vobMatched = data.reduce((s, r) => s + r.vobMatched, 0);
    const vobRate = vobTotal > 0 ? Math.round((vobMatched / vobTotal) * 100) : 0;

    const summaries = getAgentSummaries(data);

    return {
      total,
      agents: uniqueAgents.size,
      days: uniqueDays.size,
      avg: uniqueDays.size > 0 ? Math.round(total / uniqueDays.size) : 0,
      topAgent,
      topCount,
      faxRate,
      vobRate,
      summaries,
    };
  }, [data]);

  const values: Record<string, { value: string; sub: string }> = {
    total: { value: metrics.total.toLocaleString(), sub: `${data.length} records` },
    agents: { value: String(metrics.agents), sub: `${metrics.days} days tracked` },
    avg: { value: String(metrics.avg), sub: 'Per active day' },
    top: { value: metrics.topAgent.split(' ')[0], sub: `${metrics.topCount.toLocaleString()} tasks` },
    fax: { value: `${metrics.faxRate}%`, sub: 'Classification rate' },
    vob: { value: `${metrics.vobRate}%`, sub: 'Match rate' },
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {CARDS.map(card => {
        const Icon = card.icon;
        const v = values[card.key];
        return (
          <Card
            key={card.key}
            className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="h-[3px]" style={{ background: card.accent }} />
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  {card.label}
                </span>
                <Icon size={14} className="text-slate-300" />
              </div>
              <div className="text-[26px] font-bold text-slate-800 leading-tight">
                {v.value}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">{v.sub}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
