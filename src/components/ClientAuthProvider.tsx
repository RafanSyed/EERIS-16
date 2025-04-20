'use client'
import React from 'react'
import { AuthProvider, useAuth } from '../context/AuthContext'
import { ExpensesProvider } from '../context/ExpensesContext'
import LoginPage from '../app/login/page'

export default function ClientAuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <InnerAuthGate>{children}</InnerAuthGate>
    </AuthProvider>
  )
}

function InnerAuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) {
    return <div className="flex items-center justify-center h-screen text-gray-900">Loading...</div>
  }
  if (!user) {
    return <LoginPage />
  }
  return (
    <ExpensesProvider>
      {children}
    </ExpensesProvider>
  )
}
