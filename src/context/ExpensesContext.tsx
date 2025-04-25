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
  DocumentData,
  doc,
  updateDoc
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
  updateExpense: (id: string, data: Partial<Omit<Expense, 'id' | 'uid' | 'submittedAt'>>) => Promise<void>
}

const ExpensesContext = createContext<ExpensesContextType | undefined>(undefined)

export function ExpensesProvider({ children }: { children: ReactNode }) {
  const { user, loading, role } = useAuth()
  const [expenses, setExpenses] = useState<Expense[]>([])

  useEffect(() => {
    if (loading || !user) return
    
    // For supervisors, fetch all expenses
    // For regular employees, fetch only their expenses
    const q = role === 'supervisor'
      ? collection(db, 'expenses')
      : query(collection(db, 'expenses'), where('uid', '==', user.uid))

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
  }, [user, loading, role])

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

  const updateExpense = async (id: string, data: Partial<Omit<Expense, 'id' | 'uid' | 'submittedAt'>>) => {
    if (!user) throw new Error('User not authenticated')
    const expenseRef = doc(db, 'expenses', id)
    await updateDoc(expenseRef, data)
  }

  return (
    <ExpensesContext.Provider value={{ expenses, addExpense, updateExpense }}>
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