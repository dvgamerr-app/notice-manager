import mongo from '../mongodb'
import debuger from '@touno-io/debuger'

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

    if (events.length > 0) {
      for (const e of events) {
        await new LineInbound(Object.assign(e, { botname: bot })).save()
        if (e.type === 'message' && e.message.type === 'text') {
          let { text } = e.message
          let { groups } = /^\/(?<name>[-_a-zA-Z]+)(?<arg>\W.*|)/ig.exec(text) || {}
          // console.log(!groups, groups.name, !onCommands[groups.name])
          let args = (groups.arg || '').trim().split(' ').filter(e => e !== '')
          await new LineCMD({
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
