const BASE = import.meta.env.VITE_API_URL || ''

const req = (token) => async (method, path, body) => {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || res.statusText)
  }
  return res.json()
}

export const createApi = (token) => {
  const call = req(token)
  return {
    getBots: () => call('GET', '/api/line'),
    getRooms: (bot) => call('GET', `/api/line/${bot}/room`),
    getHistory: (bot) => call('GET', `/api/line/${bot}/history`),
    createBot: (data) => call('POST', '/api/bot', data),
  }
}
