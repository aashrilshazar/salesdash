'use client'

import './globals.css'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isPipelinePage = pathname === '/pipeline'

  return (
    <html lang="en">
      <body className="bg-zinc-950 text-gray-100 min-h-screen">
        {/* ───── HEADER ───── */}
        <header className="py-6 border-b border-zinc-800">
          <div className="max-w-6xl mx-auto px-4 relative">
            {/* Conditional header content */}
            {isPipelinePage ? (
              <h1 className="text-3xl sm:text-4xl font-bold text-center">
                Pipeline
              </h1>
            ) : (
              <>
                <h1 className="text-3xl sm:text-4xl font-bold text-center">
                  Sales Dashboard
                </h1>
                <h2 className="text-lg sm:text-2xl text-center mt-1">
                  Total Meetings
                </h2>
              </>
            )}

            {/* Nav – top-right */}
            <nav className="absolute right-4 top-1/2 -translate-y-1/2 space-x-6 text-blue-300">
              <Link href="/" className="hover:underline">
                Home
              </Link>
              <Link href="/firms" className="hover:underline">
                Firms
              </Link>
              <Link href="/pipeline" className="hover:underline">
                Pipeline
              </Link>
            </nav>
          </div>
        </header>

        {/* ───── PAGE CONTENT ───── */}
        <main
          className={
            isPipelinePage
              ? 'px-4 pt-8' // full-width for Kanban
              : 'max-w-6xl mx-auto px-4 pt-8'
          }
        >
          {children}
        </main>
      </body>
    </html>
  )
}
