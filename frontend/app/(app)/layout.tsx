'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAtom, useSetAtom } from 'jotai'
import { accessTokenAtom, currentUserAtom } from '../../store/atoms'
import { authApi } from '../../lib/api'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname    = usePathname()
  const router      = useRouter()
  const [user]      = useAtom(currentUserAtom)
  const setToken    = useSetAtom(accessTokenAtom)
  const setUser     = useSetAtom(currentUserAtom)

  async function handleLogout() {
    try { await authApi.logout() } finally {
      setToken(null)
      setUser(null)
      router.push('/login')
    }
  }

  const navItems = [
    { href: '/dashboard',  label: 'Dashboard' },
    { href: '/workouts',   label: 'Workouts'  },
    { href: '/exercises',  label: 'Übungen' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            <span className="font-bold text-indigo-600 text-lg">FitQuest</span>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition-colors ${
                  pathname.startsWith(item.href)
                    ? 'text-indigo-600'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <span className="text-sm text-gray-500">
                {user.username} · Lvl {user.level}
              </span>
            )}
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-gray-900"
            >
              Abmelden
            </button>
          </div>
        </div>
      </nav>

      {/* Page content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
