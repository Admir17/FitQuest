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
        if (err.details) {
          setErrors(err.details)
        } else {
          setErrors({ general: err.message })
        }
      } else {
        setErrors({ general: 'Etwas ist schiefgelaufen. Bitte versuche es erneut.' })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">FitQuest</h1>
          <p className="mt-2 text-gray-500 text-sm">Starte deine Fitness-Reise</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {errors.general}
            </div>
          )}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">E-Mail</label>
            <input
              id="email" type="email" required autoComplete="email"
              value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="du@beispiel.de"
            />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
          </div>
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">Benutzername</label>
            <input
              id="username" type="text" required autoComplete="username"
              value={username} onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="dein_name"
            />
            {errors.username && <p className="mt-1 text-xs text-red-600">{errors.username}</p>}
            <p className="mt-1 text-xs text-gray-400">Nur Buchstaben, Zahlen und Unterstriche</p>
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Passwort</label>
            <input
              id="password" type="password" required autoComplete="new-password"
              value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Mind. 8 Zeichen"
            />
            {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
          </div>
          <button
            type="submit" disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-medium rounded-lg py-2.5 text-sm transition-colors"
          >
            {loading ? 'Konto wird erstellt…' : 'Konto erstellen'}
          </button>
        </form>
        <p className="text-center mt-4 text-sm text-gray-500">
          Bereits ein Konto?{' '}
          <Link href="/login" className="text-indigo-600 hover:underline font-medium">Anmelden</Link>
        </p>
      </div>
    </div>
  )
}
