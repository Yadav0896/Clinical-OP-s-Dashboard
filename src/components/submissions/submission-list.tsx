"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, FileText, Loader2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SubmissionForm } from "./submission-form";
import { fetchSubmissions, type Submission } from "@/lib/api";
import { STAGE_LABELS, STAGE_COLORS, PRIORITY_COLORS, STAGE_ORDER } from "@/lib/constants";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface SubmissionListProps {
  stage: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
}

export function SubmissionList({ stage, selectedId, onSelect, onNew }: SubmissionListProps) {
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["submissions", stage],
    queryFn: () => fetchSubmissions(stage === "all" ? undefined : stage, 1, 50),
  });

  const submissions = data?.submissions || [];

  const filtered = search
    ? submissions.filter(
        (s) =>
          (s.patient?.firstName || "").toLowerCase().includes(search.toLowerCase()) ||
          (s.patient?.lastName || "").toLowerCase().includes(search.toLowerCase()) ||
          s.drugName.toLowerCase().includes(search.toLowerCase()) ||
          s.payerName.toLowerCase().includes(search.toLowerCase())
      )
    : submissions;

  return (
    <div className="flex h-full flex-col">
      {/* Search */}
      <div className="mb-3">
        <Input
          placeholder="Search submissions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9"
        />
      </div>

      {/* List */}
      <div className="flex-1 space-y-2 overflow-y-auto scrollbar-thin pr-1">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-shimmer h-24 rounded-lg" />
          ))
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-400">
            No submissions in this stage
          </div>
        ) : (
          filtered.map((sub) => {
            const isSelected = sub.id === selectedId;
            return (
              <div
                key={sub.id}
                onClick={() => onSelect(sub.id)}
                className={cn(
                  "cursor-pointer rounded-lg border p-3 transition-colors",
                  isSelected
                    ? "border-teal-300 bg-teal-50 shadow-sm"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold text-slate-800">
                        {sub.patient ? `${sub.patient.firstName} ${sub.patient.lastName}` : "Unknown"}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                      <span>{sub.drugName}</span>
                      <span className="text-slate-300">·</span>
                      <span>{sub.payerName}</span>
                    </div>
                  </div>
                  <span className={cn(
                    "ml-2 inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
                    STAGE_COLORS[sub.stage] || "bg-slate-100 text-slate-600"
                  )}>
                    {STAGE_LABELS[sub.stage] || sub.stage}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {sub.priority === "urgent" && (
                      <Badge className={cn("text-[10px]", PRIORITY_COLORS.urgent)}>Urgent</Badge>
                    )}
                    {sub._count && (
                      <span className="text-[10px] text-slate-400">
                        {sub._count.documents} docs · {sub._count.timeline} events
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {format(new Date(sub.createdAt), "MMM d")}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
