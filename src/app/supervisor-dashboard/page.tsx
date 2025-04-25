'use client'

import React, { useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SupervisorDashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login')
      } else {
        router.push('/supervisorDash')
      }
    }
  }, [user, loading, router])

  return null
} 