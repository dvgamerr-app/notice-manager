import { AuthorizationCode } from 'simple-oauth2'
import { uuid, db } from '../../lib/db-conn'
import { getStatus, setRevoke } from '../../lib/sdk-notify'

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
    const notifyAuth = db.query('SELECT service, room, access_token FROM notify_auth WHERE state = ?1;').get(state)
    if (!notifyAuth) {
      throw new Error(`Service ${serviceName} and State is not verify.`)
    }

    const notifyService = db.query('SELECT user_id, client_id, client_secret FROM notify_service WHERE service = ?1 AND active = true;').get(serviceName)

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

    if (accessToken.token.status !== 200) {
      throw new Error(accessToken.token.message)
    }
    req.log.info(accessToken.message)

    db.query(`UPDATE notify_auth SET access_token = ?1, code = ?2, created = current_timestamp WHERE state = ?3;`).values(accessToken.token.access_token, code, state)
    const res = await getStatus(accessToken.token.access_token)
    if (res.status !== 200) {
      throw new Error('Status is not verify.')
    }
    req.log.info(`Join room *${res.data.target}* \`${res.data.message}\` with service *${serviceName}*`)
    return reply.send({ error: null, message: `Join room ${res.data.target} '${res.data.message}' with service ${serviceName}` })
  } else if (error) {
    return reply.status(500).send({ error })
  } else {
    req.log.info(`redirectUri: ${redirectUri}`)

    if (!serviceName || !roomName) {
      throw new Error('Service or Room is not verify.')
    }

    const notifyService = await db.query('SELECT user_id, client_id, client_secret FROM notify_service WHERE service = ?1 AND active = true;').get(serviceName)
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
    req.log.info(`${serviceName} in ${roomName} new state is '${newState}'`)

    db.query(`
      INSERT INTO notify_auth (user_id, service, room, state, redirect_uri)
        VALUES(?1, ?2, ?3, ?4, ?5)
      ON CONFLICT(service, room) DO
      UPDATE SET
        state = ?4,
        redirect_uri = ?5,
        created = current_timestamp;
    `).values(notifyService.user_id, serviceName, roomName, newState, redirectUri)

    const redirectAuth = client.authorizeURL({
      response_type: responseType,
      redirect_uri: redirectUri,
      scope,
      state: newState
    })

    return reply.redirect(redirectAuth)
  }
}
