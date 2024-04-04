import { AuthorizationCode } from 'simple-oauth2'
import pino from 'pino'
import { uuid, dbGetOne, dbRun } from '../../lib/db-conn'
import { getStatus, setRevoke } from '../../lib/sdk-notify'

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
      await setRevoke(notifyAuth.access_token)
    }

    const accessToken = await client.getToken(tokenConfig)
    logger.info(accessToken.message)

    if (accessToken.token.status !== 200) {
      throw new Error(accessToken.token.message)
    }

    await dbRun(`UPDATE notify_auth SET access_token = ?, code = ? WHERE state = ?;`, [ accessToken.token.access_token, code, state ])
    const res = await getStatus(accessToken.token.access_token)
    if (res.status !== 200) {
      throw new Error('Status is not verify.')
    }
    logger.info(`Join room *${res.data.target}* \`${res.data.message}\` with service *${serviceName}*`)
    return reply.send({ error: null, message: `Join room ${res.data.target} '${res.data.message}' with service ${serviceName}` })
  } else if (error) {
    return reply.status(500).send({ error })
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

    await dbRun(`
      INSERT INTO notify_auth (user_id, service, room, state, redirect_uri)
        VALUES(?, ?, ?, ?, ?)
      ON CONFLICT(service, room) DO
      UPDATE SET
        state = ?,
        redirect_uri = ?;
    `, [
        notifyService.user_id, serviceName, roomName, newState, redirectUri,
        newState, redirectUri ])

    const redirectAuth = client.authorizeURL({
      response_type: responseType,
      redirect_uri: redirectUri,
      scope,
      state: newState
    })

    return reply.redirect(redirectAuth)
  }
}
