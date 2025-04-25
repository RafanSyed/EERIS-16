'use client'

import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useExpenses } from '../../context/ExpensesContext'
import ExpenseDetailsModal from './ExpenseDetailsModal'

interface Filter {
  startDate: string
  endDate: string
  description: string
  status: string
  employee: string
}

interface Expense {
  id: string
  uid: string
  merchant: string
  amount: number
  category: string
  date: string
  status: string
  description: string
  rejectionComment?: string
}

export default function ExpenseTable({ filter }: { filter: Filter }) {
  const { user } = useAuth()
  const { expenses } = useExpenses()
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)

  const filtered = expenses.filter(e => {
    const d = new Date(e.date)
    const start = filter.startDate ? new Date(filter.startDate) : null
    const end = filter.endDate ? new Date(filter.endDate) : null
    return (
      (!filter.employee || e.uid === filter.employee) &&
      (!start || d >= start) &&
      (!end || d <= end) &&
      (!filter.description ||
        e.description.toLowerCase().includes(filter.description.toLowerCase())) &&
      (!filter.status || e.status === filter.status)
    )
  })

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
    <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-300">
      {filtered.length === 0 ? (
        <p className="text-gray-700">No expenses found.</p>
      ) : (
        <table className="min-w-full text-left text-gray-900">
          <thead className="bg-gray-300">
            <tr>
              <th className="px-4 py-2 text-gray-700 font-medium">Date</th>
              <th className="px-4 py-2 text-gray-700 font-medium">Category</th>
              <th className="px-4 py-2 text-gray-700 font-medium">Amount</th>
              <th className="px-4 py-2 text-gray-700 font-medium">Status</th>
              <th className="px-4 py-2 text-gray-700 font-medium">Merchant</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(e => (
              <tr
                key={e.id}
                className="border-t border-gray-300 hover:bg-gray-100 cursor-pointer"
                onClick={() => setSelectedExpense(e)}
              >
                <td className="px-4 py-2 text-gray-900">{e.date}</td>
                <td className="px-4 py-2 text-gray-900">{e.category}</td>
                <td className="px-4 py-2 text-gray-900">${e.amount.toFixed(2)}</td>
                <td className="px-4 py-2">
                  {renderStatusBadge(e.status)}
                </td>
                <td className="px-4 py-2 text-gray-900">{e.merchant}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <ExpenseDetailsModal
        expense={selectedExpense}
        onClose={() => setSelectedExpense(null)}
      />
    </div>
  )
}