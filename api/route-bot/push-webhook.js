const { notice } = require('@touno-io/db/schema')
const { webhookMessage } = require('~/api/helper')

module.exports = async (req) => {
  const { type, webhook } = req.params
  let outbound = null
  try {
    await notice.open()
    const { LineOutbound } = notice.get()

    outbound = await new LineOutbound({
      botname: webhook,
      userTo: type,
      type: 'webhook',
      sender: req.body,
      sended: false,
      error: null,
      created: new Date()
    }).save()
    await webhookMessage(type, webhook, req.body)
    await LineOutbound.updateOne({ _id: outbound._id }, { $set: { sended: true } })
    res.json({ error: null })
  } catch (ex) {
    res.json({ error: ex.message || ex.toString(), type: req.body.type })
    if (outbound && outbound._id) {
      const { LineOutbound } = notice.get()
      await LineOutbound.updateOne({ _id: outbound._id }, { $set: { error: ex.message || ex.toString() } })
    }
  } finally {
    res.end()
  }
}
