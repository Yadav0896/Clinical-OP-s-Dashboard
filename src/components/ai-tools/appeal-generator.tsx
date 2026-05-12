"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Scale, Loader2, ChevronDown, ChevronUp, Copy, Download, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DRUGS, PAYERS, DRUG_INDICATIONS } from "@/lib/constants";
import { generateAppeal, type AppealResult } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ResearchBadge } from "./research-badge";

export function AppealGenerator() {
  const [form, setForm] = useState({
    drugId: "",
    indicationId: "",
    payerId: "",
    denialReason: "",
    patientName: "",
    mrn: "",
    dob: "",
    prescriber: "",
    ige: "",
    eosinophils: "",
    feno: "",
    fev1: "",
    act: "",
    stepTherapyMonths: "",
    exacerbations: "",
  });
  const [result, setResult] = useState<AppealResult | null>(null);
  const [showAI, setShowAI] = useState(false);
  const [showLetter, setShowLetter] = useState(true);

  const indications = form.drugId ? DRUG_INDICATIONS[form.drugId] || [] : [];

  const mutation = useMutation({
    mutationFn: generateAppeal,
    onSuccess: (data) => { setResult(data); toast.success("Appeal letter generated"); },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.drugId || !form.indicationId || !form.payerId || !form.denialReason) return;

    const patientData: Record<string, unknown> = {};
    if (form.patientName) patientData.patientName = form.patientName;
    if (form.mrn) patientData.mrn = form.mrn;
    if (form.dob) patientData.dob = form.dob;
    if (form.prescriber) patientData.prescriber = form.prescriber;
    if (form.ige) patientData.ige = Number(form.ige);
    if (form.eosinophils) patientData.eosinophils = Number(form.eosinophils);
    if (form.feno) patientData.feno = Number(form.feno);
    if (form.fev1) patientData.fev1 = Number(form.fev1);
    if (form.act) patientData.act = Number(form.act);
    if (form.stepTherapyMonths) patientData.stepTherapyMonths = Number(form.stepTherapyMonths);
    if (form.exacerbations) patientData.exacerbations = Number(form.exacerbations);

    mutation.mutate({
      drugId: form.drugId,
      indicationId: form.indicationId,
      payerId: form.payerId,
      denialReason: form.denialReason,
      patientData,
    });
  };

  const copyLetter = () => {
    if (result?.letter) {
      navigator.clipboard.writeText(result.letter);
      toast.success("Letter copied to clipboard");
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card className="border-slate-200 shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Scale className="h-4 w-4 text-amber-600" />
            Appeal Letter Generator
          </CardTitle>
          <CardDescription className="text-xs">
            Generate a professional, evidence-based appeal letter for denied prior authorizations.
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
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600">Denial Reason *</label>
              <Textarea
                value={form.denialReason}
                onChange={(e) => setForm((p) => ({ ...p, denialReason: e.target.value }))}
                placeholder="e.g. Insufficient documentation of step therapy, IgE outside required range..."
                rows={2}
                className="text-xs"
              />
            </div>

            <div className="border-t border-slate-100 pt-3">
              <label className="text-xs font-medium text-slate-500">Patient Info (optional)</label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Input value={form.patientName} onChange={(e) => setForm((p) => ({ ...p, patientName: e.target.value }))} placeholder="Patient Name" className="h-8 text-xs" />
                <Input value={form.mrn} onChange={(e) => setForm((p) => ({ ...p, mrn: e.target.value }))} placeholder="MRN" className="h-8 text-xs" />
                <Input value={form.dob} onChange={(e) => setForm((p) => ({ ...p, dob: e.target.value }))} placeholder="DOB" className="h-8 text-xs" />
                <Input value={form.prescriber} onChange={(e) => setForm((p) => ({ ...p, prescriber: e.target.value }))} placeholder="Prescriber" className="h-8 text-xs" />
                <Input type="number" value={form.ige} onChange={(e) => setForm((p) => ({ ...p, ige: e.target.value }))} placeholder="IgE" className="h-8 text-xs" />
                <Input type="number" value={form.eosinophils} onChange={(e) => setForm((p) => ({ ...p, eosinophils: e.target.value }))} placeholder="Eosinophils" className="h-8 text-xs" />
                <Input type="number" value={form.fev1} onChange={(e) => setForm((p) => ({ ...p, fev1: e.target.value }))} placeholder="FEV1 %" className="h-8 text-xs" />
                <Input type="number" value={form.exacerbations} onChange={(e) => setForm((p) => ({ ...p, exacerbations: e.target.value }))} placeholder="Exacerbations/yr" className="h-8 text-xs" />
              </div>
            </div>

            <Button
              type="submit"
              disabled={mutation.isPending || !form.drugId || !form.indicationId || !form.payerId || !form.denialReason}
              className="w-full bg-amber-600 hover:bg-amber-700"
            >
              {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Scale className="mr-2 h-4 w-4" />}
              Generate Appeal Letter
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-none">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Appeal Letter</CardTitle>
            {result?.letter && (
              <Button variant="ghost" size="sm" onClick={copyLetter} className="text-xs text-teal-600 hover:text-teal-700">
                <Copy className="mr-1 h-3 w-3" /> Copy
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {!result ? (
            <div className="flex h-48 items-center justify-center text-sm text-slate-400">
              Generate to see the appeal letter
            </div>
          ) : (
            <div className="space-y-3">
              {/* Strategy summary */}
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <h5 className="mb-1 text-xs font-semibold text-amber-700">Appeal Strategy</h5>
                <p className="text-xs text-amber-600">{result.appeal?.strategy || "Custom appeal"}</p>
              </div>

              {/* Letter */}
              {showLetter && result.letter && (
                <div className="rounded-lg border border-slate-200 bg-white p-4">
                  <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-slate-700 max-h-80 overflow-y-auto scrollbar-thin">
                    {result.letter}
                  </pre>
                </div>
              )}

              {/* Citations */}
              {result.citations && result.citations.length > 0 && (
                <div className="rounded-lg border border-slate-200 p-3">
                  <h5 className="mb-2 text-xs font-semibold text-slate-600">Citations & References</h5>
                  <ul className="space-y-1">
                    {result.citations.map((c, i) => (
                      <li key={i} className="text-xs text-slate-500 pl-3 border-l-2 border-teal-200">{c}</li>
                    ))}
                  </ul>
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
                    <h5 className="mb-1 text-xs font-semibold text-blue-700">Knowledge Base Strategy</h5>
                    <p className="text-xs text-blue-600">{result.kbResult.strategy || "No KB strategy found"}</p>
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
