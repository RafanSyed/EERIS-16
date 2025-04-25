// File: src/app/dashboard/page.tsx
'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getAuth, signOut } from 'firebase/auth'
import { app } from '../firebase/firebaseConfig'
import ExpenseSummary from '../components/ExpenseSummary'
import { useAuth } from '../../context/AuthContext'
import { useExpenses } from '../../context/ExpensesContext'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

export default function DashboardPage() {
  const { user, loading, role } = useAuth()
  const { expenses } = useExpenses()
  const router = useRouter()
  const auth = getAuth(app)
  const isSupervisor = role === 'supervisor'

  const [total, setTotal] = useState(0)
  const [pending, setPending] = useState(0)
  const [approved, setApproved] = useState(0)
  const [rejected, setRejected] = useState(0)

  // Logout handler
  const handleLogout = async () => {
    await signOut(auth)
    router.replace('/login')
  }

  // Expense summary stats
  useEffect(() => {
    if (!loading && user) {
      const userExpenses = expenses.filter(e => e.uid === user.uid)
      setTotal(userExpenses.length)
      setPending(userExpenses.filter(e => e.status === 'Pending').length)
      setApproved(userExpenses.filter(e => e.status === 'Approved').length)
      setRejected(userExpenses.filter(e => e.status === 'Rejected').length)
    }
  }, [expenses, user, loading])

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login')
      } else if (role === 'supervisor' && !window.location.search.includes('from=home')) {
        // Only redirect supervisors if they didn't explicitly navigate from home
        router.replace('/')
      }
    }
  }, [user, loading, role, router])

  // Pie chart data for approved expenses by category
  const categoryBreakdown =
    approved > 0
      ? expenses
          .filter(e => e.uid === user?.uid && e.status === 'Approved')
          .reduce((acc: Record<string, number>, curr) => {
            acc[curr.category] = (acc[curr.category] || 0) + curr.amount
            return acc
          }, {})
      : {}

  const pieData = Object.entries(categoryBreakdown)
    .filter(([_, value]) => value > 0) // Filter out categories with zero values
    .map(([name, value]) => ({ name, value }))
  const COLORS = ['#e63946', '#2a9d8f', '#f4a261', '#264653', '#a8dadc']

  if (loading) {
    return <div className="flex items-center justify-center h-screen text-gray-900">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <div className="flex space-x-6 items-center">
          {isSupervisor && (
            <Link href="/" className="text-gray-800 hover:text-gray-900">
              Home
            </Link>
          )}
          <Link href="/dashboard" className="text-blue-700 font-semibold hover:text-blue-900">
            Dashboard
          </Link>
          <Link href="/expenses" className="text-gray-800 hover:text-gray-900">
            My Expenses
          </Link>
          <Link href="/reports" className="text-gray-800 hover:text-gray-900">
            Report
          </Link>
        </div>
        <button
          onClick={handleLogout}
          className="text-red-600 hover:text-red-800 font-medium"
        >
          Logout
        </button>
      </nav>

      {/* Content */}
      <main className="max-w-5xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <ExpenseSummary title="Total Submitted" value={total} />
          <ExpenseSummary title="Pending" value={pending} />
          <ExpenseSummary title="Approved" value={approved} />
          <ExpenseSummary title="Rejected" value={rejected} />
        </div>

        {/* Category Pie Chart */}
        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Approved Expenses by Category</h2>
          <div className="bg-white p-4 rounded-lg shadow border border-gray-300 h-96">
            {pieData.length === 0 ? (
              <p className="text-gray-600 text-center mt-20">No approved expenses yet to visualize.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    paddingAngle={pieData.length > 1 ? 4 : 0}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`$${value}`, 'Amount']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        {/* Last Submission */}
        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Last Submission</h2>
          <div className="inline-block bg-white p-4 rounded-lg shadow border border-gray-300">
            {total > 0 ? (() => {
                const latest = expenses
                  .filter(e => e.uid === user!.uid)
                  .sort((a, b) => b.submittedAt.toDate().getTime() - a.submittedAt.toDate().getTime())[0]
                return latest ? (
                  <p className="text-lg text-gray-800">
                    Last expense submitted: ${latest.amount.toFixed(2)} on {latest.submittedAt.toDate().toLocaleDateString()}
                  </p>
                ) : (
                  <p className="text-lg text-gray-800">No recent submissions</p>
                )
            })() : (
              <p className="text-lg text-gray-800">No submissions yet</p>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
