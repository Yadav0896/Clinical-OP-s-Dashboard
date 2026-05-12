import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

/**
 * Returns the current hash (mtime + size) of the watched Excel file.
 * Client polls this endpoint every 5 seconds to detect file changes.
 *
 * On Vercel (read-only filesystem), returns { exists: false }
 * so the client falls back to browser-only mode.
 */
export async function GET() {
  try {
    const dataPath = path.join(process.cwd(), 'data', 'Clinical_Ops_Data_Entry_Populated.xlsx');
    const publicPath = path.join(process.cwd(), 'public', 'Clinical_Ops_Data_Entry_Populated.xlsx');

    let filePath = dataPath;
    let source = 'data';

    if (!fs.existsSync(dataPath)) {
      filePath = publicPath;
      source = 'public';
    }

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({
        exists: false,
        hash: '',
        size: 0,
        lastModified: '',
        source: 'none',
      });
    }

    const stats = fs.statSync(filePath);
    const hash = `${stats.mtimeMs}-${stats.size}`;

    return NextResponse.json({
      exists: true,
      hash,
      size: stats.size,
      lastModified: stats.mtime.toISOString(),
      source,
    });
  } catch (error) {
    // Likely a read-only filesystem (Vercel) — signal client to use browser mode
    return NextResponse.json({
      exists: false,
      hash: '',
      size: 0,
      lastModified: '',
      source: 'error',
    });
  }
}
