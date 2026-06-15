import liff from '@line/liff'
import { useState, useEffect } from 'react'

const LIFF_ID = import.meta.env.VITE_LIFF_ID || ''
const SESSION_KEY = 'liff_session_token'

export function useLiff() {
  const [profile, setProfile] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem(SESSION_KEY))
  const [error, setError] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!LIFF_ID) {
      setProfile({ userId: 'dev-user', displayName: 'Dev User', pictureUrl: '' })
      setToken('dev-token')
      setReady(true)
      return
    }

    liff.init({ liffId: LIFF_ID })
      .then(async () => {
        if (!liff.isLoggedIn()) { liff.login(); return }
        const p = await liff.getProfile()
        setProfile(p)

        // Exchange LIFF access token for session token (cached until expiry)
        if (!localStorage.getItem(SESSION_KEY)) {
          const res = await fetch('/auth/liff', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ access_token: liff.getAccessToken() })
          })
          if (res.ok) {
            const { token: t } = await res.json()
            localStorage.setItem(SESSION_KEY, t)
            setToken(t)
          }
        }
        setReady(true)
      })
      .catch(e => { setError(e.message); setReady(true) })
  }, [])

  const logout = () => {
    localStorage.removeItem(SESSION_KEY)
    setToken(null)
    if (LIFF_ID) liff.logout()
  }

  return { profile, token, error, ready, liff, logout }
}
