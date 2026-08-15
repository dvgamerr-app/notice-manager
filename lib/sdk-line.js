import { createHmac, timingSafeEqual } from 'node:crypto'

const LINE_API = 'https://api.line.me/v2/bot'

export class LineApiError extends Error {
  constructor(message, { status, details, requestId } = {}) {
    super(message)
    this.name = 'LineApiError'
    this.status = status
    this.details = details
    this.requestId = requestId
  }
}

const call = async (token, path, { body, method = 'POST' } = {}) => {
  const response = await fetch(`${LINE_API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  const requestId = response.headers.get('x-line-request-id')
  const text = await response.text()
  let data = {}
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = { message: text }
    }
  }

  if (!response.ok) {
    throw new LineApiError(
      data.message || `LINE API request failed with ${response.status}`,
      { status: response.status, details: data.details, requestId },
    )
  }

  return { data, requestId, status: response.status }
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
