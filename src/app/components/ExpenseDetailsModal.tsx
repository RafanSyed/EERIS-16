'use client'

import React from 'react'

export default function ExpenseDetailsModal({ expense, onClose }: { expense: any; onClose: () => void }) {
  if (!expense) return null

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

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-2xl w-full mx-4">
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
          <div><strong>Merchant:</strong> {expense.merchant}</div>
          <div><strong>Amount:</strong> ${expense.amount.toFixed(2)}</div>
          <div><strong>Category:</strong> {expense.category}</div>
          <div><strong>Date:</strong> {expense.date}</div>
          <div className="flex items-center space-x-2">
            <strong>Status:</strong> {renderStatusBadge(expense.status)}
          </div>
          {expense.rejectionComment && (
            <div className="text-red-600">
              <strong>Rejection Comment:</strong> {expense.rejectionComment}
            </div>
          )}
          <div>
            <strong>Items:</strong>
            <ul className="list-disc list-inside mt-2">
              {expense.description.split(';').map((item: string, index: number) => (
                <li key={index} className="text-gray-700">{item.trim()}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
