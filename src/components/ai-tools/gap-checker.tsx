"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { AlertTriangle, Loader2, CheckCircle2, XCircle, ChevronDown, ChevronUp, ShieldCheck, ShieldX, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { DRUGS, PAYERS, DRUG_INDICATIONS } from "@/lib/constants";
import { checkGaps, type GapCheckResult } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ResearchBadge } from "./research-badge";

export function GapChecker() {
  const [form, setForm] = useState({
    drugId: "",
    indicationId: "",
    payerId: "",
    icd10Code: "",
    ige: "",
    eosinophils: "",
    feno: "",
    fev1: "",
    act: "",
    stepTherapyMonths: "",
    weight: "",
  });
  const [result, setResult] = useState<GapCheckResult | null>(null);
  const [showAI, setShowAI] = useState(false);

  const indications = form.drugId ? DRUG_INDICATIONS[form.drugId] || [] : [];

  const mutation = useMutation({
    mutationFn: checkGaps,
    onSuccess: (data) => { setResult(data); toast.success("Gap analysis complete"); },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.drugId || !form.indicationId || !form.payerId) return;

    const patientData: Record<string, unknown> = {};
    if (form.icd10Code) patientData.icd10Code = form.icd10Code;
    if (form.ige) patientData.ige = Number(form.ige);
    if (form.eosinophils) patientData.eosinophils = Number(form.eosinophils);
    if (form.feno) patientData.feno = Number(form.feno);
    if (form.fev1) patientData.fev1 = Number(form.fev1);
    if (form.act) patientData.act = Number(form.act);
    if (form.stepTherapyMonths) patientData.stepTherapyMonths = Number(form.stepTherapyMonths);
    if (form.weight) patientData.weight = Number(form.weight);

    mutation.mutate({ drugId: form.drugId, indicationId: form.indicationId, payerId: form.payerId, patientData });
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card className="border-slate-200 shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <AlertTriangle className="h-4 w-4 text-purple-600" />
            Gap Checker
          </CardTitle>
          <CardDescription className="text-xs">
            Run a comprehensive gap analysis against payer requirements and clinical guidelines.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-600">Drug</label>
                <Select value={form.drugId} onValueChange={(v) => setForm((p) => ({ ...p, drugId: v, indicationId: "" }))}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {DRUGS.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-600">Payer</label>
                <Select value={form.payerId} onValueChange={(v) => setForm((p) => ({ ...p, payerId: v }))}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYERS.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600">Indication</label>
              <Select value={form.indicationId} onValueChange={(v) => setForm((p) => ({ ...p, indicationId: v }))} disabled={!form.drugId}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder={form.drugId ? "Select..." : "Choose drug first"} />
                </SelectTrigger>
                <SelectContent>
                  {indications.map((ind) => (
                    <SelectItem key={ind.id} value={ind.id}>{ind.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="border-t border-slate-100 pt-3">
              <Label className="text-xs font-medium text-slate-500">Patient Data (optional)</Label>
              <div className="mt-2 grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400">ICD-10</label>
                  <Input value={form.icd10Code} onChange={(e) => setForm((p) => ({ ...p, icd10Code: e.target.value }))} placeholder="J45.50" className="h-8 text-xs font-mono" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400">IgE (IU/mL)</label>
                  <Input type="number" value={form.ige} onChange={(e) => setForm((p) => ({ ...p, ige: e.target.value }))} placeholder="0" className="h-8 text-xs" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400">Eosinophils</label>
                  <Input type="number" value={form.eosinophils} onChange={(e) => setForm((p) => ({ ...p, eosinophils: e.target.value }))} placeholder="0" className="h-8 text-xs" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400">FeNO (ppb)</label>
                  <Input type="number" value={form.feno} onChange={(e) => setForm((p) => ({ ...p, feno: e.target.value }))} placeholder="0" className="h-8 text-xs" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400">FEV1 (%)</label>
                  <Input type="number" value={form.fev1} onChange={(e) => setForm((p) => ({ ...p, fev1: e.target.value }))} placeholder="0" className="h-8 text-xs" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400">ACT Score</label>
                  <Input type="number" value={form.act} onChange={(e) => setForm((p) => ({ ...p, act: e.target.value }))} placeholder="0" className="h-8 text-xs" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400">Step Therapy (mo)</label>
                  <Input type="number" value={form.stepTherapyMonths} onChange={(e) => setForm((p) => ({ ...p, stepTherapyMonths: e.target.value }))} placeholder="0" className="h-8 text-xs" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400">Weight (kg)</label>
                  <Input type="number" value={form.weight} onChange={(e) => setForm((p) => ({ ...p, weight: e.target.value }))} placeholder="0" className="h-8 text-xs" />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={mutation.isPending || !form.drugId || !form.indicationId || !form.payerId}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <AlertTriangle className="mr-2 h-4 w-4" />}
              Run Gap Analysis
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Gap Analysis Result</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {!result ? (
            <div className="flex h-48 items-center justify-center text-sm text-slate-400">
              Run analysis to see results
            </div>
          ) : (
            <div className="space-y-3">
              {/* Verdict Banner */}
              <div className={cn(
                "flex items-center gap-3 rounded-lg border px-4 py-3",
                result.verdict === "READY" ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"
              )}>
                {result.verdict === "READY" ? (
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />
                ) : (
                  <ShieldX className="h-5 w-5 text-red-600" />
                )}
                <div>
                  <div className={cn("text-sm font-bold", result.verdict === "READY" ? "text-emerald-800" : "text-red-800")}>
                    {result.verdict === "READY" ? "READY TO SUBMIT" : "DO NOT SUBMIT"}
                  </div>
                  <div className="text-xs text-slate-600">{result.message}</div>
                </div>
              </div>

              {/* Stats */}
              <div className="flex gap-3 text-xs">
                <span className="rounded-md bg-red-100 px-2 py-1 font-medium text-red-700">{result.criticalCount} Critical</span>
                <span className="rounded-md bg-amber-100 px-2 py-1 font-medium text-amber-700">{result.warningCount} Warnings</span>
                <span className="rounded-md bg-emerald-100 px-2 py-1 font-medium text-emerald-700">{result.passCount} Passed</span>
              </div>

              {/* Gaps */}
              <div className="max-h-60 space-y-1.5 overflow-y-auto scrollbar-thin">
                {result.gaps.map((gap, i) => (
                  <div key={i} className={cn(
                    "flex items-start gap-2.5 rounded-lg border px-3 py-2",
                    gap.severity === "critical" ? "border-red-200 bg-red-50/50" : gap.severity === "warning" ? "border-amber-200 bg-amber-50/50" : "border-emerald-200 bg-emerald-50/50"
                  )}>
                    {gap.severity === "critical" ? (
                      <XCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-red-500" />
                    ) : gap.severity === "warning" ? (
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-500" />
                    ) : (
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />
                    )}
                    <div>
                      <div className={cn("text-xs font-medium", gap.severity === "critical" ? "text-red-700" : gap.severity === "warning" ? "text-amber-700" : "text-emerald-700")}>
                        {gap.title}
                      </div>
                      <div className="text-[11px] text-slate-500">{gap.detail}</div>
                      {gap.action && <div className="mt-0.5 text-[11px] text-teal-600">→ {gap.action}</div>}
                    </div>
                  </div>
                ))}
              </div>

              {/* Research Sources */}
              {result.research && result.research.sourcesUsed > 0 && (
                <ResearchBadge
                  sourcesUsed={result.research.sourcesUsed}
                  researchTimeMs={result.research.researchTimeMs}
                  sources={result.research.sources}
                />
              )}

              {/* AI / KB Toggle */}
              <div className="space-y-2">
                {result.aiAnalysis && (
                  <div>
                    <button onClick={() => setShowAI(!showAI)} className="flex items-center gap-1 text-xs text-teal-600 hover:underline">
                      {showAI ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      {showAI ? "Hide" : "Show"} AI Analysis
                    </button>
                    {showAI && (
                      <div className="mt-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-600 whitespace-pre-wrap max-h-48 overflow-y-auto scrollbar-thin">
                        {result.aiAnalysis}
                      </div>
                    )}
                  </div>
                )}
                {result.kbResult && (
                  <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
                    <h5 className="mb-1 text-xs font-semibold text-blue-700">Knowledge Base</h5>
                    <p className="text-xs text-blue-600">
                      Verdict: {result.kbResult.verdict} · {result.kbResult.criticalCount} critical · {result.kbResult.warningCount} warnings
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
