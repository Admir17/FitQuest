'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '../../../hooks/useAuth'
import { ApiError } from '../../../lib/api'

export default function RegisterPage() {
  const { register } = useAuth()
  const [email, setEmail]       = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors]     = useState<Record<string, string>>({})
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})
    setLoading(true)
    try {
      await register(email, username, password)
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.details ?? { general: err.message })
      } else {
        setErrors({ general: 'Etwas ist schiefgelaufen.' })
      }
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = { background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' } as any

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8" style={{ background: 'var(--bg-primary)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4" style={{ background: 'var(--accent-light)' }}>
            <span className="text-2xl">💪</span>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>FitQuest</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Starte deine Fitness-Reise</p>
        </div>

        <div className="rounded-2xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          {errors.general && (
            <div className="rounded-xl px-4 py-3 mb-4 text-sm" style={{ background: 'var(--red-light)', border: '1px solid var(--red)', color: 'var(--red)' }}>
              {errors.general}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>E-Mail</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="du@beispiel.ch" className="w-full rounded-xl px-4 py-3 text-sm outline-none" style={inputStyle} />
              {errors.email && <p className="mt-1 text-xs" style={{ color: 'var(--red)' }}>{errors.email}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Benutzername</label>
              <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)}
                placeholder="dein_name" className="w-full rounded-xl px-4 py-3 text-sm outline-none" style={inputStyle} />
              {errors.username && <p className="mt-1 text-xs" style={{ color: 'var(--red)' }}>{errors.username}</p>}
              <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>Nur Buchstaben, Zahlen und Unterstriche</p>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Passwort</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Mind. 8 Zeichen" className="w-full rounded-xl px-4 py-3 text-sm outline-none" style={inputStyle} />
              {errors.password && <p className="mt-1 text-xs" style={{ color: 'var(--red)' }}>{errors.password}</p>}
            </div>
            <button type="submit" disabled={loading}
              className="w-full rounded-xl py-3 text-sm font-semibold transition-all active:scale-95"
              style={{ background: 'var(--accent)', color: 'white', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Konto wird erstellt…' : 'Konto erstellen'}
            </button>
          </form>
        </div>

        <p className="text-center mt-5 text-sm" style={{ color: 'var(--text-secondary)' }}>
          Bereits ein Konto?{' '}
          <Link href="/login" className="font-medium" style={{ color: 'var(--accent)' }}>Anmelden</Link>
        </p>
      </div>
    </div>
  )
}
