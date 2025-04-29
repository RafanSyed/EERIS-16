'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getAuth, signOut } from 'firebase/auth'
import { app } from '../firebase/firebaseConfig'
import { useAuth } from '../../context/AuthContext'
import { useExpenses } from '../../context/ExpensesContext'
import {
  Timestamp,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  getDoc,
} from 'firebase/firestore'
import { db } from '../firebase/firebaseConfig'

interface Expense {
  id: string
  amount: number
  category: string
  date: string
  description: string
  status: 'Pending' | 'Approved' | 'Rejected'
  submittedAt: Timestamp
  uid: string
  rejectionComment?: string
}

export default function ApproveExpensesPage() {
  const { user, loading, role } = useAuth()
  const { expenses, updateExpense } = useExpenses()
  const router = useRouter()
  const auth = getAuth(app)

  const [processing, setProcessing] = useState(false)
  const [processResult, setProcessResult] = useState<{ count: number; total: number } | null>(null)
  const [rejectionComment, setRejectionComment] = useState('')
  const [showRejectionModal, setShowRejectionModal] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  const [userNames, setUserNames] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login')
      } else if (role === 'employee') {
        router.push('/dashboard')
      }
    }
  }, [user, loading, role, router])

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

  const handleProcessPayments = async () => {
    try {
      setProcessing(true)
      setProcessResult(null)

      const q = query(collection(db, 'expenses'), where('status', '==', 'Approved'))
      const snapshot = await getDocs(q)
      let totalAmount = 0
      let processedCount = 0

      for (const doc of snapshot.docs) {
        const expense = doc.data()
        if (!expense.paid) {
          await updateDoc(doc.ref, {
            paid: true,
            paidAt: Timestamp.now()
          })
          totalAmount += expense.amount
          processedCount++
        }
      }

      setProcessResult({ count: processedCount, total: totalAmount })
    } catch (error) {
      console.error('Error processing payments:', error)
      alert('Error processing payments. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  const handleApprove = async (expenseId: string) => {
    try {
      await updateExpense(expenseId, { status: 'Approved' })
    } catch (error) {
      console.error('Error approving expense:', error)
      alert('Error approving expense. Please try again.')
    }
  }

  const handleReject = (expense: Expense) => {
    setSelectedExpense(expense)
    setShowRejectionModal(true)
  }

  const handleRejectConfirm = async () => {
    if (!selectedExpense) return
    try {
      await updateExpense(selectedExpense.id, {
        status: 'Rejected',
        rejectionComment: rejectionComment || ''
      })
      setShowRejectionModal(false)
      setRejectionComment('')
      setSelectedExpense(null)
    } catch (error) {
      console.error('Error rejecting expense:', error)
      alert('Error rejecting expense. Please try again.')
    }
  }

  if (loading || !user) {
    return <div className="p-6 text-gray-900">Loading…</div>
  }

  const pendingExpenses = expenses.filter(expense => expense.status === 'Pending')

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <div className="flex space-x-6 items-center">
          <Link href="/" className="text-gray-800 hover:text-gray-900">Home</Link>
          <Link href="/supervisorDash" className="text-gray-800 hover:text-gray-900">Supervisor Dashboard</Link>
          <Link href="/approve-expenses" className="text-blue-700 font-semibold hover:text-blue-900">Approve Expenses</Link>
          {role === 'admin' && (
            <Link href="/user-management" className="text-gray-800 hover:text-gray-900">
              User Management
            </Link>
          )}
        </div>
        <button
          onClick={handleLogout}
          className="text-red-600 hover:text-red-800 font-medium"
        >
          Logout
        </button>
      </nav>

      <main className="max-w-5xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Approve Expenses</h1>
          <button
            onClick={handleProcessPayments}
            disabled={processing}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:bg-green-400 flex items-center space-x-2 font-medium"
          >
            {processing ? 'Processing...' : 'Process Approved Payments'}
          </button>
        </div>

        {processResult && (
          <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            <p>{processResult.count} reports processed. Total paid: ${processResult.total.toFixed(2)}</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pendingExpenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No pending expenses to approve.
                  </td>
                </tr>
              ) : (
                pendingExpenses.map(expense => (
                  <tr key={expense.id}>
                    <td className="px-6 py-4 text-sm text-black">
                      {userNames[expense.uid] || 'User'}
                    </td>
                    <td className="px-6 py-4 text-sm text-black">${expense.amount.toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm text-black">{expense.category}</td>
                    <td className="px-6 py-4 text-sm text-black">{new Date(expense.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm text-black">{expense.description}</td>
                    <td className="px-6 py-4 text-sm font-medium flex space-x-4">
                      <button
                        onClick={() => handleApprove(expense.id)}
                        className="text-green-600 hover:text-green-900"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(expense)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {showRejectionModal && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-semibold mb-4 text-black">Reject Expense</h2>
              <textarea
                value={rejectionComment}
                onChange={(e) => setRejectionComment(e.target.value)}
                placeholder="Optional rejection comment..."
                className="w-full p-2 border rounded mb-4 text-black placeholder-gray-500"
                rows={4}
              />
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setShowRejectionModal(false)
                    setRejectionComment('')
                    setSelectedExpense(null)
                  }}
                  className="px-4 py-2 text-gray-800 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejectConfirm}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
