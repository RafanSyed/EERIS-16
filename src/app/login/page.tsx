// src/app/login/page.tsx
'use client'
import React, { useState } from 'react'
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import { app } from '../../app/firebase/firebaseConfig'

export default function LoginPage() {
  const auth = getAuth(app)
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [pwd, setPwd] = useState('')
  const [mode, setMode] = useState<'login'|'signup'>('login')
  const [error, setError] = useState<string|null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, pwd)
      } else {
        await createUserWithEmailAndPassword(auth, email, pwd)
      }
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-20 p-6 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">{mode === 'login' ? 'Log In' : 'Sign Up'}</h2>
      {error && <p className="text-red-600 mb-2">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email" placeholder="Email"
          value={email} onChange={e=>setEmail(e.target.value)}
          required className="w-full border p-2 rounded"
        />
        <input
          type="password" placeholder="Password"
          value={pwd} onChange={e=>setPwd(e.target.value)}
          required className="w-full border p-2 rounded"
        />
        <button type="submit" className="w-full bg-blue-700 text-white p-2 rounded">
          {mode === 'login' ? 'Log In' : 'Sign Up'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm">
        {mode === 'login'
          ? <>Don&apos;t have an account? <button onClick={()=>setMode('signup')} className="text-blue-700">Sign Up</button></>
          : <>Have an account? <button onClick={()=>setMode('login')} className="text-blue-700">Log In</button></>
        }
      </p>
    </div>
  )
}
