// ── API Client ───────────────────────────────────────────────

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: Record<string, string>
  ) {
    super(message)
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Unknown error' }))
    throw new ApiError(res.status, body.error ?? 'Request failed', body.details)
  }

  if (res.status === 204) return null as T

  return res.json()
}

// ── Auth ─────────────────────────────────────────────────────

export const authApi = {
  register: (data: { email: string; username: string; password: string }) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),

  login: (data: { email: string; password: string }) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),

  logout: () =>
    request('/auth/logout', { method: 'POST' }),

  refresh: () =>
    request<{ accessToken: string }>('/auth/refresh', { method: 'POST' }),
}

// ── Achievements ─────────────────────────────────────────────

export const achievementApi = {
  list: (token: string) =>
    request('/achievements', { headers: { Authorization: `Bearer ${token}` } }),
  streak: (token: string) =>
    request('/achievements/streak', { headers: { Authorization: `Bearer ${token}` } }),
}

// ── Users ────────────────────────────────────────────────────

export const userApi = {
  getMe: (token: string) =>
    request('/users/me', { headers: { Authorization: `Bearer ${token}` } }),

  getStats: (token: string) =>
    request('/users/me/stats', { headers: { Authorization: `Bearer ${token}` } }),

  getLeaderboard: (token: string) =>
    request('/users/leaderboard', { headers: { Authorization: `Bearer ${token}` } }),
}

// ── Workouts ─────────────────────────────────────────────────

export const workoutApi = {
  start: (token: string, data: { name: string; template_id?: string }) =>
    request('/workouts', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}` },
    }),

  list: (token: string) =>
    request('/workouts', { headers: { Authorization: `Bearer ${token}` } }),

  get: (token: string, id: string) =>
    request(`/workouts/${id}`, { headers: { Authorization: `Bearer ${token}` } }),

  finish: (token: string, id: string) =>
    request(`/workouts/${id}/finish`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
    }),

  rename: (token: string, id: string, name: string) =>
    request(`/workouts/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name }),
      headers: { Authorization: `Bearer ${token}` },
    }),

  remove: (token: string, id: string) =>
    request(`/workouts/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }),

  addSet: (
    token: string,
    workoutId: string,
    data: {
      exercise_id: string
      set_number: number
      reps?: number
      weight_kg?: number
      duration_sec?: number
    }
  ) =>
    request(`/workouts/${workoutId}/sets`, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}` },
    }),

  deleteSet: (token: string, workoutId: string, setId: string) =>
    request(`/workouts/${workoutId}/sets/${setId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }),
}

// ── Exercises ────────────────────────────────────────────────

export const exerciseApi = {
  list: (token: string) =>
    request('/exercises', { headers: { Authorization: `Bearer ${token}` } }),

  create: (
    token: string,
    data: { name: string; category: string; muscle_groups: string[] }
  ) =>
    request('/exercises', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}` },
    }),

  delete: (token: string, id: string) =>
    request(`/exercises/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }),
}

// ── Templates ────────────────────────────────────────────────

export const templateApi = {
  list: () => request('/templates'),
  get:  (id: string) => request(`/templates/${id}`),
}
