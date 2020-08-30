const axios = require('axios')
const apiLINE = 'https://notify-api.line.me/api'

module.exports = {
  getStatus: accessToken => axios({
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
    url: `${apiLINE}/status`,
    resolveWithFullResponse: true
  }),
  pushMessage: (accessToken, message) => {
    if (typeof message === 'string') {
      message = { message }
    }
    return axios({
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      url: `${apiLINE}/notify`,
      data: message
    })
  },
  setRevoke: accessToken => axios({
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    url: `${apiLINE}/revoke`
  })
}
