// src/context/AuthContext.tsx
'use client'
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { getAuth, onAuthStateChanged, User } from 'firebase/auth'
import { app } from '../app/firebase/firebaseConfig' // your initializeApp(...) export

interface AuthContextType {
  user: User | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true })

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = getAuth(app)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
    return unsubscribe
  }, [auth])

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
