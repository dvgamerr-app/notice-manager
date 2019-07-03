import mongo from '../line-bot'
import { slackMessage } from '../helper'

export default async (req, res) => {
  const { LineOutbound } = mongo.get()
  const { icon, username, sender, message } = req.body
  const { channel } = req.params
  let outbound = null
  try {
    let data = sender || { message }
    if (icon) data.icon_url = `https://intense-citadel-55702.herokuapp.com/${icon}.png`
    outbound = await new LineOutbound({
      botname: username,
      userTo: channel,
      type: 'slack',
      sender: data,
      sended: false,
      error: null,
      created: new Date(),
    }).save()
    await slackMessage(channel, username, data)
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
