'use client'


import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import ExpenseTable from '../components/ExpenseTables'
import SubmitExpenseForm from '../components/SubmitExpenseForm'
import { useAuth } from '../../context/AuthContext'
import { useRouter } from 'next/navigation'
import { useExpenses } from '../../context/ExpensesContext'


export default function MyExpensesPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { expenses } = useExpenses()


  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login')
    }
  }, [user, loading, router])


  if (loading || !user) {
    return <div className="p-6 text-gray-900">Loading…</div>
  }


  const [filter, setFilter] = useState({
    startDate: '',
    endDate: '',
    description: '',
    status: '',
  })


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setFilter({ ...filter, [e.target.name]: e.target.value })


  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex space-x-6">
        <Link href="/dashboard" className="text-gray-800 hover:text-gray-900">
          Dashboard
        </Link>
        <Link href="/expenses" className="text-blue-700 font-semibold hover:text-blue-900">
          My Expenses
        </Link>
      </nav>


      <main className="max-w-5xl mx-auto p-6 space-y-8">
        <h1 className="text-3xl font-bold text-gray-900">My Expenses</h1>


        <SubmitExpenseForm />


        <div className="bg-white p-4 rounded-lg shadow border border-gray-300 grid grid-cols-1 md:grid-cols-4 gap-4 text-gray-900">
          <input
            type="date"
            name="startDate"
            value={filter.startDate}
            onChange={handleChange}
            className="border border-gray-400 p-2 rounded"
            placeholder="Start date"
          />
          <input
            type="date"
            name="endDate"
            value={filter.endDate}
            onChange={handleChange}
            className="border border-gray-400 p-2 rounded"
            placeholder="End date"
          />
          <input
            type="text"
            name="description"
            value={filter.description}
            onChange={handleChange}
            className="border border-gray-400 p-2 rounded"
            placeholder="Search description"
          />
          <select
            name="status"
            value={filter.status}
            onChange={handleChange}
            className="border border-gray-400 p-2 rounded"
          >
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>


        <ExpenseTable filter={filter} />
      </main>
    </div>
  )
}



