// src/app/lib/googleSheets.ts
import { google } from 'googleapis'

// Initialize auth
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
})

const sheets = google.sheets({ version: 'v4', auth })

// Your existing fetchMeetings function
export async function fetchMeetings() {
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID
  
  if (!spreadsheetId) {
    throw new Error('GOOGLE_SPREADSHEET_ID environment variable is not set')
  }
  
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Meetings!A2:Z', // Or whatever your range is
  })
  
  // Transform and return meetings data
  return response.data.values || []
}

// Firm interface
export interface Firm {
  name: string
  dateBooked: string
  aumMillions: number
}

// Fetch firms data
export async function fetchFirms(): Promise<Firm[]> {
  try {
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID
    
    if (!spreadsheetId) {
      throw new Error('GOOGLE_SPREADSHEET_ID environment variable is not set')
    }
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Firms!A2:C', // Skip header row, get columns A (Name), B (Date Booked), C (AUM)
    })
    
    const rows = response.data.values || []
    
    // Transform the data into Firm format
    return rows.map((row) => ({
      name: String(row[0] || '').trim(),
      dateBooked: String(row[1] || '').trim(),
      aumMillions: Number(row[2] || 0),
    }))
  } catch (error) {
    console.error('Error fetching firms data:', error)
    throw error
  }
}
