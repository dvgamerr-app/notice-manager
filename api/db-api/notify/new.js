const logger = require('pino')()
const { dbGetOne, dbRun } = require('../../db')

module.exports = async (req, reply) => {
  const userId = req.headers['x-user-liff']
  if (!userId) return reply.status(404).send()

  if (!req.body || !req.body.name) return reply.status(400).send({ statusCode: 400, message: `Need payload 'name'.`})
  if (!req.body.client_id) return reply.status(400).send({ statusCode: 400, message: `Need payload 'client_id'.`})
  if (!req.body.client_secret) return reply.status(400).send({ statusCode: 400, message: `Need payload 'client_secret'.`})

  if (await dbGetOne('SELECT service FROM notify_service WHERE service = ? AND active = true;', [ req.body.name ])) {
    return reply.status(500).send({ statusCode: 500, message: 'name is duplicate.'})
  }

  await dbRun(`
  INSERT INTO notify_service (user_id, service, client_id, client_secret)
    VALUES(?, ?, ?, ?)
  ON CONFLICT(service) DO UPDATE SET
    user_id = ?,
    client_id = ?,
    client_secret = ?,
    active = true;

  INSERT INTO notify_auth (user_id, service)VALUES(?, ?);

  `, [
    userId, req.body.name, req.body.client_id, req.body.client_secret,
    userId, req.body.client_id, req.body.client_secret,
    userId, req.body.name
   ])

  logger.info(`Notify service add *${req.body.name}*`)
  return reply.send({ statusCode: 200 })
}
