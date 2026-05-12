// Clinical Ops - Excel Parser using SheetJS
// Re-exports parseExcelData from clinical-data.ts and adds file-level parsing

import * as XLSX from 'xlsx';
import { parseExcelData } from './clinical-data';
import type { ClinicalRecord } from './clinical-data';

/**
 * Parse an uploaded .xlsx/.xls file into ClinicalRecord[]
 * Tries "Daily Tracker" sheet first, falls back to first sheet
 */
export function parseExcelFile(file: File): Promise<ClinicalRecord[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        // Try "Daily Tracker" first, then fall back to first sheet
        let sheetName = workbook.SheetNames.find(
          (n) => n.toLowerCase().includes('daily') || n.toLowerCase().includes('tracker')
        );
        if (!sheetName) sheetName = workbook.SheetNames[0];

        const sheet = workbook.Sheets[sheetName];
        if (!sheet) {
          reject(new Error('No sheets found in workbook'));
          return;
        }

        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
          defval: '',
        });

        if (rows.length === 0) {
          resolve([]);
          return;
        }

        const records = parseExcelData(rows);
        resolve(records);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

export type { ClinicalRecord };
