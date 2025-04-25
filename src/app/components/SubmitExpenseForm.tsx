// // File: src/app/components/SubmitExpenseForm.tsx
// 'use client'

// import React, { useState, ChangeEvent, FormEvent } from 'react'
// import { useAuth } from '../../context/AuthContext'
// import { useExpenses, Expense } from '../../context/ExpensesContext'
// import { db } from '../../app/firebase/firebaseConfig'
// import { collection, addDoc, Timestamp } from 'firebase/firestore'

// interface SubmitExpenseFormProps {
//   onAddExpense?: (data: Omit<Expense, 'id' | 'status' | 'submittedAt' | 'uid'>) => void
// }

// export default function SubmitExpenseForm({ onAddExpense }: SubmitExpenseFormProps) {
//   const { user } = useAuth()
//   const { addExpense } = useExpenses()
//   const [mode, setMode] = useState<'form' | 'upload'>('form')
//   const [form, setForm] = useState({ amount: '', category: '', date: '', description: '' })
//   const [file, setFile] = useState<File | null>(null)
//   const [success, setSuccess] = useState(false)
//   const [error, setError] = useState<string | null>(null)

//   // Manual form inputs
//   const handleInput = (
//     e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
//   ) => {
//     const { name, value } = e.target
//     setForm(prev => ({ ...prev, [name]: value }))
//   }

//   // File selector
//   const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
//     setFile(e.target.files?.[0] ?? null)
//   }

//   // Submit manual entry
//   const submitManual = async (e: FormEvent) => {
//     e.preventDefault()
//     if (!user) return setError('Login required')
//     setError(null)
//     const amountNum = parseFloat(form.amount)
//     if (isNaN(amountNum)) return setError('Valid amount required')
//     const payload: Omit<Expense, 'id' | 'status' | 'submittedAt' | 'uid'> = {
//       amount: amountNum,
//       category: form.category,
//       date: form.date,
//       description: form.description,
//     }
//     try {
//       console.log('Adding manual expense payload:', payload)
//       await addDoc(collection(db, 'expenses'), {
//         uid: user.uid,
//         ...payload,
//         submittedAt: Timestamp.now(),
//         status: 'Pending',
//         rejectionComment: ''
//       })
//       addExpense(payload)
//       setSuccess(true)
//       setForm({ amount: '', category: '', date: '', description: '' })
//       setTimeout(() => setSuccess(false), 3000)
//     } catch (err) {
//       console.error('Manual submit error:', err)
//       setError('Submit failed')
//     }
//   }

//   // Submit file upload -> OCR -> Gemini
//   const submitUpload = async (e: FormEvent) => {
//     e.preventDefault()
//     if (!user) return setError('Login required')
//     if (!file) return setError('Select a file')
//     setError(null)
//     const reader = new FileReader()
//     reader.onload = async () => {
//       try {
//         const dataUrl = reader.result as string
//         const base64 = dataUrl.split(',')[1]
//         console.log('Uploading to Vision API, base64 length:', base64.length)

//         // Vision OCR
//         const visionRes = await fetch('/api/vision', {
//           method: 'POST',
//           headers: {'Content-Type':'application/json'},
//           body: JSON.stringify({ imageBase64: base64 })
//         })
//         console.log('Vision response status:', visionRes.status)
//         if (!visionRes.ok) {
//           const text = await visionRes.text()
//           console.error('Vision API error:', text)
//           return setError(`Vision API failed: ${visionRes.status}`)
//         }
//         const { ocrText } = await visionRes.json()
//         console.log('OCR text:', ocrText)

//         // Gemini parse
//         const geminiRes = await fetch('/api/gemini', {
//           method: 'POST',
//           headers: {'Content-Type':'application/json'},
//           body: JSON.stringify({ ocrText })
//         })
//         console.log('Gemini response status:', geminiRes.status)
//         if (!geminiRes.ok) {
//           const text = await geminiRes.text()
//           console.error('Gemini API error:', text)
//           return setError(`Parsing failed: ${geminiRes.status}`)
//         }
//         const { parsed } = await geminiRes.json()
//         console.log('Parsed result:', parsed)
//         if (!parsed) return setError('Parsing returned empty result')

