"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DRUGS, PAYERS, DRUG_INDICATIONS } from "@/lib/constants";
import { Loader2 } from "lucide-react";

interface SubmissionFormProps {
  patients: { id: string; firstName: string; lastName: string; mrn?: string }[];
  onSubmit: (data: Record<string, unknown>) => void;
  isLoading: boolean;
  onClose: () => void;
}

export function SubmissionForm({ patients, onSubmit, isLoading, onClose }: SubmissionFormProps) {
  const [form, setForm] = useState({
    patientId: "",
    drugId: "",
    indicationId: "",
    payerId: "",
    icd10Code: "",
    priority: "normal",
    notes: "",
  });

  const selectedDrug = DRUGS.find((d) => d.id === form.drugId);
  const indications = form.drugId ? DRUG_INDICATIONS[form.drugId] || [] : [];

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === "drugId") {
      setForm((prev) => ({ ...prev, indicationId: "" }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patientId || !form.drugId || !form.indicationId || !form.payerId) return;

    const indication = indications.find((i) => i.id === form.indicationId);
    const payer = PAYERS.find((p) => p.id === form.payerId);

    onSubmit({
      ...form,
      drugName: selectedDrug?.name || form.drugId,
      indication: indication?.name || form.indicationId,
      payerName: payer?.name || form.payerId,
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Submission</DialogTitle>
          <DialogDescription>Create a new prior authorization submission.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-2">
          <div className="space-y-2">
            <Label>Patient *</Label>
            <Select value={form.patientId} onValueChange={(v) => handleChange("patientId", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select patient..." />
              </SelectTrigger>
              <SelectContent>
                {patients.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.firstName} {p.lastName} {p.mrn ? `(${p.mrn})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Drug *</Label>
              <Select value={form.drugId} onValueChange={(v) => handleChange("drugId", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select drug..." />
                </SelectTrigger>
                <SelectContent>
                  {DRUGS.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name} ({d.generic})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Indication *</Label>
              <Select value={form.indicationId} onValueChange={(v) => handleChange("indicationId", v)} disabled={!form.drugId}>
                <SelectTrigger>
                  <SelectValue placeholder={form.drugId ? "Select..." : "Choose drug first"} />
                </SelectTrigger>
                <SelectContent>
                  {indications.map((ind) => (
                    <SelectItem key={ind.id} value={ind.id}>
                      {ind.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Payer *</Label>
              <Select value={form.payerId} onValueChange={(v) => handleChange("payerId", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payer..." />
                </SelectTrigger>
                <SelectContent>
                  {PAYERS.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>ICD-10 Code</Label>
              <Input
                value={form.icd10Code}
                onChange={(e) => handleChange("icd10Code", e.target.value)}
                placeholder="e.g. J45.50"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Priority</Label>
            <Select value={form.priority} onValueChange={(v) => handleChange("priority", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Additional notes..."
              rows={2}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !form.patientId || !form.drugId || !form.indicationId || !form.payerId}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Submission
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
