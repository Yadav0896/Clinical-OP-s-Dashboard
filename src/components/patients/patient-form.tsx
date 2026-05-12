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
import { PAYERS } from "@/lib/constants";
import { Loader2 } from "lucide-react";

interface PatientFormProps {
  onSubmit: (data: Record<string, unknown>) => void;
  isLoading: boolean;
  onClose: () => void;
}

export function PatientForm({ onSubmit, isLoading, onClose }: PatientFormProps) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    mrn: "",
    memberId: "",
    payerId: "",
    payerName: "",
    phone: "",
    email: "",
    diagnosisNotes: "",
  });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "payerId") {
        const payer = PAYERS.find((p) => p.id === value);
        next.payerName = payer?.name || "";
      }
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.dateOfBirth) return;
    onSubmit(form);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Patient</DialogTitle>
          <DialogDescription>Enter patient demographics and insurance information.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>First Name *</Label>
              <Input
                value={form.firstName}
                onChange={(e) => handleChange("firstName", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Last Name *</Label>
              <Input
                value={form.lastName}
                onChange={(e) => handleChange("lastName", e.target.value)}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date of Birth *</Label>
              <Input
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => handleChange("dateOfBirth", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Gender</Label>
              <Select value={form.gender} onValueChange={(v) => handleChange("gender", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>MRN</Label>
              <Input
                value={form.mrn}
                onChange={(e) => handleChange("mrn", e.target.value)}
                placeholder="e.g. NT-123456"
              />
            </div>
            <div className="space-y-2">
              <Label>Member ID</Label>
              <Input
                value={form.memberId}
                onChange={(e) => handleChange("memberId", e.target.value)}
                placeholder="Insurance member ID"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Payer</Label>
            <Select value={form.payerId} onValueChange={(v) => handleChange("payerId", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select payer..." />
              </SelectTrigger>
              <SelectContent>
                {PAYERS.map((payer) => (
                  <SelectItem key={payer.id} value={payer.id}>
                    {payer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={form.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="patient@email.com"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Diagnosis Notes</Label>
            <Textarea
              value={form.diagnosisNotes}
              onChange={(e) => handleChange("diagnosisNotes", e.target.value)}
              placeholder="Clinical notes, diagnosis, allergies..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !form.firstName || !form.lastName || !form.dateOfBirth}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Patient
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