//         // build payload
//         const amt = Number(parsed.total)
//         if (isNaN(amt)) return setError('Parsed total invalid')
//         const payload: Omit<Expense, 'id' | 'status' | 'submittedAt' | 'uid'> = {
//           amount: amt,
//           category: parsed.category || 'Other',
//           date: form.date || new Date().toISOString().split('T')[0],
//           description: parsed.items.map((i: any) => `${i.description}: $${i.price}`).join('; '),
//         }
//         console.log('Adding parsed expense payload:', payload)
//         // await addDoc(collection(db, 'expenses'), {
//         //   uid: user.uid,
//         //   ...payload,
//         //   submittedAt: Timestamp.now(),
//         //   status: 'Pending',
//         //   rejectionComment: ''
//         // })
//         addExpense(payload)
//         setSuccess(true)
//         setFile(null)
//         setTimeout(() => setSuccess(false), 3000)
//       } catch (err) {
//         console.error('File processing error:', err)
//         setError('File processing failed')
//       }
//     }
//     reader.readAsDataURL(file)
//   }

//   return (
//     <div className="bg-white p-6 rounded-lg shadow border border-gray-300 mb-6 text-gray-900">
//       <h2 className="text-xl font-semibold mb-4">Submit Expense</h2>
//       <div className="flex space-x-4 mb-6">
//         <button
//           onClick={() => setMode('form')}
//           className={mode === 'form' ? 'border-b-2 border-blue-700 pb-1 text-blue-700' : 'hover:text-gray-900'}
//         >
//           Manual Entry
//         </button>
//         <button
//           onClick={() => setMode('upload')}
//           className={mode === 'upload' ? 'border-b-2 border-blue-700 pb-1 text-blue-700' : 'hover:text-gray-900'}
//         >
//           Upload Receipt
//         </button>
//       </div>
//       {error && <p className="text-red-600 mb-2">{error}</p>}
//       {mode === 'form' ? (
//         <form onSubmit={submitManual} className="space-y-4">
//           {/* Manual fields... */}
//           <div>
//             <label className="block text-sm font-medium mb-1">Amount ($)</label>
//             <input type="number" name="amount" value={form.amount} onChange={handleInput} required step="0.01" className="w-full border p-2 rounded" />
//           </div>
//           <div>
//             <label className="block text-sm font-medium mb-1">Category</label>
//             <select name="category" value={form.category} onChange={handleInput} required className="w-full border p-2 rounded">
//               <option value="">Select…</option>
//               <option value="Travel">Travel</option>
//               <option value="Meals">Meals</option>
//               <option value="Office Supplies">Office Supplies</option>
//               <option value="Other">Other</option>
//             </select>
//           </div>
//           <div>
//             <label className="block text-sm font-medium mb-1">Date</label>
//             <input type="date" name="date" value={form.date} onChange={handleInput} required className="w-full border p-2 rounded" />
//           </div>
//           <div>
//             <label className="block text-sm font-medium mb-1">Description</label>
//             <textarea name="description" value={form.description} onChange={handleInput} rows={2} className="w-full border p-2 rounded" />
//           </div>
//           <button type="submit" className="bg-blue-700 text-white py-2 px-4 rounded hover:bg-blue-800">Submit</button>
//         </form>
//       ) : (
//         <form onSubmit={submitUpload} className="space-y-4">
//           <div>
//             <label className="block text-sm font-medium mb-1">Receipt Image</label>
//             <input type="file" accept="image/*" onChange={handleFileChange} className="w-full" />
//           </div>
//           <button type="submit" className="bg-blue-700 text-white py-2 px-4 rounded hover:bg-blue-800">Process Receipt</button>
//         </form>
//       )}
//       {success && <p className="text-green-700 mt-4">✅ Submitted!</p>}
//     </div>
//   )
// }


'use client'

import React, { useState, ChangeEvent, FormEvent } from 'react'
import { useAuth } from '../../context/AuthContext'
import { db } from '../firebase/firebaseConfig'
import { collection, addDoc, Timestamp } from 'firebase/firestore'

