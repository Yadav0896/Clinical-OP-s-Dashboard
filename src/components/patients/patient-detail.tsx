"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, Plus, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchPatient, addBiomarker, type Patient, type Biomarker, type Submission } from "@/lib/api";
import { BIOMARKER_TYPES, STAGE_LABELS, STAGE_COLORS } from "@/lib/constants";
import { BiomarkerCard } from "./biomarker-card";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PatientDetailProps {
  patientId: string;
  onClose: () => void;
}

export function PatientDetail({ patientId, onClose }: PatientDetailProps) {
  const queryClient = useQueryClient();
  const [showBiomarkerForm, setShowBiomarkerForm] = useState(false);
  const [biomarkerForm, setBiomarkerForm] = useState({
    type: "ige",
    value: "",
    unit: "IU/mL",
    dateCollected: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const { data: patient, isLoading } = useQuery({
    queryKey: ["patient", patientId],
    queryFn: () => fetchPatient(patientId),
    enabled: !!patientId,
  });

  const bioMutation = useMutation({
    mutationFn: ({ patientId, ...data }: { patientId: string; [key: string]: unknown }) =>
      addBiomarker(patientId, data as Record<string, unknown>),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient", patientId] });
      setShowBiomarkerForm(false);
      setBiomarkerForm({ type: "ige", value: "", unit: "IU/mL", dateCollected: new Date().toISOString().split("T")[0], notes: "" });
      toast.success("Biomarker added");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (isLoading) {
    return (
      <Card className="mb-6 border-teal-200 shadow-none">
        <CardContent className="p-6">
          <div className="animate-shimmer h-32 rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (!patient) return null;

  const biomarkers = patient.biomarkers || [];
  const submissions = patient.submissions || [];

  // Get latest biomarker of each type
  const latestBiomarkers: Record<string, Biomarker> = {};
  for (const b of biomarkers) {
    if (!latestBiomarkers[b.type] || new Date(b.dateCollected) > new Date(latestBiomarkers[b.type].dateCollected)) {
      latestBiomarkers[b.type] = b;
    }
  }

  const handleBiomarkerTypeChange = (type: string) => {
    const bt = BIOMARKER_TYPES.find((t) => t.id === type);
    setBiomarkerForm((prev) => ({ ...prev, type, unit: bt?.unit || "" }));
  };

  return (
    <Card className="mb-6 border-teal-200 bg-teal-50/30 shadow-none">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-600 text-sm font-bold text-white">
              {patient.firstName[0]}{patient.lastName[0]}
            </div>
            <div>
              <CardTitle className="text-base">
                {patient.firstName} {patient.lastName}
              </CardTitle>
              <div className="mt-0.5 flex items-center gap-3 text-xs text-slate-500">
                {patient.mrn && <span>MRN: {patient.mrn}</span>}
                <span>DOB: {format(new Date(patient.dateOfBirth), "MMM d, yyyy")}</span>
                {patient.payerName && <span>{patient.payerName}</span>}
                {patient.gender && <span>{patient.gender}</span>}
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Biomarkers */}
        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Latest Biomarkers</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBiomarkerForm(!showBiomarkerForm)}
              className="text-teal-600 hover:text-teal-700"
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              Add
            </Button>
          </div>

          {showBiomarkerForm && (
            <div className="mb-3 flex flex-wrap items-end gap-3 rounded-lg border border-teal-200 bg-white p-3">
              <div className="space-y-1">
                <Label className="text-xs">Type</Label>
                <Select value={biomarkerForm.type} onValueChange={handleBiomarkerTypeChange}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BIOMARKER_TYPES.map((bt) => (
                      <SelectItem key={bt.id} value={bt.id}>
                        {bt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Value</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={biomarkerForm.value}
                  onChange={(e) => setBiomarkerForm((prev) => ({ ...prev, value: e.target.value }))}
                  className="w-24"
                  placeholder="0"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Date</Label>
                <Input
                  type="date"
                  value={biomarkerForm.dateCollected}
                  onChange={(e) => setBiomarkerForm((prev) => ({ ...prev, dateCollected: e.target.value }))}
                  className="w-36"
                />
              </div>
              <Button
                size="sm"
                onClick={() => bioMutation.mutate({ patientId, ...biomarkerForm })}
                disabled={bioMutation.isPending || !biomarkerForm.value}
                className="bg-teal-600 hover:bg-teal-700"
              >
                {bioMutation.isPending && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                Save
              </Button>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {BIOMARKER_TYPES.map((bt) => {
              const bm = latestBiomarkers[bt.id];
              return (
                <BiomarkerCard key={bt.id} type={bt.label} value={bm ? bm.value : null} unit={bm?.unit || bt.unit} dateCollected={bm?.dateCollected} />
              );
            })}
          </div>
        </div>

        {/* Recent Submissions */}
        {submissions.length > 0 && (
          <div>
            <h4 className="mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Recent Submissions</h4>
            <div className="space-y-2">
              {submissions.slice(0, 5).map((sub) => (
                <div key={sub.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-slate-700">{sub.drugName}</span>
                    <span className="text-xs text-slate-400">→ {sub.payerName}</span>
                  </div>
                  <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${STAGE_COLORS[sub.stage] || "bg-slate-100 text-slate-600"}`}>
                    {STAGE_LABELS[sub.stage] || sub.stage}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
