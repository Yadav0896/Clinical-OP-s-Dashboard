// Clinical Ops — Data Layer
// Types, constants, helpers, multi-sheet Excel parser, and fallback dummy data

// ─── ClinicalRecord Interface ───────────────────────────────
// (Kept unchanged — all dashboard components depend on this shape)
export interface ClinicalRecord {
  date: string;
  agent: string;
  clinic: string;
  shift: string;
  // Scheduling
  schedTotal: number;
  schedCancel: number;
  newPatients: number;
  followUp: number;
  adminBookings: number;
  botBookings: number;
  genderValidated: string;
  eAdded: number;
  duplicatesFound: number;
  hmoFlagged: number;
  // Insurance
  insuranceUpdated: number;
  cardsUploaded: number;
  insuranceNotes: number;
  insuranceDirect: number;
  manualVerifications: number;
  vobCsvUploaded: number;
  // Patient Intake
  prFormsCorrected: number;
  hhFormsCorrected: number;
  formsUploadedEcw: number;
  formsFailed: number;
  // Fax
  faxReceived: number;
  faxClassified: number;
  faxClassifFailed: number;
  faxForwarded: number;          // Step 2: Forwarded = "Yes"
  faxFwdFailed: number;
  faxRenamed: number;            // Step 4: eCW Renamed = "Yes"
  faxRenFailed: number;
  faxEcwForwarded: number;       // Step 3: eCW Forwarded = "Yes" or contains "Manually"
  faxPending: number;            // Rows where Status = "Pending"
  failedFaxIds: string;
  faxNotes: string;
  // VOB — separate Doc Upload vs Agent Calls
  vobTotal: number;              // Combined: VOB Doc + VOB Agent
  vobMatched: number;           // Combined matched
  vobUnmatched: number;         // Combined unmatched
  vobDocTotal: number;           // Only VOB Doc Upload rows
  vobDocMatched: number;        // Only VOB Doc Upload where uploaded=Yes
  vobAgentTotal: number;        // Only VOB Agent Calls rows
  vobAgentMatched: number;     // Only VOB Agent Calls where status=Complete
  vobCreated: number;
  vobUpdated: number;
  vobFailed: number;
  // Generic
  faxDocUploading: number;
}

// ─── Constants ─────────────────────────────────────────────
// Full list of known agents across all sheets
export const AGENTS = [
  'Mary Jenifar', 'Devadharshan', 'Sharomi', 'Goushic',
  'Padmavathi', 'Praveen', 'Usman', 'Vinith', 'Abhinav',
] as const;

export const INDIVIDUALS = AGENTS;

export const CLINICS = [
  'Denver Allergy', 'Dallas Allergy', 'Mid Island Allergy',
  'St. Paul Allergy', 'Chacko Allergy',
] as const;

export const MOD_NAMES = [
  'Patient Intake', 'Insurance', 'Scheduling', 'Fax', 'VOB',
] as const;

export const MOD_COLORS = ['#3B82F6', '#22C55E', '#A855F7', '#F59E0B', '#EF4444'] as const;

// Agent → primary clinic mapping
const AGENT_CLINIC: Record<string, string> = {
  'Mary Jenifar': 'Denver Allergy',
  'Devadharshan': 'Dallas Allergy',
  'Sharomi': 'Mid Island Allergy',
  'Goushic': 'St. Paul Allergy',
  'Padmavathi': 'Chacko Allergy',
  'Praveen': 'Denver Allergy',
  'Usman': 'Dallas Allergy',
  'Vinith': 'Mid Island Allergy',
  'Abhinav': 'St. Paul Allergy',
};

// ─── Helper Functions ──────────────────────────────────────

export function totalTasks(r: ClinicalRecord): number {
  return MOD_NAMES.reduce((sum, m) => sum + modTasks(r, m), 0);
}

export function modTasks(r: ClinicalRecord, mod: string): number {
  switch (mod) {
    case 'Patient Intake':
      // ONLY PR + HH forms corrected (exclude formsFailed, formsUploadedEcw)
      return r.prFormsCorrected + r.hhFormsCorrected;
    case 'Insurance':
      // Strictly pure row count of Insurance Validation tasks per user specification
      return r.insuranceUpdated;
    case 'Scheduling':
      // Pure row counts of Scheduling sheet + Duplicate Patients sheet per user specification
      return r.schedTotal + r.duplicatesFound;
    case 'Fax':
      // COUNT of fax rows (faxReceived)
      return Number(r.faxReceived || 0);
    case 'VOB':
      // VOB sub-total: VOB Doc Upload + VOB Agent Calls
      return Number(r.vobTotal || 0);
    default:
      return 0;
  }
}

