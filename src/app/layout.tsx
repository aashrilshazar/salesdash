// src/app/layout.tsx
import './globals.css'
import Link from 'next/link'

export const metadata = {
  title: 'Sales Dashboard',
  description: 'Live‐updating meetings dashboard',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-zinc-950 text-gray-100 min-h-screen">
        {/* HEADER */}
        <header className="py-6 border-b border-zinc-800">
          <div className="max-w-6xl mx-auto px-4 relative">
            {/* Centered titles */}
            <h1 className="text-3xl sm:text-4xl font-bold text-center">
              Sales Dashboard
            </h1>
            <h2 className="text-lg sm:text-2xl text-center mt-1">
              Total Meetings
            </h2>
            {/* Nav in top-right */}
            <nav className="absolute right-4 top-1/2 transform -translate-y-1/2 space-x-6 text-blue-300">
              <Link href="/" className="hover:underline">
                Home
              </Link>
              <Link href="/firms" className="hover:underline">
                Firms
              </Link>
            </nav>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="max-w-6xl mx-auto px-4 pt-8">{children}</main>
      </body>
    </html>
  )
}
