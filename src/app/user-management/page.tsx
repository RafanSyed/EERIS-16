// File: src/app/user-management/page.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getAuth, signOut } from 'firebase/auth'
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore'
import { app, db } from '../firebase/firebaseConfig'
import { useAuth } from '../../context/AuthContext'

interface User {
  id: string
  email: string
  fullName?: string
  role: 'employee' | 'supervisor' | 'admin'
}

export default function UserManagementPage() {
  const { user, loading, role } = useAuth()
  const router = useRouter()
  const auth = getAuth(app)

  const [users, setUsers] = useState<User[]>([])
  const [usersLoading, setUsersLoading] = useState(true)
  const [error, setError] = useState('')
  const [pendingChanges, setPendingChanges] = useState<Record<string, 'employee' | 'supervisor'>>({})

  // Protect access
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login')
      } else if (role !== 'admin') {
        router.replace('/dashboard')
      }
    }
  }, [user, loading, role, router])

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'users'))
        const userList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as User[]
        setUsers(userList)
      } catch (err) {
        console.error(err)
        setError('Failed to fetch users')
      } finally {
        setUsersLoading(false)
      }
    }

    if (role === 'admin') {
      fetchUsers()
    }
  }, [role])

  const handleLogout = async () => {
    await signOut(auth)
    router.replace('/login')
  }

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
        setUsers(prev => prev.map(user => user.id === userId ? { ...user, role: newRole } : user))
      }
      setPendingChanges({})
    } catch (err) {
      console.error(err)
      setError('Failed to update user roles')
    }
  }

  if (loading || !user || usersLoading) {
    return <div className="p-6 text-gray-900">Loading…</div>
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <div className="flex space-x-6 items-center">
          <Link href="/" className="text-gray-800 hover:text-gray-900">Home</Link>
          <Link href="/supervisorDash" className="text-gray-800 hover:text-gray-900">Supervisor Dashboard</Link>
          <Link href="/approve-expenses" className="text-gray-800 hover:text-gray-900">Approve Expenses</Link>
          <Link href="/user-management" className="text-blue-700 font-semibold hover:text-blue-900">User Management</Link>
        </div>
        <button
          onClick={handleLogout}
          className="text-red-600 hover:text-red-800 font-medium"
        >
          Logout
        </button>
      </nav>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto p-6">
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
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Employee</span>
                      )}
                      {user.role === 'supervisor' && (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Supervisor</span>
                      )}
                      {user.role === 'admin' && (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-300 text-gray-800">Admin</span>
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
      </main>
    </div>
  )
}
