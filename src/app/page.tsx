'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { BarChart3, Users, FileText, Printer, CheckCircle, Radio, RefreshCw, Cloud } from 'lucide-react';
import { ConnectSheet } from '@/components/clinical/connect-sheet';
import { FiltersBar } from '@/components/clinical/filters-bar';
import { KpiCards } from '@/components/clinical/kpi-cards';
import { ModuleCards } from '@/components/clinical/module-cards';
import { AgentChart } from '@/components/clinical/agent-chart';
import { ModuleChart } from '@/components/clinical/module-chart';
import { TrendChart } from '@/components/clinical/trend-chart';
import { AgentTable } from '@/components/clinical/agent-table';
import { AgentPerformanceTab } from '@/components/clinical/agent-performance-tab';
import { EodGeneratorTab } from '@/components/clinical/eod-generator-tab';
import { FaxVobTab } from '@/components/clinical/fax-vob-tab';
import {
  generateDummyData,
  parseMultiSheetExcel,
  applyFilters,
  type ClinicalRecord,
  type FilterState,
} from '@/lib/clinical-data';
import {
  saveUploadedFile,
  getStoredFile,
  computeFileHash,
  detectDeploymentMode,
  getGoogleSheetUrl,
  getAppConfig,
  clearGoogleSheetUrl,
  extractSheetId,
} from '@/lib/storage';

// ─── Polling interval (5 seconds) ──────────────────────────
const POLL_INTERVAL = 5000;

