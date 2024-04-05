import { db } from '../../lib/db-conn'
import sdkNotify from '../../lib/sdk-notify'


export default async (req, reply) => {
  // Authorization oauth2 URI
  const { serviceName, roomName } = req.params
  if (!req.body || req.body.revoke != 'agree') {
    return reply.status(400).send({ code: 400, error: 'Bad request', message: `Please confirm revoke ${roomName} in ${serviceName}?` })
  }

  const notifyAuth = db.query('SELECT access_token FROM notify_auth WHERE service = ?1 AND room = ?2;').get(serviceName, roomName)
  if (!notifyAuth || !notifyAuth.access_token) {
    return reply.send({ error: null })
  }

  const { setRevoke } = await sdkNotify(notifyAuth.access_token)

  await setRevoke()
  db.query(`UPDATE notify_auth SET access_token = NULL WHERE service = ?1 AND room = ?2;`).values(serviceName, roomName)
  req.log.info(`Rovoke room *${roomName}* from *${serviceName}*`)
  return reply.send({ error: null })
}
