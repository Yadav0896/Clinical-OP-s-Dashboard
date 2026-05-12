import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

/**
 * Receives an uploaded Excel file and saves it to the data/ directory.
 *
 * On Vercel (read-only filesystem), this will fail gracefully.
 * The client handles this by falling back to IndexedDB storage.
 */
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // File size limit: 50MB
    const MAX_FILE_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large. Maximum size is 50MB.' }, { status: 413 });
    }

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      return NextResponse.json({ error: 'Only .xlsx and .xls files are supported' }, { status: 400 });
    }

    // Try to write to filesystem (works on self-hosted, fails on Vercel)
    const dataDir = path.join(process.cwd(), 'data');
    try {
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      const filePath = path.join(dataDir, 'Clinical_Ops_Data_Entry_Populated.xlsx');
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      fs.writeFileSync(filePath, buffer);

      const stats = fs.statSync(filePath);
      const hash = `${stats.mtimeMs}-${stats.size}`;

      return NextResponse.json({
        success: true,
        message: 'File uploaded successfully',
        fileName: file.name,
        size: stats.size,
        hash,
        lastModified: stats.mtime.toISOString(),
      });
    } catch (writeError) {
      // Filesystem write failed (Vercel / read-only) — return a graceful response
      // The client will handle this by using IndexedDB instead
      return NextResponse.json({
        success: false,
        message: 'Server storage unavailable — file saved in browser',
        fileName: file.name,
        size: file.size,
        hash: '',
        mode: 'browser-only',
      });
    }
  } catch (error) {
    console.error('Error uploading Excel:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}
