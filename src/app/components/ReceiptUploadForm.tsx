// File: src/app/components/ReceiptUploadForm.tsx
'use client'

import React, { useState, useRef, ChangeEvent, FormEvent } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useExpenses } from '../../context/ExpensesContext'
import { db } from '../../app/firebase/firebaseConfig'
import { collection, addDoc, Timestamp } from 'firebase/firestore'

export default function ReceiptUploadForm() {
  const { user } = useAuth()
  const { addExpense } = useExpenses()
  const [activeTab, setActiveTab] = useState<'manual' | 'upload'>('manual')
  const [form, setForm] = useState({ amount: '', category: '', date: '', description: '' })
  const [file, setFile] = useState<File | null>(null)
  const [scanning, setScanning] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleInput = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null
    setFile(selected)
    if (selected) await processReceipt(selected)
  }

  const processReceipt = async (file: File) => {
    if (!user) return setError('Login required')
    setScanning(true)
    setError(null)

    try {
      const base64 = await toBase64(file)

      // 1) Vision OCR
      const visionRes = await fetch('/api/vision', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64 })
      })
      if (!visionRes.ok) throw new Error(`Vision API: ${visionRes.status}`)
      const { ocrText } = await visionRes.json()

      // 2) Gemini parse
      const geminiRes = await fetch('/api/gemini', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ocrText })
      })
      if (!geminiRes.ok) throw new Error(`Parsing API: ${geminiRes.status}`)
      const { parsed } = await geminiRes.json()

      // Populate form fields
      setForm({
        amount: parsed.total?.toString() ?? '',
        category: parsed.category ?? '',
        date: parsed.date ?? new Date().toISOString().split('T')[0],
        description: parsed.items
          .map((i: any) => `${i.description}: $${i.price}`)
          .join('; ')
      })

      // Switch to manual tab to review/edit
      setActiveTab('manual')

    } catch (err) {
      console.error(err)
      setError((err as Error).message)
    } finally {
      setScanning(false)
    }
  }

  const toBase64 = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve((reader.result as string).split(',')[1])
    reader.onerror = () => reject(reader.error)
  })

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!user) return setError('Login required')
    setError(null)

    const amountNum = parseFloat(form.amount)
    if (isNaN(amountNum)) return setError('Please enter a valid amount')

    const payload = {
      uid: user.uid,
      amount: amountNum,
      category: form.category,
      date: form.date,
      description: form.description,
      submittedAt: Timestamp.now(),
      status: 'Pending',
      rejectionComment: ''
    }

    try {
      await addDoc(collection(db, 'expenses'), payload)
      setSuccess(true)
      // Reset
      setForm({ amount: '', category: '', date: '', description: '' })
      setFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error(err)
      setError('Failed to submit expense')
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow border border-gray-300 mb-6 text-gray-900">
      <h2 className="text-xl font-semibold mb-4">Submit Expense</h2>

      <div className="flex space-x-4 mb-6">
        <button onClick={() => setActiveTab('manual')} className={`${activeTab==='manual'? 'bg-blue-600 text-white' : 'bg-gray-100'} px-4 py-2 rounded`}>Manual Entry</button>
        <button onClick={() => setActiveTab('upload')} className={`${activeTab==='upload'? 'bg-blue-600 text-white' : 'bg-gray-100'} px-4 py-2 rounded`}>Upload Receipt</button>
      </div>

      {scanning && <p className="text-blue-600 mb-4">Scanning receipt...</p>}
      {error && <p className="text-red-600 mb-4">{error}</p>}
      {success && <p className="text-green-600 mb-4">Expense submitted!</p>}

      {activeTab === 'upload' && (
        <div className="mb-6">
          <input type="file" accept="image/*" onChange={handleFileChange} ref={fileInputRef} className="w-full" />
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Amount ($)</label>
          <input type="number" name="amount" value={form.amount} onChange={handleInput}
            required step="0.01" className="w-full border p-2 rounded" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <select name="category" value={form.category} onChange={handleInput} required className="w-full border p-2 rounded">
            <option value="">Select…</option>
            <option value="Travel">Travel</option>
            <option value="Meals">Meals</option>
            <option value="Office Supplies">Office Supplies</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Date</label>
          <input type="date" name="date" value={form.date} onChange={handleInput} required className="w-full border p-2 rounded" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea name="description" value={form.description} onChange={handleInput} rows={2} className="w-full border p-2 rounded" />
        </div>
        <button type="submit" disabled={scanning} className="bg-blue-700 text-white py-2 px-4 rounded hover:bg-blue-800">
          Submit Expense
        </button>
      </form>
    </div>
  )
}