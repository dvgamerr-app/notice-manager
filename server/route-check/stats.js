import debuger from '@touno-io/debuger'
import { getStatus } from '../api-notify'
import mongo from '../mongodb'

const logger = debuger('Notify')

module.exports = async (req, res) => {
  // Authorization oauth2 URI
  await mongo.open()
  const { ServiceOauth } = mongo.get()
  try {
    const tokenItems = await ServiceOauth.find({})
    if (tokenItems.length === 0) throw new Error(`Service LINE-Notify not register.`)
    let result = []
    for (const e of tokenItems) {
      let { body } = await getStatus(e.accessToken)
      result.push({
        online: body.status === 200,
        service: e.service,
        room: e.room,
        type: body.targetType,
        target: body.target
      })
      if (body.status !== 200) {
        await ServiceOauth.updateOne({ _id: e._id }, { $set: { accessToken: null } })
      }
    }

    res.json({ ok: true, status: result })
  } catch (ex) {
    logger.error(ex)
    res.json({ ok: false, error: ex.message || ex })
  } finally {
    res.end()
  }
}
