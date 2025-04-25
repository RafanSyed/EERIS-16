'use client'

import React, { useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useRouter } from 'next/navigation'

export default function EmployeeDashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login')
      } else {
        router.push('/dashboard')
      }
    }
  }, [user, loading, router])

  return null
} 