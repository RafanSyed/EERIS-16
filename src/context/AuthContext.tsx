// File: src/context/AuthContext.tsx
'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { getAuth, onAuthStateChanged, User } from 'firebase/auth'
import { app, db } from '../app/firebase/firebaseConfig'
import { doc, getDoc } from 'firebase/firestore'

// Define possible roles
export type Role = 'employee' | 'supervisor'

interface AuthContextType {
  user: User | null
  role: Role | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<Role | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const auth = getAuth(app)
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u)
      if (u) {
        try {
          const snap = await getDoc(doc(db, 'users', u.uid))
          const data = snap.data()
          // Default to employee if no explicit supervisor tag
          setRole(data?.role === 'supervisor' ? 'supervisor' : 'employee')
        } catch (err) {
          console.error('Error fetching user role:', err)
          setRole('employee')
        }
      } else {
        setRole(null)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  return (
    <AuthContext.Provider value={{ user, role, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}