'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import ExpenseSummary from '../components/ExpenseSummary'
import { db } from '../firebase/firebaseConfig'
import { collection, getDocs } from 'firebase/firestore'

interface Expense {
  status: 'Pending' | 'Approved' | 'Rejected'
  amount: number
}

export default function DashboardPage() {
  const [isClient, setIsClient] = useState(false)
  const [total, setTotal] = useState(0)
  const [pending, setPending] = useState(0)
  const [approved, setApproved] = useState(0)
  const [rejected, setRejected] = useState(0)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'expenses'))
        let total = 0
        let pending = 0
        let approved = 0
        let rejected = 0

        snapshot.forEach(doc => {
          const data = doc.data() as Expense
          total += 1
          if (data.status === 'Pending') pending++
          else if (data.status === 'Approved') approved++
          else if (data.status === 'Rejected') rejected++
        })

        setTotal(total)
        setPending(pending)
        setApproved(approved)
        setRejected(rejected)
      } catch (error) {
        console.error('Error fetching expenses:', error)
      }
    }

    fetchExpenses()
  }, [])

  if (!isClient) return null

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
