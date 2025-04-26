'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getAuth, signOut } from 'firebase/auth'
import { getFirestore, doc, getDoc } from 'firebase/firestore'
import { app } from '../firebase/firebaseConfig'
import { useAuth } from '../../context/AuthContext'
import { useExpenses } from '../../context/ExpensesContext'
import ExpenseTable from '../components/ExpenseTables'

const db = getFirestore(app)


export default function SupervisorDashboardPage() {
  const { user, loading } = useAuth()
  const { expenses } = useExpenses()
  const router = useRouter()
  const auth = getAuth(app)

  const [filter, setFilter] = useState({
    startDate: '',
    endDate: '',
    description: '',
    status: '',
    employee: '',
  })
  const [userNames, setUserNames] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    const fetchUserNames = async () => {
      const uniqueUids = Array.from(new Set(expenses.map(e => e.uid)))

      const names: Record<string, string> = {}
      for (const uid of uniqueUids) {
        try {
          const userDoc = await getDoc(doc(db, 'users', uid))
          names[uid] = userDoc.data()?.fullName || 'User'
        } catch {
          names[uid] = 'User'
        }
      }
      setUserNames(names)
    }

    if (expenses.length > 0) {
      fetchUserNames()
    }
  }, [expenses])

  const handleLogout = async () => {
    await signOut(auth)
    router.replace('/login')
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setFilter({ ...filter, [e.target.name]: e.target.value })

  const employeeUids = [...new Set(expenses.map(expense => expense.uid))]

  if (loading || !user) {
    return <div className="p-6 text-gray-900">Loading…</div>
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <div className="flex space-x-6 items-center">
          <Link href="/" className="text-gray-800 hover:text-gray-900">
            Home
          </Link>
          <Link href="/supervisorDash" className="text-blue-700 font-semibold hover:text-blue-900">
            Supervisor Dashboard
          </Link>
          <Link href="/approve-expenses" className="text-gray-800 hover:text-gray-900">
            Approve Expenses
          </Link>
          <Link href="/user-management" className="text-gray-800 hover:text-gray-900">
            User Management
          </Link>
        </div>
        <button
          onClick={handleLogout}
          className="text-red-600 hover:text-red-800 font-medium"
        >
          Logout
        </button>
      </nav>

      <main className="max-w-5xl mx-auto p-6 space-y-8">
        <h1 className="text-3xl font-bold text-gray-900">Supervisor Dashboard</h1>

        <div className="bg-white p-4 rounded-lg shadow border border-gray-300 grid grid-cols-1 md:grid-cols-5 gap-4 text-gray-900">
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
          <select
            name="employee"
            value={filter.employee}
            onChange={handleChange}
            className="border border-gray-400 p-2 rounded"
          >
            <option value="">All Employees</option>
            {employeeUids.map((uid, index) => (
              <option key={`${uid}-${index}`} value={uid}>
                {userNames[uid] || 'User'}
              </option>
            ))}
          </select>
        </div>

        <ExpenseTable filter={filter} />
      </main>
    </div>
  )
}
