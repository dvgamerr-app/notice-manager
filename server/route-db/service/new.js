const { notice } = require('@touno-io/db/schema')
const { notifyLogs } = require('../../helper')

module.exports = async (req, res) => {
  const data = req.body
  try {
    await notice.open()
    const { ServiceBot } = notice.get() // LineInbound, LineOutbound, LineCMD, ServiceOauth
    if (await ServiceBot.findOne({ service: data.name, active: true })) { throw new Error('name is duplicate.') }
    const found = await ServiceBot.findOne({ service: data.name })
    if (!found) {
      await new ServiceBot({
        name: data.name,
        service: data.name,
        client: data.client_id,
        secret: data.client_secret
      }).save()
    } else {
      await ServiceBot.updateOne({ name: data.name, active: false }, {
        $set: {
          client: data.client_id,
          secret: data.client_secret,
          active: true
        }
      })
    }
    await notifyLogs(`Notify service add *${data.name}*`)
  } catch (ex) {
    res.status(500).json({ error: ex.stack || ex.message || ex })
  } finally {
    res.end()
  }
}