export default function ClinicalOpsDashboard() {
  const [data, setData] = useState<ClinicalRecord[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [filters, setFilters] = useState<FilterState>({
    clinic: 'all',
    agent: 'all',
    dateFrom: '',
    dateTo: '',
  });

  // ─── Real-time Sync State ────────────────────────────────
  const [liveHash, setLiveHash] = useState<string>('');
  const [isLive, setIsLive] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');
  const [syncCount, setSyncCount] = useState<number>(0);
  const [showRefreshBanner, setShowRefreshBanner] = useState(false);
  const [deploymentMode, setDeploymentMode] = useState<string>('unknown');
  const [dataSource, setDataSource] = useState<string>('');
  const [googleSheetUrl, setGoogleSheetUrl] = useState<string | null>(null);
  const liveHashRef = useRef<string>('');
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Parse Excel Buffer (client-side) ────────────────────
  const parseExcelBuffer = useCallback(async (buffer: ArrayBuffer, name: string) => {
    try {
      const XLSX = await import('xlsx');
      const workbook = XLSX.read(buffer, { type: 'array' });
      const parsed = parseMultiSheetExcel(workbook);
      if (parsed.length > 0) {
        setData(parsed);
        setFileName(name);
        return true;
      }
    } catch (err) {
      console.error('Failed to parse Excel:', err);
    }
    return false;
  }, []);

  // ─── Load Data on Mount ─────────────────────────────────
  useEffect(() => {
    const mode = detectDeploymentMode();
    setDeploymentMode(mode);

    // ─── Helper: fetch Google Sheet via API ───────────────
    const fetchGoogleSheet = async (url: string, source: string): Promise<boolean> => {
      try {
        const res = await fetch('/api/google-sheets/fetch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        });
        if (!res.ok) {
          console.error('[Google Sheets] Fetch failed:', res.status);
          return false;
        }
        const buffer = await res.arrayBuffer();
        const sheetId = extractSheetId(url) || '';
        const name = `Google Sheet (${sheetId.slice(0, 8)})`;
        const hash = computeFileHash(buffer);
        const success = await parseExcelBuffer(buffer, name);
        if (success) {
          liveHashRef.current = hash;
          setLiveHash(hash);
          setLastSyncTime(new Date().toLocaleTimeString());
          setDataSource(source);
          setGoogleSheetUrl(url);
          return true;
        }
      } catch (err) {
        console.error('[Google Sheets] Error:', err);
      }
      return false;
    };

    const loadData = async () => {
      // Priority 0: Check for saved Google Sheets URL
      try {
        const savedUrl = await getGoogleSheetUrl();
        const savedConfig = await getAppConfig();
        if (savedUrl && savedConfig?.dataSource === 'google-sheets') {
          console.log('[Init] Loading from Google Sheets:', savedUrl);
          const success = await fetchGoogleSheet(savedUrl, 'google-sheets');
          if (success) return;
          // If fetch fails, fall through to other sources
          console.log('[Init] Google Sheets fetch failed, falling back...');
        }
      } catch (err) {
        console.error('[Init] Google Sheets check failed:', err);
      }

      // Priority 1: Check IndexedDB for previously uploaded file
      try {
        const stored = await getStoredFile();
        if (stored) {
          console.log('[Init] Loading from IndexedDB:', stored.fileName);
          const success = await parseExcelBuffer(stored.buffer, stored.fileName);
          if (success) {
            liveHashRef.current = stored.hash;
            setLiveHash(stored.hash);
            setLastSyncTime(new Date(stored.uploadedAt).toLocaleTimeString());
            setDataSource('browser');
            return;
          }
        }
      } catch (err) {
        console.error('[Init] IndexedDB read failed:', err);
      }

      // Priority 2: Removed (No longer auto-loading public/ template)
      /*
      try {
        const res = await fetch('/Clinical_Ops_Data_Entry_Populated.xlsx');
        if (res.ok) {
          const buffer = await res.arrayBuffer();
          const hash = computeFileHash(buffer);
          const success = await parseExcelBuffer(buffer, 'Clinical_Ops_Data_Entry_Populated.xlsx');
          if (success) {
            liveHashRef.current = hash;
            setLiveHash(hash);
            setLastSyncTime(new Date().toLocaleTimeString());
            setDataSource('default');
            return;
          }
        }
      } catch (err) {
        console.error('[Init] Public file load failed:', err);
      }
      */

      // Final state: Start with empty dashboard (all zeros)
      console.log('[Init] No data source found - starting with empty dashboard');
      setData([]); 
      setFileName('');
      setDataSource('none');
    };

    loadData();
  }, [parseExcelBuffer]);

  // ─── Real-time Polling (server + Google Sheets mode) ────
  useEffect(() => {
    // Don't start server polling if data comes from browser storage
    if (dataSource === 'browser') {
      return;
    }

    let gsPollCount = 0;

    const pollStatus = async () => {
      // ── Google Sheets polling: re-fetch from Google every 60s ──
      if (dataSource === 'google-sheets' && googleSheetUrl) {
        gsPollCount++;
        // Poll every 60 seconds for Google Sheets (12 × 5s interval)
        if (gsPollCount % 12 === 0) {
          console.log('[Google Sheets] Auto-refreshing...');
          setIsRefreshing(true);
          setShowRefreshBanner(true);
          try {
            const res = await fetch('/api/google-sheets/fetch', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: googleSheetUrl }),
            });
            if (res.ok) {
              const buffer = await res.arrayBuffer();
              const hash = computeFileHash(buffer);
              // Only update if data actually changed
              if (hash !== liveHashRef.current) {
                const sheetId = extractSheetId(googleSheetUrl) || '';
                await parseExcelBuffer(buffer, `Google Sheet (${sheetId.slice(0, 8)})`);
                liveHashRef.current = hash;
                setLiveHash(hash);
                setSyncCount(prev => prev + 1);
              }
              setLastSyncTime(new Date().toLocaleTimeString());
              setIsLive(true);
            }
          } catch (err) {
            console.error('[Google Sheets] Auto-refresh failed:', err);
          }
          setTimeout(() => {
            setIsRefreshing(false);
            setShowRefreshBanner(false);
          }, 2000);
        }
        return;
      }

      // ── Server file polling (ONLY if no other source is active) ──
      if (dataSource !== 'none' && dataSource !== 'default') {
        return; 
      }

      try {
        const res = await fetch('/api/excel-status', {
          cache: 'no-store',
        });
        if (!res.ok) return;

        const status = await res.json();

        if (status.exists && status.hash) {
          setIsLive(true);

          // If hash changed, auto-refresh data
          if (liveHashRef.current && liveHashRef.current !== status.hash) {
            console.log('[Live Sync] File changed, refreshing...');
            setIsRefreshing(true);
            setShowRefreshBanner(true);

            try {
              const dataRes = await fetch('/api/excel-data', {
                cache: 'no-store',
              });
              if (dataRes.ok) {
                const buffer = await dataRes.arrayBuffer();
                await parseExcelBuffer(buffer, 'Clinical_Ops_Data_Entry_Populated.xlsx');
                setLastSyncTime(new Date().toLocaleTimeString());
                setSyncCount(prev => prev + 1);
              }
            } catch (err) {
              console.error('[Live Sync] Refresh failed:', err);
            }

            setTimeout(() => {
              setIsRefreshing(false);
              setShowRefreshBanner(false);
            }, 2000);
          }

          // Update hash after first poll and on changes
          if (!liveHashRef.current) {
            liveHashRef.current = status.hash;
            setLiveHash(status.hash);
          } else if (liveHashRef.current !== status.hash) {
            liveHashRef.current = status.hash;
            setLiveHash(status.hash);
          }
        } else {
          setIsLive(false);
        }
      } catch (err) {
        // Polling error — server APIs may not be available (Vercel)
        console.error('[Live Sync] Poll error:', err);
        setIsLive(false);
      }
    };

    // Initial poll (try once to detect server mode)
    pollStatus();

    // Only set up interval if server APIs are available
    pollingRef.current = setInterval(pollStatus, POLL_INTERVAL);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [parseExcelBuffer, dataSource, googleSheetUrl]);

  const filteredData = useMemo(() => applyFilters(data, filters), [data, filters]);

  // ─── Excel Upload Handler ───────────────────────────────
  const handleUpload = useCallback(async (file: File) => {
    try {
      // Read file as buffer
      const buffer = await file.arrayBuffer();

      // Parse client-side for immediate display
      const success = await parseExcelBuffer(buffer, file.name);
      if (!success) return;

      const hash = computeFileHash(buffer);

      // Clear any Google Sheets config so reload doesn't revert to it
      try {
        await clearGoogleSheetUrl();
      } catch (err) {
        console.error('Failed to clear Google Sheets config:', err);
      }

      // Save to IndexedDB (works on Vercel — no server needed)
      try {
        const result = await saveUploadedFile(buffer, file.name);
        setLastSyncTime(new Date(result.uploadedAt).toLocaleTimeString());
        setDataSource('browser');
        setGoogleSheetUrl(null);
      } catch (err) {
        console.error('IndexedDB save failed:', err);
      }

      // Also try uploading to server (for self-hosted deployments)
      try {
        const formData = new FormData();
        formData.append('file', file);

        const uploadRes = await fetch('/api/excel-upload', {
          method: 'POST',
          body: formData,
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          // If server upload succeeded, reset hash for server polling
          liveHashRef.current = uploadData.hash || hash;
          setLiveHash(uploadData.hash || hash);
          setDataSource('server');
        }
      } catch (err) {
        // Server upload failed (expected on Vercel) — IndexedDB is the fallback
        console.log('[Upload] Server upload skipped (client-only mode)');
      }

      setSyncCount(prev => prev + 1);
    } catch (err) {
      console.error('Failed to process Excel:', err);
    }
  }, [parseExcelBuffer]);

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

  // ─── Data Source Badge ─────────────────────────────────
  const dataSourceLabel = () => {
    switch (dataSource) {
      case 'google-sheets': return 'Google Sheets (Live)';
      case 'browser': return 'Browser Storage';
      case 'server': return 'Server File';
      case 'default': return 'Default Sheet';
      case 'demo': return 'Demo Data';
      default: return '';
    }
  };

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

          {/* ─── Connect Sheet + Live Sync ─────────────────── */}
          <div className="flex items-center gap-3">
            <ConnectSheet
              currentFileName={fileName}
              onUpload={handleUpload}
              dataSource={dataSource}
            />
            {isLive && (
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                showRefreshBanner
                  ? 'bg-teal-50 border border-teal-200 text-teal-700'
                  : 'bg-emerald-50 border border-emerald-100 text-emerald-600'
              }`}>
                {showRefreshBanner ? (
                  <RefreshCw size={12} className="animate-spin" />
                ) : (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                )}
                {showRefreshBanner ? 'Syncing...' : 'Live'}
                {lastSyncTime && !showRefreshBanner && (
                  <span className="text-[10px] text-emerald-400 hidden sm:inline">
                    {' '}{lastSyncTime}
                  </span>
                )}
              </div>
            )}
            {dataSource === 'browser' && !isLive && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-blue-50 border border-blue-100 text-blue-600">
                <Cloud size={12} />
                <span className="hidden sm:inline">Stored</span>
              </div>
            )}
            {syncCount > 0 && (
              <span className="text-[10px] text-slate-400 hidden md:inline">
                {syncCount} refresh{syncCount > 1 ? 'es' : ''}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* ─── Auto-Refresh Banner ──────────────────────────── */}
      {showRefreshBanner && (
        <div className="bg-teal-50 border-b border-teal-200 px-4 py-2 text-center">
          <p className="text-sm text-teal-700 font-medium flex items-center justify-center gap-2">
            <RefreshCw size={14} className="animate-spin" />
            Dashboard updated — new data detected from Excel sheet
          </p>
        </div>
      )}

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
            <strong className="text-slate-700">
              {fileName || 'Demo Data'}
            </strong>
            {' — '}
            {filteredData.length.toLocaleString()} records loaded
            {fileName && ` · ${data.length} total`}
          </span>
          {dataSource && dataSource !== 'demo' && (
            <>
              <span className="mx-1 text-slate-300">|</span>
              <span className="text-xs text-slate-400 font-medium">
                {dataSourceLabel()}
              </span>
            </>
          )}
          {isLive && (
            <>
              <span className="mx-1 text-slate-300">|</span>
              <Radio size={14} className="text-emerald-500 flex-shrink-0" />
              <span className="text-xs text-emerald-600 font-medium">
                Real-time sync active
              </span>
            </>
          )}
          {deploymentMode === 'vercel' && (
            <>
              <span className="mx-1 text-slate-300">|</span>
              <Cloud size={14} className="text-blue-400 flex-shrink-0" />
              <span className="text-xs text-blue-500 font-medium">
                Vercel
              </span>
            </>
          )}
        </div>

        {/* ─── Tabs ──────────────────────────────────────── */}
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
          <TabsContent value="dashboard" className="space-y-6 animate-in fade-in duration-500">
            <KpiCards data={filteredData} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <AgentChart data={filteredData} title="Tasks by Individual" />
              </div>
              <div>
                <ModuleChart data={filteredData} title="Task Distribution by Module" />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-800">Individual Performance Overview</h3>
              </div>
              <AgentTable data={filteredData} />
            </div>
          </TabsContent>

          {/* Individual Performance Tab */}
          <TabsContent value="agents" className="animate-fade-in">
            <AgentPerformanceTab data={filteredData} />
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
      </main>

      {/* ─── Footer ──────────────────────────────────────── */}
      <footer className="mt-auto border-t border-slate-200 bg-white">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-slate-400">
            RagaAI Clinical Ops · Manual Team Performance Tracker · 2026
            {isLive && ' · Real-time Sync Enabled'}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded border border-teal-100 uppercase tracking-wider">
              v2.0 - DYNAMIC SYNC
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
