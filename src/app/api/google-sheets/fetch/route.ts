import { NextResponse } from 'next/server';

/**
 * Fetches a publicly-shared Google Sheet and returns it as an Excel buffer.
 *
 * The client sends a Google Sheets URL, this route:
 * 1. Extracts the spreadsheet ID from the URL
 * 2. Fetches the sheet as XLSX from Google's export endpoint
 * 3. Returns the binary buffer to the client for parsing
 *
 * This avoids CORS issues by fetching server-side.
 *
 * Requires the sheet to be shared with "Anyone with the link can view".
 */

/** Extract the spreadsheet ID from various Google Sheets URL formats */
function extractSheetId(url: string): string | null {
  // Format: https://docs.google.com/spreadsheets/d/{ID}/edit
  // Format: https://docs.google.com/spreadsheets/d/{ID}
  // Format: https://docs.google.com/spreadsheets/d/{ID}/gviz/tq
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

/** Extract optional GID (sheet tab index) from URL */
function extractGid(url: string): string | null {
  const match = url.match(/gid=(\d+)/);
  return match ? match[1] : null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'No URL provided' },
        { status: 400 }
      );
    }

    // Validate it's a Google Sheets URL
    const sheetId = extractSheetId(url);
    if (!sheetId) {
      return NextResponse.json(
        {
          error: 'Invalid Google Sheets URL',
          hint: 'URL should look like: https://docs.google.com/spreadsheets/d/xxxxx/edit',
        },
        { status: 400 }
      );
    }

    const gid = extractGid(url);

    // Build export URL (xlsx format)
    let exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=xlsx`;
    if (gid) {
      exportUrl += `&gid=${gid}`;
    }

    console.log(`[Google Sheets] Fetching: ${sheetId} (gid: ${gid || 'all sheets'})`);

    // Abort after 15 seconds to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    // Fetch from Google
    let response: Response;
    try {
      response = await fetch(exportUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ClinicalOpsDashboard/1.0)',
        },
        redirect: 'follow',
        signal: controller.signal,
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError instanceof DOMException && fetchError.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Request timed out. The Google Sheet may be too large or unreachable.' },
          { status: 504 }
        );
      }
      throw fetchError;
    }
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error(`[Google Sheets] Fetch failed: ${response.status} ${errorText.slice(0, 200)}`);

      if (response.status === 403 || response.status === 404) {
        return NextResponse.json(
          {
            error: 'Cannot access this Google Sheet',
            hint: 'Make sure the sheet is shared with "Anyone with the link can view".',
          },
          { status: 422 }
        );
      }

      return NextResponse.json(
        { error: `Google returned status ${response.status}` },
        { status: 502 }
      );
    }

    // Get the buffer and return it
    const buffer = await response.arrayBuffer();

    if (buffer.byteLength < 100) {
      return NextResponse.json(
        { error: 'Sheet appears to be empty or too small' },
        { status: 422 }
      );
    }

    console.log(`[Google Sheets] Fetched successfully: ${(buffer.byteLength / 1024).toFixed(1)}KB`);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Length': String(buffer.byteLength),
        'X-Sheet-Id': sheetId,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('[Google Sheets] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Google Sheet' },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint — validates a Google Sheets URL and returns metadata
 * (spreadsheet ID, whether it's accessible) without downloading the full file.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'No URL provided' }, { status: 400 });
  }

  const sheetId = extractSheetId(url);
  if (!sheetId) {
    return NextResponse.json(
      {
        valid: false,
        error: 'Not a valid Google Sheets URL',
        hint: 'URL should contain /spreadsheets/d/{ID}/',
      },
      { status: 400 }
    );
  }

  return NextResponse.json({
    valid: true,
    sheetId,
    gid: extractGid(url),
    message: 'Valid Google Sheets URL',
  });
}
