const express = require('express')
const bodyParser = require('body-parser')
const sdk = require('@line/bot-sdk')
const request = require('request-promise')
// const querystring = require('querystring')

const api = require('./line-bot')
const mongo = require('./mongodb')
const port = process.env.PORT || 4000
const app = express()
 

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
 
// parse application/json
app.use(bodyParser.json())

app.put('/:bot/:to?', async (req, res) => {
  let { bot, to } = req.params
  
  const { LineOutbound, LineBot } = mongo.get()
  let outbound = null
  try {
    const client = await LineBot.findOne({ botname: bot })
    if (!client) throw new Error('LINE API bot is undefined.')
    if (client.type !== 'slack') {
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
    } else {
      if (!client.channel) throw new Error('Slack Hooks API is undefined.')
      let result = await request({ url: client.channel, method: 'POST', body: req.body, json: true })
      if (result !== 'ok') throw new Error(result)
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
})

app.post('/:bot', async (req, res) => {
  let { bot } = req.params
  let { events } = req.body
  if (!events) return res.end()
  
  let { LineInbound, LineCMD } = mongo.get()
  try {
    if (!api[bot]) throw new Error('LINE API bot is undefined.')
    let { onEvents, onCommands, channelAccessToken, channelSecret } = api[bot]
    if (!channelAccessToken || !channelSecret) throw new Error('LINE Channel AccessToken is undefined.')

    const line = new sdk.Client({ channelAccessToken, channelSecret })
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
          if (!e.replyToken || !groups || !onCommands[groups.name]) continue
          
          let result = await onCommands[groups.name].call(this, args, e, line)
          await lineMessage(e, result)
        } else if (typeof onEvents[e.type] === 'function') {
          let result = await onEvents[e.type].call(this, e, line)
          await lineMessage(e, result)
        } else if (e.type === 'postback') {
          // let data = querystring.parse(e.postback.data)
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
})

app.get('/db/inbound', async (req, res) => {
  // let { p } = req.params
  res.json((await mongo.get('LineInbound').find({}, null, { sort: { created: -1 }, skip: 0, limit: 1000 })) || [])
  res.end()
})

app.get('/db/outbound', async (req, res) => {
  // let { p } = req.params
  res.json((await mongo.get('LineOutbound').find({}, null, { sort: { created: -1 }, skip: 0, limit: 1000 })) || [])
  res.end()
})

app.get('/db/cmd/:bot', async (req, res) => {
  let { bot } = req.params
  let opts = { limit: 100 }
  let filter = { executed: false, botname: bot }

  res.json((await mongo.get('LineCMD').find(filter, null, opts)) || [])
  res.end()
})
app.post('/db/cmd/:id', async (req, res) => {
  try {
    await mongo.get('LineCMD').updateOne({ _id: req.params.id }, { $set: Object.assign({ updated: new Date() }, req.body) })
    res.json({ error: null })
  } catch (ex) {
    res.json({ error: ex.stack || ex.message || ex })
  }
  res.end()
})

app.get('/', (req, res) => res.end('LINE Messenger Bot Endpoint.'))

if (!process.env.MONGODB_URI) throw new Error('Mongo connection uri is undefined.')
mongo.open().then(async () => {
  console.log(`LINE-BOT MongoDB Connected.`)

  await app.listen(port)
  console.log(`LINE Messenger Bot Endpoint listening on port ${port}!`)
})
