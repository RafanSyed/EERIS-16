'use client'

import React from 'react'
import { useAuth } from '../../context/AuthContext'
import { useExpenses } from '../../context/ExpensesContext'

interface Filter {
  date: string
  category: string
  status: string
}

export default function ExpenseTable({ filter }: { filter: Filter }) {
  const { user } = useAuth()
  const { expenses } = useExpenses()
  const filtered = expenses.filter(
    e =>
      e.uid === user?.uid &&
      (!filter.date || e.date === filter.date) &&
      (!filter.category || e.category.toLowerCase().includes(filter.category.toLowerCase())) &&
      (!filter.status || e.status === filter.status)
  )

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow border border-gray-300 text-gray-900">
      {filtered.length === 0 ? (
        <div className="p-6 text-gray-700 text-center">No expenses to display</div>
      ) : (
        <table className="min-w-full text-left">
          <thead className="bg-gray-200">
            <tr>
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2">Category</th>
              <th className="px-4 py-2">Amount</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Description</th>
              <th className="px-4 py-2">Rejection Comment</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(e => (
              <tr key={e.id} className="border-t border-gray-300">
                <td className="px-4 py-2">{e.date}</td>
                <td className="px-4 py-2">{e.category}</td>
                <td className="px-4 py-2">${e.amount.toFixed(2)}</td>
                <td className="px-4 py-2">{e.status}</td>
                <td className="px-4 py-2">{e.description}</td>
                <td className="px-4 py-2 text-red-600">{e.status === 'Rejected' ? e.rejectionComment : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
)}
