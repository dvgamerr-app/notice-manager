import * as sdk from '@line/bot-sdk'
import debuger from '@touno-io/debuger'
import mongo from '../../mongodb'
import { onEvents, onCommands } from '../../line-bot/cmd'

const _VERIFY_TOKEN = '00000000000000000000000000000000'
const logger = debuger('WEBHOOK')

export default async (req, res) => {
  let { bot } = req.params
  let { events } = req.body
  if (!events) return res.end()
  
  let { LineInbound, LineCMD, LineBot } = mongo.get()
  try {
    const client = await LineBot.findOne({ botname: bot })
    if (!client) throw new Error('LINE API bot is undefined.')
    let { accesstoken, secret } = client
    
    if (!accesstoken || !secret) throw new Error('LINE Channel AccessToken is undefined.')

    const line = new sdk.Client({ channelAccessToken: accesstoken, channelSecret: secret })
    const lineSenderObj = msg => typeof msg === 'string' ? { type: 'text', text: msg } : typeof msg === 'function' ? msg() : msg
    const linePushId = ({ source }) => source[`${source.type}Id`]
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
        if (e.replyToken === _VERIFY_TOKEN) continue
        await new LineInbound(Object.assign(e, { botname: bot })).save()
        if (e.type === 'message' && e.message.type === 'text') {
          let { text } = e.message
          let { groups } = /^\/(?<name>[-_a-zA-Z]+)(?<arg>\W.*|)/ig.exec(text) || {}
          let args = groups.arg.trim().split(' ').filter(e => e !== '')
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
          let result = await onCommands[groups.name].call(this, bot, args, e, line)
          await LineCMD.updateOne({ _id: cmd._id }, { $set: { executed: true } })
          await lineMessage(e, result)
        } else if (typeof onEvents[e.type] === 'function') {
          let result = await onEvents[e.type].call(this, bot, e, line)
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
        }
      }
    } else {
      await new LineInbound(Object.assign(events, { botname: bot })).save()
    }
  } catch (ex) {
    logger.error(ex)
    res.sendStatus(404)
  } finally {
    res.end()
  }
}