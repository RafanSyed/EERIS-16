'use client'
import React from 'react'

interface ExpenseSummaryProps {
  title: string
  value: number | string
}

export default function ExpenseSummary({ title, value }: ExpenseSummaryProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow border border-gray-300 text-center">
      <p className="text-sm text-gray-700">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-gray-900">{value}</p>
    </div>
  )
}