'use client'
import React, { createContext, useContext, useState, ReactNode } from 'react'

export interface Expense {
  id: number
  amount: number
  category: string
  date: string
  description?: string
  status: 'Pending' | 'Approved' | 'Rejected'
}

interface ExpensesContextType {
  expenses: Expense[]
  addExpense: (data: Omit<Expense, 'id' | 'status'>) => void
}

const ExpensesContext = createContext<ExpensesContextType | undefined>(undefined)

export function ExpensesProvider({ children }: { children: ReactNode }) {
  const [expenses, setExpenses] = useState<Expense[]>([])

  const addExpense = (data: Omit<Expense, 'id' | 'status'>) => {
    setExpenses(prev => [
      ...prev,
      { id: prev.length + 1, status: 'Pending', ...data },
    ])
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
    throw new Error('useExpenses must be used within an ExpensesProvider')
  }
  return context
}