export default function SubmitExpenseForm() {
  const { user } = useAuth()
  const [mode, setMode] = useState<'form' | 'upload'>('form')
  const [form, setForm] = useState({ amount: '', category: '', date: '', description: '' })
  const [file, setFile] = useState<File | null>(null)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleInput = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] ?? null)
  }

  const submitManual = async (e: FormEvent) => {
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
      setForm({ amount: '', category: '', date: '', description: '' })
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error('Error adding expense:', err)
      setError('Failed to submit expense')
    }
  }

  const submitUpload = async (e: FormEvent) => {
    e.preventDefault()
    if (!user) return setError('Login required')
    if (!file) return setError('Select a file')
    setError(null)

    const reader = new FileReader()
    reader.onload = async () => {
      try {
        const dataUrl = reader.result as string
        const base64 = dataUrl.split(',')[1]

        // call Vision API
        const visionRes = await fetch('/api/vision', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64 })
        })
        if (!visionRes.ok) throw new Error(`Vision API: ${visionRes.status}`)
        const { ocrText } = await visionRes.json()

        // call Gemini parse
        const geminiRes = await fetch('/api/gemini', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ocrText })
        })
        if (!geminiRes.ok) throw new Error(`Parsing API: ${geminiRes.status}`)
        const { parsed } = await geminiRes.json()

        // build expense payload
        const amt = Number(parsed.total)
        if (isNaN(amt)) throw new Error('Parsed total invalid')

        const payload = {
          uid: user.uid,
          amount: amt,
          category: parsed.category || 'Other',
          date: form.date || new Date().toISOString().split('T')[0],
          description: parsed.items
            .map((i: any) => `${i.description}: $${i.price}`)
            .join('; '),
          submittedAt: Timestamp.now(),
          status: 'Pending',
          rejectionComment: ''
        }

        await addDoc(collection(db, 'expenses'), payload)
        setSuccess(true)
        setFile(null)
        setTimeout(() => setSuccess(false), 3000)
      } catch (err) {
        console.error('File processing error:', err)
        setError((err as Error).message)
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow border border-gray-300 mb-6 text-gray-900">
      <h2 className="text-xl font-semibold mb-4">Submit Expense</h2>

      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setMode('form')}
          className={mode === 'form' ? 'border-b-2 border-blue-700 pb-1 text-blue-700' : 'hover:text-gray-900'}
        >
          Manual Entry
        </button>
        <button
          onClick={() => setMode('upload')}
          className={mode === 'upload' ? 'border-b-2 border-blue-700 pb-1 text-blue-700' : 'hover:text-gray-900'}
        >
          Upload Receipt
        </button>
      </div>

      {mode === 'form' ? (
        <form onSubmit={submitManual} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Amount ($)</label>
            <input
              type="number"
              name="amount"
              value={form.amount}
              onChange={handleInput}
              required
              step="0.01"
              className="w-full border border-gray-400 p-2 rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select
              name="category"
              value={form.category}
              onChange={handleInput}
              required
              className="w-full border border-gray-400 p-2 rounded"
            >
              <option value="">Select…</option>
              <option value="Travel">Travel</option>
              <option value="Meals">Meals</option>
              <option value="Office Supplies">Office Supplies</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Date</label>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleInput}
              required
              className="w-full border border-gray-400 p-2 rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleInput}
              rows={2}
              className="w-full border border-gray-400 p-2 rounded"
              placeholder="Optional notes"
            />
          </div>
          <button
            type="submit"
            className="bg-blue-700 text-white py-2 px-4 rounded hover:bg-blue-800 transition"
          >
            Submit Manual
          </button>
        </form>
      ) : (
        <form onSubmit={submitUpload} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Receipt Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full"
            />
          </div>
          <button
            type="submit"
            className="bg-blue-700 text-white py-2 px-4 rounded hover:bg-blue-800 transition"
          >
            Upload Receipt
          </button>
        </form>
      )}

      {success && <p className="text-green-700 mt-4">✅ Submitted!</p>}
      {error && <p className="text-red-600 mt-2">{error}</p>}
    </div>
  )
}
