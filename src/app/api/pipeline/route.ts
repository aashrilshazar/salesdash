// src/app/api/pipeline/route.ts
import { NextResponse } from 'next/server'
import { google } from 'googleapis'

const stageMapping: Record<string, string> = {
  'Meeting Booked': 'meeting-booked',
  'Active Conversation': 'active-conversation',
  'NDA (Considering)': 'nda-considering',
  'NDA (Signed)': 'nda-signed',
  'Documents Uploaded': 'documents-uploaded',
  'Contract Negotiations': 'contract-negotiations',
  'Won': 'won',
  'Not Now': 'not-now',
  'Exploring Other Options': 'exploring-other-options',
  'Not Interested': 'not-interested',
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

// Reverse mapping for writing back to sheets
const reverseStageMapping: Record<string, string> = {
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

function getAuth() {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const privateKey = process.env.GOOGLE_PRIVATE_KEY
  
  if (!clientEmail || !privateKey) {
    throw new Error('Missing Google credentials')
  }
  
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
}

export async function GET() {
  try {
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID
    if (!spreadsheetId) throw new Error('Missing spreadsheet ID')
    
    const auth = getAuth()
    const sheets = google.sheets({ version: 'v4', auth })
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Pipeline!A2:E', // Only columns A-E
    })
    
    const rows = response.data.values || []
    
    const deals = rows.map((row, index) => ({
      id: (index + 2).toString(), // Row number in sheet
      firmName: row[0] || '',
      stage: stageMapping[row[1]] || 'not-now',
      value: row[2] || '',
      lastActivity: row[3] || '',
      note: row[4] || '',
      // Default values for unused fields
      createdAt: '',
      contactCount: 0,
      emailCount: 0,
      meetingCount: 0,
      noteCount: 0,
    }))
    
    return NextResponse.json({ deals })
  } catch (error) {
    console.error('GET Error:', error)
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID
    if (!spreadsheetId) throw new Error('Missing spreadsheet ID')
    
    const data = await request.json()
    const auth = getAuth()
    const sheets = google.sheets({ version: 'v4', auth })
    
    // Get current data to find next empty row
    const currentData = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Pipeline!A:A',
    })
    
    const nextRow = (currentData.data.values?.length || 1) + 1
    
    // Prepare new row data (A-E only)
    const values = [[
      data.firmName,
      reverseStageMapping[data.stage] || data.stage,
      data.value || '',
      data.lastActivity || '',
      data.note || '',
    ]]
    
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Pipeline!A:E',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values },
    })
    
    return NextResponse.json({ 
      success: true, 
      id: nextRow.toString(),
      deal: { ...data, id: nextRow.toString() }
    })
  } catch (error) {
    console.error('POST Error:', error)
    return NextResponse.json({ error: 'Failed to create deal' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID
    if (!spreadsheetId) throw new Error('Missing spreadsheet ID')
    
    const data = await request.json()
    const auth = getAuth()
    const sheets = google.sheets({ version: 'v4', auth })
    
    const row = parseInt(data.id)
    const range = `Pipeline!A${row}:E${row}` // Only columns A-E
    
    const values = [[
      data.firmName,
      reverseStageMapping[data.stage] || data.stage,
      data.value || '',
      data.lastActivity || '',
      data.note || '',
    ]]
    
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('PUT Error:', error)
    return NextResponse.json({ error: 'Failed to update deal' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID
    if (!spreadsheetId) throw new Error('Missing spreadsheet ID')
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) throw new Error('Missing deal ID')
    
    const auth = getAuth()
    const sheets = google.sheets({ version: 'v4', auth })
    
    // Clear the row (Google Sheets API doesn't support deleting rows easily)
    const row = parseInt(id)
    const range = `Pipeline!A${row}:E${row}` // Only columns A-E
    
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range,
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE Error:', error)
    return NextResponse.json({ error: 'Failed to delete deal' }, { status: 500 })
  }
}