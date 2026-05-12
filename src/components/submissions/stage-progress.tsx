"use client";

import { cn } from "@/lib/utils";
import { STAGE_LABELS, STAGE_ORDER, STAGE_DOT_COLORS } from "@/lib/constants";
import { Check } from "lucide-react";

interface StageProgressProps {
  currentStage: string;
}

export function StageProgress({ currentStage }: StageProgressProps) {
  const currentIndex = STAGE_ORDER.indexOf(currentStage);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h4 className="mb-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">NTAA Workflow Progress</h4>
      <div className="flex items-center justify-between">
        {STAGE_ORDER.map((stage, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isDecision = stage === "approved" || stage === "denied";

          // Split into two paths at submitted
          if (stage === "approved") {
            return null; // We'll handle it below
          }
          if (stage === "denied") {
            return null;
          }

          return (
            <div key={stage} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                    isCompleted
                      ? "bg-teal-600 text-white"
                      : isCurrent
                        ? "border-2 border-teal-600 bg-white text-teal-600"
                        : "border border-slate-200 bg-slate-50 text-slate-300"
                  )}
                >
                  {isCompleted ? <Check className="h-3.5 w-3.5" /> : index + 1}
                </div>
                <span className={cn(
                  "mt-1 text-center text-[10px] leading-tight",
                  isCompleted ? "font-medium text-teal-600" : isCurrent ? "font-medium text-slate-700" : "text-slate-400"
                )}>
                  {STAGE_LABELS[stage]}
                </span>
              </div>
              {index < STAGE_ORDER.length - 1 && stage !== "submitted" && (
                <div className={cn(
                  "mx-1 h-0.5 w-8",
                  index < currentIndex ? "bg-teal-600" : "bg-slate-200"
                )} />
              )}
            </div>
          );
        })}
        {/* Decision branches */}
        <div className="mx-1 h-0.5 w-4 bg-slate-200" />
        <div className="flex gap-1">
          <div className="flex flex-col items-center">
            <div className={cn(
              "flex h-7 w-7 items-center justify-center rounded-full text-xs",
              currentStage === "approved" ? "bg-emerald-500 text-white" : "border border-slate-200 bg-slate-50 text-slate-300"
            )}>
              {currentStage === "approved" ? <Check className="h-3.5 w-3.5" /> : "✓"}
            </div>
            <span className="mt-1 text-[10px] text-slate-400">Approved</span>
          </div>
          <div className="flex flex-col items-center">
            <div className={cn(
              "flex h-7 w-7 items-center justify-center rounded-full text-xs",
              currentStage === "denied" ? "bg-red-500 text-white" : "border border-slate-200 bg-slate-50 text-slate-300"
            )}>
              {currentStage === "denied" ? <Check className="h-3.5 w-3.5" /> : "✗"}
            </div>
            <span className="mt-1 text-[10px] text-slate-400">Denied</span>
          </div>
        </div>
      </div>
    </div>
  );
}
