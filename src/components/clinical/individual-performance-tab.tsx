'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, Calculator } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import type { ClinicalRecord } from '@/lib/clinical-data';
import { getAgentSummaries, modTasks, MOD_COLORS } from '@/lib/clinical-data';

interface AgentPerformanceTabProps {
  data: ClinicalRecord[];
}

interface ScoreRow {
  timeframeLabel: string;
  timeframeSortKey: string;
  agent: string;
  pi: number;
  sch: number;
  ins: number;
  vob: number;
  fax: number;
  score: number;
}

function getWeekLabel(dateStr: string): string {
  if (!dateStr) return 'Unknown';
  const parts = dateStr.split('-');
  if (parts.length < 3) return dateStr;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  const dateObj = new Date(y, m, d);
  const day = dateObj.getDay();
  const diff = day === 0 ? 6 : day - 1;
  dateObj.setDate(dateObj.getDate() - diff);
  const wy = dateObj.getFullYear();
  const wm = String(dateObj.getMonth() + 1).padStart(2, '0');
  const wd = String(dateObj.getDate()).padStart(2, '0');
  return `Week of ${wy}-${wm}-${wd}`;
}

function getMonthLabel(dateStr: string): string {
  if (!dateStr) return 'Unknown';
  const parts = dateStr.split('-');
  if (parts.length >= 2) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const mIndex = parseInt(parts[1], 10) - 1;
    if (mIndex >= 0 && mIndex < 12) {
      return `${months[mIndex]} ${parts[0]}`;
    }
    return `${parts[0]}-${parts[1]}`;
  }
  return dateStr;
}

export function IndividualPerformanceTab({ data }: AgentPerformanceTabProps) {
  const [timeframe, setTimeframe] = useState<string>('total');

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

  const dateRangeLabel = useMemo(() => {
    const dates = data.map(r => r.date).filter(Boolean).sort();
    if (dates.length === 0) return 'All Dates';
    const min = dates[0];
    const max = dates[dates.length - 1];
    if (min === max) return min;
    return `${min} to ${max}`;
  }, [data]);

  const scoreRows = useMemo(() => {
    const map = new Map<string, ScoreRow>();

    for (const r of data) {
      const agent = r.agent || 'Unknown';
      const dateStr = r.date || 'Unknown';

      let label = dateRangeLabel;
      let sortKey = '0';

      if (timeframe === 'daily') {
        label = dateStr;
        sortKey = dateStr;
      } else if (timeframe === 'weekly') {
        label = getWeekLabel(dateStr);
        sortKey = label;
      } else if (timeframe === 'monthly') {
        label = getMonthLabel(dateStr);
        sortKey = dateStr.slice(0, 7); // YYYY-MM
      }

      const key = timeframe === 'total' ? agent : `${sortKey}::${agent}`;
      if (!map.has(key)) {
        map.set(key, {
          timeframeLabel: label,
          timeframeSortKey: sortKey,
          agent,
          pi: 0,
          sch: 0,
          ins: 0,
          vob: 0,
          fax: 0,
          score: 0,
        });
      }

      const row = map.get(key)!;
      row.pi += modTasks(r, 'Patient Intake');
      row.sch += modTasks(r, 'Scheduling');
      row.ins += modTasks(r, 'Insurance');
      row.vob += modTasks(r, 'VOB');
      row.fax += modTasks(r, 'Fax');
    }

    const rows = Array.from(map.values());
    for (const row of rows) {
      row.score = (row.pi * 5) + (row.sch * 4) + (row.ins * 3) + (row.vob * 3) + (row.fax * 1);
    }

    return rows.sort((a, b) => {
      if (timeframe !== 'total') {
        const tCompare = b.timeframeSortKey.localeCompare(a.timeframeSortKey);
        if (tCompare !== 0) return tCompare;
      }
      return b.score - a.score;
    });
  }, [data, timeframe, dateRangeLabel]);

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

      {/* Performance Calculation Score Table */}
      <Card className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <CardHeader className="pb-3 pt-5 px-5 bg-slate-50/50 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <Calculator size={16} className="text-teal-600" />
              Performance Scoring Engine
            </CardTitle>
            <p className="text-[11px] text-slate-500 mt-1">
              Formula: <span className="font-medium text-slate-700">Intake × 5</span> + <span className="font-medium text-slate-700">Scheduling × 4</span> + <span className="font-medium text-slate-700">Insurance × 3</span> + <span className="font-medium text-slate-700">VOB Docs × 3</span> + <span className="font-medium text-slate-700">Fax × 1</span>
            </p>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="text-xs text-slate-500 font-medium">Timeframe:</span>
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger className="w-[140px] h-8 text-xs bg-white border-slate-200 font-medium text-teal-700">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="total" className="font-semibold text-teal-800">Total Period</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50 border-b border-slate-100">
                <TableRow>
                  <TableHead className="text-xs font-semibold text-slate-600 pl-5">Timeframe</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600">Individual Name</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 text-center">Intake (×5)</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 text-center">Scheduling (×4)</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 text-center">Insurance (×3)</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 text-center">VOB Docs (×3)</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 text-center">Fax (×1)</TableHead>
                  <TableHead className="text-xs font-bold text-teal-700 text-right pr-5">Total Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scoreRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-xs text-slate-400">
                      No records available for the selected view.
                    </TableCell>
                  </TableRow>
                ) : (
                  scoreRows.map((row, idx) => (
                    <TableRow key={`${row.timeframeSortKey}-${row.agent}-${idx}`} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="text-xs font-medium text-slate-600 pl-5 whitespace-nowrap">
                        {row.timeframeLabel}
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-slate-800 whitespace-nowrap">
                        {row.agent}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600 text-center">
                        {row.pi.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600 text-center">
                        {row.sch.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600 text-center">
                        {row.ins.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600 text-center">
                        {row.vob.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600 text-center">
                        {row.fax.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-xs font-bold text-teal-600 text-right pr-5 bg-teal-50/30">
                        {row.score.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
