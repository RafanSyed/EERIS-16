// File: src/app/components/UserManagement.tsx

'use client'

import React, { useState, useEffect } from 'react'
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore'
import { db } from '../firebase/firebaseConfig'
import { useAuth } from '../../context/AuthContext'
import router from 'next/router'

interface User {
  id: string
  email: string
  fullName?: string
  role: 'employee' | 'supervisor' | 'admin'
}

export default function UserManagement() {
  const { role, user } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pendingChanges, setPendingChanges] = useState<Record<string, 'employee' | 'supervisor'>>({})


  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login')
      } else if (role === 'employee') {
        router.push('/dashboard')
      }
    }
    
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
  
    if (role === 'admin') { // Only fetch users if admin
      fetchUsers()
    }
  }, [role, user, loading])
  
  

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

  if (role === 'employee' || 'supervisor') {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className='text-1xl font-bold mb-6 text-gray-900'>Only supervisors can access this page.</p>
        </div>
      </div>
    )
  }
  

  if (loading) {
    return <div>Loading users...</div>
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">User Management</h2>
      {error && <div className="text-red-600 mb-4">{error}</div>}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Change Role</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map(user => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.fullName || 'User'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {user.role === 'employee' && (
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      Employee
                    </span>
                  )}
                  {user.role === 'supervisor' && (
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      Supervisor
                    </span>
                  )}
                  {user.role === 'admin' && (
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-300 text-gray-800">
                      Admin
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {user.role === 'admin' ? (
                    <select
                      disabled
                      className="bg-gray-100 border border-gray-300 p-2 rounded cursor-not-allowed w-full"
                    >
                      <option value="admin">Admin</option>
                    </select>
                  ) : (
                    <select
                      value={pendingChanges[user.id] || user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value as 'employee' | 'supervisor')}
                      className="border border-gray-300 rounded-md px-3 py-2 w-full"
                    >
                      <option value="employee">Employee</option>
                      <option value="supervisor">Supervisor</option>
                    </select>
                  )}
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
