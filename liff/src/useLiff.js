import liff from '@line/liff'
import { useEffect, useState } from 'react'
import { requiresLiffTunnel } from './environment.js'

const LIFF_ID = import.meta.env.VITE_LIFF_ID || ''
const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '')
const DEV_BYPASS = import.meta.env.VITE_DEV_AUTH_BYPASS === 'true'
const SESSION_KEY = 'line_manager_session'

const sessionProfile = (user) => ({
  userId: user.id,
  displayName: user.displayName,
  pictureUrl: user.pictureUrl || '',
})

export function useLiff() {
  const requiresTunnel = requiresLiffTunnel(window.location, {
    liffId: LIFF_ID,
    devBypass: DEV_BYPASS,
  })
  const [profile, setProfile] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem(SESSION_KEY))
  const [error, setError] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    const start = async () => {
      if (requiresTunnel) return

      if (!LIFF_ID) {
        if (!DEV_BYPASS) {
          throw new Error('ยังไม่ได้ตั้งค่า VITE_LIFF_ID')
        }
        if (!cancelled) {
          setProfile({
            userId: 'dev-user',
            displayName: 'Local developer',
            pictureUrl: '',
          })
          setToken('dev')
        }
        return
      }

      await liff.init({ liffId: LIFF_ID })
      if (!liff.isLoggedIn()) {
        // Let LINE use the LIFF HTTPS Endpoint URL configured for this app.
        liff.login()
        return
      }

      const cachedToken = localStorage.getItem(SESSION_KEY)
      if (cachedToken) {
        const sessionResponse = await fetch(`${API_BASE}/api/session`, {
          headers: { Authorization: `Bearer ${cachedToken}` },
        })
        if (sessionResponse.ok) {
          const session = await sessionResponse.json()
          if (!cancelled) {
            setToken(cachedToken)
            setProfile(sessionProfile(session.user))
          }
          return
        }
        localStorage.removeItem(SESSION_KEY)
      }

      const accessToken = liff.getAccessToken()
      if (!accessToken) throw new Error('LIFF ไม่ได้ส่ง access token')
      const authResponse = await fetch(`${API_BASE}/auth/liff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: accessToken }),
      })
      const auth = await authResponse.json().catch(() => ({}))
      if (!authResponse.ok) throw new Error(auth.error || 'ยืนยันบัญชี LINE ไม่สำเร็จ')

      localStorage.setItem(SESSION_KEY, auth.token)
      if (!cancelled) {
        setToken(auth.token)
        setProfile(sessionProfile(auth.user))
      }
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
  }, [requiresTunnel])

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
