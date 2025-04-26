'use client'

import React, { useState } from 'react'
import { getAuth, updateProfile, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth'
import { app } from '../firebase/firebaseConfig'
import { useRouter } from 'next/navigation'
import { doc, getDoc, getFirestore, setDoc } from 'firebase/firestore'

export default function LoginPage() {
  const auth = getAuth(app)
  const db = getFirestore(app)
  const router = useRouter()
  
  const [email, setEmail] = useState('')
  const [pwd, setPwd] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [mode, setMode] = useState<'login'|'signup'>('login')
  const [error, setError] = useState<string|null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      let userCredential;

      if (mode === 'login') {
        userCredential = await signInWithEmailAndPassword(auth, email, pwd)
      } else {
        userCredential = await createUserWithEmailAndPassword(auth, email, pwd)

        await updateProfile(userCredential.user, {
          displayName: `${firstName} ${lastName}`
        })

        await setDoc(doc(db, 'users', userCredential.user.uid), {
          id: userCredential.user.uid,
          email: email,
          fullName: `${firstName} ${lastName}`,
          role: 'employee',
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        })
      }

      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid))
      const role = userDoc.data()?.role || 'employee'

      if (role === 'supervisor') {
        router.replace('/')
      } else {
        router.replace('/dashboard')
      }
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
          {mode === 'signup' && (
            <>
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">First Name</label>
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  required
                  className="mt-1 w-full border border-gray-300 text-gray-900 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Last Name</label>
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  required
                  className="mt-1 w-full border border-gray-300 text-gray-900 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="mt-1 w-full border border-gray-300 text-gray-900 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="mt-1 w-full border border-gray-300 text-gray-900 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
          >
            {mode === 'login' ? 'Log In' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            className="text-blue-600 hover:text-blue-800"
          >
            {mode === 'login' ? 'Need an account? Sign up' : 'Already have an account? Log in'}
          </button>
        </div>
      </div>
    </main>
  )
}
