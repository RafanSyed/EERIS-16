// File: src/app/page.tsx
'use client'

import React, { useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Home() {
  const { user, logout, role, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login')
      } else if (role === 'employee') {
        router.push('/dashboard')
      }
    }
  }, [user, loading, role, router])

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/login')
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  if (loading || !user || role === 'employee') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">EERIS-16</h1>
            </div>
            <div className="flex items-center">
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Welcome, select dashboard</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-md mx-auto">
              <Link
                href="/dashboard?from=home"
                className="bg-blue-600 text-white p-6 rounded-lg shadow hover:bg-blue-700 transition-colors flex flex-col items-center justify-center aspect-square"
              >
                <h3 className="text-xl font-semibold mb-2">Employee</h3>
                <p className="text-center">Access your expense management tools</p>
              </Link>
              
              <Link
                href="/supervisorDash"
                className="bg-green-600 text-white p-6 rounded-lg shadow hover:bg-green-700 transition-colors flex flex-col items-center justify-center aspect-square"
              >
                <h3 className="text-xl font-semibold mb-2">Supervisor</h3>
                <p className="text-center">Manage expense approvals and reports</p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
