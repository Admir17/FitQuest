import { useAtom, useSetAtom } from 'jotai'
import { useRouter } from 'next/navigation'
import { authApi } from '../lib/api'
import { accessTokenWithStorageAtom, currentUserAtom, streakAtom, pendingEventsAtom } from '../store/atoms'

export function useAuth() {
  const [accessToken, setAccessToken] = useAtom(accessTokenWithStorageAtom)
  const [user, setUser]               = useAtom(currentUserAtom)
  const setStreak                      = useSetAtom(streakAtom)
  const setPendingEvents               = useSetAtom(pendingEventsAtom)
  const router                         = useRouter()

  async function register(email: string, username: string, password: string) {
    const res = await authApi.register({ email, username, password }) as any
    setAccessToken(res.data.accessToken)
    setUser(res.data.user)
    router.push('/dashboard')
  }

  async function login(email: string, password: string) {
    const res = await authApi.login({ email, password }) as any
    const token = res.data?.accessToken ?? res.accessToken
    setAccessToken(token)
    router.push('/dashboard')
  }

  async function logout() {
    try { await authApi.logout() } finally {
      setAccessToken(null)
      setUser(null)
      setStreak(null)
      setPendingEvents([])
      router.push('/login')
    }
  }

  async function refreshToken(): Promise<string | null> {
    try {
      const res = await authApi.refresh() as any
      const token = res.data?.accessToken ?? res.accessToken
      setAccessToken(token)
      return token
    } catch {
      setAccessToken(null)
      setUser(null)
      router.push('/login')
      return null
    }
  }

  return {
    accessToken, user, isAuthenticated: accessToken !== null,
    register, login, logout, refreshToken,
  }
}
