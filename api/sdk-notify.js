const qs = require('querystring')
const axios = require('axios')
const apiLINE = 'https://notify-api.line.me/api'

const logger = require('@touno-io/debuger')('notify')
const { notice } = require('@touno-io/db/schema')

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
const getToken = async (service, room) => {
  if (!service || !room) { return logger.log('No service, No room.') }

  const { ServiceBotOauth } = notice.get()
  const oauth = await ServiceBotOauth.findOne({ service, room })
  if (!oauth || !oauth.accessToken) { return logger.log(`Oauth: ${service} in ${room}, No access token.`) }
  return oauth.accessToken
}

module.exports = async (service, room) => {
  const accesstoken = await getToken(service, room)
  return {
    pushNotify: message => pushNotify(accesstoken, message),
    getStatus: () => getStatus(accesstoken),
    setRevoke: () => setRevoke(accesstoken)
  }
}
