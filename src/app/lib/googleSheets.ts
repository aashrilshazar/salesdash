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

// New function for pipeline data
export async function fetchPipelineDeals() {
  try {
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID
    
    // Debug logging
    console.log('Environment variables check:', {
      hasSpreadsheetId: !!spreadsheetId,
      spreadsheetIdLength: spreadsheetId?.length,
      nodeEnv: process.env.NODE_ENV,
    })
    
    if (!spreadsheetId) {
      throw new Error('GOOGLE_SPREADSHEET_ID environment variable is not set')
    }
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Pipeline!A2:H', // Adjust based on your sheet
    })

    const rows = response.data.values || []
    
    // Transform the data into Deal format
    const deals = rows.map((row, index) => ({
      id: (index + 1).toString(),
      firmName: row[0] || '',
      stage: row[1] || 'lost-contact',
      createdAt: row[2] || '',
      lastActivity: row[3] || '',
      value: row[4] || '',
      contactCount: parseInt(row[5]) || 0,
      emailCount: parseInt(row[6]) || 0,
      meetingCount: parseInt(row[7]) || 0,
      noteCount: 0,
    }))

    return deals
  } catch (error) {
    console.error('Error fetching pipeline data:', error)
    throw error
  }
}