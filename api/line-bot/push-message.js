const { notice } = require('@touno-io/db/schema')
const logger = require('@touno-io/debuger')('API')
const sdkClient = require('../sdk-client')

module.exports = async req => {
  const startTime = new Date().getTime()
  let { bot: botname, to: roomId } = req.params

  await notice.open()
  const { LineOutbound, LineBotRoom } = notice.get()

  if (!req.payload || !req.payload.type) { throw new Error('LINE API fail formatter.') }
  if (!/^[RUC]{1}/g.test(roomId) && (!/[0-9a-f]*/.test(roomId) || roomId.length !== 32)) {
    const room = await LineBotRoom.findOne({ botname, name: roomId })
    if (!room || !room.active) { throw new Error('Room name is unknow.') }
    roomId = room.id
  }

  const { pushMessage } = await sdkClient(botname)
  const outbound = await new LineOutbound({
    botname,
    userTo: roomId,
    type: roomId.startsWith('R') ? 'room' : roomId.startsWith('C') ? 'group' : roomId.startsWith('U') ? 'user' : 'replyToken',
    sender: req.payload || {},
    sended: false,
    error: null,
    created: new Date()
  }).save()

  try {
    await pushMessage(roomId, req.payload)
    await LineOutbound.updateOne({ _id: outbound._id }, { $set: { sended: true } })
  } catch (ex) {
    req.log('error', ex)
    await notice.get('LineOutbound').updateOne({ _id: outbound._id }, { $set: { error: ex.message || ex.toString() } })
    throw ex
  } finally {
    logger.info(`used ${new Date().getTime() - startTime}ms.`)
  }

  return { OK: true }
}
