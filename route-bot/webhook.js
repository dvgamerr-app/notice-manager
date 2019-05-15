const sdk = require('@line/bot-sdk')
const api = require('../line-bot')
const mongo = require('../mongodb')
 
module.exports = async (req, res) => {
  let { bot } = req.params
  let { events } = req.body
  if (!events) return res.end()
  
  let { LineInbound, LineCMD, LineBot } = mongo.get()
  try {
    const client = await LineBot.findOne({ botname: bot })
    if (!client) throw new Error('LINE API bot is undefined.')
    let { onEvents, onCommands } = api[bot] || {}
    let { accesstoken, secret } = client
    
    if (!accesstoken || !secret) throw new Error('LINE Channel AccessToken is undefined.')

    const line = new sdk.Client({ channelAccessToken: accesstoken, channelSecret: secret })
    const lineSenderObj = msg => typeof msg === 'string' ? { type: 'text', text: msg } : typeof msg === 'function' ? msg() : msg
    const linePushId = ({ source }) => source.type === 'room' ? source.roomId : source.type === 'group' ? source.groupId : source.userId
    const lineMessage = async (e, sender) => {
      if (!sender) return

      if (typeof e === 'string') {
        await line.pushMessage(e, lineSenderObj(sender))
      } else if (e.replyToken) {
        await line.replyMessage(e.replyToken, lineSenderObj(sender))
      } else {
        await line.pushMessage(linePushId(e), lineSenderObj(sender))
      }
    }

    if (events.length > 0) {
      for (const e of events) {
        await new LineInbound(e).save()
        if (e.type === 'message' && e.message.type === 'text') {
          let { text } = e.message
          let { groups } = /^\/(?<name>[-_a-zA-Z]+)(?<arg>\W.*|)/ig.exec(text) || {}
          // console.log(!groups, groups.name, !onCommands[groups.name])
          let args = (groups.arg || '').trim().split(' ').filter(e => e !== '')
          let cmd = await new LineCMD({
            botname: bot,
            userId: e.source.userId,
            command: groups.name,
            args: args.length > 0 ? args : null,
            text: text,
            event: e,
            executing: false,
            executed: false,
            updated: null,
            created: new Date(),
          }).save()
          if (!e.replyToken || !groups || !onCommands[groups.name]) continue

          await LineCMD.updateOne({ _id: cmd._id }, { $set: { executing: true } })
          let result = await onCommands[groups.name].call(this, args, e, line)
          await LineCMD.updateOne({ _id: cmd._id }, { $set: { executed: true } })
          await lineMessage(e, result)
        } else if (typeof onEvents[e.type] === 'function') {
          let result = await onEvents[e.type].call(this, e, line)
          await lineMessage(e, result)
        } else if (e.type === 'postback') {
          await new LineCMD({
            botname: bot,
            userId: e.source.userId,
            command: e.type,
            args: null,
            text: e.postback.data,
            event: e,
            executing: false,
            executed: false,
            updated: null,
            created: new Date(),
          }).save()
        } else {
          // other message type not text
          console.log('e: ', e)
        }
      }
    } else {
      console.log('events: ', events)
      await new LineInbound(events).save()
    }
  } catch (ex) {
    console.log(ex.statusCode === 400 ? ex.statusMessage :  ex)
  } finally {
    res.end()
  }
}
