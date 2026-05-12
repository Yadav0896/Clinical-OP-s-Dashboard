"use client";

import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Plus,
  FileEdit,
  Upload,
  Send,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Stethoscope,
} from "lucide-react";
import type { TimelineEvent } from "@/lib/api";

interface TimelineProps {
  events: TimelineEvent[];
}

const EVENT_ICONS: Record<string, typeof Clock> = {
  created: Plus,
  stage_changed: FileEdit,
  document_uploaded: Upload,
  submitted: Send,
  approved: CheckCircle2,
  denied: AlertTriangle,
  ai_analysis: Stethoscope,
};

const EVENT_COLORS: Record<string, string> = {
  created: "bg-teal-100 text-teal-600",
  stage_changed: "bg-blue-100 text-blue-600",
  document_uploaded: "bg-purple-100 text-purple-600",
  submitted: "bg-indigo-100 text-indigo-600",
  approved: "bg-emerald-100 text-emerald-600",
  denied: "bg-red-100 text-red-600",
  ai_analysis: "bg-amber-100 text-amber-600",
};

export function Timeline({ events }: TimelineProps) {
  if (!events || events.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h4 className="mb-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Timeline</h4>
        <p className="py-4 text-center text-xs text-slate-400">No events yet</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h4 className="mb-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Timeline</h4>
      <div className="relative space-y-0">
        {events.map((event, index) => {
          const Icon = EVENT_ICONS[event.event] || Clock;
          const colorClass = EVENT_COLORS[event.event] || "bg-slate-100 text-slate-600";

          return (
            <div key={event.id} className="flex gap-3 pb-4 last:pb-0">
              <div className="relative flex flex-col items-center">
                <div className={cn("flex h-6 w-6 items-center justify-center rounded-full", colorClass)}>
                  <Icon className="h-3 w-3" />
                </div>
                {index < events.length - 1 && (
                  <div className="w-px flex-1 bg-slate-200" />
                )}
              </div>
              <div className="flex-1 pt-0.5">
                <p className="text-xs font-medium text-slate-700">{event.description}</p>
                <p className="text-[10px] text-slate-400">
                  {format(new Date(event.createdAt), "MMM d, yyyy 'at' h:mm a")}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
