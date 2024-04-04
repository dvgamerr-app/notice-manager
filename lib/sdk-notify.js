// const logger = require('@touno-io/debuger')('notify')
// const { notice } = require('@touno-io/db/schema')
import { dbGetOne } from './db-conn'

const apiLINE = 'https://notify-api.line.me/api'

const getStatus = async (accessToken) => {
  const res = await fetch({
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
    url: `${apiLINE}/status`
  })
  return await res.json()
}
const setRevoke = async (accessToken) => {
  const res = await fetch({
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    url: `${apiLINE}/revoke`
  })
  return await res.json()
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
  const res = await fetch({
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    url: `${apiLINE}/notify`,
    data: new URLSearchParams(message)
  })
  return res
}


const getToken = async (serviceName, roomName) => {
  const auth = await dbGetOne(`
  SELECT access_token FROM notify_auth a INNER JOIN notify_service s ON a.service = s.service
  WHERE a.service = ? AND a.room = ? AND s.active = true;
  `, [ serviceName, roomName ])
  if (!auth) return null
  return auth.access_token
}

export  default async(serviceName, roomName) => {
  let accessToken = serviceName
  if (roomName != undefined) accessToken = await getToken(serviceName, roomName)

  return {
    pushNotify: message => pushNotify(accessToken, message),
    getStatus: () => getStatus(accessToken),
    setRevoke: () => setRevoke(accessToken)
  }
}
