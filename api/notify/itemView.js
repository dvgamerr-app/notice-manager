import { db } from '../../lib/db-conn'

export default async (req, reply) => {
  const userId = req.headers['x-user-liff']
  if (!userId) return reply.status(404).send()

  const notify = db.query(`
    SELECT
      s.service, a.room, a.access_token
    FROM notify_service s
    INNER JOIN notify_auth a ON s.service = a.service
    WHERE s.user_id = ?1 AND s.active
  `).all(userId)

  
  return notify.reduce((prv, cur) => {
    if (!prv.some(e => e.service === cur.service)) {
      return [...prv, cur]
    }
    for (let i = 0; i < prv.length; i++) {
      const e = prv[i]
      if (typeof e.room == 'string') {
        prv[i].room = [ { name: e.room, token: e.access_token } ]
        delete prv[i].access_token
      }
      
      if(e.service === cur.service) {
        e.room.push({ name: cur.room, token: cur.access_token })
      }
    }
    return prv
  }, [])
}
