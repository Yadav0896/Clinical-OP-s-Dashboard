'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import type { ClinicalRecord } from '@/lib/clinical-data';
import { totalTasks } from '@/lib/clinical-data';

interface TrendChartProps {
  data: ClinicalRecord[];
}

export function TrendChart({ data }: TrendChartProps) {
  const chartData = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of data) {
      if (r.date) {
        map.set(r.date, (map.get(r.date) || 0) + totalTasks(r));
      }
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, total]) => {
        const d = new Date(date + 'T00:00:00');
        const formatted = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return { date: formatted, total };
      });
  }, [data]);

  if (chartData.length <= 1) return null;

  return (
    <Card className="bg-white border border-slate-200 rounded-xl shadow-sm">
      <CardHeader className="pb-2 pt-4 px-5">
        <CardTitle className="text-sm font-semibold text-slate-700">Daily Task Volume</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis
              dataKey="date"
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
            <Line
              type="monotone"
              dataKey="total"
              name="Tasks"
              stroke="#00897B"
              strokeWidth={2.5}
              dot={{ fill: '#00897B', strokeWidth: 0, r: 4 }}
              activeDot={{ r: 6, fill: '#00897B' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
