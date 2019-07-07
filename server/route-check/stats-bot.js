import debuger from '@touno-io/debuger'
import { lineInitilize } from '../helper/schedule'

const logger = debuger('Notify')

export default async (req, res) => {
  // Authorization oauth2 URI
  try {
    await lineInitilize()
    res.json()
  } catch (ex) {
    logger.error(ex)
    res.json({ error: ex.message || ex })
  } finally {
    res.end()
  }
}
