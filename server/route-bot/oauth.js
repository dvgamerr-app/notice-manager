const debuger = require('@touno-io/debuger')
const credentials = {
  client: { id: process.env.LINE_CLIENT, secret: process.env.LINE_SECRET },
  auth: { tokenHost: 'https://notify-bot.line.me/' },
  options: { bodyFormat: 'form' }
}
const uuid = length => {
  let result = ''
  let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  for (let i = 0; i < length; i++ ) {
     result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result
}
const hosts = process.env.HOSTNAME || 'http://localhost:4000/'
const logger = debuger('OAUTH')
const oauth2 = require('simple-oauth2').create(credentials)
const mongo = require('../mongodb')

module.exports = async (req, res) => {
  // Authorization oauth2 URI
  const { code, state } = req.query
  const { room } = req.params
  const redirect_uri = `${hosts}notify-bot`
  const response_type = 'code'
  const scope = 'notify'
  await mongo.open()
  const { ServiceOauth } = mongo.get()
  if (code) {
    const tokenConfig = {
      code,
      redirect_uri,
      client_id: credentials.client.id,
      client_secret: credentials.client.secret
    }
    try {
      const result = await oauth2.authorizationCode.getToken(tokenConfig)
      const access = oauth2.accessToken.create(result)
      await ServiceOauth.updateOne({ state }, { $set: { accessToken: access.token.access_token } })
      res.json({ ok: true })
    } catch (ex) {
      logger.error(ex)
      res.json({ ok: false, error: ex.message || ex })
    } finally {
      res.end()
    }
  } else {
    if (!room) return res.redirect(hosts)
    const newState = uuid(16)
    logger.log(`${room} - state ${newState}`)
    try {
      const token = await ServiceOauth.findOne({ room })
      if (token) {
        await ServiceOauth.updateOne({ room }, { $set: { state: newState } })
      } else {
        await new ServiceOauth({ room, response_type, redirect_uri, state: newState }).save()
      }
      const authorizationUri = oauth2.authorizationCode.authorizeURL({ response_type, redirect_uri, scope, state: newState })
      return res.redirect(authorizationUri)
    } catch (ex) {
      logger.error(ex)
      res.json({ ok: false, error: ex.message || ex })
    } finally {
      res.end()
    }
  }
}