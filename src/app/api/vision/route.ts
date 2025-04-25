// src/app/api/vision/route.ts
import { NextRequest, NextResponse } from 'next/server'
console.log('🔑 VISION_API_KEY is:', process.env.VISION_API_KEY)

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '5mb', // adjust if your images are larger
    },
  },
}

export async function POST(req: NextRequest) {
  // 1. Pull base64 payload from client
  const { imageBase64 } = await req.json()
  if (!imageBase64) {
    return NextResponse.json({ error: 'Missing imageBase64' }, { status: 400 })
  }

  // 2. Call Google Vision
  const visionKey = process.env.VISION_API_KEY
  const visionRes = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${visionKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [
          {
            image: { content: imageBase64 },
            features: [{ type: 'TEXT_DETECTION', maxResults: 1 }],
          },
        ],
      }),
    }
  )

  if (!visionRes.ok) {
    const errText = await visionRes.text()
    return NextResponse.json({ error: errText }, { status: visionRes.status })
  }

  // 3. Extract and return OCR text
  const visionJson = await visionRes.json()
  const ocrText = visionJson.responses?.[0]?.fullTextAnnotation?.text || ''
  return NextResponse.json({ ocrText })
}