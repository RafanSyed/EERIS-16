'use client'
import Link from 'next/link'
import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useExpenses } from '../../context/ExpensesContext'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, Legend, LineChart, Line } from 'recharts'
import { useRouter } from 'next/navigation'
import { collection, query, where, getDocs, updateDoc, Timestamp } from 'firebase/firestore'
import { db } from '../firebase/firebaseConfig'

export default function SupervisorReportsPage() {
  const { user, logout, role, loading } = useAuth()
  const { expenses } = useExpenses()
  const router = useRouter()
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: '',
    category: '',
    employeeId: ''
  })
  const [processing, setProcessing] = useState(false)
  const [processResult, setProcessResult] = useState<{ count: number; total: number } | null>(null)
  const [employeeIds, setEmployeeIds] = useState<string[]>([])

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login')
    } else if (role !== 'supervisor') {
      router.replace('/dashboard')
    }
  }, [user, loading, role, router])

  useEffect(() => {
    // Get unique employee IDs from expenses
    const ids = [...new Set(expenses.map(e => e.uid))]
    setEmployeeIds(ids)
  }, [expenses])

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/login')
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value })
  }

  const filteredExpenses = expenses.filter(e => {
    const d = new Date(e.date)
    const start = filters.startDate ? new Date(filters.startDate) : null
    const end = filters.endDate ? new Date(filters.endDate) : null
    return (
      (!filters.employeeId || e.uid === filters.employeeId) &&
      (!start || d >= start) &&
      (!end || d <= end) &&
      (!filters.status || e.status === filters.status) &&
      (!filters.category || e.category === filters.category)
    )
  })

  const categoryTotals = filteredExpenses.reduce((acc: Record<string, number>, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount
    return acc
  }, {})

  const pieData = Object.entries(categoryTotals)
    .filter(([_, value]) => value > 0)
    .map(([name, value]) => ({ name, value }))

  const COLORS = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6']

  const handleProcessPayments = async () => {
    try {
      setProcessing(true)
      setProcessResult(null)

      // Query for approved, unpaid expenses
      const q = query(
        collection(db, 'expenses'),
        where('status', '==', 'Approved'),
        where('paid', '!=', true)
      )

      const snapshot = await getDocs(q)
      let totalAmount = 0
      let processedCount = 0

      // Process each expense
      for (const doc of snapshot.docs) {
        const expense = doc.data()
        await updateDoc(doc.ref, {
          paid: true,
          paidAt: Timestamp.now()
        })
        totalAmount += expense.amount
        processedCount++
      }

      setProcessResult({
        count: processedCount,
        total: totalAmount
      })
    } catch (error) {
      console.error('Error processing payments:', error)
      alert('Error processing payments. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center print:hidden">
        <div className="flex space-x-6 items-center">
          <Link href="/" className="text-black hover:text-gray-900">
            Home
          </Link>
          <Link href="/supervisorDash" className="text-black hover:text-gray-900">
            Dashboard
          </Link>
          <Link href="/expenses" className="text-black hover:text-gray-900">
            My Expenses
          </Link>
          <Link href="/supervisor-reports" className="text-blue-700 font-semibold hover:text-blue-900">
            Summary Report
          </Link>
          <Link href="/approve-expenses" className="text-black hover:text-gray-900">
            Approve Expenses
          </Link>
        </div>
        <button
          onClick={handleLogout}
          className="text-black hover:text-gray-900 transition-colors"
        >
          Logout
        </button>
      </nav>

      <main className="max-w-5xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Supervisor Reports</h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleProcessPayments}
              disabled={processing}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:bg-green-400 flex items-center space-x-2 font-medium"
            >
              {processing ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  <span>Process Approved Payments</span>
                </>
              )}
            </button>
            <button
              onClick={() => window.print()}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 print:hidden flex items-center space-x-2 font-medium"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
              </svg>
              <span>Print Report</span>
            </button>
          </div>
        </div>

        {/* Process Result Message */}
        {processResult && (
          <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            <div className="flex items-center">
              <svg className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p>
                ✅ {processResult.count} reports processed. Total paid: ${processResult.total.toFixed(2)}
              </p>
            </div>
          </div>
        )}

        {/* Print Header - Only visible when printing */}
        <div className="hidden print:block mb-8">
          <h1 className="text-3xl font-bold text-center mb-4">Supervisor Expense Report Summary</h1>
          <div className="text-center mb-4">
            <p>Generated on: {new Date().toLocaleDateString()}</p>
            <p>Period: {filters.startDate || 'Start'} to {filters.endDate || 'End'}</p>
            {filters.employeeId && <p>Employee: {filters.employeeId}</p>}
          </div>
        </div>

        {/* Filters - Hidden when printing */}
        <div className="bg-white p-6 rounded-lg shadow mb-6 print:hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
              <select
                name="employeeId"
                value={filters.employeeId}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              >
                <option value="">All Employees</option>
                {employeeIds.map((id, index) => (
                  <option key={`${id}-${index}`} value={id}>{id}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                name="status"
                value={filters.status}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              >
                <option value="">All Statuses</option>
                <option value="Approved">Approved</option>
                <option value="Pending">Pending</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                name="category"
                value={filters.category}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              >
                <option value="">All Categories</option>
                <option value="Travel">Travel</option>
                <option value="Meals">Meals</option>
                <option value="Office Supplies">Office Supplies</option>
                <option value="Equipment">Equipment</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Rest of the charts and tables remain the same */}
        {/* ... */}
      </main>
    </div>
  )
} 