import { db } from '../../lib/db-conn'

export default async (req, reply) => {
  const userId = req.headers['x-user-liff']
  if (!userId) return reply.status(404).send()

  return db.query(`
    SELECT
      s.service, a.room
    FROM notify_service s
    INNER JOIN notify_auth a ON s.service = a.service
    WHERE s.user_id = ?1 AND s.active
  `).all(userId)
}
