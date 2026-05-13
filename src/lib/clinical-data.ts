// Clinical Ops — Data Layer
// Types, constants, helpers, multi-sheet Excel parser, and fallback dummy data

// ─── ClinicalRecord Interface ───────────────────────────────
// (Kept unchanged — all dashboard components depend on this shape)
export interface ClinicalRecord {
  date: string;
  agent: string;
  clinic: string;
  shift: string;
  genderValidated: string;
  schedTotal: number;
  schedCancel: number;
  newPatients: number;
  followUp: number;
  adminBookings: number;
  botBookings: number;
  duplicatesFound: number;
  hmoFlagged: number;
  insuranceUpdated: number;
  cardsUploaded: number;
  insuranceNotes: number;
  insuranceDirect: number;
  manualVerifications: number;
  vobCsvUploaded: number;
  prFormsCorrected: number;
  hhFormsCorrected: number;
  formsUploadedEcw: number;
  formsFailed: number;
  faxReceived: number;
  faxClassified: number;
  faxClassifFailed: number;
  faxForwarded: number;
  faxFwdFailed: number;
  faxRenamed: number;
  faxRenFailed: number;
  faxDocUploading: number;
  failedFaxIds: string;
  faxNotes: string;
  vobTotal: number;
  vobMatched: number;
  vobUnmatched: number;
  vobCreated: number;
  vobUpdated: number;
  vobFailed: number;
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

const NUMERIC_FIELDS: (keyof ClinicalRecord)[] = [
  'schedTotal', 'schedCancel', 'newPatients', 'followUp',
  'adminBookings', 'botBookings', 'duplicatesFound', 'hmoFlagged',
  'insuranceUpdated', 'cardsUploaded', 'insuranceNotes', 'insuranceDirect',
  'manualVerifications', 'vobCsvUploaded',
  'prFormsCorrected', 'hhFormsCorrected', 'formsUploadedEcw', 'formsFailed',
  'faxReceived', 'faxClassified', 'faxClassifFailed',
  'faxForwarded', 'faxFwdFailed', 'faxRenamed', 'faxRenFailed', 'faxDocUploading',
  'vobTotal', 'vobMatched', 'vobUnmatched', 'vobCreated', 'vobUpdated', 'vobFailed',
];

export function totalTasks(r: ClinicalRecord): number {
  return NUMERIC_FIELDS.reduce((sum, field) => sum + Number(r[field] || 0), 0);
}

export function modTasks(r: ClinicalRecord, mod: string): number {
  switch (mod) {
    case 'Patient Intake':
      return r.prFormsCorrected + r.hhFormsCorrected + r.formsUploadedEcw + r.formsFailed;
    case 'Insurance':
      return r.insuranceUpdated + r.cardsUploaded + r.insuranceNotes +
        r.insuranceDirect + r.manualVerifications + r.vobCsvUploaded;
    case 'Scheduling':
      return r.schedTotal + r.newPatients + r.followUp +
        r.adminBookings + r.botBookings + r.duplicatesFound + r.hmoFlagged;
    case 'Fax':
      return Number(r.faxReceived || 0) + Number(r.faxClassified || 0) + Number(r.faxForwarded || 0) + Number(r.faxRenamed || 0) + Number(r.faxDocUploading || 0);
    case 'VOB':
      return Number(r.vobTotal || 0) + Number(r.vobMatched || 0) + Number(r.vobCreated || 0) + Number(r.vobUpdated || 0);
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
    return val.toISOString().split('T')[0];
  }

  const str = String(val).trim();
  if (!str) return '';

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

  // "YYYY-MM-DD"
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;

  // ISO / any parseable date string
  try {
    const d = new Date(str);
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
  } catch {
    // ignore
  }

  return '';
}

/** Month abbreviation → month number (1-based). */
function monthAbbrToNum(month: string): number | null {
  const map: Record<string, number> = {
    jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
    jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
  };
  const n = map[String(month).trim().toLowerCase()];
  return n != null ? n : null;
}

/** Try to resolve a date when only a month abbreviation is available. */
function monthToDate(month: string, year = 2026): string {
  const m = monthAbbrToNum(month);
  if (m === null) return '';
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
    faxDocUploading: 0,
    failedFaxIds: '',
    faxNotes: '',
    vobTotal: 0,
    vobMatched: 0,
    vobUnmatched: 0,
    vobCreated: 0,
    vobUpdated: 0,
    vobFailed: 0,
  };
}

