import debuger from '@touno-io/debuger'
import { getChannal } from '../helper'

const logger = debuger('Notify')

export default async (req, res) => {
  // Authorization oauth2 URI
  try {
    let slack = await getChannal()
    res.json({
      slack: slack.map(e => ({
        name: e.name,
        topic: e.topic,
        members: e.members.length
      }))
    })
  } catch (ex) {
    logger.error(ex)
    res.json({ error: ex.message || ex })
  } finally {
    res.end()
  }
}
