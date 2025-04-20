'use client'

import React, { useEffect, useState } from 'react'
import { getFirestore, collection, getDocs, updateDoc, doc, query, where } from 'firebase/firestore'
import { app } from '../firebase/firebaseConfig'

const db = getFirestore(app)

interface Expense {
  id: string
  employeeName: string
  amount: number
  category: string
  date: string
  status: string
}

const SupervisorDashboard: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [currentRejectId, setCurrentRejectId] = useState<string | null>(null)
  const [rejectComment, setRejectComment] = useState('')

  const fetchExpenses = async () => {
    const q = query(collection(db, 'expenses'), where('status', '==', 'Pending'))
    const querySnapshot = await getDocs(q)
    const data: Expense[] = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense))
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
    fetchExpenses()
  }, [])

  return (
    <div className="p-4 text-gray-900">
      <h1 className="text-2xl font-bold mb-4 text-white-900">Supervisor Dashboard</h1>
      <table className="min-w-full bg-white">
        <thead>
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
            <tr key={expense.id}>
              <td className="py-2 px-4 border-b">{expense.employeeName}</td>
              <td className="py-2 px-4 border-b">${expense.amount}</td>
              <td className="py-2 px-4 border-b">{expense.category}</td>
              <td className="py-2 px-4 border-b">{expense.date}</td>
              <td className="py-2 px-4 border-b">
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

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50 text-gray-900">
          <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-lg">
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

export default SupervisorDashboard
