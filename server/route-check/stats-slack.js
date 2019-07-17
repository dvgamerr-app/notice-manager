import debuger from '@touno-io/debuger'

const logger = debuger('Notify')

export default async (req, res) => {
  // Authorization oauth2 URI
  try {
    res.json(req.headers)
  } catch (ex) {
    logger.error(ex)
    res.json({ error: ex.message || ex })
  } finally {
    res.end()
  }
}
