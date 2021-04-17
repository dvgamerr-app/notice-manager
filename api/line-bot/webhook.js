const logger = require('@touno-io/debuger')('API')
const { notice } = require('@touno-io/db/schema')
const sdkClient = require('../sdk-client')
const { onEvents, onCommands } = require('./cmd')
const userCustom = require('./custom')

const _VERIFY_TOKEN = '00000000000000000000000000000000'

const getID = (e) => {
  if (!e || !e.source) { throw new Error('getID() :: Event is unknow source.') }
  return e.source[`${e.source.type}Id`]
}

const getVariable = async (e) => {
  const { userId } = e.source
  const room = await notice.get('LineBotRoom').findOne({ id: getID(e) })
  if (!room || !room.variable) { return null }

  for (let i = 0; i < room.variable.length; i++) {
    if (room.variable[i].userId && room.variable[i].userId === userId) {
      return room.variable[i]
    }
  }
}

module.exports = async (req, h) => {
  const startTime = new Date().getTime()

  await notice.open()
  const { LineInbound } = notice.get()
  const { botname } = req.params

  const { line, pushMessage } = await sdkClient(botname)

  if (!req.payload || !req.payload.events.length) { return { OK: true } }

  let delayTime = 0
  const { events } = req.payload

  for (const e of events) {
    if (e.replyToken === _VERIFY_TOKEN) { continue }

    delayTime = new Date().getTime() - new Date(e.timestamp).getTime()

    const state = await getVariable(e) || {}
    new LineInbound(Object.assign(e, { botname })).save()

    if (state.data && state.data.bypass) {
      let forceStop = false
      if (e.type === 'message' && e.message.type === 'text' && state.userId === e.source.userId) {
        const { text } = e.message
        const txtBot = /บอท|bot/i.exec(text)
        const txtCancel = /ยกเลิก|cancel|ปิด/i.exec(e.message.text)
        if (!txtBot || !txtCancel) { forceStop = true }
      }
      await userCustom[botname][state.data.index].bypass.call(this, e, pushMessage, line, forceStop)
      continue
    }

    if (e.type === 'message' && e.message.type === 'text') {
      const { text } = e.message
      const { groups } = /^\/(?<name>[-_a-zA-Z]+)(?<arg>\W.*|)/ig.exec(text) || {}

      if (groups) {
        const args = groups.arg.trim().split(' ').filter(e => e !== '')
        // const cmd = await new LineCMD({
        //   botname: bot,
        //   userId: e.source.userId,
        //   command: groups.name,
        //   args: args.length ? args : null,
        //   text,
        //   event: e,
        //   executing: false,
        //   executed: false,
        //   updated: null,
        //   created: new Date()
        // }).save()

        if (!e.replyToken || !groups || !onCommands[groups.name]) { continue }
        // await LineCMD.updateOne({ _id: cmd._id }, { $set: { executing: true } })
        const result = await onCommands[groups.name].call(this, botname, args, e, line)
        // await LineCMD.updateOne({ _id: cmd._id }, { $set: { executed: true } })
        await pushMessage(e, result)
      } else {
        const txtBot = /บอท|bot/i.exec(text)
        if (!txtBot || !userCustom[botname]) { continue }

        for (const custom of userCustom[botname]) {
          const cmdCustom = custom.cmd.filter(e => text.indexOf(e) > txtBot.index)
          if (!cmdCustom.length) { continue }
          await custom.job.call(this, e, pushMessage, line)
          break
        }
      }
    } else if (typeof onEvents[e.type] === 'function') {
      const result = await onEvents[e.type].call(this, botname, e, line)
      await pushMessage(e, result)
    // } else if (e.type === 'postback') {
    //   await new LineCMD({
    //     botname: bot,
    //     userId: e.source.userId,
    //     command: e.type,
    //     args: null,
    //     text: e.postback.data,
    //     event: e,
    //     executing: false,
    //     executed: false,
    //     updated: null,
    //     created: new Date()
    //   }).save()
    }
  }

  logger.info(`Webhook delay: ${delayTime}ms. and used ${new Date().getTime() - startTime}ms.`)
  return { OK: true }
}
