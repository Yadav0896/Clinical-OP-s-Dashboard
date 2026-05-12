"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Users,
  FileCheck,
  Clock,
  TrendingUp,
  CalendarDays,
  AlertTriangle,
} from "lucide-react";
import type { DashboardStats } from "@/lib/api";

interface StatCardsProps {
  stats: DashboardStats | undefined;
  isLoading: boolean;
}

const STAT_CARDS = [
  {
    key: "totalPatients",
    label: "Total Patients",
    icon: Users,
    color: "text-teal-600",
    bg: "bg-teal-50",
    iconBg: "bg-teal-100",
  },
  {
    key: "activeSubmissions",
    label: "Active Submissions",
    icon: FileCheck,
    color: "text-blue-600",
    bg: "bg-blue-50",
    iconBg: "bg-blue-100",
    getValue: (s: DashboardStats) => {
      const by = s.submissions.byStage;
      return (by.expert_review || 0) + (by.submitted || 0) + (by.draft || 0) + (by.patient_setup || 0);
    },
  },
  {
    key: "pendingReviews",
    label: "Pending Reviews",
    icon: Clock,
    color: "text-amber-600",
    bg: "bg-amber-50",
    iconBg: "bg-amber-100",
    getValue: (s: DashboardStats) => s.submissions.pendingCount,
  },
  {
    key: "approvalRate",
    label: "Approval Rate",
    icon: TrendingUp,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    iconBg: "bg-emerald-100",
    format: "percent" as const,
  },
  {
    key: "avgDays",
    label: "Avg Days to Decision",
    icon: CalendarDays,
    color: "text-purple-600",
    bg: "bg-purple-50",
    iconBg: "bg-purple-100",
    getValue: (s: DashboardStats) => s.overview.avgDaysToDecision,
  },
  {
    key: "urgent",
    label: "Urgent Items",
    icon: AlertTriangle,
    color: "text-red-600",
    bg: "bg-red-50",
    iconBg: "bg-red-100",
    getValue: (s: DashboardStats) => s.submissions.urgentCount,
  },
];

export function StatCards({ stats, isLoading }: StatCardsProps) {
  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="border-slate-200">
            <CardContent className="p-4">
              <div className="animate-shimmer h-16 rounded-lg" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
      {STAT_CARDS.map((card) => {
        const value = card.getValue
          ? card.getValue(stats)
          : (stats.overview as Record<string, number>)[card.key] ?? 0;
        const displayValue = card.format === "percent" ? `${value}%` : String(value);
        const Icon = card.icon;

        return (
          <Card key={card.key} className="border-slate-200 shadow-none">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", card.iconBg)}>
                  <Icon className={cn("h-4.5 w-4.5", card.color)} />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-slate-400">{card.label}</span>
                  <span className={cn("text-xl font-bold", card.color)}>{displayValue}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
