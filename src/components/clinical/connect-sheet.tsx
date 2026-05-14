'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Link2, Upload, CheckCircle, AlertCircle, Settings, Cloud, Trash2, Table } from 'lucide-react';
import {
  getStoredFileMeta,
  clearStoredFile,
  saveGoogleSheetUrl,
  clearGoogleSheetUrl,
  getGoogleSheetUrl,
  isGoogleSheetUrl,
  extractSheetId,
  type StoredFileMeta,
} from '@/lib/storage';

interface ConnectSheetProps {
  currentFileName: string;
  onUpload: (file: File) => void;
  onGoogleSheetConnect?: (url: string) => void;
  onGoogleSheetDisconnect?: () => void;
  dataSource?: string;
  onClear?: () => void;
}

const EXPECTED_SHEETS = [
  'Scheduling', 'Patient Registration', 'Health History',
  'Insurance Validation', 'VOB Doc Upload', 'VOB Agent Calls',
  'Fax Classification', 'Fax Referral', 'Duplicate Patients',
];

export function ConnectSheet({
  currentFileName,
  onUpload,
  onGoogleSheetConnect,
  onGoogleSheetDisconnect,
  dataSource,
  onClear,
}: ConnectSheetProps) {
  const [open, setOpen] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [storedMeta, setStoredMeta] = useState<StoredFileMeta | null>(null);
  const [clearing, setClearing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Google Sheets state
  const [gsUrl, setGsUrl] = useState('');
  const [gsStatus, setGsStatus] = useState<'idle' | 'validating' | 'connecting' | 'success' | 'error'>('idle');
  const [gsError, setGsError] = useState('');
  const [savedGsUrl, setSavedGsUrl] = useState<string | null>(null);
  const [gsDisconnecting, setGsDisconnecting] = useState(false);

  // Load stored state on mount
  useEffect(() => {
    getStoredFileMeta().then(meta => {
      if (meta) setStoredMeta(meta);
    }).catch(() => {});

    getGoogleSheetUrl().then(url => {
      if (url) setSavedGsUrl(url);
    }).catch(() => {});
  }, []);

  const handleFileUpload = async (file: File) => {
    // Instantly dispatch to parent to parse and render immediately
    onUpload(file);
    setUploadStatus('success');
    setTimeout(() => {
      setUploadStatus('idle');
      setOpen(false);
    }, 200);

    // Synchronize storage and APIs asynchronously in the background
    clearGoogleSheetUrl().catch(() => {});
    const formData = new FormData();
    formData.append('file', file);
    fetch('/api/excel-upload', { method: 'POST', body: formData }).catch(() => {});
  };

  const handleGoogleSheetConnect = async () => {
    const url = gsUrl.trim();
    if (!url) return;

    // Validate URL format
    if (!isGoogleSheetUrl(url)) {
      setGsError('Please enter a valid Google Sheets URL');
      setGsStatus('error');
      return;
    }

    setGsStatus('validating');
    setGsError('');

    // Validate via API
    try {
      const validateRes = await fetch(`/api/google-sheets/fetch?url=${encodeURIComponent(url)}`);
      const validateData = await validateRes.json();

      if (!validateData.valid) {
        setGsError(validateData.error || 'Invalid Google Sheets URL');
        setGsStatus('error');
        return;
      }
    } catch {
      // Validation endpoint might not be reachable — try connecting anyway
    }

    setGsStatus('connecting');

    // Fetch the actual sheet data via API
    try {
      const res = await fetch('/api/google-sheets/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Failed to fetch' }));
        setGsError(errorData.error || errorData.hint || `Failed to fetch sheet (${res.status})`);
        setGsStatus('error');
        return;
      }

      const buffer = await res.arrayBuffer();
      const sheetId = extractSheetId(url);

      // Create a synthetic File object so parent can parse it
      const fileName = sheetId ? `Google_Sheet_${sheetId.slice(0, 8)}.xlsx` : 'Google_Sheet.xlsx';
      const file = new File([buffer], fileName, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      // Save URL to IndexedDB
      await saveGoogleSheetUrl(url);

      // Trigger parent handler
      onGoogleSheetConnect?.(url);
      onUpload(file);

      setSavedGsUrl(url);
      setGsStatus('success');

      setTimeout(() => {
        setGsStatus('idle');
        setOpen(false);
      }, 1500);
    } catch (err) {
      setGsError('Network error — check your connection and try again');
      setGsStatus('error');
    }
  };

  const handleGoogleSheetDisconnect = async () => {
    setGsDisconnecting(true);
    onClear?.();
    onGoogleSheetDisconnect?.();
    setSavedGsUrl(null);
    setGsUrl('');
    setTimeout(() => {
      setGsDisconnecting(false);
      setOpen(false);
    }, 150);

    clearGoogleSheetUrl().catch(() => {});
    try {
      localStorage.clear();
    } catch {}
  };

  const handleClearStored = async () => {
    setClearing(true);
    onClear?.();
    setStoredMeta(null);
    setTimeout(() => {
      setClearing(false);
      setOpen(false);
    }, 150);

    clearStoredFile().catch(() => {});
    try {
      localStorage.clear();
    } catch {}
  };

  const isVercel = typeof window !== 'undefined' && (
    window.location.hostname.includes('.vercel.app') ||
    window.location.hostname.includes('.now.sh')
  );

  const isGsConnected = dataSource === 'google-sheets';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs border-teal-200 text-teal-700 hover:bg-teal-50 hover:text-teal-800 gap-1.5"
        >
          <Link2 size={13} />
          Connect Sheet
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Settings size={16} className="text-teal-600" />
            Data Source Settings
          </DialogTitle>
          <DialogDescription>
            Connect your Excel sheet or Google Sheets link to the dashboard.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Currently Connected */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle size={14} className={isGsConnected ? 'text-green-500' : 'text-emerald-500'} />
              <span className="text-xs font-semibold text-slate-700">Currently Connected</span>
            </div>
            <p className="text-sm text-slate-600 font-medium pl-6">{currentFileName}</p>
            <div className="flex items-center gap-2 pl-6 mt-0.5">
              <span className="text-[11px] text-slate-400">
                {isGsConnected ? 'Google Sheets (live link)' :
                 dataSource === 'browser' ? 'Stored in browser' :
                 dataSource === 'server' ? 'Server file' :
                 dataSource === 'default' ? 'Default template' : 'Demo data'}
              </span>
              {isVercel && (
                <>
                  <span className="text-[11px] text-slate-300">|</span>
                  <Cloud size={10} className="text-blue-400" />
                  <span className="text-[11px] text-blue-500">Vercel</span>
                </>
              )}
            </div>
          </div>

          {/* ─── Option 1: Link Google Sheet ─────────────────── */}
          <div>
            <Label className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
              <Table size={13} className="text-green-600" />
              Link Google Sheet
            </Label>
            <div className="bg-green-50/50 border border-green-200 rounded-lg p-3 space-y-3">
              <p className="text-[11px] text-green-700 leading-relaxed">
                Paste a Google Sheets link shared with <strong>"Anyone with the link can view"</strong>.
                The dashboard will fetch and display the data automatically.
              </p>
              <div className="flex gap-2">
                <Input
                  type="url"
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  value={gsUrl}
                  onChange={(e) => {
                    setGsUrl(e.target.value);
                    setGsError('');
                    if (gsStatus === 'error') setGsStatus('idle');
                  }}
                  className="h-8 text-xs bg-white"
                  disabled={gsStatus === 'validating' || gsStatus === 'connecting'}
                />
                <Button
                  size="sm"
                  onClick={handleGoogleSheetConnect}
                  disabled={!gsUrl.trim() || gsStatus === 'validating' || gsStatus === 'connecting'}
                  className="h-8 text-xs bg-green-600 hover:bg-green-700 text-white whitespace-nowrap"
                >
                  {gsStatus === 'validating' ? 'Validating...' :
                   gsStatus === 'connecting' ? 'Fetching...' :
                   gsStatus === 'success' ? 'Connected!' :
                   'Connect'}
                </Button>
              </div>
              {gsError && (
                <p className="text-[11px] text-red-500 flex items-center gap-1">
                  <AlertCircle size={11} /> {gsError}
                </p>
              )}
              {gsStatus === 'success' && (
                <p className="text-[11px] text-green-600 flex items-center gap-1">
                  <CheckCircle size={11} /> Connected! Dashboard updated with Google Sheets data.
                </p>
              )}

              {/* Already connected indicator */}
              {savedGsUrl && !isGsConnected && (
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  Previously linked: {extractSheetId(savedGsUrl)?.slice(0, 12)}...
                </div>
              )}
            </div>
          </div>

          {/* ─── Option 2: Upload Excel File ─────────────────── */}
          <div>
            <Label className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
              <Upload size={13} className="text-teal-600" />
              Upload Excel File
            </Label>
            <div
              className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center hover:border-teal-300 hover:bg-teal-50/30 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={20} className="mx-auto text-slate-400 mb-1.5" />
              <p className="text-sm text-slate-600 font-medium">
                Click to browse or drop your .xlsx file
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                {isVercel
                  ? 'Stored in your browser — persists across refreshes'
                  : 'Saved to server with real-time sync'}
              </p>
              {uploadStatus === 'success' && (
                <p className="text-xs text-emerald-600 font-medium mt-2 flex items-center justify-center gap-1">
                  <CheckCircle size={12} /> Uploaded!
                </p>
              )}
              {uploadStatus === 'error' && (
                <p className="text-xs text-red-500 font-medium mt-2 flex items-center justify-center gap-1">
                  <AlertCircle size={12} /> Upload failed.
                </p>
              )}
              {uploadStatus === 'uploading' && (
                <p className="text-xs text-teal-600 font-medium mt-2">Processing...</p>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
                e.target.value = '';
              }}
            />
          </div>

          {/* ─── Disconnect Actions ────────────────────────── */}
          {(storedMeta || isGsConnected) && (
            <div className="space-y-2">
              {isGsConnected && (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
                  <div>
                    <p className="text-sm text-green-800 font-medium">Google Sheets Linked</p>
                    <p className="text-[11px] text-green-600 truncate max-w-[280px]">
                      {savedGsUrl || 'Active'}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGoogleSheetDisconnect}
                    disabled={gsDisconnecting}
                    className="text-xs border-green-200 text-green-700 hover:bg-green-100 gap-1"
                  >
                    <Trash2 size={12} />
                    {gsDisconnecting ? 'Removing...' : 'Disconnect'}
                  </Button>
                </div>
              )}
              {storedMeta && !isGsConnected && (
                <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <div>
                    <p className="text-sm text-amber-800 font-medium">Browser Storage Active</p>
                    <p className="text-[11px] text-amber-600">
                      "{storedMeta.fileName}" in your browser
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearStored}
                    disabled={clearing}
                    className="text-xs border-amber-200 text-amber-700 hover:bg-amber-100 gap-1"
                  >
                    <Trash2 size={12} />
                    {clearing ? 'Clearing...' : 'Clear'}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* ─── Expected Sheet Tabs ───────────────────────── */}
          <div>
            <Label className="text-xs font-semibold text-slate-700 mb-2 block">
              Expected Sheet Tabs
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {EXPECTED_SHEETS.map(sheet => (
                <span
                  key={sheet}
                  className="px-2 py-0.5 bg-teal-50 text-teal-700 text-[10px] font-medium rounded-full border border-teal-100"
                >
                  {sheet}
                </span>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              Your sheet should have these tabs. Extra tabs are ignored.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOpen(false)}
            className="text-xs"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
