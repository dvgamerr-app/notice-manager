import mongo from '../line-bot'
import { webhookMessage } from '../helper'

export default async (req, res) => {
  const { LineOutbound } = mongo.get()
  const { webhook } = req.params
  let outbound = null
  try {
    outbound = await new LineOutbound({
      botname: webhook,
      userTo: 'teams',
      type: 'webhook',
      sender: req.body,
      sended: false,
      error: null,
      created: new Date(),
    }).save()
    await webhookMessage('teams', webhook, req.body)
    await LineOutbound.updateOne({ _id: outbound._id }, { $set: { sended: true } })
    res.json({ error: null })
  } catch (ex) {
    res.json({ error: ex.message || ex.toString(), type: req.body.type })
    if (outbound && outbound._id) {
      await LineOutbound.updateOne({ _id: outbound._id }, { $set: { error: ex.message || ex.toString() } })
    }
  } finally {
    res.end()
  }
}
