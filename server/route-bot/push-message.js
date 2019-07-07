import * as sdk from '@line/bot-sdk'
import mongo from '../line-bot'

export default async (req, res) => {
  let { bot, to } = req.params
  
  const { LineOutbound, LineBot } = mongo.get()
  let outbound = null
  try {
    const client = await LineBot.findOne({ botname: bot })
    if (!client) throw new Error('LINE API bot is undefined.')
    outbound = await new LineOutbound({
      botname: bot,
      userTo: to,
      type: /^R/g.test(to) ? 'room' : /^C/g.test(to) ? 'group' : /^U/g.test(to) ? 'user' : 'replyToken',
      sender: req.body || {},
      sended: false,
      error: null,
      created: new Date(),
    }).save()
    if (!req.body.type) throw new Error('LINE API fail formatter.')
    let { accesstoken, secret } = client
    if (!accesstoken || !secret) throw new Error('LINE Channel AccessToken is undefined.')
    
    const line = new sdk.Client({ channelAccessToken: accesstoken, channelSecret: secret })
    await LineOutbound.updateOne({ _id: outbound._id }, { $set: { sended: true } })
    if (!/^[RUC]{1}/g.test(to)) {
      await line.replyMessage(to, req.body)
    } else {
      await line.pushMessage(to, req.body)
    }
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
