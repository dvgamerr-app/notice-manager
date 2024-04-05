import { db } from './db-conn'
import pino from 'pino'

const logger = pino()
const apiLINE = 'https://notify-api.line.me/api'

export const getStatus = async (accessToken) => {
  if (!accessToken) throw new Error('Need accessToken.')
  const res = await fetch(`${apiLINE}/status`, { method: 'GET', headers: { Authorization: `Bearer ${accessToken}` } })
  return {
    status: res.status,
    data: await res.json()
  }
}
export const setRevoke = async (accessToken) => {
  if (!accessToken) throw new Error('Need accessToken.')
  const res = await fetch(`${apiLINE}/revoke`, { method: 'POST', headers: { Authorization: `Bearer ${accessToken}` } })
  return {
    status: res.status,
    data: await res.json()
  }
}

const pushNotify = async (accessToken, message) => {
  if (typeof message === 'string') {
    message = { message }
  }
  for (const key in message) {
    if (!message[key]) {
      delete message[key]
    }
  }

  if (Object.keys(message).length === 0) {
    throw new Error("'message' in body is empty.")
  }

  const res = await fetch(`${apiLINE}/notify`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams(message)
  })
  
  return {
    status: res.status,
    headers: res.headers,
    data: await res.json()
  }
}


const getToken = (serviceName, roomName) => {
  const auth = db.query(`
    SELECT access_token FROM notify_auth a INNER JOIN notify_service s ON a.service = s.service
    WHERE a.service = ?1 AND a.room = ?2 AND s.active = true
  `).values([ serviceName, roomName ])
  if (!auth) return null
  return auth.access_token
}

export default async(serviceName, roomName) => {
  let accessToken = serviceName
  if (roomName != undefined) accessToken = getToken(serviceName, roomName)

  return {
    pushNotify: message => pushNotify(accessToken, message),
    getStatus: () => getStatus(accessToken),
    setRevoke: () => setRevoke(accessToken)
  }
}
