'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Award } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import type { ClinicalRecord } from '@/lib/clinical-data';
import { getAgentSummaries, MOD_COLORS } from '@/lib/clinical-data';

interface AgentPerformanceTabProps {
  data: ClinicalRecord[];
}

export function AgentPerformanceTab({ data }: AgentPerformanceTabProps) {
  const summaries = useMemo(() => getAgentSummaries(data), [data]);
  const maxTotal = summaries[0]?.total || 1;

  const stackedData = useMemo(() => {
    return summaries.map(a => ({
      name: a.agent.split(' ')[0],
      fullName: a.agent,
      'Patient Intake': a.pi,
      Insurance: a.ins,
      Scheduling: a.sch,
      Fax: a.fax,
      VOB: a.vob,
    }));
  }, [summaries]);

  const modules = [
    { name: 'Patient Intake', color: MOD_COLORS[0] },
    { name: 'Insurance', color: MOD_COLORS[1] },
    { name: 'Scheduling', color: MOD_COLORS[2] },
    { name: 'Fax', color: MOD_COLORS[3] },
    { name: 'VOB', color: MOD_COLORS[4] },
  ];

  return (
    <div className="space-y-6">
      {/* Agent Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {summaries.map((a, i) => {
          const pct = Math.round((a.total / maxTotal) * 100);
          const avgDay = a.days.size > 0 ? Math.round(a.total / a.days.size) : 0;

          return (
            <Card
              key={a.agent}
              className="bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow"
            >
              <CardContent className="p-5">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center font-bold text-white text-sm">
                      {a.agent.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800 text-sm">{a.agent}</div>
                      <div className="text-[11px] text-slate-400">
                        {Array.from(a.clinics).map(c => c.replace(' Allergy', '')).join(', ')}
                      </div>
                    </div>
                  </div>
                  {i === 0 && <Award size={18} className="text-amber-500" />}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center bg-slate-50 rounded-lg py-2.5 px-1">
                    <div className="text-xl font-bold text-slate-800">{a.total.toLocaleString()}</div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">Tasks</div>
                  </div>
                  <div className="text-center bg-slate-50 rounded-lg py-2.5 px-1">
                    <div className="text-xl font-bold text-teal-600">{avgDay}</div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">Avg/Day</div>
                  </div>
                  <div className="text-center bg-slate-50 rounded-lg py-2.5 px-1">
                    <div className="text-xl font-bold text-slate-600">{a.days.size}</div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">Days</div>
                  </div>
                </div>

                {/* Module Breakdown */}
                <div className="space-y-2">
                  {modules.map(m => {
                    const val = (
                      m.name === 'Patient Intake' ? a.pi :
                      m.name === 'Insurance' ? a.ins :
                      m.name === 'Scheduling' ? a.sch :
                      m.name === 'Fax' ? a.fax :
                      a.vob
                    );
                    if (val === 0) return null;
                    return (
                      <div key={m.name} className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: m.color }} />
                        <span className="text-xs text-slate-500 flex-1">{m.name}</span>
                        <span className="text-xs font-semibold text-slate-700">{val.toLocaleString()}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Progress Bar */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-teal-500 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-400 font-medium">{pct}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Stacked Bar Chart */}
      <Card className="bg-white border border-slate-200 rounded-xl shadow-sm">
        <CardHeader className="pb-2 pt-4 px-5">
          <CardTitle className="text-sm font-semibold text-slate-700">Individual Performance by Module</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stackedData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
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
              <Legend wrapperStyle={{ fontSize: 11, color: '#64748B' }} />
              <Bar dataKey="Patient Intake" stackId="a" fill="#3B82F6" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Insurance" stackId="a" fill="#22C55E" />
              <Bar dataKey="Scheduling" stackId="a" fill="#A855F7" />
              <Bar dataKey="Fax" stackId="a" fill="#F59E0B" />
              <Bar dataKey="VOB" stackId="a" fill="#EF4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
