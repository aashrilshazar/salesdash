// src/app/api/meetings/route.ts
import { NextResponse } from 'next/server'
import { fetchMeetings } from '../../lib/googleSheets'

export async function GET() {
  const meetings = await fetchMeetings()
  return NextResponse.json(meetings)
}
