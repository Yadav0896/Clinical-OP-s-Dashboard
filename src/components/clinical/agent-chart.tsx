'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import type { ClinicalRecord } from '@/lib/clinical-data';
import { modTasks } from '@/lib/clinical-data';

interface AgentChartProps {
  data: ClinicalRecord[];
}

export function AgentChart({ data }: AgentChartProps) {
  const chartData = useMemo(() => {
    const map = new Map<string, { name: string; pi: number; ins: number; sch: number; fax: number; vob: number; total: number }>();

    for (const r of data) {
      const agent = r.agent || 'Unknown';
      if (!map.has(agent)) {
        map.set(agent, { name: agent, pi: 0, ins: 0, sch: 0, fax: 0, vob: 0, total: 0 });
      }
      const d = map.get(agent)!;
      d.pi += modTasks(r, 'Patient Intake');
      d.ins += modTasks(r, 'Insurance');
      d.sch += modTasks(r, 'Scheduling');
      d.fax += modTasks(r, 'Fax');
      d.vob += modTasks(r, 'VOB');
      d.total = d.pi + d.ins + d.sch + d.fax + d.vob;
    }

    return Array.from(map.values())
      .sort((a, b) => b.total - a.total)
      .map(d => ({ ...d, name: d.name.split(' ')[0] }));
  }, [data]);

  return (
    <Card className="bg-white border border-slate-200 rounded-xl shadow-sm">
      <CardHeader className="pb-2 pt-4 px-5">
        <CardTitle className="text-sm font-semibold text-slate-700">Tasks by Agent</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis
              dataKey="name"
              tick={{ fill: '#64748B', fontSize: 11 }}
              axisLine={{ stroke: '#E2E8F0' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#64748B', fontSize: 11 }}
              axisLine={{ stroke: '#E2E8F0' }}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                background: '#fff',
                border: '1px solid #E2E8F0',
                borderRadius: 8,
                fontSize: 12,
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
              }}
              labelStyle={{ fontWeight: 600, color: '#1E293B' }}
            />
            <Bar dataKey="total" name="Total Tasks" fill="#00897B" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
