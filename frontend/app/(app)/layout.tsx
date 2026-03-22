'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAtom, useSetAtom } from 'jotai'
import { useEffect, useState } from 'react'
import { accessTokenWithStorageAtom, currentUserAtom } from '../../store/atoms'
import { authApi, userApi } from '../../lib/api'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router   = useRouter()
  const [token]  = useAtom(accessTokenWithStorageAtom)
  const [user, setUser] = useAtom(currentUserAtom)
  const setToken = useSetAtom(accessTokenWithStorageAtom)
  const [displayUser, setDisplayUser] = useState(user)
  const [moreOpen, setMoreOpen] = useState(false)

  useEffect(() => {
    if (!token) return
    const load = () => {
      userApi.getMe(token)
        .then((res: any) => { setUser(res.data); setDisplayUser(res.data) })
        .catch(() => {})
    }
    load()
    const interval = setInterval(load, 5000)
    return () => clearInterval(interval)
  }, [pathname, token])

  useEffect(() => { setDisplayUser(user) }, [user])

  async function handleLogout() {
    try { await authApi.logout() } finally {
      setToken(null); setUser(null); setDisplayUser(null)
      router.push('/login')
    }
  }

  const desktopNav = [
    { href: '/dashboard',    label: 'Dashboard' },
    { href: '/workouts',     label: 'Workouts'  },
    { href: '/exercises',    label: 'Übungen'   },
    { href: '/stats',        label: 'Stats'     },
    { href: '/achievements', label: 'Erfolge'   },
    { href: '/leaderboard',  label: 'Rangliste' },
  ]

  // Mobile: wichtigste 4
  const mobileTabs = [
    { href: '/dashboard',    label: 'Dashboard', icon: '⚡' },
    { href: '/workouts',     label: 'Workouts',  icon: '💪' },
    { href: '/achievements', label: 'Erfolge',   icon: '🏆' },
    { href: '/leaderboard',  label: 'Rangliste', icon: '👑' },
  ]

  // Mobile "mehr"
  const moreItems = [
    { href: '/exercises', label: 'Übungen', icon: '📋' },
    { href: '/stats',     label: 'Stats',   icon: '📊' },
  ]

  const isMoreActive = moreItems.some(i => pathname.startsWith(i.href))

  return (
    <div className="min-h-screen pb-20 sm:pb-0" style={{ background: 'var(--bg-primary)' }}>

      {/* Desktop top nav — like before but with more items */}
      <nav className="hidden sm:block sticky top-0 z-40"
        style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-1">
            <Link href="/dashboard" className="font-bold text-base mr-3" style={{ color: 'var(--accent)' }}>
              FitQuest
            </Link>
            {desktopNav.map((item) => (
              <Link key={item.href} href={item.href}
                className="nav-link px-4 py-2 rounded-lg text-sm font-medium"
                style={{
                  color: pathname.startsWith(item.href) ? 'var(--text-primary)' : 'var(--text-secondary)',
                  background: pathname.startsWith(item.href) ? 'var(--bg-hover)' : 'transparent',
                }}>
                {item.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-3">
            {displayUser && (
              <span className="text-xs font-semibold px-2 py-1 rounded-lg"
                style={{ color: '#f59e0b', background: 'rgba(245,158,11,0.12)' }}>
                ⭐ Lvl {displayUser.level} · {displayUser.xp_total} XP
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
        {displayUser && (
          <span className="text-xs font-semibold px-2 py-1 rounded-lg"
            style={{ color: '#f59e0b', background: 'rgba(245,158,11,0.12)' }}>
            ⭐ Lvl {displayUser.level} · {displayUser.xp_total} XP
          </span>
        )}
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-5 sm:py-6">
        {children}
      </main>

      {/* Mobile bottom tab bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 flex"
        style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border)' }}>
        {mobileTabs.map((item) => {
          const active = pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href}
              className="tab-item flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5"
              style={{ color: active ? 'var(--accent)' : 'var(--text-muted)' }}>
              <span className="text-xl leading-none">{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          )
        })}
        <button
          onClick={() => setMoreOpen(!moreOpen)}
          className="tab-item flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5"
          style={{ color: isMoreActive || moreOpen ? 'var(--accent)' : 'var(--text-muted)' }}>
          <span className="text-xl leading-none">•••</span>
          <span className="text-xs font-medium">Mehr</span>
        </button>
      </div>

      {/* More menu */}
      {moreOpen && (
        <>
          <div className="sm:hidden fixed inset-0 z-30" onClick={() => setMoreOpen(false)} />
          <div className="sm:hidden fixed bottom-16 right-4 z-40 rounded-2xl overflow-hidden shadow-2xl"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', minWidth: '160px' }}>
            {moreItems.map((item, i) => (
              <Link key={item.href} href={item.href}
                onClick={() => setMoreOpen(false)}
                className="flex items-center gap-3 px-4 py-3 transition-all"
                style={{
                  borderBottom: i < moreItems.length - 1 ? '1px solid var(--border)' : '1px solid var(--border)',
                  color: pathname.startsWith(item.href) ? 'var(--accent)' : 'var(--text-primary)',
                  background: pathname.startsWith(item.href) ? 'var(--accent-light)' : 'transparent',
                }}>
                <span className="text-lg">{item.icon}</span>
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            ))}
            <button onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3"
              style={{ color: 'var(--red)' }}>
              <span className="text-lg">👤</span>
              <span className="text-sm font-medium">Abmelden</span>
            </button>
          </div>
        </>
      )}
    </div>
  )
}
