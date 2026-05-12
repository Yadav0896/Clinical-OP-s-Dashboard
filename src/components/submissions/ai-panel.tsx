"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Brain, Loader2, ChevronDown, ChevronUp, CheckCircle2, XCircle, AlertTriangle, Info, ShieldCheck, ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { validateICD10, recommendDocs, checkGaps, type ICD10Result, type DocRecommendResult, type GapCheckResult } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AIPanelProps {
  submissionId: string;
  drugId: string;
  indicationId: string;
  payerId: string;
  drugName: string;
  payerName: string;
  indication: string;
  icd10Code?: string;
}

type AIResultType = "icd10" | "docs" | "gaps";

export function AIPanel({ submissionId, drugId, indicationId, payerId, drugName, payerName, indication, icd10Code }: AIPanelProps) {
  const [showTransparency, setShowTransparency] = useState<AIResultType | null>(null);
  const [icdResult, setIcdResult] = useState<ICD10Result | null>(null);
  const [docResult, setDocResult] = useState<DocRecommendResult | null>(null);
  const [gapResult, setGapResult] = useState<GapCheckResult | null>(null);
  const [docRequiredTypes, setDocRequiredTypes] = useState<string[]>([]);

  const icdMutation = useMutation({
    mutationFn: () => validateICD10({ drugId, indicationId, payerId, code: icd10Code || "J45.50" }),
    onSuccess: (data) => { setIcdResult(data); toast.success("ICD-10 check complete"); },
    onError: (err: Error) => toast.error(err.message),
  });

  const docMutation = useMutation({
    mutationFn: () => recommendDocs({ drugId, indicationId, payerId, submissionId }),
    onSuccess: (data) => {
      setDocResult(data);
      setDocRequiredTypes(data.required.map((d) => d.name.toLowerCase().replace(/\s+/g, "_")));
      toast.success("Document check complete");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const gapMutation = useMutation({
    mutationFn: () => checkGaps({ drugId, indicationId, payerId }),
    onSuccess: (data) => { setGapResult(data); toast.success("Gap analysis complete"); },
    onError: (err: Error) => toast.error(err.message),
  });

  const anyRunning = icdMutation.isPending || docMutation.isPending || gapMutation.isPending;
  const allComplete = icdResult && docResult && gapResult;
  const hasCriticals = gapResult ? gapResult.criticalCount > 0 : true;

  return (
    <div className="space-y-3">
      {/* Context bar */}
      <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
        <Brain className="h-3.5 w-3.5 text-teal-600" />
        <span>
          <strong className="text-slate-700">{drugName}</strong> → {payerName} → {indication}
        </span>
      </div>

      {/* AI Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => icdMutation.mutate()}
          disabled={anyRunning}
          className="border-teal-200 text-teal-700 hover:bg-teal-50 hover:text-teal-800"
        >
          {icdMutation.isPending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />}
          ICD-10 Check
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => docMutation.mutate()}
          disabled={anyRunning}
          className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
        >
          {docMutation.isPending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />}
          Check Documents
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => gapMutation.mutate()}
          disabled={anyRunning}
          className="border-purple-200 text-purple-700 hover:bg-purple-50 hover:text-purple-800"
        >
          {gapMutation.isPending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <AlertTriangle className="mr-1.5 h-3.5 w-3.5" />}
          Gap Analysis
        </Button>
      </div>

      {/* AI Verdict Banner */}
      {allComplete && (
        <div className={cn(
          "flex items-center gap-3 rounded-lg border px-4 py-3",
          hasCriticals
            ? "border-red-200 bg-red-50"
            : "border-emerald-200 bg-emerald-50"
        )}>
          {hasCriticals ? (
            <>
              <ShieldX className="h-5 w-5 text-red-600" />
              <div>
                <div className="text-sm font-bold text-red-800">DO NOT SUBMIT</div>
                <div className="text-xs text-red-600">{gapResult?.message}</div>
              </div>
            </>
          ) : (
            <>
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              <div>
                <div className="text-sm font-bold text-emerald-800">READY TO SUBMIT</div>
                <div className="text-xs text-emerald-600">All critical criteria met. Ready for submission.</div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ICD-10 Results */}
      {icdResult && (
        <Card className="border-slate-200 shadow-none">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-semibold text-slate-600">ICD-10 Validation</h5>
              <button
                onClick={() => setShowTransparency(showTransparency === "icd10" ? null : "icd10")}
                className="text-[10px] text-teal-600 hover:underline"
              >
                {showTransparency === "icd10" ? "Hide" : "Show"} AI Analysis
              </button>
            </div>
            <div className={cn(
              "mt-1 flex items-center gap-2 rounded-md px-2 py-1.5",
              icdResult.valid ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
            )}>
              {icdResult.valid ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
              <span className="text-xs font-medium">{icdResult.message}</span>
            </div>
            {showTransparency === "icd10" && icdResult.aiAnalysis && (
              <div className="mt-2 rounded-md bg-slate-50 p-2 text-xs text-slate-600 whitespace-pre-wrap">
                {icdResult.aiAnalysis}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Document Check Results */}
      {docResult && (
        <Card className="border-slate-200 shadow-none">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-semibold text-slate-600">Document Recommendations</h5>
              <button
                onClick={() => setShowTransparency(showTransparency === "docs" ? null : "docs")}
                className="text-[10px] text-teal-600 hover:underline"
              >
                {showTransparency === "docs" ? "Hide" : "Show"} AI Analysis
              </button>
            </div>
            <div className="mt-1 space-y-1">
              <div className="text-xs text-slate-500">{docResult.requiredCount} required, {docResult.totalDocs - docResult.requiredCount} optional</div>
              <div className="max-h-32 overflow-y-auto space-y-0.5 scrollbar-thin">
                {docResult.documents.slice(0, 10).map((doc, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    {doc.required ? (
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                    )}
                    <span className={doc.required ? "text-slate-700 font-medium" : "text-slate-400"}>
                      {doc.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            {showTransparency === "docs" && docResult.aiAnalysis && (
              <div className="mt-2 rounded-md bg-slate-50 p-2 text-xs text-slate-600 whitespace-pre-wrap">
                {docResult.aiAnalysis}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Gap Analysis Results */}
      {gapResult && (
        <Card className="border-slate-200 shadow-none">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-semibold text-slate-600">
                Gap Analysis ({gapResult.criticalCount} critical, {gapResult.warningCount} warnings)
              </h5>
              <button
                onClick={() => setShowTransparency(showTransparency === "gaps" ? null : "gaps")}
                className="text-[10px] text-teal-600 hover:underline"
              >
                {showTransparency === "gaps" ? "Hide" : "Show"} AI Analysis
              </button>
            </div>
            <div className="mt-1 max-h-40 space-y-1 overflow-y-auto scrollbar-thin">
              {gapResult.gaps.map((gap, i) => (
                <div key={i} className={cn(
                  "flex items-start gap-2 rounded-md px-2 py-1.5 text-xs",
                  gap.severity === "critical" ? "bg-red-50" : gap.severity === "warning" ? "bg-amber-50" : "bg-emerald-50"
                )}>
                  {gap.severity === "critical" ? (
                    <XCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-red-500" />
                  ) : gap.severity === "warning" ? (
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-500" />
                  ) : (
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />
                  )}
                  <div>
                    <div className={cn(
                      "font-medium",
                      gap.severity === "critical" ? "text-red-700" : gap.severity === "warning" ? "text-amber-700" : "text-emerald-700"
                    )}>
                      {gap.title}
                    </div>
                    <div className="text-slate-500">{gap.detail}</div>
                    {gap.action && (
                      <div className="mt-0.5 text-teal-600">→ {gap.action}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {showTransparency === "gaps" && gapResult.aiAnalysis && (
              <div className="mt-2 rounded-md bg-slate-50 p-2 text-xs text-slate-600 whitespace-pre-wrap">
                {gapResult.aiAnalysis}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Expose docRequiredTypes for DocumentChecklist */}
      <input type="hidden" data-doc-required-types={JSON.stringify(docRequiredTypes)} />
    </div>
  );
}
