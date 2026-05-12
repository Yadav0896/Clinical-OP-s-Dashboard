'use client';

import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Copy, Check, Activity } from 'lucide-react';
import type { ClinicalRecord } from '@/lib/clinical-data';
import { AGENTS, CLINICS } from '@/lib/clinical-data';

interface EodGeneratorTabProps {
  data: ClinicalRecord[];
}

const INITIAL_FORM = {
  date: new Date().toISOString().split('T')[0],
  clinic: 'Denver Allergy',
  agent: 'Mary Jenifar',
  shift: 'Day',
  schedTotal: 0, schedCancel: 0, newPatients: 0, followUp: 0,
  adminBookings: 0, botBookings: 0, genderValidated: '100%',
  duplicatesFound: 0, hmoFlagged: 0,
  insuranceUpdated: 0, cardsUploaded: 0, insuranceNotes: 0,
  insuranceDirect: 0, manualVerifications: 0, vobCsvUploaded: 0,
  prFormsCorrected: 0, hhFormsCorrected: 0, formsUploadedEcw: 0, formsFailed: 0,
  faxReceived: 0, faxClassified: 0, faxClassifFailed: 0,
  faxForwarded: 0, faxFwdFailed: 0, faxRenamed: 0, faxRenFailed: 0,
  failedFaxIds: '', faxNotes: '',
  vobTotal: 0, vobMatched: 0, vobUnmatched: 0, vobCreated: 0, vobUpdated: 0, vobFailed: 0,
};

type FormState = typeof INITIAL_FORM;

