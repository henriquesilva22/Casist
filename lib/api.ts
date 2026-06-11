const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export function authHeaders(headers: HeadersInit = {}) {
  const token = typeof window !== 'undefined'
    ? (localStorage.getItem('lifeos_token') || (localStorage.getItem('lifeos_user') ? `local:${localStorage.getItem('lifeos_user')}` : 'local:guest'))
    : null
  return {
    ...(headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export async function request(path: string, options: RequestInit = {}) {
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers: authHeaders(options.headers || {}) })
  if (!res.ok) throw new Error(await res.text())
  if (res.status === 204) return null
  return res.json()
}

export { BASE_URL }
