const qs = require('querystring')
const axios = require('axios')
const apiLINE = 'https://notify-api.line.me/api'

const instance = axios.create({
  validateStatus: () => true
})

const getStatus = async (accessToken) => {
  const { data } = await instance({
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
    url: `${apiLINE}/status`
  })
  return data
}
const setRevoke = async (accessToken) => {
  const { data } = await instance({
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    url: `${apiLINE}/revoke`
  })
  return data
}

const pushNotify = async (accessToken, message) => {
  if (typeof message === 'string') {
    message = { message }
  }
  for (const key in message) {
    if (!message[key]) { delete message[key] }
  }

  const res = await instance({
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    url: `${apiLINE}/notify`,
    data: qs.stringify(message)
  })
  return res
}

module.exports = {
  getStatus,
  setRevoke,
  pushNotify
}