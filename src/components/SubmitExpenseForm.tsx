'use client'

import React, { useState, ChangeEvent, FormEvent } from 'react'
import { db } from '../app/firebase/firebaseConfig'
import { collection, addDoc, Timestamp } from 'firebase/firestore'

interface SubmitExpenseFormProps {
  onAddExpense?: (data: any) => void
}

export default function SubmitExpenseForm({ onAddExpense }: SubmitExpenseFormProps) {
  const [form, setForm] = useState({ amount: '', category: '', date: '', description: '' })
  const [success, setSuccess] = useState(false)

  const handleInput = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const amountNum = parseFloat(form.amount)

    if (isNaN(amountNum)) {
      alert('Please enter a valid amount')
      return
    }

    const expenseData = {
      amount: amountNum,
      category: form.category,
      date: form.date,
      description: form.description,
      submittedAt: Timestamp.now(),
      status: 'Pending',
    }

    try {
      await addDoc(collection(db, 'expenses'), expenseData)
      if (onAddExpense) onAddExpense(expenseData)
      setSuccess(true)
      setForm({ amount: '', category: '', date: '', description: '' })
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error("Error adding expense: ", err)
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow border border-gray-300 mb-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Submit Expense</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-1">Amount ($)</label>
          <input type="number" name="amount" value={form.amount} onChange={handleInput} required className="w-full border p-2 rounded" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-1">Category</label>
          <select name="category" value={form.category} onChange={handleInput} required className="w-full border p-2 rounded">
            <option value="">Select…</option>
            <option value="Travel">Travel</option>
            <option value="Meals">Meals</option>
            <option value="Office Supplies">Office Supplies</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-1">Date</label>
          <input type="date" name="date" value={form.date} onChange={handleInput} required className="w-full border p-2 rounded" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-1">Description</label>
          <textarea name="description" value={form.description} onChange={handleInput} rows={2} className="w-full border p-2 rounded" />
        </div>
        <button type="submit" className="bg-blue-700 text-white py-2 px-4 rounded hover:bg-blue-800 transition">
          Submit
        </button>
        {success && <p className="text-green-700 mt-2">✅ Submitted!</p>}
      </form>
    </div>
  )
}
