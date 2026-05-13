'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { BarChart3, Users, FileText, Printer, CheckCircle } from 'lucide-react';
import { FiltersBar } from '@/components/clinical/filters-bar';
import { KpiCards } from '@/components/clinical/kpi-cards';
import { ModuleCards } from '@/components/clinical/module-cards';
import { IndividualChart } from '@/components/clinical/individual-chart';
import { ModuleChart } from '@/components/clinical/module-chart';
import { TrendChart } from '@/components/clinical/trend-chart';
import { IndividualTable } from '@/components/clinical/individual-table';
import { IndividualPerformanceTab } from '@/components/clinical/individual-performance-tab';
import { EodGeneratorTab } from '@/components/clinical/eod-generator-tab';
import { FaxVobTab } from '@/components/clinical/fax-vob-tab';
import {
  generateDummyData,
  parseMultiSheetExcel,
  applyFilters,
  type ClinicalRecord,
  type FilterState,
} from '@/lib/clinical-data';

export default function ClinicalOpsDashboard() {
  const [data, setData] = useState<ClinicalRecord[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setData([]);
    setIsMounted(true);
  }, []);
  const [fileName, setFileName] = useState<string>('');
  const [filters, setFilters] = useState<FilterState>({
    clinic: 'all',
    agent: 'all',
    dateFrom: '',
    dateTo: '',
  });

  const filteredData = useMemo(() => applyFilters(data, filters), [data, filters]);

  // ─── Excel Upload Handler ──────────────────────────────
  const handleUpload = useCallback(async (file: File) => {
    try {
      const XLSX = await import('xlsx');
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });

      const parsed = parseMultiSheetExcel(workbook);

      if (parsed.length > 0) {
        setData(parsed);
        setFileName(file.name);
      }
    } catch (err) {
      console.error('Failed to parse Excel:', err);
    }
  }, []);

  // ─── Export CSV ────────────────────────────────────────
  const handleExport = useCallback(() => {
    const headers = [
      'Date', 'Agent', 'Clinic', 'Shift',
      'Sched Total', 'Cancelled', 'New Pt', 'Follow-Up', 'Admin Bkgs', 'Bot Bkgs',
      'Ins Updated', 'Cards Upld', 'Ins Notes', 'Ins Direct', 'Manual Verify', 'VOB CSV',
      'PR Corrected', 'HH Corrected', 'Forms eCW', 'Forms Failed',
      'Fax Recv', 'Fax Classified', 'Fax Classif Fail', 'Fax Fwd', 'Fax Fwd Fail', 'Fax Ren', 'Fax Ren Fail',
      'VOB Total', 'VOB Matched', 'VOB Unmatch', 'VOB Created', 'VOB Updated', 'VOB Failed',
    ];
    const rows = filteredData.map(r => [
      r.date, r.agent, r.clinic, r.shift,
      r.schedTotal, r.schedCancel, r.newPatients, r.followUp, r.adminBookings, r.botBookings,
      r.insuranceUpdated, r.cardsUploaded, r.insuranceNotes, r.insuranceDirect, r.manualVerifications, r.vobCsvUploaded,
      r.prFormsCorrected, r.hhFormsCorrected, r.formsUploadedEcw, r.formsFailed,
      r.faxReceived, r.faxClassified, r.faxClassifFailed, r.faxForwarded, r.faxFwdFailed, r.faxRenamed, r.faxRenFailed,
      r.vobTotal, r.vobMatched, r.vobUnmatched, r.vobCreated, r.vobUpdated, r.vobFailed,
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'clinical_ops_data.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredData]);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 size={15} /> },
    { id: 'agents', label: 'Individual Performance', icon: <Users size={15} /> },
    { id: 'eod', label: 'EOD Generator', icon: <FileText size={15} /> },
    { id: 'fax-vob', label: 'Fax & VOB', icon: <Printer size={15} /> },
  ] as const;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* ─── Header ───────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-teal-600 flex items-center justify-center font-bold text-white text-sm shadow-sm">
              RA
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800 leading-tight">
                Clinical Ops Tracker
              </h1>
              <p className="text-[11px] text-slate-400">
                Manual Team Performance Dashboard
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* ─── Main Content ────────────────────────────────── */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-5">
        {/* Filters */}
        <div className="mb-5">
          <FiltersBar
            filters={filters}
            onFilterChange={setFilters}
            onUpload={handleUpload}
            onExport={handleExport}
            hasData={data.length > 0}
            availableAgents={Array.from(new Set(data.map(r => r.agent).filter(Boolean))).sort()}
            availableClinics={Array.from(new Set(data.map(r => r.clinic).filter(Boolean))).sort()}
          />
        </div>

        {/* Status Banner */}
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-4 py-2.5 mb-5 shadow-sm">
          <CheckCircle size={16} className="text-teal-500 flex-shrink-0" />
          <span className="text-sm text-slate-500">
            {!isMounted ? (
              <span className="animate-pulse">Loading tracker data...</span>
            ) : (
              <>
                <strong className="text-slate-700">
                  {fileName || 'Demo Data'}
                </strong>
                {' — '}
                {filteredData.length.toLocaleString()} records loaded
                {fileName && ` · ${data.length} total`}
              </>
            )}
          </span>
        </div>

        {/* ─── Tabs ──────────────────────────────────────── */}
        {isMounted ? (
          <Tabs defaultValue="dashboard" className="w-full">
            <TabsList className="bg-white border border-slate-200 rounded-xl p-1 mb-5 h-auto w-fit shadow-sm">
              {tabs.map(tab => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium data-[state=active]:bg-teal-600 data-[state=active]:text-white data-[state=active]:shadow-sm text-slate-500 data-[state=inactive]:hover:text-slate-700 data-[state=inactive]:hover:bg-slate-50 transition-all"
                >
                  {tab.icon}
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Dashboard Tab */}
            <TabsContent value="dashboard" className="space-y-5 animate-fade-in">
              <KpiCards data={filteredData} />
              <ModuleCards data={filteredData} />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <IndividualChart data={filteredData} />
                <ModuleChart data={filteredData} />
              </div>
              <TrendChart data={filteredData} />
              <IndividualTable data={filteredData} />
            </TabsContent>

            {/* Individual Performance Tab */}
            <TabsContent value="agents" className="animate-fade-in">
              <IndividualPerformanceTab data={filteredData} />
            </TabsContent>

            {/* EOD Generator Tab */}
            <TabsContent value="eod" className="animate-fade-in">
              <EodGeneratorTab data={filteredData} />
            </TabsContent>

            {/* Fax & VOB Tab */}
            <TabsContent value="fax-vob" className="animate-fade-in">
              <FaxVobTab data={filteredData} />
            </TabsContent>
          </Tabs>
        ) : (
          <div className="h-[400px] flex items-center justify-center bg-white border border-slate-200 rounded-xl shadow-sm">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-teal-600/20 border-t-teal-600 rounded-full animate-spin" />
              <p className="text-sm text-slate-400">Initializing dashboard...</p>
            </div>
          </div>
        )}
      </main>

      {/* ─── Footer ──────────────────────────────────────── */}
      <footer className="mt-auto border-t border-slate-200 bg-white">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-3">
          <p className="text-[11px] text-slate-400 text-center">
            RagaAI Clinical Ops · Manual Team Performance Tracker · 2026
          </p>
        </div>
      </footer>
    </div>
  );
}
