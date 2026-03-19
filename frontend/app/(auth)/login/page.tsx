'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '../../../hooks/useAuth'
import { ApiError } from '../../../lib/api'

export default function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(email, password)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Etwas ist schiefgelaufen.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8" style={{ background: 'var(--bg-primary)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4" style={{ background: 'var(--accent-light)' }}>
            <span className="text-2xl">💪</span>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>FitQuest</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Melde dich an und setz deinen Streak fort</p>
        </div>

        <div className="rounded-2xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          {error && (
            <div className="rounded-xl px-4 py-3 mb-4 text-sm" style={{ background: 'var(--red-light)', border: '1px solid var(--red)', color: 'var(--red)' }}>
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>E-Mail</label>
              <input
                type="email" required autoComplete="email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="du@beispiel.ch"
                className="w-full rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 transition-all"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)', '--tw-ring-color': 'var(--accent)' } as any}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Passwort</label>
              <input
                type="password" required autoComplete="current-password" value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 transition-all"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' } as any}
              />
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full rounded-xl py-3 text-sm font-semibold transition-all active:scale-95"
              style={{ background: loading ? 'var(--accent-hover)' : 'var(--accent)', color: 'white', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Anmelden…' : 'Anmelden'}
            </button>
          </form>
        </div>

        <p className="text-center mt-5 text-sm" style={{ color: 'var(--text-secondary)' }}>
          Noch kein Konto?{' '}
          <Link href="/register" className="font-medium" style={{ color: 'var(--accent)' }}>Registrieren</Link>
        </p>
      </div>
    </div>
  )
}
