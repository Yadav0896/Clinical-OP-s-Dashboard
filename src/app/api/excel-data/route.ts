import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

/**
 * Serves the current Excel file binary from the data/ or public/ directory.
 * Used by the client to re-fetch the file when a change is detected.
 *
 * On Vercel (read-only filesystem), returns 404 so the client
 * falls back to browser-stored data.
 */
export async function GET() {
  try {
    const dataPath = path.join(process.cwd(), 'data', 'Clinical_Ops_Data_Entry_Populated.xlsx');
    const publicPath = path.join(process.cwd(), 'public', 'Clinical_Ops_Data_Entry_Populated.xlsx');

    let filePath = dataPath;

    if (!fs.existsSync(dataPath)) {
      filePath = publicPath;
    }

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'No Excel file found' }, { status: 404 });
    }

    const buffer = fs.readFileSync(filePath);
    const stats = fs.statSync(filePath);

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Length': String(buffer.length),
        'Last-Modified': stats.mtime.toUTCString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'File not available' }, { status: 404 });
  }
}
