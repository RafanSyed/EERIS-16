// File: src/context/AuthContext.tsx
'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { onAuthStateChanged, User, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth'
import { db, auth } from '../app/firebase/firebaseConfig'
import { doc, getDoc } from 'firebase/firestore'

// Define possible roles
export type Role = 'employee' | 'supervisor' | 'admin'

interface AuthContextType {
  user: User | null
  role: Role | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<Role | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!auth) {
      console.error('Firebase auth not initialized')
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u)
      if (u) {
        try {
          const snap = await getDoc(doc(db, 'users', u.uid))
          const data = snap.data()
          // Default to employee if no explicit supervisor tag
          setRole(data?.role || 'employee')
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

  const login = async (email: string, password: string) => {
    if (!auth) throw new Error('Firebase auth not initialized')
    await signInWithEmailAndPassword(auth, email, password)
  }

  const signup = async (email: string, password: string) => {
    if (!auth) throw new Error('Firebase auth not initialized')
    await createUserWithEmailAndPassword(auth, email, password)
  }

  const logout = async () => {
    if (!auth) throw new Error('Firebase auth not initialized')
    await signOut(auth)
  }

  return (
    <AuthContext.Provider value={{ user, role, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}