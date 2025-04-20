// File: src/app/page.tsx
'use client'

import Link from 'next/link'
import { useAuth } from '../context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function Home() {
  const { user, role, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login')
      } else if (role === 'employee') {
        router.replace('/dashboard')
      }
      // supervisors remain here
    }
  }, [user, role, loading, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <p className="text-gray-700">Loading…</p>
      </div>
    )
  }

  if (user && role === 'supervisor') {
    return (
      <main className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-100 to-indigo-200">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-lg w-full text-center space-y-6">
          <h1 className="text-5xl font-extrabold text-gray-900">Welcome to EERIS‑16</h1>
          <p className="text-gray-600 text-lg">Please select your dashboard:</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Link
              href="/dashboard"
              className="block bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition font-medium"
            >
              Employee Dashboard
            </Link>
            <Link
              href="/supervisorDash"
              className="block bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition font-medium"
            >
              Supervisor Dashboard
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return null
}
