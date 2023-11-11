// const Boom = require('@hapi/boom')
// const logger = require('@touno-io/debuger')('API')
// const { notice } = require('@touno-io/db/schema')
const notice = {}
const sdkClient = require('../sdk-client')
const { onEvents, onCommands } = require('./cmd')
const userCustom = require('./custom')

const _VERIFY_TOKEN = '00000000000000000000000000000000'

const getID = (e) => {
  if (!e || !e.source) {
    throw new Error('getID() :: Event is unknow source.')
  }
  return e.source[`${e.source.type}Id`]
}

const getVariable = async (e) => {
  const { userId } = e.source
  const room = await notice.get('LineBotRoom').findOne({ id: getID(e) })
  if (!room || !room.variable) {
    return null
  }

  for (let i = 0; i < room.variable.length; i++) {
    if (room.variable[i].userId && room.variable[i].userId === userId) {
      return room.variable[i]
    }
  }
}

module.exports = async (req, h) => {
  let delayTime = 0
  const startTime = new Date().getTime()

  try {
    await notice.open()
    const { LineInbound } = notice.get()
    const { bot } = req.params

    const { line, pushMessage } = await sdkClient(bot)

    if (!req.body || !req.body.events.length) {
      return { OK: true }
    }

    const { events } = req.body
    for (const e of events) {
      if (e.replyToken === _VERIFY_TOKEN) {
        continue
      }

      delayTime = new Date().getTime() - new Date(e.timestamp).getTime()

      const state = (await getVariable(e)) || {}
      new LineInbound(Object.assign(e, { botname: bot })).save()

      if (state.data && state.data.bypass) {
        let forceStop = false
        if (
          e.type === 'message' &&
          e.message.type === 'text' &&
          state.userId === e.source.userId
        ) {
          const { text } = e.message
          const txtBot = /บอท|bot/i.exec(text)
          const txtCancel = /ยกเลิก|cancel|ปิด/i.exec(e.message.text)
          if (!txtBot || !txtCancel) {
            forceStop = true
          }
        }
        await userCustom[bot][state.data.index].bypass.call(
          this,
          e,
          pushMessage,
          line,
          forceStop
        )
        continue
      }

      if (e.type === 'message' && e.message.type === 'text') {
        const { text } = e.message
        const { groups } =
          /^\/(?<name>[-_a-zA-Z]+)(?<arg>\W.*|)/gi.exec(text) || {}

        if (groups) {
          const args = groups.arg
            .trim()
            .split(' ')
            .filter(e => e !== '')

          if (!e.replyToken || !groups || !onCommands[groups.name]) {
            continue
          }
          // await LineCMD.updateOne({ _id: cmd._id }, { $set: { executing: true } })
          const result = await onCommands[groups.name].call(
            this,
            bot,
            args,
            e,
            line
          )
          // await LineCMD.updateOne({ _id: cmd._id }, { $set: { executed: true } })
          await pushMessage(e, result)
        } else {
          const txtBot = /บอท|bot/i.exec(text)
          if (!txtBot || !userCustom[bot]) {
            continue
          }

          for (const custom of userCustom[bot]) {
            const cmdCustom = custom.cmd.filter(
              e => text.indexOf(e) > txtBot.index
            )
            if (!cmdCustom.length) {
              continue
            }
            await custom.job.call(this, e, pushMessage, line)
            break
          }
        }
      } else if (typeof onEvents[e.type] === 'function') {
        const result = await onEvents[e.type].call(this, bot, e, line)
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

    console.info(
      `Webhook delay: ${delayTime}ms. and used ${
        new Date().getTime() - startTime
      }ms.`
    )
  } catch (ex) {
    throw ex.message
  }

  return { OK: true, delay: delayTime, used: new Date().getTime() - startTime }
}
