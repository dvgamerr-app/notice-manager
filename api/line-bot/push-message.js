const { notice } = require('@touno-io/db/schema')
const logger = require('@touno-io/debuger')('API')
const sdkClient = require('../sdk-client')

module.exports = async (req) => {
  if (!req.payload || !req.payload.type) { return { OK: false } }

  const startTime = new Date().getTime()
  const { botname } = req.params
  let { to: userTo } = req.params
  let outbound = null
  try {
    await notice.open()
    const { LineOutbound, LineBotRoom } = notice.get()

    if (!/^[RUC]{1}/g.test(userTo) && (!/[0-9a-f]*/.test(userTo) || userTo.length !== 32)) {
      const room = await LineBotRoom.findOne({ botname, name: userTo })
      if (!room || !room.active) { return { OK: false } }
      userTo = room.id
    }

    const { pushMessage } = await sdkClient(botname)
    outbound = await new LineOutbound({
      botname,
      userTo,
      type: userTo.startsWith('R') ? 'room' : userTo.startsWith('C') ? 'group' : userTo.startsWith('U') ? 'user' : 'replyToken',
      sender: req.payload || {},
      sended: false,
      error: null,
      created: new Date()
    }).save()

    await pushMessage(userTo, req.payload)
    await LineOutbound.updateOne({ _id: outbound._id }, { $set: { sended: true } })
    return { OK: true }
  } catch (ex) {
    logger.error(ex)
    if (outbound && outbound._id) { await notice.get('LineOutbound').updateOne({ _id: outbound._id }, { $set: { error: ex.message || ex.toString() } }) }
    return { OK: false }
  } finally {
    logger.info(`BOT:${botname} To:${req.params.to} used ${new Date().getTime() - startTime}ms.`)
  }
}
