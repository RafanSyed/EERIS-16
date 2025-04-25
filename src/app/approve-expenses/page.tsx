'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getAuth, signOut } from 'firebase/auth'
import { app } from '../firebase/firebaseConfig'
import { useAuth } from '../../context/AuthContext'
import { useExpenses } from '../../context/ExpensesContext'
import { Timestamp } from 'firebase/firestore'
import { collection, query, where, getDocs, updateDoc } from 'firebase/firestore'
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

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login')
    } else if (role !== 'supervisor') {
      router.replace('/dashboard')
    }
  }, [user, loading, role, router])

  const handleLogout = async () => {
    await signOut(auth)
    router.replace('/login')
  }

  const handleProcessPayments = async () => {
    try {
      setProcessing(true)
      setProcessResult(null)

      // First get all approved expenses
      const q = query(
        collection(db, 'expenses'),
        where('status', '==', 'Approved')
      )

      const snapshot = await getDocs(q)
      let totalAmount = 0
      let processedCount = 0

      // Then filter and process only unpaid ones
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
    if (!selectedExpense || !rejectionComment) return

    try {
      await updateExpense(selectedExpense.id, { 
        status: 'Rejected',
        rejectionComment: rejectionComment
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

  if (role !== 'supervisor') {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p>Only supervisors can access this page.</p>
        </div>
      </div>
    )
  }

  const pendingExpenses = expenses.filter(expense => expense.status === 'Pending')

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <div className="flex space-x-6 items-center">
          <Link href="/" className="text-gray-800 hover:text-gray-900">
            Home
          </Link>
          <Link href="/supervisorDash" className="text-gray-800 hover:text-gray-900">
            Supervisor Dashboard
          </Link>
          <Link href="/approve-expenses" className="text-blue-700 font-semibold hover:text-blue-900">
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

      <main className="max-w-5xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Approve Expenses</h1>
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
          </div>
        </div>

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

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {expense.uid}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${expense.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {expense.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(expense.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {expense.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleApprove(expense.id)}
                        className="text-green-600 hover:text-green-900 mr-4"
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

        {/* Rejection Modal */}
        {showRejectionModal && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-semibold mb-4">Reject Expense</h2>
              <textarea
                value={rejectionComment}
                onChange={(e) => setRejectionComment(e.target.value)}
                placeholder="Enter rejection reason..."
                className="w-full p-2 border rounded mb-4"
                rows={4}
              />
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setShowRejectionModal(false)
                    setRejectionComment('')
                    setSelectedExpense(null)
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejectConfirm}
                  disabled={!rejectionComment}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-red-400"
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