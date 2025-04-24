'use client'

import { NextRequest, NextResponse } from 'next/server'

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',  // adjust if needed for long OCR text
    },
  },
}

export async function POST(req: NextRequest) {
  // 1) Get OCR text from client
  const { ocrText } = await req.json()
  if (!ocrText) {
    return NextResponse.json({ error: 'Missing ocrText in request body' }, { status: 400 })
  }

  // 2) Build prompt for Gemini
  const prompt = `Extract the merchant name, total amount, and a list of line items (description + price) from this OCR text:\n\n${ocrText}`

  // 3) Call Gemini API
  const apiKey = process.env.API_KEY
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`

  const geminiRes = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        { parts: [ { text: prompt } ] }
      ],
      temperature: 0.1,
      candidateCount: 1,
    }),
  })

  if (!geminiRes.ok) {
    const errorText = await geminiRes.text()
    return NextResponse.json({ error: 'Gemini API error', detail: errorText }, { status: 502 })
  }

  const geminiJson = await geminiRes.json()
  const rawOutput = geminiJson.candidates?.[0]?.message?.content || ''

  // 4) Try to parse as JSON, fallback to raw text
  let parsed
  try {
    parsed = JSON.parse(rawOutput)
  } catch {
    parsed = { raw: rawOutput }
  }

  // 5) Return structured result
  return NextResponse.json({ parsed, rawOutput })
}
