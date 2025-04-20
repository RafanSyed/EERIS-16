'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import ExpenseSummary from '../components/ExpenseSummary'
import { useAuth } from '../../context/AuthContext'
import { useExpenses } from '../../context/ExpensesContext'

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const { expenses } = useExpenses()
  const [total, setTotal] = useState(0)
  const [pending, setPending] = useState(0)
  const [approved, setApproved] = useState(0)
  const [rejected, setRejected] = useState(0)

  // Update summary when expenses or user changes
  useEffect(() => {
    if (!loading && user) {
      // Only include expenses belonging to current user
      const userExpenses = expenses.filter(e => e.uid === user.uid)
      setTotal(userExpenses.length)
      setPending(userExpenses.filter(e => e.status === 'Pending').length)
      setApproved(userExpenses.filter(e => e.status === 'Approved').length)
      setRejected(userExpenses.filter(e => e.status === 'Rejected').length)
    }
  }, [expenses, user, loading])

  if (loading) {
    return <div className="flex items-center justify-center h-screen text-gray-900">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex space-x-6">
        <Link href="/dashboard" className="text-blue-700 font-semibold hover:text-blue-900">
          Dashboard
        </Link>
        <Link href="/expenses" className="text-gray-800 hover:text-gray-900">
          My Expenses
        </Link>
      </nav>

      {/* Content */}
      <main className="max-w-5xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <ExpenseSummary title="Total Submitted" value={total} />
          <ExpenseSummary title="Pending" value={pending} />
          <ExpenseSummary title="Approved" value={approved} />
          <ExpenseSummary title="Rejected" value={rejected} />
        </div>

        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Category Breakdown</h2>
          <div className="h-64 bg-white rounded-lg shadow border border-gray-300 flex items-center justify-center text-gray-600">
            {/* Chart placeholder */}
            <span>No data to display</span>
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Last Submission</h2>
          <div className="inline-block bg-white p-4 rounded-lg shadow border border-gray-300">
            {total > 0 ? (
              <p className="text-lg text-gray-800">
                Last expense submitted: <span className="font-medium text-gray-900">${expenses.filter(e => e.uid === user!.uid).slice(-1)[0].amount.toFixed(2)}</span>
              </p>
            ) : (
              <p className="text-lg text-gray-800">No submissions yet</p>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}