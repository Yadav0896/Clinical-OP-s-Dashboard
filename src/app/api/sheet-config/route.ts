import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

/**
 * GET /api/sheet-config — Returns the current connected sheet configuration.
 * Reads from a JSON config file in the data/ directory.
 */
export async function GET() {
  try {
    const configPath = path.join(process.cwd(), 'data', 'sheet-config.json');

    if (!fs.existsSync(configPath)) {
      // Default config
      return NextResponse.json({
        fileName: 'Clinical_Ops_Data_Entry_Populated.xlsx',
        source: 'default',
        autoSync: true,
        pollInterval: 5,
        sheets: ['Scheduling', 'Patient Registration', 'Health History', 'Insurance Validation', 'VOB Doc Upload', 'VOB Agent Calls', 'Fax Classification', 'Fax Referral', 'Duplicate Patients'],
      });
    }

    const raw = fs.readFileSync(configPath, 'utf-8');
    const config = JSON.parse(raw);
    return NextResponse.json(config);
  } catch (error) {
    console.error('Error reading sheet config:', error);
    return NextResponse.json({ error: 'Failed to read config' }, { status: 500 });
  }
}

/**
 * POST /api/sheet-config — Updates the connected sheet configuration.
 * Also triggers a file copy/rename to set the new default sheet.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fileName, autoSync, pollInterval } = body;

    const configPath = path.join(process.cwd(), 'data', 'sheet-config.json');
    const dataDir = path.join(process.cwd(), 'data');

    // Ensure data directory exists
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Build config
    const config = {
      fileName: fileName || 'Clinical_Ops_Data_Entry_Populated.xlsx',
      source: 'custom',
      autoSync: autoSync !== undefined ? autoSync : true,
      pollInterval: pollInterval || 5,
      sheets: ['Scheduling', 'Patient Registration', 'Health History', 'Insurance Validation', 'VOB Doc Upload', 'VOB Agent Calls', 'Fax Classification', 'Fax Referral', 'Duplicate Patients'],
      updatedAt: new Date().toISOString(),
    };

    // Write config
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    return NextResponse.json({
      success: true,
      message: 'Sheet configuration updated',
      config,
    });
  } catch (error) {
    console.error('Error updating sheet config:', error);
    return NextResponse.json({ error: 'Failed to update config' }, { status: 500 });
  }
}
