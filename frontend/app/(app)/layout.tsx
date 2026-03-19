'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAtom, useSetAtom } from 'jotai'
import { accessTokenWithStorageAtom, currentUserAtom } from '../../store/atoms'
import { authApi } from '../../lib/api'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router   = useRouter()
  const [user]   = useAtom(currentUserAtom)
  const setToken = useSetAtom(accessTokenWithStorageAtom)
  const setUser  = useSetAtom(currentUserAtom)

  async function handleLogout() {
    try { await authApi.logout() } finally {
      setToken(null)
      setUser(null)
      router.push('/login')
    }
  }

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: '⚡' },
    { href: '/workouts',  label: 'Workouts',  icon: '💪' },
    { href: '/exercises', label: 'Übungen',   icon: '📋' },
  ]

  return (
    <div className="min-h-screen pb-20 sm:pb-0" style={{ background: 'var(--bg-primary)' }}>

      {/* Desktop top nav */}
      <nav className="hidden sm:block sticky top-0 z-40" style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-2xl mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-1">
            <Link href="/dashboard" className="font-bold text-base mr-3" style={{ color: 'var(--accent)' }}>
              FitQuest
            </Link>
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                style={{
                  color: pathname.startsWith(item.href) ? 'var(--text-primary)' : 'var(--text-secondary)',
                  background: pathname.startsWith(item.href) ? 'var(--bg-hover)' : 'transparent',
                }}>
                {item.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Lvl {user.level} · {user.xp_total} XP
              </span>
            )}
            <button onClick={handleLogout}
              className="text-xs px-3 py-1.5 rounded-lg transition-all"
              style={{ color: 'var(--text-secondary)', background: 'var(--bg-secondary)' }}>
              Abmelden
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile top bar */}
      <nav className="sm:hidden sticky top-0 z-40 flex items-center justify-between px-4 h-12"
        style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
        <Link href="/dashboard" className="font-bold text-base" style={{ color: 'var(--accent)' }}>
          FitQuest
        </Link>
        {user && (
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Lvl {user.level} · {user.xp_total} XP
          </span>
        )}
      </nav>

      {/* Page content */}
      <main className="max-w-2xl mx-auto px-4 py-5">
        {children}
      </main>

      {/* Mobile bottom tab bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 flex"
        style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border)' }}>
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href}
              className="flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-all"
              style={{ color: active ? 'var(--accent)' : 'var(--text-muted)' }}>
              <span className="text-xl leading-none">{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          )
        })}
        <button
          onClick={handleLogout}
          className="flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-all"
          style={{ color: 'var(--text-muted)' }}>
          <span className="text-xl leading-none">👤</span>
          <span className="text-xs font-medium">Abmelden</span>
        </button>
      </div>
    </div>
  )
}
