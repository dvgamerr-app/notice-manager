const { notice } = require('@touno-io/db/schema')
const logger = require('@touno-io/debuger')('API')
const { getStatus } = require('../sdk-notify')

module.exports = async (req, res) => {
  // Authorization oauth2 URI
  try {
    await notice.open()
    const { ServiceOauth } = notice.get()

    const tokenItems = await ServiceOauth.find({ accessToken: { $ne: null } })
    if (tokenItems.length === 0) { throw new Error('Service LINE-Notice not register.') }
    const result = []
    for (const e of tokenItems) {
      const res = await getStatus(e.accessToken)
      result.push({
        online: res.status === 200,
        service: e.service,
        room: e.room,
        type: res.targetType,
        target: res.target
      })
      if (res.status !== 200) {
        await ServiceOauth.updateOne({ _id: e._id }, { $set: { accessToken: null } })
      }
    }
    res.json(result)
  } catch (ex) {
    logger.error(ex)
    res.status(500).json({ error: ex.stack || ex.message || ex })
  } finally {
    res.end()
  }
}
