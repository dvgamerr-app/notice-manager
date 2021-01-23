// const qs = require('querystring')
// const axios = require('axios')

// const synologyHost = process.env.SYNOLOGY_HOST || 'http://localhost:5000'
// const synologyAppId = process.env.SYNOLOGY_APPID || 'xxxxxxxxxxxxxxxxx'

module.exports = (req, h) => {
  // eslint-disable-next-line no-console
  console.log(req.headers)
  // const sso = qs.stringify({
  //   app_id: synologyAppId,
  //   action: 'exchange',
  //   access_token: req.payload.access_token
  // })
  // const { data: res } = await axios({
  //   method: 'GET',
  //   url: `${synologyHost}/webman/sso/SSOAccessToken.cgi?${sso}`
  // })

  // if (res.success) {
  //   // eslint-disable-next-line no-console
  //   console.log(res.data)
  // }
  return {}
}
