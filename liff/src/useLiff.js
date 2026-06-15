import liff from '@line/liff'
import { useState, useEffect } from 'react'

const LIFF_ID = import.meta.env.VITE_LIFF_ID || ''

export function useLiff() {
  const [profile, setProfile] = useState(null)
  const [error, setError] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!LIFF_ID) {
      // dev mode without LIFF — mock profile
      setProfile({ userId: 'dev-user', displayName: 'Dev User', pictureUrl: '' })
      setReady(true)
      return
    }
    liff.init({ liffId: LIFF_ID })
      .then(() => {
        if (!liff.isLoggedIn()) { liff.login(); return }
        return liff.getProfile()
      })
      .then(p => { if (p) { setProfile(p); setReady(true) } })
      .catch(e => { setError(e.message); setReady(true) })
  }, [])

  return { profile, error, ready, liff }
}
