const qs = require('querystring')
const axios = require('axios')
const apiLINE = 'https://notify-api.line.me/api'

const instance = axios.create({
  validateStatus: () => true
})

module.exports = {
  getStatus: async (accessToken) => {
    const { data } = await instance({
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
      url: `${apiLINE}/status`
    })
    return data
  },
  pushMessage: async (accessToken, message) => {
    if (typeof message === 'string') {
      message = { message }
    }

    const res = await instance({
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      url: `${apiLINE}/notify`,
      data: qs.stringify(message)
    })
    return res
  },
  setRevoke: async (accessToken) => {
    const { data } = await instance({
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      url: `${apiLINE}/revoke`
    })
    return data
  }
}
