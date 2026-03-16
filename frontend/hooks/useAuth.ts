import { useAtom, useSetAtom } from 'jotai'
import { useRouter } from 'next/navigation'
import { authApi } from '../lib/api'
import { accessTokenAtom, currentUserAtom, streakAtom, pendingEventsAtom } from '../store/atoms'

export function useAuth() {
  const [accessToken, setAccessToken] = useAtom(accessTokenAtom)
  const setUser                        = useSetAtom(currentUserAtom)
  const setStreak                      = useSetAtom(streakAtom)
  const setPendingEvents               = useSetAtom(pendingEventsAtom)
  const router                         = useRouter()

  // ── Register ───────────────────────────────────────────────
  async function register(email: string, username: string, password: string) {
    const res = await authApi.register({ email, username, password }) as {
      data: { user: typeof currentUserAtom extends ReturnType<typeof useAtom>[0] ? never : any; accessToken: string }
    }
    setAccessToken(res.data.accessToken)
    setUser(res.data.user)
    router.push('/dashboard')
  }

  // ── Login ──────────────────────────────────────────────────
  async function login(email: string, password: string) {
    const res = await authApi.login({ email, password })
    setAccessToken(res.accessToken)
    // User data is fetched separately via /users/me after login
    router.push('/dashboard')
  }

  // ── Logout ─────────────────────────────────────────────────
  async function logout() {
    try {
      await authApi.logout()
    } finally {
      // Always clear local state, even if the API call fails
      setAccessToken(null)
      setUser(null)
      setStreak(null)
      setPendingEvents([])
      router.push('/login')
    }
  }

  // ── Refresh access token (called silently on 401) ──────────
  async function refreshToken(): Promise<string | null> {
    try {
      const res = await authApi.refresh()
      setAccessToken(res.accessToken)
      return res.accessToken
    } catch {
      // Refresh token expired or invalid — force re-login
      setAccessToken(null)
      setUser(null)
      router.push('/login')
      return null
    }
  }

  return {
    accessToken,
    isAuthenticated: accessToken !== null,
    register,
    login,
    logout,
    refreshToken,
  }
}
