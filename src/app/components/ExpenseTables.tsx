'use client'
import React from 'react'

interface Expense {
  id: number
  date: string
  category: string
  amount: number
  status: string
}

interface ExpenseTableProps {
  filter: {
    date: string
    category: string
    status: string
  }
  data: Expense[]
}

export default function ExpenseTable({ filter, data }: ExpenseTableProps) {
  const filtered = data.filter(
    (e) =>
      (!filter.date || e.date === filter.date) &&
      (!filter.category || e.category.toLowerCase().includes(filter.category.toLowerCase())) &&
      (!filter.status || e.status === filter.status)
  )

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow border border-gray-300">
      {filtered.length === 0 ? (
        <div className="p-6 text-gray-600 text-center">No expenses to display</div>
      ) : (
        <table className="min-w-full text-left">
          <thead className="bg-gray-200">
            <tr>
              <th className="px-4 py-2 text-gray-700">Date</th>
              <th className="px-4 py-2 text-gray-700">Category</th>
              <th className="px-4 py-2 text-gray-700">Amount</th>
              <th className="px-4 py-2 text-gray-700">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((e) => (
              <tr key={e.id} className="border-t border-gray-300">
                <td className="px-4 py-2 text-gray-800">{e.date}</td>
                <td className="px-4 py-2 text-gray-800">{e.category}</td>
                <td className="px-4 py-2 text-gray-800">${e.amount.toFixed(2)}</td>
                <td className="px-4 py-2 text-gray-800">{e.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
)}
