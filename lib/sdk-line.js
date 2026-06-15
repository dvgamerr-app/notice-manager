import { createHmac } from 'crypto'

const LINE_API = 'https://api.line.me/v2/bot'

const call = async (token, path, body, method = 'POST') => {
  const res = await fetch(`${LINE_API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: body !== undefined ? JSON.stringify(body) : undefined
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`LINE API ${path}: ${res.status} ${text}`)
  }
  return res.json()
}

export const verifySignature = (secret, rawBody, signature) => {
  const hash = createHmac('SHA256', secret).update(rawBody).digest('base64')
  return hash === signature
}

export const toMessages = (msg) => {
  if (!msg) return []
  const m = typeof msg === 'string' ? { type: 'text', text: msg } : typeof msg === 'function' ? msg() : msg
  return Array.isArray(m) ? m : [m]
}

export const lineClient = (token) => ({
  reply: (replyToken, messages) =>
    call(token, '/message/reply', { replyToken, messages: toMessages(messages) }),
  push: (to, messages) =>
    call(token, '/message/push', { to, messages: toMessages(messages) }),
  leaveGroup: (groupId) => call(token, `/group/${groupId}/leave`, {}),
  leaveRoom: (roomId) => call(token, `/room/${roomId}/leave`, {}),
  getGroupMembersCount: (groupId) =>
    call(token, `/group/${groupId}/members/count`, undefined, 'GET')
})

export const makePush = (client) => async (event, sender) => {
  if (!sender) return {}
  const messages = toMessages(sender)
  // reply token of all zeros = webhook verify call
  if (event.replyToken && !/^0+$/.test(event.replyToken)) {
    return client.reply(event.replyToken, messages)
  }
  const to = event.source[`${event.source.type}Id`]
  return client.push(to, messages)
}
