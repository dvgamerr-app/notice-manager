const logger = require('pino')()
const sdkNotify = require('../sdk-notify')
const { dbGetOne, dbRun } = require('../db')

module.exports = async (req, reply) => {
  // Authorization oauth2 URI
  const { serviceName, roomName } = req.params
  if (!req.body || req.body.revoke != 'agree') {
    return reply.status(400).send({ statusCode: 400, error: 'Bad request', message: `Please confirm revoke ${roomName} in ${serviceName}?` })
  }

  const notifyAuth = await dbGetOne('SELECT access_token FROM notify_auth WHERE service = ? AND room = ?;', [ serviceName, roomName ])
  if (!notifyAuth || !notifyAuth.access_token) {
    return reply.send({ error: null })
  }

  const { setRevoke } = await sdkNotify(notifyAuth.access_token)

  await setRevoke()
  await dbRun(`UPDATE notify_auth SET access_token = NULL WHERE service = ? AND room = ?;`, [ serviceName, roomName ])
  logger.info(`Rovoke room *${roomName}* from *${serviceName}*`)
  return reply.send({ error: null })
}