// ─── Date / String Helpers ─────────────────────────────────

/** Convert an Excel serial date number to "YYYY-MM-DD" string. */
function excelSerialToDate(serial: number): string {
  // Excel epoch is 1900-01-01, but Lotus 1-2-3 bug treats 1900 as leap year
  const utcDays = Math.floor(serial - 25569);
  const ms = utcDays * 86400 * 1000;
  return new Date(ms).toISOString().split('T')[0];
}

/** Parse a date value that could be an Excel serial, a JS Date object, a "MM/DD/YYYY" string, etc. */
function parseDateValue(val: unknown): string {
  if (val === null || val === undefined || val === '') return '';

  // Excel serial number
  if (typeof val === 'number') {
    if (val > 25569 && val < 100000) {
      return excelSerialToDate(val);
    }
    return '';
  }

  // JS Date object
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return '';
    const yyyy = val.getFullYear();
    const mm = String(val.getMonth() + 1).padStart(2, '0');
    const dd = String(val.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  const str = String(val).trim();
  if (!str) return '';

  // Stringified Excel serial date number (e.g. "46156")
  if (/^\d+$/.test(str)) {
    const serial = parseInt(str, 10);
    if (serial > 25569 && serial < 100000) {
      return excelSerialToDate(serial);
    }
  }

  // Direct prefix extraction for timestamps like "2026-05-12 0:00:00"
  const prefixMatch = str.match(/^(\d{4}-\d{2}-\d{2})/);
  if (prefixMatch) return prefixMatch[1];

  // "MM/DD/YYYY"
  const mdy = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mdy) {
    const yyyy = parseInt(mdy[3], 10);
    const mm = parseInt(mdy[1], 10);
    const dd = parseInt(mdy[2], 10);
    if (mm >= 1 && mm <= 12 && dd >= 1 && dd <= 31) {
      return `${yyyy}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
    }
  }

  // ISO / any parseable date string using local calendar getters to avoid timezone shift
  try {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }
  } catch {
    // ignore
  }

  return '';
}

/** Month abbreviation → month number (1-based). Accepts full names too. */
function monthAbbrToNum(month: string): number | null {
  const m = String(month).trim().toLowerCase();
  // Take first 3 letters to handle both "Jan" and "January"
  const key = m.substring(0, 3);
  const map: Record<string, number> = {
    jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
    jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
  };
  return map[key] ?? null;
}

/** Try to resolve a date when only a month abbreviation is available. */
function monthToDate(month: string, contextYear?: number): string {
  const m = monthAbbrToNum(month);
  if (m === null) return '';
  const year = contextYear ?? new Date().getFullYear();
  return `${year}-${String(m).padStart(2, '0')}-01`;
}

/** Normalise clinic names. */
function normalizeClinic(raw: string): string {
  if (!raw) return '';
  const s = raw.trim();
  const norm: Record<string, string> = {
    'denver': 'Denver Allergy',
    'dallas': 'Dallas Allergy',
    'mid island': 'Mid Island Allergy',
    'midisland': 'Mid Island Allergy',
    'mid-island': 'Mid Island Allergy',
    'st paul': 'St. Paul Allergy',
    'st. paul': 'St. Paul Allergy',
    'st paul allergy': 'St. Paul Allergy',
    'chacko': 'Chacko Allergy',
  };
  const lower = s.toLowerCase();
  for (const [key, val] of Object.entries(norm)) {
    if (lower.includes(key)) return val;
  }
  return s;
}

// ─── Sheet Reader Helper ───────────────────────────────────

interface SheetRow {
  [key: string]: unknown;
}

/**
 * Read a sheet from a workbook, skipping the title row (row 0)
 * and using row 1 as the header row.
 */
function readSheetRows(workbook: { Sheets: Record<string, unknown> }, sheetName: string): SheetRow[] {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const XLSX = require('xlsx');
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return [];
  const raw = XLSX.utils.sheet_to_json(sheet, { defval: '', header: 1 }) as unknown[][];
  if (raw.length < 3) return []; // need at least title + header + 1 data row
  const headers = (raw[1] || []) as string[];
  const rows: SheetRow[] = [];
  for (let i = 2; i < raw.length; i++) {
    const obj: SheetRow = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = raw[i][j] ?? '';
    }
    rows.push(obj);
  }
  return rows;
}

// ─── Blank Record Factory ──────────────────────────────────

function blankRecord(agent: string, date: string, clinic: string): ClinicalRecord {
  return {
    date,
    agent,
    clinic,
    shift: 'Day',
    genderValidated: '',
    schedTotal: 0,
    schedCancel: 0,
    newPatients: 0,
    followUp: 0,
    adminBookings: 0,
    botBookings: 0,
    eAdded: 0,
    duplicatesFound: 0,
    hmoFlagged: 0,
    insuranceUpdated: 0,
    cardsUploaded: 0,
    insuranceNotes: 0,
    insuranceDirect: 0,
    manualVerifications: 0,
    vobCsvUploaded: 0,
    prFormsCorrected: 0,
    hhFormsCorrected: 0,
    formsUploadedEcw: 0,
    formsFailed: 0,
    faxReceived: 0,
    faxClassified: 0,
    faxClassifFailed: 0,
    faxForwarded: 0,
    faxFwdFailed: 0,
    faxRenamed: 0,
    faxRenFailed: 0,
    faxEcwForwarded: 0,
    faxPending: 0,
    failedFaxIds: '',
    faxNotes: '',
    vobTotal: 0,
    vobMatched: 0,
    vobUnmatched: 0,
    vobDocTotal: 0,
    vobDocMatched: 0,
    vobAgentTotal: 0,
    vobAgentMatched: 0,
    vobCreated: 0,
    vobUpdated: 0,
    vobFailed: 0,
    faxDocUploading: 0,
  };
}

// ─── Multi-Sheet Excel Parser ──────────────────────────────

export function parseMultiSheetExcel(workbook: any, XLSXLib?: any): ClinicalRecord[] {
  const allRecords: ClinicalRecord[] = [];
  const sheetNames = Object.keys(workbook.Sheets || {});
  console.log('[Parser] Sheets found:', sheetNames);

  for (const sheetName of sheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet || !sheet['!ref']) continue;

    // Each sheet has: row 0 = title, row 1 = headers, row 2+ = data
    // We must skip the title row and use row 1 as headers
    let rows: Record<string, unknown>[];
    if (XLSXLib) {
      // Use header:1 to get raw arrays, then manually build objects using row[1] as headers
      const raw: unknown[][] = XLSXLib.utils.sheet_to_json(sheet, { header: 1, defval: '' });
      rows = buildRowsFromRaw(raw);
    } else {
      rows = sheetToJsonSkipTitle(sheet);
    }

    console.log(`[Parser] Sheet "${sheetName}": ${rows.length} rows, sample headers:`, rows.length > 0 ? Object.keys(rows[0]).slice(0, 6) : []);
    const parsed = parseExcelData(rows, sheetName);
    console.log(`[Parser] Sheet "${sheetName}": parsed ${parsed.length} records`);
    allRecords.push(...parsed);
  }

  console.log('[Parser] Total records:', allRecords.length);
  return allRecords;
}

/**
 * Build row objects from a raw 2D array.
 * row[0] = title (skip), row[1] = headers, row[2+] = data
 */
function buildRowsFromRaw(raw: unknown[][]): Record<string, unknown>[] {
  if (raw.length < 3) return [];
  const headers = (raw[1] as unknown[]).map(h => String(h ?? '').trim());
  const result: Record<string, unknown>[] = [];
  for (let i = 2; i < raw.length; i++) {
    const row = raw[i] as unknown[];
    const obj: Record<string, unknown> = {};
    headers.forEach((h, idx) => {
      if (h) obj[h] = row[idx] ?? '';
    });
    result.push(obj);
  }
  return result;
}

/** Fallback manual sheet-to-json that skips title row */
function sheetToJsonSkipTitle(sheet: any): Record<string, unknown>[] {
  const result: Record<string, unknown>[] = [];
  if (!sheet || !sheet['!ref']) return result;

  const range = decodeRange(sheet['!ref']);
  if (range.e.r - range.s.r < 2) return result; // need title + header + at least 1 data row

  const headerRow = range.s.r + 1; // row index 1 (0-based) = actual header
  const headers: string[] = [];

  for (let c = range.s.c; c <= range.e.c; c++) {
    const addr = encodeCell({ r: headerRow, c });
    const cell = sheet[addr];
    headers[c - range.s.c] = cell ? String(cell.v ?? '').trim() : '';
  }

  for (let r = headerRow + 1; r <= range.e.r; r++) {
    const row: Record<string, unknown> = {};
    for (let c = range.s.c; c <= range.e.c; c++) {
      const addr = encodeCell({ r, c });
      const cell = sheet[addr];
      const header = headers[c - range.s.c];
      if (header) row[header] = cell ? (cell.v ?? '') : '';
    }
    result.push(row);
  }
  return result;
}

function decodeRange(ref: string) {
  const parts = ref.split(':');
  return { s: decodeCell(parts[0]), e: decodeCell(parts[1] || parts[0]) };
}

function decodeCell(addr: string) {
  const m = addr.match(/([A-Z]+)(\d+)/);
  if (!m) return { r: 0, c: 0 };
  const col = m[1].split('').reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0) - 1;
  return { r: parseInt(m[2], 10) - 1, c: col };
}

function encodeCell({ r, c }: { r: number; c: number }): string {
  let col = '';
  let n = c + 1;
  while (n > 0) { col = String.fromCharCode(((n - 1) % 26) + 65) + col; n = Math.floor((n - 1) / 26); }
  return col + (r + 1);
}

// ─── Legacy Excel Parser (kept for backwards compat) ────────
// Maps from column-map–based flat sheets. Still exportable so
// the upload handler can fall back if needed.

function normalizeHeader(header: string): string {
  return header.toString().toLowerCase().trim().replace(/[_\-]+/g, ' ').replace(/\s+/g, ' ');
}

const CMAP: Record<string, string> = {
  // ── Identity columns (used as grouping keys) ──────────────
  'date': 'date',
  'date of call': 'date',         // VOB Agent Calls sheet
  'agent': 'agent',
  'person name': 'agent',         // All sheets use "Person Name"
  'individual name': 'agent',
  'name': 'agent',
  'clinic': 'clinic',
  'client': 'clinic',             // All sheets use "Client"
  'shift': 'shift',

  // ── Scheduling ────────────────────────────────────────────
  'scheduling total': 'schedTotal',
  'scheduling cancelled': 'schedCancel',
  'scheduling cancel': 'schedCancel',
  'cancelled': 'schedCancel',
  'new patients': 'newPatients',
  'new patient': 'newPatients',
  'follow-up': 'followUp',
  'follow up': 'followUp',
  'followup': 'followUp',
  'admin bookings': 'adminBookings',
  'admin booking': 'adminBookings',
  'bot bookings': 'botBookings',
  'bot booking': 'botBookings',
  'chatbot bookings': 'botBookings',
  'gender validated': 'genderValidated',
  'gender validated %': 'genderValidated',

  // ── Duplicates ────────────────────────────────────────────
  'duplicates found': 'duplicatesFound',
  'duplicates': 'duplicatesFound',

  // ── Insurance ─────────────────────────────────────────────
  'hmo flagged': 'hmoFlagged',
  'hmo/epo flagged': 'hmoFlagged',
  'insurance updated': 'insuranceUpdated',
  'appts insurance updated': 'insuranceUpdated',
  'insurance details update': 'insuranceUpdated',
  'cards uploaded': 'cardsUploaded',
  'insurance cards uploaded': 'cardsUploaded',
  'cards uploaded in ecw': 'cardsUploaded',
  'insurance notes': 'insuranceNotes',
  'general notes (no card)': 'insuranceNotes',
  'insurance direct': 'insuranceDirect',
  'direct in info section': 'insuranceDirect',
  'manual verifications': 'manualVerifications',
  'manual verification': 'manualVerifications',
  'verified manually': 'manualVerifications',  // Insurance Validation sheet
  'vob csv uploaded': 'vobCsvUploaded',

  // ── Patient Intake ────────────────────────────────────────
  'pr forms corrected': 'prFormsCorrected',
  'pr corrected': 'prFormsCorrected',
  'hh forms corrected': 'hhFormsCorrected',
  'hh corrected': 'hhFormsCorrected',
  'forms uploaded in ecw': 'formsUploadedEcw',
  'forms uploaded': 'formsUploadedEcw',
  'forms failed': 'formsFailed',

  // ── Fax ───────────────────────────────────────────────────
  'fax received': 'faxReceived',
  'fax classified': 'faxClassified',
  'classified': 'faxClassified',              // Fax Classification sheet
  'fax classif failed': 'faxClassifFailed',
  'fax forwarded': 'faxForwarded',
  'forwarded': 'faxForwarded',                // Fax Classification sheet
  'ecw forwarded': 'faxForwarded',            // Fax Classification sheet
  'fax fwd failed': 'faxFwdFailed',
  'fax renamed': 'faxRenamed',
  'ecw renamed': 'faxRenamed',                // Fax Classification sheet
  'fax ren failed': 'faxRenFailed',
  'fax doc uploading': 'faxDocUploading',
  'fax doc upload': 'faxDocUploading',
  'doc upload': 'faxDocUploading',
  'failed fax ids': 'failedFaxIds',
  'fax notes': 'faxNotes',
  'additional notes / issues': 'faxNotes',

  // ── VOB ───────────────────────────────────────────────────
  'vob total': 'vobTotal',
  'vob processed': 'vobTotal',
  'total processed': 'vobTotal',
  'vob matched': 'vobMatched',
  'successful matches': 'vobMatched',
  'calling status': 'vobMatched',             // VOB Agent Calls: 'Complete' = matched
  'vob doc on ecw?': 'vobTotal',              // VOB Doc Upload sheet — each row = 1 VOB
  'vob unmatched': 'vobUnmatched',
  'vob created': 'vobCreated',
  'vob updated': 'vobUpdated',
  'vob failed': 'vobFailed',
};

function parseNumber(val: unknown): number {
  if (val === null || val === undefined || val === '') return 0;
  const n = Number(val);
  return isNaN(n) ? 0 : n;
}

function parseString(val: unknown): string {
  if (val === null || val === undefined) return '';
  return String(val).trim();
}

export function parseExcelData(rows: Record<string, unknown>[], sheetNameInput?: string): ClinicalRecord[] {
  if (!rows || rows.length === 0) return [];

  const sName = (sheetNameInput || '').toLowerCase().trim();

   // ── Detect which sheet type this is based on sheet name (primary) or columns (fallback) ───────────
   const allKeys = Object.keys(rows[0]).map(k => k.toLowerCase().trim());
   const hasCol = (name: string) => allKeys.includes(name.toLowerCase().trim());

   // INITIALIZE ALL TO FALSE FIRST
   let isScheduling = false;
   let isPatientReg = false;
   let isHealthHistory = false;
   let isDuplicate = false;
   let isInsurance = false;
   let isVobDoc = false;
   let isVobAgent = false;
   let isFaxClass = false;
   let isFaxReferral = false;

   // PRIORITY 1: Explicit sheet name matches (mutually exclusive)
   if (sName.includes('scheduling')) {
     isScheduling = true;
   } else if (sName.includes('patient registration')) {
     isPatientReg = true;
   } else if (sName.includes('health history')) {
     isHealthHistory = true;
   } else if (sName.includes('duplicate')) {
     isDuplicate = true;
   } else if (sName.includes('insurance')) {
     isInsurance = true;
   } else if (sName.includes('vob doc')) {
     isVobDoc = true;
   } else if (sName.includes('vob agent')) {
     isVobAgent = true;
   } else if (sName.includes('fax classification')) {
     isFaxClass = true;
   } else if (sName.includes('fax referral')) {
     isFaxReferral = true;
   }
   // PRIORITY 2: Column-based detection (only if no explicit sheet name matched)
     else {
     // Use mutually exclusive if-else chain matching original precedence
     if (hasCol('visit type') && !hasCol('eligibility status')) {
       isScheduling = true;
     } else if (hasCol('field checked') && !hasCol('visit type')) {
       isHealthHistory = true;
     } else if (hasCol('field checked')) {
       isPatientReg = true;
     } else if (hasCol('duplicate patient name') || hasCol('merged')) {
       isDuplicate = true;
     } else if (hasCol('eligibility status') || hasCol('verified manually')) {
       isInsurance = true;
     } else if (hasCol('vob doc on ecw?') || hasCol('vob date')) {
       isVobDoc = true;
     } else if (hasCol('calling status') || hasCol('date of call')) {
       isVobAgent = true;
     } else if (hasCol('classified') || hasCol('fax last 6 digits')) {
       isFaxClass = true;
     } else if (hasCol('fax receipt date') || hasCol('fax / document')) {
       isFaxReferral = true;
     }
     // else none set → falls through to generic fax doc upload
   }

    // Debug logging
    console.log('[Parser] Sheet:', sheetNameInput, '| Type:', {
      isScheduling, isPatientReg, isHealthHistory, isDuplicate,
      isInsurance, isVobDoc, isVobAgent, isFaxClass, isFaxReferral
    });
    console.log('[Parser] Columns (first 10):', allKeys.slice(0, 10));

  // ── Aggregation map: key = "PersonName::date::clinic" ────────────────────
  const agg = new Map<string, ClinicalRecord>();

  const getStr = (row: Record<string, unknown>, ...keys: string[]): string => {
    for (const k of keys) {
      const found = Object.keys(row).find(rk => rk.toLowerCase().trim() === k.toLowerCase());
      if (found) {
        const v = String(row[found] ?? '').trim();
        if (v) return v;
      }
    }
    return '';
  };

   for (const row of rows) {
     if (!row) continue;

     // Get person name
     const person = getStr(row, 'Person Name', 'Individual Name', 'Agent', 'Name');
     if (!person) {
       console.log('[Parser] Skipping row - no person name. Row keys:', Object.keys(row).slice(0, 5));
       continue;
     }

     // Get date
     let rawDate = isVobAgent
       ? getStr(row, 'Date of Call', 'Date')
       : getStr(row, 'Date');

     let date = parseDateValue(rawDate);
     if (!date) {
       const month = getStr(row, 'Month');
       if (month) date = monthToDate(month);
     }
     if (!date) {
       console.log('[Parser] Skipping row - no date. Person:', person, 'RawDate:', rawDate);
       continue;
     }

     // Get clinic
     const rawClinic = getStr(row, 'Client', 'Clinic');
     const clinic = normalizeClinic(rawClinic) || AGENT_CLINIC[person] || 'Denver Allergy';

     // Upsert aggregated record
     const k = `${person}::${date}::${clinic}`;
     if (!agg.has(k)) {
       agg.set(k, blankRecord(person, date, clinic));
     }
     const rec = agg.get(k)!;

     // ── STEP 1: Base row count based on sheet type ───────────────────────────────
     if (isScheduling) {
       rec.schedTotal += 1;
       const status = getStr(row, 'Status', 'ecw status').toLowerCase();
       if (status === 'cancelled' || status === 'cancel') rec.schedCancel += 1;
     } else if (isPatientReg || isHealthHistory) {
       if (isPatientReg) rec.prFormsCorrected += 1;
       else rec.hhFormsCorrected += 1;
     } else if (isDuplicate) {
       rec.duplicatesFound += 1;
     } else if (isInsurance) {
       rec.insuranceUpdated += 1;
       const manual = getStr(row, 'Verified Manually').toUpperCase();
       if (manual === 'YES') rec.manualVerifications += 1;
     } else if (isVobDoc) {
       rec.vobTotal += 1;
       rec.vobDocTotal += 1;
       const uploaded = getStr(row, 'VOB DOC on ECW?', 'VOB Doc on ECW?').toLowerCase();
       if (uploaded === 'yes') {
         rec.vobMatched += 1;
         rec.vobDocMatched += 1;
       } else {
         rec.vobUnmatched += 1;
       }
     } else if (isVobAgent) {
       rec.vobTotal += 1;
       rec.vobAgentTotal += 1;
       const status = getStr(row, 'Calling Status').toLowerCase();
       if (status === 'complete') {
         rec.vobMatched += 1;
         rec.vobAgentMatched += 1;
       } else {
         rec.vobUnmatched += 1;
       }
     } else if (isFaxClass) {
       rec.faxReceived += 1;
       // Step 1: Classified
       const classified = getStr(row, 'Classified').toLowerCase();
       if (classified === 'yes') rec.faxClassified += 1;
       else rec.faxClassifFailed += 1;
       // Step 2: Forwarded (column "Forwarded" = Yes)
       const forwarded = getStr(row, 'Forwarded').toLowerCase();
       if (forwarded === 'yes') rec.faxForwarded += 1;
       else if (forwarded !== '') rec.faxFwdFailed += 1;
       // Step 3: eCW Forwarded (Yes OR contains "manually")
       const ecwFwd = getStr(row, 'eCW Forwarded').toLowerCase();
       if (ecwFwd === 'yes' || ecwFwd.includes('manually')) {
         rec.faxEcwForwarded += 1;
       }
       // Step 4: eCW Renamed (Yes OR contains "manually")
       const ecwRen = getStr(row, 'eCW Renamed').toLowerCase();
       if (ecwRen === 'yes' || ecwRen.includes('manually')) {
         rec.faxRenamed += 1;
       } else if (ecwRen !== '') {
         rec.faxRenFailed += 1;
       }
       // Pending status
       const status = getStr(row, 'Status').toLowerCase();
       if (status === 'pending') rec.faxPending += 1;
     } else if (isFaxReferral) {
       rec.faxReceived += 1;
       rec.formsUploadedEcw += 1;
     } else {
       rec.faxDocUploading += 1;
     }

      // ── STEP 2: Additional explicit numeric columns (if any) ─────────────────────
      for (const [rowKey, rowVal] of Object.entries(row)) {
        const normalized = normalizeHeader(rowKey);
        const mappedField = CMAP[normalized] as keyof ClinicalRecord | undefined;
        if (mappedField && mappedField !== 'date' && mappedField !== 'agent' && mappedField !== 'clinic' && mappedField !== 'shift') {
          const num = parseNumber(rowVal);
          if (num > 0) {
            (rec[mappedField] as number) += num;
          }
        }
      }
    }

    const result = Array.from(agg.values());
    console.log('[Parser] Aggregated records:', result.length);
    if (result.length > 0) {
      const sample = result[0];
      console.log('[Parser] Sample record keys:', Object.keys(sample).filter(k => sample[k as keyof ClinicalRecord] !== 0 && sample[k as keyof ClinicalRecord] !== '' && sample[k as keyof ClinicalRecord] !== undefined).slice(0, 10));
    }

    return result;
  }


// ─── Dummy Data Generator (fallback only) ──────────────────

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateSingleRecord(agent: string, date: string): ClinicalRecord {
  const primaryClinic = AGENT_CLINIC[agent] || 'Denver Allergy';
  const clinic = Math.random() < 0.8
    ? primaryClinic
    : CLINICS[Math.floor(Math.random() * CLINICS.length)];

  const faxReceived = rand(15, 60);
  const faxClassified = rand(Math.floor(faxReceived * 0.7), faxReceived);
  const faxClassifFailed = faxReceived - faxClassified;
  const faxForwarded = rand(Math.floor(faxClassified * 0.5), faxClassified);
  const faxFwdFailed = rand(0, 3);
  const faxRenamed = rand(Math.floor(faxForwarded * 0.6), faxForwarded);
  const faxRenFailed = rand(0, 2);
  // eCW Forwarded (subset of forwarded)
  const faxEcwForwarded = rand(Math.floor(faxForwarded * 0.3), faxForwarded);
  // Pending fax status
  const faxPending = rand(0, Math.floor(faxReceived * 0.3));

  const vobTotal = rand(20, 80);
  const vobDocTotal = Math.floor(vobTotal * 0.8); // 80% doc uploads
  const vobAgentTotal = vobTotal - vobDocTotal;
  const vobDocMatched = rand(Math.floor(vobDocTotal * 0.4), Math.floor(vobDocTotal * 0.8));
  const vobAgentMatched = rand(Math.floor(vobAgentTotal * 0.4), Math.floor(vobAgentTotal * 0.8));
  const vobMatched = vobDocMatched + vobAgentMatched;
  const vobUnmatched = vobTotal - vobMatched;
  const vobCreated = rand(Math.floor(vobUnmatched * 0.3), vobUnmatched);
  const vobUpdated = rand(Math.floor(vobMatched * 0.1), Math.floor(vobMatched * 0.4));
  const vobFailed = rand(0, 3);
  const faxDocUploading = rand(0, 10);

  return {
    date,
    agent,
    clinic,
    shift: Math.random() > 0.3 ? 'Day' : 'Night',
    genderValidated: `${rand(92, 100)}%`,
    eAdded: 0,
    schedTotal: rand(5, 25),
    schedCancel: rand(0, 5),
    newPatients: rand(2, 12),
    followUp: rand(3, 15),
    adminBookings: rand(1, 8),
    botBookings: rand(2, 15),
    duplicatesFound: rand(0, 4),
    hmoFlagged: rand(0, 3),
    insuranceUpdated: rand(5, 20),
    cardsUploaded: rand(3, 12),
    insuranceNotes: rand(0, 5),
    insuranceDirect: rand(1, 6),
    manualVerifications: rand(1, 8),
    vobCsvUploaded: rand(0, 3),
    prFormsCorrected: rand(3, 15),
    hhFormsCorrected: rand(2, 10),
    formsUploadedEcw: rand(2, 12),
    formsFailed: rand(0, 3),
    faxReceived,
    faxClassified,
    faxClassifFailed,
    faxForwarded,
    faxFwdFailed,
    faxRenamed,
    faxRenFailed,
    faxEcwForwarded,
    faxPending,
    failedFaxIds: faxClassifFailed > 0 ? `FAX-${rand(1000, 9999)}, FAX-${rand(1000, 9999)}` : '',
    faxNotes: '',
    vobTotal,
    vobMatched,
    vobUnmatched,
    vobDocTotal,
    vobDocMatched,
    vobAgentTotal,
    vobAgentMatched,
    vobCreated,
    vobUpdated,
    vobFailed,
    faxDocUploading,
  };
}

export function generateDummyData(): ClinicalRecord[] {
  const records: ClinicalRecord[] = [];
  const dates: string[] = [];

  // Generate weekdays from 2026-01-21 to 2026-04-30
  const start = new Date('2026-01-21');
  const end = new Date('2026-04-30');
  const current = new Date(start);

  while (current <= end) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) {
      dates.push(current.toISOString().split('T')[0]);
    }
    current.setDate(current.getDate() + 1);
  }

  for (const date of dates) {
    // Not every agent works every day (~80% chance)
    for (const agent of AGENTS) {
      if (Math.random() < 0.85) {
        records.push(generateSingleRecord(agent, date));
      }
    }
  }

  return records;
}

// ─── Filter State ──────────────────────────────────────────
export interface FilterState {
  clinic: string;
  agent: string;
  dateFrom: string;
  dateTo: string;
}

export function applyFilters(data: ClinicalRecord[], filters: FilterState): ClinicalRecord[] {
  return data.filter(r => {
    if (filters.clinic !== 'all' && r.clinic !== filters.clinic) return false;
    if (filters.agent !== 'all' && r.agent !== filters.agent) return false;
    if (filters.dateFrom && r.date < filters.dateFrom) return false;
    if (filters.dateTo && r.date > filters.dateTo) return false;
    return true;
  });
}

// ─── Agent Summary Helper ──────────────────────────────────
export interface AgentSummary {
  agent: string;
  total: number;          // Sum of all numeric tasks (raw total)
  pi: number;            // Patient Intake tasks
  ins: number;           // Insurance tasks
  sch: number;           // Scheduling tasks
  fax: number;           // Fax tasks
  vob: number;           // VOB tasks
  score: number;         // Weighted performance score
  days: Set<string>;
  clinics: Set<string>;
}

export function getAgentSummaries(data: ClinicalRecord[]): AgentSummary[] {
  const map = new Map<string, AgentSummary>();

  for (const r of data) {
    const agent = r.agent || 'Unknown';
    if (!map.has(agent)) {
      map.set(agent, {
        agent, total: 0, pi: 0, ins: 0, sch: 0, fax: 0, vob: 0, score: 0,
        days: new Set(), clinics: new Set(),
      });
    }
    const d = map.get(agent)!;
    d.total += totalTasks(r);
    d.pi += modTasks(r, 'Patient Intake');
    d.ins += modTasks(r, 'Insurance');
    d.sch += modTasks(r, 'Scheduling');
    d.fax += modTasks(r, 'Fax');
    d.vob += modTasks(r, 'VOB');
    if (r.date) d.days.add(r.date);
    if (r.clinic) d.clinics.add(r.clinic);
  }

  // Compute weighted performance score for each agent
  const result = Array.from(map.values()).map(a => ({
    ...a,
    score: (a.pi * 5) + (a.ins * 3) + (a.fax * 3) + (a.vob * 2) + (a.sch * 1),
  }));

  // Sort by weighted score descending (top performer first)
  return result.sort((a, b) => b.score - a.score);
}
