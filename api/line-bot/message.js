const { notice } = require('@touno-io/db/schema')
const sdkClient = require('../sdk-client')

module.exports = async (req, reply) => {
  if (!req.body || !req.body.type) { return reply.status(400).send({ statusCode: 400, error: 'Bad Request', message: 'Not found type LINE Bot sender format.' }) }

  const startTime = new Date().getTime()
  const { bot } = req.params
  let { to: userTo } = req.params
  const { LineOutbound, LineBotRoom } = await notice.get()

  if (!/^[RUC]{1}/g.test(userTo) && (!/[0-9a-f]*/.test(userTo) || userTo.length !== 32)) {
    const room = await LineBotRoom.findOne({ service: bot, room: userTo })
    if (!room || !room.active) { return reply.status(400).send({ statusCode: 400, error: 'Bad Request', message: ' Bot name or Room name not found.' }) }
    userTo = room.userId
  }

  const type = userTo.startsWith('R') ? 'room' : userTo.startsWith('C') ? 'group' : userTo.startsWith('U') ? 'user' : 'replyToken'
  const outbound = await new LineOutbound({ service: bot, userTo, type, sender: req.body || {}, sended: true }).save()
  reply.header('x-line-outbound-id', outbound._id)

  const { pushMessage } = await sdkClient(bot)

  let delayTime = new Date().getTime()
  try {
    const lineBot = await pushMessage(userTo, req.body)
    delayTime = new Date().getTime() - delayTime
    reply.header('x-line-request-id', lineBot['x-line-request-id'])
  } catch (ex) {
    await LineOutbound.updateOne({ _id: outbound._id }, { $set: { sended: false, error: ex.message || ex.toString() } })
    return reply.status(400).send({ statusCode: 400, error: 'Bad Request', message: 'Incorrect body format, https://developers.line.biz/en/docs/messaging-api/message-types/#text-messages' })
  }

  return { OK: true, delay: delayTime, used: new Date().getTime() - startTime }
}
