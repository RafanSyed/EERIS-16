'use client'
import Link from 'next/link'
import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useExpenses } from '../../context/ExpensesContext'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, Legend, LineChart, Line } from 'recharts'
import { useRouter } from 'next/navigation'

export default function ReportsPage() {
  const { user, logout, role, loading } = useAuth()
  const { expenses } = useExpenses()
  const router = useRouter()
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: '',
    category: ''
  })

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login')
    } else if (role === 'employee') {
      // List of supervisor-only pages and the root path
      const restrictedPages = ['/', '/supervisorDash', '/approve-expenses', '/supervisor-reports', '/user-management']
      if (restrictedPages.includes(window.location.pathname)) {
        router.replace('/dashboard')
      }
    }
  }, [user, loading, role, router])

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
      e.uid === user?.uid &&
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

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center print:hidden">
        <div className="flex space-x-6 items-center">
          {role === 'supervisor' && (
            <Link href="/" className="text-black hover:text-gray-900">
              Home
            </Link>
          )}
          <Link 
            href={role === 'supervisor' ? '/supervisorDash' : '/dashboard'} 
            className="text-black hover:text-gray-900"
          >
            Dashboard
          </Link>
          <Link href="/expenses" className="text-black hover:text-gray-900">
            My Expenses
          </Link>
          <Link 
            href="/reports" 
            className="text-blue-700 font-semibold hover:text-blue-900"
          >
            Report
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
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <div className="flex items-center space-x-4">
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

        {/* Print Header - Only visible when printing */}
        <div className="hidden print:block mb-8">
          <h1 className="text-3xl font-bold text-center mb-4">Expense Report Summary</h1>
          <div className="text-center mb-4">
            <p>Generated on: {new Date().toLocaleDateString()}</p>
            <p>Period: {filters.startDate || 'Start'} to {filters.endDate || 'End'}</p>
          </div>
        </div>

        {/* Print Summary Table - Only visible when printing */}
        <div className="hidden print:block mb-8">
          <h2 className="text-2xl font-semibold text-center mb-4">Expense Summary</h2>
          <table className="min-w-full border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-2">Category</th>
                <th className="border border-gray-300 px-4 py-2">Total Amount</th>
                <th className="border border-gray-300 px-4 py-2">Number of Expenses</th>
                <th className="border border-gray-300 px-4 py-2">Average Amount</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(categoryTotals).map(([category, total]) => {
                const categoryExpenses = filteredExpenses.filter(e => e.category === category)
                const count = categoryExpenses.length
                const average = count > 0 ? total / count : 0
                
                return (
                  <tr key={category}>
                    <td className="border border-gray-300 px-4 py-2">{category}</td>
                    <td className="border border-gray-300 px-4 py-2">${total.toFixed(2)}</td>
                    <td className="border border-gray-300 px-4 py-2">{count}</td>
                    <td className="border border-gray-300 px-4 py-2">${average.toFixed(2)}</td>
                  </tr>
                )
              })}
              <tr className="bg-gray-100 font-bold">
                <td className="border border-gray-300 px-4 py-2">Total</td>
                <td className="border border-gray-300 px-4 py-2">
                  ${filteredExpenses.reduce((sum, e) => sum + e.amount, 0).toFixed(2)}
                </td>
                <td className="border border-gray-300 px-4 py-2">{filteredExpenses.length}</td>
                <td className="border border-gray-300 px-4 py-2">
                  ${(filteredExpenses.reduce((sum, e) => sum + e.amount, 0) / (filteredExpenses.length || 1)).toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Status Summary Table - Only visible when printing */}
        <div className="hidden print:block mb-8">
          <h2 className="text-2xl font-semibold text-center mb-4">Status Summary</h2>
          <table className="min-w-full border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-2">Status</th>
                <th className="border border-gray-300 px-4 py-2">Count</th>
                <th className="border border-gray-300 px-4 py-2">Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {['Approved', 'Pending', 'Rejected'].map(status => {
                const statusExpenses = filteredExpenses.filter(e => e.status === status)
                const total = statusExpenses.reduce((sum, e) => sum + e.amount, 0)
                
                return (
                  <tr key={status}>
                    <td className="border border-gray-300 px-4 py-2">{status}</td>
                    <td className="border border-gray-300 px-4 py-2">{statusExpenses.length}</td>
                    <td className="border border-gray-300 px-4 py-2">${total.toFixed(2)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Filters - Hidden when printing */}
        <div className="bg-white p-6 rounded-lg shadow mb-6 print:hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

        {/* Charts - Hidden when printing */}
        <div className="space-y-6 print:hidden">
          {/* Top Row - Pie and Bar Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Expenses by Category</h2>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bar Chart */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Expenses Over Time</h2>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={filteredExpenses}>
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="amount" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Bottom Row - Line Chart */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Spending Trend</h2>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={filteredExpenses
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .map(e => ({ date: e.date, amount: e.amount }))}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
