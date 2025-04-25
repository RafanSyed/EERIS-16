'use client'

import React, { useState } from 'react'

export default function ReceiptUploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setResult(null)
      setError(null)
    }
  }

  const handleSubmit = async () => {
    if (!file) return

    setLoading(true)
    setError(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/parse-receipt', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) throw new Error('Failed to process receipt')

      const data = await res.json()
      setResult(data)
    } catch (err) {
      setError('Something went wrong.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto p-6 text-gray-900">
      <h1 className="text-2xl font-bold mb-4">Upload Receipt</h1>

      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="mb-4"
      />

      <button
        onClick={handleSubmit}
        disabled={loading || !file}
        className="bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-800 disabled:opacity-50"
      >
        {loading ? 'Processing…' : 'Submit'}
      </button>

      {error && <p className="text-red-600 mt-4">{error}</p>}

      {result && (
        <div className="mt-6 bg-gray-100 p-4 rounded">
          <h2 className="font-semibold mb-2">Extracted Receipt Data:</h2>
          <pre className="text-sm whitespace-pre-wrap">
            {JSON.stringify(result.documents?.[0]?.fields, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
