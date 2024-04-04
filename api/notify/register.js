import { AuthorizationCode } from 'simple-oauth2'
import pino from 'pino'
import { uuid, dbGetOne, dbRun } from '../../lib/db-conn'
import sdkNotify from '../../lib/sdk-notify'

const logger = pino()
const hosts = process.env.BASE_URL || 'http://localhost:3000'

export default async (req, reply) => {
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
    if (notifyAuth.access_token) {
      const { setRevoke } = await sdkNotify(notifyAuth.access_token)
      await setRevoke()
    }

    const accessToken = await client.getToken(tokenConfig)
    logger.info({ msg: accessToken })

    if (accessToken.token.status !== 200) {
      throw new Error(accessToken.token.message)
    }

    await dbRun(`UPDATE notify_auth SET access_token = ?, code = ? WHERE state = ?;`, [ accessToken.token.access_token, code, state ])
    const { getStatus } = await sdkNotify(accessToken.token.access_token)
    const res = await getStatus()
    if (res.status !== 200) {
      throw new Error('Status is not verify.')
    }
    logger.info(`Join room *${res.target}* \`${res.message}\` with service *${serviceName}*`)
    return reply.type('text/html').send(`<script>window.self.close();</script><body>Join room ${res.target} '${res.message}' with service ${serviceName}</body>`)
  } else if (error) {
    return reply.type('text/html').send(`<script>window.self.close();</script><body>${error}</body>`)
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

    await dbRun(`UPDATE notify_auth SET state = ?, room = ?, redirect_uri = ? WHERE user_id = ? AND service = ?;`, [ newState, roomName, redirectUri, notifyService.user_id, serviceName ])

    const redirectAuth = client.authorizeURL({
      response_type: responseType,
      redirect_uri: redirectUri,
      scope,
      state: newState
    })

    return reply.redirect(redirectAuth)
  }
}
