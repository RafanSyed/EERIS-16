'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import ExpenseTable from '../components/ExpenseTables'
import SubmitExpenseForm from '../components/SubmitExpenseForm'

import { useAuth } from '../../context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

// Define the shape of an expense
interface Expense {
  id: number
  date: string
  category: string
  amount: number
  status: string
}

export default function MyExpensesPage() {

  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login')
    }
  }, [user, loading, router])

  if (loading || !user) {
    return <p className="p-6">Loading…</p>
  }
  const [filter, setFilter] = useState({ date: '', category: '', status: '' })
  const [expenses, setExpenses] = useState<Expense[]>([])

  // Handle filter input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFilter({ ...filter, [e.target.name]: e.target.value })
  }

  // Callback to add a new expense from the form
  const handleAddExpense = (expenseData: Omit<Expense, 'id' | 'status'>) => {
    setExpenses((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        status: 'Pending',
        ...expenseData,
      },
    ])
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex space-x-6">
        <Link href="/dashboard" className="text-gray-800 hover:text-gray-900">
          Dashboard
        </Link>
        <Link
          href="/expenses"
          className="text-blue-700 font-semibold hover:text-blue-900"
        >
          My Expenses
        </Link>
      </nav>

      {/* Content */}
      <main className="max-w-5xl mx-auto p-6 space-y-8">
        <h1 className="text-3xl font-bold text-gray-900">My Expenses</h1>

        {/* Submit Expense Form */}
        <SubmitExpenseForm onAddExpense={handleAddExpense} />

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow border border-gray-300 grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="date"
            name="date"
            value={filter.date}
            onChange={handleChange}
            className="border border-gray-400 p-2 rounded focus:border-blue-600 focus:ring focus:ring-blue-200"
          />
          <input
            type="text"
            name="category"
            value={filter.category}
            onChange={handleChange}
            className="border border-gray-400 p-2 rounded focus:border-blue-600 focus:ring focus:ring-blue-200"
          />
          <select
            name="status"
            value={filter.status}
            onChange={handleChange}
            className="border border-gray-400 p-2 rounded focus:border-blue-600 focus:ring focus:ring-blue-200"
          >
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        {/* Current Expenses Table */}
        <ExpenseTable filter={filter} data={expenses} />
      </main>
    </div>
  )
}
