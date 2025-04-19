'use client'
import React, { useEffect, useState } from 'react';
import { getFirestore, collection, getDocs, updateDoc, doc, query, where } from 'firebase/firestore';
import { app } from '../firebase/firebaseConfig';

const db = getFirestore(app);

interface Expense {
  id: string;
  employeeName: string;
  amount: number;
  category: string;
  date: string;
  status: string;
}

const SupervisorDashboard: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const fetchExpenses = async () => {
    const q = query(collection(db, 'expenses'), where('status', '==', 'Pending'));
    const querySnapshot = await getDocs(q);
    const data: Expense[] = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
    setExpenses(data);
  };

  const handleDecision = async (id: string, newStatus: 'Approved' | 'Rejected') => {
    const expenseRef = doc(db, 'expenses', id);
    await updateDoc(expenseRef, { status: newStatus });
    fetchExpenses();
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Supervisor Dashboard</h1>
      <table className="min-w-full bg-white">
        <thead>
          <tr>
            <th className="py-2 px-4 border-b">Employee</th>
            <th className="py-2 px-4 border-b">Amount</th>
            <th className="py-2 px-4 border-b">Category</th>
            <th className="py-2 px-4 border-b">Date</th>
            <th className="py-2 px-4 border-b">Action</th>
          </tr>
        </thead>
        <tbody>
          {expenses.map(expense => (
            <tr key={expense.id}>
              <td className="py-2 px-4 border-b">{expense.employeeName}</td>
              <td className="py-2 px-4 border-b">${expense.amount}</td>
              <td className="py-2 px-4 border-b">{expense.category}</td>
              <td className="py-2 px-4 border-b">{expense.date}</td>
              <td className="py-2 px-4 border-b">
                <button
                  className="bg-green-500 text-white px-2 py-1 rounded mr-2"
                  onClick={() => handleDecision(expense.id, 'Approved')}
                >
                  Approve
                </button>
                <button
                  className="bg-red-500 text-white px-2 py-1 rounded"
                  onClick={() => handleDecision(expense.id, 'Rejected')}
                >
                  Reject
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SupervisorDashboard;
