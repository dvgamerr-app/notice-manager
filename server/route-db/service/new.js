import mongo from '../../mongodb'
import { notifyLogs } from '../../helper'

export default async (req, res) => {
  const data = req.body
  const { ServiceBot } = mongo.get() // LineInbound, LineOutbound, LineCMD, ServiceOauth
  try {
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
    res.json({ error: ex.message })
  }
  res.end()
}
