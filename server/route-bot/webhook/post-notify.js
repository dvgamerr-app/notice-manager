import mongo from '../../mongodb'
import { sendNotify } from '../../helper'

const objectSwitchCaseSender = async (botname, userTo, sender) => {
  if (sender.app && sender.git_log) {
    // Heroku Message.
    await sendNotify(botname, userTo, ` ... *${sender.app} ${sender.release}*\n${sender.git_log}`)
  } else if (typeof sender.payload === 'string') {
    sender = JSON.parse(sender.payload)
    if (sender.username.toLowerCase() === 'gitlab') {
      const fixedMessageSlack = (msg = '') => {
        return msg.replace(/\u003c/ig, '`').replace(/\u003e/ig, '` ').replace(/http:\/\/.*?\|/ig, '')
      }
      let message = sender.fallback
      if (sender.attachments.length > 0) {
        for (const attach of sender.attachments) message += `\n${attach.text}`
      }
      await sendNotify(`gitlab-${sender.channel || 'notify'}`, 'notification', fixedMessageSlack(message))
    }
  }
}

export default async (req, res) => {
  // Authorization oauth2 URI
  const { botname, userTo } = req.params
  // const { message } = req.body
  let outbound = null
  
  await mongo.open()
  const { LineOutbound } = mongo.get()

  try {
    outbound = await new LineOutbound({
      botname,
      userTo,
      type: 'notify',
      sender: req.body || {},
      sended: false,
      error: null,
      created: new Date(),
    }).save()
    
    await objectSwitchCaseSender(botname, userTo, req.body)
    await LineOutbound.updateOne({ _id: outbound._id }, { $set: { sended: true } })
    res.json({})
  } catch (ex) {
    if (outbound) await LineOutbound.updateOne({ _id: outbound._id }, { $set: { error: ex.message || ex.toString() } })
    res.status(ex.error ? ex.error.status : 500)
    res.json({ error: (ex.error ? ex.error.message : ex.message || ex) })
  } finally {
    res.end()
  }
}
