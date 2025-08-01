// src/app/api/pipeline/route.ts
import { NextResponse } from 'next/server'
import { google } from 'googleapis'

// Map of human-readable stage names to stage IDs
const stageMapping: Record<string, string> = {
  // Main stages
  'Meeting Booked': 'meeting-booked',
  'Active Conversation': 'active-conversation',
  'NDA (Considering)': 'nda-considering',
  'NDA (Signed)': 'nda-signed',
  'Documents Uploaded': 'documents-uploaded',
  'Contract Negotiations': 'contract-negotiations',
  'Won': 'won',
  // Auxiliary stages
  'Not Now': 'not-now',
  'Exploring Other Options': 'exploring-other-options',
  'Not Interested': 'not-interested',
  // Also support the kebab-case versions
  'meeting-booked': 'meeting-booked',
  'active-conversation': 'active-conversation',
  'nda-considering': 'nda-considering',
  'nda-signed': 'nda-signed',
  'documents-uploaded': 'documents-uploaded',
  'contract-negotiations': 'contract-negotiations',
  'won': 'won',
  'not-now': 'not-now',
  'exploring-other-options': 'exploring-other-options',
  'not-interested': 'not-interested',
}

export async function GET() {
  try {
    // Get environment variables directly in the route
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
    const privateKey = process.env.GOOGLE_PRIVATE_KEY
    
    console.log('Direct env check in route:', {
      hasSpreadsheetId: !!spreadsheetId,
      spreadsheetIdLength: spreadsheetId?.length,
      hasClientEmail: !!clientEmail,
      hasPrivateKey: !!privateKey,
    })
    
    if (!spreadsheetId || !clientEmail || !privateKey) {
      return NextResponse.json(
        { 
          error: 'Missing environment variables',
          debug: {
            hasSpreadsheetId: !!spreadsheetId,
            hasClientEmail: !!clientEmail,
            hasPrivateKey: !!privateKey,
          }
        },
        { status: 500 }
      )
    }
    
    // Initialize Google Sheets
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    })
    
    const sheets = google.sheets({ version: 'v4', auth })
    
    console.log('Attempting to fetch from spreadsheet:', spreadsheetId.substring(0, 10) + '...')
    
    // Fetch data
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Pipeline!A2:H',
    })
    
    const rows = response.data.values || []
    console.log(`Successfully fetched ${rows.length} rows`)
    
    // Transform data with stage normalization
    const deals = rows.map((row, index) => {
      const originalStage = row[1] || ''
      const normalizedStage = stageMapping[originalStage] || 'not-now' // Default to 'not-now' if unknown
      
      // Log any unmapped stages
      if (originalStage && !stageMapping[originalStage]) {
        console.warn(`Unknown stage "${originalStage}" for ${row[0]}, defaulting to "not-now"`)
      }
      
      return {
        id: (index + 1).toString(),
        firmName: row[0] || '',
        stage: normalizedStage,
        createdAt: row[2] || '',
        lastActivity: row[3] || '',
        value: row[4] || '',
        contactCount: parseInt(row[5]) || 0,
        emailCount: parseInt(row[6]) || 0,
        meetingCount: parseInt(row[7]) || 0,
        noteCount: 0,
      }
    })
    
    console.log('Sample deal:', deals[0]) // Log first deal to verify
    
    return NextResponse.json({ deals })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorCode = (error as any)?.code || undefined
    
    console.error('Pipeline API Error:', {
      message: errorMessage,
      code: errorCode,
      errors: (error as any)?.errors,
    })
    
    // More specific error messages
    if (errorCode === 403) {
      return NextResponse.json(
        { error: 'Permission denied. Make sure the service account has access to the spreadsheet.' },
        { status: 403 }
      )
    }
    
    if (errorCode === 404 || errorMessage?.includes('Unable to parse range')) {
      return NextResponse.json(
        { error: 'Sheet "Pipeline" not found. Make sure you have a sheet named "Pipeline" in your spreadsheet.' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { 
        error: errorMessage || 'Failed to fetch pipeline data',
        code: errorCode,
      },
      { status: 500 }
    )
  }
}