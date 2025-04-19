// pages/api/submit-expense.js
import { db } from '@/firebase/firebaseConfig';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { amount, category, date, description } = req.body;

      const docRef = await addDoc(collection(db, 'expenses'), {
        amount,
        category,
        date: Timestamp.fromDate(new Date(date)),
        description,
        createdAt: Timestamp.now()
      });

      res.status(200).json({ success: true, id: docRef.id });
    } catch (error) {
      console.error('Error adding document: ', error);
      res.status(500).json({ success: false, error: error.message });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
