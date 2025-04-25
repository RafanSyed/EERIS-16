'use client'

import React, { useState, useEffect } from 'react'
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore'
import { db } from '../firebase/firebaseConfig'
import { useAuth } from '../../context/AuthContext'

interface User {
  id: string
  email: string
  role: 'employee' | 'supervisor'
}

export default function UserManagement() {
  const { role } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pendingChanges, setPendingChanges] = useState<Record<string, 'employee' | 'supervisor'>>({})

  useEffect(() => {
    if (role !== 'supervisor') return

    const fetchUsers = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'users'))
        const userList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as User[]
        setUsers(userList)
      } catch (err) {
        setError('Failed to fetch users')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [role])

  const handleRoleChange = (userId: string, newRole: 'employee' | 'supervisor') => {
    setPendingChanges(prev => ({
      ...prev,
      [userId]: newRole
    }))
  }

  const handleSubmitChanges = async () => {
    try {
      for (const [userId, newRole] of Object.entries(pendingChanges)) {
        const userRef = doc(db, 'users', userId)
        await updateDoc(userRef, { role: newRole })
        setUsers(users.map(user => 
          user.id === userId ? { ...user, role: newRole } : user
        ))
      }
      setPendingChanges({})
    } catch (err) {
      setError('Failed to update user roles')
      console.error(err)
    }
  }

  if (role !== 'supervisor') {
    return <div className="text-red-600">Access denied. Only supervisors can manage users.</div>
  }

  if (loading) {
    return <div>Loading users...</div>
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">User Management</h2>
      {error && <div className="text-red-600 mb-4">{error}</div>}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">New Role</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map(user => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.role}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <select
                    value={pendingChanges[user.id] || user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value as 'employee' | 'supervisor')}
                    className="border border-gray-300 rounded-md px-3 py-1"
                  >
                    <option value="employee">Employee</option>
                    <option value="supervisor">Supervisor</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {Object.keys(pendingChanges).length > 0 && (
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSubmitChanges}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Save Changes
          </button>
        </div>
      )}
    </div>
  )
} 