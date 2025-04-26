'use client'

import React, { useState, useRef, ChangeEvent, FormEvent } from 'react'
import { useAuth } from '../../context/AuthContext'
import { db } from '../firebase/firebaseConfig'
import { collection, addDoc, Timestamp } from 'firebase/firestore'

export default function ReceiptUploadForm() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'manual' | 'upload'>('manual')
  const [form, setForm] = useState({
    merchant: '',
    amount: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    description: ''
  })
  const [file, setFile] = useState<File | null>(null)
  const [scanning, setScanning] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleInput = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const sel = e.target.files?.[0] ?? null
    setFile(sel)
    if (sel) await processReceipt(sel)
  }

  const processReceipt = async (file: File) => {
    if (!user) return setError('Login required')
    setScanning(true)
    setError(null)
    try {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1]
        const vis = await fetch('/api/vision', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64 })
        })
        const vj = await vis.json()
        if (!vis.ok) throw new Error(vj.error || 'Vision failed')
        const { ocrText } = vj
  
        const gm = await fetch('/api/gemini', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ocrText })
        })
        const gj = await gm.json()
        if (!gm.ok) throw new Error(gj.error || 'Parse failed')
        const { parsed } = gj
  
        setForm({
          merchant: parsed.merchant || '',
          amount: parsed.total?.toString() || '',
          category: parsed.category || '',
          date: new Date().toISOString().split('T')[0],
          description: parsed.items.map((i: any) => `${i.description}: $${i.price}`).join('; ')
        })

        setScanning(false)
      }
    } catch (err) {
      setError((err as Error).message)
      setScanning(false)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!user) return setError('Login required')
    setError(null)
    const amt = parseFloat(form.amount)
    if (isNaN(amt)) return setError('Invalid amount')
    try {
      await addDoc(collection(db, 'expenses'), {
        uid: user.uid,
        merchant: form.merchant,
        amount: amt,
        category: form.category,
        date: form.date,
        description: form.description,
        status: 'Pending',
        submittedAt: Timestamp.now(),
        rejectionComment: ''
      })
      setSuccess(true)
      setForm({ merchant: '', amount: '', category: '', date: new Date().toISOString().split('T')[0], description: '' })
      if (fileRef.current) fileRef.current.value = ''
      setTimeout(() => setSuccess(false), 3000)
    } catch {
      setError('Submit failed')
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow border border-gray-300">
      <h2 className="text-xl font-semibold mb-4 text-gray-900">Submit Expense</h2>

      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setActiveTab('manual')}
          className={activeTab === 'manual' ? 'bg-blue-600 text-white px-4 py-2 rounded' : 'bg-gray-300 text-gray-900 px-4 py-2 rounded'}
        >
          Manual Entry
        </button>
        <button
          onClick={() => {
            setActiveTab('upload')
            if (fileRef.current) {
              fileRef.current.click()
            }
          }}
          className={activeTab === 'upload' ? 'bg-blue-600 text-white px-4 py-2 rounded' : 'bg-gray-300 text-gray-900 px-4 py-2 rounded'}
        >
          Upload Receipt
        </button>
      </div>

      {scanning && <p className="text-blue-800 mb-4">Scanning receipt...</p>}
      {error && <p className="text-red-800 mb-4">{error}</p>}
      {success && <p className="text-green-800 mb-4">Expense Submitted!</p>}

      {/* Hidden file input for upload */}
      <input
        type="file"
        ref={fileRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*"
      />

      {/* Always show the form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="merchant"
          value={form.merchant}
          onChange={handleInput}
          placeholder="Merchant"
          className="w-full border border-gray-400 text-gray-900 p-2 rounded placeholder-gray-500"
          required
        />
        <input
          name="amount"
          value={form.amount}
          onChange={handleInput}
          placeholder="Amount"
          type="number"
          step="0.01"
          className="w-full border border-gray-400 text-gray-900 p-2 rounded placeholder-gray-500"
          required
        />
        <input
          name="category"
          value={form.category}
          onChange={handleInput}
          placeholder="Category"
          className="w-full border border-gray-400 text-gray-900 p-2 rounded placeholder-gray-500"
          required
        />
        <input
          type="date"
          name="date"
          value={form.date}
          onChange={handleInput}
          className="w-full border border-gray-400 text-gray-900 p-2 rounded"
          required
        />
        <textarea
          name="description"
          value={form.description}
          onChange={handleInput}
          placeholder="Items Description"
          className="w-full border border-gray-400 text-gray-900 p-2 rounded placeholder-gray-500"
          rows={3}
        />
        <button
          type="submit"
          disabled={scanning}
          className="bg-blue-700 text-white py-2 px-4 rounded hover:bg-blue-800 transition"
        >
          Submit Expense
        </button>
      </form>
    </div>
  )
}
