'use client';

import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import type { ClinicalRecord } from '@/lib/clinical-data';
import { modTasks, MOD_NAMES, MOD_COLORS } from '@/lib/clinical-data';

interface ModuleCardsProps {
  data: ClinicalRecord[];
}

const MODULE_SUBS: Record<string, string> = {
  'Patient Intake': 'PR + HH corrections',
  'Insurance': 'Verify + Update + VOB',
  'Scheduling': 'Corrections + Duplicates',
  'Fax': 'Classify + Forward',
  'VOB': 'Match + Create + Update',
};

export function ModuleCards({ data }: ModuleCardsProps) {
  const moduleTotals = useMemo(() => {
    return MOD_NAMES.map((name, i) => ({
      name: name as string,
      value: data.reduce((sum, r) => sum + modTasks(r, name as string), 0),
      color: MOD_COLORS[i],
      sub: MODULE_SUBS[name as string] || '',
    }));
  }, [data]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {moduleTotals.map(m => (
        <Card
          key={m.name}
          className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
        >
          <CardContent className="p-4 flex gap-3">
            <div className="w-1 rounded-full flex-shrink-0" style={{ background: m.color }} />
            <div className="min-w-0 flex-1">
              <div
                className="text-[10px] font-bold uppercase tracking-wider mb-1"
                style={{ color: m.color }}
              >
                {m.name}
              </div>
              <div className="text-2xl font-bold text-slate-800">{m.value.toLocaleString()}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">{m.sub}</div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
