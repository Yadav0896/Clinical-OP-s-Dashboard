"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { STAGE_LABELS, DRUGS, STAGE_ORDER } from "@/lib/constants";
import type { DashboardStats } from "@/lib/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface ChartsProps {
  stats: DashboardStats | undefined;
  isLoading: boolean;
}

const PIE_COLORS = ["#0d9488", "#3b82f6", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4", "#ec4899"];

export function Charts({ stats, isLoading }: ChartsProps) {
  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border-slate-200 shadow-none">
          <CardContent className="p-6">
            <div className="animate-shimmer h-72 rounded-lg" />
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-none">
          <CardContent className="p-6">
            <div className="animate-shimmer h-72 rounded-lg" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const stageData = STAGE_ORDER.map((stage) => ({
    name: STAGE_LABELS[stage] || stage,
    count: stats.stages[stage] || 0,
  }));

  const drugData = Object.entries(stats.submissions.byDrug).map(([drugId, count]) => ({
    name: DRUGS.find((d) => d.id === drugId)?.name || drugId,
    count,
  }));

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card className="border-slate-200 shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-700">Submissions by Stage</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stageData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
                />
                <Bar dataKey="count" fill="#0d9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-700">Submissions by Drug</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={drugData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="count"
                  nameKey="name"
                >
                  {drugData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  iconSize={8}
                  formatter={(value: string) => <span className="text-xs text-slate-600">{value}</span>}
                />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
