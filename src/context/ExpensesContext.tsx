'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { collection, onSnapshot, query, orderBy, updateDoc, doc } from 'firebase/firestore'
import { db } from '../app/firebase/firebaseConfig' // adjust path if different

export interface Expense {
  id: string
  uid: string
  merchant: string
  amount: number
  category: string
  date: string
  description: string
  status: 'Pending' | 'Approved' | 'Rejected'
  rejectionComment?: string
  submittedAt: any
  imageUrl?: string
}

interface ExpensesContextType {
  expenses: Expense[]
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>
}

const ExpensesContext = createContext<ExpensesContextType | undefined>(undefined)

export function ExpensesProvider({ children }: { children: React.ReactNode }) {
  const [expenses, setExpenses] = useState<Expense[]>([])

  useEffect(() => {
    const q = query(collection(db, 'expenses'), orderBy('submittedAt', 'desc'))
    const unsubscribe = onSnapshot(q, snapshot => {
      const expenseList: Expense[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Expense[]
      setExpenses(expenseList)
    })

    return () => unsubscribe()
  }, [])

  const updateExpense = async (id: string, updates: Partial<Expense>) => {
    const expenseRef = doc(db, 'expenses', id)
    await updateDoc(expenseRef, updates)
    // Optional: Update local state immediately for faster UX
    setExpenses(prev =>
      prev.map(expense => (expense.id === id ? { ...expense, ...updates } : expense))
    )
  }

  return (
    <ExpensesContext.Provider value={{ expenses, updateExpense }}>
      {children}
    </ExpensesContext.Provider>
  )
}

export function useExpenses() {
  const context = useContext(ExpensesContext)
  if (!context) {
    throw new Error('useExpenses must be used within a ExpensesProvider')
  }
  return context
}
