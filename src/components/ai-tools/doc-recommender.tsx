"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { FileCheck, Loader2, ChevronDown, ChevronUp, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DRUGS, PAYERS, DRUG_INDICATIONS } from "@/lib/constants";
import { recommendDocs, type DocRecommendResult } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ResearchBadge } from "./research-badge";

export function DocRecommender() {
  const [form, setForm] = useState({ drugId: "", indicationId: "", payerId: "" });
  const [result, setResult] = useState<DocRecommendResult | null>(null);
  const [showAI, setShowAI] = useState(false);

  const indications = form.drugId ? DRUG_INDICATIONS[form.drugId] || [] : [];

  const mutation = useMutation({
    mutationFn: recommendDocs,
    onSuccess: (data) => { setResult(data); toast.success("Recommendations loaded"); },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.drugId || !form.indicationId || !form.payerId) return;
    mutation.mutate(form);
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card className="border-slate-200 shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <FileCheck className="h-4 w-4 text-blue-600" />
            Document Recommender
          </CardTitle>
          <CardDescription className="text-xs">
            Get a tailored document checklist for your PA submission based on drug, indication, and payer.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600">Drug</label>
              <Select value={form.drugId} onValueChange={(v) => setForm((p) => ({ ...p, drugId: v, indicationId: "" }))}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select drug..." />
                </SelectTrigger>
                <SelectContent>
                  {DRUGS.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name} ({d.generic})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600">Payer</label>
              <Select value={form.payerId} onValueChange={(v) => setForm((p) => ({ ...p, payerId: v }))}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select payer..." />
                </SelectTrigger>
                <SelectContent>
                  {PAYERS.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="submit"
              disabled={mutation.isPending || !form.drugId || !form.indicationId || !form.payerId}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileCheck className="mr-2 h-4 w-4" />}
              Get Recommendations
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Document Checklist</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {!result ? (
            <div className="flex h-48 items-center justify-center text-sm text-slate-400">
              Get recommendations to see the checklist
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex gap-3 text-xs">
                <span className="rounded-md bg-amber-100 px-2 py-1 font-medium text-amber-700">
                  {result.requiredCount} Required
                </span>
                <span className="rounded-md bg-slate-100 px-2 py-1 font-medium text-slate-600">
                  {result.totalDocs - result.requiredCount} Optional
                </span>
              </div>
              <div className="max-h-80 space-y-1.5 overflow-y-auto scrollbar-thin">
                {result.documents.map((doc, i) => (
                  <div key={i} className={cn(
                    "flex items-start gap-2.5 rounded-lg border px-3 py-2",
                    doc.required ? "border-amber-200 bg-amber-50/50" : "border-slate-200 bg-white"
                  )}>
                    <span className={cn(
                      "mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full",
                      doc.required ? "bg-amber-500" : "bg-slate-300"
                    )} />
                    <div className="flex-1">
                      <div className={cn("text-xs font-medium", doc.required ? "text-slate-800" : "text-slate-600")}>
                        {doc.name}
                        {doc.required && <span className="ml-1 text-amber-600">*</span>}
                      </div>
                      {doc.rationale && (
                        <div className="mt-0.5 text-[11px] text-slate-500">{doc.rationale}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {result.research && result.research.sourcesUsed > 0 && (
                <ResearchBadge
                  sourcesUsed={result.research.sourcesUsed}
                  researchTimeMs={result.research.researchTimeMs}
                  sources={result.research.sources}
                />
              )}
              {result.aiAnalysis && (
                <div>
                  <button
                    onClick={() => setShowAI(!showAI)}
                    className="flex items-center gap-1 text-xs text-teal-600 hover:underline"
                  >
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
