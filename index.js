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
      let { channelAccessToken, channelSecret } = client[bot]
      if (!channelAccessToken || !channelSecret) throw new Error('LINE Channel AccessToken is undefined.')
      
      const line = new sdk.Client({ channelAccessToken, channelSecret })
      await LineOutbound.updateOne({ _id: outbound._id }, { $set: { sended: true } })
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
  
  let { LineInbound } = mongo.get()
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
        await new LineInbound(e).save()
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
      await new LineInbound(events).save()
    }
  } catch (ex) {
    console.log(ex.statusCode === 400 ? ex.statusMessage :  ex)
  } finally {
    res.end()
  }
})

app.get('/', (req, res) => res.end('LINE Messenger Bot Endpoint.'))

// process.env.MONGODB_URI = ``
if (!process.env.MONGODB_URI) throw new Error('Mongo connection uri is undefined.')

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

  mongo.set('LineInbound', 'db-line-inbound', {
    type: String,
    replyToken: String,
    source: Object,
    message: Object,
    joined: Object,
    left: Object,
    postback: Object,
    things: Object,
    beacon: Object,
    timestamp: Number,
    created: Date,
  })

  mongo.set('LineBot', 'db-line-bot', {
    type: String,
    botname: String,
    accesstoken: String,
    secret: String,
    options: Object,
    channel: mongo.Schema.Mixed,
    created: Date,
  })

  const { LineBot } = mongo.get()

  await new LineBot({
    type: 'line',
    botname: 'cmgpos-bot',
    accesstoken: 'e1JsRE7Ol7LhD653EiBtBmSXV3Eq98gC81kbBN72JnKYCKk7isQ0kQYhyuMUkIhIB9ScVp23/qoypZOgKZWc6ydIHveHpqAFJ7GuS8de7s9zdZY3ty7jU5bYsdPl1cCgYqx7BpL5+pmJX6M4RI7/IwdB04t89/1O/w1cDnyilFU=',
    secret: 'b35c00ad80890af2dee37ed87c5f1c3b',
    options: null,
    channel: null,
    created: new Date()
  }).save()
  
  await new LineBot({
    type: 'line',
    botname: 'gamgoum',
    accesstoken: 'Hf5Qw9rlvPJHYwCg9FYlqKgqZUueNhiAa2jW4xNDQy0301hUgM4jvEYLSwakB2Fo7SVFw5aLbNRpjOpvTZ81PyY8J8QdgB6ohXiPTlmbkFcoe3jPVSb8rJ88cQy6ZO7v2GBefnzFfEab9bAlcwnWVgdB04t89/1O/w1cDnyilFU=',
    secret: '97fdc4d77bfa5acf4df784df3a4be67c',
    options: null,
    channel: null,
    created: new Date()
  }).save()
  
  await new LineBot({
    type: 'line',
    botname: 'ris-sd3',
    accesstoken: 'Mv6ULaO86WfeFE3KrueZmazOiwFFwYJiEUYn+RQt6oFc313g8KFSYrx+Z7+odTH3qqvCp5hjl75n9XYtmDg35A4BD/EQIMYoVhMvdtRy0aXUmQ62KMp6KEu8XbChgo9bQ/G4hsnsJCF+4OWH6K1EuwdB04t89/1O/w1cDnyilFU=',
    secret: 'c0e4547f7379cbb385259ac33d89911c',
    options: null,
    channel: null,
    created: new Date()
  }).save()
  
  await new LineBot({
    type: 'line',
    botname: 'ris-sd4',
    accesstoken: '+7zVjodcOcGcTwlGrIiRH4qxtf+Q0ZPM8cAbqNQZ8i62b7WQG3EsiSGsF5utYAxBXn1vcqMLgqgxqyVw91/e963jwT3oKbcz9m+HTpQOG/VVOcpQzo1YAObiFBn0fhjCxHcNQCBCz8v7mG0r2tYHuwdB04t89/1O/w1cDnyilFU=',
    secret: '2563142f120518b1ceefb051edae2086',
    options: null,
    channel: null,
    created: new Date()
  }).save()

  console.log(`LINE-BOT MongoDB Connected.`)

  await app.listen(port)
  console.log(`LINE Messenger Bot Endpoint listening on port ${port}!`)
})