// ─── Multi-Sheet Excel Parser ──────────────────────────────

/**
 * Parse the multi-sheet Clinical Ops Excel workbook dynamically.
 * Instead of hardcoded sheet names, it looks for keywords in tab names.
 */
export function parseMultiSheetExcel(workbook: any): ClinicalRecord[] {
  const agg = new Map<string, ClinicalRecord>();
  const sheetNames = Object.keys(workbook.Sheets);

  function key(agent: string, date: string, clinic: string): string {
    return `${agent}::${date}::${clinic}`;
  }

  function upsert(agent: string, date: string, clinic: string): ClinicalRecord {
    const k = key(agent, date, clinic);
    let rec = agg.get(k);
    if (!rec) {
      rec = blankRecord(agent, date, clinic);
      agg.set(k, rec);
    }
    return rec;
  }

  function resolveDate(row: SheetRow, dateCol = 'Date'): string {
    const raw = row[dateCol];
    let d = parseDateValue(raw);
    if (!d) {
      const month = String(row['Month'] || '').trim();
      if (month) d = monthToDate(month);
    }
    return d;
  }

  function getStr(row: SheetRow, col: string): string {
    return String(row[col] ?? '').trim();
  }

  // Define keyword mappings for modules
  const KEYWORDS = {
    scheduling: ['schedule', 'scheduling'],
    intake: ['patient registration', 'health history', 'forms', 'intake'],
    insurance: ['insurance', 'validation', 'eligibility'],
    fax: ['fax', 'referral', 'classification', 'upload', 'faxes'],
    vob: ['vob', 'benefit'],
    duplicate: ['duplicate'],
  };

  for (const sheetName of sheetNames) {
    const nameLower = sheetName.toLowerCase();
    const rows = readSheetRows(workbook, sheetName);
    if (rows.length === 0) continue;

    for (const row of rows) {
      // Find the person name - check multiple possible header names
      const person = getStr(row, 'Person Name') || getStr(row, 'Individual Name') || getStr(row, 'Agent') || getStr(row, 'Name');
      if (!person) continue;

      const date = resolveDate(row, nameLower.includes('vob agent') ? 'Date of Call' : 'Date');
      if (!date) continue;

      const clinic = normalizeClinic(getStr(row, 'Client')) || AGENT_CLINIC[person] || 'Denver Allergy';
      const rec = upsert(person, date, clinic);

      // ─── Map sheet to module based on keywords ───────────
      
      // Scheduling
      if (KEYWORDS.scheduling.some(k => nameLower.includes(k))) {
        rec.schedTotal = (Number(rec.schedTotal) || 0) + 1;
      }
      
      // Patient Intake
      if (KEYWORDS.intake.some(k => nameLower.includes(k))) {
        if (nameLower.includes('registration')) rec.prFormsCorrected = (Number(rec.prFormsCorrected) || 0) + 1;
        else if (nameLower.includes('history')) rec.hhFormsCorrected = (Number(rec.hhFormsCorrected) || 0) + 1;
        else rec.formsUploadedEcw = (Number(rec.formsUploadedEcw) || 0) + 1;
      }

      // Insurance
      if (KEYWORDS.insurance.some(k => nameLower.includes(k))) {
        rec.insuranceUpdated = (Number(rec.insuranceUpdated) || 0) + 1;
        const verifiedManually = getStr(row, 'Verified Manually').toUpperCase();
        if (verifiedManually === 'YES') {
          rec.manualVerifications = (Number(rec.manualVerifications) || 0) + 1;
        }
      }

      // Fax
      if (KEYWORDS.fax.some(k => nameLower.includes(k))) {
        rec.faxReceived = (Number(rec.faxReceived) || 0) + 1;
        
        // If it's a classification sheet, check specific columns
        if (nameLower.includes('classif')) {
          const classified = getStr(row, 'Classified').toLowerCase();
          if (classified === 'yes') rec.faxClassified = (Number(rec.faxClassified) || 0) + 1;
          else rec.faxClassifFailed = (Number(rec.faxClassifFailed) || 0) + 1;

          const forwarded = getStr(row, 'Forwarded').toLowerCase();
          const ecwForwarded = getStr(row, 'eCW Forwarded');
          if (forwarded === 'yes' || (ecwForwarded !== '' && ecwForwarded.toLowerCase() !== 'no' && ecwForwarded.toLowerCase() !== 'other')) {
            rec.faxForwarded = (Number(rec.faxForwarded) || 0) + 1;
          } else {
            rec.faxFwdFailed = (Number(rec.faxFwdFailed) || 0) + 1;
          }
        }
        
        // If it's a referral sheet, it also counts as a form upload
        if (nameLower.includes('referral')) {
          rec.formsUploadedEcw = (Number(rec.formsUploadedEcw) || 0) + 1;
        }

        // Generic upload sheet (like your new "Fax Upload")
        if (nameLower.includes('upload')) {
          rec.faxDocUploading = (Number(rec.faxDocUploading) || 0) + 1;
        }
      }

      // VOB
      if (KEYWORDS.vob.some(k => nameLower.includes(k))) {
        if (nameLower.includes('upload') || nameLower.includes('doc')) {
          rec.vobTotal = (Number(rec.vobTotal) || 0) + 1;
        } else {
          const status = getStr(row, 'Calling Status').toLowerCase();
          if (status === 'complete') rec.vobMatched = (Number(rec.vobMatched) || 0) + 1;
          else rec.vobUnmatched = (Number(rec.vobUnmatched) || 0) + 1;
        }
      }

      // Duplicates
      if (KEYWORDS.duplicate.some(k => nameLower.includes(k))) {
        rec.duplicatesFound = (Number(rec.duplicatesFound) || 0) + 1;
      }
    }
  }

  return Array.from(agg.values());
}

