"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Loader2, ChevronDown, MessageSquare, Send, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StageProgress } from "./stage-progress";
import { DocumentChecklist } from "./document-checklist";
import { AIPanel } from "./ai-panel";
import { Timeline } from "./timeline";
import {
  fetchSubmission,
  updateSubmission,
  updateSubmissionStage,
  fetchSubmissionDocuments,
  type Submission,
  type SubmissionDocument,
} from "@/lib/api";
import { STAGE_LABELS, STAGE_COLORS, STAGE_ORDER, PRIORITY_COLORS } from "@/lib/constants";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SubmissionDetailProps {
  submissionId: string;
  onClose: () => void;
  onStageChange?: () => void;
}

export function SubmissionDetail({ submissionId, onClose, onStageChange }: SubmissionDetailProps) {
  const queryClient = useQueryClient();
  const [docRequiredTypes, setDocRequiredTypes] = useState<string[]>([]);
  const [showStageSelect, setShowStageSelect] = useState(false);
  const [noteText, setNoteText] = useState("");

  const { data: submission, isLoading } = useQuery({
    queryKey: ["submission", submissionId],
    queryFn: () => fetchSubmission(submissionId),
    enabled: !!submissionId,
  });

  const stageMutation = useMutation({
    mutationFn: (stage: string) => updateSubmissionStage(submissionId, stage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["submission", submissionId] });
      queryClient.invalidateQueries({ queryKey: ["submissions"] });
      setShowStageSelect(false);
      toast.success("Stage updated");
      onStageChange?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const noteMutation = useMutation({
    mutationFn: (notes: string) => updateSubmission(submissionId, { notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["submission", submissionId] });
      setNoteText("");
      toast.success("Note saved");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
      </div>
    );
  }

  if (!submission) return null;

  const patient = submission.patient;
  const timeline = submission.timeline || [];
  const documents = submission.documents || [];

  return (
    <div className="flex h-full flex-col overflow-hidden animate-fade-in">
      {/* Close button */}
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
          <h3 className="text-sm font-semibold text-slate-800">
            {patient ? `${patient.firstName} ${patient.lastName}` : "Unknown Patient"}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn(
            "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
            STAGE_COLORS[submission.stage] || "bg-slate-100 text-slate-600"
          )}>
            {STAGE_LABELS[submission.stage] || submission.stage}
          </span>
          {submission.priority === "urgent" && (
            <Badge className={cn("text-[10px]", PRIORITY_COLORS.urgent)}>Urgent</Badge>
          )}
        </div>
      </div>

      {/* Patient Info Bar */}
      <div className="mb-3 flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
        {patient?.mrn && <span><strong className="text-slate-600">MRN:</strong> {patient.mrn}</span>}
        <span><strong className="text-slate-600">DOB:</strong> {format(new Date(submission.patient?.dateOfBirth || ""), "MMM d, yyyy")}</span>
        <span><strong className="text-slate-600">Payer:</strong> {submission.payerName}</span>
        <span><strong className="text-slate-600">Drug:</strong> {submission.drugName}</span>
        {submission.icd10Code && <span><strong className="text-slate-600">ICD-10:</strong> {submission.icd10Code}</span>}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 space-y-3 overflow-y-auto scrollbar-thin pr-1">
        {/* Stage Progress */}
        <StageProgress currentStage={submission.stage} />

        {/* AI Panel */}
        <AIPanel
          submissionId={submission.id}
          drugId={submission.drugId}
          indicationId={submission.indicationId}
          payerId={submission.payerId}
          drugName={submission.drugName}
          payerName={submission.payerName}
          indication={submission.indication}
          icd10Code={submission.icd10Code}
        />

        {/* Document Checklist */}
        <DocumentChecklist documents={documents} requiredDocTypes={docRequiredTypes} />

        {/* Timeline */}
        <Timeline events={timeline} />

        {/* Notes */}
        {submission.notes && (
          <Card className="border-slate-200 shadow-none">
            <CardContent className="p-3">
              <h4 className="mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Notes</h4>
              <p className="text-xs text-slate-600 whitespace-pre-wrap">{submission.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="mt-3 flex items-center gap-2 border-t border-slate-200 pt-3">
        {/* Stage Change */}
        <div className="relative">
          {showStageSelect ? (
            <Select onValueChange={(stage) => stageMutation.mutate(stage)}>
              <SelectTrigger className="w-40 h-9 text-xs">
                <SelectValue placeholder="Change stage..." />
              </SelectTrigger>
              <SelectContent>
                {STAGE_ORDER.map((stage) => (
                  <SelectItem key={stage} value={stage}>
                    {STAGE_LABELS[stage]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setShowStageSelect(true)}>
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              Change Stage
            </Button>
          )}
        </div>

        {/* Add Note */}
        <div className="flex flex-1 items-center gap-2">
          <Textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Add a note..."
            className="min-h-0 flex-1 resize-none text-xs"
            rows={1}
          />
          <Button
            size="icon"
            variant="ghost"
            onClick={() => noteMutation.mutate(submission.notes ? `${submission.notes}\n\n${noteText}` : noteText)}
            disabled={noteMutation.isPending || !noteText.trim()}
            className="h-9 w-9 text-slate-400 hover:text-teal-600"
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Submit */}
        {submission.stage === "expert_review" && (
          <Button
            size="sm"
            className="bg-teal-600 hover:bg-teal-700"
            onClick={() => stageMutation.mutate("submitted")}
            disabled={stageMutation.isPending}
          >
            {stageMutation.isPending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Send className="mr-1.5 h-3.5 w-3.5" />}
            Submit PA
          </Button>
        )}
      </div>
    </div>
  );
}
