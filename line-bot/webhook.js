const request = require('request-promise')
const ngrok = require('./ngrok')

module.exports = async body => {
  try {
    console.log('[webhook-ngrok] ', ngrok)
    let res = await request({ method: 'POST', url: ngrok, body: body, json: true })
    if (res && res.error) throw new Error(res.error)
  } catch (ex) {
    // console.warn('[webhook-ngrok] fail -- ', ex.message)
    // console.error(ex.stack)
  }
}
