// File: src/context/ExpensesContext.tsx
'use client'
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { db } from '../app/firebase/firebaseConfig'
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  Timestamp,
  QuerySnapshot,
  DocumentData
} from 'firebase/firestore'
import { useAuth } from './AuthContext'

export interface Expense {
  id: string  // Firestore document ID
  uid: string
  amount: number
  category: string
  date: string
  description: string  // always a string
  status: 'Pending' | 'Approved' | 'Rejected'
  submittedAt: Timestamp
  rejectionComment?: string  // optional comment on rejection
}

interface ExpensesContextType {
  expenses: Expense[]
  addExpense: (data: Omit<Expense, 'id' | 'status' | 'submittedAt' | 'uid' | 'rejectionComment'>) => Promise<void>
}

const ExpensesContext = createContext<ExpensesContextType | undefined>(undefined)

export function ExpensesProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const [expenses, setExpenses] = useState<Expense[]>([])

  useEffect(() => {
    if (loading || !user) return
    const q = query(
      collection(db, 'expenses'),
      where('uid', '==', user.uid)
    )
    const unsubscribe = onSnapshot(
      q,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const items: Expense[] = snapshot.docs.map(docSnap => {
          const data = docSnap.data()
          return {
            id: docSnap.id,
            uid: data.uid,
            amount: data.amount,
            category: data.category,
            date: data.date,
            description: data.description ?? '',
            status: data.status,
            submittedAt: data.submittedAt,
            rejectionComment: data.rejectionComment ?? '',
          }
        })
        setExpenses(items)
      }
    )
    return () => unsubscribe()
  }, [user, loading])

  const addExpense = async (
    data: Omit<Expense, 'id' | 'status' | 'submittedAt' | 'uid' | 'rejectionComment'>
  ) => {
    if (!user) throw new Error('User not authenticated')
    await addDoc(collection(db, 'expenses'), {
      uid: user.uid,
      ...data,
      submittedAt: Timestamp.now(),
      status: 'Pending',
      rejectionComment: '',
    })
  }

  return (
    <ExpensesContext.Provider value={{ expenses, addExpense }}>
      {children}
    </ExpensesContext.Provider>
  )
}

export function useExpenses() {
  const context = useContext(ExpensesContext)
  if (!context) {
    throw new Error('useExpenses must be used within ExpensesProvider')
  }
  return context
}