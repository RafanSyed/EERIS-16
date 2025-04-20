// File: src/app/supervisorDash/page.tsx
'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getAuth, signOut } from 'firebase/auth'
import { getFirestore, collection, getDocs, updateDoc, doc, query, where } from 'firebase/firestore'
import { app } from '../firebase/firebaseConfig'
import { useAuth } from '../../context/AuthContext'

const db = getFirestore(app)

interface Expense {
  id: string
  employeeName: string
  amount: number
  category: string
  date: string
  status: string
  rejectionComment?: string
}

export default function SupervisorDashboard() {
  const { user, role, loading } = useAuth()
  const router = useRouter()
  const auth = getAuth(app)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [currentRejectId, setCurrentRejectId] = useState<string | null>(null)
  const [rejectComment, setRejectComment] = useState('')

  // Logout handler
  const handleLogout = async () => {
    await signOut(auth)
    router.replace('/login')
  }

  // Redirect non‑supervisors
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login')
      } else if (role !== 'supervisor') {
        router.replace('/dashboard')
      }
    }
  }, [user, role, loading, router])

  // Fetch only if supervisor
  const fetchExpenses = async () => {
    const q = query(collection(db, 'expenses'), where('status', '==', 'Pending'))
    const querySnapshot = await getDocs(q)
    const data = querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...(docSnap.data() as any) })) as Expense[]
    setExpenses(data)
  }

  const handleDecision = async (id: string, newStatus: 'Approved' | 'Rejected', comment?: string) => {
    const expenseRef = doc(db, 'expenses', id)
    const updateData = newStatus === 'Rejected'
      ? { status: newStatus, rejectionComment: comment || '' }
      : { status: newStatus }
    await updateDoc(expenseRef, updateData)
    fetchExpenses()
  }

  const openRejectModal = (id: string) => {
    setCurrentRejectId(id)
    setRejectComment('')
    setShowRejectModal(true)
  }

  const confirmRejection = () => {
    if (currentRejectId) {
      handleDecision(currentRejectId, 'Rejected', rejectComment)
    }
    setShowRejectModal(false)
    setCurrentRejectId(null)
  }

  useEffect(() => {
    if (!loading && role === 'supervisor') fetchExpenses()
  }, [role, loading])

  if (loading) {
    return <div className="flex items-center justify-center h-screen text-gray-900">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      {/* Navigation */}
      <nav className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-blue-700 hover:text-blue-900">
          Home
        </Link>
        <button
          onClick={handleLogout}
          className="text-red-600 hover:text-red-800 font-medium"
        >
          Logout
        </button>
      </nav>

      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Supervisor Dashboard</h1>
        <table className="min-w-full bg-white rounded-lg overflow-hidden shadow">
          <thead className="bg-gray-200">
            <tr>
              <th className="py-2 px-4 border-b">Employee</th>
              <th className="py-2 px-4 border-b">Amount</th>
              <th className="py-2 px-4 border-b">Category</th>
              <th className="py-2 px-4 border-b">Date</th>
              <th className="py-2 px-4 border-b">Action</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map(expense => (
              <tr key={expense.id} className="border-t">
                <td className="py-2 px-4">{expense.employeeName}</td>
                <td className="py-2 px-4">${expense.amount}</td>
                <td className="py-2 px-4">{expense.category}</td>
                <td className="py-2 px-4">{expense.date}</td>
                <td className="py-2 px-4">
                  <button
                    className="bg-green-500 text-white px-2 py-1 rounded mr-2"
                    onClick={() => handleDecision(expense.id, 'Approved')}
                  >
                    Approve
                  </button>
                  <button
                    className="bg-red-500 text-white px-2 py-1 rounded"
                    onClick={() => openRejectModal(expense.id)}
                  >
                    Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-lg text-gray-900">
            <h2 className="text-lg font-semibold mb-2">Reason for Rejection (optional)</h2>
            <textarea
              value={rejectComment}
              onChange={e => setRejectComment(e.target.value)}
              placeholder="Enter comment (optional)"
              className="w-full border rounded p-2 mb-4"
              rows={3}
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={confirmRejection}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Confirm Reject
              </button>
              <button
                onClick={() => setShowRejectModal(false)}
                className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
