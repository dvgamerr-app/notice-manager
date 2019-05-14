const express = require('express')
const querystring = require('querystring')
const bodyParser = require('body-parser')
const sdk = require('@line/bot-sdk')
const request = require('request-promise')
const mongo = require('./mongodb')
const port = process.env.PORT || 4000
const app = express()
 
const client = require('./bot-client')

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
 
// parse application/json
app.use(bodyParser.json())

app.put('/:bot/:to?', async (req, res) => {
  let { bot, to } = req.params
  let { LineOutbound } = mongo.get()
  let outbound = null
  try {
    if (!client[bot]) throw new Error('LINE API bot is undefined.')
    if (client[bot].party !== 'slack') {
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
      console.log(outbound)
      let { channelAccessToken, channelSecret } = client[bot]
      if (!channelAccessToken || !channelSecret) throw new Error('LINE Channel AccessToken is undefined.')
      
      const line = new sdk.Client({ channelAccessToken, channelSecret })
      await LineOutbound.update({ _id: outbound._id }, { set: { sended: true } })
      if (!/^[RUC]{1}/g.test(to)) {
        await line.replyMessage(to, req.body)
      } else {
        await line.pushMessage(to, req.body)
      }
    } else {
      let { hooks } = client[bot]
      if (!hooks) throw new Error('Slack Hooks API is undefined.')
      let result = await request({ url: hooks, method: 'POST', body: req.body, json: true })
      if (result !== 'ok') throw new Error(result)
    }
    res.json({ error: null })
  } catch (ex) {
    res.json({ error: ex.message || ex.toString(), type: req.body.type })
    if (outbound && outbound._id) {
      await LineOutbound.update({ _id: outbound._id }, { set: { error: ex.message || ex.toString() } })
    }
  } finally {
    res.end()
  }
})

app.post('/:bot', async (req, res) => {
  let { bot } = req.params
  let { events } = req.body
  if (!events) return res.end()
  try {
    if (!client[bot]) throw new Error('LINE API bot is undefined.')
    let { onEvents, onCommands, onPostBack, channelAccessToken, channelSecret } = client[bot]
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
        if (e.type === 'message' && e.message.type === 'text') {
          let { text } = e.message
          let { groups } = /^\/(?<name>[-_a-zA-Z]+)(?<arg>\W.*|)/ig.exec(text) || {}
          // console.log(!groups, groups.name, !onCommands[groups.name])
          let args = (groups.arg || '').trim().split(' ')
          let { LineCMD } = mongo.get()
          await new LineCMD({
            botname: bot,
            userId: e.source.userId,
            command: groups.name,
            args: args,
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
          let data = querystring.parse(e.postback.data)
          if (data.func !== undefined) {
            if (!onPostBack[data.func]) continue
            let result = await onPostBack[data.func].call(this, e, data, line)
            await lineMessage(e, result)
          } else {
            console.log(data, e)
          }
        } else {
          console.log('e: ', e)
        }
      }
    } else {
      console.log('events: ', events)
    }
  } catch (ex) {
    console.log(ex.statusCode === 400 ? ex.statusMessage :  ex)
  } finally {
    res.end()
  }
})

app.get('/', (req, res) => res.end('LINE Messenger Bot Endpoint.'))

process.env.MONGODB_URI = `mongodb+srv://dbLINE:CZBwk6XtyIGHleJS@line-bot-obya7.gcp.mongodb.net/LINE-BOT`
mongo.open().then(async () => {
  mongo.set('LineCMD', 'db-line-cmd', {
    botname: String,
    userId: String,
    command: String,
    args: Array,
    text: String,
    event: Object,
    executing: Boolean,
    executed: Boolean,
    updated: Date,
    created: Date,
  })
  mongo.set('LineOutbound', 'db-line-outbound', {
    botname: String,
    userTo: String,
    type: String,
    sender: Object,
    sended: Boolean,
    error: String,
    created: Date,
  })
  console.log(`LINE-BOT MongoDB Connected.`)

  await app.listen(port)
  console.log(`LINE Messenger Bot Endpoint listening on port ${port}!`)
})
