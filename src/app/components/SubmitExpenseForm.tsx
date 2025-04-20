'use client'

import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react'
import { db } from '../firebase/firebaseConfig'
import { collection, addDoc, getDocs, updateDoc, doc, Timestamp } from 'firebase/firestore'

interface Expense {
  id: string
  amount: number
  category: string
  date: string
  description: string
  status: string
  rejectionComment?: string // added field
}

export default function SubmitExpenseWithEdit() {
  const [form, setForm] = useState({ amount: '', category: '', date: '', description: '' })
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [editId, setEditId] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [success, setSuccess] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const handleInput = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const fetchExpenses = async () => {
    const snapshot = await getDocs(collection(db, 'expenses'))
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense))
    setExpenses(data)
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
      setSuccess(true)
      setForm({ amount: '', category: '', date: '', description: '' })
      fetchExpenses()
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error('Error adding expense:', err)
    }
  }

  const startEdit = (expense: Expense) => {
    if (expense.status !== 'Pending') {
      alert('Only pending expenses can be edited')
      return
    }

    setEditId(expense.id)
    setForm({
      amount: expense.amount.toString(),
      category: expense.category,
      date: expense.date,
      description: expense.description,
    })
    setShowModal(true)
  }

  const saveChanges = async () => {
    if (!editId) return

    const updated = {
      amount: parseFloat(form.amount),
      category: form.category,
      date: form.date,
      description: form.description,
    }

    try {
      await updateDoc(doc(db, 'expenses', editId), updated)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2500)
      setEditId(null)
      setShowModal(false)
      setForm({ amount: '', category: '', date: '', description: '' })
      fetchExpenses()
    } catch (err) {
      console.error('Error updating expense:', err)
    }
  }

  useEffect(() => {
    fetchExpenses()
  }, [])

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Submit Expense Form */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-300 mb-6 text-gray-900">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Submit Expense</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="number"
            name="amount"
            placeholder="Amount"
            value={form.amount}
            onChange={handleInput}
            required
            className="w-full border p-2 rounded"
          />
          <select
            name="category"
            value={form.category}
            onChange={handleInput}
            required
            className="w-full border p-2 rounded"
          >
            <option value="">Select category…</option>
            <option value="Travel">Travel</option>
            <option value="Meals">Meals</option>
            <option value="Office Supplies">Office Supplies</option>
            <option value="Other">Other</option>
          </select>
          <input
            type="date"
            name="date"
            value={form.date}
            onChange={handleInput}
            required
            className="w-full border p-2 rounded"
          />
          <textarea
            name="description"
            placeholder="Description"
            value={form.description}
            onChange={handleInput}
            rows={2}
            className="w-full border p-2 rounded"
          />
          <button type="submit" className="bg-blue-700 text-white py-2 px-4 rounded hover:bg-blue-800 transition">
            Submit
          </button>
          {success && <p className="text-green-700 mt-2">✅ Submitted!</p>}
        </form>
      </div>

      {/* Expenses List */}
      <div className="bg-white p-4 rounded-lg shadow border border-gray-300 text-gray-900">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">My Expenses</h2>
        {expenses.map(exp => (
          <div key={exp.id} className="border-t pt-3 mb-3">
            <p><strong>Amount:</strong> ${exp.amount}</p>
            <p><strong>Category:</strong> {exp.category}</p>
            <p><strong>Date:</strong> {exp.date}</p>
            <p><strong>Description:</strong> {exp.description}</p>
            <p><strong>Status:</strong> {exp.status}</p>
            {/* Show comment if rejected */}
            {exp.status === 'Rejected' && exp.rejectionComment && (
              <p className="text-red-600"><strong>Comment:</strong> {exp.rejectionComment}</p>
            )}
            {exp.status === 'Pending' && (
              <button onClick={() => startEdit(exp)} className="mt-2 text-sm text-blue-600 underline">Edit</button>
            )}
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Edit Expense</h2>
            {saveSuccess && (
              <div className="mb-3 text-green-700 font-medium bg-green-100 border border-green-300 rounded p-2 text-center">
                ✅ Changes saved successfully!
              </div>
            )}
            <input
              type="number"
              name="amount"
              placeholder="Amount"
              value={form.amount}
              onChange={handleInput}
              required
              className="w-full border p-2 mb-2 rounded"
            />
            <select
              name="category"
              value={form.category}
              onChange={handleInput}
              required
              className="w-full border p-2 mb-2 rounded"
            >
              <option value="">Select category…</option>
              <option value="Travel">Travel</option>
              <option value="Meals">Meals</option>
              <option value="Office Supplies">Office Supplies</option>
              <option value="Other">Other</option>
            </select>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleInput}
              required
              className="w-full border p-2 mb-2 rounded"
            />
            <textarea
              name="description"
              placeholder="Description"
              value={form.description}
              onChange={handleInput}
              rows={2}
              className="w-full border p-2 mb-4 rounded"
            />
            <div className="flex justify-end space-x-2">
              <button onClick={saveChanges} className="bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-800">Save</button>
              <button onClick={() => setShowModal(false)} className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
