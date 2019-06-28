import debuger from '@touno-io/debuger'
import mongo from '../mongodb'
import { setRevoke } from '../api-notify'

const logger = debuger('Notify')

export default async (req, res) => {
  // Authorization oauth2 URI
  const { room, service } = req.params
  const { revoke } = req.body
  await mongo.open()
  const { ServiceOauth } = mongo.get()
  try {
    const token = await ServiceOauth.findOne({ service, room })
    if (!token) throw new Error('Service and room not register.')
    if (revoke !== 'agree') throw new Error('Please confirm revoke parameter')
    await setRevoke(token.accessToken)
    await ServiceOauth.updateOne({ service, room }, { $set: { accessToken: null } })
    res.json({})
  } catch (ex) {
    logger.error(ex)
    res.status(ex.error ? ex.error.status : 500)
    res.json({ error: (ex.error ? ex.error.message : ex.message || ex) })
  } finally {
    res.end()
  }
}
