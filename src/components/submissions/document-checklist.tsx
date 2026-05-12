"use client";

import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, AlertCircle, FileText } from "lucide-react";
import type { SubmissionDocument } from "@/lib/api";

interface DocumentChecklistProps {
  documents: SubmissionDocument[];
  requiredDocTypes: string[];
}

const DOC_LABELS: Record<string, string> = {
  lab_result: "Lab Results",
  progress_note: "Progress Notes",
  prior_auth_form: "PA Form",
  appeal_letter: "Appeal Letter",
  insurance_card: "Insurance Card",
  photo_id: "Photo ID",
  benefit_verification: "Benefit Verification",
  step_therapy: "Step Therapy Docs",
  specialty_letter: "Specialist Letter",
  prescription: "Prescription",
  consent_form: "Consent Form",
  clinical_letter: "Clinical Letter",
  other: "Other",
};

export function DocumentChecklist({ documents, requiredDocTypes }: DocumentChecklistProps) {
  const groupedDocs = documents.reduce<Record<string, SubmissionDocument[]>>((acc, doc) => {
    const key = doc.type || "other";
    if (!acc[key]) acc[key] = [];
    acc[key].push(doc);
    return acc;
  }, {});

  const uploadedTypes = new Set(Object.keys(groupedDocs));
  const allRequiredPresent = requiredDocTypes.every((t) => uploadedTypes.has(t));
  const uploadedCount = Object.keys(groupedDocs).length;
  const requiredCount = requiredDocTypes.length;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Document Checklist</h4>
        <span className={cn(
          "text-xs font-medium",
          allRequiredPresent ? "text-emerald-600" : "text-amber-600"
        )}>
          {uploadedCount} / {requiredCount} required
        </span>
      </div>
      <div className="space-y-1.5">
        {requiredDocTypes.map((docType) => {
          const docs = groupedDocs[docType];
          const isPresent = !!docs && docs.length > 0;
          const label = DOC_LABELS[docType] || docType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

          return (
            <div key={docType} className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm">
              {isPresent ? (
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-500" />
              ) : (
                <AlertCircle className="h-4 w-4 flex-shrink-0 text-amber-400" />
              )}
              <span className={cn("text-xs", isPresent ? "text-slate-600" : "text-slate-400")}>
                {label}
              </span>
              {isPresent && docs && (
                <span className="ml-auto text-[10px] text-emerald-500">{docs.length} uploaded</span>
              )}
              {!isPresent && (
                <span className="ml-auto text-[10px] text-amber-400">Missing</span>
              )}
            </div>
          );
        })}

        {/* Show additional uploaded docs not in required list */}
        {Object.keys(groupedDocs)
          .filter((t) => !requiredDocTypes.includes(t))
          .map((docType) => (
            <div key={docType} className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm">
              <FileText className="h-4 w-4 flex-shrink-0 text-slate-400" />
              <span className="text-xs text-slate-500">
                {DOC_LABELS[docType] || docType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              </span>
              <span className="ml-auto text-[10px] text-slate-400">Supplemental</span>
            </div>
          ))}

        {requiredDocTypes.length === 0 && (
          <p className="py-2 text-center text-xs text-slate-400">Run document check to populate checklist</p>
        )}
      </div>
    </div>
  );
}
