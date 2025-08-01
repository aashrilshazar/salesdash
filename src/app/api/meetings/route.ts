// src/app/api/meetings/route.ts
import { NextResponse } from 'next/server'
import { fetchMeetings } from '../../lib/googleSheets'

export async function GET() {
  try {
    const meetingsData = await fetchMeetings()
    
    // Transform the raw array data into the expected format
    // Assuming your Meetings sheet has columns: Date, Title, Stage, Owner
    const meetings = meetingsData.map((row: any[]) => ({
      date: row[0] || '',
      title: row[1] || '',
      stage: row[2] || '',
      owner: row[3] || '',
    }))
    
    return NextResponse.json(meetings)
  } catch (error) {
    console.error('Error fetching meetings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch meetings data' },
      { status: 500 }
    )
  }
}