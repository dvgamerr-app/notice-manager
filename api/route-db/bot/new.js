const { notice } = require('@touno-io/db/schema')
const logger = require('@touno-io/debuger')('API')
const { loggingLINE } = require('../../logging')

module.exports = async (req, res) => {
  const data = req.body
  try {
    await notice.open()
    const { LineBot } = notice.get() // LineInbound, LineOutbound, LineCMD, ServiceOauth

    if (await LineBot.findOne({ botname: data.name, active: true })) { throw new Error('name is duplicate.') }
    const found = await LineBot.findOne({ botname: data.name })
    if (!found) {
      await new LineBot({
        type: 'line',
        id: data.id,
        name: data.name,
        botname: data.name,
        accesstoken: data.client_id,
        secret: data.client_secret,
        options: { stats: { usage: 0, limited: 0, reply: 0, push: 0, updated: new Date() } }
      }).save()
    } else {
      await LineBot.updateOne({ name: data.name, active: false }, {
        $set: {
          id: data.id,
          accesstoken: data.client_id,
          secret: data.client_secret,
          active: true
        }
      })
    }
    await loggingLINE(`Notify Bot add *${data.name}*`)
  } catch (ex) {
    logger.error(ex)
    res.status(500).json({ error: ex.stack || ex.message || ex })
  } finally {
    res.end()
  }
}
