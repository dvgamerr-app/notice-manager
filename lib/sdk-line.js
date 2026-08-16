import { createHmac, timingSafeEqual } from 'node:crypto'

const LINE_API = 'https://api.line.me/v2/bot'

const readResponseData = async (response) => {
  const text = await response.text()
  if (!text) return {}
  try {
    return JSON.parse(text)
  } catch {
    return { message: text }
  }
}

export class LineApiError extends Error {
  constructor(
    message,
    { status, details, requestId } = /** @type {any} */ ({}),
  ) {
    super(message)
    this.name = 'LineApiError'
    this.status = status
    this.details = details
    this.requestId = requestId
  }
}

const call = async (
  token,
  path,
  { body, method = 'POST' } = /** @type {{ body?: any, method?: string }} */ ({}),
) => {
  const response = await fetch(`${LINE_API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  const requestId = response.headers.get('x-line-request-id')
  const data = await readResponseData(response)

  if (!response.ok) {
    throw new LineApiError(
      data.message || `LINE API request failed with ${response.status}`,
      { status: response.status, details: data.details, requestId },
    )
  }

  return { data, requestId, status: response.status }
}

const tokenVerification = (data, type) => {
  const scopes = String(data.scope || '').split(/\s+/).filter(Boolean)
  return {
    valid: true,
    type,
    channelId: data.client_id || null,
    expiresIn: Number(data.expires_in) || null,
    lineLoginToken: scopes.some((scope) => ['openid', 'profile', 'email'].includes(scope)),
  }
}

export const verifyChannelAccessToken = async (token) => {
  const shortOrLongResponse = await fetch('https://api.line.me/v2/oauth/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ access_token: token }),
  })
  const shortOrLongData = await readResponseData(shortOrLongResponse)
  if (shortOrLongResponse.ok) {
    return tokenVerification(shortOrLongData, 'short-or-long-lived')
  }

  const version21Response = await fetch(
    `https://api.line.me/oauth2/v2.1/verify?access_token=${encodeURIComponent(token)}`,
  )
  const version21Data = await readResponseData(version21Response)
  if (version21Response.ok) return tokenVerification(version21Data, 'v2.1')

  return {
    valid: false,
    type: null,
    channelId: null,
    expiresIn: null,
    lineLoginToken: false,
  }
}

export const verifySignature = (secret, rawBody, signature) => {
  if (!secret || !rawBody || !signature) return false
  const expected = createHmac('sha256', secret).update(rawBody).digest()
  let received
  try {
    received = Buffer.from(signature, 'base64')
  } catch {
    return false
  }
  return received.length === expected.length && timingSafeEqual(received, expected)
}

export const normalizeMessages = (value) => {
  if (typeof value === 'string') return [{ type: 'text', text: value }]
  const messages = Array.isArray(value) ? value : [value]
  if (!messages.length || messages.length > 5 || messages.some((message) => !message?.type)) {
    throw new TypeError('messages must contain between 1 and 5 LINE message objects')
  }
  return messages
}

export const lineClient = (token) => ({
  getBotInfo: () => call(token, '/info', { method: 'GET' }),
  getMessageQuota: () => call(token, '/message/quota', { method: 'GET' }),
  getMessageConsumption: () =>
    call(token, '/message/quota/consumption', { method: 'GET' }),
  getWebhookEndpoint: () => call(token, '/channel/webhook/endpoint', { method: 'GET' }),
  setWebhookEndpoint: (endpoint) =>
    call(token, '/channel/webhook/endpoint', { method: 'PUT', body: { endpoint } }),
  testWebhookEndpoint: (endpoint) =>
    call(token, '/channel/webhook/test', {
      body: endpoint ? { endpoint } : {},
    }),
  validatePush: (messages) =>
    call(token, '/message/validate/push', {
      body: { messages: normalizeMessages(messages) },
    }),
  push: (to, messages, options = {}) =>
    call(token, '/message/push', {
      body: {
        to,
        messages: normalizeMessages(messages),
        ...(options.notificationDisabled === undefined
          ? {}
          : { notificationDisabled: options.notificationDisabled }),
      },
    }),
  reply: (replyToken, messages) =>
    call(token, '/message/reply', {
      body: { replyToken, messages: normalizeMessages(messages) },
    }),
  getProfile: (userId) => call(token, `/profile/${encodeURIComponent(userId)}`, { method: 'GET' }),
  getGroupSummary: (groupId) =>
    call(token, `/group/${encodeURIComponent(groupId)}/summary`, { method: 'GET' }),
  leaveGroup: (groupId) =>
    call(token, `/group/${encodeURIComponent(groupId)}/leave`, { body: {} }),
  leaveRoom: (roomId) =>
    call(token, `/room/${encodeURIComponent(roomId)}/leave`, { body: {} }),
})
