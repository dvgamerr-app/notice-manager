const { AuthorizationCode } = require('simple-oauth2')
// const debuger = require('@touno-io/debuger')
// const { notice } = require('@touno-io/db/schema')
const notice = {}
const sdkNotify = require('../sdk-notify')
const { monitorLINE } = require('../monitor')

const uuid = (length) => {
  let result = ''
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return result
}
const hosts = process.env.BASE_URL || 'https://notice.touno.io'
// const logger = debuger('OAUTH')

module.exports = async (req, reply) => {
  // Authorization oauth2 URI
  const { code, state, error } = req.query
  const { service, room } = req.params
  const redirectUri = `${hosts}/register/${service}`
  const responseType = 'code'
  const scope = 'notify'

  const { ServiceBotOauth, ServiceBot } = notice.get()

  if (code) {
    const oauth = await ServiceBotOauth.findOne({ state, service })
    if (!oauth) {
      throw new Error('Service and State is not verify.')
    }

    const bot = await ServiceBot.findOne({ service })
    const credentials = {
      client: { id: bot.client, secret: bot.secret },
      auth: { tokenHost: 'https://notify-bot.line.me/' },
      options: { bodyFormat: 'form' }
    }
    const client = new AuthorizationCode(credentials)

    const tokenConfig = {
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
      client_id: credentials.client.id,
      client_secret: credentials.client.secret
    }

    if (oauth.accessToken) {
      try {
        const { setRevoke } = await sdkNotify(bot.service, oauth.room)
        await setRevoke()
      } catch (ex) {
        console.error(ex)
      }
    }
    try {
      // eslint-disable-next-line no-console
      const accessToken = await client.getToken(tokenConfig)

      if (accessToken.token.status !== 200) {
        throw new Error('Access Token is not verify.')
      }
      await ServiceBotOauth.updateOne(
        { state },
        { $set: { accessToken: accessToken.token.access_token } }
      )

      const { getStatus } = await sdkNotify(bot.service, oauth.room)
      const res = await getStatus()
      if (res.status !== 200) {
        throw new Error('Status is not verify.')
      }

      await ServiceBotOauth.updateOne({ state }, { $set: { name: res.target } })
      await monitorLINE(
        `Join room *${res.target}* \`${res.message}\` with service *${service}*`
      )
    } catch (ex) {
      await ServiceBotOauth.updateOne({ state }, { $set: { active: false } })
      if (ex.data && ex.data.payload) {
        // eslint-disable-next-line no-console
        console.error('ex', ex.data.payload)
      } else {
        // eslint-disable-next-line no-console
        console.error('ex', ex)
      }
      throw ex
    }
    return reply.redirect(`${hosts}/liff/close`)
  } else if (error) {
    return reply.redirect(hosts)
  } else {
    if (!service || !room) {
      throw new Error('Service or Room is not verify.')
    }

    const bot = await ServiceBot.findOne({ service })
    if (!bot) {
      throw new Error('Service Bot is not register.')
    }

    const credentials = {
      client: { id: bot.client, secret: bot.secret },
      auth: { tokenHost: 'https://notify-bot.line.me/' },
      options: { bodyFormat: 'form' }
    }
    const client = new AuthorizationCode(credentials)

    const newState = uuid(16)
    console.log(`${service} in ${room} new state is '${newState}'`)
    const token = await ServiceBotOauth.findOne({ service, room })
    if (token) {
      await ServiceBotOauth.updateOne(
        { service, room },
        { $set: { state: newState } }
      )
    } else {
      await new ServiceBotOauth({
        name: room,
        service,
        room,
        response_type: responseType,
        redirect_uri: redirectUri,
        state: newState
      }).save()
    }
    const authorizationUri = client.authorizeURL({
      response_type: responseType,
      redirect_uri: redirectUri,
      scope,
      state: newState
    })
    return reply.redirect(authorizationUri)
  }
}
