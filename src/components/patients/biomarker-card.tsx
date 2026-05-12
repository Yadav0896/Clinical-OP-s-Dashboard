"use client";

import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface BiomarkerCardProps {
  type: string;
  value: number | null;
  unit: string;
  dateCollected?: string;
}

export function BiomarkerCard({ type, value, unit, dateCollected }: BiomarkerCardProps) {
  const hasValue = value !== null && value !== undefined;

  return (
    <div
      className={cn(
        "flex flex-col rounded-lg border px-3 py-2",
        hasValue ? "border-teal-200 bg-white" : "border-slate-200 bg-slate-50"
      )}
    >
      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{type}</span>
      <div className="flex items-baseline gap-1">
        {hasValue ? (
          <>
            <span className="text-lg font-bold text-slate-800">{value}</span>
            <span className="text-xs text-slate-400">{unit}</span>
          </>
        ) : (
          <span className="text-sm text-slate-300">—</span>
        )}
      </div>
      {dateCollected && (
        <span className="text-[10px] text-slate-400">
          {format(new Date(dateCollected), "MMM d")}
        </span>
      )}
    </div>
  );
}
