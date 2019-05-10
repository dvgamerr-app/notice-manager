const request = require('request-promise')
const ngrok = require('./ngrok')

module.exports = async body => {
  try {
    console.log('request -- ngrok:', ngrok)
    console.log(body)
    await request({ method: 'POST', url: ngrok, body: body, json: true })
  } catch (ex) {
    console.warn('request webhook to ngrok -- ', ex.message)
    console.error(ex.stack)
  }
}
