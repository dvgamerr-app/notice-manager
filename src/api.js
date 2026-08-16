const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '')
const DEV_BYPASS = import.meta.env.VITE_DEV_AUTH_BYPASS === 'true'

const withQuery = (path, query = {}) => {
  const search = new URLSearchParams()
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value))
    }
  })
  const suffix = search.toString()
  return suffix ? `${path}?${suffix}` : path
}

const req = (token) => async (method, path, body) => {
  const response = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(DEV_BYPASS ? { 'X-Dev-User': 'dev-user' } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = /** @type {Error & { status?: number, data?: any }} */ (
      new Error(data.error || response.statusText || 'Request failed')
    )
    error.status = response.status
    error.data = data
    throw error
  }
  return data
}

export const createApi = (token) => {
  const call = req(token)
  return {
    getAppConfig: () => call('GET', '/app/config'),
    getSession: () => call('GET', '/api/session'),
    getBots: () => call('GET', '/api/bots'),
    getBot: (bot) => call('GET', `/api/bots/${encodeURIComponent(bot)}`),
    createBot: (data) => call('POST', '/api/bots', data),
    updateBot: (bot, data) =>
      call('PATCH', `/api/bots/${encodeURIComponent(bot)}`, data),
    getQuota: (bot) =>
      call('GET', `/api/bots/${encodeURIComponent(bot)}/quota`),
    getChats: (bot) =>
      call('GET', `/api/bots/${encodeURIComponent(bot)}/chats`),
    updateChat: (bot, chat, data) =>
      call(
        'PATCH',
        `/api/bots/${encodeURIComponent(bot)}/chats/${encodeURIComponent(chat)}`,
        data,
      ),
    bulkUpdateChats: (bot, data) =>
      call('POST', `/api/bots/${encodeURIComponent(bot)}/chats/bulk`, data),
    bulkTestChats: (bot, data) =>
      call('POST', `/api/bots/${encodeURIComponent(bot)}/chats/bulk-test`, data),
    refreshChat: (bot, chat) =>
      call(
        'POST',
        `/api/bots/${encodeURIComponent(bot)}/chats/${encodeURIComponent(chat)}/refresh`,
        {},
      ),
    leaveChat: (bot, chat) =>
      call(
        'POST',
        `/api/bots/${encodeURIComponent(bot)}/chats/${encodeURIComponent(chat)}/leave`,
        {},
      ),
    testChat: (bot, chat, data) =>
      call(
        'POST',
        `/api/bots/${encodeURIComponent(bot)}/chats/${encodeURIComponent(chat)}/test`,
        data,
      ),
    syncWebhook: (bot) =>
      call('POST', `/api/bots/${encodeURIComponent(bot)}/webhook/sync`, {}),
    testWebhook: (bot) =>
      call('POST', `/api/bots/${encodeURIComponent(bot)}/webhook/test`, {}),
    getDeliveries: (bot, query) =>
      call(
        'GET',
        withQuery(`/api/bots/${encodeURIComponent(bot)}/deliveries`, query),
      ),
    getWebhookEvents: (bot, query) =>
      call(
        'GET',
        withQuery(`/api/bots/${encodeURIComponent(bot)}/webhook-events`, query),
      ),
    getApiKeys: (bot) =>
      call('GET', `/api/bots/${encodeURIComponent(bot)}/api-keys`),
    createApiKey: (bot, data) =>
      call('POST', `/api/bots/${encodeURIComponent(bot)}/api-keys`, data),
    revokeApiKey: (bot, key) =>
      call(
        'DELETE',
        `/api/bots/${encodeURIComponent(bot)}/api-keys/${encodeURIComponent(key)}`,
      ),
    getAuditLogs: (bot, query) =>
      call(
        'GET',
        withQuery(`/api/bots/${encodeURIComponent(bot)}/audit-logs`, query),
      ),
  }
}
