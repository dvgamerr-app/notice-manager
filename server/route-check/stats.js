const { notice } = require('@touno-io/db/schema')
const { getStatus } = require('../api-notify')

module.exports = async (req, res) => {
  // Authorization oauth2 URI
  try {
    await notice.open()
    const { ServiceOauth } = notice.get()

    const tokenItems = await ServiceOauth.find({})
    if (tokenItems.length === 0) { throw new Error('Service LINE-Notice not register.') }
    const result = []
    for (const e of tokenItems) {
      const { body } = await getStatus(e.accessToken)
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

    res.json(result)
  } catch (ex) {
    res.status(500).json({ error: ex.stack || ex.message || ex })
  } finally {
    res.end()
  }
}
