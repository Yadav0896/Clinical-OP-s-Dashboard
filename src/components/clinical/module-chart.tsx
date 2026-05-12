'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
} from 'recharts';
import type { ClinicalRecord } from '@/lib/clinical-data';
import { modTasks, MOD_NAMES, MOD_COLORS } from '@/lib/clinical-data';

interface ModuleChartProps {
  data: ClinicalRecord[];
}

export function ModuleChart({ data }: ModuleChartProps) {
  const chartData = useMemo(() => {
    return MOD_NAMES.map((name, i) => ({
      name: name as string,
      value: data.reduce((sum, r) => sum + modTasks(r, name as string), 0),
      color: MOD_COLORS[i],
    })).filter(d => d.value > 0);
  }, [data]);

  if (chartData.length === 0) {
    return (
      <Card className="bg-white border border-slate-200 rounded-xl shadow-sm">
        <CardHeader className="pb-2 pt-4 px-5">
          <CardTitle className="text-sm font-semibold text-slate-700">Task Distribution</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <span className="text-sm text-slate-400">No data available</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border border-slate-200 rounded-xl shadow-sm">
      <CardHeader className="pb-2 pt-4 px-5">
        <CardTitle className="text-sm font-semibold text-slate-700">Task Distribution by Module</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="flex items-center justify-center gap-8">
          <ResponsiveContainer width={200} height={200}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                dataKey="value"
                paddingAngle={2}
                strokeWidth={0}
              >
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: '#fff',
                  border: '1px solid #E2E8F0',
                  borderRadius: 8,
                  fontSize: 12,
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-2.5">
            {chartData.map((d) => (
              <div key={d.name} className="flex items-center gap-2.5 text-sm">
                <span
                  className="w-3 h-3 rounded-sm flex-shrink-0"
                  style={{ background: d.color }}
                />
                <span className="text-slate-500 text-xs min-w-[90px]">{d.name}</span>
                <span className="font-semibold text-slate-800 ml-auto text-xs">
                  {d.value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
