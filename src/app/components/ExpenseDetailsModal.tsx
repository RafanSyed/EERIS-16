'use client'

import React, { useState } from 'react'
import { db } from '../firebase/firebaseConfig'
import { doc, updateDoc } from 'firebase/firestore'

const categories = [
  'Groceries',
  'Tech',
  'Fun',
  'Travel',
  'Market',
  'Office Supplies',
  'Meals',
  'Other'
]

export default function ExpenseDetailsModal({ expense, onClose }: { expense: any; onClose: () => void }) {
  if (!expense) return null

  const [editedExpense, setEditedExpense] = useState({ ...expense })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditable = expense.status === 'Pending'

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setEditedExpense((prev: any) => ({ ...prev, [name]: value }))
  }

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved':
        return (
          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
            Approved
          </span>
        )
      case 'Pending':
        return (
          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
            Pending
          </span>
        )
      case 'Rejected':
        return (
          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
            Rejected
          </span>
        )
      default:
        return <span>{status}</span>
    }
  }

  const handleSaveChanges = async () => {
    try {
      setSaving(true)
      setError(null)

      const expenseRef = doc(db, 'expenses', expense.id)
      await updateDoc(expenseRef, {
        merchant: editedExpense.merchant,
        amount: parseFloat(editedExpense.amount),
        category: editedExpense.category,
        date: editedExpense.date,
        description: editedExpense.description,
        status: 'Pending',
        rejectionComment: ''
      })

      onClose()
    } catch (err) {
      console.error(err)
      setError('Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Expense Details</h2>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800 text-xl font-bold"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 text-gray-800">
          <div>
            <label className="block font-semibold">Merchant</label>
            <input
              name="merchant"
              value={editedExpense.merchant}
              onChange={handleChange}
              className="w-full border p-2 rounded text-gray-900"
              readOnly={!isEditable}
            />
          </div>

          <div>
            <label className="block font-semibold">Amount</label>
            <input
              name="amount"
              type="number"
              step="0.01"
              value={editedExpense.amount}
              onChange={handleChange}
              className="w-full border p-2 rounded text-gray-900"
              readOnly={!isEditable}
            />
          </div>

          <div>
            <label className="block font-semibold">Category</label>
            <select
              name="category"
              value={editedExpense.category}
              onChange={handleChange}
              className="w-full border p-2 rounded text-gray-900"
              disabled={!isEditable}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold">Date</label>
            <input
              type="date"
              name="date"
              value={editedExpense.date}
              onChange={handleChange}
              className="w-full border p-2 rounded text-gray-900"
              readOnly={!isEditable}
            />
          </div>

          <div className="flex items-center space-x-2">
            <strong>Status:</strong> {renderStatusBadge(expense.status)}
          </div>

          {expense.rejectionComment && (
            <div>
              <label className="block font-semibold">Rejection Comment</label>
              <div className="border p-2 rounded text-gray-900 bg-gray-100">
                {expense.rejectionComment}
              </div>
            </div>
          )}

          <div>
            <label className="block font-semibold">Items</label>
            <textarea
              name="description"
              value={editedExpense.description}
              onChange={handleChange}
              className="w-full border p-2 rounded text-gray-900"
              rows={4}
              readOnly={!isEditable}
            />
          </div>

          {error && <p className="text-red-600">{error}</p>}

          <div className="flex justify-end mt-6 space-x-4">
            {isEditable ? (
              <button
                onClick={handleSaveChanges}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-400"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
