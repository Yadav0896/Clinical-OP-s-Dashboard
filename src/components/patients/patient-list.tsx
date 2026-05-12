"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, ChevronRight, Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PatientForm } from "./patient-form";
import { PatientDetail } from "./patient-detail";
import { fetchPatients, createPatient, type Patient } from "@/lib/api";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function PatientList() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["patients", search, page],
    queryFn: () => fetchPatients(search, page, 20),
  });

  const addMutation = useMutation({
    mutationFn: createPatient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      setShowAddForm(false);
      toast.success("Patient created successfully");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const patients = data?.patients || [];
  const pagination = data?.pagination;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search by name, MRN..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
        <Button onClick={() => setShowAddForm(true)} className="bg-teal-600 hover:bg-teal-700">
          <UserPlus className="mr-2 h-4 w-4" />
          Add Patient
        </Button>
      </div>

      {/* Patient Form Dialog */}
      {showAddForm && (
        <PatientForm
          onSubmit={(data) => addMutation.mutate(data)}
          isLoading={addMutation.isPending}
          onClose={() => setShowAddForm(false)}
        />
      )}

      {/* Expanded Patient Detail */}
      {selectedPatientId && (
        <PatientDetail
          patientId={selectedPatientId}
          onClose={() => setSelectedPatientId(null)}
        />
      )}

      {/* Table */}
      <Card className="border-slate-200 shadow-none">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="animate-shimmer mb-3 h-12 rounded-lg" />
              ))}
            </div>
          ) : patients.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-400">
              {search ? "No patients match your search" : "No patients yet. Click Add Patient to get started."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">MRN</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">DOB</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Payer</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Submissions</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Created</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map((patient) => (
                    <tr
                      key={patient.id}
                      onClick={() => setSelectedPatientId(patient.id)}
                      className="cursor-pointer border-b border-slate-50 transition-colors hover:bg-slate-50 last:border-0"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-100 text-xs font-semibold text-teal-700">
                            {patient.firstName[0]}{patient.lastName[0]}
                          </div>
                          <div>
                            <div className="font-medium text-slate-800">{patient.firstName} {patient.lastName}</div>
                            <div className="text-xs text-slate-400">{patient.gender || "—"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">{patient.mrn || "—"}</td>
                      <td className="px-4 py-3 text-slate-600">{format(new Date(patient.dateOfBirth), "MMM d, yyyy")}</td>
                      <td className="px-4 py-3 text-slate-600">{patient.payerName || "—"}</td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary" className="bg-slate-100 text-slate-600">
                          {patient._count?.submissions || 0}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">{format(new Date(patient.createdAt), "MMM d, yyyy")}</td>
                      <td className="px-4 py-3">
                        <ChevronRight className="h-4 w-4 text-slate-300" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
