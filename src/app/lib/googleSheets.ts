// src/lib/googleSheets.ts
import { google } from 'googleapis';

export interface Meeting {
  date: string;
  title: string;
  stage: string;
  owner: string;
}

const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!;
const rawKey = process.env.GOOGLE_PRIVATE_KEY!;
const sheetId = process.env.SHEET_ID!;

if (!clientEmail || !rawKey || !sheetId) {
  throw new Error(
    'Missing GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY or SHEET_ID'
  );
}

const privateKey = rawKey.replace(/\\n/g, '\n');
const auth = new google.auth.JWT({
  email: clientEmail,
  key: privateKey,
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});
const sheets = google.sheets({ version: 'v4', auth });

export async function fetchMeetings(): Promise<Meeting[]> {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: 'Meetings!A:D',
  });
  const rows = res.data.values ?? [];
  if (rows.length < 2) return [];

  return rows.slice(1).map((r) => ({
    date: String(r[0] ?? '').trim(),
    title: String(r[1] ?? '').trim(),
    stage: String(r[2] ?? '').trim(),
    owner: String(r[3] ?? '').trim(),
  }));
}

export interface Firm {
  name: string;
  dateBooked: string;
  aumMillions: number;
}

export async function fetchFirms(): Promise<Firm[]> {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: 'Firms!A:C', // Assuming columns are: Name, Date Booked, AUM (in millions)
  });
  const rows = res.data.values ?? [];
  if (rows.length < 2) return [];

  return rows.slice(1).map((r) => ({
    name: String(r[0] ?? '').trim(),
    dateBooked: String(r[1] ?? '').trim(),
    aumMillions: Number(r[2] ?? 0),
  }));
}
