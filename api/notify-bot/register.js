const { AuthorizationCode } = require('simple-oauth2')
const logger = require('pino')()
const { dbGetOne, dbRun } = require('../db')
const sdkNotify = require('../sdk-notify')

const uuid = (length) => {
  let result = ''
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return result
}
const hosts = process.env.BASE_URL || 'http://localhost:3000'

module.exports = async (req, reply) => {
  // Authorization oauth2 URI
  const { code, state, error } = req.query
  const { serviceName, roomName } = req.params
  const redirectUri = new URL(`/register/${serviceName}`, hosts).href
  const responseType = 'code'
  const scope = 'notify'

  // If callback from notify-bot.line.me
  if (code) {
    const notifyAuth = await dbGetOne('SELECT service, room, access_token FROM notify_auth WHERE state = ?;', [ state ])
    if (!notifyAuth) {
      throw new Error(`Service ${serviceName} and State is not verify.`)
    }

    const notifyService = await dbGetOne('SELECT user_id, client_id, client_secret FROM notify_service WHERE service = ? AND active = true;', [ serviceName ])

    const client = new AuthorizationCode({
      client: { id: notifyService.client_id, secret: notifyService.client_secret },
      auth: { tokenHost: 'https://notify-bot.line.me/' },
      options: { bodyFormat: 'form' }
    })

    const tokenConfig = {
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
      client_id: notifyService.client_id,
      client_secret: notifyService.client_secret
    }

    const accessToken = await client.getToken(tokenConfig)
    logger.info({ msg: accessToken })

    if (accessToken.token.status !== 200) {
      throw new Error(accessToken.token.message)
    }

    await dbRun(`UPDATE notify_auth SET access_token = ? WHERE state = ?;`, [ accessToken.token.access_token, state])
    const { getStatus } = await sdkNotify(accessToken.token.access_token)
    const res = await getStatus()
    if (res.status !== 200) {
      throw new Error('Status is not verify.')
    }
    logger.info({ msg: res })
    logger.info(`Join room *${res.target}* \`${res.message}\` with service *${serviceName}*`)
    return reply.type('text/html').send(`<script>window.self.close();</script>`)
  } else if (error) {
    this.log.error(error)
    return reply.redirect(hosts)
  } else {
    logger.info(`redirectUri: ${redirectUri}`)

    if (!serviceName || !roomName) {
      throw new Error('Service or Room is not verify.')
    }

    const notifyService = await dbGetOne('SELECT user_id, client_id, client_secret FROM notify_service WHERE service = ? AND active = true;', [ serviceName ])
    if (!notifyService) {
      throw new Error(`Service ${serviceName} is not register.`)
    }

    const credentials = {
      client: { id: notifyService.client_id, secret: notifyService.client_secret },
      auth: { tokenHost: 'https://notify-bot.line.me/' },
      options: { bodyFormat: 'form' }
    }
    const client = new AuthorizationCode(credentials)

    const newState = uuid(16)
    logger.info(`${serviceName} in ${roomName} new state is '${newState}'`)

    // INSERT INTO notify_auth (service, room, state, response_type, redirect_uri)
    //   VALUES(?, ?, ?, ?, ?, ?)
    // ON CONFLICT(service) DO UPDATE SET
    //   state = ?;
    await dbRun(`UPDATE notify_auth SET state = ? WHERE user_id = ? AND service = ?;`, [ newState, notifyService.user_id, serviceName ])

    const redirectAuth = client.authorizeURL({
      response_type: responseType,
      redirect_uri: redirectUri,
      scope,
      state: newState
    })

    return reply.redirect(redirectAuth)
  }
}
