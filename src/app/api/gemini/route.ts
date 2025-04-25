
// src/app/api/gemini/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const config = {
  api: { bodyParser: { sizeLimit: '1mb' } }
};

export async function POST(req: NextRequest) {
  const { ocrText } = await req.json().catch(() =>
    NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  );
  if (!ocrText) {
    return NextResponse.json({ error: 'Missing ocrText' }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_API_KEY!;
  const endpoint =
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  // 1) Define the shape you want back—including the new category field
  const schema = `\
Respond **only** with valid JSON (no extra text) matching this structure:

{
  "merchant": string,                  // e.g. "Best Buy"
  "total": number,                     // e.g. 106.49
  "items": [
    { "description": string, "price": number },
    …
  ],
  "category": string                   // one of "Travel", "Meals", "Office Supplies, Other"
}
`;

  const payload = {
    contents: [
      {
        parts: [
          {
            text: `
${schema}

OCR text:
${ocrText}
`
          }
        ]
      }
    ]
  };

  const llmRes = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });


  // 1) Read the raw text from Gemini
  const text = await llmRes.text();
  if (!llmRes.ok) {
  return NextResponse.json(
    { error: 'LLM error', status: llmRes.status, detail: text },
    { status: 502 }
  );
  }

    // 1) Parse the Gemini API envelope
  const llmJson = JSON.parse(text);

  // 2) Extract the model’s reply (still wrapped in fences)
  let output = llmJson
    .candidates?.[0]
    .content?.parts?.[0]
    .text ?? '';

  // 3) Strip any ```json / ``` code fences
  const cleaned = output
    .replace(/```json\s*/i, '')  // remove leading ```json
    .replace(/```/g, '')         // remove closing ``` (and any others)
    .trim();                     // drop extra whitespace/newlines

  // 4) Now parse your real JSON
  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to parse JSON from Gemini', detail: cleaned },
      { status: 502 }
    );
  }

  // 5) Return the structured result
  return NextResponse.json({ parsed, rawOutput: cleaned });

}