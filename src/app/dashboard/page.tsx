'use client'
import React from 'react'
import Link from 'next/link'
import ExpenseSummary from '../components/ExpenseSummary'

export default function DashboardPage() {
  // Initial state is empty
  const total = 0
  const pending = 0
  const approved = 0
  const rejected = 0

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
            {/* Chart will populate when data exists */}
            <span>No data to display</span>
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Last Submission</h2>
          <div className="inline-block bg-white p-4 rounded-lg shadow border border-gray-300">
            <p className="text-lg text-gray-800">No submissions yet</p>
          </div>
        </section>
      </main>
    </div>
  )
}
