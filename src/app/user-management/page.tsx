'use client'

import React, { useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getAuth, signOut } from 'firebase/auth'
import { app } from '../firebase/firebaseConfig'
import UserManagement from '../components/UserManagement'

export default function UserManagementPage() {
  const { user, loading, role } = useAuth()
  const router = useRouter()
  const auth = getAuth(app)

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login')
    }
  }, [user, loading, router])

  const handleLogout = async () => {
    await signOut(auth)
    router.replace('/login')
  }

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
          <Link href="/supervisorDash" className="text-gray-800 hover:text-gray-900">
            Supervisor Dashboard
          </Link>
          <Link href="/approve-expenses" className="text-gray-800 hover:text-gray-900">
            Approve Expenses
          </Link>
         
          <Link href="/user-management" className="text-blue-700 font-semibold hover:text-blue-900">
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
        <UserManagement />
      </main>
    </div>
  )
} 