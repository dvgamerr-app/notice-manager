import debuger from '@touno-io/debuger'
import { pushMessage } from '../api-notify'
import mongo from '../mongodb'

const logger = debuger('Notify')

module.exports = async (req, res) => {
  // Authorization oauth2 URI
  const { room, service } = req.params
  const { message } = req.body
  await mongo.open()
  const { ServiceOauth } = mongo.get()
  try {
    const token = await ServiceOauth.findOne({ service, room })
    if (!token) throw new Error('Service and room not register.')
    let { headers, body } = await pushMessage(token.accessToken, message)

    if (body.status !== 200) throw new Error(`Service LINE-Notify ${body.message}.`)
    res.json({ ok: true, remaining: parseInt(headers['x-ratelimit-remaining']) })
  } catch (ex) {
    logger.error(ex)
    res.json({ ok: false, error: ex.message || ex })
  } finally {
    res.end()
  }
}
