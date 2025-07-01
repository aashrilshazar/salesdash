// src/app/api/meetings/route.ts
import { NextResponse } from 'next/server'
import { fetchMeetings } from '../../lib/googleSheets'
import OpenAI from 'openai'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  
  // If a "name" query param is present, return a GPT summary
  const name = searchParams.get('name')
  if (name) {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })
    const resp = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You’re a concise research assistant.' },
        { role: 'user', content: `Give me a 1–2 sentence summary of the private equity firm "${name}".` },
      ],
      max_tokens: 60,
    })
    const summary = resp.choices?.[0]?.message?.content?.trim() ?? ''
    return NextResponse.json({ summary })
  }

  // Otherwise, fall back to returning meetings as before
  const meetings = await fetchMeetings()
  return NextResponse.json(meetings)
}