export function EodGeneratorTab({ data }: EodGeneratorTabProps) {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [copied, setCopied] = useState(false);

  const updateField = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  }, []);

  const autoFill = useCallback(() => {
    if (data.length === 0) return;
    const latest = data
      .filter(r => r.agent === form.agent && r.clinic === form.clinic)
      .sort((a, b) => b.date.localeCompare(a.date))[0];
    if (!latest) return;
    setForm(prev => ({
      ...prev,
      date: latest.date,
      shift: latest.shift,
      schedTotal: latest.schedTotal,
      schedCancel: latest.schedCancel,
      newPatients: latest.newPatients,
      followUp: latest.followUp,
      adminBookings: latest.adminBookings,
      botBookings: latest.botBookings,
      duplicatesFound: latest.duplicatesFound,
      hmoFlagged: latest.hmoFlagged,
      insuranceUpdated: latest.insuranceUpdated,
      cardsUploaded: latest.cardsUploaded,
      insuranceNotes: latest.insuranceNotes,
      insuranceDirect: latest.insuranceDirect,
      manualVerifications: latest.manualVerifications,
      vobCsvUploaded: latest.vobCsvUploaded,
      prFormsCorrected: latest.prFormsCorrected,
      hhFormsCorrected: latest.hhFormsCorrected,
      formsUploadedEcw: latest.formsUploadedEcw,
      formsFailed: latest.formsFailed,
      faxReceived: latest.faxReceived,
      faxClassified: latest.faxClassified,
      faxClassifFailed: latest.faxClassifFailed,
      faxForwarded: latest.faxForwarded,
      faxFwdFailed: latest.faxFwdFailed,
      faxRenamed: latest.faxRenamed,
      faxRenFailed: latest.faxRenFailed,
      failedFaxIds: latest.failedFaxIds,
      faxNotes: latest.faxNotes,
      vobTotal: latest.vobTotal,
      vobMatched: latest.vobMatched,
      vobUnmatched: latest.vobUnmatched,
      vobCreated: latest.vobCreated,
      vobUpdated: latest.vobUpdated,
      vobFailed: latest.vobFailed,
    }));
  }, [data, form.agent, form.clinic]);

  const report = useMemo(() => {
    const f = form;
    const dateStr = f.date ? new Date(f.date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
    const lines: string[] = [];
    lines.push(`Please find the task summary for ${dateStr} ${f.clinic}:`);

    if (f.insuranceUpdated > 0 || f.cardsUploaded > 0 || f.manualVerifications > 0 || f.vobCsvUploaded > 0) {
      lines.push('* Number of appointments updated with insurance details: ' + String(f.insuranceUpdated).padStart(2, '0'));
      if (f.cardsUploaded > 0) lines.push('* No of insurance card upload in ECW: ' + String(f.cardsUploaded).padStart(2, '0'));
      if (f.insuranceNotes > 0) lines.push('* Insurance added in general notes (no card): ' + String(f.insuranceNotes).padStart(2, '0'));
      if (f.insuranceDirect > 0) lines.push('* Insurance added in info section directly: ' + String(f.insuranceDirect).padStart(2, '0'));
      if (f.manualVerifications > 0) lines.push('* Number of Manual Insurance Verification: ' + String(f.manualVerifications).padStart(2, '0'));
      if (f.vobCsvUploaded > 0) lines.push('* VOB-CSV File upload in Dashboard: ' + String(f.vobCsvUploaded).padStart(2, '0'));
    }

    if (f.prFormsCorrected > 0 || f.hhFormsCorrected > 0 || f.formsFailed > 0) {
      lines.push('* Number of Patient intake forms corrected: ' + String(f.prFormsCorrected + f.hhFormsCorrected).padStart(2, '0'));
      if (f.prFormsCorrected > 0) lines.push('  - PR Forms: ' + f.prFormsCorrected);
      if (f.hhFormsCorrected > 0) lines.push('  - HH Forms: ' + f.hhFormsCorrected);
      if (f.formsUploadedEcw > 0) lines.push('* Forms uploaded in eCW: ' + f.formsUploadedEcw);
      if (f.formsFailed > 0) lines.push('* Forms Failed: ' + f.formsFailed);
    }

    if (f.schedTotal > 0 || f.newPatients > 0 || f.followUp > 0 || f.duplicatesFound > 0) {
      lines.push('* Scheduling corrections: ' + f.schedTotal);
      if (f.newPatients > 0) lines.push('  - New Patients: ' + f.newPatients);
      if (f.followUp > 0) lines.push('  - Follow-Up: ' + f.followUp);
    }

    if (f.faxReceived > 0) {
      lines.push(`\nFax Classification ${dateStr} - ${f.clinic}: ${f.faxReceived} Received, ${f.faxClassified} classified (${f.faxClassifFailed} failed), ${f.faxForwarded} forwarded (${f.faxFwdFailed} failed), ${f.faxRenamed} renamed (${f.faxRenFailed} failed)`);
      if (f.failedFaxIds) lines.push(`Failed IDs: ${f.failedFaxIds}`);
      if (f.faxNotes) lines.push(`Notes: ${f.faxNotes}`);
    }

    if (f.vobTotal > 0) {
      lines.push(`\nPlease find the summary for VOB for ${f.clinic.replace(' Allergy', '')}:`);
      lines.push(`* Total Processed: ${f.vobTotal}`);
      lines.push(`* Successful Matches: ${f.vobMatched}`);
      lines.push(`* Unmatched Records: ${f.vobUnmatched}`);
      lines.push(`  1. Created: ${f.vobCreated}`);
      lines.push(`  2. Updated: ${f.vobUpdated}`);
      lines.push(`  3. Failed: ${f.vobFailed}`);
    }

    return lines.join('\n');
  }, [form]);

  const copyReport = useCallback(() => {
    navigator.clipboard.writeText(report).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      // Clipboard may fail in insecure contexts — silent fallback
    });
  }, [report]);

  const numInput = (label: string, field: keyof FormState) => (
    <div>
      <Label className="text-[11px] text-slate-500 mb-1 block">{label}</Label>
      <Input
        type="number"
        min={0}
        placeholder="0"
        value={(form[field] as number) || 0}
        onChange={e => updateField(field, parseInt(e.target.value) || 0)}
        className="h-8 text-xs bg-slate-50 border-slate-200"
      />
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      {/* Left: Form */}
      <Card className="bg-white border border-slate-200 rounded-xl shadow-sm">
        <CardHeader className="pb-3 pt-4 px-5">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Sparkles size={15} className="text-teal-600" /> EOD Report Generator
            </CardTitle>
            {data.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-teal-600 hover:text-teal-700 hover:bg-teal-50"
                onClick={autoFill}
              >
                <Activity size={12} className="mr-1" /> Auto-fill
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-5 space-y-5">
          {/* Meta */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-[11px] text-slate-500 mb-1 block">Date</Label>
              <Input
                type="date"
                value={form.date}
                onChange={e => updateField('date', e.target.value)}
                className="h-8 text-xs bg-slate-50 border-slate-200"
              />
            </div>
            <div>
              <Label className="text-[11px] text-slate-500 mb-1 block">Shift</Label>
              <Select value={form.shift} onValueChange={v => updateField('shift', v)}>
                <SelectTrigger className="h-8 text-xs bg-slate-50 border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Day">Day</SelectItem>
                  <SelectItem value="Night">Night</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[11px] text-slate-500 mb-1 block">Agent</Label>
              <Select value={form.agent} onValueChange={v => updateField('agent', v)}>
                <SelectTrigger className="h-8 text-xs bg-slate-50 border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AGENTS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[11px] text-slate-500 mb-1 block">Clinic</Label>
              <Select value={form.clinic} onValueChange={v => updateField('clinic', v)}>
                <SelectTrigger className="h-8 text-xs bg-slate-50 border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CLINICS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Scheduling */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Scheduling</div>
            <div className="grid grid-cols-3 gap-2">
              {numInput('Total', 'schedTotal')}
              {numInput('Cancelled', 'schedCancel')}
              {numInput('New Patients', 'newPatients')}
              {numInput('Follow-Up', 'followUp')}
              {numInput('Admin Bookings', 'adminBookings')}
              {numInput('Bot Bookings', 'botBookings')}
            </div>
          </div>

          {/* Insurance */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Insurance</div>
            <div className="grid grid-cols-3 gap-2">
              {numInput('Updated', 'insuranceUpdated')}
              {numInput('Cards Uploaded', 'cardsUploaded')}
              {numInput('Notes', 'insuranceNotes')}
              {numInput('Direct', 'insuranceDirect')}
              {numInput('Manual Verify', 'manualVerifications')}
              {numInput('VOB CSV', 'vobCsvUploaded')}
            </div>
          </div>

          {/* Patient Intake */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Patient Intake</div>
            <div className="grid grid-cols-3 gap-2">
              {numInput('PR Corrected', 'prFormsCorrected')}
              {numInput('HH Corrected', 'hhFormsCorrected')}
              {numInput('Forms eCW', 'formsUploadedEcw')}
              {numInput('Forms Failed', 'formsFailed')}
            </div>
          </div>

          {/* Fax */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Fax</div>
            <div className="grid grid-cols-3 gap-2">
              {numInput('Received', 'faxReceived')}
              {numInput('Classified', 'faxClassified')}
              {numInput('Classif Fail', 'faxClassifFailed')}
              {numInput('Forwarded', 'faxForwarded')}
              {numInput('Fwd Fail', 'faxFwdFailed')}
              {numInput('Renamed', 'faxRenamed')}
            </div>
            <div className="mt-2">
              <Label className="text-[11px] text-slate-500 mb-1 block">Failed Fax IDs</Label>
              <Input
                value={form.failedFaxIds}
                onChange={e => updateField('failedFaxIds', e.target.value)}
                placeholder="FAX-1234, FAX-5678"
                className="h-8 text-xs bg-slate-50 border-slate-200"
              />
            </div>
            <div className="mt-2">
              <Label className="text-[11px] text-slate-500 mb-1 block">Fax Notes</Label>
              <Textarea
                value={form.faxNotes}
                onChange={e => updateField('faxNotes', e.target.value)}
                placeholder="Additional notes..."
                rows={2}
                className="text-xs bg-slate-50 border-slate-200 resize-none"
              />
            </div>
          </div>

          {/* VOB */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">VOB</div>
            <div className="grid grid-cols-3 gap-2">
              {numInput('Total', 'vobTotal')}
              {numInput('Matched', 'vobMatched')}
              {numInput('Unmatched', 'vobUnmatched')}
              {numInput('Created', 'vobCreated')}
              {numInput('Updated', 'vobUpdated')}
              {numInput('Failed', 'vobFailed')}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Right: Output */}
      <Card className="bg-white border border-slate-200 rounded-xl shadow-sm lg:sticky lg:top-4">
        <CardHeader className="pb-3 pt-4 px-5">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-slate-700">Generated Report</CardTitle>
            <Button
              size="sm"
              className="h-7 text-xs bg-teal-600 hover:bg-teal-700 text-white"
              onClick={copyReport}
            >
              {copied ? <Check size={12} className="mr-1" /> : <Copy size={12} className="mr-1" />}
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <pre className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs text-slate-700 font-mono whitespace-pre-wrap break-words max-h-[600px] overflow-y-auto leading-relaxed">
            {report}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
