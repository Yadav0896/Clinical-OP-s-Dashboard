'use client';

import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Activity, Users, TrendingUp, Award, Printer } from 'lucide-react';
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
] as const;

export function KpiCards({ data }: KpiCardsProps) {
  const metrics = useMemo(() => {
    const uniqueAgents = new Set(data.map(r => r.agent).filter(Boolean));
    const uniqueDays = new Set(data.map(r => r.date).filter(Boolean));
    const total = data.reduce((sum, r) => sum + totalTasks(r), 0);

    // Use getAgentSummaries (now sorted by weighted score)
    const summaries = getAgentSummaries(data);
    const topAgent = summaries.length > 0 ? summaries[0].agent : 'N/A';
    const topScore = summaries.length > 0 ? summaries[0].score : 0;

    // Fax: classification rate (Step 1)
    const faxReceived = data.reduce((s, r) => s + r.faxReceived, 0);
    const faxClassified = data.reduce((s, r) => s + r.faxClassified, 0);
    const faxRate = faxReceived > 0 ? Math.round((faxClassified / faxReceived) * 100) : 0;

    return {
      total,
      agents: uniqueAgents.size,
      days: uniqueDays.size,
      avg: uniqueDays.size > 0 ? Math.round(total / uniqueDays.size) : 0,
      topAgent,
      topScore,
      faxRate,
      faxReceived,
      faxClassified,
      summaries,
    };
  }, [data]);

  const values: Record<string, { value: string; sub: string }> = {
    total: { value: metrics.total.toLocaleString(), sub: `${data.length} records` },
    agents: { value: String(metrics.agents), sub: `${metrics.days} days tracked` },
    avg: { value: String(metrics.avg), sub: 'Per active day' },
    top: { 
      value: metrics.topAgent.split(' ')[0], 
      sub: `${metrics.topScore.toLocaleString()} score` 
    },
    fax: { 
      value: `${metrics.faxRate}%`, 
      sub: `${metrics.faxClassified}/${metrics.faxReceived} classified` 
    },
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {CARDS.map(card => {
        const Icon = card.icon;
        const v = values[card.key];
        return (
          <Card
            key={card.key}
            className="bg-white/95 backdrop-blur-xs border border-slate-200/80 rounded-xl overflow-hidden shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group"
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
