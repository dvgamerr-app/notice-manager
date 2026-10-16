import liff from '@line/liff'
import { useEffect, useState } from 'react'
import { requiresLiffTunnel } from './environment.js'

const BUILD_LIFF_ID = import.meta.env.VITE_LIFF_ID || ''
const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '')
const DEV_BYPASS = import.meta.env.VITE_DEV_AUTH_BYPASS === 'true'
const SESSION_KEY = 'line_manager_session'

const sessionProfile = (user) => ({
  userId: user.id,
  displayName: user.displayName,
  pictureUrl: user.pictureUrl || '',
})

const DEV_SESSION = {
  token: 'dev',
  profile: { userId: 'dev-user', displayName: 'Local developer', pictureUrl: '' },
}

const loadRemoteConfig = () =>
  fetch(`${API_BASE}/app/config`)
    .then((response) => (response.ok ? response.json() : /** @type {{ liffId?: string }} */ ({})))
    .catch(() => /** @type {{ liffId?: string }} */ ({}))

// Returns the cached local session when the backend still accepts it.
const restoreCachedSession = async () => {
  const cachedToken = localStorage.getItem(SESSION_KEY)
  if (!cachedToken) return null
  const response = await fetch(`${API_BASE}/api/session`, {
    headers: { Authorization: `Bearer ${cachedToken}` },
  })
  if (!response.ok) {
    localStorage.removeItem(SESSION_KEY)
    return null
  }
  const session = await response.json()
  return { token: cachedToken, profile: sessionProfile(session.user) }
}

const exchangeLiffAccessToken = async () => {
  const accessToken = liff.getAccessToken()
  if (!accessToken) throw new Error('LIFF ไม่ได้ส่ง access token')
  const response = await fetch(`${API_BASE}/auth/liff`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ access_token: accessToken }),
  })
  const auth = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(auth.error || 'ยืนยันบัญชี LINE ไม่สำเร็จ')
  localStorage.setItem(SESSION_KEY, auth.token)
  return { token: auth.token, profile: sessionProfile(auth.user) }
}

const loginWithLiff = async (liffId) => {
  await liff.init({ liffId })
  if (!liff.isLoggedIn()) {
    // Let LINE use the LIFF HTTPS Endpoint URL configured for this app.
    liff.login()
    return null
  }
  return (await restoreCachedSession()) || exchangeLiffAccessToken()
}

// Resolves to { token, profile }, or null when LINE is redirecting to login.
const resolveSession = (liffId) => {
  if (liffId) return loginWithLiff(liffId)
  if (!DEV_BYPASS) throw new Error('ยังไม่ได้ตั้งค่า LIFF_ID')
  return DEV_SESSION
}

function useRemoteLiffId() {
  // The LIFF ID is served by the backend (`LIFF_ID`) so a prebuilt image works
  // without a rebuild; the build-time VITE_LIFF_ID remains as a fallback.
  const [liffId, setLiffId] = useState(BUILD_LIFF_ID)
  const [configLoaded, setConfigLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    loadRemoteConfig().then((config) => {
      if (cancelled) return
      if (config.liffId) setLiffId(config.liffId)
      setConfigLoaded(true)
    })
    return () => {
      cancelled = true
    }
  }, [])

  return { liffId, configLoaded }
}

export function useLiff() {
  const { liffId: LIFF_ID, configLoaded } = useRemoteLiffId()
  const requiresTunnel = configLoaded && requiresLiffTunnel(window.location, {
    liffId: LIFF_ID,
    devBypass: DEV_BYPASS,
  })
  const [profile, setProfile] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem(SESSION_KEY))
  const [error, setError] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!configLoaded) return undefined
    let cancelled = false

    const start = async () => {
      if (requiresTunnel) return
      const session = await resolveSession(LIFF_ID)
      if (!session || cancelled) return
      setToken(session.token)
      setProfile(session.profile)
    }

    start()
      .catch((cause) => {
        if (!cancelled) setError(cause.message || String(cause))
      })
      .finally(() => {
        if (!cancelled) setReady(true)
      })

    return () => {
      cancelled = true
    }
  }, [configLoaded, requiresTunnel, LIFF_ID])

  const logout = async () => {
    const currentToken = localStorage.getItem(SESSION_KEY)
    localStorage.removeItem(SESSION_KEY)
    if (currentToken) {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${currentToken}` },
      }).catch(() => {})
    }
    setToken(null)
    setProfile(null)
    if (LIFF_ID && liff.isLoggedIn()) liff.logout()
    window.location.reload()
  }

  return { profile, token, error, ready, requiresTunnel, liff, logout }
}
