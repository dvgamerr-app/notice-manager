const axios = require('axios')
// const Boom = require('@hapi/boom')

const synologyHost = process.env.SYNOLOGY_HOST || 'http://localhost:5000'
const synologyAppId = process.env.SYNOLOGY_APPID || 'xxxxxxxxxxxxxxxxx'

module.exports = async (req, h) => {
  try {
    const { authorization } = req.headers

    const regexBearer = /^Bearer./i
    if (!regexBearer.test(authorization)) { return {} }

    const sso = new URLSearchParams({
      app_id: synologyAppId,
      action: 'exchange',
      access_token: authorization.replace(regexBearer, '')
    })
    const { data: res } = await axios({
      method: 'GET',
      url: `${synologyHost}/webman/sso/SSOAccessToken.cgi?${sso}`
    })

    return { user: res.success ? res.data : null }
  } catch (ex) {
    return Boom.internal(ex.message, ex)
  }
}