// ─── Legacy Excel Parser (kept for backwards compat) ────────
// Maps from column-map–based flat sheets. Still exportable so
// the upload handler can fall back if needed.

function normalizeHeader(header: string): string {
  return header.toString().toLowerCase().trim().replace(/[_\-]+/g, ' ').replace(/\s+/g, ' ');
}

const CMAP: Record<string, string> = {
  'date': 'date',
  'agent': 'agent',
  'clinic': 'clinic',
  'shift': 'shift',
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
  'duplicates found': 'duplicatesFound',
  'duplicates': 'duplicatesFound',
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
  'vob csv uploaded': 'vobCsvUploaded',
  'pr forms corrected': 'prFormsCorrected',
  'pr corrected': 'prFormsCorrected',
  'hh forms corrected': 'hhFormsCorrected',
  'hh corrected': 'hhFormsCorrected',
  'forms uploaded in ecw': 'formsUploadedEcw',
  'forms uploaded': 'formsUploadedEcw',
  'forms failed': 'formsFailed',
  'fax received': 'faxReceived',
  'fax classified': 'faxClassified',
  'fax classif failed': 'faxClassifFailed',
  'fax forwarded': 'faxForwarded',
  'fax fwd failed': 'faxFwdFailed',
  'fax renamed': 'faxRenamed',
  'fax ren failed': 'faxRenFailed',
  'failed fax ids': 'failedFaxIds',
  'fax notes': 'faxNotes',
  'additional notes / issues': 'faxNotes',
  'vob total': 'vobTotal',
  'vob processed': 'vobTotal',
  'total processed': 'vobTotal',
  'vob matched': 'vobMatched',
  'successful matches': 'vobMatched',
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

export function parseExcelData(rows: Record<string, unknown>[]): ClinicalRecord[] {
  if (!rows || rows.length === 0) return [];

  const STRING_FIELDS = new Set<string>(['date', 'agent', 'clinic', 'shift', 'genderValidated', 'failedFaxIds', 'faxNotes']);

  // Build header map from first row
  const headerMap = new Map<string, string>();
  const rawHeaders = Object.keys(rows[0]);

  for (const rawHeader of rawHeaders) {
    const normalized = normalizeHeader(rawHeader);
    const mapped = CMAP[normalized];
    if (mapped) {
      headerMap.set(rawHeader, mapped);
    }
  }

  const records: ClinicalRecord[] = [];

  for (const row of rows) {
    if (!row) continue;

    const firstVal = Object.values(row)[0];
    if (!firstVal || firstVal === '') continue;

    const record: Record<string, unknown> = {
      date: '', agent: '', clinic: '', shift: '', genderValidated: '',
      schedTotal: 0, schedCancel: 0, newPatients: 0, followUp: 0,
      adminBookings: 0, botBookings: 0, duplicatesFound: 0, hmoFlagged: 0,
      insuranceUpdated: 0, cardsUploaded: 0, insuranceNotes: 0, insuranceDirect: 0,
      manualVerifications: 0, vobCsvUploaded: 0,
      prFormsCorrected: 0, hhFormsCorrected: 0, formsUploadedEcw: 0, formsFailed: 0,
      faxReceived: 0, faxClassified: 0, faxClassifFailed: 0,
      faxForwarded: 0, faxFwdFailed: 0, faxRenamed: 0, faxRenFailed: 0,
      failedFaxIds: '', faxNotes: '',
      vobTotal: 0, vobMatched: 0, vobUnmatched: 0, vobCreated: 0, vobUpdated: 0, vobFailed: 0,
    };

    for (const [rawHeader, field] of headerMap.entries()) {
      const val = row[rawHeader];
      if (STRING_FIELDS.has(field)) {
        record[field] = parseString(val);
      } else {
        record[field] = parseNumber(val);
      }
    }

    // Format date
    if (record.date) {
      try {
        const d = new Date(record.date as string);
        if (!isNaN(d.getTime())) {
          record.date = d.toISOString().split('T')[0];
        }
      } catch {
        // keep as-is
      }
    }

    if ((record.date as string) || (record.agent as string)) {
      records.push(record as unknown as ClinicalRecord);
    }
  }

  return records;
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

  const vobTotal = rand(20, 80);
  const vobMatched = rand(Math.floor(vobTotal * 0.4), Math.floor(vobTotal * 0.8));
  const vobUnmatched = vobTotal - vobMatched;
  const vobCreated = rand(Math.floor(vobUnmatched * 0.3), vobUnmatched);
  const vobUpdated = rand(Math.floor(vobMatched * 0.1), Math.floor(vobMatched * 0.4));
  const vobFailed = rand(0, 3);

  return {
    date,
    agent,
    clinic,
    shift: Math.random() > 0.3 ? 'Day' : 'Night',
    genderValidated: `${rand(92, 100)}%`,
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
    failedFaxIds: faxClassifFailed > 0 ? `FAX-${rand(1000, 9999)}, FAX-${rand(1000, 9999)}` : '',
    faxNotes: '',
    vobTotal,
    vobMatched,
    vobUnmatched,
    vobCreated,
    vobUpdated,
    vobFailed,
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
  total: number;
  pi: number;
  ins: number;
  sch: number;
  fax: number;
  vob: number;
  days: Set<string>;
  clinics: Set<string>;
}

export function getAgentSummaries(data: ClinicalRecord[]): AgentSummary[] {
  const map = new Map<string, AgentSummary>();

  for (const r of data) {
    const agent = r.agent || 'Unknown';
    if (!map.has(agent)) {
      map.set(agent, {
        agent, total: 0, pi: 0, ins: 0, sch: 0, fax: 0, vob: 0,
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

  return Array.from(map.values()).sort((a, b) => b.total - a.total);
}
