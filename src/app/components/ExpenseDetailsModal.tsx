'use client'

import React from 'react'

export default function ExpenseDetailsModal({ expense, onClose }: { expense: any; onClose: () => void }) {
  if (!expense) return null
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full">
        <h2 className="text-xl font-semibold mb-4">Expense Details</h2>
        <p><strong>Merchant:</strong> {expense.merchant}</p>
        <p><strong>Amount:</strong> ${expense.amount.toFixed(2)}</p>
        <p><strong>Category:</strong> {expense.category}</p>
        <p><strong>Date:</strong> {expense.date}</p>
        <p><strong>Status:</strong> {expense.status}</p>
        {expense.rejectionComment && (
          <p className="text-red-600">
            <strong>Rejection Comment:</strong> {expense.rejectionComment}
          </p>
        )}
        <div className="mt-4">
          <strong>Description:</strong>
          <p className="mt-1 whitespace-pre-wrap bg-gray-50 p-2 rounded">
            {expense.description}
          </p>
        </div>
        <button
          onClick={onClose}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Close
        </button>
      </div>
    </div>
  )
}