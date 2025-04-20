// File: src/app/login/page.tsx
'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth'
import { app } from '../firebase/firebaseConfig'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const auth = getAuth(app)
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [pwd, setPwd] = useState('')
  const [mode, setMode] = useState<'login'|'signup'>('login')
  const [error, setError] = useState<string|null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, pwd)
      } else {
        await createUserWithEmailAndPassword(auth, email, pwd)
      }
      router.replace('/dashboard')
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <main className="flex items-center justify-center h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-6 text-gray-900">
          {mode === 'login' ? 'Log In' : 'Sign Up'}
        </h2>
        {error && <p className="text-red-600 mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="mt-1 w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
            <input
              id="password"
              type="password"
              value={pwd}
              onChange={e => setPwd(e.target.value)}
              required
              className="mt-1 w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
          >
            {mode === 'login' ? 'Log In' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-4 flex justify-between text-sm">
          {mode === 'login' ? (
            <p>
              Don&apos;t have an account?{' '}
              <button onClick={() => setMode('signup')} className="text-blue-600 hover:underline">
                Sign Up
              </button>
            </p>
          ) : (
            <p>
              Have an account?{' '}
              <button onClick={() => setMode('login')} className="text-blue-600 hover:underline">
                Log In
              </button>
            </p>
          )}
          <Link href="/reset-password" className="text-blue-600 hover:underline">
            Forgot password?
          </Link>
        </div>
      </div>
    </main>
  )
}
