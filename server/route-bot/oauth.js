const debuger = require('@touno-io/debuger')
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
const mongo = require('../mongodb')

module.exports = async (req, res) => {
  // Authorization oauth2 URI
  const { code, state } = req.query
  const { room, service } = req.params
  const redirect_uri = `${hosts}register-bot`
  const response_type = 'code'
  const scope = 'notify'
  await mongo.open()
  const { ServiceOauth, ServiceBot } = mongo.get()

  if (code) {
    try {
      let oauth = await ServiceOauth.findOne({ state })

      let bot = await ServiceBot.findOne({ service: oauth.service })
      let credentials = {
        client: { id: bot.client, secret: bot.secret },
        auth: { tokenHost: 'https://notify-bot.line.me/' },
        options: { bodyFormat: 'form' }
      }
      const oauth2 = require('simple-oauth2').create(credentials)
  
      const tokenConfig = {
        code,
        redirect_uri,
        client_id: credentials.client.id,
        client_secret: credentials.client.secret
      }

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
    if (!service || !room) return res.sendStatus(404)

    let bot = await ServiceBot.findOne({ service })
    if (!bot) return res.sendStatus(404)
  
    let credentials = {
      client: { id: bot.client, secret: bot.secret },
      auth: { tokenHost: 'https://notify-bot.line.me/' },
      options: { bodyFormat: 'form' }
    }
    const oauth2 = require('simple-oauth2').create(credentials)

    const newState = uuid(16)
    logger.log(`${service} in ${room} new state is '${newState}'`)
    try {
      const token = await ServiceOauth.findOne({ service, room })
      if (token) {
        await ServiceOauth.updateOne({ service, room }, { $set: { state: newState } })
      } else {
        await new ServiceOauth({ service, room, response_type, redirect_uri, state: newState }).save()
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