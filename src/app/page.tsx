// src/app/page.tsx
'use client';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex items-center justify-center h-screen bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to EERIS‑xx</h1>
        <Link
          href="/dashboard"
          className="text-blue-600 underline hover:text-blue-800"
        >
          Go to Dashboard →
        </Link>
        
      </div>
    </main>
  );
}
