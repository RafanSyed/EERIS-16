// File: src/pages/api/parse-receipt.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'
import formidable from 'formidable'
import fs from 'fs'

export const config = {
  api: {
    bodyParser: false, // we'll handle parsing manually
    sizeLimit: '4mb' // match Azure Form Recognizer limit
  }
}

const endpoint = process.env.AZURE_FORM_RECOGNIZER_ENDPOINT
const key = process.env.AZURE_FORM_RECOGNIZER_KEY

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!endpoint || !key) {
    console.error('Missing Azure Form Recognizer configuration')
    return res.status(500).json({ 
      error: 'Azure Form Recognizer configuration missing',
      details: 'Please check your environment variables'
    })
  }

  const form = new formidable.IncomingForm({ 
    keepExtensions: true,
    maxFileSize: 4 * 1024 * 1024 // 4MB limit to match Azure
  })

  try {
    const [fields, files] = await new Promise<[formidable.Fields, formidable.Files]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err)
        else resolve([fields, files])
      })
    })

    if (!files.receipt) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const file = Array.isArray(files.receipt) ? files.receipt[0] : files.receipt
    
    // Check file size
    if (file.size > 4 * 1024 * 1024) {
      return res.status(400).json({ error: 'File too large. Maximum size is 4MB' })
    }

    const buffer = fs.readFileSync(file.filepath)

    console.log('Sending request to Azure Form Recognizer...')
    const response = await axios.post(
      `${endpoint}/formrecognizer/documentModels/prebuilt-receipt:analyze?api-version=2023-07-31`,
      buffer,
      {
        headers: {
          'Content-Type': 'application/octet-stream',
          'Ocp-Apim-Subscription-Key': key
        }
      }
    )

    // Clean up the temporary file
    fs.unlinkSync(file.filepath)

    console.log('Azure response:', response.data)

    // Extract relevant data from the response
    const result = response.data
    if (!result || typeof result !== 'object') {
      throw new Error('Invalid response from Azure Form Recognizer')
    }

    const receiptData = {
      amount: result.amount || 0,
      category: result.category || 'Other',
      date: result.date || new Date().toISOString().split('T')[0],
      description: result.description || 'Receipt upload'
    }

    res.status(200).json(receiptData)
  } catch (error: any) {
    console.error('Error processing receipt:', error)
    if (error.response) {
      console.error('Azure API Error:', {
        status: error.response.status,
        data: error.response.data
      })
    }
    res.status(500).json({ 
      error: 'Failed to process receipt',
      details: error.message || 'Unknown error occurred'
    })
  }
}
