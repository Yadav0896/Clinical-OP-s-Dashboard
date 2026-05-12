"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ShieldCheck, Loader2, CheckCircle2, XCircle, ChevronDown, ChevronUp, Search } from "lucide-react";
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
import { DRUGS, PAYERS, DRUG_INDICATIONS } from "@/lib/constants";
import { validateICD10 } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ResearchBadge } from "./research-badge";

export function ICD10Validator() {
  const [form, setForm] = useState({ drugId: "", indicationId: "", payerId: "", code: "" });
  const [result, setResult] = useState<Awaited<ReturnType<typeof validateICD10>> | null>(null);
  const [showAI, setShowAI] = useState(false);

  const indications = form.drugId ? DRUG_INDICATIONS[form.drugId] || [] : [];

  const mutation = useMutation({
    mutationFn: validateICD10,
    onSuccess: (data) => { setResult(data); toast.success("Validation complete"); },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.drugId || !form.indicationId || !form.payerId || !form.code) return;
    mutation.mutate(form);
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Input Form */}
      <Card className="border-slate-200 shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <ShieldCheck className="h-4 w-4 text-teal-600" />
            ICD-10 Code Validator
          </CardTitle>
          <CardDescription className="text-xs">
            Validate ICD-10 codes against payer-specific requirements for biologic PA.
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
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600">ICD-10 Code</label>
              <Input
                value={form.code}
                onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
                placeholder="e.g. J45.50"
                className="h-9 font-mono"
              />
            </div>
            <Button
              type="submit"
              disabled={mutation.isPending || !form.drugId || !form.indicationId || !form.payerId || !form.code}
              className="w-full bg-teal-600 hover:bg-teal-700"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <Search className="mr-1 h-3.5 w-3.5 animate-pulse" />
                  Researching & Validating...
                </>
              ) : (
                <>
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Validate Code
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Results */}
      <Card className="border-slate-200 shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Result</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {!result ? (
            <div className="flex h-48 items-center justify-center text-sm text-slate-400">
              Run validation to see results
            </div>
          ) : (
            <div className="space-y-3">
              <div className={cn(
                "flex items-center gap-3 rounded-lg border px-4 py-3",
                result.valid ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"
              )}>
                {result.valid ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                <div>
                  <div className={cn("text-sm font-bold", result.valid ? "text-emerald-800" : "text-red-800")}>
                    {result.valid ? "VALID" : "INVALID"}
                  </div>
                  <div className={cn("text-xs", result.valid ? "text-emerald-600" : "text-red-600")}>
                    {result.message}
                  </div>
                </div>
              </div>

              {result.validCodes && result.validCodes.length > 0 && (
                <div className="rounded-lg border border-slate-200 p-3">
                  <h5 className="mb-2 text-xs font-semibold text-slate-600">Approved Codes for this Combination</h5>
                  <div className="flex flex-wrap gap-1.5">
                    {result.validCodes.map((c) => (
                      <span key={c.code} className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs text-slate-600">
                        {c.code} — {c.desc}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Transparency Toggle */}
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
                    <div className="mt-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-600 whitespace-pre-wrap max-h-64 overflow-y-auto scrollbar-thin">
                      {result.aiAnalysis}
                    </div>
                  )}
                </div>
              )}

              {/* Research Sources */}
              {result.research && result.research.sourcesUsed > 0 && (
                <ResearchBadge
                  sourcesUsed={result.research.sourcesUsed}
                  researchTimeMs={result.research.researchTimeMs}
                  sources={result.research.sources}
                />
              )}

              {/* KB Result */}
              {result.kbResult && (
                <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
                  <h5 className="mb-1 text-xs font-semibold text-blue-700">Knowledge Base Result</h5>
                  <p className="text-xs text-blue-600">
                    {result.kbResult.valid ? "Valid" : "Invalid"}: {result.kbResult.message}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
