import { db } from '../../lib/db-conn'

export default async (req, reply) => {
  const userId = req.headers['x-user-liff']
  if (!userId) return reply.status(404).send()

  if (!req.body || !req.body.name) return reply.status(400).send({ code: 400, message: `Need payload 'name'.`})
  if (!req.body.client_id) return reply.status(400).send({ code: 400, message: `Need payload 'client_id'.`})
  if (!req.body.client_secret) return reply.status(400).send({ code: 400, message: `Need payload 'client_secret'.`})

  if (db.query('SELECT service FROM notify_service WHERE service = ?1 AND user_id != ?2 AND active = true;').get(req.body.name, userId)) {
    return reply.status(500).send({ code: 500, message: 'name is duplicate.'})
  }

  db.query(`
    INSERT INTO notify_service (user_id, service, client_id, client_secret)
      VALUES(?1, ?2, ?3, ?4)
    ON CONFLICT(service) DO
    UPDATE SET
      user_id = ?1,
      client_id = ?3,
      client_secret = ?4,
      active = true,
      created = current_timestamp;
  `).values(userId, req.body.name, req.body.client_id, req.body.client_secret)

  req.log.info(`Notify service updated *${req.body.name}*`)
  return reply.send({ code: 200 })
}
