'use client'

import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useExpenses } from '../../context/ExpensesContext'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, Legend, LineChart, Line } from 'recharts'

export default function ReportsPage() {
  const { user } = useAuth()
  const { expenses } = useExpenses()
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: '',
    category: ''
  })

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

  const pieData = Object.entries(categoryTotals).map(([name, value]) => ({ name, value }))

  const COLORS = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6']

  return (
    <div className="min-h-screen bg-gray-100 p-6 text-gray-900">
      <h1 className="text-3xl font-bold mb-6">Detailed Reports</h1>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded shadow mb-8">
        <input name="startDate" type="date" value={filters.startDate} onChange={handleChange} className="border p-2 rounded" />
        <input name="endDate" type="date" value={filters.endDate} onChange={handleChange} className="border p-2 rounded" />
        <select name="status" value={filters.status} onChange={handleChange} className="border p-2 rounded">
          <option value="">All Statuses</option>
          <option value="Approved">Approved</option>
          <option value="Pending">Pending</option>
          <option value="Rejected">Rejected</option>
        </select>
        <input name="category" placeholder="Category" value={filters.category} onChange={handleChange} className="border p-2 rounded" />
      </div>

      {/* Pie Chart */}
      <section className="bg-white p-6 rounded-lg shadow mb-10">
        <h2 className="text-2xl font-semibold mb-4">Category Breakdown</h2>
        {pieData.length === 0 ? (
          <p className="text-gray-600">No data available for this filter.</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                paddingAngle={4}
                label
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </section>

      {/* Bar Chart */}
      <section className="bg-white p-6 rounded-lg shadow mb-10">
        <h2 className="text-2xl font-semibold mb-4">Amount per Category</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={pieData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#3B82F6" />
          </BarChart>
        </ResponsiveContainer>
      </section>

      {/* Line Chart */}
      <section className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-semibold mb-4">Spending Over Time</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={filteredExpenses.map(e => ({ date: e.date, amount: e.amount }))}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="amount" stroke="#10B981" />
          </LineChart>
        </ResponsiveContainer>
      </section>
    </div>
  )
}
