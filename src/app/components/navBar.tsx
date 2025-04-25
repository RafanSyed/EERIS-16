import Link from 'next/link'
{/* Navigation */}
<nav className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex space-x-6">
    <Link href="/dashboard" className="text-blue-700 font-semibold hover:text-blue-900">
    Dashboard
    </Link>
    <Link href="/expenses" className="text-gray-800 hover:text-gray-900">
    My Expenses
    </Link>
    <Link href="/reports" className="text-gray-800 hover:text-gray-900">
    Report
    </Link>
</nav>