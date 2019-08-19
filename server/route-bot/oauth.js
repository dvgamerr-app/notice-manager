import debuger from '@touno-io/debuger'
import mongo from '../mongodb'
import { getStatus, setRevoke } from '../api-notify'
import { notifyLogs } from '../helper'

const uuid = length => {
  let result = ''
  let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  for (let i = 0; i < length; i++ ) {
     result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result
}
const hosts = process.env.HOST_API || 'http://localhost:4000/'
const logger = debuger('OAUTH')

export default async (req, res) => {
  // Authorization oauth2 URI
  const { code, state, error } = req.query
  const { room, service } = req.params
  const redirect_uri = `${hosts}/register-bot`
  const response_type = 'code'
  const scope = 'notify'
  
  try {
    await mongo.open()
    const { ServiceOauth, ServiceBot } = mongo.get()

    if (code) {
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
      
      if (oauth.accessToken) {
        try {
          await setRevoke(oauth.accessToken)
        } catch (ex) {
          logger.error(ex)
        }
      }

      try {
        const result = await oauth2.authorizationCode.getToken(tokenConfig)
        const access = oauth2.accessToken.create(result)
        let { body } = await getStatus(access.token.access_token)

        let data = await ServiceOauth.findOne({ state })        
        await ServiceOauth.updateOne({ state }, { $set: { name: body.target, accessToken: access.token.access_token } })
        await notifyLogs(`Join room *${body.target}* with service *${data.service}*`)
      } catch (ex) {
        await ServiceOauth.updateOne({ state }, { $set: { active: false } })
      }

      return res.redirect(hosts)
    } else if (error) {
      return res.redirect(hosts)
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
      const token = await ServiceOauth.findOne({ service, room })
      if (token) {
        await ServiceOauth.updateOne({ service, room }, { $set: { state: newState } })
      } else {
        await new ServiceOauth({ name: room, service, room, response_type, redirect_uri, state: newState }).save()
      }
      const authorizationUri = oauth2.authorizationCode.authorizeURL({ response_type, redirect_uri, scope, state: newState })
      return res.redirect(authorizationUri)
    }
  } catch (ex) {
    logger.error(ex)
    res.json({ error: ex.message || ex })
  } finally {
    res.end()
  }
}