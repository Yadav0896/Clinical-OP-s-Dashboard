// ─── IndexedDB Storage for Excel Files (Vercel-Compatible) ───
// Stores uploaded Excel files in the browser's IndexedDB so data
// persists across page refreshes without needing server filesystem.

const DB_NAME = 'clinical-ops-db';
const DB_VERSION = 1;
const STORE_NAME = 'excel-files';
const CONFIG_STORE = 'app-config';

interface StoredFile {
  id: string; // 'active-sheet'
  fileName: string;
  data: ArrayBuffer;
  hash: string;
  uploadedAt: string;
  size: number;
}

export interface AppConfig {
  key: string;
  autoSync: boolean;
  pollInterval: number;
  lastSyncTime: string;
  googleSheetUrl?: string;
  googleSheetId?: string;
  lastGoogleFetch?: string;
  dataSource?: 'default' | 'uploaded' | 'google-sheets' | 'demo';
}

/** Extract Google Sheets spreadsheet ID from a URL */
export function extractSheetId(url: string): string | null {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

/** Check if a URL is a valid Google Sheets URL */
export function isGoogleSheetUrl(url: string): boolean {
  return /docs\.google\.com\/spreadsheets\/d\//.test(url);
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(CONFIG_STORE)) {
        db.createObjectStore(CONFIG_STORE, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ─── File Operations ────────────────────────────────────────

/**
 * Generate a simple hash from an ArrayBuffer for change detection.
 * Uses first 4KB + size for performance with large files.
 */
export function computeFileHash(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer.slice(0, 4096));
  let h = buffer.byteLength;
  for (let i = 0; i < bytes.length; i++) {
    h = ((h << 5) - h + bytes[i]) | 0;
  }
  return `${h}-${buffer.byteLength}`;
}

/**
 * Save an uploaded Excel file to IndexedDB.
 */
export async function saveUploadedFile(
  buffer: ArrayBuffer,
  fileName: string
): Promise<{ hash: string; uploadedAt: string }> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    const hash = computeFileHash(buffer);
    const record: StoredFile = {
      id: 'active-sheet',
      fileName,
      data: buffer,
      hash,
      uploadedAt: new Date().toISOString(),
      size: buffer.byteLength,
    };

    const request = store.put(record);
    request.onsuccess = () =>
      resolve({ hash, uploadedAt: record.uploadedAt });
    request.onerror = () => reject(request.error);
  });
}

/**
 * Retrieve the stored Excel file from IndexedDB.
 * Returns null if no file has been uploaded yet.
 */
export async function getStoredFile(): Promise<{
  buffer: ArrayBuffer;
  fileName: string;
  hash: string;
  uploadedAt: string;
  size: number;
} | null> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get('active-sheet');

    request.onsuccess = () => {
      const record = request.result as StoredFile | undefined;
      if (record) {
        resolve({
          buffer: record.data,
          fileName: record.fileName,
          hash: record.hash,
          uploadedAt: record.uploadedAt,
          size: record.size,
        });
      } else {
        resolve(null);
      }
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Clear the stored file from IndexedDB (e.g., to revert to default).
 */
export async function clearStoredFile(): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete('active-sheet');
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Check if a stored file exists and return its metadata.
 */
export async function getStoredFileMeta(): Promise<{
  fileName: string;
  hash: string;
  uploadedAt: string;
  size: number;
} | null> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get('active-sheet');

    request.onsuccess = () => {
      const record = request.result as StoredFile | undefined;
      if (record) {
        resolve({
          fileName: record.fileName,
          hash: record.hash,
          uploadedAt: record.uploadedAt,
          size: record.size,
        });
      } else {
        resolve(null);
      }
    };
    request.onerror = () => reject(request.error);
  });
}

// ─── Stored File Metadata Type ─────────────────────────────

export interface StoredFileMeta {
  fileName: string;
  hash: string;
  uploadedAt: string;
  size: number;
}

// ─── Config Operations ──────────────────────────────────────

export async function getAppConfig(): Promise<AppConfig | null> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(CONFIG_STORE, 'readonly');
    const store = tx.objectStore(CONFIG_STORE);
    const request = store.get('app-config');

    request.onsuccess = () => {
      resolve(request.result as AppConfig | undefined ?? null);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function saveAppConfig(config: Partial<AppConfig>): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(CONFIG_STORE, 'readwrite');
    const store = tx.objectStore(CONFIG_STORE);
    const record: AppConfig = { key: 'app-config', ...config } as AppConfig;
    const request = store.put(record);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save a Google Sheets URL as the active data source.
 * Also clears any previously uploaded file so the dashboard
 * uses the Google Sheet instead.
 */
export async function saveGoogleSheetUrl(url: string): Promise<void> {
  const sheetId = extractSheetId(url) || '';
  const config: Partial<AppConfig> = {
    googleSheetUrl: url,
    googleSheetId: sheetId,
    lastGoogleFetch: new Date().toISOString(),
    dataSource: 'google-sheets',
  };
  await saveAppConfig(config);
}

/**
 * Clear the Google Sheets URL (revert to default/uploaded).
 */
export async function clearGoogleSheetUrl(): Promise<void> {
  const existing = await getAppConfig();
  if (existing) {
    await saveAppConfig({
      ...existing,
      googleSheetUrl: undefined,
      googleSheetId: undefined,
      dataSource: existing.dataSource === 'google-sheets' ? 'default' : existing.dataSource,
    });
  }
}

/**
 * Get the saved Google Sheets URL, if any.
 */
export async function getGoogleSheetUrl(): Promise<string | null> {
  const config = await getAppConfig();
  return config?.googleSheetUrl || null;
}

// ─── Deployment Mode Detection ──────────────────────────────

/**
 * Detect if we're running on Vercel (serverless) or a traditional server.
 * Used to decide whether to use server APIs or client-only mode.
 */
export function detectDeploymentMode(): 'vercel' | 'server' | 'unknown' {
  if (typeof window === 'undefined') return 'server'; // SSR
  const hostname = window.location.hostname;
  if (hostname.includes('.vercel.app') || hostname.includes('.now.sh')) {
    return 'vercel';
  }
  return 'unknown';
}
