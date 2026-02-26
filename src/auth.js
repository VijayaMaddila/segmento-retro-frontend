const AUTH_KEY = 'retro.auth.v1'

export function saveAuth(data) {
  try {
    const payload = data || {}
    localStorage.setItem(AUTH_KEY, JSON.stringify(payload))
  } catch {
    // ignore storage errors
  }
}

export function getAuth() {
  try {
    const raw = localStorage.getItem(AUTH_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function getAuthToken() {
  const auth = getAuth()
  if (!auth || typeof auth !== 'object') return null
  return auth.token || auth.accessToken || null
}

export function hasAuth() {
  return !!localStorage.getItem(AUTH_KEY)
}

export function clearAuth() {
  try {
    localStorage.removeItem(AUTH_KEY)
  } catch {
    // ignore
  }
}

